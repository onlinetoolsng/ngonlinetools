'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

/**
 * components/tools/GhanaSSNITCalculator.tsx
 *
 * ─── Legal / regulatory basis ──────────────────────────────────────────────
 * National Pensions Act, 2008 (Act 766), as amended by Act 883. Rates and
 * insurable-earnings ceilings below are the 2026 statutory figures published
 * by SSNIT/NPRA — these are updated annually, so this component hard-codes
 * the current year's constants with a note that they change.
 *
 * Contribution base: basic salary only (allowances excluded).
 *   Employee: 5.5% of basic salary.
 *   Employer: 13% of basic salary.
 *   Total mandatory: 18.5% — split into:
 *     13.5% remitted to SSNIT (Tier 1): 11% retained for the pension,
 *       2.5% passed to NHIA.
 *     5% to the member's Tier 2 mandatory occupational scheme (private
 *       NPRA-licensed trustee — not SSNIT, shown here for completeness only).
 *   Self-employed / informal (SEED): 13.5% of declared income, no employer
 *   share, no Tier 2.
 *
 * Pension (Tier 1 defined benefit):
 *   Full pension: age 60 with >= 180 contribution months.
 *   Reduced/early pension: age 55–59 with >= 180 months.
 *   Pension right: 37.5% at exactly 180 months, +0.09375%/month after that,
 *   capped at 60% at 420 months (35 years).
 *   Below 180 months at retirement: lump-sum refund of contributions +
 *   interest, not a monthly pension.
 */

const MIN_INSURABLE = 587.80
const MAX_INSURABLE = 69_000
const EMP_RATE = 0.055
const ER_RATE = 0.13
const TIER1_RATE = 0.135
const TIER2_RATE = 0.05
const NHIA_SHARE = 0.025
const SSNIT_RETAINED_SHARE = 0.11

const EARLY_PENSION_FACTORS: Record<number, number> = {
  55: 0.60,
  56: 0.675,
  57: 0.75,
  58: 0.825,
  59: 0.90,
}

type EmploymentType = 'employed' | 'self-employed'

function clampToInsurable(salary: number): number {
  if (salary <= 0) return 0
  return Math.min(Math.max(salary, MIN_INSURABLE), MAX_INSURABLE)
}

function pensionRightPct(months: number): number {
  if (months < 180) return 0
  const extra = months - 180
  return Math.min(37.5 + extra * 0.09375, 60)
}

function formatGHS(value: number): string {
  if (!Number.isFinite(value)) return 'GHS 0.00'
  return `GHS ${Math.max(0, value).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function GhanaSSNITCalculator(_props: { locale: string }) {
  const [employmentType, setEmploymentType] = useState<EmploymentType>('employed')
  const [salaryInput, setSalaryInput] = useState('4000')
  const [showAnnual, setShowAnnual] = useState(false)

  const [showPension, setShowPension] = useState(false)
  const [yearsInput, setYearsInput] = useState('15')
  const [monthsInput, setMonthsInput] = useState('0')
  const [retirementAge, setRetirementAge] = useState(60)
  const [useCurrentAsProxy, setUseCurrentAsProxy] = useState(true)
  const [best36Input, setBest36Input] = useState('4000')

  const contribution = useMemo(() => {
    const rawSalary = Math.max(0, parseFloat(salaryInput) || 0)
    const base = clampToInsurable(rawSalary)
    const belowMin = rawSalary > 0 && rawSalary < MIN_INSURABLE
    const aboveMax = rawSalary > MAX_INSURABLE
    const isSelfEmployed = employmentType === 'self-employed'

    const tier1ToSSNIT = base * TIER1_RATE
    const nhia = base * NHIA_SHARE
    const ssnitRetained = base * SSNIT_RETAINED_SHARE

    if (isSelfEmployed) {
      const total = tier1ToSSNIT
      return {
        base, rawSalary, belowMin, aboveMax,
        employee: 0, employer: 0, self: total,
        tier1ToSSNIT, tier2: 0, nhia, ssnitRetained, total,
        annualEmployee: 0, annualEmployer: 0, annualSelf: total * 12, annualTotal: total * 12,
      }
    }

    const employee = base * EMP_RATE
    const employer = base * ER_RATE
    const tier2 = base * TIER2_RATE
    const total = employee + employer

    return {
      base, rawSalary, belowMin, aboveMax,
      employee, employer, self: 0,
      tier1ToSSNIT, tier2, nhia, ssnitRetained, total,
      annualEmployee: employee * 12, annualEmployer: employer * 12, annualSelf: 0, annualTotal: total * 12,
    }
  }, [salaryInput, employmentType])

  const pension = useMemo(() => {
    const years = Math.max(0, parseInt(yearsInput) || 0)
    const extraMonths = Math.max(0, Math.min(11, parseInt(monthsInput) || 0))
    const totalMonths = years * 12 + extraMonths

    const rightPct = pensionRightPct(totalMonths)
    const qualifiesForPension = totalMonths >= 180

    const best36 = useCurrentAsProxy
      ? Math.max(0, parseFloat(salaryInput) || 0)
      : Math.max(0, parseFloat(best36Input) || 0)

    let earlyFactor = 1
    let isEarly = false
    if (retirementAge >= 55 && retirementAge < 60) {
      earlyFactor = EARLY_PENSION_FACTORS[retirementAge] ?? 1
      isEarly = true
    }

    const fullMonthlyPension = best36 * (rightPct / 100)
    const monthlyPension = fullMonthlyPension * earlyFactor

    return {
      totalMonths, rightPct, qualifiesForPension, best36,
      earlyFactor, isEarly, fullMonthlyPension, monthlyPension,
      ageTooLow: retirementAge < 55,
    }
  }, [yearsInput, monthsInput, retirementAge, useCurrentAsProxy, best36Input, salaryInput])

  const copyResult = () => {
    const lines = [
      `SSNIT (${employmentType === 'employed' ? 'employed' : 'self-employed'}) on ${formatGHS(contribution.base)} insurable earnings:`,
      employmentType === 'employed'
        ? `Employee 5.5%: ${formatGHS(contribution.employee)} | Employer 13%: ${formatGHS(contribution.employer)} | Total 18.5%: ${formatGHS(contribution.total)}`
        : `Self-employed 13.5% (Tier 1 only): ${formatGHS(contribution.self)}`,
      `To SSNIT (Tier 1, 13.5%): ${formatGHS(contribution.tier1ToSSNIT)} (of which NHIA ${formatGHS(contribution.nhia)})`,
    ]
    if (showPension && pension.qualifiesForPension) {
      lines.push(`Pension right: ${pension.rightPct.toFixed(3)}% | Estimated monthly pension: ${formatGHS(pension.monthlyPension)}`)
    }
    navigator.clipboard.writeText(lines.join('\n'))
  }

  return (
    <div className="space-y-6">
      {/* Employment type */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
        {([
          { key: 'employed', label: 'Employed' },
          { key: 'self-employed', label: 'Self-employed / SEED' },
        ] as { key: EmploymentType; label: string }[]).map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setEmploymentType(opt.key)}
            className={`flex-1 px-3 py-2.5 font-semibold transition-colors ${employmentType === opt.key ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {employmentType === 'employed' ? 'Monthly basic salary' : 'Monthly declared income'} (GHS)
        </label>
        <input
          type="text" inputMode="decimal"
          value={formatNumberInput(salaryInput)}
          onChange={e => setSalaryInput(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
        {employmentType === 'employed' && (
          <p className="text-[11px] text-gray-400 mt-1">Basic salary only — allowances are excluded from the SSNIT contribution base.</p>
        )}
        {contribution.belowMin && (
          <p className="text-xs text-amber-600 mt-1.5 font-medium">Below the 2026 minimum insurable earnings of {formatGHS(MIN_INSURABLE)}/month — contributions are calculated on the minimum.</p>
        )}
        {contribution.aboveMax && (
          <p className="text-xs text-amber-600 mt-1.5 font-medium">Above the 2026 maximum insurable earnings of {formatGHS(MAX_INSURABLE)}/month — contributions are capped at this ceiling.</p>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
        <input type="checkbox" checked={showAnnual} onChange={e => setShowAnnual(e.target.checked)} className="accent-indigo-700" />
        Show annual figures
      </label>

      {/* Contribution breakdown */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Contribution breakdown</h3>
        <dl className="space-y-2 text-sm">
          {employmentType === 'employed' ? (
            <>
              <div className="flex justify-between"><dt className="text-gray-500">Employee deduction (5.5%)</dt><dd className="font-medium text-gray-800">{formatGHS(showAnnual ? contribution.annualEmployee : contribution.employee)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Employer cost (13%)</dt><dd className="font-medium text-gray-800">{formatGHS(showAnnual ? contribution.annualEmployer : contribution.employer)}</dd></div>
              <div className="flex justify-between border-t border-indigo-100 pt-2"><dt className="text-gray-700 font-medium">Total mandatory (18.5%)</dt><dd className="font-semibold text-indigo-700 text-lg">{formatGHS(showAnnual ? contribution.annualTotal : contribution.total)}</dd></div>
            </>
          ) : (
            <div className="flex justify-between border-t border-indigo-100 pt-2"><dt className="text-gray-700 font-medium">Self-employed (13.5% to Tier 1)</dt><dd className="font-semibold text-indigo-700 text-lg">{formatGHS(showAnnual ? contribution.annualSelf : contribution.self)}</dd></div>
          )}
          <div className="flex justify-between border-t border-indigo-100 pt-2"><dt className="text-gray-500">Amount to SSNIT (Tier 1, 13.5%)</dt><dd className="font-medium text-gray-800">{formatGHS(contribution.tier1ToSSNIT)}</dd></div>
          <div className="flex justify-between pl-3"><dt className="text-gray-400 text-xs">— retained by SSNIT for pension (11%)</dt><dd className="text-gray-500 text-xs">{formatGHS(contribution.ssnitRetained)}</dd></div>
          <div className="flex justify-between pl-3"><dt className="text-gray-400 text-xs">— passed to NHIA (2.5%)</dt><dd className="text-gray-500 text-xs">{formatGHS(contribution.nhia)}</dd></div>
          {employmentType === 'employed' && (
            <div className="flex justify-between"><dt className="text-gray-500">Amount to Tier 2 occupational scheme (5%)</dt><dd className="font-medium text-gray-800">{formatGHS(contribution.tier2)}</dd></div>
          )}
        </dl>
        <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
      </div>

      {/* Pension estimator */}
      <div>
        <button type="button" onClick={() => setShowPension(v => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
          {showPension ? 'Hide' : 'Show'} pension (Tier 1) estimate
        </button>

        {showPension && (
          <div className="mt-3 space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Years contributed</label>
                <input type="text" inputMode="numeric" value={yearsInput} onChange={e => setYearsInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">+ extra months</label>
                <input type="text" inputMode="numeric" value={monthsInput} onChange={e => setMonthsInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 -mt-2">Total credited months: {pension.totalMonths}</p>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Retirement age ({retirementAge})</label>
              <input type="range" min={55} max={60} step={1} value={retirementAge} onChange={e => setRetirementAge(parseInt(e.target.value))} className="w-full accent-indigo-700" />
              <div className="flex justify-between text-[10px] text-gray-400"><span>55</span><span>60</span></div>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
              <input type="checkbox" checked={useCurrentAsProxy} onChange={e => setUseCurrentAsProxy(e.target.checked)} className="accent-indigo-700" />
              Use current salary above as a proxy for my best 36 months&apos; average
            </label>
            {!useCurrentAsProxy && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Average of best 36 consecutive months&apos; basic salary (GHS)</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(best36Input)} onChange={e => setBest36Input(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
              </div>
            )}

            {pension.ageTooLow ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">SSNIT&apos;s earliest pension age is 55 (reduced/early pension). Choose an age between 55 and 60.</p>
            ) : !pension.qualifiesForPension ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                With {pension.totalMonths} months credited, this is below the 180-month (15-year) minimum for a monthly pension. At retirement you would instead be entitled to a lump-sum refund of your contributions plus prescribed interest — contact SSNIT for the exact figure.
              </p>
            ) : (
              <div className="bg-white rounded-xl border border-indigo-100 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Pension right</dt><dd className="font-medium text-gray-800">{pension.rightPct.toFixed(3)}%</dd></div>
                {pension.isEarly && (
                  <div className="flex justify-between"><dt className="text-gray-500">Early-retirement factor (age {retirementAge})</dt><dd className="font-medium text-gray-800">{(pension.earlyFactor * 100).toFixed(1)}% of full pension</dd></div>
                )}
                <div className="flex justify-between border-t border-indigo-100 pt-2"><dt className="text-gray-700 font-medium">Estimated starting monthly pension</dt><dd className="font-semibold text-indigo-700 text-lg">{formatGHS(pension.monthlyPension)}</dd></div>
                <p className="text-[11px] text-gray-400 pt-1">Starting amount only — SSNIT/NPRA index pensions annually thereafter. This is an estimate using the Act 766 formula on the average salary you supplied; your final figure is determined by SSNIT from your actual best-36-month record.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Good to know</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>SSNIT contributions are calculated on basic salary only — allowances, bonuses, and benefits-in-kind are excluded from the base.</li>
          <li>Of the 18.5% mandatory total, 13.5% goes to SSNIT Tier 1 (11% retained for the pension, 2.5% to NHIA) and 5% goes to your Tier 2 occupational scheme with a private NPRA-licensed trustee — not SSNIT.</li>
          <li>A full pension needs age 60 and at least 180 contribution months (15 years); a reduced pension is available from age 55 with the same 180-month minimum.</li>
          <li>Pension right starts at 37.5% at 180 months and rises 1.125% per extra year, capped at 60% after 420 months (35 years).</li>
          <li>Fewer than 180 months at retirement means a lump-sum refund of contributions plus interest, not a monthly pension.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          Uses 2026 SSNIT/NPRA insurable earnings limits and rates under the National Pensions Act, 2008 (Act 766), as amended by Act 883. Rates and limits are reviewed annually by SSNIT/NPRA. For estimation only — this is not an official SSNIT statement; verify your contribution history and pension projection with SSNIT directly.
        </p>
      </div>
    </div>
  )
}
