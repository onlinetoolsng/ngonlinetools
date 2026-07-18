'use client'

import { useState, useEffect } from 'react'

type Props = { locale: string }

type Result = {
  eligible: boolean
  totalGratuity: number
  serviceYears: number
  dailyRate: number
  gratuityPerYear: number
  fullYears: number
  fractionalMonths: number
  message?: string
}

function formatNum(n: number, decimals = 2) {
  return `QAR ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function dateDiffDetailed(start: Date, end: Date, excludedMonths: number) {
  const msPerDay = 1000 * 60 * 60 * 24
  const totalDays = Math.floor((end.getTime() - start.getTime()) / msPerDay)
  const adjustedDays = Math.max(0, totalDays - excludedMonths * 30)
  const totalYears = adjustedDays / 365.25
  const fullYears = Math.floor(totalYears)
  const fractionalYears = totalYears - fullYears
  const fractionalMonths = Math.round(fractionalYears * 12)
  return { totalYears, fullYears, fractionalMonths }
}

function calculateGratuity(
  basicSalary: number,
  startDate: Date,
  endDate: Date,
  excludedMonths: number
): Result {
  if (endDate <= startDate) {
    return { eligible: false, totalGratuity: 0, serviceYears: 0, dailyRate: 0, gratuityPerYear: 0, fullYears: 0, fractionalMonths: 0, message: 'End date must be after start date.' }
  }

  const { totalYears, fullYears, fractionalMonths } = dateDiffDetailed(startDate, endDate, excludedMonths)

  if (totalYears < 1) {
    return { eligible: false, totalGratuity: 0, serviceYears: totalYears, dailyRate: 0, gratuityPerYear: 0, fullYears, fractionalMonths, message: 'Minimum 1 year of continuous service is required for gratuity eligibility under Qatar Labour Law.' }
  }

  const dailyRate = basicSalary / 30
  const gratuityPerYear = dailyRate * 21
  const totalGratuity = gratuityPerYear * totalYears

  return {
    eligible: true,
    totalGratuity,
    serviceYears: totalYears,
    dailyRate,
    gratuityPerYear,
    fullYears,
    fractionalMonths,
  }
}

export default function QatarGratuityCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const todayStr = new Date().toISOString().split('T')[0]

  const [basicSalary, setBasicSalary] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(todayStr)
  const [nationality, setNationality] = useState('expat')
  const [excludedMonths, setExcludedMonths] = useState('0')
  const [misconduct, setMisconduct] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [serviceDuration, setServiceDuration] = useState<string>('')

  // Live service duration preview
  useEffect(() => {
    if (!startDate || !endDate) { setServiceDuration(''); return }
    const s = new Date(startDate)
    const e = new Date(endDate)
    if (e <= s) { setServiceDuration(''); return }
    const { fullYears, fractionalMonths } = dateDiffDetailed(s, e, parseInt(excludedMonths) || 0)
    const parts = []
    if (fullYears > 0) parts.push(`${fullYears} ${fullYears === 1 ? (isAr ? 'سنة' : 'year') : (isAr ? 'سنوات' : 'years')}`)
    if (fractionalMonths > 0) parts.push(`${fractionalMonths} ${isAr ? 'شهر' : 'mo'}`)
    setServiceDuration(parts.join(', ') || (isAr ? 'أقل من شهر' : 'Less than 1 month'))
  }, [startDate, endDate, excludedMonths, isAr])

  function calculate() {
    const salary = parseFloat(basicSalary)
    if (!salary || salary <= 0 || !startDate || !endDate) return
    const res = calculateGratuity(salary, new Date(startDate), new Date(endDate), parseInt(excludedMonths) || 0)
    setResult(res)
  }

  function reset() {
    setBasicSalary('')
    setStartDate('')
    setEndDate(todayStr)
    setNationality('expat')
    setExcludedMonths('0')
    setMisconduct(false)
    setResult(null)
    setServiceDuration('')
  }

  const L = isAr
    ? {
        title: 'حاسبة مكافأة نهاية الخدمة - قطر',
        salary: 'الراتب الأساسي الشهري',
        salaryHint: 'لا يشمل البدلات أو المكافآت',
        startDate: 'تاريخ بدء العمل',
        endDate: 'تاريخ انتهاء الخدمة',
        nationality: 'جنسية الموظف',
        expat: 'وافد / غير قطري',
        qatari: 'مواطن قطري',
        excludedMonths: 'الإجازات غير المدفوعة (بالأشهر)',
        misconduct: 'إنهاء بسبب سوء السلوك الجسيم (المادة 61)',
        calculate: 'احسب المكافأة',
        reset: 'إعادة تعيين',
        results: 'نتيجة الحساب',
        totalGratuity: 'إجمالي مكافأة نهاية الخدمة',
        servicePeriod: 'مدة الخدمة',
        dailyRate: 'الأجر اليومي',
        perYear: 'المكافأة السنوية (21 يوم)',
        notEligible: 'غير مستحق للمكافأة',
        misconductWarning: 'تحذير: قد تُصادر المكافأة في حالات الإنهاء بسبب سوء السلوك الجسيم.',
        qatariNote: 'ملاحظة: قد يستفيد المواطنون القطريون من نظام التأمين الاجتماعي بدلاً من أو إضافةً إلى مكافأة نهاية الخدمة.',
        legalNote: 'هذا تقدير استرشادي بناءً على قانون العمل القطري رقم 14 لسنة 2004، المادة 54. استشر المختص القانوني للحصول على مشورة ملزمة.',
        preview: 'مدة الخدمة المقدرة:',
        enterAmount: 'أدخل المبلغ',
      }
    : {
        title: 'Qatar End-of-Service Gratuity Calculator',
        salary: 'Basic Monthly Salary',
        salaryHint: 'Excluding allowances, bonuses, overtime',
        startDate: 'Employment Start Date',
        endDate: 'Last Working Day',
        nationality: 'Employee Nationality',
        expat: 'Expatriate / Non-Qatari',
        qatari: 'Qatari National',
        excludedMonths: 'Unpaid Leave (months to exclude)',
        misconduct: 'Termination due to gross misconduct (Art. 61)',
        calculate: 'Calculate Gratuity',
        reset: 'Reset',
        results: 'Your Gratuity Estimate',
        totalGratuity: 'Total End-of-Service Gratuity',
        servicePeriod: 'Service Period',
        dailyRate: 'Daily Basic Rate',
        perYear: 'Gratuity Per Year (21 days)',
        notEligible: 'Not Eligible for Gratuity',
        misconductWarning: 'Warning: Gratuity may be forfeited in cases of termination for gross misconduct under Article 61.',
        qatariNote: 'Note: Qatari nationals may receive benefits under the Social Insurance Law instead of or in addition to end-of-service gratuity.',
        legalNote: 'This is an estimate based on minimum legal requirements under Qatar Labour Law No. 14 of 2004, Art. 54. Actual entitlement depends on your contract and specific circumstances. Consult ADLSA or a legal professional for binding advice.',
        preview: 'Estimated service duration:',
        enterAmount: 'e.g. 5000',
      }

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Basic Salary */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {L.salary}
          </label>
          <p className="text-xs text-gray-500 mb-1.5">{L.salaryHint}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">QAR</span>
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

        {/* Service Duration Preview */}
        {serviceDuration && (
          <div className="sm:col-span-2 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
            <span className="text-xs text-emerald-700 font-medium">{L.preview}</span>
            <span className="text-sm font-bold text-emerald-800">{serviceDuration}</span>
          </div>
        )}

        {/* Nationality */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.nationality}</label>
          <select
            value={nationality}
            onChange={e => setNationality(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="expat">{L.expat}</option>
            <option value="qatari">{L.qatari}</option>
          </select>
        </div>

        {/* Excluded Months */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.excludedMonths}</label>
          <input
            type="number"
            min="0"
            max="120"
            value={excludedMonths}
            onChange={e => setExcludedMonths(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Misconduct checkbox */}
        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={misconduct}
              onChange={e => setMisconduct(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-600">{L.misconduct}</span>
          </label>
        </div>
      </div>

      {/* Misconduct warning */}
      {misconduct && (
        <div className="flex gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-amber-500 text-base leading-none mt-0.5">⚠️</span>
          <p className="text-sm text-amber-800">{L.misconductWarning}</p>
        </div>
      )}

      {/* Qatari note */}
      {nationality === 'qatari' && (
        <div className="flex gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="text-blue-500 text-base leading-none mt-0.5">ℹ️</span>
          <p className="text-sm text-blue-800">{L.qatariNote}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
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
          <h3 className="font-bold text-gray-900">{L.results}</h3>

          {result.eligible ? (
            <>
              {/* Hero result */}
              <div className="bg-emerald-600 rounded-xl p-4 text-white">
                <div className="text-sm opacity-80 mb-1">{L.totalGratuity}</div>
                <div className="text-3xl font-black">{formatNum(result.totalGratuity)}</div>
                {misconduct && (
                  <div className="mt-2 text-xs bg-white/20 rounded-lg px-3 py-1.5">⚠️ {isAr ? 'قابل للمصادرة بسبب سوء السلوك' : 'May be forfeited due to misconduct'}</div>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <ResultRow
                  label={L.servicePeriod}
                  value={`${result.fullYears}y ${result.fractionalMonths}mo (${result.serviceYears.toFixed(2)} ${isAr ? 'سنة' : 'yrs'})`}
                />
                <ResultRow
                  label={isAr ? 'الراتب الأساسي الشهري' : 'Basic Monthly Salary'}
                  value={formatNum(parseFloat(basicSalary))}
                />
                <ResultRow
                  label={L.dailyRate}
                  value={`${formatNum(result.dailyRate)} ${isAr ? '÷ 30 يوم' : '÷ 30 days'}`}
                />
                <ResultRow
                  label={L.perYear}
                  value={`${formatNum(result.gratuityPerYear)} × ${result.serviceYears.toFixed(2)}`}
                />
                <div className="border-t border-gray-200 pt-3">
                  <ResultRow
                    label={isAr ? 'إجمالي المكافأة المستحقة' : 'Total Gratuity Entitlement'}
                    value={formatNum(result.totalGratuity)}
                    highlight
                  />
                </div>
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
      <span className={`text-sm font-semibold text-right ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
