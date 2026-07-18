'use client'

import { useState } from 'react'

type Props = { locale: string }

type TerminationReason =
  | 'contract_completed'
  | 'employer_terminates'
  | 'worker_resigns_valid'
  | 'worker_resigns_no_reason'
  | 'misconduct'

type Result = {
  eligible: boolean
  serviceSummary: string
  totalYears: number
  dailyWage: number
  baseGratuity: number
  adjustedGratuity: number
  unusedLeavePayment: number
  totalEntitlement: number
  note: string
  breakdown: { label: string; value: string; highlight?: boolean; negative?: boolean }[]
}

function diffDays(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function serviceSummaryStr(totalDays: number, isAr: boolean) {
  const y = Math.floor(totalDays / 365)
  const remaining = totalDays - y * 365
  const m = Math.floor(remaining / 30)
  const d = remaining - m * 30
  const parts = [
    y > 0 ? `${y} ${isAr ? (y === 1 ? 'سنة' : 'سنوات') : y === 1 ? 'year' : 'years'}` : '',
    m > 0 ? `${m} ${isAr ? (m === 1 ? 'شهر' : 'أشهر') : m === 1 ? 'month' : 'months'}` : '',
    d > 0 ? `${d} ${isAr ? (d === 1 ? 'يوم' : 'أيام') : d === 1 ? 'day' : 'days'}` : '',
  ].filter(Boolean)
  return parts.join(', ') || (isAr ? '0 أيام' : '0 days')
}

function calcResult(
  basicSalary: number,
  startDate: Date,
  endDate: Date,
  unpaidDays: number,
  reason: TerminationReason,
  unusedLeaveDays: number,
  isAr: boolean
): Result {
  const rawDays = diffDays(startDate, endDate)
  const serviceDays = Math.max(0, rawDays - Math.max(0, unpaidDays))
  const totalYears = serviceDays / 365
  const serviceSummary = serviceSummaryStr(serviceDays, isAr)
  const dailyWage = basicSalary / 30

  if (totalYears < 1) {
    return {
      eligible: false,
      serviceSummary,
      totalYears,
      dailyWage,
      baseGratuity: 0,
      adjustedGratuity: 0,
      unusedLeavePayment: 0,
      totalEntitlement: 0,
      note: isAr ? 'مدة الخدمة أقل من سنة. لا يُستحق عادةً أي تعويض.' : 'Service period is less than 1 year. Gratuity is generally not payable.',
      breakdown: [],
    }
  }

  const fullYears = Math.floor(totalYears)
  const partialDays = serviceDays - fullYears * 365
  const baseGratuity = dailyWage * 14 * fullYears + (dailyWage * 14 * partialDays) / 365

  let adjustmentFactor = 1
  let note = ''

  if (reason === 'misconduct') {
    adjustmentFactor = 0
    note = isAr
      ? 'في حالات الإنهاء بسبب سوء السلوك، قد يُخفَّض حق المكافأة أو يُسقَط بالكامل وفق صلاحية الجهة المختصة أو القضاء.'
      : 'For termination due to misconduct, gratuity may be reduced or forfeited at employer/judicial discretion under applicable law.'
  } else if (reason === 'worker_resigns_no_reason') {
    adjustmentFactor = totalYears >= 5 ? 1 : totalYears >= 3 ? 0.67 : 0.33
    note = isAr
      ? 'الاستقالة دون سبب وجيه قد تُخفِّض المكافأة وفق الممارسة التقديرية أو البنود التعاقدية.'
      : 'Resignation without valid reason may reduce gratuity in line with discretionary practice or contractual terms.'
  } else {
    note = isAr
      ? 'يُطبَّق الحساب وفق القاعدة الشائعة المستخدمة (14 يوماً لكل سنة خدمة).'
      : 'Calculation based on the commonly referenced 14-days-per-year formula.'
  }

  const adjustedGratuity = baseGratuity * adjustmentFactor
  const unusedLeavePayment = dailyWage * Math.max(0, unusedLeaveDays)
  const totalEntitlement = adjustedGratuity + unusedLeavePayment

  const fmtAED = (n: number) =>
    `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const breakdown: Result['breakdown'] = [
    { label: isAr ? 'مدة الخدمة' : 'Service Period', value: serviceSummary },
    { label: isAr ? 'الأجر اليومي (الراتب ÷ 30)' : 'Daily Wage (Salary ÷ 30)', value: fmtAED(dailyWage) },
    { label: isAr ? 'قاعدة الحساب' : 'Formula', value: isAr ? '14 يوماً × الأجر اليومي × السنوات' : '14 days × daily wage × years' },
    { label: isAr ? 'المكافأة الأساسية' : 'Base Gratuity', value: fmtAED(baseGratuity) },
  ]

  if (adjustmentFactor !== 1) {
    breakdown.push({
      label: isAr ? 'تعديل بناءً على سبب الانتهاء' : 'Adjustment (termination reason)',
      value: adjustmentFactor === 0
        ? (isAr ? '− 100% (إسقاط)' : '− 100% (forfeited)')
        : `× ${Math.round(adjustmentFactor * 100)}%`,
      negative: true,
    })
  }

  if (unusedLeaveDays > 0) {
    breakdown.push({
      label: isAr ? `تعويض إجازة غير مستخدمة (${unusedLeaveDays} يوم)` : `Unused Leave Pay (${unusedLeaveDays} days)`,
      value: fmtAED(unusedLeavePayment),
    })
  }

  breakdown.push({
    label: isAr ? 'الإجمالي المستحق' : 'Total Entitlement',
    value: fmtAED(totalEntitlement),
    highlight: true,
  })

  return { eligible: true, serviceSummary, totalYears, dailyWage, baseGratuity, adjustedGratuity, unusedLeavePayment, totalEntitlement, note, breakdown }
}

const TERMINATION_REASONS: { value: TerminationReason; en: string; ar: string }[] = [
  { value: 'contract_completed', en: 'Contract completed / mutual end', ar: 'انتهاء العقد / إنهاء بالتراضي' },
  { value: 'employer_terminates', en: 'Employer terminates without cause', ar: 'إنهاء من صاحب العمل دون سبب' },
  { value: 'worker_resigns_valid', en: 'Worker resigns with valid reason (employer breach)', ar: 'استقالة الموظف بسبب وجيه (إخلال صاحب العمل)' },
  { value: 'worker_resigns_no_reason', en: 'Worker resigns without valid reason', ar: 'استقالة بدون سبب وجيه' },
  { value: 'misconduct', en: 'Termination for worker misconduct', ar: 'إنهاء بسبب سوء سلوك العامل' },
]

export default function UAEDomesticWorkerGratuityCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [basicSalary, setBasicSalary] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [unpaidLeave, setUnpaidLeave] = useState('')
  const [reason, setReason] = useState<TerminationReason>('contract_completed')
  const [unusedLeave, setUnusedLeave] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  function calculate() {
    setError('')
    const salary = parseFloat(basicSalary)
    if (!salary || salary <= 0) {
      setError(isAr ? 'أدخل الراتب الأساسي الشهري.' : 'Please enter a valid basic monthly salary.')
      return
    }
    if (!startDate || !endDate) {
      setError(isAr ? 'أدخل تاريخ البدء وتاريخ الانتهاء.' : 'Please enter both start and end dates.')
      return
    }
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end <= start) {
      setError(isAr ? 'يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء.' : 'End date must be after start date.')
      return
    }
    const unpaid = parseInt(unpaidLeave) || 0
    const unused = parseInt(unusedLeave) || 0
    setResult(calcResult(salary, start, end, unpaid, reason, unused, isAr))
  }

  function reset() {
    setBasicSalary('')
    setStartDate('')
    setEndDate('')
    setUnpaidLeave('')
    setUnusedLeave('')
    setReason('contract_completed')
    setResult(null)
    setError('')
  }

  function loadSample() {
    setBasicSalary('1500')
    const s = new Date()
    s.setFullYear(s.getFullYear() - 3)
    setStartDate(s.toISOString().split('T')[0])
    setEndDate(new Date().toISOString().split('T')[0])
    setUnpaidLeave('0')
    setUnusedLeave('10')
    setReason('contract_completed')
    setResult(null)
    setError('')
  }

  const fmtAED = (n: number) =>
    `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <span className="text-lg leading-none">⚠️</span>
        <p>
          {isAr
            ? 'هذه الحاسبة تقديرية فقط استناداً إلى الممارسة الشائعة (14 يوماً/سنة). القانون الحالي رقم 9 لسنة 2022 يُحيل آلية الحساب إلى قرار مجلس الوزراء. راجع وزارة الموارد البشرية أو مستشاراً قانونياً. ليست استشارة قانونية.'
            : 'This is an estimate based on commonly referenced practice (14 days/year). Federal Decree-Law No. 9 of 2022 defers the exact formula to a future Cabinet decision. Consult MOHRE or a legal professional. Not legal advice.'}
        </p>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Basic Salary */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {isAr ? 'الراتب الأساسي الشهري (درهم) — بدون البدلات' : 'Basic Monthly Salary (AED) — excluding allowances'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number"
              min="0"
              value={basicSalary}
              onChange={e => setBasicSalary(e.target.value)}
              placeholder={isAr ? 'أدخل المبلغ' : 'Enter amount'}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {isAr ? 'تاريخ بدء العمل' : 'Employment Start Date'}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {isAr ? 'تاريخ آخر يوم عمل' : 'Last Working Day / End Date'}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Termination Reason */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {isAr ? 'سبب انتهاء العقد' : 'Reason for Contract End'}
          </label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value as TerminationReason)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {TERMINATION_REASONS.map(r => (
              <option key={r.value} value={r.value}>{isAr ? r.ar : r.en}</option>
            ))}
          </select>
        </div>

        {/* Unpaid Leave */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {isAr ? 'أيام الإجازة غير مدفوعة (اختياري)' : 'Unpaid Leave Days (optional)'}
          </label>
          <input
            type="number"
            min="0"
            value={unpaidLeave}
            onChange={e => setUnpaidLeave(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Unused Annual Leave */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {isAr ? 'أيام الإجازة السنوية غير المستخدمة (اختياري)' : 'Unused Annual Leave Days (optional)'}
          </label>
          <input
            type="number"
            min="0"
            value={unusedLeave}
            onChange={e => setUnusedLeave(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          <p className="mt-1 text-xs text-gray-500">
            {isAr ? 'الإجازة السنوية: 30 يوماً لكل سنة خدمة' : 'Annual leave entitlement: 30 days per year of service'}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={calculate}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {isAr ? 'احسب المستحقات' : 'Calculate Entitlement'}
        </button>
        <button
          onClick={loadSample}
          className="px-4 py-3 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-xl transition-colors text-sm"
        >
          {isAr ? 'مثال (3 سنوات، 1,500)' : 'Try sample (3 yrs, AED 1,500)'}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {isAr ? 'إعادة تعيين' : 'Reset'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
          <h3 className="font-bold text-gray-900">
            {isAr ? 'نتيجة المستحقات' : 'Entitlement Result'}
          </h3>

          {!result.eligible ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
              {result.note}
            </div>
          ) : (
            <>
              {/* Hero total */}
              <div className="bg-emerald-600 rounded-xl p-4 text-white">
                <div className="text-sm opacity-80 mb-1">
                  {isAr ? 'إجمالي المستحقات التقديرية' : 'Estimated Total Entitlement'}
                </div>
                <div className="text-3xl font-black">{fmtAED(result.totalEntitlement)}</div>
                {result.unusedLeavePayment > 0 && (
                  <div className="mt-1 text-sm opacity-80">
                    {isAr
                      ? `منها ${fmtAED(result.adjustedGratuity)} مكافأة + ${fmtAED(result.unusedLeavePayment)} إجازة`
                      : `Incl. ${fmtAED(result.adjustedGratuity)} gratuity + ${fmtAED(result.unusedLeavePayment)} leave pay`}
                  </div>
                )}
              </div>

              {/* Note */}
              {result.note && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                  {result.note}
                </div>
              )}

              {/* Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {isAr ? 'التفصيل' : 'Breakdown'}
                </p>
                {result.breakdown.map((row, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    <span className={`text-sm font-semibold ${
                      row.highlight ? 'text-emerald-600' : row.negative ? 'text-red-500' : 'text-gray-900'
                    }`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment deadline note */}
              <div className="bg-gray-100 rounded-xl px-4 py-3 text-xs text-gray-500">
                {isAr
                  ? '⏱ يجب على صاحب العمل سداد جميع المستحقات خلال 10 أيام من انتهاء العقد وفق القانون.'
                  : '⏱ Employer must settle all financial entitlements within 10 days of contract end per UAE law.'}
              </div>

              {/* MOHRE link */}
              <p className="text-xs text-gray-500 text-center">
                {isAr
                  ? 'للتحقق الرسمي: '
                  : 'Official verification: '}
                <a
                  href="https://www.mohre.gov.ae"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 underline"
                >
                  mohre.gov.ae
                </a>
              </p>
            </>
          )}
        </div>
      )}

      {/* Bottom disclaimer */}
      <p className="text-xs text-gray-500 text-center">
        {isAr
          ? 'المصدر: المرسوم الاتحادي بقانون رقم 9 لسنة 2022 بشأن عمال المنازل | وزارة الموارد البشرية والتوطين'
          : 'Source: Federal Decree-Law No. 9 of 2022 on Domestic Workers | Ministry of Human Resources & Emiratisation'}
      </p>
    </div>
  )
}
