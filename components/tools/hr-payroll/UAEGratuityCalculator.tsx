'use client'

import { useState } from 'react'

type Props = { locale: string }

type ContractType = 'limited' | 'unlimited'
type EndReason = 'resignation' | 'termination'

type Result = {
  totalGratuity: number
  breakdown: BreakdownRow[]
  serviceSummary: string
  cappedAt2Years: boolean
  eligible: boolean
  currency: 'AED'
}

type BreakdownRow = {
  label: string
  days: number
  years: number
  dailySalary: number
  amount: number
}

function formatAED(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function diffInDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function calcGratuity(
  basicSalary: number,
  startDate: Date,
  endDate: Date,
  contractType: ContractType,
  endReason: EndReason,
  unpaidLeaveDays: number
): Result {
  const totalDays = diffInDays(startDate, endDate) - Math.max(0, unpaidLeaveDays)
  const totalYears = totalDays / 365

  const dailySalary = (basicSalary * 12) / 365

  const serviceParts = []
  const y = Math.floor(totalYears)
  const m = Math.floor((totalYears - y) * 12)
  const d = Math.floor(totalDays - y * 365 - m * 30.4167)
  const serviceSummary = [
    y > 0 ? `${y} year${y !== 1 ? 's' : ''}` : '',
    m > 0 ? `${m} month${m !== 1 ? 's' : ''}` : '',
    d > 0 ? `${d} day${d !== 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(', ') || '0 days'

  if (totalYears < 1) {
    return { totalGratuity: 0, breakdown: [], serviceSummary, cappedAt2Years: false, eligible: false, currency: 'AED' }
  }

  let gratuity = 0
  const breakdown: BreakdownRow[] = []

  if (contractType === 'limited') {
    // Current law (Federal Decree-Law No. 33 of 2021)
    const firstTier = Math.min(totalYears, 5)
    const secondTier = Math.max(0, totalYears - 5)

    const firstAmount = firstTier * 21 * dailySalary
    breakdown.push({ label: 'First 5 years (21 days/year)', days: 21, years: firstTier, dailySalary, amount: firstAmount })
    gratuity += firstAmount

    if (secondTier > 0) {
      const secondAmount = secondTier * 30 * dailySalary
      breakdown.push({ label: 'Beyond 5 years (30 days/year)', days: 30, years: secondTier, dailySalary, amount: secondAmount })
      gratuity += secondAmount
    }
  } else {
    // Legacy unlimited contract (Federal Law No. 8 of 1980)
    if (endReason === 'termination') {
      // Full rate — same as limited
      const firstTier = Math.min(totalYears, 5)
      const secondTier = Math.max(0, totalYears - 5)

      const firstAmount = firstTier * 21 * dailySalary
      breakdown.push({ label: 'First 5 years (21 days/year)', days: 21, years: firstTier, dailySalary, amount: firstAmount })
      gratuity += firstAmount

      if (secondTier > 0) {
        const secondAmount = secondTier * 30 * dailySalary
        breakdown.push({ label: 'Beyond 5 years (30 days/year)', days: 30, years: secondTier, dailySalary, amount: secondAmount })
        gratuity += secondAmount
      }
    } else {
      // Resignation — sliding reductions apply
      if (totalYears < 1) {
        // already handled above
      } else if (totalYears < 3) {
        const base = Math.min(totalYears, 5) * 21 * dailySalary
        const amount = base * (1 / 3)
        breakdown.push({ label: `1–3 years resignation (1/3 of 21 days/year)`, days: 21, years: totalYears, dailySalary, amount })
        gratuity += amount
      } else if (totalYears < 5) {
        const base = Math.min(totalYears, 5) * 21 * dailySalary
        const amount = base * (2 / 3)
        breakdown.push({ label: `3–5 years resignation (2/3 of 21 days/year)`, days: 21, years: totalYears, dailySalary, amount })
        gratuity += amount
      } else {
        // 5+ years full rate
        const firstAmount = 5 * 21 * dailySalary
        breakdown.push({ label: 'First 5 years (21 days/year)', days: 21, years: 5, dailySalary, amount: firstAmount })
        gratuity += firstAmount

        const secondTier = totalYears - 5
        if (secondTier > 0) {
          const secondAmount = secondTier * 30 * dailySalary
          breakdown.push({ label: 'Beyond 5 years (30 days/year)', days: 30, years: secondTier, dailySalary, amount: secondAmount })
          gratuity += secondAmount
        }
      }
    }
  }

  // Cap: 2 years basic salary
  const cap = basicSalary * 24
  const cappedAt2Years = gratuity > cap
  if (cappedAt2Years) gratuity = cap

  return { totalGratuity: gratuity, breakdown, serviceSummary, cappedAt2Years, eligible: true, currency: 'AED' }
}

export default function UAEGratuityCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [basicSalary, setBasicSalary] = useState('')
  const [contractType, setContractType] = useState<ContractType>('limited')
  const [endReason, setEndReason] = useState<EndReason>('resignation')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [unpaidLeave, setUnpaidLeave] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  function calculate() {
    setError('')
    const salary = parseFloat(basicSalary)
    if (!salary || salary <= 0) { setError(isAr ? 'أدخل الراتب الأساسي' : 'Please enter a valid basic salary.'); return }
    if (!startDate || !endDate) { setError(isAr ? 'أدخل تواريخ البدء والانتهاء' : 'Please enter start and end dates.'); return }
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end <= start) { setError(isAr ? 'يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء' : 'End date must be after start date.'); return }
    const unpaid = parseInt(unpaidLeave) || 0
    setResult(calcGratuity(salary, start, end, contractType, endReason, unpaid))
  }

  function reset() {
    setBasicSalary('')
    setStartDate('')
    setEndDate('')
    setUnpaidLeave('')
    setContractType('limited')
    setEndReason('resignation')
    setResult(null)
    setError('')
  }

  function loadSample() {
    setBasicSalary('10000')
    setContractType('limited')
    const s = new Date()
    s.setFullYear(s.getFullYear() - 5)
    setStartDate(s.toISOString().split('T')[0])
    setEndDate(new Date().toISOString().split('T')[0])
    setUnpaidLeave('0')
    setResult(null)
    setError('')
  }

  const L = isAr
    ? {
        title: 'حاسبة مكافأة نهاية الخدمة - الإمارات',
        disclaimer: 'للإرشاد فقط. ليست استشارة قانونية. راجع وزارة الموارد البشرية أو متخصصاً لحالتك.',
        contractType: 'نوع العقد',
        limited: 'عقد محدد المدة (الحالي)',
        unlimited: 'عقد غير محدد المدة (قديم)',
        endReason: 'سبب انتهاء العقد',
        resignation: 'استقالة (بقرار الموظف)',
        termination: 'إنهاء من قِبل صاحب العمل',
        basicSalary: 'الراتب الأساسي الشهري (درهم)',
        startDate: 'تاريخ البدء',
        endDate: 'تاريخ الانتهاء',
        unpaidLeave: 'أيام الإجازة غير مدفوعة (اختياري)',
        calculate: 'احسب المكافأة',
        reset: 'إعادة تعيين',
        sample: 'مثال (5 سنوات، 10,000)',
        results: 'نتيجة مكافأة نهاية الخدمة',
        totalGratuity: 'إجمالي مكافأة نهاية الخدمة',
        breakdown: 'التفصيل',
        servicePeriod: 'مدة الخدمة',
        dailySalary: 'الأجر اليومي',
        cappedNote: 'تم تطبيق الحد الأقصى: المكافأة لا تتجاوز راتبَين سنويَّين.',
        notEligible: 'مدة الخدمة أقل من سنة. لا تستحق مكافأة.',
        limitedNote: 'العقود المحددة المدة تخضع للقانون الاتحادي رقم 33 لسنة 2021.',
        unlimitedNote: 'العقود غير محددة المدة تخضع لقواعد قانون العمل القديم (القانون الاتحادي رقم 8 لسنة 1980).',
        enterAmount: 'أدخل المبلغ',
      }
    : {
        title: 'UAE Gratuity Calculator',
        disclaimer: 'For guidance only. Not legal advice. Consult MOHRE or a professional for your specific case.',
        contractType: 'Contract Type',
        limited: 'Limited (Fixed-Term) — Current',
        unlimited: 'Unlimited (Legacy/Indefinite)',
        endReason: 'Reason for Contract End',
        resignation: 'Resignation (by employee)',
        termination: 'Termination (by employer)',
        basicSalary: 'Basic Monthly Salary (AED)',
        startDate: 'Employment Start Date',
        endDate: 'Last Working Day / End Date',
        unpaidLeave: 'Unpaid Leave Days (optional)',
        calculate: 'Calculate Gratuity',
        reset: 'Reset',
        sample: 'Try sample (5 yrs, AED 10,000)',
        results: 'End-of-Service Gratuity Result',
        totalGratuity: 'Total Gratuity',
        breakdown: 'Calculation Breakdown',
        servicePeriod: 'Service Period',
        dailySalary: 'Daily Salary',
        cappedNote: 'Cap applied: gratuity cannot exceed 2 years\' basic salary.',
        notEligible: 'Service period is less than 1 year. No gratuity is payable.',
        limitedNote: 'Limited contracts follow Federal Decree-Law No. 33 of 2021.',
        unlimitedNote: 'Unlimited contracts follow legacy rules (Federal Law No. 8 of 1980). Resignation before 5 years results in reduced gratuity.',
        enterAmount: 'Enter amount',
      }

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <span className="text-lg leading-none">⚠️</span>
        <p>{L.disclaimer}</p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Contract Type */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.contractType}</label>
          <div className="grid grid-cols-2 gap-2">
            {(['limited', 'unlimited'] as ContractType[]).map(ct => (
              <button
                key={ct}
                onClick={() => setContractType(ct)}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-colors text-left ${
                  contractType === ct
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {ct === 'limited' ? L.limited : L.unlimited}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            {contractType === 'limited' ? L.limitedNote : L.unlimitedNote}
          </p>
        </div>

        {/* End Reason — only for unlimited */}
        {contractType === 'unlimited' && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.endReason}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['resignation', 'termination'] as EndReason[]).map(r => (
                <button
                  key={r}
                  onClick={() => setEndReason(r)}
                  className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-colors text-left ${
                    endReason === r
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {r === 'resignation' ? L.resignation : L.termination}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Basic Salary */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.basicSalary}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number"
              min="0"
              value={basicSalary}
              onChange={e => setBasicSalary(e.target.value)}
              placeholder={L.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.startDate}</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.endDate}</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Unpaid Leave */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.unpaidLeave}</label>
          <input
            type="number"
            min="0"
            value={unpaidLeave}
            onChange={e => setUnpaidLeave(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
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
          {L.calculate}
        </button>
        <button
          onClick={loadSample}
          className="px-4 py-3 border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold rounded-xl transition-colors text-sm"
        >
          {L.sample}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {L.reset}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
          <h3 className="font-bold text-gray-900">{L.results}</h3>

          {!result.eligible ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
              {L.notEligible}
            </div>
          ) : (
            <>
              {/* Hero total */}
              <div className="bg-emerald-600 rounded-xl p-4 text-white">
                <div className="text-sm opacity-80 mb-1">{L.totalGratuity}</div>
                <div className="text-3xl font-black">{formatAED(result.totalGratuity)}</div>
                {result.cappedAt2Years && (
                  <div className="mt-2 text-xs bg-white/20 rounded-lg px-3 py-1.5">{L.cappedNote}</div>
                )}
              </div>

              {/* Service summary */}
              <div className="flex items-center justify-between text-sm border-b border-gray-200 pb-3">
                <span className="text-gray-500">{L.servicePeriod}</span>
                <span className="font-semibold text-gray-900">{result.serviceSummary}</span>
              </div>

              {/* Breakdown */}
              {result.breakdown.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{L.breakdown}</p>
                  {result.breakdown.map((row, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm">
                      <div className="font-semibold text-gray-700 mb-1">{row.label}</div>
                      <div className="flex justify-between text-gray-500">
                        <span>
                          {row.years.toFixed(4)} yrs × {row.days} days × {formatAED(row.dailySalary)}/day
                        </span>
                        <span className="font-semibold text-gray-900 ml-4">{formatAED(row.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Bottom disclaimer */}
      <p className="text-xs text-gray-500 text-center">
        {isAr
          ? 'المصدر: المرسوم الاتحادي بقانون رقم 33 لسنة 2021 | وزارة الموارد البشرية والتوطين'
          : 'Source: Federal Decree-Law No. 33 of 2021 | Ministry of Human Resources & Emiratisation (MOHRE)'}
      </p>
    </div>
  )
}
