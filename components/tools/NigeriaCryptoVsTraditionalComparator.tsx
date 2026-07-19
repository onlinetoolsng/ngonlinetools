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

type PresetKey = 'aggressive' | 'balanced' | 'conservative' | 'custom'

const PRESETS: Record<Exclude<PresetKey, 'custom'>, { crypto: number; traditional: number }> = {
  aggressive: { crypto: 80, traditional: 20 },
  balanced: { crypto: 50, traditional: 50 },
  conservative: { crypto: 20, traditional: 80 },
}

// Hardcoded conservative defaults, sourced from public data as of July 2026.
// Update periodically from CBN, NGX, and NBS releases.
const DEFAULT_ASSUMPTIONS = {
  // CBN 364-day Treasury Bill stop rate, July 2026 auction (~17.7%). Source: CBN primary market auction results.
  tbillRate: 17.7,
  // NGX All-Share long-run nominal CAGR incl. dividend reinvestment, wide historical range.
  ngxRate: 22,
  // Lagos/urban real estate proxy: capital growth + rental yield, broad public estimate.
  realEstateRate: 14,
  // NBS headline inflation, year-on-year, June 2026.
  inflationRate: 15.9,
  // Crypto: conservative "diversified basket" USD-denominated expected annual return.
  cryptoBtc: 25,
  cryptoEth: 20,
  cryptoDiversified: 18,
  // Assumed average annual Naira devaluation vs USD used to adjust USD-denominated crypto gains.
  nairaDevaluation: 12,
  // Volatility (rough annualized std-dev proxies for best/worst-case bands)
  volCrypto: 65,
  volNgx: 25,
  volTraditionalOther: 5,
  // Fees
  feeCrypto: 0.75,
  feeTraditional: 1.25,
}

const FALLBACK_USD_NGN = 1600

function formatNaira(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
}

function formatPct(n: number) {
  return `${n.toFixed(1)}%`
}

export default function NigeriaCryptoVsTraditionalComparator({ locale }: Props) {
  // --- Inputs ---
  const [amountInput, setAmountInput] = useState(100000)
  const [amountCurrency, setAmountCurrency] = useState<'NGN' | 'USD'>('NGN')
  const [horizon, setHorizon] = useState<1 | 3 | 5 | 10>(5)
  const [preset, setPreset] = useState<PresetKey>('balanced')
  const [cryptoPct, setCryptoPct] = useState(50)

  const [btcSplit, setBtcSplit] = useState(40)
  const [ethSplit, setEthSplit] = useState(30)
  // diversified = remainder

  const [tbillSplit, setTbillSplit] = useState(40)
  const [ngxSplit, setNgxSplit] = useState(35)
  // real estate = remainder

  const [includeFees, setIncludeFees] = useState(true)
  const [showAssumptions, setShowAssumptions] = useState(false)
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS)

  const [usdNgn, setUsdNgn] = useState(FALLBACK_USD_NGN)
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'fallback'>('loading')

  // --- Live USD/NGN rate, no API key required ---
  useEffect(() => {
    let cancelled = false
    async function fetchRate() {
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
    fetchRate()
    return () => {
      cancelled = true
    }
  }, [])

  function applyPreset(key: PresetKey) {
    setPreset(key)
    if (key !== 'custom') {
      setCryptoPct(PRESETS[key].crypto)
    }
  }

  const traditionalPct = 100 - cryptoPct
  const diversifiedSplit = Math.max(0, 100 - btcSplit - ethSplit)
  const realEstateSplit = Math.max(0, 100 - tbillSplit - ngxSplit)

  const principalNGN = amountCurrency === 'NGN' ? amountInput : amountInput * usdNgn

  const results = useMemo(() => {
    const t = horizon
    const {
      tbillRate,
      ngxRate,
      realEstateRate,
      inflationRate,
      cryptoBtc,
      cryptoEth,
      cryptoDiversified,
      nairaDevaluation,
      volCrypto,
      volNgx,
      volTraditionalOther,
      feeCrypto,
      feeTraditional,
    } = assumptions

    // Weighted crypto USD return, then adjust for Naira devaluation since crypto is USD-denominated
    const cryptoUsdReturnPct =
      (btcSplit / 100) * cryptoBtc + (ethSplit / 100) * cryptoEth + (diversifiedSplit / 100) * cryptoDiversified
    const cryptoNairaReturnPct =
      ((1 + cryptoUsdReturnPct / 100) * (1 + nairaDevaluation / 100) - 1) * 100

    const traditionalReturnPct =
      (tbillSplit / 100) * tbillRate + (ngxSplit / 100) * ngxRate + (realEstateSplit / 100) * realEstateRate

    const cryptoFeeAdj = includeFees ? feeCrypto : 0
    const traditionalFeeAdj = includeFees ? feeTraditional : 0

    const cryptoNetReturn = (cryptoNairaReturnPct - cryptoFeeAdj) / 100
    const traditionalNetReturn = (traditionalReturnPct - traditionalFeeAdj) / 100

    const blendedNetReturn = (cryptoPct / 100) * cryptoNetReturn + (traditionalPct / 100) * traditionalNetReturn
    const blendedVol =
      (cryptoPct / 100) * (volCrypto / 100) +
      (traditionalPct / 100) * ((ngxSplit / 100) * (volNgx / 100) + ((tbillSplit + realEstateSplit) / 100) * (volTraditionalOther / 100))

    const fv = (rate: number) => principalNGN * Math.pow(1 + rate, t)

    const cryptoFv = fv(cryptoNetReturn)
    const traditionalFv = fv(traditionalNetReturn)
    const blendedFv = fv(blendedNetReturn)
    const cashFv = principalNGN // nominal cash held flat

    const inflFactor = Math.pow(1 + inflationRate / 100, t)

    const bestCase = fv(blendedNetReturn + blendedVol)
    const worstCase = fv(Math.max(blendedNetReturn - blendedVol, -0.9))

    // Year-by-year series for the chart
    const series = Array.from({ length: t + 1 }, (_, year) => ({
      year,
      Crypto: Math.round(fv2(principalNGN, cryptoNetReturn, year)),
      Traditional: Math.round(fv2(principalNGN, traditionalNetReturn, year)),
      'Cash (real, inflation-eroded)': Math.round(principalNGN / Math.pow(1 + inflationRate / 100, year)),
    }))

    // Sensitivity: +/-5% on each blended return assumption
    const sensitivity = [-5, 0, 5].map((delta) => ({
      delta,
      cryptoEnding: fv(cryptoNetReturn + delta / 100),
      traditionalEnding: fv(traditionalNetReturn + delta / 100),
    }))

    return {
      cryptoNairaReturnPct,
      traditionalReturnPct,
      cryptoFv,
      traditionalFv,
      blendedFv,
      cashFv,
      cashReal: cashFv / inflFactor,
      cryptoReal: cryptoFv / inflFactor,
      traditionalReal: traditionalFv / inflFactor,
      bestCase,
      worstCase,
      series,
      sensitivity,
    }
  }, [assumptions, horizon, principalNGN, cryptoPct, traditionalPct, btcSplit, ethSplit, diversifiedSplit, tbillSplit, ngxSplit, realEstateSplit, includeFees])

  function fv2(pv: number, rate: number, years: number) {
    return pv * Math.pow(1 + rate, years)
  }

  const allocationPieData = [
    { name: 'Crypto', value: cryptoPct },
    { name: 'Traditional', value: traditionalPct },
  ]
  const PIE_COLORS = ['#6366f1', '#a5b4fc']

  function resetAssumptions() {
    setAssumptions(DEFAULT_ASSUMPTIONS)
  }

  function handleExport() {
    window.print()
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Compliance disclaimer — shown on every load */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <p className="font-medium mb-1">Educational simulator — not investment advice</p>
        <p>
          This is a hypothetical simulator for educational purposes only. It does not constitute financial,
          investment, or tax advice. Past or assumed performance is not indicative of future results. Consult
          licensed professionals. Not affiliated with any exchange or platform. Virtual/crypto assets are
          classified as securities under the Investments and Securities Act (ISA) 2025, and only SEC-registered
          platforms should be used for actual crypto activity in Nigeria.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs card */}
        <div className="rounded-2xl border border-gray-200 p-5 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Your scenario</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial investment</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={amountInput}
                onChange={(e) => setAmountInput(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                value={amountCurrency}
                onChange={(e) => setAmountCurrency(e.target.value as 'NGN' | 'USD')}
                className="rounded-xl border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="NGN">₦ NGN</option>
                <option value="USD">$ USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time horizon</label>
            <div className="flex gap-2">
              {[1, 3, 5, 10].map((y) => (
                <button
                  key={y}
                  onClick={() => setHorizon(y as 1 | 3 | 5 | 10)}
                  className={`px-3 py-1.5 rounded-xl text-sm border ${
                    horizon === y ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700'
                  }`}
                >
                  {y}y
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preset allocation</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyPreset('aggressive')}
                className={`px-3 py-2 rounded-xl text-sm border ${preset === 'aggressive' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700'}`}
              >
                Aggressive Crypto (80/20)
              </button>
              <button
                onClick={() => applyPreset('balanced')}
                className={`px-3 py-2 rounded-xl text-sm border ${preset === 'balanced' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700'}`}
              >
                Balanced (50/50)
              </button>
              <button
                onClick={() => applyPreset('conservative')}
                className={`px-3 py-2 rounded-xl text-sm border ${preset === 'conservative' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700'}`}
              >
                Conservative Traditional (20/80)
              </button>
              <button
                onClick={() => applyPreset('custom')}
                className={`px-3 py-2 rounded-xl text-sm border ${preset === 'custom' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-700'}`}
              >
                Custom
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crypto vs Traditional: {cryptoPct}% / {traditionalPct}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={cryptoPct}
              onChange={(e) => {
                setPreset('custom')
                setCryptoPct(Number(e.target.value))
              }}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Crypto mix</p>
              <label className="block text-xs text-gray-500">BTC {btcSplit}%</label>
              <input type="range" min={0} max={100} value={btcSplit} onChange={(e) => setBtcSplit(Number(e.target.value))} className="w-full" />
              <label className="block text-xs text-gray-500 mt-2">ETH {ethSplit}%</label>
              <input type="range" min={0} max={100} value={ethSplit} onChange={(e) => setEthSplit(Number(e.target.value))} className="w-full" />
              <p className="text-xs text-gray-400 mt-1">Diversified basket: {diversifiedSplit}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Traditional mix</p>
              <label className="block text-xs text-gray-500">T-bills / FD {tbillSplit}%</label>
              <input type="range" min={0} max={100} value={tbillSplit} onChange={(e) => setTbillSplit(Number(e.target.value))} className="w-full" />
              <label className="block text-xs text-gray-500 mt-2">NGX equities {ngxSplit}%</label>
              <input type="range" min={0} max={100} value={ngxSplit} onChange={(e) => setNgxSplit(Number(e.target.value))} className="w-full" />
              <p className="text-xs text-gray-400 mt-1">Real estate proxy: {realEstateSplit}%</p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={includeFees} onChange={(e) => setIncludeFees(e.target.checked)} />
            Include trading / management fees
          </label>

          <div>
            <button
              onClick={() => setShowAssumptions((v) => !v)}
              className="text-sm font-medium text-indigo-600"
            >
              {showAssumptions ? 'Hide' : 'Show'} assumptions panel
            </button>
            {showAssumptions && (
              <div className="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3 text-sm">
                <p className="text-xs text-gray-500">
                  Hypothetical assumptions based on historical/public data — not predictions. Overrides reset on reload.
                </p>
                <AssumptionRow
                  label="T-bill / FD rate"
                  title="CBN 364-day Treasury Bill stop rate, most recent auction"
                  value={assumptions.tbillRate}
                  onChange={(v) => setAssumptions((a) => ({ ...a, tbillRate: v }))}
                />
                <AssumptionRow
                  label="NGX equities CAGR"
                  title="Historical NGX All-Share long-run return, dividends reinvested"
                  value={assumptions.ngxRate}
                  onChange={(v) => setAssumptions((a) => ({ ...a, ngxRate: v }))}
                />
                <AssumptionRow
                  label="Real estate proxy"
                  title="Lagos/urban capital growth plus rental yield estimate"
                  value={assumptions.realEstateRate}
                  onChange={(v) => setAssumptions((a) => ({ ...a, realEstateRate: v }))}
                />
                <AssumptionRow
                  label="Inflation (NBS)"
                  title="NBS headline year-on-year inflation"
                  value={assumptions.inflationRate}
                  onChange={(v) => setAssumptions((a) => ({ ...a, inflationRate: v }))}
                />
                <AssumptionRow
                  label="BTC expected return (USD)"
                  title="High volatility: 0%–100%+ annualized possible. This is a conservative planning default, not a promise."
                  value={assumptions.cryptoBtc}
                  onChange={(v) => setAssumptions((a) => ({ ...a, cryptoBtc: v }))}
                />
                <AssumptionRow
                  label="ETH expected return (USD)"
                  title="High volatility: 0%–100%+ annualized possible. This is a conservative planning default, not a promise."
                  value={assumptions.cryptoEth}
                  onChange={(v) => setAssumptions((a) => ({ ...a, cryptoEth: v }))}
                />
                <AssumptionRow
                  label="Diversified basket return (USD)"
                  title="Blended assumption across a diversified crypto basket"
                  value={assumptions.cryptoDiversified}
                  onChange={(v) => setAssumptions((a) => ({ ...a, cryptoDiversified: v }))}
                />
                <AssumptionRow
                  label="Naira devaluation vs USD"
                  title="Naira volatility: crypto often holds dollar value while the Naira depreciates, so devaluation adds to Naira-terms crypto gains, but the Naira value can also swing sharply either way"
                  value={assumptions.nairaDevaluation}
                  onChange={(v) => setAssumptions((a) => ({ ...a, nairaDevaluation: v }))}
                />
                <button onClick={resetAssumptions} className="text-xs text-indigo-600 underline">
                  Reset to defaults
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            USD/NGN reference rate: {usdNgn.toFixed(0)}{' '}
            {rateStatus === 'loading' && '(fetching live rate…)'}
            {rateStatus === 'live' && '(live)'}
            {rateStatus === 'fallback' && '(using default assumptions — live rate unavailable)'}
          </p>
        </div>

        {/* Results card */}
        <div className="rounded-2xl bg-indigo-50 p-5 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Projected outcome after {horizon} year{horizon > 1 ? 's' : ''}</h2>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <ResultTile label="Crypto portfolio" value={formatNaira(results.cryptoFv)} sub={`real: ${formatNaira(results.cryptoReal)}`} />
            <ResultTile label="Traditional portfolio" value={formatNaira(results.traditionalFv)} sub={`real: ${formatNaira(results.traditionalReal)}`} />
            <ResultTile label="Cash (inflation only)" value={formatNaira(results.cashFv)} sub={`real: ${formatNaira(results.cashReal)}`} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <ResultTile label="Blended portfolio (your mix)" value={formatNaira(results.blendedFv)} />
            <ResultTile label="Best / worst case (blended)" value={`${formatNaira(results.bestCase)} / ${formatNaira(results.worstCase)}`} />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={results.series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottom', offset: -2 }} />
                <YAxis tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}m`} width={70} />
                <Tooltip formatter={(v: number) => formatNaira(v)} />
                <Legend />
                <Line type="monotone" dataKey="Crypto" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Traditional" stroke="#059669" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Cash (real, inflation-eroded)" stroke="#9ca3af" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocationPieData} dataKey="value" nameKey="name" innerRadius={35} outerRadius={60}>
                    {allocationPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-sm text-gray-700">
              <p>Crypto: {formatPct(cryptoPct)} (expected {formatPct(results.cryptoNairaReturnPct)}/yr, Naira-adjusted)</p>
              <p>Traditional: {formatPct(traditionalPct)} (expected {formatPct(results.traditionalReturnPct)}/yr)</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Sensitivity: ±5% return assumption</p>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-gray-500">
                  <th className="pr-2">Return shift</th>
                  <th className="pr-2">Crypto ending value</th>
                  <th>Traditional ending value</th>
                </tr>
              </thead>
              <tbody>
                {results.sensitivity.map((s) => (
                  <tr key={s.delta}>
                    <td className="pr-2">{s.delta > 0 ? `+${s.delta}%` : `${s.delta}%`}</td>
                    <td className="pr-2">{formatNaira(s.cryptoEnding)}</td>
                    <td>{formatNaira(s.traditionalEnding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleExport} className="text-sm font-medium text-indigo-700 underline print:hidden">
            Save / print this result
          </button>

          <p className="text-xs text-gray-400">
            Hypothetical simulation only. Crypto assumptions carry extreme volatility (0%–100%+ annualized swings
            are possible) and Naira devaluation estimates are approximate. Regulatory treatment of virtual assets
            in Nigeria can change under the ISA 2025 and future SEC rules or executive orders — verify current
            rules before acting. This tool does not execute trades or collect funds.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 text-xs text-gray-500">
        For actual crypto or securities activity, use only SEC-registered platforms. See the Securities and
        Exchange Commission (sec.gov.ng) and Central Bank of Nigeria (cbn.gov.ng) for official guidance and risk
        notices, including volatility, Naira devaluation risk, regulatory change, and scam awareness.
      </div>
    </div>
  )
}

function ResultTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-3 border border-indigo-100">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function AssumptionRow({
  label,
  title,
  value,
  onChange,
}: {
  label: string
  title: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2" title={title}>
      <label className="text-gray-700">{label}</label>
      <input
        type="number"
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right"
      />
    </div>
  )
}
