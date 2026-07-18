'use client'

import { useState, useCallback } from 'react'

type Props = { locale: string }

// ─── Country config ───────────────────────────────────────────────────────────
const COUNTRIES = [
  {
    value: 'uae',
    label: 'UAE',
    labelAr: 'الإمارات',
    currency: 'AED',
    maxTenure: 48,
    dbr: 50,
    salaryMultiplier: 20,
    typicalRates: { min: 4, max: 12 },
    notes: 'Personal loans typically up to 20× monthly salary, max 48 months.',
    notesAr: 'القروض الشخصية حتى 20× الراتب الشهري، بحد أقصى 48 شهراً.',
  },
  {
    value: 'saudi',
    label: 'Saudi Arabia',
    labelAr: 'السعودية',
    currency: 'SAR',
    maxTenure: 60,
    dbr: 33,
    salaryMultiplier: 33,
    typicalRates: { min: 3.5, max: 10 },
    notes: 'SAMA caps DBR at 33% for consumer finance. Max 60 months.',
    notesAr: 'تُقيّد ساما نسبة الدين عند 33%. الحد الأقصى 60 شهراً.',
  },
  {
    value: 'qatar',
    label: 'Qatar',
    labelAr: 'قطر',
    currency: 'QAR',
    maxTenure: 60,
    dbr: 50,
    salaryMultiplier: 0,
    typicalRates: { min: 4, max: 11 },
    notes: 'QCB guidelines recommend DBR below 50%. Max 60 months.',
    notesAr: 'إرشادات QCB توصي بنسبة دين أقل من 50%. الحد الأقصى 60 شهراً.',
  },
  {
    value: 'kuwait',
    label: 'Kuwait',
    labelAr: 'الكويت',
    currency: 'KWD',
    maxTenure: 84,
    dbr: 40,
    salaryMultiplier: 0,
    typicalRates: { min: 3, max: 9 },
    notes: 'CBK limits installments to 40% of salary. Max 7 years.',
    notesAr: 'يحدد البنك المركزي الكويتي الأقساط بـ 40% من الراتب.',
  },
  {
    value: 'bahrain',
    label: 'Bahrain',
    labelAr: 'البحرين',
    currency: 'BHD',
    maxTenure: 60,
    dbr: 50,
    salaryMultiplier: 0,
    typicalRates: { min: 4, max: 12 },
    notes: 'CBB guidelines cap total monthly commitments at 50% of salary.',
    notesAr: 'تُقيّد مصرف البحرين المركزي الالتزامات عند 50% من الراتب.',
  },
  {
    value: 'oman',
    label: 'Oman',
    labelAr: 'عُمان',
    currency: 'OMR',
    maxTenure: 60,
    dbr: 50,
    salaryMultiplier: 0,
    typicalRates: { min: 4, max: 11 },
    notes: 'CBO guidelines: DBR capped at 50%, max 60 months.',
    notesAr: 'إرشادات البنك المركزي: نسبة دين بحد أقصى 50%.',
  },
  {
    value: 'egypt',
    label: 'Egypt',
    labelAr: 'مصر',
    currency: 'EGP',
    maxTenure: 60,
    dbr: 35,
    salaryMultiplier: 0,
    typicalRates: { min: 20, max: 35 },
    notes: 'CBE rates are higher due to inflation. Personal loans 20–35% p.a.',
    notesAr: 'معدلات البنك المركزي المصري أعلى بسبب التضخم. 20–35% سنوياً.',
  },
]

const LOAN_TYPES = [
  { value: 'personal', label: 'Personal Loan', labelAr: 'قرض شخصي' },
  { value: 'car', label: 'Car / Auto Loan', labelAr: 'قرض سيارة' },
  { value: 'home', label: 'Home / Mortgage', labelAr: 'تمويل عقاري' },
]

const CALC_MODES = [
  { value: 'reducing', label: 'Reducing Balance', labelAr: 'رصيد متناقص' },
  { value: 'flat', label: 'Flat Rate', labelAr: 'سعر ثابت' },
  { value: 'islamic', label: 'Islamic / Profit', labelAr: 'تمويل إسلامي' },
]

// ─── Types ────────────────────────────────────────────────────────────────────
type AmortRow = {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

type Result = {
  emi: number
  totalPayment: number
  totalInterest: number
  schedule: AmortRow[]
  currency: string
  dbr: number | null
  dbrWarning: boolean
  dbrLimit: number
}

// ─── Calculation logic ────────────────────────────────────────────────────────
function calcReducing(P: number, annualRate: number, n: number): { emi: number; schedule: AmortRow[] } {
  const r = annualRate / 100 / 12
  const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const schedule: AmortRow[] = []
  let balance = P
  for (let i = 1; i <= n; i++) {
    const interest = balance * r
    const principal = emi - interest
    balance = Math.max(0, balance - principal)
    schedule.push({ month: i, payment: emi, principal, interest, balance })
  }
  return { emi, schedule }
}

function calcFlat(P: number, annualRate: number, n: number): { emi: number; schedule: AmortRow[] } {
  const totalInterest = (P * annualRate * (n / 12)) / 100
  const emi = (P + totalInterest) / n
  const schedule: AmortRow[] = []
  let balance = P
  const principalPerMonth = P / n
  const interestPerMonth = totalInterest / n
  for (let i = 1; i <= n; i++) {
    balance = Math.max(0, balance - principalPerMonth)
    schedule.push({
      month: i,
      payment: emi,
      principal: principalPerMonth,
      interest: interestPerMonth,
      balance,
    })
  }
  return { emi, schedule }
}

function calcIslamic(P: number, annualProfitRate: number, n: number): { emi: number; schedule: AmortRow[] } {
  const totalProfit = (P * annualProfitRate * (n / 12)) / 100
  const emi = (P + totalProfit) / n
  const schedule: AmortRow[] = []
  let balance = P + totalProfit
  const principalPerMonth = P / n
  const profitPerMonth = totalProfit / n
  for (let i = 1; i <= n; i++) {
    balance = Math.max(0, balance - emi)
    schedule.push({
      month: i,
      payment: emi,
      principal: principalPerMonth,
      interest: profitPerMonth,
      balance,
    })
  }
  return { emi, schedule }
}

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtShort(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LoanEMICalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [country, setCountry] = useState('uae')
  const [loanType, setLoanType] = useState('personal')
  const [calcMode, setCalcMode] = useState('reducing')
  const [amount, setAmount] = useState('')
  const [rate, setRate] = useState('')
  const [tenure, setTenure] = useState('')
  const [tenureUnit, setTenureUnit] = useState<'months' | 'years'>('months')
  const [salary, setSalary] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [processingFee, setProcessingFee] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const cfg = COUNTRIES.find(c => c.value === country)!

  const validate = useCallback(() => {
    const errs: Record<string, string> = {}
    const P = parseFloat(amount)
    const r = parseFloat(rate)
    const t = parseFloat(tenure)
    if (!P || P <= 0) errs.amount = isAr ? 'أدخل مبلغ صحيح' : 'Enter a valid amount'
    if (!r || r <= 0 || r > 100) errs.rate = isAr ? 'أدخل نسبة صحيحة' : 'Enter a valid rate (0–100)'
    if (!t || t <= 0) errs.tenure = isAr ? 'أدخل مدة صحيحة' : 'Enter a valid tenure'
    const months = tenureUnit === 'years' ? t * 12 : t
    if (months > cfg.maxTenure)
      errs.tenure = isAr
        ? `الحد الأقصى ${cfg.maxTenure} شهراً في ${cfg.labelAr}`
        : `Max tenure in ${cfg.label} is ${cfg.maxTenure} months`
    return errs
  }, [amount, rate, tenure, tenureUnit, cfg, isAr])

  function calculate() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    const down = parseFloat(downPayment) || 0
    const fee = parseFloat(processingFee) || 0
    const P = parseFloat(amount) - down
    const r = parseFloat(rate)
    const rawMonths = parseFloat(tenure)
    const n = tenureUnit === 'years' ? rawMonths * 12 : rawMonths

    let emi: number, schedule: AmortRow[]
    if (calcMode === 'reducing') {
      ;({ emi, schedule } = calcReducing(P, r, n))
    } else if (calcMode === 'flat') {
      ;({ emi, schedule } = calcFlat(P, r, n))
    } else {
      ;({ emi, schedule } = calcIslamic(P, r, n))
    }

    const totalPayment = emi * n + fee
    const totalInterest = totalPayment - P - fee

    const salaryVal = parseFloat(salary)
    let dbr: number | null = null
    let dbrWarning = false
    if (salaryVal > 0) {
      dbr = (emi / salaryVal) * 100
      dbrWarning = dbr > cfg.dbr
    }

    setResult({ emi, totalPayment, totalInterest, schedule, currency: cfg.currency, dbr, dbrWarning, dbrLimit: cfg.dbr })
    setShowSchedule(false)
  }

  function reset() {
    setAmount('')
    setRate('')
    setTenure('')
    setSalary('')
    setDownPayment('')
    setProcessingFee('')
    setResult(null)
    setErrors({})
    setShowSchedule(false)
  }

  // Pie chart SVG (principal vs interest)
  function PieChart({ principal, interest }: { principal: number; interest: number }) {
    const total = principal + interest
    if (!total) return null
    const pct = principal / total
    const angle = pct * 2 * Math.PI
    const x1 = 50 + 40 * Math.sin(0)
    const y1 = 50 - 40 * Math.cos(0)
    const x2 = 50 + 40 * Math.sin(angle)
    const y2 = 50 - 40 * Math.cos(angle)
    const large = angle > Math.PI ? 1 : 0
    return (
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        {/* Interest arc */}
        <circle cx="50" cy="50" r="40" fill="#fca5a5" />
        {/* Principal arc */}
        <path
          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${large} 1 ${x2} ${y2} Z`}
          fill="#059669"
        />
        <circle cx="50" cy="50" r="22" fill="white" />
      </svg>
    )
  }

  const t = {
    title: isAr ? 'حاسبة القسط الشهري' : 'Loan EMI Calculator',
    amount: isAr ? 'مبلغ القرض' : 'Loan Amount',
    rate: isAr ? 'معدل الفائدة (% سنوياً)' : 'Interest / Profit Rate (% p.a.)',
    tenure: isAr ? 'مدة القرض' : 'Loan Tenure',
    months: isAr ? 'شهور' : 'Months',
    years: isAr ? 'سنوات' : 'Years',
    country: isAr ? 'الدولة' : 'Country',
    loanType: isAr ? 'نوع القرض' : 'Loan Type',
    calcMode: isAr ? 'طريقة الاحتساب' : 'Calculation Method',
    salary: isAr ? 'راتبك الشهري (اختياري)' : 'Monthly Salary (optional)',
    downPayment: isAr ? 'الدفعة الأولى (اختياري)' : 'Down Payment (optional)',
    processingFee: isAr ? 'رسوم المعالجة (اختياري)' : 'Processing Fee (optional)',
    advanced: isAr ? 'خيارات متقدمة' : 'Advanced Options',
    calculate: isAr ? 'احسب' : 'Calculate',
    reset: isAr ? 'إعادة تعيين' : 'Reset',
    results: isAr ? 'نتائجك' : 'Your Results',
    monthlyEMI: isAr ? 'القسط الشهري' : 'Monthly EMI',
    totalPayment: isAr ? 'إجمالي المدفوعات' : 'Total Payment',
    totalInterest: isAr ? 'إجمالي الفوائد' : 'Total Interest / Profit',
    principal: isAr ? 'أصل القرض' : 'Principal Amount',
    dbr: isAr ? 'نسبة عبء الدين' : 'Debt Burden Ratio',
    dbrWarn: isAr
      ? `تجاوزت نسبة الدين ${cfg.dbr}% — الحد الموصى به في ${cfg.labelAr}`
      : `EMI exceeds ${cfg.dbr}% DBR limit recommended in ${cfg.label}`,
    dbrOk: isAr ? 'ضمن الحدود الموصى بها' : 'Within recommended limits',
    schedule: isAr ? 'جدول الاستهلاك' : 'Amortization Schedule',
    hideSchedule: isAr ? 'إخفاء الجدول' : 'Hide Schedule',
    showSchedule: isAr ? 'عرض الجدول' : 'Show Schedule',
    month: isAr ? 'الشهر' : 'Month',
    payment: isAr ? 'القسط' : 'Payment',
    interestCol: isAr ? 'الفائدة' : 'Interest',
    principalCol: isAr ? 'الأصل' : 'Principal',
    balance: isAr ? 'الرصيد' : 'Balance',
    disclaimer: isAr
      ? 'هذه أداة تقدير فقط. الشروط الفعلية تختلف حسب البنك وملفك الائتماني. الحسابات تتم في متصفحك فقط.'
      : 'Estimation tool only. Actual terms vary by bank and credit profile. Calculations happen in your browser.',
    countryNote: isAr ? cfg.notesAr : cfg.notes,
    typicalRate: isAr
      ? `المعدلات الشائعة في ${cfg.labelAr}: ${cfg.typicalRates.min}–${cfg.typicalRates.max}%`
      : `Typical rates in ${cfg.label}: ${cfg.typicalRates.min}–${cfg.typicalRates.max}%`,
    enter: isAr ? 'أدخل' : 'Enter',
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Row 1: Country + Loan Type ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.country}</label>
          <select
            value={country}
            onChange={e => { setCountry(e.target.value); setResult(null) }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {COUNTRIES.map(c => (
              <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.loanType}</label>
          <select
            value={loanType}
            onChange={e => setLoanType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {LOAN_TYPES.map(l => (
              <option key={l.value} value={l.value}>{isAr ? l.labelAr : l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Calculation mode ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.calcMode}</label>
        <div className="flex gap-2 flex-wrap">
          {CALC_MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setCalcMode(m.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                calcMode === m.value
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isAr ? m.labelAr : m.label}
            </button>
          ))}
        </div>
        {calcMode === 'islamic' && (
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            {isAr
              ? 'يُعرض القسط كـ"قسط شهري" وليس "فائدة". التقديرات استرشادية فقط.'
              : 'Installment shown as "Monthly Payment" not "interest". Estimates are illustrative only.'}
          </p>
        )}
      </div>

      {/* ── Loan Amount ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.amount}</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
            {cfg.currency}
          </span>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={t.enter}
            className={`w-full pl-14 pr-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${errors.amount ? 'border-red-400' : 'border-gray-200'}`}
          />
        </div>
        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
      </div>

      {/* ── Rate ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-gray-700">{t.rate}</label>
          <span className="text-xs text-emerald-600 font-medium">{t.typicalRate}</span>
        </div>
        <div className="relative">
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={rate}
            onChange={e => setRate(e.target.value)}
            placeholder={`${cfg.typicalRates.min}–${cfg.typicalRates.max}`}
            className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${errors.rate ? 'border-red-400' : 'border-gray-200'}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">%</span>
        </div>
        {errors.rate && <p className="text-xs text-red-500 mt-1">{errors.rate}</p>}
      </div>

      {/* ── Tenure ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.tenure}</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={tenure}
            onChange={e => setTenure(e.target.value)}
            placeholder={t.enter}
            className={`flex-1 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${errors.tenure ? 'border-red-400' : 'border-gray-200'}`}
          />
          <button
            onClick={() => setTenureUnit('months')}
            className={`px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${tenureUnit === 'months' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {t.months}
          </button>
          <button
            onClick={() => setTenureUnit('years')}
            className={`px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${tenureUnit === 'years' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {t.years}
          </button>
        </div>
        {errors.tenure && <p className="text-xs text-red-500 mt-1">{errors.tenure}</p>}
      </div>

      {/* ── Advanced Options ── */}
      <div>
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-2 text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
        >
          <span>{showAdvanced ? '▲' : '▼'}</span>
          {t.advanced}
        </button>
        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Salary for DBR */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.salary}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">{cfg.currency}</span>
                <input type="number" min="0" value={salary} onChange={e => setSalary(e.target.value)}
                  className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
            </div>
            {/* Down payment (car/home) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.downPayment}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">{cfg.currency}</span>
                <input type="number" min="0" value={downPayment} onChange={e => setDownPayment(e.target.value)}
                  className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
            </div>
            {/* Processing fee */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.processingFee}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">{cfg.currency}</span>
                <input type="number" min="0" value={processingFee} onChange={e => setProcessingFee(e.target.value)}
                  className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Country note ── */}
      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{t.countryNote}</p>

      {/* ── Buttons ── */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {t.calculate}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {t.reset}
        </button>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-5 border border-gray-100">
          <h3 className="font-bold text-gray-900">{t.results}</h3>

          {/* Hero EMI */}
          <div className="bg-emerald-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">{t.monthlyEMI}</div>
            <div className="text-3xl font-black">{fmt(result.emi, result.currency)}</div>
          </div>

          {/* Pie + breakdown */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <PieChart principal={parseFloat(amount) - (parseFloat(downPayment) || 0)} interest={result.totalInterest} />
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-emerald-600 flex-shrink-0" />
                <span className="text-gray-600">{t.principal}</span>
                <span className="ml-auto font-semibold text-gray-900">
                  {fmt(parseFloat(amount) - (parseFloat(downPayment) || 0), result.currency)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-red-300 flex-shrink-0" />
                <span className="text-gray-600">{t.totalInterest}</span>
                <span className="ml-auto font-semibold text-red-500">{fmt(result.totalInterest, result.currency)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t.totalPayment}</span>
                  <span className="font-bold text-gray-900">{fmt(result.totalPayment, result.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DBR */}
          {result.dbr !== null && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.dbrWarning ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {t.dbr}: {result.dbr.toFixed(1)}% — {result.dbrWarning ? t.dbrWarn : t.dbrOk}
            </div>
          )}

          {/* Amortization toggle */}
          <button
            onClick={() => setShowSchedule(v => !v)}
            className="w-full text-center text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors py-2 border border-emerald-200 rounded-xl"
          >
            {showSchedule ? t.hideSchedule : t.showSchedule}
          </button>

          {showSchedule && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 text-gray-600 uppercase">
                  <tr>
                    {[t.month, t.payment, t.principalCol, t.interestCol, t.balance].map(h => (
                      <th key={h} className="px-3 py-2 text-right font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.schedule.map(row => (
                    <tr key={row.month} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500 text-right">{row.month}</td>
                      <td className="px-3 py-2 text-gray-900 font-medium text-right">{fmtShort(row.payment)}</td>
                      <td className="px-3 py-2 text-emerald-700 text-right">{fmtShort(row.principal)}</td>
                      <td className="px-3 py-2 text-red-500 text-right">{fmtShort(row.interest)}</td>
                      <td className="px-3 py-2 text-gray-700 text-right">{fmtShort(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 leading-relaxed">{t.disclaimer}</p>
    </div>
  )
}
