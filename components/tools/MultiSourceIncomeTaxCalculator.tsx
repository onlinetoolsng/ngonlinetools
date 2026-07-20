'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Nigeria Tax Act 2025 (NTA), effective 1 January 2026 ──────────────────
// Individuals are taxed as a single taxable person: ALL income sources are
// aggregated before the progressive bands apply, not calculated separately
// per source. Section 4 of the NTA lists employment, business/professional,
// and investment income (dividends, interest, rent, royalties) as all
// chargeable. Source-checked against KPMG / EY / PwC / Adeola Oyinlade & Co
// summaries of the NTA 2025.
const PAYE_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]

const DEFAULT_PENSION_RATE = 0.08
const DEFAULT_NHF_RATE = 0.025
const RENT_RELIEF_RATE = 0.2
const RENT_RELIEF_CAP = 500_000

function calculatePIT(taxableIncome: number) {
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

export function MultiSourceIncomeTaxCalculator(_props: { locale: string }) {
  // Income sources
  const [salary, setSalary] = useState<string>('0')
  const [businessProfit, setBusinessProfit] = useState<string>('0')
  const [rentalIncome, setRentalIncome] = useState<string>('0')
  const [investmentIncome, setInvestmentIncome] = useState<string>('0')
  const [otherIncome, setOtherIncome] = useState<string>('0')

  // Deductions / reliefs
  const [pensionRate, setPensionRate] = useState(DEFAULT_PENSION_RATE)
  const [includeNHF, setIncludeNHF] = useState(false)
  const [rentPaid, setRentPaid] = useState<string>('0')
  const [nhis, setNhis] = useState<string>('0')
  const [lifeInsurance, setLifeInsurance] = useState<string>('0')
  const [mortgageInterest, setMortgageInterest] = useState<string>('0')

  // Credits already paid
  const [payeDeducted, setPayeDeducted] = useState<string>('0')
  const [whtCredits, setWhtCredits] = useState<string>('0')

  const [showBreakdown, setShowBreakdown] = useState(false)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const salaryNum = Math.max(0, parseFloat(salary) || 0)
    const businessNum = Math.max(0, parseFloat(businessProfit) || 0)
    const rentalNum = Math.max(0, parseFloat(rentalIncome) || 0)
    const investmentNum = Math.max(0, parseFloat(investmentIncome) || 0)
    const otherNum = Math.max(0, parseFloat(otherIncome) || 0)

    const grossIncome = salaryNum + businessNum + rentalNum + investmentNum + otherNum

    const pension = salaryNum * pensionRate
    const nhf = includeNHF ? salaryNum * DEFAULT_NHF_RATE : 0
    const rentPaidNum = Math.max(0, parseFloat(rentPaid) || 0)
    const rentRelief = Math.min(rentPaidNum * RENT_RELIEF_RATE, RENT_RELIEF_CAP)
    const nhisNum = Math.max(0, parseFloat(nhis) || 0)
    const lifeInsuranceNum = Math.max(0, parseFloat(lifeInsurance) || 0)
    const mortgageInterestNum = Math.max(0, parseFloat(mortgageInterest) || 0)
    const totalDeductions = pension + nhf + rentRelief + nhisNum + lifeInsuranceNum + mortgageInterestNum

    const taxableIncome = Math.max(0, grossIncome - totalDeductions)
    const { tax: pit, breakdown } = calculatePIT(taxableIncome)

    const payeDeductedNum = Math.max(0, parseFloat(payeDeducted) || 0)
    const whtCreditsNum = Math.max(0, parseFloat(whtCredits) || 0)
    const totalCredits = payeDeductedNum + whtCreditsNum

    const balance = pit - totalCredits // positive = owed, negative = refund due
    const effectiveRate = grossIncome > 0 ? (pit / grossIncome) * 100 : 0

    return {
      grossIncome,
      salaryNum,
      businessNum,
      rentalNum,
      investmentNum,
      otherNum,
      pension,
      nhf,
      rentRelief,
      totalDeductions,
      taxableIncome,
      pit,
      totalCredits,
      balance,
      effectiveRate,
      breakdown,
    }
  }, [salary, businessProfit, rentalIncome, investmentIncome, otherIncome, pensionRate, includeNHF, rentPaid, nhis, lifeInsurance, mortgageInterest, payeDeducted, whtCredits])

  const reset = () => {
    setSalary('0')
    setBusinessProfit('0')
    setRentalIncome('0')
    setInvestmentIncome('0')
    setOtherIncome('0')
    setPensionRate(DEFAULT_PENSION_RATE)
    setIncludeNHF(false)
    setRentPaid('0')
    setNhis('0')
    setLifeInsurance('0')
    setMortgageInterest('0')
    setPayeDeducted('0')
    setWhtCredits('0')
  }

  const copyResult = () => {
    const text = `Gross Income: ${formatNaira(result.grossIncome)} | Taxable Income: ${formatNaira(result.taxableIncome)} | Total PIT: ${formatNaira(result.pit)} | ${result.balance >= 0 ? 'Balance Owed' : 'Refund Due'}: ${formatNaira(Math.abs(result.balance))}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
  const smallInputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"

  return (
    <div className="space-y-6">
      {/* Income sources */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Income Sources (Annual, ₦)</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Salary / Employment Income</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(salary)} onChange={e => setSalary(cleanNumberInput(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Freelance / Business Net Profit</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(businessProfit)} onChange={e => setBusinessProfit(cleanNumberInput(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rental Income Received (Net)</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(rentalIncome)} onChange={e => setRentalIncome(cleanNumberInput(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Investment Income (Dividends, Interest, etc.)</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(investmentIncome)} onChange={e => setInvestmentIncome(cleanNumberInput(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Other Taxable Income</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(otherIncome)} onChange={e => setOtherIncome(cleanNumberInput(e.target.value))} className={inputClass} />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Nigerian residents are taxed as one person on aggregate income from all sources — everything above is added together before tax bands apply.
        </p>
      </div>

      {/* Deductions */}
      <details className="group" open>
        <summary className="text-sm font-bold text-gray-900 uppercase tracking-wide cursor-pointer list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
          Deductions &amp; Reliefs
        </summary>
        <div className="mt-3 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pension Rate (% of salary)</label>
              <input type="number" step="0.1" min={0} value={(pensionRate * 100).toFixed(1)} onChange={e => setPensionRate(Math.max(0, (parseFloat(e.target.value) || 0) / 100))} className={smallInputClass} />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-1">
                <input type="checkbox" checked={includeNHF} onChange={e => setIncludeNHF(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-xs font-medium text-gray-600">Include NHF (2.5% of salary)</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Rent You Pay, Annual (₦) — for rent relief, not rental income above</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(rentPaid)} onChange={e => setRentPaid(cleanNumberInput(e.target.value))} className={smallInputClass} />
            <p className="text-xs text-gray-500 mt-1">Rent relief: 20% of rent paid, capped at ₦500,000. Keep your tenancy agreement or receipts as proof.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">NHIS Premium (₦)</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(nhis)} onChange={e => setNhis(cleanNumberInput(e.target.value))} className={smallInputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Life Insurance (₦)</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(lifeInsurance)} onChange={e => setLifeInsurance(cleanNumberInput(e.target.value))} className={smallInputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mortgage Interest (₦)</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(mortgageInterest)} onChange={e => setMortgageInterest(cleanNumberInput(e.target.value))} className={smallInputClass} />
            </div>
          </div>
        </div>
      </details>

      {/* Credits already paid */}
      <details className="group">
        <summary className="text-sm font-bold text-gray-900 uppercase tracking-wide cursor-pointer list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
          Tax Already Paid (Credits)
        </summary>
        <div className="mt-3 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">PAYE Deducted by Employer (₦)</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(payeDeducted)} onChange={e => setPayeDeducted(cleanNumberInput(e.target.value))} className={smallInputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">WHT Credits from Freelance/Investment Income (₦)</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(whtCredits)} onChange={e => setWhtCredits(cleanNumberInput(e.target.value))} className={smallInputClass} />
            <p className="text-xs text-gray-500 mt-1">
              WHT deducted on most professional fees, rent, and interest is creditable — but some categories
              (like certain dividend WHT) may be treated as final tax rather than a credit. Check with an
              accountant if unsure which applies to your specific income.
            </p>
          </div>
        </div>
      </details>

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">Gross Aggregate Income</span>
          <span className="font-semibold text-indigo-900">{formatNaira(result.grossIncome)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">Total Deductions &amp; Reliefs</span>
          <span className="font-semibold text-indigo-900">− {formatNaira(result.totalDeductions)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">Taxable Income</span>
          <span className="font-semibold text-indigo-900">{formatNaira(result.taxableIncome)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">Total PIT Due</span>
          <span className="font-semibold text-indigo-900">{formatNaira(result.pit)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-indigo-900">Less: Credits Already Paid</span>
          <span className="font-semibold text-indigo-900">− {formatNaira(result.totalCredits)}</span>
        </div>
        <div className="flex justify-between border-t border-indigo-200 pt-3">
          <span className="font-bold text-indigo-900">
            {result.balance >= 0 ? 'Balance Owed' : 'Refund Due'}
          </span>
          <div className="text-right">
            <div className={`text-2xl font-black ${result.balance >= 0 ? 'text-indigo-900' : 'text-emerald-700'}`}>
              {formatNaira(Math.abs(result.balance))}
            </div>
            <div className="text-xs text-indigo-500">{result.effectiveRate.toFixed(1)}% effective rate on gross income</div>
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
        Based on the Nigeria Tax Act 2025, effective 1 January 2026. Individuals are taxed as a
        single person on aggregate income from all sources, so this calculator sums salary,
        business/freelance profit, rental income, investment income, and other taxable income
        before applying deductions and the progressive bands. Some income types have specific
        exemptions or final-tax treatment not modelled here (e.g. certain foreign-earned income
        brought in through approved channels, or minimum-wage-only employment income). Estimates
        only, not official tax advice — file through your State Internal Revenue Service (e.g.
        LIRS for Lagos residents) and consult a licensed tax professional for your exact filing.
      </p>
    </div>
  )
}
