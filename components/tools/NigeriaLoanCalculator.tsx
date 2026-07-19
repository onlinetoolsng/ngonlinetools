'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Regulatory context (informational only — this tool does not give legal advice) ───
// FCCPC Digital, Electronic, Online or Non-Traditional (DEON) Consumer Lending
// Regulations 2025, issued 21 July 2025 under sections 17, 18 and 163 of the
// Federal Competition and Consumer Protection Act 2018: requires digital/online
// lenders to clearly disclose interest rates, fees, and repayment schedules
// before a loan is taken, and gives the FCCPC power to act on exploitative or
// predatory pricing. It does not fix a maximum interest rate.
// CBN Consumer Protection Regulations (2019, revised) separately require
// regulated financial institutions to disclose the total charges a borrower
// will pay over the life of a product, and to show an effective/APR-style
// rate — without prescribing one single mandatory formula for calculating it.
// The "Effective Annual Cost" this tool shows is an independent, illustrative
// calculation (see below), not any lender's official regulatory disclosure.

type Frequency = 'monthly' | 'weekly' | 'biweekly'
type RateMode = 'annual' | 'monthly'
type RepaymentMode = 'reducing' | 'flat'

interface FeeItem {
  id: string
  name: string
  amount: string
  recurring: boolean
}

interface ScheduleRow {
  period: number
  payment: number
  principal: number
  interest: number
  fee: number
  balance: number
}

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatNaira(value: number) {
  return '₦' + Math.round(value).toLocaleString('en-NG')
}

function formatPct(value: number, decimals = 2) {
  return `${(value * 100).toFixed(decimals)}%`
}

const FREQUENCY_LABEL: Record<Frequency, string> = {
  monthly: 'Monthly',
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
}

const PERIODS_PER_YEAR: Record<Frequency, number> = {
  monthly: 12,
  weekly: 52,
  biweekly: 26,
}

export function NigeriaLoanCalculator(_props: { locale: string }) {
  const [principal, setPrincipal] = useState('100000')
  const [rateValue, setRateValue] = useState('28')
  const [rateMode, setRateMode] = useState<RateMode>('annual')
  const [tenureValue, setTenureValue] = useState('12')
  const [tenureUnit, setTenureUnit] = useState<'months' | 'years'>('months')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [repaymentMode, setRepaymentMode] = useState<RepaymentMode>('reducing')
  const [upfrontFeeType, setUpfrontFeeType] = useState<'percent' | 'fixed'>('percent')
  const [upfrontFeeValue, setUpfrontFeeValue] = useState('1.5')
  const [extraFees, setExtraFees] = useState<FeeItem[]>([])
  const [extraPayment, setExtraPayment] = useState('0')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [copied, setCopied] = useState(false)

  function addFee() {
    setExtraFees(prev => [...prev, { id: newId(), name: '', amount: '', recurring: false }])
  }
  function removeFee(id: string) {
    setExtraFees(prev => prev.filter(f => f.id !== id))
  }
  function updateFee(id: string, patch: Partial<FeeItem>) {
    setExtraFees(prev => prev.map(f => (f.id === id ? { ...f, ...patch } : f)))
  }

  const calc = useMemo(() => {
    const P = Math.max(0, parseFloat(principal) || 0)
    const tenureNum = Math.max(0, parseFloat(tenureValue) || 0)
    if (!P || !tenureNum) return null

    const periodsPerYear = PERIODS_PER_YEAR[frequency]
    const totalMonths = tenureUnit === 'years' ? tenureNum * 12 : tenureNum
    const n = Math.max(1, Math.round((totalMonths / 12) * periodsPerYear))

    const rateInput = Math.max(0, parseFloat(rateValue) || 0) / 100
    const monthlyRate = rateMode === 'monthly' ? rateInput : rateInput / 12
    const periodicRate = monthlyRate * (12 / periodsPerYear)

    const upfrontFeeNum = Math.max(0, parseFloat(upfrontFeeValue) || 0)
    const upfrontFeeAmount = upfrontFeeType === 'percent' ? P * (upfrontFeeNum / 100) : upfrontFeeNum

    const oneTimeExtras = extraFees
      .filter(f => !f.recurring)
      .reduce((s, f) => s + Math.max(0, parseFloat(f.amount) || 0), 0)
    const recurringFeePerPeriod = extraFees
      .filter(f => f.recurring)
      .reduce((s, f) => s + Math.max(0, parseFloat(f.amount) || 0), 0)

    const totalOneTimeFees = upfrontFeeAmount + oneTimeExtras
    const netDisbursed = Math.max(0, P - totalOneTimeFees)
    const extraPay = Math.max(0, parseFloat(extraPayment) || 0)

    let basePayment: number
    let flatInterestPerPeriod = 0
    let flatPrincipalPerPeriod = 0

    if (repaymentMode === 'flat') {
      const years = totalMonths / 12
      const annualNominal = rateMode === 'annual' ? rateInput : rateInput * 12
      const totalFlatInterest = P * annualNominal * years
      flatInterestPerPeriod = totalFlatInterest / n
      flatPrincipalPerPeriod = P / n
      basePayment = flatInterestPerPeriod + flatPrincipalPerPeriod
    } else if (periodicRate === 0) {
      basePayment = P / n
    } else {
      const factor = Math.pow(1 + periodicRate, n)
      basePayment = (P * (periodicRate * factor)) / (factor - 1)
    }

    const schedule: ScheduleRow[] = []
    let balance = P
    let totalInterestPaid = 0

    for (let t = 1; t <= n && balance > 0.01; t++) {
      let interest: number
      let principalPaid: number

      if (repaymentMode === 'flat') {
        interest = flatInterestPerPeriod
        principalPaid = flatPrincipalPerPeriod + extraPay
      } else {
        interest = balance * periodicRate
        principalPaid = basePayment - interest + extraPay
      }

      if (principalPaid > balance) principalPaid = balance
      if (principalPaid < 0) principalPaid = 0
      balance = Math.max(0, balance - principalPaid)
      totalInterestPaid += interest

      const payment = principalPaid + interest + recurringFeePerPeriod
      schedule.push({ period: t, payment, principal: principalPaid, interest, fee: recurringFeePerPeriod, balance })
      if (balance <= 0.01) break
    }

    const actualPeriods = schedule.length
    const totalRecurringFees = recurringFeePerPeriod * actualPeriods
    const totalCostOfCredit = totalInterestPaid + totalRecurringFees + totalOneTimeFees
    const totalRepayment = P + totalInterestPaid + totalRecurringFees

    // Effective annual cost — solved as the internal rate of return of the
    // actual cash flow (amount received now vs. every payment made), then
    // annualized. This is an independent illustrative figure, not a
    // regulator-mandated APR.
    let effectiveAnnualRate: number | null = null
    if (netDisbursed > 0 && schedule.length > 0) {
      const cashflows = schedule.map(s => s.payment)
      const npv = (r: number) => {
        let total = -netDisbursed
        cashflows.forEach((cf, idx) => {
          total += cf / Math.pow(1 + r, idx + 1)
        })
        return total
      }
      const zeroCost = npv(0)
      if (zeroCost > 0) {
        let lo = 0
        let hi = 20 // periodic rate cap of 2000% — generous enough for even the sharpest digital-loan pricing
        for (let i = 0; i < 100; i++) {
          const mid = (lo + hi) / 2
          const v = npv(mid)
          if (Math.abs(v) < 0.01) {
            lo = mid
            hi = mid
            break
          }
          if (v > 0) lo = mid
          else hi = mid
        }
        const periodicIRR = (lo + hi) / 2
        effectiveAnnualRate = Math.pow(1 + periodicIRR, periodsPerYear) - 1
      } else {
        effectiveAnnualRate = 0
      }
    }

    return {
      P,
      n,
      actualPeriods,
      basePayment,
      recurringFeePerPeriod,
      upfrontFeeAmount,
      totalOneTimeFees,
      netDisbursed,
      totalInterestPaid,
      totalRecurringFees,
      totalCostOfCredit,
      totalRepayment,
      effectiveAnnualRate,
      schedule,
    }
  }, [
    principal,
    rateValue,
    rateMode,
    tenureValue,
    tenureUnit,
    frequency,
    repaymentMode,
    upfrontFeeType,
    upfrontFeeValue,
    extraFees,
    extraPayment,
  ])

  const reset = () => {
    setPrincipal('100000')
    setRateValue('28')
    setRateMode('annual')
    setTenureValue('12')
    setTenureUnit('months')
    setFrequency('monthly')
    setRepaymentMode('reducing')
    setUpfrontFeeType('percent')
    setUpfrontFeeValue('1.5')
    setExtraFees([])
    setExtraPayment('0')
  }

  const copyResult = () => {
    if (!calc) return
    const text = `${FREQUENCY_LABEL[frequency]} payment: ${formatNaira(calc.basePayment + calc.recurringFeePerPeriod)} | Total repayment: ${formatNaira(calc.totalRepayment)} | Total interest & fees: ${formatNaira(calc.totalCostOfCredit)}${calc.effectiveAnnualRate !== null ? ` | Effective annual cost: ${formatPct(calc.effectiveAnnualRate)}` : ''}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportCSV = () => {
    if (!calc) return
    const header = 'Period,Payment (NGN),Principal (NGN),Interest (NGN),Fee (NGN),Balance (NGN)\n'
    const rows = calc.schedule
      .map(
        r =>
          `${r.period},${r.payment.toFixed(2)},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${r.fee.toFixed(2)},${r.balance.toFixed(2)}`
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'loan-amortization-schedule.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Amount */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loan Amount (₦)</label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(principal)}
          onChange={e => setPrincipal(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="100,000"
        />
      </div>

      {/* Rate */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-semibold text-gray-700">Interest Rate (%)</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setRateMode('annual')}
              className={`px-2.5 py-1 font-medium ${rateMode === 'annual' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setRateMode('monthly')}
              className={`px-2.5 py-1 font-medium ${rateMode === 'monthly' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              Monthly
            </button>
          </div>
        </div>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          value={rateValue}
          onChange={e => setRateValue(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
        <p className="text-xs text-gray-500 mt-1">
          Typical Nigerian bank/microfinance loans run roughly 20–35% per year. Digital loan apps
          commonly price in monthly terms instead — sometimes 5–20% per month — so check which one
          your lender actually quoted before entering a number here.
        </p>
      </div>

      {/* Tenure + frequency */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loan Tenure</label>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={tenureValue}
              onChange={e => setTenureValue(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <select
              value={tenureUnit}
              onChange={e => setTenureUnit(e.target.value as 'months' | 'years')}
              className="rounded-xl border border-gray-200 px-2 py-3 text-sm text-gray-700"
            >
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Repayment Frequency</label>
          <select
            value={frequency}
            onChange={e => setFrequency(e.target.value as Frequency)}
            className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700 h-[46px]"
          >
            <option value="monthly">Monthly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      {/* Reducing balance vs flat */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setRepaymentMode('reducing')}
          className={`flex-1 py-2.5 font-medium ${repaymentMode === 'reducing' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
        >
          Reducing Balance
        </button>
        <button
          type="button"
          onClick={() => setRepaymentMode('flat')}
          className={`flex-1 py-2.5 font-medium ${repaymentMode === 'flat' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
        >
          Flat Rate
        </button>
      </div>
      {repaymentMode === 'flat' && (
        <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 -mt-3">
          Flat rate charges interest on the full original amount for the whole term, then divides
          it evenly — it almost always costs more than the same headline rate on a reducing
          balance, because reducing balance only charges interest on what you still owe.
        </p>
      )}

      {/* Advanced: fees + extra payment */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
        >
          {showAdvanced ? '− Hide' : '+ Add'} fees &amp; extra payments
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Upfront / Processing Fee
              </label>
              <div className="flex gap-2">
                <select
                  value={upfrontFeeType}
                  onChange={e => setUpfrontFeeType(e.target.value as 'percent' | 'fixed')}
                  className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
                >
                  <option value="percent">%</option>
                  <option value="fixed">₦ fixed</option>
                </select>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatNumberInput(upfrontFeeValue)}
                  onChange={e => setUpfrontFeeValue(cleanNumberInput(e.target.value))}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Deducted from what you actually receive at disbursement — you still repay the full
                loan amount above.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Extra Payment per Period (₦, optional)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(extraPayment)}
                onChange={e => setExtraPayment(cleanNumberInput(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              {repaymentMode === 'flat' && (
                <p className="text-[11px] text-amber-700 mt-1">
                  On a flat-rate loan, extra payments shrink your outstanding balance and shorten
                  the payoff, but the interest for the term was already fixed upfront — they will
                  not reduce your total interest cost unless your lender explicitly agrees to
                  rebate it.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-600">Other Fees</label>
                <button
                  type="button"
                  onClick={addFee}
                  className="text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  + Add Fee
                </button>
              </div>
              <div className="space-y-2">
                {extraFees.map(fee => (
                  <div key={fee.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="e.g. Insurance, Admin fee"
                      value={fee.name}
                      onChange={e => updateFee(fee.id, { name: e.target.value })}
                      className="col-span-5 rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="₦ amount"
                      value={formatNumberInput(fee.amount)}
                      onChange={e => updateFee(fee.id, { amount: cleanNumberInput(e.target.value) })}
                      className="col-span-3 rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    />
                    <select
                      value={fee.recurring ? 'recurring' : 'one-time'}
                      onChange={e => updateFee(fee.id, { recurring: e.target.value === 'recurring' })}
                      className="col-span-3 rounded-lg border border-gray-200 px-1 py-2 text-xs"
                    >
                      <option value="one-time">One-time</option>
                      <option value="recurring">Every period</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeFee(fee.id)}
                      className="col-span-1 text-gray-500 hover:text-red-500"
                      aria-label="Remove fee"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {extraFees.length === 0 && (
                  <p className="text-[11px] text-gray-400">
                    No extra fees added — insurance, admin, or transfer charges some lenders add on
                    top of interest.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {calc ? (
        <>
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">{FREQUENCY_LABEL[frequency]} Payment</span>
              <span className="font-bold text-indigo-900">
                {formatNaira(calc.basePayment + calc.recurringFeePerPeriod)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">Total Repayment ({calc.actualPeriods} payments)</span>
              <span className="font-semibold text-indigo-900">{formatNaira(calc.totalRepayment)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">Total Interest &amp; Fees</span>
              <span className="font-semibold text-indigo-900">{formatNaira(calc.totalCostOfCredit)}</span>
            </div>
            <div className="flex justify-between border-t border-indigo-200 pt-3">
              <span className="font-bold text-indigo-900">Effective Annual Cost</span>
              <span className="text-2xl font-black text-indigo-900">
                {calc.effectiveAnnualRate !== null ? formatPct(calc.effectiveAnnualRate, 1) : '—'}
              </span>
            </div>
          </div>

          {calc.totalOneTimeFees > 0 && (
            <p className="text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 leading-relaxed">
              You&apos;ll receive <strong>{formatNaira(calc.netDisbursed)}</strong> after{' '}
              {formatNaira(calc.totalOneTimeFees)} in upfront fees are deducted, but you&apos;ll
              still repay the full {formatNaira(calc.P)} loan amount plus interest — that
              &apos;s {formatNaira(calc.totalCostOfCredit)} in total interest and fees, or{' '}
              {formatPct(calc.totalCostOfCredit / calc.P, 1)} of what you borrowed.
            </p>
          )}

          {/* Donut: principal vs cost */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-white rounded-2xl border border-gray-100 p-5">
            <svg viewBox="0 0 160 160" className="w-32 h-32 shrink-0">
              <circle cx={80} cy={80} r={60} fill="none" stroke="#fcd34d" strokeWidth={20} />
              <circle
                cx={80}
                cy={80}
                r={60}
                fill="none"
                stroke="#4338ca"
                strokeWidth={20}
                strokeDasharray={`${(calc.P / (calc.P + calc.totalCostOfCredit || 1)) * 2 * Math.PI * 60} ${2 * Math.PI * 60}`}
                strokeDashoffset={0}
                transform="rotate(-90 80 80)"
                strokeLinecap="butt"
              />
            </svg>
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-700 shrink-0" />
                <span className="text-gray-700">
                  Principal — {formatNaira(calc.P)} ({formatPct(calc.P / (calc.P + calc.totalCostOfCredit || 1), 0)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-300 shrink-0" />
                <span className="text-gray-700">
                  Interest &amp; Fees — {formatNaira(calc.totalCostOfCredit)} (
                  {formatPct(calc.totalCostOfCredit / (calc.P + calc.totalCostOfCredit || 1), 0)})
                </span>
              </div>
            </div>
          </div>

          {/* Balance over time */}
          {calc.schedule.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-600 mb-2">Balance Over Time</p>
              <svg viewBox="0 0 300 100" className="w-full h-24" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#4338ca"
                  strokeWidth={2}
                  points={calc.schedule
                    .map((r, idx) => {
                      const x = (idx / (calc.schedule.length - 1)) * 300
                      const y = 100 - (r.balance / calc.P) * 100
                      return `${x},${Math.max(0, Math.min(100, y))}`
                    })
                    .join(' ')}
                />
              </svg>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Period 1</span>
                <span>Period {calc.actualPeriods}</span>
              </div>
            </div>
          )}

          {/* Amortization schedule */}
          <div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSchedule(v => !v)}
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800"
              >
                {showSchedule ? '− Hide' : '+ Show'} full amortization schedule
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={exportCSV}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Print / Save PDF
                </button>
              </div>
            </div>

            {showSchedule && (
              <div className="mt-3 max-h-96 overflow-y-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-left text-gray-500">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Payment</th>
                      <th className="px-3 py-2">Principal</th>
                      <th className="px-3 py-2">Interest</th>
                      <th className="px-3 py-2">Fee</th>
                      <th className="px-3 py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.schedule.map(r => (
                      <tr key={r.period} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 text-gray-500">{r.period}</td>
                        <td className="px-3 py-1.5 font-medium text-gray-900">{formatNaira(r.payment)}</td>
                        <td className="px-3 py-1.5 text-gray-700">{formatNaira(r.principal)}</td>
                        <td className="px-3 py-1.5 text-gray-700">{formatNaira(r.interest)}</td>
                        <td className="px-3 py-1.5 text-gray-700">{formatNaira(r.fee)}</td>
                        <td className="px-3 py-1.5 text-gray-500">{formatNaira(r.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">Enter a loan amount and tenure to calculate</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={copyResult}
          disabled={!calc}
          className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy Summary'}
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
        For illustration only — not financial or legal advice, and not a substitute for your
        lender&apos;s official disclosure. Under the FCCPC&apos;s DEON Regulations 2025, digital and
        online lenders in Nigeria must clearly disclose interest rates, fees, and repayment
        schedules before you take a loan; the CBN&apos;s Consumer Protection Regulations require
        regulated institutions to disclose total charges and an effective rate, without fixing one
        official formula for it. The Effective Annual Cost above is this tool&apos;s own
        illustrative estimate, based only on the numbers you entered — always confirm the actual
        terms directly with your bank, microfinance institution, or lending app before borrowing.
      </p>
    </div>
  )
}
