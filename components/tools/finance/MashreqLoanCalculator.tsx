'use client'

import { useState, useMemo, useCallback } from 'react'

type Props = { locale?: string }

type AmortizationRow = {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

type LoanResult = {
  emi: number
  totalRepayment: number
  totalInterest: number
  schedule: AmortizationRow[]
}

function calculateLoan(principal: number, annualRate: number, months: number): LoanResult {
  if (!principal || principal <= 0 || months <= 0) {
    return { emi: 0, totalRepayment: 0, totalInterest: 0, schedule: [] }
  }

  // Zero-rate edge case
  if (annualRate === 0) {
    const emi = principal / months
    const schedule: AmortizationRow[] = []
    let balance = principal
    for (let m = 1; m <= months; m++) {
      balance -= emi
      schedule.push({ month: m, payment: emi, principal: emi, interest: 0, balance: Math.max(0, balance) })
    }
    return { emi, totalRepayment: principal, totalInterest: 0, schedule }
  }

  const r = annualRate / 12 / 100
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  const totalRepayment = emi * months
  const totalInterest = totalRepayment - principal

  const schedule: AmortizationRow[] = []
  let balance = principal
  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    const principalPaid = emi - interest
    balance -= principalPaid
    schedule.push({
      month: m,
      payment: emi,
      principal: principalPaid,
      interest,
      balance: Math.max(0, balance),
    })
  }

  return { emi, totalRepayment, totalInterest, schedule }
}

function fmt(n: number) {
  return n.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function fmtDec(n: number) {
  return n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const PRESET_BUTTONS = [
  { label: '100K / 36M', amount: 100000, tenure: 36 },
  { label: '250K / 48M', amount: 250000, tenure: 48 },
  { label: '500K / 48M', amount: 500000, tenure: 48 },
]

const TENURE_OPTIONS = [12, 24, 36, 48, 60]

export default function MashreqLoanCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'

  const [amount, setAmount] = useState(500000)
  const [amountInput, setAmountInput] = useState('500000')
  const [rate, setRate] = useState(5.99)
  const [rateInput, setRateInput] = useState('5.99')
  const [tenure, setTenure] = useState(48)
  const [isIslamic, setIsIslamic] = useState(false)
  const [showFullSchedule, setShowFullSchedule] = useState(false)
  const [salary, setSalary] = useState('')
  const [showComparison, setShowComparison] = useState(false)
  const [compRate, setCompRate] = useState(8.99)
  const [compTenure, setCompTenure] = useState(60)

  const result = useMemo(() => calculateLoan(amount, rate, tenure), [amount, rate, tenure])
  const compResult = useMemo(() => calculateLoan(amount, compRate, compTenure), [amount, compRate, compTenure])

  const maxEligible = salary ? parseFloat(salary) * 20 : null
  const dtiWarning = salary && result.emi > parseFloat(salary) * 0.5
  const tenureWarning = tenure > 48

  const principalPct = result.totalRepayment > 0 ? (amount / result.totalRepayment) * 100 : 50
  const interestPct = 100 - principalPct

  const handleAmountInput = useCallback((val: string) => {
    setAmountInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) setAmount(Math.min(n, 2000000))
  }, [])

  const handleRateInput = useCallback((val: string) => {
    setRateInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0) setRate(Math.min(n, 36))
  }, [])

  const scheduleRows = showFullSchedule ? result.schedule : result.schedule.slice(0, 6)

  const t = isAr ? {
    title: 'حاسبة قروض مشرق',
    subtitle: 'الإمارات العربية المتحدة',
    conventional: 'تقليدي',
    islamic: 'إسلامي',
    amount: 'مبلغ القرض (AED)',
    rate: 'معدل الفائدة السنوي (%)',
    profitRate: 'معدل الربح السنوي (%)',
    tenure: 'مدة القرض (أشهر)',
    monthly: 'القسط الشهري',
    totalRepay: 'إجمالي السداد',
    totalInterest: 'إجمالي الفائدة',
    totalProfit: 'إجمالي الربح',
    schedule: 'جدول السداد',
    showFull: 'عرض الجدول كاملاً',
    hideFull: 'إخفاء',
    month: 'الشهر',
    payment: 'القسط',
    principal: 'الأصل',
    interest: 'الفائدة',
    balance: 'الرصيد المتبقي',
    salary: 'راتبك الشهري (AED) — اختياري',
    maxEligible: 'الحد الأقصى المؤهل',
    warning50: '⚠ يتجاوز القسط 50% من راتبك — قد يُرفض وفق قواعد المصرف المركزي',
    warning48: '⚠ تتجاوز المدة 48 شهراً — الحد المعتاد وفق قواعد المصرف المركزي',
    compare: 'مقارنة السيناريوهات',
    scenario1: 'السيناريو الأول',
    scenario2: 'السيناريو الثاني',
    disclaimer: 'هذه الأداة للأغراض التوضيحية فقط وغير تابعة لبنك مشرق. المعدلات والشروط الفعلية تخضع لتقييم الائتمان والجهة وتحويل الراتب. الشروط والأحكام سارية.',
  } : {
    title: 'Mashreq Loan Calculator',
    subtitle: 'UAE',
    conventional: 'Conventional',
    islamic: 'Islamic',
    amount: 'Loan Amount (AED)',
    rate: 'Annual Interest Rate (%)',
    profitRate: 'Annual Profit Rate (%)',
    tenure: 'Loan Tenure (Months)',
    monthly: 'Monthly Installment',
    totalRepay: 'Total Repayment',
    totalInterest: 'Total Interest Paid',
    totalProfit: 'Total Profit Paid',
    schedule: 'Amortization Schedule',
    showFull: 'Show Full Schedule',
    hideFull: 'Collapse',
    month: 'Month',
    payment: 'Payment',
    principal: 'Principal',
    interest: 'Interest',
    balance: 'Balance',
    salary: 'Your Monthly Salary (AED) — optional',
    maxEligible: 'Max Eligible (20× salary)',
    warning50: '⚠ Installment exceeds 50% of salary — may not qualify per CBUAE rules',
    warning48: '⚠ Tenure exceeds 48 months — standard CBUAE limit for personal loans',
    compare: 'Compare Scenarios',
    scenario1: 'Scenario A',
    scenario2: 'Scenario B',
    disclaimer: 'This tool is for illustrative purposes only and is not affiliated with Mashreq Bank. Actual rates, approval, and terms depend on your credit profile, employer, and Mashreq Bank\'s assessment. Terms & conditions apply. Consult Mashreq Bank or a financial advisor for personalised advice.',
  }

  return (
    <div className="space-y-6 font-sans" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Islamic / Conventional Toggle */}
      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold ${!isIslamic ? 'text-[#C8960C]' : 'text-gray-500'}`}>{t.conventional}</span>
        <button
          onClick={() => setIsIslamic(v => !v)}
          aria-label="Toggle Islamic mode"
          className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isIslamic ? 'bg-emerald-600' : 'bg-[#C8960C]'}`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${isIslamic ? 'left-7' : 'left-1'}`} />
        </button>
        <span className={`text-sm font-semibold ${isIslamic ? 'text-emerald-600' : 'text-gray-500'}`}>{t.islamic}</span>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESET_BUTTONS.map(p => (
          <button
            key={p.label}
            onClick={() => { setAmount(p.amount); setAmountInput(String(p.amount)); setTenure(p.tenure) }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:border-[#C8960C] hover:text-[#C8960C] text-gray-500 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Loan Amount */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.amount}</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">AED</span>
              <input
                type="number"
                min={10000}
                max={2000000}
                value={amountInput}
                onChange={e => handleAmountInput(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8960C] focus:border-transparent transition"
                aria-label={t.amount}
              />
            </div>
          </div>
          <input
            type="range"
            min={10000}
            max={2000000}
            step={10000}
            value={amount}
            onChange={e => { const v = Number(e.target.value); setAmount(v); setAmountInput(String(v)) }}
            className="w-full mt-2 accent-[#C8960C] cursor-pointer"
            aria-label="Loan amount slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>AED 10,000</span><span>AED 2,000,000</span>
          </div>
        </div>

        {/* Rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {isIslamic ? t.profitRate : t.rate}
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={36}
              step={0.01}
              value={rateInput}
              onChange={e => handleRateInput(e.target.value)}
              className="w-full pr-8 pl-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C8960C] focus:border-transparent transition"
              aria-label={isIslamic ? t.profitRate : t.rate}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">%</span>
          </div>
          <input
            type="range"
            min={0}
            max={36}
            step={0.25}
            value={rate}
            onChange={e => { const v = Number(e.target.value); setRate(v); setRateInput(String(v)) }}
            className="w-full mt-2 accent-[#C8960C] cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>0%</span><span>36%</span>
          </div>
        </div>

        {/* Tenure */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.tenure}</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {TENURE_OPTIONS.map(m => (
              <button
                key={m}
                onClick={() => setTenure(m)}
                className={`flex-1 min-w-[40px] py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                  tenure === m
                    ? 'bg-[#C8960C] text-white border-[#C8960C]'
                    : 'border-gray-200 text-gray-600 hover:border-[#C8960C] hover:text-[#C8960C]'
                }`}
                aria-pressed={tenure === m}
              >
                {m}
              </button>
            ))}
          </div>
          {tenureWarning && (
            <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{t.warning48}</p>
          )}
        </div>

        {/* Optional salary */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-500 mb-1.5">{t.salary}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">AED</span>
            <input
              type="number"
              min={0}
              value={salary}
              onChange={e => setSalary(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C8960C] focus:border-transparent transition text-sm"
              aria-label={t.salary}
            />
          </div>
          {maxEligible !== null && (
            <p className="mt-1.5 text-xs text-gray-500">
              {t.maxEligible}: <strong className="text-gray-800">AED {fmt(maxEligible)}</strong>
              {amount > maxEligible && <span className="text-red-500 ml-2">⚠ Exceeds 20× salary limit</span>}
            </p>
          )}
          {dtiWarning && (
            <p className="mt-1 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{t.warning50}</p>
          )}
        </div>
      </div>

      {/* Results */}
      {result.emi > 0 && (
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {/* Hero EMI */}
          <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] px-6 py-5 text-white">
            <p className="text-sm text-white/60 mb-1 uppercase tracking-widest font-medium">{t.monthly}</p>
            <p className="text-4xl font-black tracking-tight">
              AED {fmtDec(result.emi)}
            </p>
          </div>

          <div className="bg-white p-5 space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4">
              <Stat label={t.totalRepay} value={`AED ${fmt(result.totalRepayment)}`} />
              <Stat label={isIslamic ? t.totalProfit : t.totalInterest} value={`AED ${fmt(result.totalInterest)}`} accent />
            </div>

            {/* Pie-style bar */}
            <div>
              <div className="flex rounded-full overflow-hidden h-3">
                <div className="bg-[#1A1A2E] transition-all duration-500" style={{ width: `${principalPct}%` }} />
                <div className="bg-[#C8960C] transition-all duration-500" style={{ width: `${interestPct}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#1A1A2E]" />
                  Principal {principalPct.toFixed(1)}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#C8960C]" />
                  {isIslamic ? 'Profit' : 'Interest'} {interestPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amortization Table */}
      {result.schedule.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 text-sm">{t.schedule}</h3>
            <button
              onClick={() => setShowFullSchedule(v => !v)}
              className="text-xs font-semibold text-[#C8960C] hover:underline"
            >
              {showFullSchedule ? t.hideFull : t.showFull}
            </button>
          </div>
          <div className="rounded-xl border border-gray-100 overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[t.month, t.payment, t.principal, isIslamic ? 'Profit' : t.interest, t.balance].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row, i) => (
                  <tr key={row.month} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-3 py-2.5 text-gray-600 font-medium">{row.month}</td>
                    <td className="px-3 py-2.5 text-gray-800 font-semibold">{fmtDec(row.payment)}</td>
                    <td className="px-3 py-2.5 text-gray-700">{fmtDec(row.principal)}</td>
                    <td className="px-3 py-2.5 text-[#C8960C] font-medium">{fmtDec(row.interest)}</td>
                    <td className="px-3 py-2.5 text-gray-600">{fmtDec(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comparison Mode */}
      <div>
        <button
          onClick={() => setShowComparison(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#C8960C] transition-colors"
        >
          <span className="text-lg">{showComparison ? '−' : '+'}</span>
          {t.compare}
        </button>

        {showComparison && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scenario A */}
            <div className="rounded-xl border border-[#C8960C]/30 bg-amber-50/30 p-4 space-y-3">
              <p className="font-bold text-sm text-gray-800">{t.scenario1} — Current</p>
              <Stat label="Rate" value={`${rate}%`} />
              <Stat label="Tenure" value={`${tenure} months`} />
              <Stat label={t.monthly} value={`AED ${fmtDec(result.emi)}`} accent />
              <Stat label={t.totalInterest} value={`AED ${fmt(result.totalInterest)}`} />
            </div>
            {/* Scenario B */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <p className="font-bold text-sm text-gray-800">{t.scenario2}</p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={36}
                  step={0.25}
                  value={compRate}
                  onChange={e => setCompRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tenure (months)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={compTenure}
                  onChange={e => setCompTenure(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <Stat label={t.monthly} value={`AED ${fmtDec(compResult.emi)}`} accent />
              <Stat label={t.totalInterest} value={`AED ${fmt(compResult.totalInterest)}`} />
              {compResult.emi > 0 && result.emi > 0 && (
                <p className={`text-xs font-semibold ${compResult.emi < result.emi ? 'text-emerald-600' : 'text-red-500'}`}>
                  {compResult.emi < result.emi
                    ? `Save AED ${fmtDec(result.emi - compResult.emi)}/mo`
                    : `Costs AED ${fmtDec(compResult.emi - result.emi)}/mo more`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CBUAE Disclaimer */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-xs text-gray-500 leading-relaxed space-y-1.5">
        <p className="font-semibold text-gray-600">Important Disclaimer</p>
        <p>{t.disclaimer}</p>
        <p>Maximum personal loan: 20× monthly salary. Max tenure: generally 48 months (CBUAE). Monthly deductions capped at ~50% of income. Reducing balance method, 365-day year.</p>
      </div>

      {/* Apply CTA */}
      <a
        href="https://www.mashreq.com/en/uae/personal-banking/loans/personal-loans/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#C8960C] hover:bg-[#b07e0a] text-white font-bold text-sm transition-colors"
      >
        Apply at Mashreq Bank
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`font-bold text-sm ${accent ? 'text-[#C8960C]' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
