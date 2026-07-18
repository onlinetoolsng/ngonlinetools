'use client'

import { useState, useEffect } from 'react'

type Props = { locale: string }

type NationalityType = 'expat' | 'omani'
type TerminationType = 'standard' | 'misconduct'

const LAW_CHANGE_DATE = new Date('2023-07-31')

type PeriodBreakdown = {
  legacyYears: number
  newYears: number
  legacyGratuity: number
  newGratuity: number
  totalGratuity: number
  dailyRate: number
  totalYears: number
  eligible: boolean
  message?: string
}

function dateDiffYears(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
}

function calculateLegacyGratuity(basicSalary: number, years: number): number {
  if (years <= 0) return 0
  const first3 = Math.min(3, years)
  const beyond3 = Math.max(0, years - 3)
  // 15 days/year for first 3, 30 days/year beyond
  const dailyRate = basicSalary / 30
  return dailyRate * 15 * first3 + dailyRate * 30 * beyond3
}

function calculateNewGratuity(basicSalary: number, years: number): number {
  if (years <= 0) return 0
  // 1 full month per year (minimum)
  return basicSalary * years
}

function calculate(
  basicSalary: number,
  startDate: Date,
  endDate: Date,
  unpaidLeaveDays: number,
  terminationType: TerminationType
): PeriodBreakdown {
  if (endDate <= startDate) {
    return { legacyYears: 0, newYears: 0, legacyGratuity: 0, newGratuity: 0, totalGratuity: 0, dailyRate: basicSalary / 30, totalYears: 0, eligible: false, message: 'End date must be after start date.' }
  }

  if (terminationType === 'misconduct') {
    const totalYears = dateDiffYears(startDate, endDate)
    return { legacyYears: 0, newYears: 0, legacyGratuity: 0, newGratuity: 0, totalGratuity: 0, dailyRate: basicSalary / 30, totalYears, eligible: false, message: 'Gratuity may be forfeited in cases of termination for gross misconduct under Oman Labour Law.' }
  }

  // Subtract unpaid leave days — distribute proportionally to each period
  const rawTotalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  const adjustedTotalDays = Math.max(0, rawTotalDays - unpaidLeaveDays)
  const totalYears = adjustedTotalDays / 365.25

  if (totalYears < 1) {
    return { legacyYears: 0, newYears: 0, legacyGratuity: 0, newGratuity: 0, totalGratuity: 0, dailyRate: basicSalary / 30, totalYears, eligible: false, message: 'A minimum of 1 year of continuous service is required for gratuity eligibility under Oman Labour Law (Royal Decree 53/2023).' }
  }

  let legacyYears = 0
  let newYears = 0

  if (endDate <= LAW_CHANGE_DATE) {
    // Entirely under old law
    legacyYears = totalYears
  } else if (startDate >= LAW_CHANGE_DATE) {
    // Entirely under new law
    newYears = totalYears
  } else {
    // Split: adjust each period proportionally for unpaid leave
    const rawLegacyDays = (LAW_CHANGE_DATE.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const rawNewDays = (endDate.getTime() - LAW_CHANGE_DATE.getTime()) / (1000 * 60 * 60 * 24)
    const legacyUnpaid = unpaidLeaveDays * (rawLegacyDays / rawTotalDays)
    const newUnpaid = unpaidLeaveDays * (rawNewDays / rawTotalDays)
    legacyYears = Math.max(0, rawLegacyDays - legacyUnpaid) / 365.25
    newYears = Math.max(0, rawNewDays - newUnpaid) / 365.25
  }

  const legacyGratuity = calculateLegacyGratuity(basicSalary, legacyYears)
  const newGratuity = calculateNewGratuity(basicSalary, newYears)
  const totalGratuity = legacyGratuity + newGratuity

  return {
    legacyYears,
    newYears,
    legacyGratuity,
    newGratuity,
    totalGratuity,
    dailyRate: basicSalary / 30,
    totalYears,
    eligible: true,
  }
}

function fmt(n: number) {
  return `RO ${n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
}

function fmtYears(y: number, isAr: boolean) {
  const full = Math.floor(y)
  const frac = y - full
  const months = Math.round(frac * 12)
  const parts: string[] = []
  if (full > 0) parts.push(`${full} ${isAr ? 'سنة' : full === 1 ? 'yr' : 'yrs'}`)
  if (months > 0) parts.push(`${months} ${isAr ? 'شهر' : 'mo'}`)
  return parts.join(', ') || (isAr ? 'أقل من شهر' : '<1 mo')
}

export default function OmanGratuityCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const todayStr = new Date().toISOString().split('T')[0]

  const [basicSalary, setBasicSalary] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(todayStr)
  const [nationality, setNationality] = useState<NationalityType>('expat')
  const [terminationType, setTerminationType] = useState<TerminationType>('standard')
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState('0')
  const [result, setResult] = useState<PeriodBreakdown | null>(null)
  const [livePreview, setLivePreview] = useState('')

  // Detect split scenario
  const isSplit = startDate && startDate < '2023-07-31' && endDate > '2023-07-31'

  // Live preview of service duration
  useEffect(() => {
    if (!startDate || !endDate) { setLivePreview(''); return }
    const s = new Date(startDate), e = new Date(endDate)
    if (e <= s) { setLivePreview(''); return }
    const y = dateDiffYears(s, e)
    setLivePreview(fmtYears(y, isAr))
  }, [startDate, endDate, isAr])

  function handleCalculate() {
    const salary = parseFloat(basicSalary)
    if (!salary || salary <= 0 || !startDate || !endDate) return
    setResult(calculate(salary, new Date(startDate), new Date(endDate), parseInt(unpaidLeaveDays) || 0, terminationType))
  }

  function reset() {
    setBasicSalary('')
    setStartDate('')
    setEndDate(todayStr)
    setNationality('expat')
    setTerminationType('standard')
    setUnpaidLeaveDays('0')
    setResult(null)
    setLivePreview('')
  }

  function applyScenario(start: string, end: string, nat: NationalityType) {
    setStartDate(start)
    setEndDate(end)
    setNationality(nat)
    setResult(null)
  }

  const L = isAr ? {
    salary: 'الراتب الأساسي الشهري',
    salaryHint: 'الراتب الأساسي فقط — لا يشمل أي بدلات',
    startDate: 'تاريخ بدء العمل',
    endDate: 'تاريخ انتهاء الخدمة',
    nationality: 'فئة الموظف',
    expat: 'وافد / غير خاضع لنظام الحماية الاجتماعية',
    omani: 'عُماني (قد يخضع للتأمين الاجتماعي)',
    termination: 'سبب انتهاء الخدمة',
    standard: 'استقالة / إنهاء عقد (الحالة العادية)',
    misconduct: 'إنهاء بسبب سوء السلوك الجسيم',
    unpaidLeave: 'أيام الإجازة غير المدفوعة (للخصم)',
    quickScenarios: 'سيناريوهات سريعة',
    calculate: 'احسب المكافأة',
    reset: 'إعادة تعيين',
    results: 'نتيجة الحساب',
    totalGratuity: 'إجمالي مكافأة نهاية الخدمة',
    legacyPeriod: 'مرحلة ما قبل 31 يوليو 2023',
    newPeriod: 'مرحلة ما بعد 31 يوليو 2023',
    splitNote: 'يتم الحساب بصورة مزدوجة لأن خدمتك تمتد عبر تاريخ تغيير القانون (31 يوليو 2023).',
    preview: 'مدة الخدمة التقديرية:',
    eligible: 'مستحق للمكافأة',
    notEligible: 'غير مستحق للمكافأة',
    omaniNote: 'قد يخضع الموظفون العُمانيون لنظام التأمين الاجتماعي بدلاً من أو إضافةً إلى مكافأة نهاية الخدمة. تحقق من وضعك مع صاحب العمل.',
    misconductWarning: 'تحذير: قد تُصادر مكافأة نهاية الخدمة في حالات الإنهاء بسبب سوء السلوك الجسيم.',
    savingsNote: 'ملاحظة: يُرتقب تطبيق نظام ادخار جديد يحل محل المكافأة المقطوعة لبعض الوافدين خلال 3 سنوات من 2023.',
    legalNote: 'هذا تقدير استرشادي بموجب قانون العمل العُماني (المرسوم الملكي 53/2023، المادة 61). للمشورة الملزمة، تواصل مع وزارة العمل العُمانية أو استشر محامياً متخصصاً.',
    enterAmount: 'أدخل المبلغ',
    totalYears: 'إجمالي سنوات الخدمة',
    dailyRate: 'الأجر اليومي',
  } : {
    salary: 'Basic Monthly Salary',
    salaryHint: 'Basic salary only — exclude all allowances',
    startDate: 'Employment Start Date',
    endDate: 'Last Working Day',
    nationality: 'Employee Category',
    expat: 'Expatriate / Not under Social Protection',
    omani: 'Omani National (may be under social insurance)',
    termination: 'Reason for Leaving',
    standard: 'Standard (Resignation / Termination)',
    misconduct: 'Terminated for gross misconduct',
    unpaidLeave: 'Unpaid Leave Days (to exclude)',
    quickScenarios: 'Quick Scenarios',
    calculate: 'Calculate Gratuity',
    reset: 'Reset',
    results: 'Your Gratuity Estimate',
    totalGratuity: 'Total End-of-Service Gratuity',
    legacyPeriod: 'Period before 31 Jul 2023 (old law)',
    newPeriod: 'Period from 31 Jul 2023 (new law)',
    splitNote: 'Your service spans the law change date of 31 July 2023. The calculator automatically applies two different rates.',
    preview: 'Estimated service duration:',
    eligible: 'Eligible for gratuity',
    notEligible: 'Not eligible',
    omaniNote: 'Omani nationals may be covered under the Social Protection Law and receive pension benefits instead of or in addition to gratuity. Confirm your status with your employer.',
    misconductWarning: 'Warning: Gratuity may be forfeited in cases of termination for gross misconduct.',
    savingsNote: 'Note: A new savings scheme is expected to replace lump-sum gratuity for some expatriates within 3 years of the 2023 law. Current rules apply until then.',
    legalNote: 'This is an estimate under Oman Labour Law (Royal Decree 53/2023, Article 61). For binding advice, consult the Ministry of Labour or a qualified legal professional.',
    enterAmount: 'e.g. 400',
    totalYears: 'Total service years',
    dailyRate: 'Daily basic rate',
  }

  const scenarios = [
    { label: isAr ? '5 سنوات — وافد — 2020–2025' : '5 yrs expat 2020–2025', start: '2020-01-01', end: '2025-01-01', nat: 'expat' as NationalityType },
    { label: isAr ? '3 سنوات — بعد 2023' : '3 yrs post-2023', start: '2023-08-01', end: '2026-08-01', nat: 'expat' as NationalityType },
    { label: isAr ? '8 سنوات — ممتدة عبر 2023' : '8 yrs spanning 2023', start: '2017-01-01', end: '2025-01-01', nat: 'expat' as NationalityType },
  ]

  return (
    <div className="space-y-6">

      {/* Quick Scenarios */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{L.quickScenarios}</p>
        <div className="flex flex-wrap gap-2">
          {scenarios.map(s => (
            <button
              key={s.label}
              onClick={() => applyScenario(s.start, s.end, s.nat)}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Basic Salary */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">{L.salary}</label>
          <p className="text-xs text-gray-500 mb-1.5">{L.salaryHint}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">RO</span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={basicSalary}
              onChange={e => setBasicSalary(e.target.value)}
              placeholder={L.enterAmount}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.startDate}</label>
          <input
            type="date"
            value={startDate}
            max={endDate}
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
            min={startDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Live preview */}
        {livePreview && (
          <div className="sm:col-span-2 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
            <span className="text-xs text-emerald-700 font-medium">{L.preview}</span>
            <span className="text-sm font-bold text-emerald-800">{livePreview}</span>
          </div>
        )}

        {/* Split period notice */}
        {isSplit && (
          <div className="sm:col-span-2 flex gap-3 px-4 py-3 bg-violet-50 border border-violet-200 rounded-xl">
            <span className="text-violet-500 text-base leading-none mt-0.5">⚡</span>
            <p className="text-sm text-violet-800">{L.splitNote}</p>
          </div>
        )}

        {/* Nationality */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.nationality}</label>
          <select
            value={nationality}
            onChange={e => setNationality(e.target.value as NationalityType)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="expat">{L.expat}</option>
            <option value="omani">{L.omani}</option>
          </select>
        </div>

        {/* Unpaid Leave */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.unpaidLeave}</label>
          <input
            type="number"
            min="0"
            value={unpaidLeaveDays}
            onChange={e => setUnpaidLeaveDays(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Termination Type */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.termination}</label>
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            {(['standard', 'misconduct'] as TerminationType[]).map(t => (
              <button
                key={t}
                onClick={() => setTerminationType(t)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  terminationType === t ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'standard' ? L.standard : L.misconduct}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contextual notices */}
      {nationality === 'omani' && (
        <div className="flex gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="text-blue-500 text-base leading-none mt-0.5">ℹ️</span>
          <p className="text-sm text-blue-800">{L.omaniNote}</p>
        </div>
      )}
      {terminationType === 'misconduct' && (
        <div className="flex gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-amber-500 text-base leading-none mt-0.5">⚠️</span>
          <p className="text-sm text-amber-800">{L.misconductWarning}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCalculate}
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

      {/* Results */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">{L.results}</h3>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${result.eligible ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {result.eligible ? L.eligible : L.notEligible}
            </span>
          </div>

          {result.eligible ? (
            <>
              {/* Hero */}
              <div className="bg-emerald-600 rounded-xl p-4 text-white">
                <div className="text-sm opacity-80 mb-1">{L.totalGratuity}</div>
                <div className="text-3xl font-black">{fmt(result.totalGratuity)}</div>
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <ResultRow label={L.totalYears} value={fmtYears(result.totalYears, isAr)} />
                <ResultRow label={L.dailyRate} value={fmt(result.dailyRate)} />

                {/* Split breakdown — only show both rows if both periods exist */}
                {result.legacyYears > 0 && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{L.legacyPeriod}</span>
                      <span className="text-xs text-gray-500">({fmtYears(result.legacyYears, isAr)})</span>
                    </div>
                    <div className="px-4 py-3">
                      <ResultRow
                        label={isAr ? 'الأجر اليومي × 15 يوم (أول 3 سنوات) ثم 30 يوم' : '15 days/yr (first 3), then 30 days/yr'}
                        value={fmt(result.legacyGratuity)}
                        highlight
                      />
                    </div>
                  </div>
                )}

                {result.newYears > 0 && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{L.newPeriod}</span>
                      <span className="text-xs text-gray-500">({fmtYears(result.newYears, isAr)})</span>
                    </div>
                    <div className="px-4 py-3">
                      <ResultRow
                        label={isAr ? 'راتب شهر كامل × سنوات الخدمة (المادة 61)' : '1 full month × years of service (Art. 61)'}
                        value={fmt(result.newGratuity)}
                        highlight
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <ResultRow
                    label={isAr ? 'إجمالي المكافأة المستحقة' : 'Total gratuity entitlement'}
                    value={fmt(result.totalGratuity)}
                    highlight
                  />
                </div>
              </div>

              {/* Savings scheme note */}
              <div className="flex gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="text-amber-500 text-sm leading-none mt-0.5">🔔</span>
                <p className="text-xs text-amber-800">{L.savingsNote}</p>
              </div>
            </>
          ) : (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <div className="font-semibold text-red-700 mb-1">{L.notEligible}</div>
              <p className="text-sm text-red-600">{result.message}</p>
            </div>
          )}

          {/* Legal disclaimer */}
          <div className="flex gap-2.5 px-4 py-3 bg-gray-100 rounded-xl border border-gray-200">
            <span className="text-gray-500 text-base leading-none mt-0.5">⚖️</span>
            <p className="text-xs text-gray-500 leading-relaxed">{L.legalNote}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold text-right shrink-0 ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
