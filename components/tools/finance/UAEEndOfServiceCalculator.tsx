'use client'

import { useState, useMemo } from 'react'

type Props = { locale: string }

type ContractType = 'limited' | 'unlimited'
type SeparationReason = 'termination' | 'resignation' | 'expiry' | 'mutual'

type Inputs = {
  basicSalary: string
  startDate: string
  endDate: string
  contractType: ContractType
  separationReason: SeparationReason
}

type BreakdownItem = {
  label: string
  days: number
  amount: number
}

type EOSResult = {
  serviceDuration: { years: number; months: number; days: number; totalDays: number }
  dailyRate: number
  breakdown: BreakdownItem[]
  reductionFactor: number
  reductionLabel: string
  subtotal: number
  cappedAt: number | null
  finalGratuity: number
  currency: 'AED'
  isEligible: boolean
}

function diffDates(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const totalDays = Math.floor((e.getTime() - s.getTime()) / 86400000)

  let years = e.getFullYear() - s.getFullYear()
  let months = e.getMonth() - s.getMonth()
  let days = e.getDate() - s.getDate()

  if (days < 0) { months--; days += 30 }
  if (months < 0) { years--; months += 12 }

  return { years, months, days, totalDays }
}

function calcEOS(inputs: Inputs): EOSResult | null {
  const salary = parseFloat(inputs.basicSalary)
  if (!salary || salary <= 0 || !inputs.startDate || !inputs.endDate) return null
  if (new Date(inputs.endDate) <= new Date(inputs.startDate)) return null

  const dur = diffDates(inputs.startDate, inputs.endDate)
  const totalYears = dur.totalDays / 365.25
  const dailyRate = salary / 30

  const isEligible = totalYears >= 1

  if (!isEligible) {
    return {
      serviceDuration: dur,
      dailyRate,
      breakdown: [],
      reductionFactor: 0,
      reductionLabel: '',
      subtotal: 0,
      cappedAt: null,
      finalGratuity: 0,
      currency: 'AED',
      isEligible: false,
    }
  }

  // Calculate full entitlement
  const breakdown: BreakdownItem[] = []

  const yearsFirst5 = Math.min(totalYears, 5)
  const yearsAfter5 = Math.max(totalYears - 5, 0)

  if (yearsFirst5 > 0) {
    const days = 21 * yearsFirst5
    breakdown.push({
      label: `First ${yearsFirst5 >= 5 ? '5' : yearsFirst5.toFixed(2)} year(s) × 21 days/yr`,
      days,
      amount: dailyRate * days,
    })
  }

  if (yearsAfter5 > 0) {
    const days = 30 * yearsAfter5
    breakdown.push({
      label: `Beyond 5 years (${yearsAfter5.toFixed(2)} yr) × 30 days/yr`,
      days,
      amount: dailyRate * days,
    })
  }

  const subtotal = breakdown.reduce((s, b) => s + b.amount, 0)

  // Reduction for unlimited contracts + resignation
  let reductionFactor = 1
  let reductionLabel = 'Full entitlement'

  if (inputs.contractType === 'unlimited' && inputs.separationReason === 'resignation') {
    if (totalYears < 1) {
      reductionFactor = 0
      reductionLabel = 'No entitlement (< 1 year)'
    } else if (totalYears < 3) {
      reductionFactor = 1 / 3
      reductionLabel = '1/3 entitlement (resignation, 1–3 yrs, unlimited)'
    } else if (totalYears < 5) {
      reductionFactor = 2 / 3
      reductionLabel = '2/3 entitlement (resignation, 3–5 yrs, unlimited)'
    } else {
      reductionFactor = 1
      reductionLabel = 'Full entitlement (resignation, 5+ yrs, unlimited)'
    }
  }

  const afterReduction = subtotal * reductionFactor

  // 2-year cap
  const cap = salary * 24
  const cappedAt = afterReduction > cap ? cap : null
  const finalGratuity = Math.min(afterReduction, cap)

  return {
    serviceDuration: dur,
    dailyRate,
    breakdown,
    reductionFactor,
    reductionLabel,
    subtotal,
    cappedAt,
    finalGratuity,
    currency: 'AED',
    isEligible: true,
  }
}

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function UAEEndOfServiceCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [inputs, setInputs] = useState<Inputs>({
    basicSalary: '',
    startDate: '',
    endDate: '',
    contractType: 'limited',
    separationReason: 'termination',
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof Inputs, string>>>({})

  const result = useMemo(() => (submitted ? calcEOS(inputs) : null), [inputs, submitted])

  function set<K extends keyof Inputs>(key: K, val: Inputs[K]) {
    setInputs(prev => ({ ...prev, [key]: val }))
    if (submitted) setErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const e: Partial<Record<keyof Inputs, string>> = {}
    const sal = parseFloat(inputs.basicSalary)
    if (!inputs.basicSalary || sal <= 0) e.basicSalary = 'Enter a valid basic salary'
    if (!inputs.startDate) e.startDate = 'Select a start date'
    if (!inputs.endDate) e.endDate = 'Select an end date'
    if (inputs.startDate && inputs.endDate && new Date(inputs.endDate) <= new Date(inputs.startDate))
      e.endDate = 'End date must be after start date'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function calculate() {
    if (validate()) setSubmitted(true)
  }

  function reset() {
    setInputs({ basicSalary: '', startDate: '', endDate: '', contractType: 'limited', separationReason: 'termination' })
    setSubmitted(false)
    setErrors({})
  }

  const L = isAr
    ? {
        basicSalary: 'الراتب الأساسي الشهري (درهم)',
        basicNote: 'الراتب الأساسي فقط — لا تشمل البدلات أو السكن أو العمولات',
        startDate: 'تاريخ الانضمام',
        endDate: 'تاريخ انتهاء الخدمة',
        contractType: 'نوع العقد',
        limited: 'عقد محدد المدة',
        unlimited: 'عقد غير محدد المدة (قديم)',
        reason: 'سبب إنهاء الخدمة',
        termination: 'إنهاء من صاحب العمل',
        resignation: 'استقالة الموظف',
        expiry: 'انتهاء مدة العقد',
        mutual: 'اتفاق مشترك',
        calculate: 'احسب المكافأة',
        reset: 'إعادة تعيين',
        results: 'نتيجة مكافأة نهاية الخدمة',
        service: 'مدة الخدمة',
        dailyRate: 'الأجر اليومي',
        entitlement: 'نوع الاستحقاق',
        subtotal: 'المجموع قبل التعديل',
        cap: 'الحد الأقصى (24 شهر)',
        total: 'إجمالي المكافأة',
        notEligible: 'لا يحق لك الحصول على مكافأة نهاية الخدمة — الحد الأدنى سنة واحدة من الخدمة.',
        disclaimer: 'هذه الأداة تقدير استرشادي استناداً إلى المرسوم الاتحادي بقانون رقم 33 لسنة 2021. ليست مشورة قانونية. تحقق مع وزارة الموارد البشرية أو مستشار قانوني.',
        payment: 'يجب دفع المكافأة خلال 14 يوماً من انتهاء الخدمة.',
      }
    : {
        basicSalary: 'Basic Monthly Salary (AED)',
        basicNote: 'Basic salary only — exclude allowances, housing, commissions',
        startDate: 'Joining Date',
        endDate: 'End of Service Date',
        contractType: 'Contract Type',
        limited: 'Limited (Fixed-Term)',
        unlimited: 'Unlimited (Legacy)',
        reason: 'Reason for Separation',
        termination: 'Termination by Employer',
        resignation: 'Resignation by Employee',
        expiry: 'Contract Expiry / End of Term',
        mutual: 'Mutual Agreement',
        calculate: 'Calculate Gratuity',
        reset: 'Reset',
        results: 'End of Service Gratuity',
        service: 'Service Duration',
        dailyRate: 'Daily Rate',
        entitlement: 'Entitlement Type',
        subtotal: 'Subtotal Before Adjustments',
        cap: '2-Year Cap Applied',
        total: 'Total Gratuity',
        notEligible: 'Not eligible for gratuity — minimum 1 year of continuous service required (Article 51).',
        disclaimer: 'This tool provides estimates based on UAE Federal Decree-Law No. 33 of 2021 and Cabinet Resolution No. 1 of 2022. It is not legal advice. Free zone employees (DIFC, ADGM) may follow different rules. Verify with MOHRE or a qualified professional.',
        payment: 'Gratuity must be paid within 14 days of end of service.',
      }

  const dur = result?.serviceDuration

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>⚠ {isAr ? 'تنبيه' : 'Disclaimer'}:</strong> {L.disclaimer}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Basic Salary */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">{L.basicSalary}</label>
          <p className="text-xs text-gray-500 mb-1.5">{L.basicNote}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number"
              min="0"
              value={inputs.basicSalary}
              onChange={e => set('basicSalary', e.target.value)}
              placeholder="e.g. 10000"
              className={`w-full pl-14 pr-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${errors.basicSalary ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
            />
          </div>
          {errors.basicSalary && <p className="text-xs text-red-500 mt-1">{errors.basicSalary}</p>}
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.startDate}</label>
          <input
            type="date"
            value={inputs.startDate}
            onChange={e => set('startDate', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${errors.startDate ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
          />
          {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.endDate}</label>
          <input
            type="date"
            value={inputs.endDate}
            onChange={e => set('endDate', e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${errors.endDate ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
          />
          {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
        </div>

        {/* Contract Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.contractType}</label>
          <select
            value={inputs.contractType}
            onChange={e => set('contractType', e.target.value as ContractType)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="limited">{L.limited}</option>
            <option value="unlimited">{L.unlimited}</option>
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.reason}</label>
          <select
            value={inputs.separationReason}
            onChange={e => set('separationReason', e.target.value as SeparationReason)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="termination">{L.termination}</option>
            <option value="resignation">{L.resignation}</option>
            <option value="expiry">{L.expiry}</option>
            <option value="mutual">{L.mutual}</option>
          </select>
        </div>
      </div>

      {/* Unlimited resignation info */}
      {inputs.contractType === 'unlimited' && inputs.separationReason === 'resignation' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          {isAr
            ? 'ملاحظة: عقود غير محددة المدة + استقالة — تطبق قواعد الاستحقاق الجزئي القديمة (1/3 للسنة الأولى حتى 3 سنوات، 2/3 من 3 إلى 5 سنوات، كامل بعد 5 سنوات).'
            : 'Note: Unlimited contracts + resignation — legacy partial entitlement rules apply (1/3 for 1–3 yrs, 2/3 for 3–5 yrs, full after 5 yrs).'}
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

          {!result.isEligible ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
              {L.notEligible}
            </div>
          ) : (
            <>
              {/* Hero result */}
              <div className="bg-emerald-600 rounded-xl p-4 text-white">
                <div className="text-sm opacity-80 mb-1">{L.total}</div>
                <div className="text-3xl font-black">{fmt(result.finalGratuity)}</div>
              </div>

              {/* Service duration */}
              <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{L.service}</p>
                <p className="text-gray-900 font-semibold">
                  {dur && `${dur.years} yr${dur.years !== 1 ? 's' : ''}, ${dur.months} mo${dur.months !== 1 ? 's' : ''}, ${dur.days} day${dur.days !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Breakdown rows */}
              <div className="space-y-3">
                <Row label={L.dailyRate} value={fmt(result.dailyRate)} />
                <Row label={L.entitlement} value={result.reductionLabel} />

                {result.breakdown.map((b, i) => (
                  <Row key={i} label={b.label} value={fmt(b.amount)} sub />
                ))}

                {result.reductionFactor < 1 && (
                  <Row
                    label={`× ${(result.reductionFactor * 100).toFixed(0)}% (${result.reductionLabel})`}
                    value={fmt(result.subtotal * result.reductionFactor)}
                  />
                )}

                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <Row label={L.subtotal} value={fmt(result.subtotal)} />
                  {result.cappedAt !== null && (
                    <Row label={L.cap} value={fmt(result.cappedAt)} negative />
                  )}
                  <Row label={L.total} value={fmt(result.finalGratuity)} highlight />
                </div>
              </div>

              {/* Payment timeline note */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
                ✓ {L.payment}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  negative = false,
  highlight = false,
  sub = false,
}: {
  label: string
  value: string
  negative?: boolean
  highlight?: boolean
  sub?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${sub ? 'pl-3' : ''}`}>
      <span className={`text-sm ${sub ? 'text-gray-500' : 'text-gray-600'}`}>{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight ? 'text-emerald-600' : negative ? 'text-red-500' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
