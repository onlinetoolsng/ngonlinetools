'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface Props {
  locale: string
}

type Market = 'NGX' | 'US'
type Platform = 'Bamboo' | 'Trove' | 'Risevest' | 'Other'

interface Holding {
  id: string
  market: Market
  ticker: string
  quantity: number
  costBasis: number // per-share, native currency (NGN for NGX, USD for US)
  currentPrice: number | null // native currency; null = no price entered yet
  priceStatus: 'manual' | 'fetched' | 'unavailable'
  platform: Platform
  dateAcquired: string
}

interface Snapshot {
  date: number
  totalValueNGN: number
}

const NGX_TICKERS = [
  'DANGCEM', 'MTNN', 'GTCO', 'ZENITHBANK', 'BUACEMENT', 'AIRTELAFRI', 'BUAFOODS',
  'NB', 'NESTLE', 'SEPLAT', 'STANBIC', 'ACCESSCORP', 'FBNH', 'UBA', 'OANDO',
  'TRANSCORP', 'GEREGU', 'WAPCO', 'FLOURMILL', 'NASCON',
]
const US_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'VOO', 'SPY', 'QQQ', 'VTI']

const STORAGE_KEY_HOLDINGS = 'ngx-us-portfolio-tracker:holdings'
const STORAGE_KEY_SNAPSHOTS = 'ngx-us-portfolio-tracker:snapshots'
const FALLBACK_USD_NGN = 1600

function formatNaira(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
}
function formatUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
}
function formatPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}
function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// Best-effort free quote lookup for US tickers via Stooq's public CSV endpoint.
// No API key required, but this is an unofficial, undocumented endpoint and can be
// blocked by CORS or rate limits in some deployments — always fail gracefully to
// manual entry rather than surfacing an error to the user.
async function fetchUsPrice(ticker: string): Promise<number | null> {
  try {
    const res = await fetch(`https://stooq.com/q/l/?s=${encodeURIComponent(ticker.toLowerCase())}.us&f=sd2t2ohlcv&h&e=csv`)
    if (!res.ok) return null
    const text = await res.text()
    const lines = text.trim().split('\n')
    if (lines.length < 2) return null
    const cols = lines[1].split(',')
    const close = parseFloat(cols[6])
    return Number.isFinite(close) && close > 0 ? close : null
  } catch {
    return null
  }
}
// NGX does not currently have a reliable free, no-key public quote API. Prices for
// NGX holdings are manual-entry only — this function exists so a future data source
// can be wired in without changing the calling code.
async function fetchNgxPrice(_ticker: string): Promise<number | null> {
  return null
}

export default function NigeriaStockPortfolioTracker({ locale }: Props) {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loaded, setLoaded] = useState(false)

  const [usdNgn, setUsdNgn] = useState(FALLBACK_USD_NGN)
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'fallback'>('loading')
  const [refreshing, setRefreshing] = useState(false)

  const [shockPct, setShockPct] = useState(0)
  const [showEducation, setShowEducation] = useState(false)

  // Form state
  const [market, setMarket] = useState<Market>('NGX')
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState<number>(0)
  const [costBasis, setCostBasis] = useState<number>(0)
  const [platform, setPlatform] = useState<Platform>('Bamboo')
  const [dateAcquired, setDateAcquired] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const h = localStorage.getItem(STORAGE_KEY_HOLDINGS)
      const s = localStorage.getItem(STORAGE_KEY_SNAPSHOTS)
      if (h) setHoldings(JSON.parse(h))
      if (s) setSnapshots(JSON.parse(s))
    } catch {
      // ignore corrupted local storage
    }
    setLoaded(true)
  }, [])

  // Persist on change
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY_HOLDINGS, JSON.stringify(holdings))
    } catch {
      // storage full or unavailable — session continues in memory only
    }
  }, [holdings, loaded])
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(snapshots))
    } catch {
      // ignore
    }
  }, [snapshots, loaded])

  // Live USD/NGN rate, no API key required
  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        if (!res.ok) throw new Error('bad response')
        const data = await res.json()
        const ngn = data?.rates?.NGN
        if (!cancelled && typeof ngn === 'number' && ngn > 0) {
          setUsdNgn(ngn)
          setRateStatus('live')
        } else {
          throw new Error('missing NGN rate')
        }
      } catch {
        if (!cancelled) {
          setUsdNgn(FALLBACK_USD_NGN)
          setRateStatus('fallback')
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  function addHolding() {
    if (!ticker.trim() || quantity <= 0 || costBasis <= 0) return
    const newHolding: Holding = {
      id: uid(),
      market,
      ticker: ticker.trim().toUpperCase(),
      quantity,
      costBasis,
      currentPrice: null,
      priceStatus: 'unavailable',
      platform,
      dateAcquired: dateAcquired || new Date().toISOString().slice(0, 10),
    }
    setHoldings((prev) => [...prev, newHolding])
    setTicker('')
    setQuantity(0)
    setCostBasis(0)
    setDateAcquired('')
  }

  function updateHolding(id: string, patch: Partial<Holding>) {
    setHoldings((prev) => prev.map((h) => (h.id === id ? { ...h, ...patch } : h)))
  }
  function removeHolding(id: string) {
    setHoldings((prev) => prev.filter((h) => h.id !== id))
  }

  async function refreshAllPrices() {
    setRefreshing(true)
    const updated = await Promise.all(
      holdings.map(async (h) => {
        if (h.market === 'US') {
          const price = await fetchUsPrice(h.ticker)
          if (price !== null) return { ...h, currentPrice: price, priceStatus: 'fetched' as const }
          return { ...h, priceStatus: 'unavailable' as const }
        }
        const price = await fetchNgxPrice(h.ticker)
        if (price !== null) return { ...h, currentPrice: price, priceStatus: 'fetched' as const }
        return h.currentPrice ? h : { ...h, priceStatus: 'unavailable' as const }
      })
    )
    setHoldings(updated)
    setRefreshing(false)
  }

  function saveSnapshot(totalValueNGN: number) {
    setSnapshots((prev) => [...prev, { date: Date.now(), totalValueNGN }].slice(-50))
  }
  function clearSnapshots() {
    setSnapshots([])
  }

  const computed = useMemo(() => {
    const rows = holdings.map((h) => {
      const shockedPrice = h.currentPrice !== null ? h.currentPrice * (1 + shockPct / 100) : null
      const priceUsed = shockedPrice ?? h.costBasis
      const currentValueNative = h.quantity * priceUsed
      const costValueNative = h.quantity * h.costBasis
      const gainPct = costValueNative > 0 ? ((currentValueNative - costValueNative) / costValueNative) * 100 : 0
      const fx = h.market === 'US' ? usdNgn : 1
      return {
        ...h,
        currentValueNative,
        costValueNative,
        gainPct,
        valueNGN: currentValueNative * fx,
        costNGN: costValueNative * fx,
      }
    })

    const totalValueNGN = rows.reduce((s, r) => s + r.valueNGN, 0)
    const totalCostNGN = rows.reduce((s, r) => s + r.costNGN, 0)
    const totalGainPct = totalCostNGN > 0 ? ((totalValueNGN - totalCostNGN) / totalCostNGN) * 100 : 0

    const byMarket = ['NGX', 'US'].map((m) => ({
      name: m,
      value: rows.filter((r) => r.market === m).reduce((s, r) => s + r.valueNGN, 0),
    })).filter((d) => d.value > 0)

    const platforms = Array.from(new Set(rows.map((r) => r.platform)))
    const byPlatform = platforms.map((p) => ({
      name: p,
      value: rows.filter((r) => r.platform === p).reduce((s, r) => s + r.valueNGN, 0),
    })).filter((d) => d.value > 0)

    return { rows, totalValueNGN, totalCostNGN, totalGainPct, byMarket, byPlatform }
  }, [holdings, usdNgn, shockPct])

  const PIE_COLORS = ['#6366f1', '#a5b4fc', '#059669', '#f59e0b', '#ef4444']

  function exportCsv() {
    const header = 'ticker,market,quantity,costBasis,currentPrice,platform,dateAcquired\n'
    const rows = holdings
      .map((h) => [h.ticker, h.market, h.quantity, h.costBasis, h.currentPrice ?? '', h.platform, h.dateAcquired].join(','))
      .join('\n')
    downloadBlob(header + rows, 'portfolio.csv', 'text/csv')
  }
  function exportJson() {
    downloadBlob(JSON.stringify({ holdings, snapshots }, null, 2), 'portfolio.json', 'application/json')
  }
  function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const tickerSuggestions = market === 'NGX' ? NGX_TICKERS : US_TICKERS

  return (
    <div className="space-y-6">
      {/* Compliance disclaimer — shown on every load */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <p className="font-medium mb-1">Educational tracker — not investment advice</p>
        <p>
          This is a manual, self-input portfolio tracker and simulator for educational use. It does not execute
          trades, hold funds, provide custody, or generate personalized buy/sell recommendations or suitability
          scores. It is not affiliated with Bamboo, Trove, Risevest, or any exchange. Past performance is not
          indicative of future results. Consult a licensed capital market operator or tax professional before
          making investment decisions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add holdings card */}
        <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Add a holding</h2>

          <div className="flex gap-2">
            {(['NGX', 'US'] as Market[]).map((m) => (
              <button
                key={m}
                onClick={() => setMarket(m)}
                className={`px-3 py-1.5 rounded-xl text-sm border ${
                  market === m ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700'
                }`}
              >
                {m === 'NGX' ? 'NGX Stocks' : 'US Stocks (via platform)'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ticker / symbol</label>
            <input
              list="ticker-suggestions"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder={market === 'NGX' ? 'e.g. DANGCEM' : 'e.g. AAPL'}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
            <datalist id="ticker-suggestions">
              {tickerSuggestions.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (fractional OK)</label>
              <input
                type="number"
                step="any"
                min={0}
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avg cost / share ({market === 'NGX' ? '₦' : '$'})
              </label>
              <input
                type="number"
                step="any"
                min={0}
                value={costBasis || ''}
                onChange={(e) => setCostBasis(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              >
                <option>Bamboo</option>
                <option>Trove</option>
                <option>Risevest</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date acquired</label>
              <input
                type="date"
                value={dateAcquired}
                onChange={(e) => setDateAcquired(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            onClick={addHolding}
            className="w-full rounded-xl bg-indigo-600 text-white py-2 text-sm font-medium"
          >
            Add to portfolio
          </button>

          <div>
            <button
              onClick={() => setShowEducation((v) => !v)}
              className="text-sm font-medium text-indigo-600"
            >
              {showEducation ? 'Hide' : 'Show'} fees, taxes & risk notes
            </button>
            {showEducation && (
              <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2 text-xs text-gray-600">
                <p>
                  Platforms like Bamboo, Trove, and Risevest typically charge management or transaction fees in the
                  range of roughly 1–1.5% — check each platform's current fee schedule, as fees change.
                </p>
                <p>
                  Under the Nigeria Tax Act 2025 (effective January 1, 2026), gains from disposing of shares are
                  generally exempt if your total disposal proceeds are ₦150 million or less and chargeable gains
                  are ₦10 million or less within a 12-month period. Above either threshold, gains become taxable.
                  This is general information, not tax advice for your situation.
                </p>
                <p>
                  US-listed stocks held via Nigerian platforms are typically subject to a flat 30% US withholding
                  tax on dividends for non-resident investors, since Nigeria has no tax treaty with the US reducing
                  this rate. Currency risk also applies: your USD holdings' Naira value moves with the exchange
                  rate, independent of the stock's own performance.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard card */}
        <div className="rounded-2xl bg-indigo-50 p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Portfolio dashboard</h2>
            <button
              onClick={refreshAllPrices}
              disabled={refreshing || holdings.length === 0}
              className="text-sm font-medium text-indigo-700 underline disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : 'Refresh prices'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <ResultTile label="Total value" value={formatNaira(computed.totalValueNGN)} />
            <ResultTile
              label="Total gain / loss"
              value={`${formatNaira(computed.totalValueNGN - computed.totalCostNGN)} (${formatPct(computed.totalGainPct)})`}
            />
          </div>

          {computed.byMarket.length > 0 && (
            <div className="flex items-center gap-6">
              <div className="h-32 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={computed.byMarket} dataKey="value" nameKey="name" innerRadius={28} outerRadius={50}>
                      {computed.byMarket.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => formatNaira(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium text-gray-900">Allocation by market</p>
                {computed.byMarket.map((d) => (
                  <p key={d.name}>
                    {d.name}: {((d.value / computed.totalValueNGN) * 100).toFixed(1)}%
                  </p>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What-if price shock (hypothetical, not saved): {shockPct > 0 ? '+' : ''}{shockPct}%
            </label>
            <input
              type="range"
              min={-50}
              max={50}
              value={shockPct}
              onChange={(e) => setShockPct(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {snapshots.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={snapshots.map((s) => ({ ...s, label: new Date(s.date).toLocaleDateString() }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}m`} width={60} />
                  <Tooltip formatter={(v: unknown) => formatNaira(Number(v ?? 0))} />
                  <Legend />
                  <Line type="monotone" dataKey="totalValueNGN" name="Portfolio value" stroke="#6366f1" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-sm">
            <button onClick={() => saveSnapshot(computed.totalValueNGN)} className="text-indigo-700 underline">
              Save snapshot
            </button>
            {snapshots.length > 0 && (
              <button onClick={clearSnapshots} className="text-gray-500 underline">
                Clear snapshots
              </button>
            )}
            <button onClick={exportCsv} className="text-indigo-700 underline">
              Export CSV
            </button>
            <button onClick={exportJson} className="text-indigo-700 underline">
              Export JSON
            </button>
          </div>

          <p className="text-xs text-gray-500">
            USD/NGN reference rate: {usdNgn.toFixed(0)}{' '}
            {rateStatus === 'loading' && '(fetching live rate…)'}
            {rateStatus === 'live' && '(live)'}
            {rateStatus === 'fallback' && '(using default assumptions — live rate unavailable)'}
          </p>
        </div>
      </div>

      {/* Holdings table */}
      <div className="rounded-2xl border border-gray-200 p-5 overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Holdings</h2>
        {holdings.length === 0 ? (
          <p className="text-sm text-gray-500">No holdings yet — add one above to see it here.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-3">Ticker</th>
                <th className="pr-3">Market</th>
                <th className="pr-3">Qty</th>
                <th className="pr-3">Avg cost</th>
                <th className="pr-3">Current price</th>
                <th className="pr-3">Value (₦)</th>
                <th className="pr-3">Gain/Loss</th>
                <th className="pr-3">Platform</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {computed.rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100">
                  <td className="py-2 pr-3 font-medium">{r.ticker}</td>
                  <td className="pr-3">{r.market}</td>
                  <td className="pr-3">{r.quantity}</td>
                  <td className="pr-3">{r.market === 'NGX' ? formatNaira(r.costBasis) : formatUsd(r.costBasis)}</td>
                  <td className="pr-3">
                    <input
                      type="number"
                      step="any"
                      value={r.currentPrice ?? ''}
                      placeholder={r.priceStatus === 'unavailable' ? 'enter manually' : ''}
                      onChange={(e) =>
                        updateHolding(r.id, {
                          currentPrice: e.target.value === '' ? null : Number(e.target.value),
                          priceStatus: 'manual',
                        })
                      }
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="pr-3">{formatNaira(r.valueNGN)}</td>
                  <td className={`pr-3 ${r.gainPct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatPct(r.gainPct)}</td>
                  <td className="pr-3">{r.platform}</td>
                  <td>
                    <button onClick={() => removeHolding(r.id)} className="text-red-500 text-xs underline">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-xs text-gray-400 mt-3">
          NGX prices require manual entry — no reliable free public NGX quote feed is available without a paid
          license, so enter the latest price you see on your brokerage platform or the NGX website. US prices
          attempt a best-effort free lookup on refresh and fall back to manual entry if unavailable. Values shown
          use cost basis as a placeholder until a current price is entered.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 text-xs text-gray-500">
        This tool does not place trades, hold funds, or provide personalized investment advice, suitability
        assessments, or robo-advisory services. Bamboo, Trove, and Risevest are SEC-registered Nigerian platforms
        offering NGX and US market access; check each platform directly for current registration status, fees, and
        terms. For NGX market data and official disclosures, see ngxgroup.com. For SEC rules on capital market
        operators, see sec.gov.ng.
      </div>
    </div>
  )
}

function ResultTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 border border-indigo-100">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}
