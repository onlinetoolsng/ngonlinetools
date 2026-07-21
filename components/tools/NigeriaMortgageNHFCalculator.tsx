'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Regulatory context (informational only — this tool does not give legal advice) ───
// National Housing Fund Act (Decree No. 3 of 1992, now Cap N45 LFN 2004),
// administered by the Federal Mortgage Bank of Nigeria (FMBN). Salaried
// contributors at organisations with 10+ staff have 2.5% of basic salary
// deducted as an NHF contribution; contributors become loan-eligible after
// at least 6 months of contributions. The NHF preferential rate has stayed
// close to 6% p.a. for years, versus ~18–25% p.a. on commercial mortgages
// from Primary Mortgage Banks (PMBs) and commercial banks. Loan caps and
// equity tiers below are estimates and are periodically revised by FMBN
// circulars (including adjustments tied to the Renewed Hope Cities and
// Estates programme) — always confirm current figures at fmbn.gov.ng or
// with an accredited PMB before relying on them.

const NHF_ANNUAL_RATE = 6 // % p.a.
const NHF_MAX_LOAN = 50_000_000 // ₦ — confirm current FMBN cap before launch
const NHF_MAX_LTV = 0.9 // FMBN finances up to 90% of property value
const NHF_MIN_MONTHS_CONTRIBUTED = 6
const NHF_MIN_AGE = 18
const NHF_MAX_AGE_AT_MATURITY = 60 // soft ceiling commonly applied by PMBs
const NHF_CONTRIBUTION_RATE = 2.5 // % of basic salary, mandatory for salaried contributors
const COMMERCIAL_DEFAULT_RATE = 22 // % p.a., mid-point of ~18–25% market range
const AFFORDABILITY_RATIO = 1 / 3 // "payment shouldn't exceed 1/3 of net income" guideline
const MAX_TENURE_YEARS = 30

type Mode = 'nhf' | 'commercial'
type AmountBasis = 'loan' | 'property'
type AffordabilityLevel = 'green' | 'amber' | 'red'

type EquityTier = { maxLoan: number; equityPct: number }

// Equity/downpayment presets by loan band — illustrative, confirm with current FMBN guidelines
const NHF_EQUITY_TIERS: EquityTier[] = [
  { maxLoan: 5_000_000, equityPct: 0 },
  { maxLoan: 15_000_000, equityPct: 0.1 },
  { maxLoan: NHF_MAX_LOAN, equityPct: 0.2 },
]

function getNhfEquityPct(loanAmount: number): number {
  const tier = NHF_EQUITY_TIERS.find(t => loanAmount <= t.maxLoan)
  return tier ? tier.equityPct : NHF_EQUITY_TIERS[NHF_EQUITY_TIERS.length - 1].equityPct
}

function formatNaira(value: number) {
  if (!Number.isFinite(value)) return '₦0'
  return '₦' + Math.round(Math.max(0, value)).toLocaleString('en-NG')
}

/** Standard reducing-balance EMI formula. Returns 0 for invalid inputs. */
function calcMonthlyPayment(principal: number, annualRatePct: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0
  const r = annualRatePct / 12 / 100
  const n = years * 12
  if (r === 0) return principal / n
  const factor = Math.pow(1 + r, n)
  const denom = factor - 1
  if (denom <= 0) return principal / n
  return (principal * r * factor) / denom
}

type AmortRow = { year: number; principalPaid: number; interestPaid: number; balance: number }

/** Lightweight year-by-year amortization summary (first 5 years or full term if shorter). */
function buildAmortizationSummary(
  principal: number,
  annualRatePct: number,
  years: number,
  monthlyPayment: number
): AmortRow[] {
  if (principal <= 0 || years <= 0 || monthlyPayment <= 0) return []
  const r = annualRatePct / 12 / 100
  let balance = principal
  const rows: AmortRow[] = []
  const yearsToShow = Math.min(years, 5)
  for (let y = 1; y <= yearsToShow; y++) {
    let yearPrincipal = 0
    let yearInterest = 0
    for (let m = 0; m < 12 && balance > 0; m++) {
      const interest = balance * r
      let principalPortion = monthlyPayment - interest
      if (principalPortion > balance) principalPortion = balance
      balance -= principalPortion
      yearPrincipal += principalPortion
      yearInterest += interest
    }
    rows.push({ year: y, principalPaid: yearPrincipal, interestPaid: yearInterest, balance: Math.max(0, balance) })
  }
  return rows
}

type PathResult = {
  loanAmount: number
  propertyValue: number
  equityAmount: number
  monthlyPayment: number
  totalRepayable: number
  totalInterest: number
  amort: AmortRow[]
}

const AFFORDABILITY_STYLES: Record<AffordabilityLevel, string> = {
  green: 'bg-green-50 text-green-700 border-green-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
}

const AFFORDABILITY_LABEL: Record<AffordabilityLevel, string> = {
  green: 'Comfortable — within the ~1/3-of-income guideline',
  amber: 'Tight — above 1/3 of net income, lenders may push back',
  red: 'High risk — well above the 1/3-of-income guideline',
}

function getAffordability(monthlyPayment: number, income: number): { level: AffordabilityLevel; ratio: number } | null {
  if (income <= 0 || monthlyPayment <= 0) return null
  const ratio = monthlyPayment / income
  if (ratio <= AFFORDABILITY_RATIO) return { level: 'green', ratio }
  if (ratio <= AFFORDABILITY_RATIO * 1.25) return { level: 'amber', ratio }
  return { level: 'red', ratio }
}

export function NigeriaMortgageNHFCalculator(_props: { locale: string }) {
  const [mode, setMode] = useState<Mode>('nhf')
  const [compareView, setCompareView] = useState(false)

  const [netIncome, setNetIncome] = useState('350000')
  const [amountBasis, setAmountBasis] = useState<AmountBasis>('property')
  const [amountInput, setAmountInput] = useState('20000000')
  const [tenureYears, setTenureYears] = useState(20)
  const [age, setAge] = useState('32')
  const [isNhfContributor, setIsNhfContributor] = useState(true)
  const [monthsContributed, setMonthsContributed] = useState('24')
  const [location, setLocation] = useState<'lagos' | 'other'>('lagos')
  const [commercialRate, setCommercialRate] = useState(String(COMMERCIAL_DEFAULT_RATE))

  const income = parseFloat(netIncome) || 0
  const rawAmount = parseFloat(amountInput) || 0
  const ageNum = parseInt(age, 10) || 0
  const months = parseInt(monthsContributed, 10) || 0
  const rate = parseFloat(commercialRate) || COMMERCIAL_DEFAULT_RATE

  const nhf = useMemo(() => {
    const nhfEquityPct = getNhfEquityPct(rawAmount)
    let propertyValue: number
    let loanAmountRaw: number
    if (amountBasis === 'property') {
      propertyValue = rawAmount
      loanAmountRaw = rawAmount * (1 - nhfEquityPct)
    } else {
      loanAmountRaw = rawAmount
      propertyValue = nhfEquityPct < 1 ? rawAmount / (1 - nhfEquityPct) : rawAmount
    }
    const loanAmount = Math.min(loanAmountRaw, propertyValue * NHF_MAX_LTV, NHF_MAX_LOAN)
    const equityAmount = Math.max(0, propertyValue - loanAmount)

    const reasons: string[] = []
    if (ageNum < NHF_MIN_AGE) reasons.push(`Applicant must be at least ${NHF_MIN_AGE} years old.`)
    if (ageNum + tenureYears > NHF_MAX_AGE_AT_MATURITY) {
      reasons.push(`Age at loan maturity (${ageNum + tenureYears}) exceeds the typical ${NHF_MAX_AGE_AT_MATURITY}-year guideline most PMBs use — a shorter tenure may be required.`)
    }
    if (!isNhfContributor) reasons.push('You must be a registered NHF contributor.')
    if (isNhfContributor && months < NHF_MIN_MONTHS_CONTRIBUTED) {
      reasons.push(`At least ${NHF_MIN_MONTHS_CONTRIBUTED} months of contributions are required (you have ${months}).`)
    }
    if (loanAmountRaw > NHF_MAX_LOAN) reasons.push(`Requested loan exceeds the estimated NHF cap of ${formatNaira(NHF_MAX_LOAN)}.`)
    if (tenureYears > MAX_TENURE_YEARS) reasons.push(`Tenure cannot exceed ${MAX_TENURE_YEARS} years.`)

    const monthlyPayment = calcMonthlyPayment(loanAmount, NHF_ANNUAL_RATE, tenureYears)
    const totalRepayable = monthlyPayment * tenureYears * 12
    const totalInterest = Math.max(0, totalRepayable - loanAmount)

    const result: PathResult = {
      loanAmount,
      propertyValue,
      equityAmount,
      monthlyPayment,
      totalRepayable,
      totalInterest,
      amort: buildAmortizationSummary(loanAmount, NHF_ANNUAL_RATE, tenureYears, monthlyPayment),
    }
    return { result, eligible: reasons.length === 0 && loanAmount > 0, reasons, equityPct: nhfEquityPct }
  }, [rawAmount, amountBasis, tenureYears, ageNum, isNhfContributor, months])

  const commercial = useMemo(() => {
    let propertyValue: number
    let loanAmount: number
    if (amountBasis === 'property') {
      propertyValue = rawAmount
      loanAmount = rawAmount * 0.9
    } else {
      loanAmount = rawAmount
      propertyValue = rawAmount / 0.9
    }
    const monthlyPayment = calcMonthlyPayment(loanAmount, rate, tenureYears)
    const totalRepayable = monthlyPayment * tenureYears * 12
    const totalInterest = Math.max(0, totalRepayable - loanAmount)
    const result: PathResult = {
      loanAmount,
      propertyValue,
      equityAmount: Math.max(0, propertyValue - loanAmount),
      monthlyPayment,
      totalRepayable,
      totalInterest,
      amort: buildAmortizationSummary(loanAmount, rate, tenureYears, monthlyPayment),
    }
    return result
  }, [rawAmount, amountBasis, tenureYears, rate])

  const activeResult = mode === 'nhf' ? nhf.result : commercial
  const affordability = getAffordability(activeResult.monthlyPayment, income)

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setMode('nhf')}
          className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${
            mode === 'nhf' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'
          }`}
        >
          NHF Mode
        </button>
        <button
          type="button"
          onClick={() => setMode('commercial')}
          className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${
            mode === 'commercial' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'
          }`}
        >
          Commercial Mortgage
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer justify-end">
        <input
          type="checkbox"
          checked={compareView}
          onChange={e => setCompareView(e.target.checked)}
          className="rounded border-gray-300"
        />
        Compare NHF vs Commercial side by side
      </label>

      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Monthly Net (Take-Home) Income (₦)</label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(netIncome)}
            onChange={e => setNetIncome(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="350,000"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-700">
              {amountBasis === 'property' ? 'Property Value (₦)' : 'Desired Loan Amount (₦)'}
            </label>
            <button
              type="button"
              onClick={() => setAmountBasis(b => (b === 'property' ? 'loan' : 'property'))}
              className="text-xs font-medium text-indigo-600"
            >
              Switch to {amountBasis === 'property' ? 'loan amount' : 'property value'}
            </button>
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(amountInput)}
            onChange={e => setAmountInput(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="20,000,000"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Applicant Age</label>
            <input
              type="text"
              inputMode="numeric"
              value={age}
              onChange={e => setAge(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
            <select
              value={location}
              onChange={e => setLocation(e.target.value as 'lagos' | 'other')}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700 h-[46px]"
            >
              <option value="lagos">Lagos</option>
              <option value="other">Other state in Nigeria</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loan Tenure: {tenureYears} years</label>
          <input
            type="range"
            min={1}
            max={MAX_TENURE_YEARS}
            value={tenureYears}
            onChange={e => setTenureYears(Number(e.target.value))}
            className="w-full accent-indigo-700"
          />
        </div>

        {mode === 'commercial' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expected Interest Rate (% p.a.)</label>
            <input
              type="text"
              inputMode="decimal"
              value={commercialRate}
              onChange={e => setCommercialRate(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <p className="text-[11px] text-gray-400 mt-1">Nigerian commercial mortgage rates typically range ~18%–25% p.a.</p>
          </div>
        )}

        {mode === 'nhf' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Registered NHF Contributor?</label>
              <select
                value={isNhfContributor ? 'yes' : 'no'}
                onChange={e => setIsNhfContributor(e.target.value === 'yes')}
                className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700 h-[46px]"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Months Contributed</label>
              <input
                type="text"
                inputMode="numeric"
                disabled={!isNhfContributor}
                value={monthsContributed}
                onChange={e => setMonthsContributed(cleanNumberInput(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition disabled:bg-gray-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {!compareView && (
        <ResultsPanel
          title={mode === 'nhf' ? 'NHF Results' : 'Commercial Mortgage Results'}
          result={activeResult}
          nhfExtra={mode === 'nhf' ? { eligible: nhf.eligible, reasons: nhf.reasons, equityPct: nhf.equityPct } : undefined}
          affordability={affordability}
        />
      )}

      {compareView && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ResultsPanel
            title="NHF"
            result={nhf.result}
            nhfExtra={{ eligible: nhf.eligible, reasons: nhf.reasons, equityPct: nhf.equityPct }}
            affordability={getAffordability(nhf.result.monthlyPayment, income)}
          />
          <ResultsPanel
            title="Commercial"
            result={commercial}
            affordability={getAffordability(commercial.monthlyPayment, income)}
          />
        </div>
      )}

      {/* Requirements checklist */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          {mode === 'nhf' ? 'Typical NHF requirements checklist' : 'Typical commercial mortgage requirements checklist'}
        </h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          {mode === 'nhf' ? (
            <>
              <li>Registered NHF contributor with at least {NHF_MIN_MONTHS_CONTRIBUTED} months of contributions</li>
              <li>Evidence of regular income (payslip, employer letter, or business income proof)</li>
              <li>Property with a valid title — Certificate of Occupancy (C of O), Governor&apos;s Consent, or equivalent</li>
              <li>Approved building plan (for construction/renovation)</li>
              <li>Tax clearance certificate</li>
              <li>Property valuation report from an accredited valuer</li>
              <li>Age within lending guidelines at loan maturity</li>
            </>
          ) : (
            <>
              <li>Consistent, verifiable monthly income above the proposed repayment</li>
              <li>Minimum equity/downpayment (commonly 10%+ of property value)</li>
              <li>Property with a valid title — Certificate of Occupancy (C of O), Governor&apos;s Consent, or equivalent</li>
              <li>Tax clearance certificate and bank statements</li>
              <li>Property valuation and legal search</li>
              <li>Life and property insurance as required by the lender</li>
            </>
          )}
          {location === 'lagos' && (
            <li>Lagos properties: confirm Governor&apos;s Consent is registered and the title is free of encumbrances before relying on it as collateral</li>
          )}
        </ul>
        {mode === 'nhf' && (
          <p className="text-[11px] text-gray-400 mt-3">
            Reminder: salaried NHF contributors have {NHF_CONTRIBUTION_RATE}% of basic salary deducted as their NHF
            contribution. Contribution rules can change — confirm current status with your employer/FMBN.
          </p>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-gray-400 leading-relaxed">
        This calculator gives estimates only, based on the reducing-balance (amortizing) formula and the figures you
        entered. It is not a loan offer, pre-approval, or financial advice, and actual terms from the Federal
        Mortgage Bank of Nigeria (FMBN) or any Primary Mortgage Bank (PMB) may differ. Rates, caps, and equity
        requirements change over time — always confirm current figures at fmbn.gov.ng or with an accredited PMB
        before making a decision.
      </p>
    </div>
  )
}

function ResultsPanel({
  title,
  result,
  nhfExtra,
  affordability,
}: {
  title: string
  result: PathResult
  nhfExtra?: { eligible: boolean; reasons: string[]; equityPct: number }
  affordability: { level: AffordabilityLevel; ratio: number } | null
}) {
  return (
    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>

      {nhfExtra && (
        <div
          className={`text-xs rounded-xl px-3 py-2.5 border leading-relaxed ${
            nhfExtra.eligible ? AFFORDABILITY_STYLES.green : AFFORDABILITY_STYLES.amber
          }`}
        >
          {nhfExtra.eligible ? (
            <span>Eligible based on the details entered. Required equity: {(nhfExtra.equityPct * 100).toFixed(0)}%.</span>
          ) : (
            <ul className="list-disc list-inside space-y-0.5">
              {nhfExtra.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Property value</dt>
          <dd className="font-medium text-gray-800">{formatNaira(result.propertyValue)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Equity / downpayment</dt>
          <dd className="font-medium text-gray-800">{formatNaira(result.equityAmount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Loan amount</dt>
          <dd className="font-medium text-gray-800">{formatNaira(result.loanAmount)}</dd>
        </div>
        <div className="flex justify-between border-t border-indigo-100 pt-2">
          <dt className="text-gray-700 font-medium">Monthly repayment</dt>
          <dd className="font-semibold text-indigo-700">{formatNaira(result.monthlyPayment)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Total interest</dt>
          <dd className="font-medium text-gray-800">{formatNaira(result.totalInterest)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Total repayable</dt>
          <dd className="font-medium text-gray-800">{formatNaira(result.totalRepayable)}</dd>
        </div>
      </dl>

      {affordability && (
        <p className={`text-xs rounded-xl px-3 py-2.5 border leading-relaxed ${AFFORDABILITY_STYLES[affordability.level]}`}>
          {AFFORDABILITY_LABEL[affordability.level]} — payment is {(affordability.ratio * 100).toFixed(0)}% of stated net income.
        </p>
      )}

      {result.amort.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">
            Amortization preview (first {result.amort.length} year{result.amort.length > 1 ? 's' : ''})
          </p>
          <div className="overflow-x-auto rounded-xl border border-indigo-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 bg-white/60">
                  <th className="text-left py-1.5 px-2">Year</th>
                  <th className="text-right py-1.5 px-2">Principal</th>
                  <th className="text-right py-1.5 px-2">Interest</th>
                  <th className="text-right py-1.5 px-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {result.amort.map(row => (
                  <tr key={row.year} className="border-t border-indigo-100">
                    <td className="py-1.5 px-2 text-gray-700">{row.year}</td>
                    <td className="py-1.5 px-2 text-right text-gray-700">{formatNaira(row.principalPaid)}</td>
                    <td className="py-1.5 px-2 text-right text-gray-700">{formatNaira(row.interestPaid)}</td>
                    <td className="py-1.5 px-2 text-right text-gray-700">{formatNaira(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-400">
        Estimate only — actual approval, rate, and repayment terms depend on FMBN/PMB assessment.
      </p>
    </div>
  )
}
