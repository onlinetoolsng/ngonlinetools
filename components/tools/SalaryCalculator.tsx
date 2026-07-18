'use client'

import { useMemo, useState } from 'react'

// ─── 2026 Nigeria Tax Act (NTA) PAYE bands ─────────────────────────────────
// Effective 1 January 2026. Progressive bands applied to annual taxable
// income (after pension, NHF and rent relief deductions).
// Source-checked against KPMG / EY summaries of the Nigeria Tax Act 2025.
const PAYE_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]

const PENSION_RATE = 0.08 // employee contribution
const NHF_RATE = 0.025
const RENT_RELIEF_RATE = 0.2
const RENT_RELIEF_CAP = 500_000

function calculatePAYE(taxableIncome: number) {
  let remaining = taxableIncome
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

export function SalaryCalculator(_props: { locale: string }) {
  const [monthlyGross, setMonthlyGross] = useState<string>('500000')
  const [annualRent, setAnnualRent] = useState<string>('0')
  const [includeNHF, setIncludeNHF] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const result = useMemo(() => {
    const grossMonthly = parseFloat(monthlyGross) || 0
    const grossAnnual = grossMonthly * 12
    const rentAnnual = parseFloat(annualRent) || 0

    // Pension and NHF are, strictly, calculated on Basic + Housing +
    // Transport, not full gross. Most employees don't know that split, so
    // this uses full gross as a standard approximation — flagged clearly
    // in the results so nobody mistakes it for a payslip-exact figure.
    const pension = grossAnnual * PENSION_RATE
    const nhf = includeNHF ? grossAnnual * NHF_RATE : 0
    const rentRelief = Math.min(rentAnnual * RENT_RELIEF_RATE, RENT_RELIEF_CAP)

    const taxableIncome = Math.max(0, grossAnnual - pension - nhf - rentRelief)
    const { tax: paye, breakdown } = calculatePAYE(taxableIncome)

    const netAnnual = grossAnnual - pension - nhf - paye
    const netMonthly = netAnnual / 12
    const effectiveRate = grossAnnual > 0 ? (paye / grossAnnual) * 100 : 0

    return {
      grossAnnual,
      grossMonthly,
      pension,
      nhf,
      rentRelief,
      taxableIncome,
      paye,
      payeMonthly: paye / 12,
      netAnnual,
      netMonthly,
      effectiveRate,
      breakdown,
    }
  }, [monthlyGross, annualRent, includeNHF])

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Monthly Gross Salary (₦)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={monthlyGross}
            onChange={e => setMonthlyGross(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="500000"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Annual Rent Paid (₦) <span className="text-gray-400 font-normal">— optional</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={annualRent}
            onChange={e => setAnnualRent(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="0"
          />
          <p className="text-xs text-gray-400 mt-1">
            Used for rent relief: 20% of rent, capped at ₦500,000.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={includeNHF}
          onChange={e => setIncludeNHF(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-600">
          Include NHF (National Housing Fund, 2.5%) — voluntary for most private-sector employees
        </span>
      </label>

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-medium text-indigo-900">Net Monthly Pay</span>
          <span className="text-xs text-indigo-500">{result.effectiveRate.toFixed(1)}% effective tax rate</span>
        </div>
        <div className="text-3xl sm:text-4xl font-black text-indigo-900 mb-4">
          {formatNaira(result.netMonthly)}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Gross Monthly</div>
            <div className="font-semibold text-gray-900">{formatNaira(result.grossMonthly)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">PAYE Tax (monthly)</div>
            <div className="font-semibold text-gray-900">{formatNaira(result.payeMonthly)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Pension (8%)</div>
            <div className="font-semibold text-gray-900">{formatNaira(result.pension / 12)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">NHF (2.5%)</div>
            <div className="font-semibold text-gray-900">{formatNaira(result.nhf / 12)}</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
      >
        {showBreakdown ? 'Hide' : 'Show'} full annual PAYE band breakdown →
      </button>

      {showBreakdown && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Band</th>
                <th className="text-right px-4 py-2 font-medium">Rate</th>
                <th className="text-right px-4 py-2 font-medium">Tax</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((row, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-700">{row.band}</td>
                  <td className="px-4 py-2 text-right text-gray-700">{(row.rate * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">{formatNaira(row.tax)}</td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-4 py-2 font-semibold text-gray-900" colSpan={2}>Total Annual PAYE</td>
                <td className="px-4 py-2 text-right font-bold text-gray-900">{formatNaira(result.paye)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        Pension (Pension Reform Act 2014) is calculated on Basic + Housing + Transport
        allowances, and NHF (National Housing Fund Act) is calculated on Basic salary only —
        both shown here as a percentage of full gross pay as a standard approximation, since
        most employees only know their total gross figure. Check your payslip for the exact
        amounts your employer uses. This calculator is for guidance only and isn't a
        substitute for advice from an accountant or HR professional.
      </p>
    </div>
  )
}
