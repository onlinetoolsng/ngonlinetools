'use client'

import { useEffect, useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Nigeria Tax Act 2025 (effective 1 Jan 2026) + FIRS directive (28 Oct 2025) ───
// FGN Bonds, FGN Savings Bonds, State Government Bonds: 0% WHT — fully tax-exempt
//   under Section 163(1)(n) of the Nigeria Tax Act 2025.
// Treasury Bills: 10% WHT on interest, effective 28 Oct 2025 (FIRS directive),
//   continuing under the NTA 2025 from 1 Jan 2026. This is a CHANGE — T-bills
//   were effectively tax-free for individual investors before this date.
// Fixed Deposits / Money Market Funds: 10% WHT on interest (unchanged).
//
// Default rates below are CBN/DMO auction figures as of January 2026 and NBS
// inflation as of the most recent release available — these move at every
// auction, so they're shown with a clear "as of" date and can be overridden
// with your own bank/broker quote via the Advanced panel.
const RATES_AS_OF = 'January 2026 (CBN/DMO auctions)'

// Fallback USD/NGN rate if the live fetch fails for any reason (network,
// API downtime, ad-blockers). Approximate mid-market rate, dated — the
// live fetch overrides this whenever it succeeds.
const FALLBACK_USD_NGN_RATE = 1378
const FALLBACK_RATE_DATE = 'as of mid-July 2026'

const DEFAULT_RATES = {
  tbill91: 0.1580,
  tbill182: 0.1650,
  tbill364: 0.1847,
  fgnBond: 0.1750,       // benchmark long-tenor FGN bond, Jan 2026 auction marginal rate
  savingsBond: 0.1550,   // FGN Savings Bond (2-yr retail), representative — verify latest DMO circular
  fixedDeposit: 0.1150,  // average commercial bank 12-month FD — highly negotiable, bank-dependent
  moneyMarketFund: 0.1550, // representative SEC-regulated MMF yield — check your fund manager's factsheet
}
const DEFAULT_INFLATION = 0.159 // NBS, ~15.9% — most recent widely-reported release

const TENORS = [
  { label: '91 Days', days: 91 },
  { label: '182 Days', days: 182 },
  { label: '364 Days (1 Year)', days: 364 },
  { label: '2 Years', days: 730 },
  { label: '5 Years', days: 1825 },
  { label: '10 Years', days: 3650 },
]

type InstrumentKey = 'tbill' | 'fgnBond' | 'savingsBond' | 'fixedDeposit' | 'moneyMarketFund'

const INSTRUMENTS: { key: InstrumentKey; name: string; whtRate: number; typicalDays: number[] }[] = [
  { key: 'tbill', name: 'Treasury Bills', whtRate: 0.10, typicalDays: [91, 182, 364] },
  { key: 'fgnBond', name: 'FGN Bonds', whtRate: 0, typicalDays: [730, 1825, 3650] },
  { key: 'savingsBond', name: 'FGN Savings Bond', whtRate: 0, typicalDays: [730] },
  { key: 'fixedDeposit', name: 'Fixed Deposit', whtRate: 0.10, typicalDays: [91, 182, 364, 730, 1825, 3650] },
  { key: 'moneyMarketFund', name: 'Money Market Fund', whtRate: 0.10, typicalDays: [91, 182, 364, 730, 1825, 3650] },
]

function formatNaira(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`
}

function pickYieldForTenor(key: InstrumentKey, tenorDays: number, rates: typeof DEFAULT_RATES) {
  if (key === 'tbill') {
    if (tenorDays <= 91) return rates.tbill91
    if (tenorDays <= 182) return rates.tbill182
    return rates.tbill364
  }
  if (key === 'fgnBond') return rates.fgnBond
  if (key === 'savingsBond') return rates.savingsBond
  if (key === 'fixedDeposit') return rates.fixedDeposit
  return rates.moneyMarketFund
}

export function InvestmentReturnsCalculator(_props: { locale: string }) {
  const [principal, setPrincipal] = useState<string>('1000000')
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')
  const [usdRate, setUsdRate] = useState<number>(FALLBACK_USD_NGN_RATE)
  const [usdRateIsLive, setUsdRateIsLive] = useState(false)
  const [usdRateUpdated, setUsdRateUpdated] = useState<string | null>(null)
  const [tenorDays, setTenorDays] = useState(364)
  const [inflation, setInflation] = useState(DEFAULT_INFLATION)
  const [rates, setRates] = useState(DEFAULT_RATES)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [copied, setCopied] = useState(false)

  // Live-fetch USD/NGN — this is the one rate in this tool that a public,
  // CORS-enabled, no-key endpoint can actually serve to a browser. CBN/DMO/NBS
  // do not expose anything equivalent, so those stay as dated manual defaults.
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.NGN) {
          setUsdRate(data.rates.NGN)
          setUsdRateIsLive(true)
          setUsdRateUpdated(data.time_last_update_utc || new Date().toUTCString())
        }
      })
      .catch(() => {
        // Live fetch failed (network, API downtime, blocked request) — the
        // dated FALLBACK_USD_NGN_RATE set above stays in place, so the USD
        // toggle keeps working either way.
      })
      .finally(() => clearTimeout(timeout))

    return () => clearTimeout(timeout)
  }, [])

  const results = useMemo(() => {
    const principalNum = Math.max(0, parseFloat(principal) || 0)
    if (!principalNum) return null

    const years = tenorDays / 365

    return INSTRUMENTS.map(inst => {
      const yieldRate = pickYieldForTenor(inst.key, tenorDays, rates)
      const grossInterest = principalNum * yieldRate * years
      const tax = grossInterest * inst.whtRate
      const netInterest = grossInterest - tax
      const maturityValue = principalNum + netInterest
      const netAnnualizedYield = years > 0 ? netInterest / principalNum / years : 0
      const realReturn = (1 + netAnnualizedYield) / (1 + inflation) - 1
      const isTypicalTenor = inst.typicalDays.includes(tenorDays)

      return {
        ...inst,
        yieldRate,
        grossInterest,
        tax,
        netInterest,
        maturityValue,
        netAnnualizedYield,
        realReturn,
        isTypicalTenor,
      }
    }).sort((a, b) => b.realReturn - a.realReturn)
  }, [principal, tenorDays, rates, inflation])

  const displayAmount = (ngn: number) => {
    if (currency === 'USD') return `$${Math.round(ngn / usdRate).toLocaleString('en-US')}`
    return formatNaira(ngn)
  }

  const reset = () => {
    setPrincipal('1000000')
    setTenorDays(364)
    setInflation(DEFAULT_INFLATION)
    setRates(DEFAULT_RATES)
    setCurrency('NGN')
  }

  const copyResult = () => {
    if (!results) return
    const text = results
      .map(r => `${r.name}: ${formatNaira(r.maturityValue)} (real return ${(r.realReturn * 100).toFixed(2)}%)`)
      .join(' | ')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Amount + currency */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-gray-700">Amount to Invest</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setCurrency('NGN')}
              className={`px-2.5 py-1 font-medium ${currency === 'NGN' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              ₦ NGN
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 font-medium ${currency === 'USD' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              $ USD
            </button>
          </div>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(principal)}
          onChange={e => setPrincipal(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="1,000,000"
        />
        <p className="text-xs text-gray-500 mt-1">
          {usdRateIsLive
            ? `Live rate: $1 = ₦${usdRate.toLocaleString('en-US', { maximumFractionDigits: 2 })} (updated ${usdRateUpdated})`
            : `Rate: $1 = ₦${usdRate.toLocaleString('en-US')} (fallback, ${FALLBACK_RATE_DATE} — live rate unavailable, adjust below if needed)`}
        </p>
      </div>

      {/* Tenor */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Investment Period</label>
        <div className="grid grid-cols-3 gap-2">
          {TENORS.map(t => (
            <button
              key={t.days}
              type="button"
              onClick={() => setTenorDays(t.days)}
              className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-medium border transition ${
                tenorDays === t.days
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced: override rates */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
        >
          {showAdvanced ? '− Hide' : '+ Adjust'} rates &amp; inflation ({RATES_AS_OF})
        </button>

        {showAdvanced && (
          <div className="mt-3 grid sm:grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
            {(['tbill91', 'tbill182', 'tbill364', 'fgnBond', 'savingsBond', 'fixedDeposit', 'moneyMarketFund'] as const).map(key => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                  {key.replace(/([A-Z0-9]+)/g, ' $1').trim()} (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={(rates[key] * 100).toFixed(2)}
                  onChange={e =>
                    setRates(prev => ({ ...prev, [key]: (parseFloat(e.target.value) || 0) / 100 }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Inflation Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={(inflation * 100).toFixed(2)}
                onChange={e => setInflation((parseFloat(e.target.value) || 0) / 100)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">USD/NGN Rate (₦ per $1)</label>
              <input
                type="number"
                step="0.01"
                value={usdRate.toFixed(2)}
                onChange={e => {
                  setUsdRate(parseFloat(e.target.value) || FALLBACK_USD_NGN_RATE)
                  setUsdRateIsLive(false)
                }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results table */}
      {results ? (
        <div className="space-y-2">
          {results.map((r, i) => (
            <div
              key={r.key}
              className={`rounded-2xl p-5 border ${i === 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{r.name}</span>
                  {i === 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-indigo-700 text-white px-2 py-0.5 rounded-full">
                      Best Real Return
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-bold ${r.realReturn >= 0 ? 'text-indigo-700' : 'text-red-600'}`}
                >
                  {r.realReturn >= 0 ? '+' : ''}{(r.realReturn * 100).toFixed(2)}% real
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-gray-500">Gross Yield</div>
                  <div className="font-semibold text-gray-900">{(r.yieldRate * 100).toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-gray-500">WHT</div>
                  <div className="font-semibold text-gray-900">
                    {r.whtRate === 0 ? 'Exempt' : `${(r.whtRate * 100).toFixed(0)}%`}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Net Interest</div>
                  <div className="font-semibold text-gray-900">{displayAmount(r.netInterest)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Maturity Value</div>
                  <div className="font-semibold text-gray-900">{displayAmount(r.maturityValue)}</div>
                </div>
              </div>

              {!r.isTypicalTenor && (
                <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-3">
                  This tenor isn't typical for {r.name} — shown for comparison only.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">Enter an amount to compare returns</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={copyResult}
          disabled={!results}
          className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy Comparison'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors"
        >
          Reset
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        For illustration only — not financial advice. Default rates are indicative CBN/DMO auction
        and NBS figures as of {RATES_AS_OF}, and change at every auction — use the "Adjust rates"
        panel above if you have a more current quote from your bank, broker, or fund manager, and
        verify directly with the CBN, DMO, or your fund manager before investing. Treasury Bill
        interest carries 10% withholding tax under FIRS's October 2025 directive and the Nigeria
        Tax Act 2025; FGN Bonds, FGN Savings Bonds, and State Government Bonds remain fully
        tax-exempt. Past performance and current published rates do not guarantee future returns.
      </p>
    </div>
  )
}
