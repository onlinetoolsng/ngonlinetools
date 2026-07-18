'use client'

import { useState, useEffect } from 'react'

type Props = { locale: string }

type TerminationType = 'terminated' | 'resigned' | 'marriage' | 'misconduct' | 'employer_breach'
type ContractType = 'unlimited' | 'limited'
type WorkerType = 'monthly' | 'domestic'

type Result = {
  eligible: boolean
  totalGratuity: number
  first5Years: number
  beyond5Years: number
  reductionFactor: number
  adjustedGratuity: number
  serviceYears: number
  dailyRate: number
  message?: string
  entitlementLevel: 'full' | 'partial' | 'none'
}

function formatNum(n: number, decimals = 3) {
  return `KWD ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function calculateGratuity(
  basicSalary: number,
  years: number,
  months: number,
  days: number,
  terminationType: TerminationType,
  contractType: ContractType,
  workerType: WorkerType
): Result {
  const totalYears = years + months / 12 + days / 365

  if (totalYears < 1 && terminationType !== 'marriage') {
    return {
      eligible: false,
      totalGratuity: 0,
      first5Years: 0,
      beyond5Years: 0,
      reductionFactor: 0,
      adjustedGratuity: 0,
      serviceYears: totalYears,
      dailyRate: 0,
      entitlementLevel: 'none',
      message: 'Minimum 1 year of continuous service is required for gratuity eligibility under Kuwait Labour Law No. 6 of 2010.',
    }
  }

  if (terminationType === 'misconduct') {
    return {
      eligible: false,
      totalGratuity: 0,
      first5Years: 0,
      beyond5Years: 0,
      reductionFactor: 0,
      adjustedGratuity: 0,
      serviceYears: totalYears,
      dailyRate: 0,
      entitlementLevel: 'none',
      message: 'Gratuity is forfeited in cases of termination due to gross misconduct as defined under Kuwait Labour Law.',
    }
  }

  const dailyRate = basicSalary / 30

  let first5 = 0
  let beyond5 = 0

  if (workerType === 'domestic') {
    // Domestic workers: 1 month per year
    const totalGratuity = basicSalary * totalYears
    return {
      eligible: true,
      totalGratuity,
      first5Years: totalGratuity,
      beyond5Years: 0,
      reductionFactor: 1,
      adjustedGratuity: totalGratuity,
      serviceYears: totalYears,
      dailyRate,
      entitlementLevel: 'full',
    }
  }

  // Monthly-paid: 15 days for first 5 years, 30 days beyond
  const yearsInFirst5 = Math.min(5, totalYears)
  const yearsBeyond5 = Math.max(0, totalYears - 5)

  first5 = dailyRate * 15 * yearsInFirst5
  beyond5 = dailyRate * 30 * yearsBeyond5

  const fullGratuity = first5 + beyond5

  // Cap at 1.5 years remuneration
  const cap = basicSalary * 18
  const cappedGratuity = Math.min(fullGratuity, cap)

  // Determine reduction factor for resignation on unlimited contracts
  let reductionFactor = 1
  let entitlementLevel: 'full' | 'partial' | 'none' = 'full'

  const isFullEntitlement =
    terminationType === 'terminated' ||
    terminationType === 'marriage' ||
    terminationType === 'employer_breach'

  const isLimitedResignation = terminationType === 'resigned' && contractType === 'limited'

  if (isFullEntitlement || isLimitedResignation) {
    reductionFactor = 1
    entitlementLevel = 'full'
  } else if (terminationType === 'resigned' && contractType === 'unlimited') {
    if (totalYears < 3) {
      reductionFactor = 0
      entitlementLevel = 'none'
    } else if (totalYears < 5) {
      reductionFactor = 0.5
      entitlementLevel = 'partial'
    } else if (totalYears < 10) {
      reductionFactor = 2 / 3
      entitlementLevel = 'partial'
    } else {
      reductionFactor = 1
      entitlementLevel = 'full'
    }
  }

  if (reductionFactor === 0) {
    return {
      eligible: false,
      totalGratuity: cappedGratuity,
      first5Years: first5,
      beyond5Years: beyond5,
      reductionFactor: 0,
      adjustedGratuity: 0,
      serviceYears: totalYears,
      dailyRate,
      entitlementLevel: 'none',
      message: 'Employees who resign with less than 3 years of service on an unlimited contract are not entitled to gratuity under Kuwait Labour Law No. 6 of 2010.',
    }
  }

  const adjustedGratuity = cappedGratuity * reductionFactor

  return {
    eligible: true,
    totalGratuity: cappedGratuity,
    first5Years: first5,
    beyond5Years: beyond5,
    reductionFactor,
    adjustedGratuity,
    serviceYears: totalYears,
    dailyRate,
    entitlementLevel,
  }
}

export default function KuwaitGratuityCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [basicSalary, setBasicSalary] = useState('')
  const [years, setYears] = useState('')
  const [months, setMonths] = useState('0')
  const [days, setDays] = useState('0')
  const [terminationType, setTerminationType] = useState<TerminationType>('terminated')
  const [contractType, setContractType] = useState<ContractType>('unlimited')
  const [workerType, setWorkerType] = useState<WorkerType>('monthly')
  const [result, setResult] = useState<Result | null>(null)

  function calculate() {
    const salary = parseFloat(basicSalary)
    const y = parseInt(years) || 0
    const m = parseInt(months) || 0
    const d = parseInt(days) || 0
    if (!salary || salary <= 0) return
    setResult(calculateGratuity(salary, y, m, d, terminationType, contractType, workerType))
  }

  function reset() {
    setBasicSalary('')
    setYears('')
    setMonths('0')
    setDays('0')
    setTerminationType('terminated')
    setContractType('unlimited')
    setWorkerType('monthly')
    setResult(null)
  }

  // Scenario shortcuts
  function applyScenario(y: number, t: TerminationType) {
    setYears(String(y))
    setMonths('0')
    setDays('0')
    setTerminationType(t)
  }

  const L = isAr
    ? {
        salary: 'الراتب الأساسي الشهري',
        salaryHint: 'الراتب الأساسي فقط — لا يشمل أي بدلات',
        serviceTitle: 'مدة الخدمة',
        yearsLabel: 'سنوات',
        monthsLabel: 'أشهر',
        daysLabel: 'أيام',
        terminationLabel: 'نوع انتهاء الخدمة',
        terminated: 'إنهاء من صاحب العمل / انتهاء العقد',
        resigned: 'استقالة الموظف',
        marriage: 'استقالة بسبب الزواج (خلال سنة من تاريخه)',
        misconduct: 'إنهاء بسبب سوء السلوك الجسيم',
        employer_breach: 'استقالة بسبب إخلال صاحب العمل',
        contractLabel: 'نوع العقد',
        unlimited: 'عقد غير محدد المدة',
        limited: 'عقد محدد المدة',
        workerLabel: 'نوع العمالة',
        monthly: 'موظف بأجر شهري',
        domestic: 'عامل منزلي (تأشيرة 20)',
        quickScenarios: 'سيناريوهات سريعة',
        calculate: 'احسب المكافأة',
        reset: 'إعادة تعيين',
        results: 'نتيجة الحساب',
        totalGratuity: 'إجمالي مكافأة نهاية الخدمة',
        first5: 'الخمس سنوات الأولى (15 يوماً/سنة)',
        beyond5: 'ما بعد 5 سنوات (30 يوماً/سنة)',
        adjustment: 'التعديل بعد نسبة الاستحقاق',
        fullEntitlement: 'مستحق للمكافأة كاملةً',
        partialEntitlement: 'مستحق لجزء من المكافأة',
        notEligible: 'غير مستحق للمكافأة',
        serviceYears: 'إجمالي سنوات الخدمة',
        dailyRate: 'الأجر اليومي',
        paymentNote: 'يجب صرف المكافأة خلال 7 أيام من تاريخ انتهاء الخدمة.',
        legalNote: 'هذا تقدير استرشادي بناءً على قانون العمل الكويتي رقم 6 لسنة 2010. استشر وزارة الشؤون الاجتماعية أو محامياً متخصصاً للحصول على مشورة ملزمة.',
        enterAmount: 'أدخل المبلغ',
        domesticNote: 'العمال المنزليون يستحقون شهر راتب عن كل سنة خدمة بموجب أحكام خاصة.',
        marriageNote: 'المرأة المستقيلة بسبب الزواج خلال سنة من تاريخه تستحق المكافأة كاملةً بصرف النظر عن مدة الخدمة.',
        capNote: 'الحد الأقصى للمكافأة: 18 شهراً من الراتب الأساسي.',
      }
    : {
        salary: 'Basic Monthly Salary',
        salaryHint: 'Basic salary only — exclude all allowances',
        serviceTitle: 'Length of Service',
        yearsLabel: 'Years',
        monthsLabel: 'Months',
        daysLabel: 'Days',
        terminationLabel: 'Reason for Leaving',
        terminated: 'Terminated by employer / Contract end',
        resigned: 'Resigned by employee',
        marriage: 'Resigned due to marriage (within 1 year of marriage)',
        misconduct: 'Terminated for gross misconduct',
        employer_breach: 'Resigned due to employer breach / health / moral',
        contractLabel: 'Contract Type',
        unlimited: 'Unlimited (indefinite) contract',
        limited: 'Limited (fixed-term) contract',
        workerLabel: 'Worker Type',
        monthly: 'Monthly-paid employee',
        domestic: 'Domestic worker (Visa 20)',
        quickScenarios: 'Quick Scenarios',
        calculate: 'Calculate Gratuity',
        reset: 'Reset',
        results: 'Your Gratuity Estimate',
        totalGratuity: 'Total End-of-Service Indemnity',
        first5: 'First 5 years (15 days/year)',
        beyond5: 'Beyond 5 years (30 days/year)',
        adjustment: 'After entitlement adjustment',
        fullEntitlement: 'Full entitlement',
        partialEntitlement: 'Partial entitlement',
        notEligible: 'Not eligible for gratuity',
        serviceYears: 'Total service years',
        dailyRate: 'Daily basic rate',
        paymentNote: 'Gratuity must be paid within 7 days of termination under Kuwait labour law.',
        legalNote: 'This is an estimate based on Kuwait Labour Law No. 6 of 2010. Consult the Ministry of Social Affairs & Labour or a legal professional for binding advice. Not legal advice.',
        enterAmount: 'e.g. 500',
        domesticNote: 'Domestic workers receive 1 month\'s salary per year under separate provisions.',
        marriageNote: 'Female employees resigning due to marriage within 1 year of the marriage date receive full gratuity regardless of service length.',
        capNote: 'Maximum gratuity is capped at 18 months\' basic salary under Kuwait law.',
      }

  const scenarios = [
    { label: isAr ? '5 سنوات — إنهاء' : '5 yrs terminated', y: 5, t: 'terminated' as TerminationType },
    { label: isAr ? '4 سنوات — استقالة' : '4 yrs resigned', y: 4, t: 'resigned' as TerminationType },
    { label: isAr ? '10 سنوات — استقالة' : '10 yrs resigned', y: 10, t: 'resigned' as TerminationType },
    { label: isAr ? '7 سنوات — إنهاء' : '7 yrs terminated', y: 7, t: 'terminated' as TerminationType },
  ]

  const entitlementBadge = result
    ? result.entitlementLevel === 'full'
      ? { text: L.fullEntitlement, cls: 'bg-emerald-100 text-emerald-700' }
      : result.entitlementLevel === 'partial'
      ? { text: L.partialEntitlement, cls: 'bg-amber-100 text-amber-700' }
      : { text: L.notEligible, cls: 'bg-red-100 text-red-700' }
    : null

  return (
    <div className="space-y-6">

      {/* Worker Type Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {(['monthly', 'domestic'] as WorkerType[]).map(wt => (
          <button
            key={wt}
            onClick={() => setWorkerType(wt)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
              workerType === wt ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {wt === 'monthly' ? L.monthly : L.domestic}
          </button>
        ))}
      </div>

      {/* Domestic worker note */}
      {workerType === 'domestic' && (
        <div className="flex gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
          <span className="text-blue-500 text-base leading-none mt-0.5">ℹ️</span>
          <p className="text-sm text-blue-800">{L.domesticNote}</p>
        </div>
      )}

      {/* Quick Scenarios */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{L.quickScenarios}</p>
        <div className="flex flex-wrap gap-2">
          {scenarios.map(s => (
            <button
              key={s.label}
              onClick={() => applyScenario(s.y, s.t)}
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">KWD</span>
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

        {/* Service Period */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.serviceTitle}</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input
                type="number"
                min="0"
                max="50"
                value={years}
                onChange={e => setYears(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-center"
              />
              <p className="text-xs text-center text-gray-500 mt-1">{L.yearsLabel}</p>
            </div>
            <div>
              <input
                type="number"
                min="0"
                max="11"
                value={months}
                onChange={e => setMonths(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-center"
              />
              <p className="text-xs text-center text-gray-500 mt-1">{L.monthsLabel}</p>
            </div>
            <div>
              <input
                type="number"
                min="0"
                max="30"
                value={days}
                onChange={e => setDays(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-center"
              />
              <p className="text-xs text-center text-gray-500 mt-1">{L.daysLabel}</p>
            </div>
          </div>
        </div>

        {/* Termination Type */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.terminationLabel}</label>
          <select
            value={terminationType}
            onChange={e => setTerminationType(e.target.value as TerminationType)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="terminated">{L.terminated}</option>
            <option value="resigned">{L.resigned}</option>
            <option value="marriage">{L.marriage}</option>
            <option value="employer_breach">{L.employer_breach}</option>
            <option value="misconduct">{L.misconduct}</option>
          </select>
        </div>

        {/* Marriage note */}
        {terminationType === 'marriage' && (
          <div className="sm:col-span-2 flex gap-3 px-4 py-3 bg-pink-50 border border-pink-100 rounded-xl">
            <span className="text-pink-500 text-base leading-none mt-0.5">💍</span>
            <p className="text-sm text-pink-800">{L.marriageNote}</p>
          </div>
        )}

        {/* Contract Type — only relevant for resignation on monthly */}
        {terminationType === 'resigned' && workerType === 'monthly' && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.contractLabel}</label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              {(['unlimited', 'limited'] as ContractType[]).map(ct => (
                <button
                  key={ct}
                  onClick={() => setContractType(ct)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                    contractType === ct ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {ct === 'unlimited' ? L.unlimited : L.limited}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">{L.results}</h3>
            {entitlementBadge && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${entitlementBadge.cls}`}>
                {entitlementBadge.text}
              </span>
            )}
          </div>

          {result.eligible ? (
            <>
              {/* Hero */}
              <div className="bg-emerald-600 rounded-xl p-4 text-white">
                <div className="text-sm opacity-80 mb-1">{L.totalGratuity}</div>
                <div className="text-3xl font-black">{formatNum(result.adjustedGratuity)}</div>
                {result.reductionFactor < 1 && (
                  <div className="mt-1.5 text-xs opacity-75">
                    {isAr ? `بعد تطبيق نسبة ${Math.round(result.reductionFactor * 100)}%` : `After ${Math.round(result.reductionFactor * 100)}% entitlement factor`}
                  </div>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-3">
                <ResultRow label={L.serviceYears} value={`${result.serviceYears.toFixed(2)} ${isAr ? 'سنة' : 'yrs'}`} />
                <ResultRow label={L.dailyRate} value={formatNum(result.dailyRate)} />
                {result.first5Years > 0 && (
                  <ResultRow label={L.first5} value={formatNum(result.first5Years)} />
                )}
                {result.beyond5Years > 0 && (
                  <ResultRow label={L.beyond5} value={formatNum(result.beyond5Years)} />
                )}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <ResultRow
                    label={isAr ? 'المجموع قبل التعديل' : 'Subtotal before adjustment'}
                    value={formatNum(result.totalGratuity)}
                  />
                  {result.reductionFactor < 1 && (
                    <ResultRow
                      label={`${L.adjustment} (${Math.round(result.reductionFactor * 100)}%)`}
                      value={formatNum(result.adjustedGratuity)}
                      highlight
                    />
                  )}
                  {result.reductionFactor === 1 && (
                    <ResultRow
                      label={isAr ? 'إجمالي المكافأة المستحقة' : 'Total gratuity entitlement'}
                      value={formatNum(result.adjustedGratuity)}
                      highlight
                    />
                  )}
                </div>
              </div>

              {/* Cap note */}
              <div className="flex gap-2.5 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                <span className="text-amber-500 text-sm leading-none mt-0.5">ℹ️</span>
                <p className="text-xs text-amber-800">{L.capNote}</p>
              </div>

              {/* Payment note */}
              <div className="flex gap-2.5 px-3 py-2.5 bg-gray-100 rounded-xl">
                <span className="text-gray-500 text-sm leading-none mt-0.5">🕐</span>
                <p className="text-xs text-gray-600">{L.paymentNote}</p>
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
