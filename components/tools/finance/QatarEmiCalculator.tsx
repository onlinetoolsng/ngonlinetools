'use client'

import { useState, useMemo } from 'react'

type Props = { locale: string }

// ─── QCB-driven config ────────────────────────────────────────────────────────

const QCB = {
  personal: {
    expat:    { maxPrincipal: 400_000,   maxTenureMonths: 48, dsrLimit: 0.50 },
    qatari:   { maxPrincipal: 2_000_000, maxTenureMonths: 72, dsrLimit: 0.75 },
  },
  car: {
    expat:    { maxPrincipal: 500_000, maxTenureMonths: 84, dsrLimit: 0.50 },
    qatari:   { maxPrincipal: 500_000, maxTenureMonths: 84, dsrLimit: 0.75 },
  },
  ratePersonalSoftCap: 6.5,
  rateHardCap: 12,
} as const

const LOAN_TYPES = [
  { value: 'personal', labelEn: 'Personal Loan', labelAr: 'قرض شخصي',
    defaultRate: 6.0, defaultTenure: 36 },
  { value: 'car',      labelEn: 'Car Finance',   labelAr: 'تمويل سيارة',
    defaultRate: 4.5, defaultTenure: 60 },
]

const BORROWER_TYPES = [
  { value: 'expat',   labelEn: 'Expatriate',    labelAr: 'وافد' },
  { value: 'qatari',  labelEn: 'Qatari National', labelAr: 'مواطن قطري' },
]

const TOOL_MODES = [
  { value: 'emi',         labelEn: 'EMI Calculator',         labelAr: 'حاسبة القسط' },
  { value: 'eligibility', labelEn: 'Loan Eligibility',       labelAr: 'أهلية القرض' },
]

// ─── Pure calculation engine ──────────────────────────────────────────────────

type AmortRow = {
  month: number
  opening: number
  interest: number
  principal: number
  closing: number
}

type EmiResult = {
  emi: number
  totalPayment: number
  totalInterest: number
  schedule: AmortRow[]
}

type ValidationResult = {
  dsrOk: boolean | null
  dsr: number | null
  dsrLimit: number
  loanAmountOk: boolean
  principalLimit: number
  tenureOk: boolean
  tenureLimitMonths: number
  rateOk: boolean
  rateAbovePersonalCap: boolean
  errors: string[]
  warnings: string[]
}

function calcEmi(principal: number, annualRate: number, tenureMonths: number): EmiResult {
  const r = annualRate / 12 / 100
  let emi: number

  if (r === 0) {
    emi = principal / tenureMonths
  } else {
    const factor = Math.pow(1 + r, tenureMonths)
    emi = (principal * r * factor) / (factor - 1)
  }

  emi = Math.round(emi * 100) / 100
  const totalPayment = Math.round(emi * tenureMonths * 100) / 100
  const totalInterest = Math.round((totalPayment - principal) * 100) / 100

  // Build amortisation schedule (capped at 360 rows for performance)
  const schedule: AmortRow[] = []
  let balance = principal
  for (let m = 1; m <= Math.min(tenureMonths, 360); m++) {
    const interestComp = Math.round(balance * r * 100) / 100
    const principalComp = Math.round((emi - interestComp) * 100) / 100
    const closing = Math.max(0, Math.round((balance - principalComp) * 100) / 100)
    schedule.push({ month: m, opening: balance, interest: interestComp, principal: principalComp, closing })
    balance = closing
  }

  return { emi, totalPayment, totalInterest, schedule }
}

function invertEmi(desiredEmi: number, annualRate: number, tenureMonths: number): number {
  const r = annualRate / 12 / 100
  if (r === 0) return desiredEmi * tenureMonths
  const factor = Math.pow(1 + r, tenureMonths)
  return (desiredEmi * (factor - 1)) / (r * factor)
}

function validate(
  loanType: 'personal' | 'car',
  borrowerType: 'expat' | 'qatari',
  principal: number,
  annualRate: number,
  tenureMonths: number,
  emi: number,
  salaryMonthly: number,
  otherDebt: number,
): ValidationResult {
  const limits = QCB[loanType][borrowerType]
  const errors: string[] = []
  const warnings: string[] = []

  // Principal
  const loanAmountOk = principal <= limits.maxPrincipal
  if (!loanAmountOk) errors.push('ERR_PRINCIPAL_ABOVE_QCB_CAP')

  // Tenure
  const tenureOk = tenureMonths <= limits.maxTenureMonths
  if (loanType === 'personal' && !tenureOk) errors.push('ERR_TENURE_ABOVE_QCB_LIMIT')
  if (loanType === 'car' && !tenureOk) warnings.push('WARN_TENURE_ABOVE_MARKET_TYPICAL')

  // Rate
  const rateOk = annualRate <= QCB.rateHardCap
  const rateAbovePersonalCap = loanType === 'personal' && annualRate > QCB.ratePersonalSoftCap
  if (!rateOk) errors.push('ERR_RATE_ABOVE_HARD_CAP')
  if (rateAbovePersonalCap) warnings.push('WARN_RATE_ABOVE_PERSONAL_CAP')

  // DSR
  let dsr: number | null = null
  let dsrOk: boolean | null = null
  if (salaryMonthly > 0) {
    const totalDebt = emi + otherDebt
    dsr = totalDebt / salaryMonthly
    dsrOk = dsr <= limits.dsrLimit
    if (!dsrOk) errors.push('ERR_DSR_ABOVE_LIMIT')
  }

  return {
    dsrOk, dsr, dsrLimit: limits.dsrLimit,
    loanAmountOk, principalLimit: limits.maxPrincipal,
    tenureOk, tenureLimitMonths: limits.maxTenureMonths,
    rateOk, rateAbovePersonalCap,
    errors, warnings,
  }
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmt(n: number) {
  return `QAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtPct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QatarEmiCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  // Mode
  const [mode, setMode] = useState<'emi' | 'eligibility'>('emi')

  // Shared inputs
  const [loanType, setLoanType]       = useState<'personal' | 'car'>('personal')
  const [borrowerType, setBorrowerType] = useState<'expat' | 'qatari'>('expat')
  const [annualRate, setAnnualRate]   = useState('6.0')
  const [tenureMonths, setTenureMonths] = useState('36')
  const [salaryMonthly, setSalaryMonthly] = useState('')
  const [otherDebt, setOtherDebt]     = useState('')

  // EMI mode inputs
  const [principal, setPrincipal] = useState('')

  // Eligibility mode inputs
  const [desiredEmi, setDesiredEmi]   = useState('')

  // Results
  const [emiResult, setEmiResult]         = useState<EmiResult | null>(null)
  const [validation, setValidation]       = useState<ValidationResult | null>(null)
  const [eligResult, setEligResult]       = useState<{ maxEmi: number; maxPrincipal: number; clampedByQcb: boolean } | null>(null)
  const [showSchedule, setShowSchedule]   = useState(false)

  const selectedLoan     = LOAN_TYPES.find(l => l.value === loanType)!
  const currentLimits    = QCB[loanType][borrowerType]

  function runEmi() {
    const p  = parseFloat(principal)
    const r  = parseFloat(annualRate)
    const t  = parseInt(tenureMonths)
    if (!p || p <= 0 || !r || !t || t <= 0) return

    const result = calcEmi(p, r, t)
    const val    = validate(loanType, borrowerType, p, r, t, result.emi,
      parseFloat(salaryMonthly) || 0,
      parseFloat(otherDebt) || 0)
    setEmiResult(result)
    setValidation(val)
    setEligResult(null)
    setShowSchedule(false)
  }

  function runEligibility() {
    const r  = parseFloat(annualRate)
    const t  = parseInt(tenureMonths)
    const sal = parseFloat(salaryMonthly)
    const other = parseFloat(otherDebt) || 0
    if (!r || !t || t <= 0) return

    let maxEmi: number

    if (desiredEmi && parseFloat(desiredEmi) > 0) {
      maxEmi = parseFloat(desiredEmi)
    } else if (sal > 0) {
      const dsrLimit = currentLimits.dsrLimit
      const maxTotalDebt = dsrLimit * sal
      maxEmi = maxTotalDebt - other
    } else return

    if (maxEmi <= 0) {
      setEligResult({ maxEmi: 0, maxPrincipal: 0, clampedByQcb: false })
      return
    }

    let maxPrincipal = Math.round(invertEmi(maxEmi, r, t) * 100) / 100
    let clampedByQcb = false
    if (maxPrincipal > currentLimits.maxPrincipal) {
      maxPrincipal = currentLimits.maxPrincipal
      clampedByQcb = true
    }

    setEligResult({ maxEmi, maxPrincipal, clampedByQcb })
    setEmiResult(null)
    setValidation(null)
  }

  function reset() {
    setPrincipal(''); setAnnualRate('6.0'); setTenureMonths('36')
    setSalaryMonthly(''); setOtherDebt(''); setDesiredEmi('')
    setEmiResult(null); setValidation(null); setEligResult(null)
    setShowSchedule(false)
  }

  // i18n labels
  const L = isAr ? {
    title: 'حاسبة القسط الشهري — قطر',
    mode: 'نوع الحساب',
    loanType: 'نوع القرض',
    borrower: 'نوع المقترض',
    principal: 'مبلغ القرض (ر.ق)',
    rate: 'معدل الفائدة السنوي (%)',
    tenure: 'مدة القرض (بالأشهر)',
    salary: 'الراتب الشهري (ر.ق) — اختياري',
    otherDebt: 'أقساط قروض أخرى (ر.ق) — اختياري',
    desiredEmi: 'القسط الشهري المستهدف (ر.ق)',
    calculate: 'احسب',
    reset: 'إعادة تعيين',
    emi: 'القسط الشهري',
    totalPayment: 'إجمالي المدفوعات',
    totalInterest: 'إجمالي الفائدة',
    dsr: 'نسبة خدمة الدين',
    maxEmi: 'الحد الأقصى للقسط',
    maxLoan: 'الحد الأقصى للقرض',
    showSchedule: 'عرض جدول السداد',
    hideSchedule: 'إخفاء الجدول',
    month: 'الشهر',
    opening: 'الرصيد الافتتاحي',
    interest: 'الفائدة',
    principalComp: 'الأصل',
    closing: 'الرصيد الختامي',
    qcbNote: 'القيود وفقاً لمتطلبات بنك قطر المركزي',
    clampedNote: 'مقيّد بسقف بنك قطر المركزي',
    enterAmount: 'أدخل المبلغ',
  } : {
    title: 'Qatar EMI Calculator',
    mode: 'Calculator Mode',
    loanType: 'Loan Type',
    borrower: 'Borrower Type',
    principal: 'Loan Amount (QAR)',
    rate: 'Annual Interest Rate (%)',
    tenure: 'Loan Tenure (Months)',
    salary: 'Monthly Salary (QAR) — optional',
    otherDebt: 'Other Monthly Debt (QAR) — optional',
    desiredEmi: 'Target Monthly EMI (QAR)',
    calculate: 'Calculate',
    reset: 'Reset',
    emi: 'Monthly EMI',
    totalPayment: 'Total Payment',
    totalInterest: 'Total Interest',
    dsr: 'Debt Service Ratio',
    maxEmi: 'Max Monthly EMI',
    maxLoan: 'Max Loan Amount',
    showSchedule: 'Show Amortisation Schedule',
    hideSchedule: 'Hide Schedule',
    month: 'Month',
    opening: 'Opening Balance',
    interest: 'Interest',
    principalComp: 'Principal',
    closing: 'Closing Balance',
    qcbNote: 'Limits per Qatar Central Bank (QCB) rules',
    clampedNote: 'Capped at QCB maximum',
    enterAmount: 'Enter amount',
  }

  // Error/warning messages
  const errMsg: Record<string, string> = isAr ? {
    ERR_PRINCIPAL_ABOVE_QCB_CAP: `مبلغ القرض يتجاوز الحد الأقصى المسموح به من بنك قطر المركزي (${fmt(currentLimits.maxPrincipal)})`,
    ERR_TENURE_ABOVE_QCB_LIMIT: `المدة تتجاوز الحد الأقصى وفق بنك قطر المركزي (${currentLimits.maxTenureMonths} شهراً)`,
    ERR_RATE_ABOVE_HARD_CAP: `معدل الفائدة يتجاوز السقف الأقصى لبنك قطر المركزي (${QCB.rateHardCap}%)`,
    ERR_DSR_ABOVE_LIMIT: `نسبة خدمة الدين تتجاوز الحد المسموح به (${fmtPct(currentLimits.dsrLimit)})`,
  } : {
    ERR_PRINCIPAL_ABOVE_QCB_CAP: `Loan exceeds QCB maximum (${fmt(currentLimits.maxPrincipal)})`,
    ERR_TENURE_ABOVE_QCB_LIMIT: `Tenure exceeds QCB limit of ${currentLimits.maxTenureMonths} months`,
    ERR_RATE_ABOVE_HARD_CAP: `Rate exceeds QCB hard cap of ${QCB.rateHardCap}%`,
    ERR_DSR_ABOVE_LIMIT: `DSR exceeds QCB limit of ${fmtPct(currentLimits.dsrLimit)}`,
  }
  const warnMsg: Record<string, string> = isAr ? {
    WARN_RATE_ABOVE_PERSONAL_CAP: `الفائدة أعلى من السقف المعتاد للقروض الشخصية (${QCB.ratePersonalSoftCap}%) — تحقق مع مصرفك`,
    WARN_TENURE_ABOVE_MARKET_TYPICAL: 'المدة أطول من المعتاد في السوق — تأكد مع المصرف',
  } : {
    WARN_RATE_ABOVE_PERSONAL_CAP: `Rate above typical QCB personal loan ceiling of ${QCB.ratePersonalSoftCap}% — verify with your bank`,
    WARN_TENURE_ABOVE_MARKET_TYPICAL: 'Tenure exceeds typical market range — confirm with lender',
  }

  const hasErrors   = (validation?.errors.length ?? 0) > 0
  const hasWarnings = (validation?.warnings.length ?? 0) > 0

  return (
    <div className="space-y-6">

      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {TOOL_MODES.map(m => (
          <button
            key={m.value}
            onClick={() => { setMode(m.value as 'emi' | 'eligibility'); reset() }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              mode === m.value
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isAr ? m.labelAr : m.labelEn}
          </button>
        ))}
      </div>

      {/* Shared inputs grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Loan type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.loanType}</label>
          <select
            value={loanType}
            onChange={e => { setLoanType(e.target.value as 'personal' | 'car'); reset() }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {LOAN_TYPES.map(l => (
              <option key={l.value} value={l.value}>{isAr ? l.labelAr : l.labelEn}</option>
            ))}
          </select>
        </div>

        {/* Borrower type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.borrower}</label>
          <select
            value={borrowerType}
            onChange={e => { setBorrowerType(e.target.value as 'expat' | 'qatari'); reset() }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {BORROWER_TYPES.map(b => (
              <option key={b.value} value={b.value}>{isAr ? b.labelAr : b.labelEn}</option>
            ))}
          </select>
        </div>

        {/* EMI mode: principal */}
        {mode === 'emi' && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.principal}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">QAR</span>
              <input
                type="number" min="0" value={principal}
                onChange={e => setPrincipal(e.target.value)}
                placeholder={L.enterAmount}
                className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>
        )}

        {/* Eligibility mode: desired EMI */}
        {mode === 'eligibility' && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.desiredEmi}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">QAR</span>
              <input
                type="number" min="0" value={desiredEmi}
                onChange={e => setDesiredEmi(e.target.value)}
                placeholder={L.enterAmount}
                className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>
        )}

        {/* Annual rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.rate}</label>
          <div className="relative">
            <input
              type="number" min="0.1" max="12" step="0.1" value={annualRate}
              onChange={e => setAnnualRate(e.target.value)}
              className="w-full pr-10 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
          </div>
        </div>

        {/* Tenure */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.tenure}</label>
          <input
            type="number" min="1" max="360" value={tenureMonths}
            onChange={e => setTenureMonths(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Monthly salary */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.salary}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">QAR</span>
            <input
              type="number" min="0" value={salaryMonthly}
              onChange={e => setSalaryMonthly(e.target.value)}
              placeholder={L.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Other debt */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.otherDebt}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">QAR</span>
            <input
              type="number" min="0" value={otherDebt}
              onChange={e => setOtherDebt(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      {/* QCB limits note */}
      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
        {L.qcbNote} — {isAr ? 'الحد الأقصى للقرض' : 'Max loan'}: {fmt(currentLimits.maxPrincipal)} | {isAr ? 'أقصى مدة' : 'Max tenure'}: {currentLimits.maxTenureMonths} {isAr ? 'شهر' : 'months'} | DSR: {fmtPct(currentLimits.dsrLimit)}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={mode === 'emi' ? runEmi : runEligibility}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {L.calculate}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {L.reset}
        </button>
      </div>

      {/* ── EMI Results ─────────────────────────────────────────────────── */}
      {emiResult && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">

          {/* Hero: monthly EMI */}
          <div className="bg-emerald-600 rounded-xl p-4 text-white">
            <div className="text-sm opacity-80 mb-1">{L.emi}</div>
            <div className="text-3xl font-black">{fmt(emiResult.emi)}</div>
            <div className="text-sm opacity-70 mt-1">
              {isAr ? 'شهرياً' : 'per month'} × {tenureMonths} {isAr ? 'شهر' : 'months'}
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <Row label={isAr ? 'مبلغ القرض' : 'Loan Amount'}      value={fmt(parseFloat(principal))} />
            <Row label={L.totalInterest}                            value={fmt(emiResult.totalInterest)} negative />
            <div className="border-t border-gray-200 pt-3">
              <Row label={L.totalPayment} value={fmt(emiResult.totalPayment)} highlight />
            </div>

            {/* DSR row */}
            {validation?.dsr !== null && validation?.dsr !== undefined && (
              <div className="border-t border-gray-200 pt-3">
                <Row
                  label={L.dsr}
                  value={`${fmtPct(validation.dsr)} / ${fmtPct(validation.dsrLimit)}`}
                  negative={!validation.dsrOk}
                  highlight={!!validation.dsrOk}
                />
              </div>
            )}
          </div>

          {/* Compliance flags */}
          {hasErrors && (
            <div className="space-y-2">
              {validation!.errors.map(e => (
                <div key={e} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <span className="mt-0.5">⚠</span>
                  <span>{errMsg[e] ?? e}</span>
                </div>
              ))}
            </div>
          )}
          {hasWarnings && (
            <div className="space-y-2">
              {validation!.warnings.map(w => (
                <div key={w} className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  <span className="mt-0.5">ℹ</span>
                  <span>{warnMsg[w] ?? w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Amortisation toggle */}
          <button
            onClick={() => setShowSchedule(s => !s)}
            className="w-full text-sm text-emerald-700 font-semibold py-2 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors"
          >
            {showSchedule ? L.hideSchedule : L.showSchedule}
          </button>

          {showSchedule && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs text-gray-700">
                <thead className="bg-gray-100 text-gray-500 font-semibold">
                  <tr>
                    {[L.month, L.opening, L.interest, L.principalComp, L.closing].map(h => (
                      <th key={h} className="px-3 py-2 text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emiResult.schedule.map((row, i) => (
                    <tr key={row.month} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-1.5 text-right font-semibold">{row.month}</td>
                      <td className="px-3 py-1.5 text-right">{row.opening.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                      <td className="px-3 py-1.5 text-right text-red-500">{row.interest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                      <td className="px-3 py-1.5 text-right text-emerald-600">{row.principal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                      <td className="px-3 py-1.5 text-right">{row.closing.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Eligibility Results ──────────────────────────────────────────── */}
      {eligResult && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">

          {eligResult.maxPrincipal > 0 ? (
            <>
              <div className="bg-emerald-600 rounded-xl p-4 text-white">
                <div className="text-sm opacity-80 mb-1">{L.maxLoan}</div>
                <div className="text-3xl font-black">{fmt(eligResult.maxPrincipal)}</div>
                {eligResult.clampedByQcb && (
                  <div className="text-xs opacity-70 mt-1">⚠ {L.clampedNote}</div>
                )}
              </div>
              <Row label={L.maxEmi} value={fmt(eligResult.maxEmi)} highlight />
              <Row
                label={isAr ? 'المدة' : 'Tenure'}
                value={`${tenureMonths} ${isAr ? 'شهراً' : 'months'}`}
              />
              <Row
                label={isAr ? 'معدل الفائدة' : 'Interest Rate'}
                value={`${annualRate}%`}
              />
            </>
          ) : (
            <div className="text-red-600 text-sm font-semibold text-center py-4">
              {isAr
                ? 'لا تتوفر طاقة تحمّل بموجب قواعد نسبة خدمة الدين من بنك قطر المركزي'
                : 'No borrowing capacity under QCB DSR rules with current inputs'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Shared row component ─────────────────────────────────────────────────────

function Row({
  label, value, negative = false, highlight = false,
}: {
  label: string; value: string; negative?: boolean; highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${
        highlight ? 'text-emerald-600' : negative ? 'text-red-500' : 'text-gray-900'
      }`}>
        {value}
      </span>
    </div>
  )
}
