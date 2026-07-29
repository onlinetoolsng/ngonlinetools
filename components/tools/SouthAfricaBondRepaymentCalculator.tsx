'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ─── Regulatory context (informational only — this tool does not give
// financial advice or a loan quote) ─────────────────────────────────────────
// The National Credit Act 34 of 2005 (NCA) governs affordability assessments
// for mortgages (home loans/bonds) in South Africa and caps the maximum
// interest rate a credit provider may charge on a mortgage agreement at the
// repo rate + 12 percentage points. The prime lending rate that banks quote
// off is repo + 3.5%, set by the major banks following each SARB Monetary
// Policy Committee (MPC) decision — it is variable, so instalments on a
// prime-linked bond move whenever the repo rate changes. As of late July
// 2026, prime sits at approximately 10.50% p.a. NCA-regulated initiation
// fees are capped at roughly R1,207.50 plus 10% of the loan amount above
// R10,000, up to a ceiling of about R6,038 (incl. VAT) — a regulatory cap
// that is periodically adjusted; always confirm the current cap and prime
// rate at ncr.org.za or with a bank/bond originator before relying on them.
const DEFAULT_PRIME_RATE = 10.5
const MAX_NCA_INITIATION_FEE = 6_038
const DEFAULT_MONTHLY_SERVICE_FEE = 69
const AFFORDABILITY_RATIO = 0.3 // "≤30% of gross income" — common NCA-aligned bank practice
const TERM_PRESETS = [10, 15, 20, 25, 30]
const PIE_COLORS = ['#4338ca', '#f59e0b']

function formatRand(value: number) {
  if (!Number.isFinite(value)) return 'R0'
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(Math.max(0, value))
}

/** Standard reducing-balance PMT formula (monthly compounding). */
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
type ScheduleResult = { amort: AmortRow[]; totalInterest: number; totalPaid: number; monthsToPayoff: number }

/** Full month-by-month amortization loop — applies an extra monthly payment
 *  and an optional one-time lump sum straight to principal, same as a bank's
 *  reducing-balance schedule, then rolls the months up into yearly rows. */
function buildSchedule(
  principal: number,
  annualRatePct: number,
  years: number,
  basePayment: number,
  extraMonthly: number,
  lumpSum: number,
  lumpSumMonth: number
): ScheduleResult {
  if (principal <= 0 || basePayment <= 0) {
    return { amort: [], totalInterest: 0, totalPaid: 0, monthsToPayoff: 0 }
  }
  const r = annualRatePct / 12 / 100
  const maxMonths = years * 12
  let balance = principal
  let totalInterest = 0
  let totalPaid = 0
  const amort: AmortRow[] = []
  let yearPrincipal = 0
  let yearInterest = 0
  let month = 0

  while (balance > 0.5 && month < maxMonths) {
    month++
    const interest = balance * r
    let payment = basePayment + Math.max(0, extraMonthly)
    if (lumpSum > 0 && month === lumpSumMonth) payment += lumpSum
    let principalPortion = payment - interest
    if (principalPortion > balance) {
      principalPortion = balance
      payment = interest + principalPortion
    }
    balance -= principalPortion
    totalInterest += interest
    totalPaid += payment
    yearPrincipal += principalPortion
    yearInterest += interest

    if (month % 12 === 0 || balance <= 0.5) {
      amort.push({
        year: Math.ceil(month / 12),
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        balance: Math.max(0, balance),
      })
      yearPrincipal = 0
      yearInterest = 0
    }
  }

  return { amort, totalInterest, totalPaid, monthsToPayoff: month }
}

type Mode = 'new' | 'existing'
type DepositMode = 'amount' | 'percent'

export function SouthAfricaBondRepaymentCalculator(_props: { locale: string }) {
  const [mode, setMode] = useState<Mode>('new')
  const [purchasePrice, setPurchasePrice] = useState('1500000')
  const [depositMode, setDepositMode] = useState<DepositMode>('percent')
  const [depositInput, setDepositInput] = useState('10')
  const [existingLoanAmount, setExistingLoanAmount] = useState('1350000')
  const [interestRate, setInterestRate] = useState(String(DEFAULT_PRIME_RATE))
  const [termYears, setTermYears] = useState(20)
  const [includeInitiationFee, setIncludeInitiationFee] = useState(true)
  const [includeServiceFee, setIncludeServiceFee] = useState(true)
  const [extraMonthly, setExtraMonthly] = useState('0')
  const [lumpSum, setLumpSum] = useState('0')
  const [lumpSumMonth, setLumpSumMonth] = useState('12')
  const [grossIncome, setGrossIncome] = useState('')
  const [showFullSchedule, setShowFullSchedule] = useState(false)

  const price = parseFloat(purchasePrice) || 0
  const depositRaw = parseFloat(depositInput) || 0
  const deposit = depositMode === 'percent' ? price * (depositRaw / 100) : depositRaw
  const rate = parseFloat(interestRate) || DEFAULT_PRIME_RATE
  const extra = parseFloat(extraMonthly) || 0
  const lump = parseFloat(lumpSum) || 0
  const lumpMonth = parseInt(lumpSumMonth, 10) || 0
  const income = parseFloat(grossIncome) || 0

  const initiationFee = includeInitiationFee ? MAX_NCA_INITIATION_FEE : 0
  const serviceFee = includeServiceFee ? DEFAULT_MONTHLY_SERVICE_FEE : 0

  const baseLoanAmount = useMemo(() => {
    if (mode === 'existing') return parseFloat(existingLoanAmount) || 0
    return Math.max(0, price - deposit)
  }, [mode, existingLoanAmount, price, deposit])

  const principal = baseLoanAmount + initiationFee
  const basePayment = useMemo(() => calcMonthlyPayment(principal, rate, termYears), [principal, rate, termYears])
  const monthlyRepayment = basePayment + serviceFee

  const baseSchedule = useMemo(
    () => buildSchedule(principal, rate, termYears, basePayment, 0, 0, 0),
    [principal, rate, termYears, basePayment]
  )
  const extrasSchedule = useMemo(
    () => buildSchedule(principal, rate, termYears, basePayment, extra, lump, lumpMonth),
    [principal, rate, termYears, basePayment, extra, lump, lumpMonth]
  )

  const hasExtras = extra > 0 || lump > 0
  const activeSchedule = hasExtras ? extrasSchedule : baseSchedule
  const monthsSaved = hasExtras ? Math.max(0, baseSchedule.monthsToPayoff - extrasSchedule.monthsToPayoff) : 0
  const interestSaved = hasExtras ? Math.max(0, baseSchedule.totalInterest - extrasSchedule.totalInterest) : 0

  const affordabilityRatio = income > 0 ? monthlyRepayment / income : null
  const affordabilityLevel: 'green' | 'amber' | 'red' | null =
    affordabilityRatio === null ? null : affordabilityRatio <= AFFORDABILITY_RATIO ? 'green' : affordabilityRatio <= AFFORDABILITY_RATIO * 1.25 ? 'amber' : 'red'

  const pieData = [
    { name: 'Principal', value: principal },
    { name: 'Interest', value: activeSchedule.totalInterest },
  ]
  const chartData = activeSchedule.amort.map(row => ({ year: row.year, balance: Math.round(row.balance) }))

  const copyResult = () => {
    const text = `Monthly repayment: ${formatRand(monthlyRepayment)} | Loan amount: ${formatRand(principal)} | Total interest: ${formatRand(activeSchedule.totalInterest)} | Total repaid: ${formatRand(activeSchedule.totalPaid + serviceFee * activeSchedule.monthsToPayoff)}`
    navigator.clipboard.writeText(text)
  }

  const reset = () => {
    setMode('new')
    setPurchasePrice('1500000')
    setDepositMode('percent')
    setDepositInput('10')
    setInterestRate(String(DEFAULT_PRIME_RATE))
    setTermYears(20)
    setIncludeInitiationFee(true)
    setIncludeServiceFee(true)
    setExtraMonthly('0')
    setLumpSum('0')
    setLumpSumMonth('12')
    setGrossIncome('')
  }

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setMode('new')}
          className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${mode === 'new' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
        >
          New Bond
        </button>
        <button
          type="button"
          onClick={() => setMode('existing')}
          className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${mode === 'existing' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
        >
          Existing Bond
        </button>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        {mode === 'new' ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Property Purchase Price</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(purchasePrice)}
                onChange={e => setPurchasePrice(cleanNumberInput(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder="1,500,000"
              />
              <input
                type="range"
                min={200_000}
                max={20_000_000}
                step={50_000}
                value={price || 0}
                onChange={e => setPurchasePrice(e.target.value)}
                className="w-full accent-indigo-700 mt-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Deposit</label>
                <button
                  type="button"
                  onClick={() => setDepositMode(d => (d === 'percent' ? 'amount' : 'percent'))}
                  className="text-xs font-medium text-indigo-600"
                >
                  Switch to {depositMode === 'percent' ? 'Rand amount' : 'percentage'}
                </button>
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={depositMode === 'percent' ? depositInput : formatNumberInput(depositInput)}
                onChange={e => setDepositInput(cleanNumberInput(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder={depositMode === 'percent' ? '10' : '150,000'}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {depositMode === 'percent' ? `= ${formatRand(deposit)}` : `= ${price > 0 ? ((deposit / price) * 100).toFixed(1) : '0'}% of purchase price`}
              </p>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Outstanding Bond Balance</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(existingLoanAmount)}
              onChange={e => setExistingLoanAmount(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="1,350,000"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Interest Rate (% p.a.)</label>
            <input
              type="text"
              inputMode="decimal"
              value={interestRate}
              onChange={e => setInterestRate(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <p className="text-[11px] text-gray-400 mt-1">Prime (repo + 3.5%) is ~{DEFAULT_PRIME_RATE}% currently.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Term</label>
            <select
              value={termYears}
              onChange={e => setTermYears(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700 h-[46px]"
            >
              {TERM_PRESETS.map(y => (
                <option key={y} value={y}>{y} years</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInitiationFee}
              onChange={e => setIncludeInitiationFee(e.target.checked)}
              className="rounded border-gray-300"
            />
            Add NCA initiation fee (up to {formatRand(MAX_NCA_INITIATION_FEE)}, added to the loan amount)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={includeServiceFee}
              onChange={e => setIncludeServiceFee(e.target.checked)}
              className="rounded border-gray-300"
            />
            Add monthly service/admin fee ({formatRand(DEFAULT_MONTHLY_SERVICE_FEE)}/month)
          </label>
        </div>

        <details className="rounded-xl border border-gray-200 p-4">
          <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
            Compare with extra payments (optional)
          </summary>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Extra Monthly Payment</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(extraMonthly)}
                onChange={e => setExtraMonthly(cleanNumberInput(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">One-Time Lump Sum</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(lumpSum)}
                onChange={e => setLumpSum(cleanNumberInput(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                placeholder="0"
              />
            </div>
          </div>
          {lump > 0 && (
            <div className="mt-3">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lump Sum in Month #</label>
              <input
                type="text"
                inputMode="numeric"
                value={lumpSumMonth}
                onChange={e => setLumpSumMonth(cleanNumberInput(e.target.value))}
                className="w-32 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
            </div>
          )}
        </details>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gross Monthly Income (optional, for affordability check)</label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(grossIncome)}
            onChange={e => setGrossIncome(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="e.g. 45,000"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Loan amount{includeInitiationFee ? ' (incl. initiation fee)' : ''}</dt>
            <dd className="font-medium text-gray-800">{formatRand(principal)}</dd>
          </div>
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Monthly repayment</dt>
            <dd className="font-semibold text-indigo-700 text-lg">{formatRand(monthlyRepayment)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Total interest paid</dt>
            <dd className="font-medium text-gray-800">{formatRand(activeSchedule.totalInterest)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Total repaid over term</dt>
            <dd className="font-medium text-gray-800">
              {formatRand(activeSchedule.totalPaid + serviceFee * activeSchedule.monthsToPayoff)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Effective payoff time</dt>
            <dd className="font-medium text-gray-800">
              {Math.floor(activeSchedule.monthsToPayoff / 12)}y {activeSchedule.monthsToPayoff % 12}m
            </dd>
          </div>
          {hasExtras && (monthsSaved > 0 || interestSaved > 0) && (
            <div className="flex justify-between border-t border-indigo-100 pt-2">
              <dt className="text-green-700 font-medium">Saved with extras</dt>
              <dd className="font-semibold text-green-700">
                {formatRand(interestSaved)} interest, {Math.floor(monthsSaved / 12)}y {monthsSaved % 12}m sooner
              </dd>
            </div>
          )}
        </dl>

        {affordabilityLevel && (
          <p
            className={`text-xs rounded-xl px-3 py-2.5 border leading-relaxed ${
              affordabilityLevel === 'green'
                ? 'bg-green-50 text-green-700 border-green-100'
                : affordabilityLevel === 'amber'
                ? 'bg-amber-50 text-amber-700 border-amber-100'
                : 'bg-red-50 text-red-700 border-red-100'
            }`}
          >
            Repayment is {((affordabilityRatio ?? 0) * 100).toFixed(0)}% of stated gross income
            {affordabilityLevel === 'green'
              ? ' — within the ~30%-of-income guideline most SA banks use.'
              : ' — above the ~30%-of-income guideline; lenders may push back or require a bigger deposit.'}
          </p>
        )}

        <button
          type="button"
          onClick={copyResult}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          Copy result
        </button>
      </div>

      {/* Charts */}
      {principal > 0 && activeSchedule.amort.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">Principal vs interest</p>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={54}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatRand(Number(v ?? 0))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">Balance over time</p>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: unknown) => formatRand(Number(v ?? 0))} labelFormatter={y => `Year ${y}`} />
                  <Area type="monotone" dataKey="balance" stroke="#4338ca" fill="#c7d2fe" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Amortization schedule */}
      {activeSchedule.amort.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowFullSchedule(s => !s)}
            className="text-xs font-medium text-indigo-600 mb-2"
          >
            {showFullSchedule ? 'Hide' : 'Show'} full year-by-year amortization schedule
          </button>
          {showFullSchedule && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 bg-gray-50">
                    <th className="text-left py-1.5 px-2">Year</th>
                    <th className="text-right py-1.5 px-2">Principal Paid</th>
                    <th className="text-right py-1.5 px-2">Interest Paid</th>
                    <th className="text-right py-1.5 px-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSchedule.amort.map(row => (
                    <tr key={row.year} className="border-t border-gray-100">
                      <td className="py-1.5 px-2 text-gray-700">{row.year}</td>
                      <td className="py-1.5 px-2 text-right text-gray-700">{formatRand(row.principalPaid)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-700">{formatRand(row.interestPaid)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-700">{formatRand(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={reset}
        className="text-xs font-medium text-gray-400 hover:text-gray-600"
      >
        Reset all fields
      </button>

      {/* Legal/accuracy notes */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">What this calculator assumes</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Standard South African reducing-balance amortization with monthly compounding — the same method banks use.</li>
          <li>Rates are estimates. Your actual offer depends on your credit profile, the bank, and loan-to-value (LTV) ratio.</li>
          <li>Prime-linked bonds are variable — your instalment changes whenever the SARB Monetary Policy Committee moves the repo rate.</li>
          <li>Under the NCA you have the right to settle early with no penalty, though full settlement may require written notice to your bank.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          This is not a loan quote or pre-approval. Consult a bank or registered bond originator for an actual offer. The
          NCA governs affordability assessments and caps mortgage interest at repo + 12%.
        </p>
      </div>
    </div>
  )
}
