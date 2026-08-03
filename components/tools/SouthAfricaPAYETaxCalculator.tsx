'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── SARS 2027 tax year (1 March 2026 – 28 February 2027) ──────────────────
// SARS names a year of assessment by its END year, so "2027 tax year" is the
// same period most people call "2026/2027". Source-checked against the
// Budget 2026 Tax Pocket Guide (25 February 2026) via SARS and multiple
// independent tax-tool publishers. Update only when SARS publishes new
// figures after the next Budget Speech (normally late February).
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

const THRESHOLDS = {
  under65: 99_000,
  age65to74: 153_250,
  age75plus: 171_300,
}

const MEDICAL_CREDIT_MAIN_AND_FIRST_DEPENDANT = 376 // per person, per month
const MEDICAL_CREDIT_ADDITIONAL_DEPENDANT = 254 // per person, per month

const UIF_RATE = 0.01
const UIF_CEILING_MONTHLY = 17_712
const UIF_MAX_MONTHLY = UIF_CEILING_MONTHLY * UIF_RATE // R177.12

type Period = 'monthly' | 'annual'
type AgeBand = 'under65' | '65to74' | '75plus'

const PRESETS = [
  { label: 'R15k/mo', value: 15_000 },
  { label: 'R25k/mo', value: 25_000 },
  { label: 'R50k/mo', value: 50_000 },
]

function calculateGrossTax(taxableIncome: number) {
  const breakdown: { band: string; amount: number; rate: number; tax: number }[] = []
  let lowerBound = 0
  let bracket = TAX_BRACKETS[0]

  for (const b of TAX_BRACKETS) {
    if (taxableIncome <= b.upTo) {
      bracket = b
      break
    }
    lowerBound = b.upTo
  }

  const tax = bracket.base + (taxableIncome - lowerBound) * bracket.rate

  // Build a full breakdown across every bracket the income actually passes through
  let remaining = taxableIncome
  let bound = 0
  for (const b of TAX_BRACKETS) {
    if (remaining <= 0) break
    const bandSize = b.upTo - bound
    const amountInBand = Math.min(remaining, bandSize)
    if (amountInBand > 0) {
      breakdown.push({
        band: b.upTo === Infinity ? `Above R${bound.toLocaleString()}` : `R${bound.toLocaleString()} – R${b.upTo.toLocaleString()}`,
        amount: amountInBand,
        rate: b.rate,
        tax: amountInBand * b.rate,
      })
    }
    remaining -= amountInBand
    bound = b.upTo
  }

  return { tax, marginalRate: bracket.rate, breakdown }
}

function formatRand(value: number) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`
}

export function SouthAfricaPAYETaxCalculator(_props: { locale: string }) {
  const [period, setPeriod] = useState<Period>('monthly')
  const [salary, setSalary] = useState<string>('25000')
  const [ageBand, setAgeBand] = useState<AgeBand>('under65')
  const [dependants, setDependants] = useState<number>(0) // 0 = no medical aid, main member counts as 1
  const [otherIncome, setOtherIncome] = useState<string>('0')
  const [retirementContribution, setRetirementContribution] = useState<string>('0')
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const salaryNum = Math.max(0, parseFloat(salary) || 0)
    const grossAnnual = period === 'monthly' ? salaryNum * 12 : salaryNum
    const otherIncomeAnnual = Math.max(0, parseFloat(otherIncome) || 0)
    const retirementAnnual = Math.max(0, parseFloat(retirementContribution) || 0)

    const taxableIncome = Math.max(0, grossAnnual + otherIncomeAnnual - retirementAnnual)

    const { tax: grossTax, marginalRate, breakdown } = calculateGrossTax(taxableIncome)

    let rebate = REBATES.primary
    if (ageBand === '65to74') rebate += REBATES.secondary
    if (ageBand === '75plus') rebate += REBATES.secondary + REBATES.tertiary

    const threshold =
      ageBand === 'under65' ? THRESHOLDS.under65 : ageBand === '65to74' ? THRESHOLDS.age65to74 : THRESHOLDS.age75plus

    const taxAfterRebate = Math.max(0, grossTax - rebate)

    // Medical scheme fees tax credit (section 6A) — monthly, ×12 for annual
    const membersAtMainRate = Math.min(dependants, 2) // main member + first dependant
    const additionalDependants = Math.max(0, dependants - 2)
    const monthlyMedicalCredit =
      membersAtMainRate * MEDICAL_CREDIT_MAIN_AND_FIRST_DEPENDANT + additionalDependants * MEDICAL_CREDIT_ADDITIONAL_DEPENDANT
    const annualMedicalCredit = dependants > 0 ? monthlyMedicalCredit * 12 : 0

    const finalAnnualTax = Math.max(0, taxAfterRebate - annualMedicalCredit)
    const isBelowThreshold = taxableIncome <= threshold

    const monthlyPaye = finalAnnualTax / 12
    const monthlyUif = Math.min(UIF_RATE * (grossAnnual / 12), UIF_MAX_MONTHLY)
    const annualUif = monthlyUif * 12

    const netAnnual = grossAnnual - finalAnnualTax - annualUif
    const effectiveRate = grossAnnual > 0 ? (finalAnnualTax / grossAnnual) * 100 : 0

    return {
      grossAnnual,
      taxableIncome,
      grossTax,
      marginalRate,
      rebate,
      annualMedicalCredit,
      finalAnnualTax,
      monthlyPaye,
      monthlyUif,
      annualUif,
      netAnnual,
      effectiveRate,
      breakdown,
      isBelowThreshold,
      threshold,
    }
  }, [salary, period, ageBand, dependants, otherIncome, retirementContribution])

  const displayValue = (annualValue: number) => (period === 'monthly' ? annualValue / 12 : annualValue)

  const reset = () => {
    setSalary('25000')
    setPeriod('monthly')
    setAgeBand('under65')
    setDependants(0)
    setOtherIncome('0')
    setRetirementContribution('0')
  }

  const copyResult = () => {
    const text = `Gross: ${formatRand(displayValue(result.grossAnnual))}/${period === 'monthly' ? 'mo' : 'yr'} | PAYE: ${formatRand(displayValue(result.finalAnnualTax))} | UIF: ${formatRand(displayValue(result.annualUif))} | Take-home: ${formatRand(displayValue(result.netAnnual))}`
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
          {period === 'monthly' ? 'Monthly' : 'Annual'} Gross Salary (R)
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

      {/* Age band + medical aid dependants */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Age</label>
          <select
            value={ageBand}
            onChange={e => setAgeBand(e.target.value as AgeBand)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          >
            <option value="under65">Under 65</option>
            <option value="65to74">65 – 74</option>
            <option value="75plus">75 and older</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Drives your age-based rebate and tax threshold.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Medical Aid Members <span className="text-gray-500 font-normal">— optional</span>
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={dependants}
            onChange={e => setDependants(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
          <p className="text-xs text-gray-500 mt-1">
            Count yourself as the main member. Leave at 0 if you&apos;re not on a medical scheme.
          </p>
        </div>
      </div>

      {/* Optional extras */}
      <details className="group">
        <summary className="text-sm font-medium text-indigo-700 hover:text-indigo-800 cursor-pointer list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
          Other taxable income or retirement contributions
        </summary>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Other Taxable Income (R/yr)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(otherIncome)}
              onChange={e => setOtherIncome(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Pension / RA Contribution (R/yr)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(retirementContribution)}
              onChange={e => setRetirementContribution(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Retirement fund contributions are deductible up to 27.5% of the greater of remuneration or
          taxable income, capped at R350,000 a year — this calculator doesn&apos;t cap it for you, so keep
          your entry within that limit for an accurate result.
        </p>
      </details>

      {/* Below threshold note */}
      {result.isBelowThreshold && (
        <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
          Taxable income of {formatRand(result.taxableIncome)} is at or below the R{result.threshold.toLocaleString()}
          {' '}tax threshold for your age group — no income tax is payable, though UIF still applies.
        </p>
      )}

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">Gross {period === 'monthly' ? 'Monthly' : 'Annual'}</span>
          <span className="font-semibold text-indigo-900">{formatRand(displayValue(result.grossAnnual))}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">PAYE (after rebate{result.annualMedicalCredit > 0 ? ' & medical credit' : ''})</span>
          <span className="font-semibold text-indigo-900">− {formatRand(displayValue(result.finalAnnualTax))}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">UIF</span>
          <span className="font-semibold text-indigo-900">− {formatRand(displayValue(result.annualUif))}</span>
        </div>
        <div className="flex justify-between border-t border-indigo-200 pt-3">
          <span className="font-bold text-indigo-900">Take-Home Pay</span>
          <div className="text-right">
            <div className="text-2xl font-black text-indigo-900">{formatRand(displayValue(result.netAnnual))}</div>
            <div className="text-xs text-indigo-500">
              {result.effectiveRate.toFixed(1)}% effective rate · {(result.marginalRate * 100).toFixed(0)}% marginal rate
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowBreakdown(v => !v)}
        className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
      >
        {showBreakdown ? '− Hide' : '+ Show'} full bracket-by-bracket breakdown
      </button>

      {showBreakdown && (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">Bracket</th>
                <th className="text-right px-3 py-2">Rate</th>
                <th className="text-right px-3 py-2">Tax</th>
              </tr>
            </thead>
            <tbody>
              {result.breakdown.map((b, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-700">{b.band}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{(b.rate * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-right text-gray-900 font-medium">{formatRand(b.tax)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-3 py-2 text-gray-700 font-medium" colSpan={2}>Less: rebate</td>
                <td className="px-3 py-2 text-right text-gray-900 font-medium">− {formatRand(result.rebate)}</td>
              </tr>
              {result.annualMedicalCredit > 0 && (
                <tr className="border-t border-gray-100 bg-gray-50">
                  <td className="px-3 py-2 text-gray-700 font-medium" colSpan={2}>Less: medical scheme fees credit</td>
                  <td className="px-3 py-2 text-right text-gray-900 font-medium">− {formatRand(result.annualMedicalCredit)}</td>
                </tr>
              )}
            </tfoot>
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
        Based on SARS rates for the 2027 tax year (1 March 2026 – 28 February 2027), following the
        Budget 2026 Tax Pocket Guide. UIF assumes the standard 1% employee contribution capped at
        R177.12/month. Estimate only, for standard employment income — excludes provisional tax,
        capital gains, fringe benefits, and travel allowances. Not a substitute for a SARS assessment
        or advice from a registered tax practitioner.
      </p>
    </div>
  )
}
