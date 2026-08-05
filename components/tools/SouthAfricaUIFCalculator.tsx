'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── UIF law (national — applies country-wide) ─────────────────────────────
// Governed by the Unemployment Insurance Act 63 of 2001 (as amended) and the
// Unemployment Insurance Contributions Act 4 of 2002. Administered by the
// Department of Employment and Labour; contributions collected mainly via
// SARS/payroll. Contribution rate and the earnings ceiling have been
// unchanged since 1 June 2021 — verified current as of 2026.
const UIF_CEILING = 17_712 // monthly remuneration ceiling for contribution & most benefit calcs
const EMP_RATE = 0.01 // employee 1%, employer matches 1% (2% total)

// Income Replacement Rate (IRR) sliding-scale formula from the UIF Act
// benefit schedule — lower earners get a higher replacement rate, higher
// earners get the floor rate, within a fixed band.
const IRR_A = 29.2
const IRR_B = 7_173.92
const IRR_C = 232.92
const MIN_IRR = 38
const MAX_IRR = 60

const MATERNITY_RATE = 0.66 // flat rate, not the sliding IRR scale
const MAX_CREDIT_DAYS = 365 // lifetime cap on accumulated unemployment-benefit credit days
const DAYS_PER_CREDIT = 4 // 1 day of benefit credit for every 4 days worked
const MATERNITY_MAX_DAYS = 121 // ~17.3 weeks

const PRESETS = [
  { label: 'R5,000', value: 5_000 },
  { label: 'R10,000', value: 10_000 },
  { label: `R${UIF_CEILING.toLocaleString()} (ceiling)`, value: UIF_CEILING },
  { label: 'R25,000', value: 25_000 },
]

function formatRand(value: number) {
  if (!Number.isFinite(value)) return 'R0'
  return `R${Math.max(0, Math.round(value)).toLocaleString('en-ZA')}`
}

function calculateIRR(dailyRemuneration: number): number {
  const raw = IRR_A + IRR_B / (IRR_C + dailyRemuneration)
  return Math.min(MAX_IRR, Math.max(MIN_IRR, raw))
}

type Mode = 'contribution' | 'benefit'
type BenefitType = 'unemployment' | 'maternity'

export function SouthAfricaUIFCalculator(_props: { locale: string }) {
  const [mode, setMode] = useState<Mode>('contribution')

  // Contribution/deduction calculator
  const [salaryInput, setSalaryInput] = useState('25000')

  // Benefit/payout calculator
  const [benefitType, setBenefitType] = useState<BenefitType>('unemployment')
  const [avgSalaryInput, setAvgSalaryInput] = useState('17712')
  const [daysWorkedInput, setDaysWorkedInput] = useState('730')
  const [maternityWeeksInput, setMaternityWeeksInput] = useState('17.3')

  const contribution = useMemo(() => {
    const salary = Math.max(0, parseFloat(salaryInput) || 0)
    const cappedSalary = Math.min(salary, UIF_CEILING)
    const employeeContribution = cappedSalary * EMP_RATE
    const employerContribution = cappedSalary * EMP_RATE
    return {
      cappedSalary,
      isCapped: salary > UIF_CEILING,
      employeeContribution,
      employerContribution,
      total: employeeContribution + employerContribution,
    }
  }, [salaryInput])

  const benefit = useMemo(() => {
    const avgSalary = Math.max(0, parseFloat(avgSalaryInput) || 0)
    const cappedSalary = Math.min(avgSalary, UIF_CEILING)
    const dailyRemuneration = cappedSalary / 30

    if (benefitType === 'maternity') {
      const dailyBenefit = dailyRemuneration * MATERNITY_RATE
      const weeks = Math.max(0, parseFloat(maternityWeeksInput) || 0)
      const requestedDays = Math.round(weeks * 7)
      const payableDays = Math.min(requestedDays, MATERNITY_MAX_DAYS)
      return {
        cappedSalary,
        isCapped: avgSalary > UIF_CEILING,
        irr: MATERNITY_RATE * 100,
        dailyBenefit,
        payableDays,
        dayCap: MATERNITY_MAX_DAYS,
        totalPayout: dailyBenefit * payableDays,
      }
    }

    const irr = calculateIRR(dailyRemuneration)
    const dailyBenefit = dailyRemuneration * (irr / 100)
    const daysWorked = Math.max(0, parseFloat(daysWorkedInput) || 0)
    const creditDays = Math.min(MAX_CREDIT_DAYS, Math.floor(daysWorked / DAYS_PER_CREDIT))
    return {
      cappedSalary,
      isCapped: avgSalary > UIF_CEILING,
      irr,
      dailyBenefit,
      payableDays: creditDays,
      dayCap: MAX_CREDIT_DAYS,
      totalPayout: dailyBenefit * creditDays,
    }
  }, [avgSalaryInput, benefitType, daysWorkedInput, maternityWeeksInput])

  const copyResult = () => {
    const text =
      mode === 'contribution'
        ? `UIF on ${formatRand(parseFloat(salaryInput) || 0)}/month: Employee ${formatRand(contribution.employeeContribution)} + Employer ${formatRand(contribution.employerContribution)} = ${formatRand(contribution.total)} total/month`
        : `UIF ${benefitType} benefit estimate: ${formatRand(benefit.dailyBenefit)}/day × ${benefit.payableDays} days = ${formatRand(benefit.totalPayout)} estimated total payout (IRR ${benefit.irr.toFixed(1)}%)`
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
        {([
          ['contribution', 'Monthly Deduction'],
          ['benefit', 'Benefit / Payout'],
        ] as [Mode, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${mode === key ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'contribution' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Monthly salary (R)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(salaryInput)}
              onChange={e => setSalaryInput(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setSalaryInput(String(p.value))}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
            {contribution.isCapped && (
              <p className="text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-700 border border-amber-100">
                Your salary is above the R{UIF_CEILING.toLocaleString()} UIF ceiling — contributions are calculated on the capped amount, not your full salary.
              </p>
            )}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Contribution base (capped at R{UIF_CEILING.toLocaleString()})</dt>
                <dd className="font-medium text-gray-800">{formatRand(contribution.cappedSalary)}</dd>
              </div>
              <div className="flex justify-between border-t border-indigo-100 pt-2">
                <dt className="text-gray-700 font-medium">Your deduction (employee, 1%)</dt>
                <dd className="font-semibold text-indigo-700 text-lg">{formatRand(contribution.employeeContribution)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Employer contribution (1%, matched)</dt>
                <dd className="font-medium text-gray-800">{formatRand(contribution.employerContribution)}</dd>
              </div>
              <div className="flex justify-between border-t border-indigo-100 pt-2">
                <dt className="text-gray-700 font-medium">Total paid to UIF (2%)</dt>
                <dd className="font-semibold text-gray-800">{formatRand(contribution.total)}</dd>
              </div>
            </dl>
            <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm w-fit">
            {(['unemployment', 'maternity'] as BenefitType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setBenefitType(t)}
                className={`px-4 py-2 font-semibold capitalize ${benefitType === t ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
              >
                {t === 'unemployment' ? 'Unemployment' : 'Maternity/Parental'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Average monthly remuneration, last 6 months (R)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(avgSalaryInput)}
              onChange={e => setAvgSalaryInput(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          {benefitType === 'unemployment' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Days you contributed (worked) while employed</label>
              <input
                type="text"
                inputMode="numeric"
                value={daysWorkedInput}
                onChange={e => setDaysWorkedInput(cleanNumberInput(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
              <p className="text-xs text-gray-400 mt-1">You earn 1 day of benefit credit for every 4 days worked, up to a lifetime maximum of {MAX_CREDIT_DAYS} days. You generally need at least 13 weeks of contributions to qualify at all.</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Weeks of leave claimed</label>
              <input
                type="text"
                inputMode="decimal"
                value={maternityWeeksInput}
                onChange={e => setMaternityWeeksInput(cleanNumberInput(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
              <p className="text-xs text-gray-400 mt-1">Maternity/parental benefit is capped at {MATERNITY_MAX_DAYS} days (about 17.3 weeks), paid at a flat {MATERNITY_RATE * 100}% of your average remuneration.</p>
            </div>
          )}

          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
            {benefit.isCapped && (
              <p className="text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-700 border border-amber-100">
                Your remuneration is above the R{UIF_CEILING.toLocaleString()} ceiling — your benefit is calculated on the capped amount.
              </p>
            )}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Income replacement rate</dt>
                <dd className="font-medium text-gray-800">{benefit.irr.toFixed(1)}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Estimated daily benefit</dt>
                <dd className="font-medium text-gray-800">{formatRand(benefit.dailyBenefit)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">{benefitType === 'unemployment' ? 'Credit days available' : 'Days payable'}</dt>
                <dd className="font-medium text-gray-800">{benefit.payableDays} / {benefit.dayCap} max</dd>
              </div>
              <div className="flex justify-between border-t border-indigo-100 pt-2">
                <dt className="text-gray-700 font-medium">Estimated total payout</dt>
                <dd className="font-semibold text-indigo-700 text-lg">{formatRand(benefit.totalPayout)}</dd>
              </div>
            </dl>
            <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Good to know</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>UIF contributions are 1% employee + 1% employer (2% total), on remuneration capped at R{UIF_CEILING.toLocaleString()}/month — unchanged since 1 June 2021.</li>
          <li>Unemployment benefits use a sliding Income Replacement Rate: lower earners get a higher percentage (up to {MAX_IRR}%), higher earners get the floor rate ({MIN_IRR}%).</li>
          <li>Maternity/parental benefits pay a flat {MATERNITY_RATE * 100}% of average remuneration, not the sliding scale, capped at {MATERNITY_MAX_DAYS} days.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          For estimation only. Actual UIF payouts are calculated and paid by the Department of Employment and Labour based on your official UI-19/UI-2.7 records — apply via ufiling.labour.gov.za or a labour centre for your real claim. Not financial or legal advice.
        </p>
      </div>
    </div>
  )
}
