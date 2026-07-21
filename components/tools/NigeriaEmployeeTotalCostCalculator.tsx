'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Statutory employer-side costs on top of gross salary in Nigeria ───────
// Pension Reform Act 2014 (PenCom): minimum 10% employer contribution on
//   "monthly emolument" (Basic + Housing + Transport), rising to 20% if the
//   employer elects to bear the entire 18% minimum alone.
// Employees' Compensation Act 2010 (NSITF): 1% of total monthly payroll,
//   employer-only, no employee deduction.
// Industrial Training Fund (Amendment) Act 2011 (ITF): 1% of total annual
//   payroll, for employers with 5+ employees OR annual turnover ≥ ₦50m.
// National Housing Fund Act 1992, as amended by the Business Facilitation
//   Act 2023: 2.5% of basic salary — an EMPLOYEE deduction (voluntary for
//   private-sector staff since the 2023 amendment), not an employer cost,
//   though the employer still bears the administrative duty to remit it.
// Nigeria Tax Act 2025, effective 1 January 2026: progressive PAYE bands,
//   shown here for completeness on the employee side only.
const PENSION_EMPLOYER_RATE = 0.10
const PENSION_EMPLOYER_FULL_RATE = 0.20
const PENSION_EMPLOYEE_RATE = 0.08
const NSITF_RATE = 0.01
const ITF_RATE = 0.01
const ITF_EMPLOYEE_THRESHOLD = 5
const ITF_TURNOVER_THRESHOLD = 50_000_000
const NHF_RATE = 0.025

const PAYE_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]

const PRESETS = [
  { label: 'Minimum Wage (₦70k)', value: 70_000 },
  { label: 'Entry-level (₦150k)', value: 150_000 },
  { label: 'Mid-level Lagos (₦500k)', value: 500_000 },
  { label: 'Executive (₦1.5M)', value: 1_500_000 },
]

function calculatePAYE(chargeableIncome: number) {
  let remaining = chargeableIncome
  let lowerBound = 0
  let tax = 0
  for (const band of PAYE_BANDS) {
    if (remaining <= 0) break
    const bandSize = band.upTo - lowerBound
    const amountInBand = Math.min(remaining, bandSize)
    tax += amountInBand * band.rate
    remaining -= amountInBand
    lowerBound = band.upTo
  }
  return tax
}

function formatNaira(value: number) {
  return `₦${Math.round(Math.max(0, value)).toLocaleString('en-NG')}`
}

export function NigeriaEmployeeTotalCostCalculator(_props: { locale: string }) {
  const [gross, setGross] = useState<string>('500000')
  const [employees, setEmployees] = useState<string>('1')
  const [breakdownBHT, setBreakdownBHT] = useState(false)
  const [basic, setBasic] = useState<string>('')
  const [housing, setHousing] = useState<string>('')
  const [transport, setTransport] = useState<string>('')
  const [annualTurnover, setAnnualTurnover] = useState<string>('0')
  const [employerPaysFullPension, setEmployerPaysFullPension] = useState(false)
  const [includeGroupLife, setIncludeGroupLife] = useState(true)
  const [groupLifeRate, setGroupLifeRate] = useState<string>('0.75')
  const [includeNHF, setIncludeNHF] = useState(false)
  const [showEmployeeSide, setShowEmployeeSide] = useState(false)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const grossNum = Math.max(0, parseFloat(gross) || 0)
    const headcount = Math.max(1, parseInt(employees, 10) || 1)
    const turnover = Math.max(0, parseFloat(annualTurnover) || 0)
    const glRate = Math.max(0, parseFloat(groupLifeRate) || 0) / 100

    // Pensionable base: Basic + Housing + Transport. Default split (60/15/10)
    // is a common approximation when the user doesn't know their exact
    // structure — same fallback used elsewhere on this site.
    const basicNum = breakdownBHT && basic ? Math.max(0, parseFloat(basic) || 0) : grossNum * 0.6
    const housingNum = breakdownBHT && housing ? Math.max(0, parseFloat(housing) || 0) : grossNum * 0.15
    const transportNum = breakdownBHT && transport ? Math.max(0, parseFloat(transport) || 0) : grossNum * 0.1
    const pensionable = basicNum + housingNum + transportNum

    const employerPensionRate = employerPaysFullPension ? PENSION_EMPLOYER_FULL_RATE : PENSION_EMPLOYER_RATE
    const employerPensionMonthly = pensionable * employerPensionRate
    const employeePensionMonthly = employerPaysFullPension ? 0 : pensionable * PENSION_EMPLOYEE_RATE

    const nsitfMonthlyPerEmployee = grossNum * NSITF_RATE

    const itfApplies = headcount >= ITF_EMPLOYEE_THRESHOLD || turnover >= ITF_TURNOVER_THRESHOLD
    const itfAnnualPerEmployee = itfApplies ? grossNum * 12 * ITF_RATE : 0
    const itfMonthlyPerEmployee = itfAnnualPerEmployee / 12

    const groupLifeAnnualPerEmployee = includeGroupLife ? grossNum * 12 * glRate : 0
    const groupLifeMonthlyPerEmployee = groupLifeAnnualPerEmployee / 12

    const nhfMonthly = includeNHF ? basicNum * NHF_RATE : 0 // employee deduction, shown for context only

    const statutoryAddOnsMonthlyPerEmployee =
      employerPensionMonthly + nsitfMonthlyPerEmployee + itfMonthlyPerEmployee + groupLifeMonthlyPerEmployee

    const totalCostMonthlyPerEmployee = grossNum + statutoryAddOnsMonthlyPerEmployee
    const multiplier = grossNum > 0 ? (totalCostMonthlyPerEmployee / grossNum - 1) * 100 : 0

    const totalCostMonthlyCompany = totalCostMonthlyPerEmployee * headcount
    const totalCostAnnualCompany = totalCostMonthlyCompany * 12

    // Employee-side estimate (PAYE), shown separately — not part of employer cost.
    const grossAnnual = grossNum * 12
    const rentRelief = 0 // not collected in this tool; kept out to avoid overstating relief
    const chargeableIncome = Math.max(0, grossAnnual - employeePensionMonthly * 12 - rentRelief)
    const payeAnnual = calculatePAYE(chargeableIncome)
    const netAnnual = grossAnnual - employeePensionMonthly * 12 - payeAnnual - nhfMonthly * 12
    const netMonthly = netAnnual / 12

    return {
      grossNum,
      headcount,
      pensionable,
      basicNum,
      housingNum,
      transportNum,
      employerPensionMonthly,
      employeePensionMonthly,
      employerPensionRate,
      nsitfMonthlyPerEmployee,
      itfApplies,
      itfMonthlyPerEmployee,
      groupLifeMonthlyPerEmployee,
      nhfMonthly,
      statutoryAddOnsMonthlyPerEmployee,
      totalCostMonthlyPerEmployee,
      multiplier,
      totalCostMonthlyCompany,
      totalCostAnnualCompany,
      payeMonthly: payeAnnual / 12,
      netMonthly,
    }
  }, [
    gross,
    employees,
    breakdownBHT,
    basic,
    housing,
    transport,
    annualTurnover,
    employerPaysFullPension,
    includeGroupLife,
    groupLifeRate,
    includeNHF,
  ])

  const reset = () => {
    setGross('500000')
    setEmployees('1')
    setBreakdownBHT(false)
    setBasic('')
    setHousing('')
    setTransport('')
    setAnnualTurnover('0')
    setEmployerPaysFullPension(false)
    setIncludeGroupLife(true)
    setGroupLifeRate('0.75')
    setIncludeNHF(false)
  }

  const copyResult = () => {
    const text = `Gross: ${formatNaira(result.grossNum)}/mo | Statutory add-ons: ${formatNaira(result.statutoryAddOnsMonthlyPerEmployee)}/mo | Total employer cost per employee: ${formatNaira(result.totalCostMonthlyPerEmployee)}/mo (+${result.multiplier.toFixed(1)}% above gross)`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => setGross(String(p.value))}
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Core inputs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Monthly Gross Salary (₦)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(gross)}
            onChange={e => setGross(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="500,000"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Number of Employees at This Salary
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={employees}
            onChange={e => setEmployees(e.target.value.replace(/\D/g, ''))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="1"
          />
          <p className="text-xs text-gray-400 mt-1">Scales company-wide totals below.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Company Annual Turnover (₦) <span className="text-gray-400 font-normal">— for ITF threshold</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(annualTurnover)}
          onChange={e => setAnnualTurnover(cleanNumberInput(e.target.value))}
          className="w-full sm:w-1/2 rounded-xl border border-gray-200 px-4 py-3 text-base font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="0"
        />
      </div>

      {/* BHT breakdown toggle */}
      <div className="border border-gray-200 rounded-xl p-4">
        <label className="flex items-center gap-2.5 cursor-pointer w-fit mb-2">
          <input
            type="checkbox"
            checked={breakdownBHT}
            onChange={e => setBreakdownBHT(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Enter exact Basic / Housing / Transport split
          </span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Pension is calculated on "monthly emolument" — Basic + Housing + Transport only, per the
          Pension Reform Act 2014 — not full gross pay. Without an exact split, this uses a common
          60% / 15% / 10% approximation of gross.
        </p>
        {breakdownBHT && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Basic (₦/mo)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(basic)}
                onChange={e => setBasic(cleanNumberInput(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder={Math.round(parseFloat(gross || '0') * 0.6).toLocaleString()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Housing (₦/mo)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(housing)}
                onChange={e => setHousing(cleanNumberInput(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder={Math.round(parseFloat(gross || '0') * 0.15).toLocaleString()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Transport (₦/mo)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(transport)}
                onChange={e => setTransport(cleanNumberInput(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder={Math.round(parseFloat(gross || '0') * 0.1).toLocaleString()}
              />
            </div>
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="space-y-2.5">
        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={employerPaysFullPension}
            onChange={e => setEmployerPaysFullPension(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-600">
            Employer bears the full pension contribution (20% of BHT, no employee deduction)
          </span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={includeGroupLife}
            onChange={e => setIncludeGroupLife(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-600">
            Include Group Life Insurance estimate (Pension Reform Act 2014 minimum cover)
          </span>
        </label>
        {includeGroupLife && (
          <div className="ml-6 flex items-center gap-2">
            <label className="text-xs text-gray-500">Estimated annual premium as % of annual gross:</label>
            <input
              type="text"
              inputMode="decimal"
              value={groupLifeRate}
              onChange={e => setGroupLifeRate(e.target.value.replace(/[^\d.]/g, ''))}
              className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        )}

        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={includeNHF}
            onChange={e => setIncludeNHF(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-600">
            Show NHF (National Housing Fund, 2.5% of Basic) — employee-side, voluntary in the private sector
          </span>
        </label>
      </div>

      {/* Threshold warning */}
      <div
        className={`rounded-xl p-3 text-xs font-medium ${
          result.itfApplies
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-gray-50 text-gray-500 border border-gray-200'
        }`}
      >
        {result.itfApplies
          ? 'ITF levy applies: your headcount is 5+ or turnover is ≥₦50M/year.'
          : 'ITF levy likely does not apply yet — fewer than 5 employees and turnover under ₦50M/year.'}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Direct Salary</div>
          <div className="font-bold text-gray-900">{formatNaira(result.grossNum)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="text-xs text-gray-500 mb-1">Statutory Add-ons</div>
          <div className="font-bold text-gray-900">{formatNaira(result.statutoryAddOnsMonthlyPerEmployee)}</div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <div className="text-xs text-indigo-600 mb-1">Grand Total (per employee)</div>
          <div className="font-bold text-indigo-900">{formatNaira(result.totalCostMonthlyPerEmployee)}</div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <div className="text-xs text-indigo-600 mb-1">Cost Multiplier</div>
          <div className="font-bold text-indigo-900">+{result.multiplier.toFixed(1)}%</div>
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900" title="Pension Reform Act 2014: min 10% employer on Basic + Housing + Transport, 20% if employer pays all">
            Employer Pension ({(result.employerPensionRate * 100).toFixed(0)}% of BHT)
          </span>
          <span className="font-semibold text-indigo-900">{formatNaira(result.employerPensionMonthly)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900" title="Employees' Compensation Act 2010, employer-only, 1% of total monthly gross payroll">
            NSITF (1% of gross, employer-only)
          </span>
          <span className="font-semibold text-indigo-900">{formatNaira(result.nsitfMonthlyPerEmployee)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900" title="Industrial Training Fund Act 2011: 1% of annual payroll if 5+ employees or turnover ≥₦50M">
            ITF Levy (1% of annual, prorated monthly)
          </span>
          <span className="font-semibold text-indigo-900">{formatNaira(result.itfMonthlyPerEmployee)}</span>
        </div>
        {includeGroupLife && (
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900" title="Pension Reform Act 2014 Section 4(5): minimum life cover of 3x annual total emoluments; premium shown is a simple estimate">
              Group Life Insurance (estimate)
            </span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.groupLifeMonthlyPerEmployee)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-indigo-200 pt-3">
          <span className="font-bold text-indigo-900">Total Employer Cost (per employee)</span>
          <div className="text-right">
            <div className="text-2xl font-black text-indigo-900">{formatNaira(result.totalCostMonthlyPerEmployee)}</div>
            <div className="text-xs text-indigo-500">/month</div>
          </div>
        </div>
      </div>

      {/* Company-wide totals */}
      {result.headcount > 1 && (
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            For {result.headcount} employees at this salary
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500 text-xs">Monthly Company Cost</div>
              <div className="font-bold text-gray-900">{formatNaira(result.totalCostMonthlyCompany)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Annual Company Cost</div>
              <div className="font-bold text-gray-900">{formatNaira(result.totalCostAnnualCompany)}</div>
            </div>
          </div>
        </div>
      )}

      {includeNHF && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-200">
          NHF ({formatNaira(result.nhfMonthly)}/month) is deducted from the employee's pay, not added to
          employer cost — the employer's role is remitting it. Voluntary for private-sector staff since
          the Business Facilitation Act 2023 amended the NHF Act 1992.
        </p>
      )}

      {/* Employee side */}
      <button
        type="button"
        onClick={() => setShowEmployeeSide(!showEmployeeSide)}
        className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
      >
        {showEmployeeSide ? 'Hide' : 'Show'} employee's estimated net take-home →
      </button>
      {showEmployeeSide && (
        <div className="border border-gray-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Employee Pension (8%)</div>
            <div className="font-semibold text-gray-900">{formatNaira(result.employeePensionMonthly)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Estimated PAYE (monthly)</div>
            <div className="font-semibold text-gray-900">{formatNaira(result.payeMonthly)}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Estimated Net Take-Home</div>
            <div className="font-semibold text-gray-900">{formatNaira(result.netMonthly)}</div>
          </div>
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
          onClick={reset}
          className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors"
        >
          Reset
        </button>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        For illustrative/educational purposes. Pension is calculated on an approximated or user-entered
        Basic + Housing + Transport split (Pension Reform Act 2014); NSITF (Employees' Compensation Act
        2010) and ITF (Industrial Training Fund Act, as amended 2011) are shown at their statutory
        minimums; Group Life Insurance is a simple premium estimate, not an actual quote. Rates and
        thresholds can change — consult a tax professional, PenCom, NSITF, or the ITF for compliance,
        and an insurer for an accurate Group Life premium. Not legal or financial advice.
      </p>
    </div>
  )
}
