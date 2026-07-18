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
  processingFee: number
  processingFeeVAT: number
  totalCost: number
  schedule: AmortizationRow[]
}

function calculateLoan(
  principal: number,
  annualRate: number,
  months: number,
  includeProcessingFee: boolean
): LoanResult {
  if (!principal || principal <= 0 || months <= 0) {
    return { emi: 0, totalRepayment: 0, totalInterest: 0, processingFee: 0, processingFeeVAT: 0, totalCost: 0, schedule: [] }
  }

  const r = annualRate / 100 / 12
  let emi: number

  if (r === 0) {
    emi = principal / months
  } else {
    emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  }

  const totalRepayment = emi * months
  const totalInterest = totalRepayment - principal

  // Processing fee: 1% of principal, min AED 500, max AED 2,500 + 5% VAT
  const rawFee = Math.max(500, Math.min(2500, principal * 0.01))
  const processingFee = includeProcessingFee ? rawFee : 0
  const processingFeeVAT = includeProcessingFee ? rawFee * 0.05 : 0
  const totalCost = totalRepayment + processingFee + processingFeeVAT

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

  return { emi, totalRepayment, totalInterest, processingFee, processingFeeVAT, totalCost, schedule }
}

function fmt(n: number) {
  return n.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function fmtDec(n: number) {
  return n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const TENURE_OPTIONS = [12, 24, 36, 48]
const RATE_PRESETS = [
  { label: 'Low', rate: 15.99, desc: 'Excellent profile' },
  { label: 'Mid', rate: 24.99, desc: 'Standard profile' },
  { label: 'High', rate: 39.99, desc: 'Higher risk profile' },
]

const PRESET_BUTTONS = [
  { label: '30K / 12M', amount: 30000, tenure: 12 },
  { label: '50K / 24M', amount: 50000, tenure: 24 },
  { label: '100K / 48M', amount: 100000, tenure: 48 },
]

export default function DeemLoanCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'

  const [amount, setAmount] = useState(50000)
  const [amountInput, setAmountInput] = useState('50000')
  const [income, setIncome] = useState(10000)
  const [incomeInput, setIncomeInput] = useState('10000')
  const [rate, setRate] = useState(24.99)
  const [rateInput, setRateInput] = useState('24.99')
  const [tenure, setTenure] = useState(48)
  const [includeProcessingFee, setIncludeProcessingFee] = useState(true)
  const [showFullSchedule, setShowFullSchedule] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [compRate, setCompRate] = useState(39.99)
  const [compTenure, setCompTenure] = useState(24)

  const result = useMemo(
    () => calculateLoan(amount, rate, tenure, includeProcessingFee),
    [amount, rate, tenure, includeProcessingFee]
  )
  const compResult = useMemo(
    () => calculateLoan(amount, compRate, compTenure, includeProcessingFee),
    [amount, compRate, compTenure, includeProcessingFee]
  )

  const maxEligible = income * 20
  const exceeds20x = amount > maxEligible
  const exceedsDBR = income > 0 && result.emi > income * 0.5
  const incomeLow = income > 0 && income < 5000

  const principalPct = result.totalRepayment > 0 ? (amount / result.totalRepayment) * 100 : 50
  const interestPct = 100 - principalPct

  const handleAmountInput = useCallback((val: string) => {
    setAmountInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) setAmount(Math.min(n, 500000))
  }, [])

  const handleIncomeInput = useCallback((val: string) => {
    setIncomeInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n > 0) setIncome(n)
  }, [])

  const handleRateInput = useCallback((val: string) => {
    setRateInput(val)
    const n = parseFloat(val)
    if (!isNaN(n) && n >= 0) setRate(Math.min(n, 99))
  }, [])

  const scheduleRows = showFullSchedule ? result.schedule : result.schedule.slice(0, 6)

  const t = isAr
    ? {
        presets: 'سيناريوهات سريعة',
        amount: 'مبلغ القرض (AED)',
        income: 'دخلك الشهري (AED)',
        rate: 'معدل الفائدة السنوي (%)',
        tenure: 'مدة القرض (أشهر)',
        processingFee: 'تضمين رسوم المعالجة (~1%)',
        ratePresets: 'شرائح مشرق النموذجية',
        monthly: 'القسط الشهري',
        totalRepay: 'إجمالي السداد',
        totalInterest: 'إجمالي الفوائد',
        feeTotal: 'رسوم المعالجة + VAT',
        totalCost: 'إجمالي التكلفة',
        schedule: 'جدول الاستهلاك',
        showFull: 'عرض كامل',
        hideFull: 'إخفاء',
        month: 'الشهر',
        payment: 'القسط',
        principal: 'الأصل',
        interest: 'الفائدة',
        balance: 'الرصيد',
        compare: 'مقارنة السيناريوهات',
        scenario1: 'السيناريو الأول',
        scenario2: 'السيناريو الثاني',
        maxEligible: 'الحد الأقصى المؤهل (20× الدخل)',
        warn20x: '⚠ يتجاوز 20× دخلك الشهري — حد المصرف المركزي',
        warnDBR: '⚠ القسط يتجاوز 50% من دخلك — قد يُرفض وفق قواعد الـDBR',
        warnIncome: '⚠ الدخل أقل من AED 5,000 — قد يؤثر على الأهلية',
        disclaimer: 'هذه الأداة للأغراض التوضيحية فقط وغير تابعة لشركة Deem Finance. المعدلات النموذجية: 15.99%–39.99% رصيد متناقص. تخضع الشروط الفعلية والموافقة لتقييم Deem Finance LLC المرخصة من المصرف المركزي الإماراتي.',
      }
    : {
        presets: 'Quick Scenarios',
        amount: 'Loan Amount (AED)',
        income: 'Monthly Income (AED)',
        rate: 'Annual Interest Rate (%)',
        tenure: 'Loan Tenure (Months)',
        processingFee: 'Include Processing Fee (~1%)',
        ratePresets: 'Deem typical rate tiers',
        monthly: 'Monthly Installment',
        totalRepay: 'Total Repayment',
        totalInterest: 'Total Interest',
        feeTotal: 'Processing Fee + VAT',
        totalCost: 'Total Cost of Loan',
        schedule: 'Amortization Schedule',
        showFull: 'Show Full Schedule',
        hideFull: 'Collapse',
        month: 'Month',
        payment: 'Payment',
        principal: 'Principal',
        interest: 'Interest',
        balance: 'Balance',
        compare: 'Compare Scenarios',
        scenario1: 'Scenario A',
        scenario2: 'Scenario B',
        maxEligible: 'Max Eligible (20× income)',
        warn20x: '⚠ Exceeds 20× monthly income — CBUAE maximum',
        warnDBR: '⚠ Installment exceeds 50% of income — may breach DBR limit',
        warnIncome: '⚠ Income below AED 5,000 — may affect eligibility',
        disclaimer: 'This tool is for illustrative purposes only. Not affiliated with Deem Finance LLC. Typical Deem rates: 15.99%–39.99% p.a. (reducing balance). Actual terms, approval, and rates are determined solely by Deem Finance LLC, regulated by the UAE Central Bank (CBUAE). Processing fee ~1% (min AED 500, max AED 2,500) + 5% VAT. Visit deem.io for official figures.',
      }

  return (
    <div className="space-y-6 font-sans" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Quick Presets */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{t.presets}</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_BUTTONS.map(p => (
            <button
              key={p.label}
              onClick={() => {
                setAmount(p.amount); setAmountInput(String(p.amount)); setTenure(p.tenure)
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:border-[#E05C2A] hover:text-[#E05C2A] text-gray-500 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Loan Amount */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.amount}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">AED</span>
            <input
              type="number"
              min={1000}
              max={500000}
              value={amountInput}
              onChange={e => handleAmountInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E05C2A] focus:border-transparent transition"
              aria-label={t.amount}
            />
          </div>
          <input
            type="range" min={1000} max={500000} step={1000} value={amount}
            onChange={e => { const v = Number(e.target.value); setAmount(v); setAmountInput(String(v)) }}
            className="w-full mt-2 accent-[#E05C2A] cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>AED 1,000</span><span>AED 500,000</span>
          </div>
          {exceeds20x && (
            <p className="mt-1.5 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{t.warn20x}</p>
          )}
        </div>

        {/* Monthly Income */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.income}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">AED</span>
            <input
              type="number"
              min={0}
              value={incomeInput}
              onChange={e => handleIncomeInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E05C2A] focus:border-transparent transition"
              aria-label={t.income}
            />
          </div>
          <input
            type="range" min={1000} max={100000} step={500} value={income}
            onChange={e => { const v = Number(e.target.value); setIncome(v); setIncomeInput(String(v)) }}
            className="w-full mt-2 accent-[#E05C2A] cursor-pointer"
          />
          {income > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {t.maxEligible}: <strong className="text-gray-800">AED {fmt(maxEligible)}</strong>
            </p>
          )}
          {incomeLow && (
            <p className="mt-1 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{t.warnIncome}</p>
          )}
        </div>

        {/* Rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.rate}</label>
          {/* Rate preset buttons */}
          <div className="flex gap-2 mb-2">
            {RATE_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { setRate(p.rate); setRateInput(String(p.rate)) }}
                title={`${p.desc} — ${p.rate}%`}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  rate === p.rate
                    ? 'bg-[#E05C2A] text-white border-[#E05C2A]'
                    : 'border-gray-200 text-gray-500 hover:border-[#E05C2A] hover:text-[#E05C2A]'
                }`}
              >
                {p.label} {p.rate}%
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="number" min={0} max={99} step={0.01}
              value={rateInput}
              onChange={e => handleRateInput(e.target.value)}
              className="w-full pr-8 pl-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#E05C2A] focus:border-transparent transition"
              aria-label={t.rate}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">%</span>
          </div>
          <input
            type="range" min={1} max={60} step={0.25} value={rate}
            onChange={e => { const v = Number(e.target.value); setRate(v); setRateInput(String(v)) }}
            className="w-full mt-2 accent-[#E05C2A] cursor-pointer"
          />
          <p className="text-xs text-gray-500 mt-0.5">Reducing balance basis</p>
        </div>

        {/* Tenure */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.tenure}</label>
          <div className="grid grid-cols-4 gap-2 mt-1">
            {TENURE_OPTIONS.map(m => (
              <button
                key={m}
                onClick={() => setTenure(m)}
                className={`py-2.5 text-sm font-semibold rounded-xl border transition-colors ${
                  tenure === m
                    ? 'bg-[#E05C2A] text-white border-[#E05C2A]'
                    : 'border-gray-200 text-gray-600 hover:border-[#E05C2A] hover:text-[#E05C2A]'
                }`}
                aria-pressed={tenure === m}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Max 48 months (CBUAE standard)</p>
        </div>

        {/* Processing Fee Toggle */}
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            onClick={() => setIncludeProcessingFee(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${includeProcessingFee ? 'bg-[#E05C2A]' : 'bg-gray-200'}`}
            aria-label={t.processingFee}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${includeProcessingFee ? 'left-5' : 'left-0.5'}`} />
          </button>
          <span className="text-sm font-medium text-gray-700">{t.processingFee}</span>
          {includeProcessingFee && result.processingFee > 0 && (
            <span className="text-xs text-gray-500">
              AED {fmtDec(result.processingFee)} + AED {fmtDec(result.processingFeeVAT)} VAT
            </span>
          )}
        </div>
      </div>

      {/* DBR Warning */}
      {exceedsDBR && (
        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{t.warnDBR}</p>
      )}

      {/* Results */}
      {result.emi > 0 && (
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {/* Hero EMI */}
          <div className="bg-gradient-to-br from-[#1C1C2E] via-[#2D1B14] to-[#1C1C2E] px-6 py-5 text-white">
            <p className="text-xs text-white/50 uppercase tracking-widest font-medium mb-1">{t.monthly}</p>
            <p className="text-4xl font-black tracking-tight">AED {fmtDec(result.emi)}</p>
            <p className="text-xs text-white/40 mt-1">
              {rate}% p.a. reducing balance · {tenure} months
            </p>
          </div>

          <div className="bg-white p-5 space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4">
              <Stat label={t.totalRepay} value={`AED ${fmt(result.totalRepayment)}`} />
              <Stat label={t.totalInterest} value={`AED ${fmt(result.totalInterest)}`} accent />
              {includeProcessingFee && (
                <Stat label={t.feeTotal} value={`AED ${fmtDec(result.processingFee + result.processingFeeVAT)}`} />
              )}
              <Stat label={t.totalCost} value={`AED ${fmt(result.totalCost)}`} bold />
            </div>

            {/* Principal vs Interest bar */}
            <div>
              <div className="flex rounded-full overflow-hidden h-3">
                <div className="bg-[#1C1C2E] transition-all duration-500" style={{ width: `${principalPct}%` }} />
                <div className="bg-[#E05C2A] transition-all duration-500" style={{ width: `${interestPct}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#1C1C2E]" />
                  Principal {principalPct.toFixed(1)}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#E05C2A]" />
                  Interest {interestPct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Deem-specific note */}
            <p className="text-xs text-gray-500 border-t border-gray-100 pt-3">
              Based on Deem Finance typical rates (15.99%–39.99% reducing balance). Actual rate depends on your credit profile.
            </p>
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
              className="text-xs font-semibold text-[#E05C2A] hover:underline"
            >
              {showFullSchedule ? t.hideFull : t.showFull}
            </button>
          </div>
          <div className="rounded-xl border border-gray-100 overflow-hidden text-xs">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[t.month, t.payment, t.principal, t.interest, t.balance].map(h => (
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
                    <td className="px-3 py-2.5 text-[#E05C2A] font-medium">{fmtDec(row.interest)}</td>
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
          className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#E05C2A] transition-colors"
        >
          <span className="text-lg">{showComparison ? '−' : '+'}</span>
          {t.compare}
        </button>

        {showComparison && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#E05C2A]/30 bg-orange-50/30 p-4 space-y-3">
              <p className="font-bold text-sm text-gray-800">{t.scenario1} — Current</p>
              <Stat label="Rate" value={`${rate}%`} />
              <Stat label="Tenure" value={`${tenure} months`} />
              <Stat label={t.monthly} value={`AED ${fmtDec(result.emi)}`} accent />
              <Stat label={t.totalInterest} value={`AED ${fmt(result.totalInterest)}`} />
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <p className="font-bold text-sm text-gray-800">{t.scenario2}</p>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rate (%)</label>
                <input
                  type="number" min={0} max={99} step={0.25} value={compRate}
                  onChange={e => setCompRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tenure (months)</label>
                <input
                  type="number" min={1} max={48} value={compTenure}
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

      {/* Disclaimer */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-xs text-gray-500 leading-relaxed space-y-1.5">
        <p className="font-semibold text-gray-600">Important Disclaimer</p>
        <p>{t.disclaimer}</p>
        <p>CBUAE rules: max loan = 20× monthly income · max tenure 48 months · monthly installments ≤ 50% of income · reducing balance method.</p>
      </div>

      {/* Apply CTA */}
      <a
        href="https://www.deem.io/personal-loans"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#E05C2A] hover:bg-[#c44e22] text-white font-bold text-sm transition-colors"
      >
        Apply at Deem Finance
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}

function Stat({
  label, value, accent = false, bold = false,
}: {
  label: string; value: string; accent?: boolean; bold?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`font-bold text-sm ${accent ? 'text-[#E05C2A]' : bold ? 'text-gray-900' : 'text-gray-800'}`}>{value}</p>
    </div>
  )
}
