'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── SARS 2027 tax year (1 March 2026 – 28 February 2027) ──────────────────
// A 13th cheque, performance bonus, incentive, guaranteed bonus, or
// commission is not taxed at a special "bonus rate" — SARS treats it as
// ordinary remuneration, added to taxable income and taxed at the
// taxpayer's marginal rate. Employers withhold PAYE on it in the month
// it's paid, using the difference (aggregate) method: tax the full year's
// income including the bonus, tax the year's income without it, and the
// difference is the PAYE attributable to the bonus. This correctly
// handles the bonus crossing into a higher bracket, since only the
// portion that actually falls in the higher bracket is taxed at that
// higher rate. Brackets, rebates, and thresholds cross-checked against
// the Budget 2026 Tax Pocket Guide and match this site's existing PAYE
// calculator exactly. Update only when SARS publishes new figures after
// the next Budget Speech (normally late February).
const TAX_BRACKETS = [
  { upTo: 245_100, rate: 0.18, base: 0 },
  { upTo: 383_100, rate: 0.26, base: 44_118 },
  { upTo: 530_200, rate: 0.31, base: 79_998 },
  { upTo: 695_800, rate: 0.36, base: 125_599 },
  { upTo: 887_000, rate: 0.39, base: 185_215 },
  { upTo: 1_878_600, rate: 0.41, base: 259_783 },
  { upTo: Infinity, rate: 0.45, base: 666_339 },
]

const REBATES = {
  primary: 17_820,
  secondary: 9_765, // age 65–74, on top of primary
  tertiary: 3_249, // age 75+, on top of primary + secondary
}

const RETIREMENT_DEDUCTION_PCT = 0.275
const RETIREMENT_DEDUCTION_CAP = 430_000
const UIF_RATE = 0.01
const UIF_CEILING_MONTHLY = 17_712
const UIF_MAX_MONTHLY = UIF_CEILING_MONTHLY * UIF_RATE // R177.12

type AgeBand = 'under65' | '65to74' | '75plus'
type SalaryPeriod = 'annual' | 'monthly'

const PRESETS = [
  { label: 'R10,000 bonus', value: 10_000 },
  { label: 'R25,000 bonus', value: 25_000 },
  { label: '1 month salary', value: -1 }, // special: mirrors monthly salary input
]

function taxOn(income: number, ageBand: AgeBand): number {
  if (income <= 0) return 0
  let bracket = TAX_BRACKETS[0]
  let lowerBound = 0
  for (const b of TAX_BRACKETS) {
    if (income <= b.upTo) {
      bracket = b
      break
    }
    lowerBound = b.upTo
  }
  const grossTax = bracket.base + (income - lowerBound) * bracket.rate

  let rebate = REBATES.primary
  if (ageBand === '65to74') rebate += REBATES.secondary
  if (ageBand === '75plus') rebate += REBATES.secondary + REBATES.tertiary

  return Math.max(0, grossTax - rebate)
}

function marginalRateFor(income: number): number {
  for (const b of TAX_BRACKETS) {
    if (income <= b.upTo) return b.rate
  }
  return TAX_BRACKETS[TAX_BRACKETS.length - 1].rate
}

function formatRand(value: number) {
  if (!Number.isFinite(value)) return 'R0'
  return `R${Math.max(0, Math.round(value)).toLocaleString('en-ZA')}`
}

export function SouthAfrica13thChequeBonusTaxCalculator(_props: { locale: string }) {
  const [salaryPeriod, setSalaryPeriod] = useState<SalaryPeriod>('monthly')
  const [salaryInput, setSalaryInput] = useState('25000')
  const [bonusInput, setBonusInput] = useState('25000')
  const [ageBand, setAgeBand] = useState<AgeBand>('under65')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [retirementInput, setRetirementInput] = useState('0')
  const [includeUIF, setIncludeUIF] = useState(true)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const monthlySalary = Math.max(0, parseFloat(salaryInput) || 0)
  const annualSalary = salaryPeriod === 'monthly' ? monthlySalary * 12 : monthlySalary
  const bonus = Math.max(0, parseFloat(bonusInput) || 0)

  const result = useMemo(() => {
    const retirementAnnual = Math.min(
      Math.max(0, parseFloat(retirementInput) || 0),
      Math.min(RETIREMENT_DEDUCTION_PCT * annualSalary, RETIREMENT_DEDUCTION_CAP)
    )

    const taxableSalary = Math.max(0, annualSalary - retirementAnnual)
    const taxableWithBonus = taxableSalary + bonus

    const taxSalary = taxOn(taxableSalary, ageBand)
    const taxCombined = taxOn(taxableWithBonus, ageBand)
    const payeOnBonus = Math.max(0, taxCombined - taxSalary)

    const effectiveMonthlySalary = salaryPeriod === 'monthly' ? monthlySalary : annualSalary / 12
    const uifHeadroom = Math.max(0, UIF_MAX_MONTHLY - effectiveMonthlySalary * UIF_RATE)
    const uifOnBonus = includeUIF ? Math.min(bonus * UIF_RATE, uifHeadroom) : 0

    const netBonus = bonus - payeOnBonus - uifOnBonus
    const effectiveRate = bonus > 0 ? (payeOnBonus / bonus) * 100 : 0
    const marginalRate = marginalRateFor(taxableWithBonus) * 100

    return {
      taxableSalary,
      taxableWithBonus,
      taxSalary,
      taxCombined,
      payeOnBonus,
      uifOnBonus,
      netBonus,
      effectiveRate,
      marginalRate,
    }
  }, [annualSalary, ageBand, bonus, retirementInput, includeUIF, monthlySalary, salaryPeriod])

  const hasInputs = annualSalary > 0 && bonus > 0

  const copyResult = () => {
    navigator.clipboard.writeText(
      `Bonus: ${formatRand(bonus)} | PAYE on bonus: ${formatRand(result.payeOnBonus)} | UIF on bonus: ${formatRand(result.uifOnBonus)} | Net take-home bonus: ${formatRand(result.netBonus)} (effective rate ${result.effectiveRate.toFixed(1)}%, marginal rate ${result.marginalRate.toFixed(0)}%)`
    )
  }

  return (
    <div className="space-y-6">
      {/* Salary */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-gray-700">Regular salary</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {(['monthly', 'annual'] as SalaryPeriod[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setSalaryPeriod(p)}
                className={`px-3 py-1.5 font-semibold capitalize transition-colors ${salaryPeriod === p ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(salaryInput)}
          onChange={e => setSalaryInput(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
      </div>

      {/* Bonus */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bonus / 13th cheque (gross)</label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(bonusInput)}
          onChange={e => setBonusInput(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => setBonusInput(String(p.value === -1 ? monthlySalary : p.value))}
              className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Age band */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Age</label>
        <select
          value={ageBand}
          onChange={e => setAgeBand(e.target.value as AgeBand)}
          className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        >
          <option value="under65">Under 65</option>
          <option value="65to74">65 – 74</option>
          <option value="75plus">75 and over</option>
        </select>
      </div>

      {/* Advanced */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          {showAdvanced ? 'Hide' : 'Show'} advanced options (retirement contributions, UIF)
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Estimated annual retirement contributions</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(retirementInput)}
                onChange={e => setRetirementInput(cleanNumberInput(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400"
              />
              <p className="text-[11px] text-gray-400 mt-1">Deductible up to the lower of 27.5% of remuneration or R430,000 a year (section 11F).</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={includeUIF} onChange={e => setIncludeUIF(e.target.checked)} className="accent-indigo-700" />
              Include employee UIF on the bonus
            </label>
          </div>
        )}
      </div>

      {/* Results */}
      {hasInputs && (
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Gross bonus</dt>
              <dd className="font-medium text-gray-800">{formatRand(bonus)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">PAYE on bonus</dt>
              <dd className="font-medium text-gray-800">{formatRand(result.payeOnBonus)}</dd>
            </div>
            {includeUIF && (
              <div className="flex justify-between">
                <dt className="text-gray-500">UIF on bonus</dt>
                <dd className="font-medium text-gray-800">{formatRand(result.uifOnBonus)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-indigo-100 pt-2">
              <dt className="text-gray-700 font-medium">Net take-home bonus</dt>
              <dd className="font-semibold text-indigo-700 text-lg">{formatRand(result.netBonus)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Effective tax rate on the bonus</dt>
              <dd className="font-medium text-gray-800">{result.effectiveRate.toFixed(1)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Marginal tax rate</dt>
              <dd className="font-medium text-gray-800">{result.marginalRate.toFixed(0)}%</dd>
            </div>
          </dl>

          <button type="button" onClick={() => setShowBreakdown(v => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 block">
            {showBreakdown ? 'Hide' : 'Show'} how this is calculated
          </button>
          {showBreakdown && (
            <div className="bg-white rounded-xl border border-indigo-100 p-3 text-xs text-gray-600 space-y-1.5">
              <p>SARS taxes a bonus using the difference method: tax your full year with the bonus, tax your full year without it, and the gap between the two is the PAYE on the bonus.</p>
              <dl className="space-y-1 pt-1">
                <div className="flex justify-between"><dt>Annual taxable salary (before bonus)</dt><dd>{formatRand(result.taxableSalary)}</dd></div>
                <div className="flex justify-between"><dt>Annual taxable salary + bonus</dt><dd>{formatRand(result.taxableWithBonus)}</dd></div>
                <div className="flex justify-between"><dt>Tax on salary alone</dt><dd>{formatRand(result.taxSalary)}</dd></div>
                <div className="flex justify-between"><dt>Tax on salary + bonus</dt><dd>{formatRand(result.taxCombined)}</dd></div>
                <div className="flex justify-between font-semibold text-gray-800"><dt>Difference = PAYE on bonus</dt><dd>{formatRand(result.payeOnBonus)}</dd></div>
              </dl>
            </div>
          )}

          <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Good to know</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>A 13th cheque, bonus, incentive, or commission is not taxed at a special rate — SARS adds it to your taxable income and taxes it at your marginal rate, same as ordinary salary.</li>
          <li>Because the bonus can push part of your income into a higher bracket, the tax on it isn&apos;t a flat percentage of your salary&apos;s bracket — this tool uses the same difference method SARS-aligned payroll systems use.</li>
          <li>UIF on the bonus is usually R0 if your regular monthly salary is already at or above the R17,712 ceiling, since you&apos;ve already hit the maximum monthly UIF contribution.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          Estimate only, based on SARS 2026/27 tax tables. Actual PAYE may differ slightly depending on your employer&apos;s payroll method, medical credits, other deductions, and year-to-date figures. Confirm with your payslip or a tax practitioner.
        </p>
      </div>
    </div>
  )
}
