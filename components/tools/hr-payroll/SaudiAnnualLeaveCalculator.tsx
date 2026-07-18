'use client'

import { useState, useCallback } from 'react'

type Props = { locale: string }

type Scenario = 'annual' | 'termination' | 'prorata'

type Result = {
  scenario: Scenario
  dailyRate: number
  entitlementDays: number
  prorataDays: number
  totalDays: number
  totalPay: number
  currency: string
  tier: '21' | '30'
  yearsOfService: number
  monthsWorked: number
}

function formatSAR(n: number) {
  return `SAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function SaudiAnnualLeaveCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [scenario, setScenario] = useState<Scenario>('annual')
  const [wage, setWage] = useState('')
  const [years, setYears] = useState('')
  const [months, setMonths] = useState('')
  const [unusedDays, setUnusedDays] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  const calculate = useCallback(() => {
    setError('')
    const wageVal = parseFloat(wage)
    const yearsVal = parseFloat(years) || 0
    const monthsVal = parseFloat(months) || 0
    const unusedVal = parseFloat(unusedDays) || 0

    if (!wageVal || wageVal <= 0) {
      setError(isAr ? 'يرجى إدخال راتب صحيح أكبر من صفر' : 'Please enter a valid wage greater than 0')
      return
    }

    const dailyRate = wageVal / 30
    const tier: '21' | '30' = yearsVal >= 5 ? '30' : '21'
    const entitlementDays = yearsVal >= 5 ? 30 : 21

    let prorataDays = 0
    let totalDays = 0
    let totalPay = 0

    if (scenario === 'annual') {
      // Full entitlement for the year
      prorataDays = 0
      totalDays = entitlementDays
      totalPay = totalDays * dailyRate

    } else if (scenario === 'prorata') {
      // Pro-rata based on months worked in partial year
      const totalMonths = yearsVal * 12 + monthsVal
      const effectiveTier = totalMonths / 12 >= 5 ? 30 : 21
      prorataDays = (monthsVal / 12) * effectiveTier
      totalDays = prorataDays
      totalPay = totalDays * dailyRate

    } else if (scenario === 'termination') {
      // Accrued leave on termination: tiered across the 5-year threshold
      // (21 days/year for years 1-5, 30 days/year after), plus partial year
      const fullYears = Math.floor(yearsVal)
      const tieredFullYearDays = Math.min(fullYears, 5) * 21 + Math.max(0, fullYears - 5) * 30
      const partialTierDays = fullYears >= 5 ? 30 : 21
      const partialDays = (monthsVal / 12) * partialTierDays
      prorataDays = partialDays
      // If unused days specified, use that; else calculate accrued
      if (unusedVal > 0) {
        totalDays = unusedVal
      } else {
        totalDays = tieredFullYearDays + partialDays
      }
      totalPay = totalDays * dailyRate
    }

    setResult({
      scenario,
      dailyRate,
      entitlementDays,
      prorataDays,
      totalDays,
      totalPay,
      currency: 'SAR',
      tier,
      yearsOfService: yearsVal,
      monthsWorked: monthsVal,
    })
  }, [wage, years, months, unusedDays, scenario, isAr])

  function reset() {
    setWage('')
    setYears('')
    setMonths('')
    setUnusedDays('')
    setResult(null)
    setError('')
    setScenario('annual')
  }

  const scenarios = isAr
    ? [
        { value: 'annual', label: 'إجازة سنوية (أثناء الخدمة)' },
        { value: 'prorata', label: 'حساب الاستحقاق التناسبي' },
        { value: 'termination', label: 'إجازة مستحقة عند الإنهاء' },
      ]
    : [
        { value: 'annual', label: 'Annual Leave Pay (During Employment)' },
        { value: 'prorata', label: 'Pro-rata Entitlement' },
        { value: 'termination', label: 'Accrued Leave on Termination' },
      ]

  const lbl = isAr
    ? {
        title: 'حاسبة الإجازة السنوية – السعودية',
        wage: 'الراتب الشهري الفعلي (ريال)',
        wageHint: 'الراتب الأساسي + البدلات الثابتة (أجر فعلي وفق نظام العمل)',
        years: 'سنوات الخدمة',
        months: 'أشهر إضافية (للسنة الجزئية)',
        unused: 'أيام الإجازة غير المستخدمة (اختياري)',
        calculate: 'احسب',
        reset: 'إعادة تعيين',
        results: 'نتائج الحساب',
        dailyRate: 'الأجر اليومي',
        entitlement: 'أيام الاستحقاق',
        prorata: 'أيام تناسبية',
        totalDays: 'إجمالي الأيام',
        totalPay: 'إجمالي مستحق الإجازة',
        tier21: 'المستوى: 21 يوم (أقل من 5 سنوات)',
        tier30: 'المستوى: 30 يوم (5 سنوات فأكثر)',
        disclaimer: 'للأغراض الإعلامية استناداً إلى نظام العمل السعودي (المادتان 109 و111). استشر جهات رسمية أو خبراء قانونيين لحالتك.',
        scenario: 'نوع الحساب',
        enterAmount: 'أدخل المبلغ',
      }
    : {
        title: 'Saudi Annual Leave Calculator',
        wage: 'Monthly Actual Wage (SAR)',
        wageHint: 'Basic salary + fixed allowances (Actual Wage per Labour Law)',
        years: 'Years of Service',
        months: 'Additional Months (Partial Year)',
        unused: 'Unused Leave Days (Optional)',
        calculate: 'Calculate',
        reset: 'Reset',
        results: 'Your Results',
        dailyRate: 'Daily Rate',
        entitlement: 'Entitlement Days',
        prorata: 'Pro-rata Days',
        totalDays: 'Total Days',
        totalPay: 'Total Leave Pay',
        tier21: 'Tier: 21 days (under 5 years)',
        tier30: 'Tier: 30 days (5+ years)',
        disclaimer: 'For informational purposes based on Saudi Labour Law (Articles 109 & 111). Consult official sources or legal experts for your specific case.',
        scenario: 'Calculation Type',
        enterAmount: 'Enter amount',
      }

  // Progress toward 30-day tier
  const yearsNum = parseFloat(years) || 0
  const progress = Math.min((yearsNum / 5) * 100, 100)

  return (
    <div className="space-y-6">

      {/* Scenario tabs */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{lbl.scenario}</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {scenarios.map(s => (
            <button
              key={s.value}
              onClick={() => { setScenario(s.value as Scenario); setResult(null); setError('') }}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                scenario === s.value
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Wage */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {lbl.wage}
          </label>
          <p className="text-xs text-gray-500 mb-1.5">{lbl.wageHint}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">SAR</span>
            <input
              type="number"
              min="0"
              value={wage}
              onChange={e => setWage(e.target.value)}
              placeholder={lbl.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Years */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{lbl.years}</label>
          <input
            type="number"
            min="0"
            max="50"
            value={years}
            onChange={e => setYears(e.target.value)}
            placeholder="e.g. 3"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Months (shown for prorata and termination) */}
        {(scenario === 'prorata' || scenario === 'termination') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{lbl.months}</label>
            <input
              type="number"
              min="0"
              max="11"
              value={months}
              onChange={e => setMonths(e.target.value)}
              placeholder="0–11"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        )}

        {/* Unused days (only for termination) */}
        {scenario === 'termination' && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{lbl.unused}</label>
            <input
              type="number"
              min="0"
              value={unusedDays}
              onChange={e => setUnusedDays(e.target.value)}
              placeholder="Leave blank to auto-calculate"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        )}
      </div>

      {/* Progress bar toward 30-day tier */}
      {yearsNum > 0 && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{isAr ? 'التقدم نحو مستحق 30 يوم' : 'Progress toward 30-day tier'}</span>
            <span>{yearsNum >= 5 ? (isAr ? '✓ مؤهل' : '✓ Qualified') : `${yearsNum}/5 ${isAr ? 'سنوات' : 'years'}`}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${yearsNum >= 5 ? 'bg-emerald-500' : 'bg-amber-400'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {lbl.calculate}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {lbl.reset}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">{lbl.results}</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              result.tier === '30'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {result.tier === '30' ? lbl.tier30 : lbl.tier21}
            </span>
          </div>

          {/* Hero: Total Pay */}
          <div className="bg-emerald-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">{lbl.totalPay}</div>
            <div className="text-3xl font-black">{formatSAR(result.totalPay)}</div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <Row label={lbl.dailyRate} value={formatSAR(result.dailyRate)} />
            {result.scenario !== 'prorata' && (
              <Row label={lbl.entitlement} value={`${result.entitlementDays} ${isAr ? 'يوم' : 'days'}`} />
            )}
            {result.prorataDays > 0 && (
              <Row label={lbl.prorata} value={`${formatNum(result.prorataDays)} ${isAr ? 'يوم' : 'days'}`} />
            )}
            <div className="border-t border-gray-200 pt-3">
              <Row label={lbl.totalDays} value={`${formatNum(result.totalDays)} ${isAr ? 'يوم' : 'days'}`} />
              <Row label={lbl.totalPay} value={formatSAR(result.totalPay)} highlight />
            </div>
          </div>

          {/* Comparison note */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">
              {isAr
                ? '🌍 للمقارنة: الإمارات تمنح عادةً 30 يوم بعد سنة خدمة. قطر والكويت تتبع تشريعات مختلفة.'
                : '🌍 For comparison: UAE typically grants 30 days after 1 year of service. Qatar and Kuwait follow different labour legislation.'}
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
        ⚠️ {lbl.disclaimer}
      </p>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
