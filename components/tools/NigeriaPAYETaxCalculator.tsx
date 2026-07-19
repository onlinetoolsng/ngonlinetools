'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Nigeria Tax Act 2025 (NTA), effective 1 January 2026 ──────────────────
// Progressive PAYE bands applied to annual chargeable income.
// Source-checked against KPMG / EY / PwC summaries of the NTA 2025.
const PAYE_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]

const DEFAULT_PENSION_RATE = 0.08 // employee contribution, Pension Reform Act 2014
const DEFAULT_NHF_RATE = 0.025
const RENT_RELIEF_RATE = 0.2
const RENT_RELIEF_CAP = 500_000
const MINIMUM_WAGE_ANNUAL = 840_000 // ₦70,000/month, National Minimum Wage (Amendment) Act 2024

type Period = 'monthly' | 'annual'

const PRESETS = [
  { label: '₦300k/mo', value: 300_000 },
  { label: '₦500k/mo', value: 500_000 },
  { label: '₦1M/mo', value: 1_000_000 },
]

function calculatePAYE(chargeableIncome: number) {
  let remaining = chargeableIncome
  let lowerBound = 0
  let tax = 0
  const breakdown: { band: string; amount: number; rate: number; tax: number }[] = []

  for (const band of PAYE_BANDS) {
    if (remaining <= 0) break
    const bandSize = band.upTo - lowerBound
    const amountInBand = Math.min(remaining, bandSize)
    const taxForBand = amountInBand * band.rate

    if (amountInBand > 0) {
      breakdown.push({
        band: band.upTo === Infinity
          ? `Above ₦${lowerBound.toLocaleString()}`
          : `₦${lowerBound.toLocaleString()} – ₦${band.upTo.toLocaleString()}`,
        amount: amountInBand,
        rate: band.rate,
        tax: taxForBand,
      })
    }

    tax += taxForBand
    remaining -= amountInBand
    lowerBound = band.upTo
  }

  return { tax, breakdown }
}

function formatNaira(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`
}

export function NigeriaPAYETaxCalculator(_props: { locale: string }) {
  const [period, setPeriod] = useState<Period>('monthly')
  const [salary, setSalary] = useState<string>('500000')
  const [pensionRate, setPensionRate] = useState(DEFAULT_PENSION_RATE)
  const [nhfRate, setNhfRate] = useState(DEFAULT_NHF_RATE)
  const [includeNHF, setIncludeNHF] = useState(false)
  const [annualRent, setAnnualRent] = useState<string>('0')
  const [nhis, setNhis] = useState<string>('0')
  const [lifeInsurance, setLifeInsurance] = useState<string>('0')
  const [mortgageInterest, setMortgageInterest] = useState<string>('0')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const salaryNum = Math.max(0, parseFloat(salary) || 0)
    const grossAnnual = period === 'monthly' ? salaryNum * 12 : salaryNum
    const rentAnnual = Math.max(0, parseFloat(annualRent) || 0)
    const nhisAnnual = Math.max(0, parseFloat(nhis) || 0)
    const lifeInsuranceAnnual = Math.max(0, parseFloat(lifeInsurance) || 0)
    const mortgageInterestAnnual = Math.max(0, parseFloat(mortgageInterest) || 0)

    const pension = grossAnnual * pensionRate
    const nhf = includeNHF ? grossAnnual * nhfRate : 0
    const rentRelief = Math.min(rentAnnual * RENT_RELIEF_RATE, RENT_RELIEF_CAP)
    const otherDeductions = nhisAnnual + lifeInsuranceAnnual + mortgageInterestAnnual

    const chargeableIncome = Math.max(
      0,
      grossAnnual - pension - nhf - rentRelief - otherDeductions
    )
    const { tax: paye, breakdown } = calculatePAYE(chargeableIncome)

    const netAnnual = grossAnnual - pension - nhf - paye
    const effectiveRate = grossAnnual > 0 ? (paye / grossAnnual) * 100 : 0
    const isNearMinimumWage = grossAnnual > 0 && grossAnnual <= MINIMUM_WAGE_ANNUAL * 1.1

    return {
      grossAnnual,
      pension,
      nhf,
      rentRelief,
      otherDeductions,
      chargeableIncome,
      paye,
      netAnnual,
      effectiveRate,
      breakdown,
      isNearMinimumWage,
    }
  }, [salary, period, pensionRate, nhfRate, includeNHF, annualRent, nhis, lifeInsurance, mortgageInterest])

  const displayValue = (annualValue: number) =>
    period === 'monthly' ? annualValue / 12 : annualValue

  const reset = () => {
    setSalary('500000')
    setPeriod('monthly')
    setPensionRate(DEFAULT_PENSION_RATE)
    setNhfRate(DEFAULT_NHF_RATE)
    setIncludeNHF(false)
    setAnnualRent('0')
    setNhis('0')
    setLifeInsurance('0')
    setMortgageInterest('0')
  }

  const copyResult = () => {
    const text = `Gross: ${formatNaira(displayValue(result.grossAnnual))}/${period === 'monthly' ? 'mo' : 'yr'} | PAYE: ${formatNaira(displayValue(result.paye))} | Take-home: ${formatNaira(displayValue(result.netAnnual))}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Period toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setPeriod('monthly')}
          className={`px-4 py-2 text-sm font-medium ${period === 'monthly' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setPeriod('annual')}
          className={`px-4 py-2 text-sm font-medium ${period === 'annual' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
        >
          Annual
        </button>
      </div>

      {/* Salary + presets */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {period === 'monthly' ? 'Monthly' : 'Annual'} Gross Salary (₦)
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(salary)}
          onChange={e => setSalary(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
        {period === 'monthly' && (
          <div className="flex gap-2 mt-2">
            {PRESETS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setSalary(String(p.value))}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pension + NHF */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Pension Contribution (%)
          </label>
          <input
            type="number"
            step="0.1"
            min={0}
            value={(pensionRate * 100).toFixed(1)}
            onChange={e => setPensionRate(Math.max(0, (parseFloat(e.target.value) || 0) / 100))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
          <p className="text-xs text-gray-500 mt-1">Default 8% under the Pension Reform Act 2014.</p>
        </div>

        <div>
          <label className="flex items-center gap-2.5 cursor-pointer mb-1.5">
            <input
              type="checkbox"
              checked={includeNHF}
              onChange={e => setIncludeNHF(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-semibold text-gray-700">Include NHF</span>
          </label>
          <input
            type="number"
            step="0.1"
            min={0}
            disabled={!includeNHF}
            value={(nhfRate * 100).toFixed(1)}
            onChange={e => setNhfRate(Math.max(0, (parseFloat(e.target.value) || 0) / 100))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 disabled:opacity-40 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
          <p className="text-xs text-gray-500 mt-1">Optional for most private-sector employees.</p>
        </div>
      </div>

      {/* Rent relief */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Annual Rent Paid (₦) <span className="text-gray-500 font-normal">— optional</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(annualRent)}
          onChange={e => setAnnualRent(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
        <p className="text-xs text-gray-500 mt-1">
          Rent relief: 20% of rent paid, capped at ₦500,000/year. Keep your tenancy agreement or receipts as proof.
        </p>
      </div>

      {/* Other deductions */}
      <details className="group">
        <summary className="text-sm font-medium text-indigo-700 hover:text-indigo-800 cursor-pointer list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
          Other allowable deductions (NHIS, life insurance, mortgage interest)
        </summary>
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">NHIS Premium (₦/yr)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(nhis)}
              onChange={e => setNhis(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Life Insurance (₦/yr)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(lifeInsurance)}
              onChange={e => setLifeInsurance(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mortgage Interest (₦/yr)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(mortgageInterest)}
              onChange={e => setMortgageInterest(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </details>

      {/* Minimum wage note */}
      {result.isNearMinimumWage && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          At or near the ₦70,000/month national minimum wage: gross annual pay (₦840,000) is
          slightly above the ₦800,000 zero-rate band, but most minimum-wage earners still owe
          little to no PAYE once pension and rent relief are deducted from chargeable income.
        </p>
      )}

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">Gross {period === 'monthly' ? 'Monthly' : 'Annual'}</span>
          <span className="font-semibold text-indigo-900">{formatNaira(displayValue(result.grossAnnual))}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">Pension</span>
          <span className="font-semibold text-indigo-900">− {formatNaira(displayValue(result.pension))}</span>
        </div>
        {result.nhf > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">NHF</span>
            <span className="font-semibold text-indigo-900">− {formatNaira(displayValue(result.nhf))}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">PAYE Tax</span>
          <span className="font-semibold text-indigo-900">− {formatNaira(displayValue(result.paye))}</span>
        </div>
        <div className="flex justify-between border-t border-indigo-200 pt-3">
          <span className="font-bold text-indigo-900">Take-Home Pay</span>
          <div className="text-right">
            <div className="text-2xl font-black text-indigo-900">{formatNaira(displayValue(result.netAnnual))}</div>
            <div className="text-xs text-indigo-500">{result.effectiveRate.toFixed(1)}% effective tax rate</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowBreakdown(v => !v)}
        className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
      >
        {showBreakdown ? '− Hide' : '+ Show'} full band-by-band breakdown
      </button>

      {showBreakdown && (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">Band</th>
                <th className="text-right px-3 py-2">Rate</th>
                <th className="text-right px-3 py-2">Tax</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((b, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-700">{b.band}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{(b.rate * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-right text-gray-900 font-medium">{formatNaira(b.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={copyResult}
          className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy Result'}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors"
        >
          Print
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
        Based on the Nigeria Tax Act 2025, effective 1 January 2026. Pension and NHF are, strictly,
        calculated on Basic + Housing + Transport allowances, not full gross pay — this calculator
        uses gross as a standard approximation. Estimates only, not official tax advice — consult
        the Nigeria Revenue Service or a licensed tax professional with your documentation for an
        exact filing figure.
      </p>
    </div>
  )
}
