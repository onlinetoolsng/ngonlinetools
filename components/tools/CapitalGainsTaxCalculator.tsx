'use client'

import { useMemo, useState } from 'react'

// ─── Nigeria Tax Act 2025 (effective 1 January 2026) ───────────────────────
// The NTA 2025 repeals the old Capital Gains Tax Act and folds CGT into the
// mainstream tax system:
//   • Individuals: gains are taxed at the same progressive PIT rates as
//     salary/other income (0%–25%), stacked on top of other annual income.
//   • Companies: CGT is aligned with the CIT rate — 30% standard, 0% for
//     "small companies" (turnover ≤ ₦100,000,000 AND fixed assets ≤
//     ₦250,000,000), which are exempt from CIT, CGT and the Development Levy.
//   • Shares in Nigerian companies: exempt if aggregate disposal proceeds in
//     any rolling 12-month period are below ₦150,000,000 AND the aggregate
//     chargeable gain in that period does not exceed ₦10,000,000 (raised
//     from the old ₦100m/₦10m FA2021 threshold).
//   • Reinvestment relief: proceeds reinvested in the same year of
//     assessment into shares of a Nigerian company are exempt in proportion
//     to the amount reinvested.
//   • Principal Private Residence (PPR): gain on an individual's main
//     dwelling house (+ up to 1 acre of adjoining land) is exempt.
// Source-checked against PwC, EY and Mondaq summaries of the Nigeria Tax
// Act 2025 (June 2026). Rules are still settling — always confirm current
// thresholds with FIRS/NRS before filing.
const PIT_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]

const SMALL_COMPANY_TURNOVER_CAP = 100_000_000
const SMALL_COMPANY_ASSET_CAP = 250_000_000
const CIT_RATE = 0.3

const SHARE_EXEMPT_PROCEEDS_CAP = 150_000_000
const SHARE_EXEMPT_GAIN_CAP = 10_000_000

type TaxpayerType = 'individual' | 'company'
type AssetType = 'shares' | 'property' | 'other'

function formatNaira(value: number) {
  return `₦${Math.round(Math.max(0, value)).toLocaleString('en-NG')}`
}

function num(value: string) {
  const n = parseFloat(value)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Cumulative PIT due on a given annual income, walking the progressive bands. */
function cumulativePIT(income: number) {
  let remaining = Math.max(0, income)
  let lowerBound = 0
  let tax = 0
  for (const band of PIT_BANDS) {
    if (remaining <= 0) break
    const bandSize = band.upTo - lowerBound
    const amountInBand = Math.min(remaining, bandSize)
    tax += amountInBand * band.rate
    remaining -= amountInBand
    lowerBound = band.upTo
  }
  return tax
}

export function CapitalGainsTaxCalculator(_props: { locale: string }) {
  const [taxpayerType, setTaxpayerType] = useState<TaxpayerType>('individual')
  const [assetType, setAssetType] = useState<AssetType>('shares')
  const [copied, setCopied] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Core figures
  const [proceeds, setProceeds] = useState('')
  const [acquisitionCost, setAcquisitionCost] = useState('')

  // Advanced / incidental costs
  const [acquisitionIncidental, setAcquisitionIncidental] = useState('')
  const [improvements, setImprovements] = useState('')
  const [disposalIncidental, setDisposalIncidental] = useState('')

  // Shares-specific
  const [priorProceeds12m, setPriorProceeds12m] = useState('')
  const [priorGains12m, setPriorGains12m] = useState('')
  const [reinvested, setReinvested] = useState('')

  // Property-specific
  const [isPPR, setIsPPR] = useState(false)

  // Individual-specific
  const [otherIncome, setOtherIncome] = useState('')

  // Company-specific
  const [turnover, setTurnover] = useState('')
  const [fixedAssets, setFixedAssets] = useState('')

  const result = useMemo(() => {
    const proceedsNum = num(proceeds)
    if (!proceedsNum) return null

    const costBase = num(acquisitionCost) + num(acquisitionIncidental) + num(improvements)
    const netProceeds = Math.max(0, proceedsNum - num(disposalIncidental))
    const grossGain = Math.max(0, netProceeds - costBase)

    let taxableGain = grossGain
    let exemptionNote: string | null = null
    let isFullyExempt = false

    if (assetType === 'shares') {
      const aggProceeds = proceedsNum + num(priorProceeds12m)
      const aggGain = grossGain + num(priorGains12m)

      if (aggProceeds < SHARE_EXEMPT_PROCEEDS_CAP && aggGain <= SHARE_EXEMPT_GAIN_CAP) {
        taxableGain = 0
        isFullyExempt = true
        exemptionNote = `Exempt — your 12-month aggregate proceeds (${formatNaira(aggProceeds)}) are under ₦150,000,000 and aggregate gains (${formatNaira(aggGain)}) are at or under ₦10,000,000.`
      } else {
        const reinvestedNum = Math.min(num(reinvested), netProceeds)
        const reinvestedProportion = netProceeds > 0 ? reinvestedNum / netProceeds : 0
        const reliefAmount = grossGain * reinvestedProportion
        taxableGain = Math.max(0, grossGain - reliefAmount)
        if (reinvestedNum > 0) {
          exemptionNote = `Reinvestment relief applied to ${(reinvestedProportion * 100).toFixed(1)}% of the gain (${formatNaira(reliefAmount)}) for proceeds reinvested in Nigerian company shares this year.`
        } else {
          exemptionNote = `Taxable — 12-month aggregate proceeds or gains exceed the ₦150,000,000 / ₦10,000,000 exemption thresholds.`
        }
      }
    } else if (assetType === 'property') {
      if (isPPR) {
        taxableGain = 0
        isFullyExempt = true
        exemptionNote = 'Exempt — gain on a Principal Private Residence (main dwelling house plus up to 1 acre of adjoining land).'
      } else {
        exemptionNote = 'Taxable — no Principal Private Residence relief applies (investment/rental or non-primary property).'
      }
    } else {
      exemptionNote = 'No specific statutory relief modelled for this asset category — taxed on the full chargeable gain.'
    }

    // ── Company path ──
    if (taxpayerType === 'company') {
      const turnoverNum = num(turnover)
      const assetsNum = num(fixedAssets)
      const isSmallCompany =
        turnoverNum > 0 && turnoverNum <= SMALL_COMPANY_TURNOVER_CAP && assetsNum <= SMALL_COMPANY_ASSET_CAP

      if (isSmallCompany) {
        return {
          grossGain,
          taxableGain,
          isFullyExempt: true,
          exemptionNote: `Exempt — small company (turnover ≤ ₦100,000,000 and fixed assets ≤ ₦250,000,000) is exempt from CGT under the Nigeria Tax Act 2025.`,
          tax: 0,
          rateLabel: '0% (small company)',
          breakdown: [] as { band: string; amount: number; rate: number; tax: number }[],
        }
      }

      const tax = taxableGain * CIT_RATE
      return {
        grossGain,
        taxableGain,
        isFullyExempt,
        exemptionNote,
        tax,
        rateLabel: '30% (standard CIT-aligned rate)',
        breakdown: [],
      }
    }

    // ── Individual path: gain stacks on top of other income, taxed at the
    //    marginal PIT bands it falls into (not the average rate). ──
    const otherIncomeNum = num(otherIncome)
    const taxOnOtherIncome = cumulativePIT(otherIncomeNum)
    const taxOnTotal = cumulativePIT(otherIncomeNum + taxableGain)
    const tax = Math.max(0, taxOnTotal - taxOnOtherIncome)

    // Build a per-band breakdown of just the gain portion for display.
    const breakdown: { band: string; amount: number; rate: number; tax: number }[] = []
    let lower = 0
    let remainingGain = taxableGain
    let cursor = otherIncomeNum
    for (const band of PIT_BANDS) {
      if (remainingGain <= 0) break
      if (cursor >= band.upTo) {
        lower = band.upTo
        continue
      }
      const roomInBand = band.upTo - Math.max(cursor, lower)
      const amountInBand = Math.min(remainingGain, roomInBand)
      if (amountInBand > 0) {
        breakdown.push({
          band: band.upTo === Infinity
            ? `Above ₦${Math.max(cursor, lower).toLocaleString()}`
            : `₦${Math.max(cursor, lower).toLocaleString()} – ₦${band.upTo.toLocaleString()}`,
          amount: amountInBand,
          rate: band.rate,
          tax: amountInBand * band.rate,
        })
      }
      remainingGain -= amountInBand
      cursor += amountInBand
      lower = band.upTo
    }

    return {
      grossGain,
      taxableGain,
      isFullyExempt,
      exemptionNote,
      tax,
      rateLabel: taxableGain > 0 ? `${((tax / taxableGain) * 100).toFixed(1)}% effective (progressive)` : '0%',
      breakdown,
    }
  }, [
    proceeds, acquisitionCost, acquisitionIncidental, improvements, disposalIncidental,
    assetType, priorProceeds12m, priorGains12m, reinvested, isPPR,
    taxpayerType, otherIncome, turnover, fixedAssets,
  ])

  const reset = () => {
    setProceeds('')
    setAcquisitionCost('')
    setAcquisitionIncidental('')
    setImprovements('')
    setDisposalIncidental('')
    setPriorProceeds12m('')
    setPriorGains12m('')
    setReinvested('')
    setIsPPR(false)
    setOtherIncome('')
    setTurnover('')
    setFixedAssets('')
    setShowAdvanced(false)
  }

  const copyResult = () => {
    if (!result) return
    const text = `Chargeable gain: ${formatNaira(result.grossGain)} | Taxable gain: ${formatNaira(result.taxableGain)} | Tax due: ${formatNaira(result.tax)} (${result.rateLabel})`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Taxpayer type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Taxpayer Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(['individual', 'company'] as TaxpayerType[]).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setTaxpayerType(value)}
              className={`py-2.5 px-2 rounded-xl text-sm font-medium border transition ${
                taxpayerType === value
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {value === 'individual' ? 'Individual' : 'Company'}
            </button>
          ))}
        </div>
      </div>

      {/* Asset type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Asset Type</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'shares', label: 'Shares' },
            { value: 'property', label: 'Property' },
            { value: 'other', label: 'Other' },
          ] as { value: AssetType; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setAssetType(value)}
              className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-medium border transition ${
                assetType === value
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Core inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Disposal Proceeds (₦)</label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={proceeds}
            onChange={e => setProceeds(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Acquisition Cost (₦)</label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={acquisitionCost}
            onChange={e => setAcquisitionCost(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
      >
        {showAdvanced ? '− Hide advanced costs' : '+ Add incidental costs & improvements'}
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Acquisition costs (legal, stamp duty)</label>
            <input
              type="number" inputMode="decimal" min={0}
              value={acquisitionIncidental}
              onChange={e => setAcquisitionIncidental(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Capital improvements</label>
            <input
              type="number" inputMode="decimal" min={0}
              value={improvements}
              onChange={e => setImprovements(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Disposal costs (agent, valuation)</label>
            <input
              type="number" inputMode="decimal" min={0}
              value={disposalIncidental}
              onChange={e => setDisposalIncidental(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {/* Shares-specific */}
      {assetType === 'shares' && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 space-y-3">
          <p className="text-xs text-amber-800">
            Small-investor exemption checks your <strong>12-month aggregate</strong> — enter any earlier disposals in the same rolling 12-month window.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prior proceeds (12 months)</label>
              <input
                type="number" inputMode="decimal" min={0}
                value={priorProceeds12m}
                onChange={e => setPriorProceeds12m(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prior gains (12 months)</label>
              <input
                type="number" inputMode="decimal" min={0}
                value={priorGains12m}
                onChange={e => setPriorGains12m(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reinvested this year</label>
              <input
                type="number" inputMode="decimal" min={0}
                value={reinvested}
                onChange={e => setReinvested(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Property-specific */}
      {assetType === 'property' && (
        <label className="flex items-start gap-3 bg-amber-50 rounded-2xl p-4 border border-amber-100 cursor-pointer">
          <input
            type="checkbox"
            checked={isPPR}
            onChange={e => setIsPPR(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-amber-900">
            This was my <strong>Principal Private Residence</strong> — my main dwelling house (plus up to 1 acre of adjoining land). PPR relief generally applies once per taxpayer for their primary home.
          </span>
        </label>
      )}

      {/* Taxpayer-specific */}
      {taxpayerType === 'individual' ? (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Other annual income (excluding this gain)
          </label>
          <input
            type="number" inputMode="decimal" min={0}
            value={otherIncome}
            onChange={e => setOtherIncome(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="0.00"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Your gain is added on top of this and taxed at the marginal PIT band(s) it falls into.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Annual turnover (₦)</label>
            <input
              type="number" inputMode="decimal" min={0}
              value={turnover}
              onChange={e => setTurnover(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total fixed assets (₦)</label>
            <input
              type="number" inputMode="decimal" min={0}
              value={fixedAssets}
              onChange={e => setFixedAssets(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="0.00"
            />
          </div>
          <p className="sm:col-span-2 text-xs text-gray-500 -mt-1">
            Used to check the small-company exemption (turnover ≤ ₦100,000,000 and fixed assets ≤ ₦250,000,000).
          </p>
        </div>
      )}

      {/* Results */}
      {result ? (
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">Chargeable Gain</span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.grossGain)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">Taxable Gain</span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.taxableGain)}</span>
          </div>

          {result.exemptionNote && (
            <p className={`text-xs rounded-lg px-3 py-2 ${result.isFullyExempt ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
              {result.isFullyExempt ? '✓ ' : 'ℹ '}{result.exemptionNote}
            </p>
          )}

          {result.breakdown.length > 0 && (
            <div className="border-t border-indigo-200 pt-3 space-y-1.5">
              {result.breakdown.map((b, i) => (
                <div key={i} className="flex justify-between text-xs text-indigo-800">
                  <span>{b.band} @ {(b.rate * 100).toFixed(0)}%</span>
                  <span>{formatNaira(b.tax)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between border-t border-indigo-200 pt-3">
            <span className="font-bold text-indigo-900">Estimated Tax Due</span>
            <span className="text-2xl font-black text-indigo-900">{formatNaira(result.tax)}</span>
          </div>
          <p className="text-xs text-indigo-700">Rate applied: {result.rateLabel}</p>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">Enter disposal proceeds to estimate your capital gains tax</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={copyResult}
          disabled={!result}
          className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy Result'}
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
        This is an educational estimator based on Nigeria Tax Act 2025 rules effective 1 January 2026.
        It does not model every relief (e.g. loss carry-forward, rollover relief on replaced business
        assets, or indirect offshore transfers) and isn't a substitute for professional advice. Consult
        a tax professional or the Nigeria Revenue Service (NRS/FIRS) before filing, and keep your
        contracts, valuations and receipts as supporting records.
      </p>
    </div>
  )
}
