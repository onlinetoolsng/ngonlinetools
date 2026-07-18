'use client'

import { useState, useEffect } from 'react'

type Props = { locale: string }

// ─── Country configs ────────────────────────────────────────────────────────
const COUNTRIES = [
  {
    value: 'saudi',
    label: 'Saudi Arabia',
    labelAr: 'المملكة العربية السعودية',
    currency: 'SAR',
    divisor: 30,
    entitlementShort: 21,  // < 5 years
    entitlementLong: 30,   // >= 5 years
    threshold: 5,
    rule: 'Saudi Labour Law – Articles 109–111',
  },
  {
    value: 'uae',
    label: 'UAE',
    labelAr: 'الإمارات',
    currency: 'AED',
    divisor: 30,
    entitlementShort: 30,
    entitlementLong: 30,
    threshold: 1,
    rule: 'UAE Labour Law – Federal Decree-Law No. 33 of 2021',
  },
  {
    value: 'qatar',
    label: 'Qatar',
    labelAr: 'قطر',
    currency: 'QAR',
    divisor: 30,
    entitlementShort: 21,
    entitlementLong: 30,
    threshold: 5,
    rule: 'Qatar Labour Law – Law No. 14 of 2004',
  },
  {
    value: 'kuwait',
    label: 'Kuwait',
    labelAr: 'الكويت',
    currency: 'KWD',
    divisor: 26,
    entitlementShort: 30,
    entitlementLong: 30,
    threshold: 1,
    rule: 'Kuwait Labour Law – Law No. 6 of 2010',
  },
  {
    value: 'bahrain',
    label: 'Bahrain',
    labelAr: 'البحرين',
    currency: 'BHD',
    divisor: 30,
    entitlementShort: 30,
    entitlementLong: 30,
    threshold: 1,
    rule: 'Bahrain Labour Law – Law No. 36 of 2012',
  },
]

const SCENARIOS = [
  { value: 'advance', label: 'Vacation Pay (Advance)', labelAr: 'أجر الإجازة (مقدم)' },
  { value: 'accrued', label: 'Accrued Leave Compensation', labelAr: 'تعويض الإجازة المتراكمة' },
  { value: 'prorated', label: 'Prorated (Partial Year)', labelAr: 'محسوب بالتناسب (سنة جزئية)' },
]

type Result = {
  dailyRate: number
  leaveDays: number
  totalPay: number
  entitledDays: number
  currency: string
  scenario: string
  country: string
  rule: string
  monthsWorked?: number
  proratedDays?: number
}

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function calcVacationPay(
  monthlyWage: number,
  yearsOfService: number,
  leaveDaysInput: number,
  scenario: string,
  country: typeof COUNTRIES[0],
  monthsWorked: number
): Omit<Result, 'currency' | 'scenario' | 'country' | 'rule'> {
  const entitledDays =
    yearsOfService >= country.threshold
      ? country.entitlementLong
      : country.entitlementShort

  const dailyRate = monthlyWage / country.divisor

  if (scenario === 'prorated') {
    // Prorate based on months worked in current year
    const proratedDays = (entitledDays / 12) * monthsWorked
    const effectiveDays = Math.min(leaveDaysInput, proratedDays)
    return {
      dailyRate,
      leaveDays: parseFloat(effectiveDays.toFixed(2)),
      totalPay: dailyRate * effectiveDays,
      entitledDays,
      proratedDays: parseFloat(proratedDays.toFixed(2)),
      monthsWorked,
    }
  }

  const effectiveDays = Math.min(leaveDaysInput, entitledDays)
  return {
    dailyRate,
    leaveDays: effectiveDays,
    totalPay: dailyRate * effectiveDays,
    entitledDays,
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function InputField({
  label,
  prefix,
  value,
  onChange,
  placeholder,
  type = 'number',
  min,
  max,
  step,
}: {
  label: string
  prefix?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${prefix ? 'pl-16' : 'pl-4'} pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all`}
        />
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all appearance-none bg-no-repeat"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a8a29e' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 1rem center' }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function ScenarioTab({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-lg transition-all ${
        active
          ? 'bg-amber-500 text-white shadow-sm'
          : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
      }`}
    >
      {label}
    </button>
  )
}

function ResultRow({
  label,
  value,
  sub,
  highlight,
  negative,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  negative?: boolean
}) {
  return (
    <div className={`flex items-start justify-between gap-4 py-3 ${highlight ? 'border-t-2 border-amber-400 mt-1 pt-4' : ''}`}>
      <div>
        <div className={`text-sm ${highlight ? 'font-bold text-stone-900' : 'text-stone-600'}`}>{label}</div>
        {sub && <div className="text-xs text-stone-400 mt-0.5">{sub}</div>}
      </div>
      <div className={`text-sm font-bold whitespace-nowrap ${
        highlight ? 'text-amber-600 text-base' : negative ? 'text-red-500' : 'text-stone-900'
      }`}>
        {value}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SaudiVacationCalculator({ locale }: Props) {
  const isAr = locale === 'ar'
  const dir = isAr ? 'rtl' : 'ltr'

  const [countryVal, setCountryVal] = useState('saudi')
  const [wage, setWage] = useState('')
  const [years, setYears] = useState('')
  const [leaveDays, setLeaveDays] = useState('')
  const [months, setMonths] = useState('')
  const [scenario, setScenario] = useState('advance')
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [animKey, setAnimKey] = useState(0)

  const country = COUNTRIES.find(c => c.value === countryVal)!

  // Auto-suggest leave days when entitlement changes
  useEffect(() => {
    const yrs = parseFloat(years)
    if (!isNaN(yrs)) {
      const entitled = yrs >= country.threshold ? country.entitlementLong : country.entitlementShort
      setLeaveDays(String(entitled))
    }
  }, [years, countryVal])

  function calculate() {
    setError('')
    const wageVal = parseFloat(wage)
    const yearsVal = parseFloat(years)
    const daysVal = parseFloat(leaveDays)
    const monthsVal = parseFloat(months) || 0

    if (!wageVal || wageVal <= 0) { setError('Please enter a valid monthly wage.'); return }
    if (isNaN(yearsVal) || yearsVal < 0) { setError('Please enter years of service.'); return }
    if (!daysVal || daysVal <= 0) { setError('Please enter leave days.'); return }
    if (scenario === 'prorated' && (!monthsVal || monthsVal < 1 || monthsVal > 12)) {
      setError('Enter months worked this year (1–12).'); return
    }

    const calc = calcVacationPay(wageVal, yearsVal, daysVal, scenario, country, monthsVal)

    setResult({
      ...calc,
      currency: country.currency,
      scenario,
      country: country.label,
      rule: country.rule,
    })
    setAnimKey(k => k + 1)
  }

  function reset() {
    setWage('')
    setYears('')
    setLeaveDays('')
    setMonths('')
    setScenario('advance')
    setResult(null)
    setError('')
  }

  const scenarioLabel = {
    advance: isAr ? 'أجر إجازة مدفوع مقدماً' : 'Advance Vacation Pay',
    accrued: isAr ? 'تعويض إجازة غير مستخدمة' : 'Unused Leave Compensation',
    prorated: isAr ? 'إجازة محسوبة بالتناسب' : 'Prorated Leave Pay',
  }[scenario]

  return (
    <div dir={dir} className="space-y-6 font-[system-ui]">

      {/* Scenario Tabs */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2">
          {isAr ? 'نوع الحساب' : 'Calculation Type'}
        </label>
        <div className="flex gap-1.5 bg-stone-100 p-1 rounded-xl">
          {SCENARIOS.map(s => (
            <ScenarioTab
              key={s.value}
              active={scenario === s.value}
              label={isAr ? s.labelAr : s.label}
              onClick={() => setScenario(s.value)}
            />
          ))}
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <InputField
            label={isAr ? 'الأجر الشهري الإجمالي' : 'Total Monthly Wage'}
            prefix={country.currency}
            value={wage}
            onChange={setWage}
            placeholder={isAr ? 'أدخل الأجر' : 'Basic + regular allowances'}
          />
        </div>

        <SelectField
          label={isAr ? 'الدولة' : 'Country'}
          value={countryVal}
          onChange={setCountryVal}
          options={COUNTRIES.map(c => ({ value: c.value, label: isAr ? c.labelAr : c.label }))}
        />

        <InputField
          label={isAr ? 'سنوات الخدمة' : 'Years of Service'}
          value={years}
          onChange={setYears}
          placeholder="e.g. 3.5"
          min={0}
          max={50}
          step={0.5}
        />

        <InputField
          label={isAr ? 'أيام الإجازة المطلوبة' : 'Leave Days'}
          value={leaveDays}
          onChange={setLeaveDays}
          placeholder={isAr ? 'أيام' : 'Days'}
          min={1}
          max={365}
        />

        {scenario === 'prorated' && (
          <InputField
            label={isAr ? 'أشهر العمل هذا العام' : 'Months Worked This Year'}
            value={months}
            onChange={setMonths}
            placeholder="1–12"
            min={1}
            max={12}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm shadow-amber-200"
        >
          {isAr ? 'احسب' : 'Calculate'}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3.5 border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold rounded-xl transition-colors"
        >
          {isAr ? 'إعادة' : 'Reset'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div
          key={animKey}
          className="bg-gradient-to-br from-stone-50 to-amber-50/30 border border-stone-200 rounded-2xl p-6 space-y-1"
          style={{ animation: 'fadeSlideIn 0.3s ease-out both' }}
        >
          {/* Hero */}
          <div className="bg-stone-900 rounded-xl p-5 text-white mb-4">
            <div className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-1">
              {scenarioLabel}
            </div>
            <div className="text-3xl font-black tracking-tight">
              {fmt(result.totalPay, result.currency)}
            </div>
            <div className="text-xs opacity-50 mt-2">{result.rule}</div>
          </div>

          {/* Breakdown rows */}
          <div className="divide-y divide-stone-100">
            <ResultRow
              label={isAr ? 'الأجر الشهري' : 'Monthly Wage'}
              value={fmt(result.totalPay / result.leaveDays * (country.divisor), result.currency)}
            />
            <ResultRow
              label={isAr ? 'المعدل اليومي' : 'Daily Rate'}
              sub={`Monthly ÷ ${country.divisor}`}
              value={fmt(result.dailyRate, result.currency)}
            />
            <ResultRow
              label={isAr ? 'أيام الاستحقاق' : 'Leave Entitlement'}
              value={`${result.entitledDays} ${isAr ? 'يوم' : 'days'}`}
            />
            {result.proratedDays !== undefined && (
              <ResultRow
                label={isAr ? 'أيام بالتناسب' : 'Prorated Days'}
                sub={`${result.monthsWorked} months / 12`}
                value={`${result.proratedDays} ${isAr ? 'يوم' : 'days'}`}
              />
            )}
            <ResultRow
              label={isAr ? 'الأيام المحتسبة' : 'Days Applied'}
              value={`${result.leaveDays} ${isAr ? 'يوم' : 'days'}`}
            />
            <ResultRow
              label={isAr ? 'إجمالي أجر الإجازة' : 'Total Vacation Pay'}
              value={fmt(result.totalPay, result.currency)}
              highlight
            />
          </div>

          {/* Disclaimer */}
          <div className="mt-4 pt-4 border-t border-stone-200">
            <p className="text-xs text-stone-400 leading-relaxed">
              {isAr
                ? 'هذه الأداة للحساب التقديري فقط وليست استشارة قانونية. راجع وزارة الموارد البشرية أو مستشاراً قانونياً للتحقق.'
                : 'This tool provides estimates only and does not constitute legal advice. Verify with the Ministry of Human Resources (HRSD) or a qualified legal advisor.'}
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
