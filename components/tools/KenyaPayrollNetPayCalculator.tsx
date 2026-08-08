'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Kenyan statutory payroll rules — current as of 2026 ───────────────────
// PAYE bands have been in force since 1 July 2023 and were unchanged by the
// Finance Act 2026. NSSF figures are the Year 4 rates effective February
// 2026. SHIF (Social Health Insurance Fund) replaced NHIF. The Affordable
// Housing Levy (AHL) is a separate statutory employee deduction. Each
// boundary below is cross-checked against the cumulative tax the KRA bands
// imply, not just the headline rates.
const TAX_BANDS = [
  { upTo: 24_000, rate: 0.10, base: 0 },
  { upTo: 32_333, rate: 0.25, base: 2_400 },
  { upTo: 500_000, rate: 0.30, base: 4_483.25 },
  { upTo: 800_000, rate: 0.325, base: 144_783.35 },
  { upTo: Infinity, rate: 0.35, base: 242_283.35 },
]

const PERSONAL_RELIEF_MONTHLY = 2_400
const NSSF_TIER1_LIMIT = 9_000
const NSSF_TIER2_LIMIT = 108_000
const NSSF_RATE = 0.06
const SHIF_RATE = 0.0275
const SHIF_MINIMUM = 300
const AHL_RATE = 0.015
const MAX_PENSION_DEDUCTION = 30_000
const MAX_INSURANCE_RELIEF = 5_000

type BandResult = { width: number; rate: number; taxOnSlice: number }

function calculatePaye(taxable: number): { tax: number; breakdown: BandResult[] } {
  if (taxable <= 0) return { tax: 0, breakdown: [] }
  let remaining = taxable
  let lowerBound = 0
  let tax = 0
  const breakdown: BandResult[] = []
  for (const b of TAX_BANDS) {
    if (remaining <= 0) break
    const bandTop = Math.min(taxable, b.upTo)
    const slice = Math.max(0, bandTop - lowerBound)
    if (slice > 0) {
      const sliceTax = slice * b.rate
      tax += sliceTax
      breakdown.push({ width: slice, rate: b.rate, taxOnSlice: sliceTax })
      remaining -= slice
    }
    lowerBound = b.upTo
  }
  return { tax, breakdown }
}

function calculateNSSF(pensionablePay: number) {
  const tier1 = Math.min(pensionablePay, NSSF_TIER1_LIMIT) * NSSF_RATE
  const tier2 = Math.max(0, Math.min(pensionablePay, NSSF_TIER2_LIMIT) - NSSF_TIER1_LIMIT) * NSSF_RATE
  return { tier1, tier2, total: tier1 + tier2 }
}

function formatKES(value: number) {
  if (!Number.isFinite(value)) return 'KES 0'
  return `KES ${Math.max(0, Math.round(value)).toLocaleString('en-US')}`
}

export function KenyaPayrollNetPayCalculator(_props: { locale: string }) {
  const [grossInput, setGrossInput] = useState('80000')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [basicInput, setBasicInput] = useState('')
  const [allowancesInput, setAllowancesInput] = useState('0')
  const [pensionInput, setPensionInput] = useState('0')
  const [insuranceInput, setInsuranceInput] = useState('0')
  const [leaveDaysInput, setLeaveDaysInput] = useState('')
  const [includeEmployerCost, setIncludeEmployerCost] = useState(false)

  const result = useMemo(() => {
    const inputGross = Math.max(0, parseFloat(grossInput) || 0)
    const allowances = Math.max(0, parseFloat(allowancesInput) || 0)
    const gross = inputGross + allowances

    const basic = Math.max(0, parseFloat(basicInput) || 0)
    const pensionablePay = basic > 0 ? basic : gross
    const nssf = calculateNSSF(pensionablePay)

    const shif = gross > 0 ? Math.max(SHIF_MINIMUM, gross * SHIF_RATE) : 0
    const ahl = gross * AHL_RATE
    const pensionDeduction = Math.min(Math.max(0, parseFloat(pensionInput) || 0), MAX_PENSION_DEDUCTION)
    const insuranceRelief = Math.min(Math.max(0, parseFloat(insuranceInput) || 0) * 0.15, MAX_INSURANCE_RELIEF)

    const taxable = Math.max(0, gross - nssf.total - shif - ahl - pensionDeduction)
    const { tax: payeBeforeRelief, breakdown } = calculatePaye(taxable)
    const paye = Math.max(0, payeBeforeRelief - PERSONAL_RELIEF_MONTHLY - insuranceRelief)

    const totalDeductions = nssf.total + shif + ahl + paye
    const netPay = gross - totalDeductions
    const effectiveRate = gross > 0 ? (totalDeductions / gross) * 100 : 0

    const employerNssf = calculateNSSF(pensionablePay).total // employer matches employee NSSF
    const employerAhl = gross * AHL_RATE // employer matches employee AHL
    const employerCost = gross + employerNssf + employerAhl

    const leaveDays = Math.max(0, parseFloat(leaveDaysInput) || 0)
    const leavePayEstimate = leaveDays > 0 ? (gross / 30) * leaveDays : 0

    return {
      gross, nssf, shif, ahl, pensionDeduction, taxable, payeBeforeRelief, paye,
      totalDeductions, netPay, effectiveRate, breakdown, employerCost, leavePayEstimate,
      annualGross: gross * 12, annualNet: netPay * 12, annualPaye: paye * 12, annualNssf: nssf.total * 12,
    }
  }, [grossInput, allowancesInput, basicInput, pensionInput, insuranceInput, leaveDaysInput])

  const copyResult = () => {
    navigator.clipboard.writeText(
      `Gross: ${formatKES(result.gross)} | NSSF: ${formatKES(result.nssf.total)} | SHIF: ${formatKES(result.shif)} | Housing Levy: ${formatKES(result.ahl)} | PAYE: ${formatKES(result.paye)} | Net pay: ${formatKES(result.netPay)}`
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gross monthly salary (KES)</label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(grossInput)}
          onChange={e => setGrossInput(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="100,000"
        />
      </div>

      <div>
        <button type="button" onClick={() => setShowAdvanced(v => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
          {showAdvanced ? 'Hide' : 'Show'} advanced options
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Basic salary (if different, for NSSF)</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(basicInput)} onChange={e => setBasicInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" placeholder="Same as gross" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Other fixed allowances/overtime/bonus</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(allowancesInput)} onChange={e => setAllowancesInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Voluntary pension contribution (up to 30,000)</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(pensionInput)} onChange={e => setPensionInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Insurance premiums paid (15% relief, max 5,000)</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(insuranceInput)} onChange={e => setInsuranceInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Leave days (for leave pay estimate)</label>
                <input type="text" inputMode="decimal" value={leaveDaysInput} onChange={e => setLeaveDaysInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={includeEmployerCost} onChange={e => setIncludeEmployerCost(e.target.checked)} className="accent-indigo-700" />
              Include employer costs (NSSF + Housing Levy match)
            </label>
          </div>
        )}
      </div>

      {/* Payslip-style results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Your Kenya net pay & payslip breakdown</p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">Gross pay</dt><dd className="font-medium text-gray-800">{formatKES(result.gross)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">NSSF (Tier I + Tier II)</dt><dd className="font-medium text-gray-800">{formatKES(result.nssf.total)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">SHIF</dt><dd className="font-medium text-gray-800">{formatKES(result.shif)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Affordable Housing Levy</dt><dd className="font-medium text-gray-800">{formatKES(result.ahl)}</dd></div>
          {result.pensionDeduction > 0 && <div className="flex justify-between"><dt className="text-gray-500">Voluntary pension deduction</dt><dd className="font-medium text-gray-800">{formatKES(result.pensionDeduction)}</dd></div>}
          <div className="flex justify-between"><dt className="text-gray-500">Taxable income</dt><dd className="font-medium text-gray-800">{formatKES(result.taxable)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">PAYE (after KES {PERSONAL_RELIEF_MONTHLY.toLocaleString()} personal relief)</dt><dd className="font-medium text-gray-800">{formatKES(result.paye)}</dd></div>
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Net pay (take-home)</dt>
            <dd className="font-semibold text-indigo-700 text-lg">{formatKES(result.netPay)}</dd>
          </div>
          <div className="flex justify-between"><dt className="text-gray-500">Effective deduction rate</dt><dd className="font-medium text-gray-800">{result.effectiveRate.toFixed(1)}%</dd></div>
        </dl>

        {result.breakdown.length > 0 && (
          <div className="bg-white rounded-xl border border-indigo-100 p-3 text-xs text-gray-600">
            <p className="font-semibold text-gray-700 mb-1.5">PAYE by band (before relief)</p>
            <div className="space-y-1">
              {result.breakdown.map((b, i) => (
                <div key={i} className="flex justify-between">
                  <span>{formatKES(b.width)} at {(b.rate * 100).toFixed(1)}%</span>
                  <span>{formatKES(b.taxOnSlice)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs bg-white rounded-xl border border-indigo-100 p-3">
          <div><span className="text-gray-500">Annual gross</span><br /><span className="font-semibold text-gray-800">{formatKES(result.annualGross)}</span></div>
          <div><span className="text-gray-500">Annual net</span><br /><span className="font-semibold text-gray-800">{formatKES(result.annualNet)}</span></div>
          <div><span className="text-gray-500">Annual PAYE</span><br /><span className="font-semibold text-gray-800">{formatKES(result.annualPaye)}</span></div>
          <div><span className="text-gray-500">Annual NSSF</span><br /><span className="font-semibold text-gray-800">{formatKES(result.annualNssf)}</span></div>
        </div>

        {includeEmployerCost && (
          <div className="bg-white rounded-xl border border-indigo-100 p-3 text-xs text-gray-600 flex justify-between">
            <span>Total employer cost (gross + NSSF match + Housing Levy match)</span>
            <span className="font-semibold text-gray-800">{formatKES(result.employerCost)}</span>
          </div>
        )}

        {result.leavePayEstimate > 0 && (
          <div className="bg-white rounded-xl border border-indigo-100 p-3 text-xs text-gray-600 flex justify-between">
            <span>Estimated leave pay ({leaveDaysInput} days)</span>
            <span className="font-semibold text-gray-800">{formatKES(result.leavePayEstimate)}</span>
          </div>
        )}

        <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy payslip result</button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Good to know</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>PAYE bands have been unchanged since 1 July 2023, including under the Finance Act 2026.</li>
          <li>NSSF Tier I is capped at KES 540/month, Tier II at KES 5,940/month — a combined maximum of KES 6,480, regardless of how high your salary is.</li>
          <li>SHIF (2.75% of gross, minimum KES 300) and the Affordable Housing Levy (1.5% of gross) have no upper cap, unlike NSSF.</li>
          <li>Personal relief of KES 2,400/month is applied automatically after the bands, and PAYE never goes below zero.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          Estimate only, based on current KRA, NSSF, and SHA rates (2026). Your actual payslip may differ due to specific benefits, other reliefs, or employer-specific rules. Confirm with your payroll department or KRA.
        </p>
      </div>
    </div>
  )
}
