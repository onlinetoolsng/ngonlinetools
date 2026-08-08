'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Egypt income tax + social insurance (2026) ────────────────────────────
// Law No. 91 of 2005 as amended by Law No. 7 of 2024 (income tax brackets and
// the high-earner bracket-exclusion rule), Social Insurance Law 148/2019
// (NOSI contribution rate and caps, updated annually each January), and the
// Martyrs & Victims Fund Law 4/2021 (0.05% mandatory deduction). Figures
// below are the 2026 NOSI caps — update in one place each January.
const PERSONAL_EXEMPTION = 20_000
const PERSONAL_EXEMPTION_DISABILITY = 30_000
const SI_RATE_EMPLOYEE = 0.11
const SI_RATE_EMPLOYER = 0.1875
const SI_MIN_INSURABLE_MONTHLY = 2_700
const SI_MAX_INSURABLE_MONTHLY = 16_700
const MARTYRS_FUND_RATE = 0.0005

// Standard progressive bands (apply in full when annual taxable income is
// EGP 600,000 or below). Above that, Law 7/2024's exclusion rule kicks in:
// crossing each threshold below loses the lower band(s) entirely, replacing
// them with a single flat rate on that combined width — see
// calculateEgyptTax for the exact mechanics.
const BANDS = [
  { upTo: 40_000, rate: 0 },
  { upTo: 55_000, rate: 0.10 },
  { upTo: 70_000, rate: 0.15 },
  { upTo: 200_000, rate: 0.20 },
  { upTo: 400_000, rate: 0.225 },
  { upTo: 1_200_000, rate: 0.25 },
  { upTo: Infinity, rate: 0.275 },
]

type BandRow = { band: string; amount: number; rate: number; tax: number }

function calculateEgyptTax(taxableAnnualRaw: number): { tax: number; breakdown: BandRow[] } {
  // Round down to the nearest EGP 10, as required by law.
  const taxable = Math.max(0, Math.floor(taxableAnnualRaw / 10) * 10)
  if (taxable <= 0) return { tax: 0, breakdown: [] }

  // Determine the exclusion cutoff and flat starting rate for that cutoff,
  // based on which threshold the taxable income crosses. Below 600,000,
  // there's no exclusion — the full progressive table applies.
  let cutoff = 0
  let startRate: number | null = null
  if (taxable > 1_200_000) { cutoff = 1_200_000; startRate = 0.25 }
  else if (taxable > 900_000) { cutoff = 400_000; startRate = 0.225 }
  else if (taxable > 800_000) { cutoff = 200_000; startRate = 0.20 }
  else if (taxable > 700_000) { cutoff = 70_000; startRate = 0.15 }
  else if (taxable > 600_000) { cutoff = 55_000; startRate = 0.10 }

  const breakdown: BandRow[] = []
  let tax = 0
  let remaining = taxable

  if (startRate !== null) {
    const amount = Math.min(remaining, cutoff)
    const bandTax = amount * startRate
    breakdown.push({
      band: `First EGP ${cutoff.toLocaleString()} (flat — lower bands excluded above this income level)`,
      amount, rate: startRate, tax: bandTax,
    })
    tax += bandTax
    remaining -= amount
  }

  let lowerBound = cutoff
  for (const band of BANDS) {
    if (band.upTo <= lowerBound) continue
    if (remaining <= 0) break
    const bandWidth = band.upTo - lowerBound
    const amountInBand = Math.min(remaining, bandWidth)
    if (amountInBand > 0) {
      const bandTax = amountInBand * band.rate
      breakdown.push({
        band: band.upTo === Infinity
          ? `Above EGP ${lowerBound.toLocaleString()}`
          : `EGP ${lowerBound.toLocaleString()} \u2013 ${band.upTo.toLocaleString()}`,
        amount: amountInBand, rate: band.rate, tax: bandTax,
      })
      tax += bandTax
      remaining -= amountInBand
    }
    lowerBound = band.upTo
  }

  return { tax, breakdown }
}

function formatEGP(value: number): string {
  if (!Number.isFinite(value)) return 'EGP 0'
  return `EGP ${Math.round(Math.max(0, value)).toLocaleString('en-US')}`
}

type Period = 'monthly' | 'annual' | 'weekly'

export function EgyptNetSalaryTaxCalculator(_props: { locale: string }) {
  const [grossInput, setGrossInput] = useState('15000')
  const [period, setPeriod] = useState<Period>('monthly')
  const [isDisability, setIsDisability] = useState(false)
  const [includeMartyrsFund, setIncludeMartyrsFund] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customInsurableOverride, setCustomInsurableOverride] = useState('')

  const grossRaw = parseFloat(grossInput) || 0

  const calc = useMemo(() => {
    const annualGross = period === 'monthly' ? grossRaw * 12 : period === 'weekly' ? grossRaw * 52 : grossRaw
    const monthlyGross = annualGross / 12

    const overrideVal = parseFloat(customInsurableOverride)
    const insurableMonthly = Number.isFinite(overrideVal) && customInsurableOverride !== ''
      ? Math.min(Math.max(overrideVal, SI_MIN_INSURABLE_MONTHLY), SI_MAX_INSURABLE_MONTHLY)
      : Math.min(Math.max(monthlyGross, SI_MIN_INSURABLE_MONTHLY), SI_MAX_INSURABLE_MONTHLY)

    const annualSIEmployee = insurableMonthly * SI_RATE_EMPLOYEE * 12
    const annualSIEmployer = insurableMonthly * SI_RATE_EMPLOYER * 12
    const martyrsAnnual = includeMartyrsFund ? annualGross * MARTYRS_FUND_RATE : 0
    const exemption = isDisability ? PERSONAL_EXEMPTION_DISABILITY : PERSONAL_EXEMPTION

    const taxableAnnual = Math.max(0, annualGross - annualSIEmployee - exemption)
    const { tax: annualTax, breakdown } = calculateEgyptTax(taxableAnnual)

    const annualNet = annualGross - annualSIEmployee - annualTax - martyrsAnnual
    const effectiveRate = annualGross > 0 ? (annualTax / annualGross) * 100 : 0
    const employerCost = annualGross + annualSIEmployer

    const divisor = period === 'monthly' ? 12 : period === 'weekly' ? 52 : 1

    return {
      annualGross, monthlyGross, insurableMonthly,
      annualSIEmployee, annualSIEmployer, martyrsAnnual, exemption,
      taxableAnnual, annualTax, breakdown, annualNet, effectiveRate, employerCost, divisor,
    }
  }, [grossRaw, period, isDisability, includeMartyrsFund, customInsurableOverride])

  const p = (annualValue: number) => annualValue / calc.divisor

  function copyResults() {
    const text = `Gross: ${formatEGP(p(calc.annualGross))} | Social Insurance: ${formatEGP(p(calc.annualSIEmployee))} | Income Tax: ${formatEGP(p(calc.annualTax))} | Net: ${formatEGP(p(calc.annualNet))}`
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gross Salary</label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(grossInput)}
            onChange={e => setGrossInput(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="15,000"
          />
        </div>

        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
          {(['monthly', 'annual', 'weekly'] as Period[]).map(pOpt => (
            <button
              key={pOpt}
              type="button"
              onClick={() => setPeriod(pOpt)}
              className={`flex-1 px-4 py-2.5 font-semibold capitalize transition-colors ${period === pOpt ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              {pOpt}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isDisability}
              onChange={e => setIsDisability(e.target.checked)}
              className="rounded border-gray-300"
            />
            Person with disability (raises personal exemption to EGP 30,000)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMartyrsFund}
              onChange={e => setIncludeMartyrsFund(e.target.checked)}
              className="rounded border-gray-300"
            />
            Include Martyrs &amp; Victims Fund (0.05% of gross)
          </label>
        </div>

        <details className="rounded-xl border border-gray-200 p-4" open={showAdvanced} onToggle={e => setShowAdvanced((e.target as HTMLDetailsElement).open)}>
          <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
            Advanced: override insurable wage
          </summary>
          <div className="mt-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Custom monthly insurable wage (optional)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(customInsurableOverride)}
              onChange={e => setCustomInsurableOverride(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder={`Default: capped gross (${formatEGP(SI_MIN_INSURABLE_MONTHLY)} \u2013 ${formatEGP(SI_MAX_INSURABLE_MONTHLY)})`}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Insurable wage is capped between EGP {SI_MIN_INSURABLE_MONTHLY.toLocaleString()} and EGP {SI_MAX_INSURABLE_MONTHLY.toLocaleString()} per month (2026 NOSI figures).
            </p>
          </div>
        </details>
      </div>

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Gross ({period})</dt>
            <dd className="font-medium text-gray-800">{formatEGP(p(calc.annualGross))}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Employee Social Insurance (11%)</dt>
            <dd className="font-medium text-gray-800">-{formatEGP(p(calc.annualSIEmployee))}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Income Tax (PAYE)</dt>
            <dd className="font-medium text-gray-800">-{formatEGP(p(calc.annualTax))}</dd>
          </div>
          {includeMartyrsFund && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Martyrs &amp; Victims Fund (0.05%)</dt>
              <dd className="font-medium text-gray-800">-{formatEGP(p(calc.martyrsAnnual))}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Net take-home ({period})</dt>
            <dd className="font-semibold text-indigo-700 text-lg">{formatEGP(p(calc.annualNet))}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Effective tax rate</dt>
            <dd className="font-medium text-gray-800">{calc.effectiveRate.toFixed(1)}%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Taxable income (after exemption)</dt>
            <dd className="font-medium text-gray-800">{formatEGP(p(calc.taxableAnnual))}</dd>
          </div>
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-500">Employer total cost ({period})</dt>
            <dd className="font-medium text-gray-800">{formatEGP(p(calc.employerCost))}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={copyResults}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          Copy result
        </button>
      </div>

      {/* Bracket breakdown */}
      {calc.breakdown.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 bg-gray-50">
                <th className="text-left py-1.5 px-2">Band</th>
                <th className="text-right py-1.5 px-2">Rate</th>
                <th className="text-right py-1.5 px-2">Amount in Band</th>
                <th className="text-right py-1.5 px-2">Tax</th>
              </tr>
            </thead>
            <tbody>
              {calc.breakdown.map((row, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="py-1.5 px-2 text-gray-700">{row.band}</td>
                  <td className="py-1.5 px-2 text-right text-gray-700">{(row.rate * 100).toFixed(1)}%</td>
                  <td className="py-1.5 px-2 text-right text-gray-700">{formatEGP(row.amount)}</td>
                  <td className="py-1.5 px-2 text-right text-gray-700">{formatEGP(row.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assumptions / disclaimer */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">What this calculator assumes</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Employee social insurance (11% of insurable wage, capped between EGP 2,700 and EGP 16,700/month for 2026) is fully deductible before income tax.</li>
          <li>Personal exemption is EGP 20,000/year (EGP 30,000 for persons with disabilities).</li>
          <li>Above EGP 600,000 taxable income, the lower tax bands are excluded per Law 7/2024 &mdash; this calculator applies that rule exactly.</li>
          <li>This is for a single, primary salary. Secondary employment is taxed at a flat 10% under separate rules not covered here.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          Estimate based on Law 91/2005 as amended by Law 7/2024 and current NOSI caps (2026). Actual payroll may vary
          with allowances, secondary income, or official updates. Not official advice.
        </p>
      </div>
    </div>
  )
}
