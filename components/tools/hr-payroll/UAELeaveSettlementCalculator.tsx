'use client'

import { useState, useCallback } from 'react'

type Props = { locale: string }

type ContractType = 'limited' | 'unlimited'
type TerminationReason = 'resignation' | 'termination' | 'mutual'

type Result = {
  serviceYears: number
  serviceMonths: number
  serviceDays: number
  accrualRate: string
  accruedLeaveDays: number
  unusedLeaveDays: number
  dailyBasicRate: number
  leaveEncashment: number
  gratuityDays: number
  gratuityAmount: number
  totalSettlement: number
  noticePay: number
  breakdown: {
    label: string
    labelAr: string
    amount: number
    formula: string
  }[]
}

function formatAED(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function parseDate(val: string): Date | null {
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function diffDays(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function calcServicePeriod(startDate: Date, endDate: Date, unpaidLeaveDays: number) {
  const totalDays = diffDays(startDate, endDate) - unpaidLeaveDays
  const years = Math.floor(totalDays / 365)
  const remainingDays = totalDays - years * 365
  const months = Math.floor(remainingDays / 30)
  const days = remainingDays - months * 30
  return { totalDays, years, months, days }
}

function calcAccruedLeave(totalServiceDays: number, unpaidLeaveDays: number): { days: number; rate: string } {
  const effectiveDays = totalServiceDays
  const totalMonths = effectiveDays / 30

  if (totalMonths < 6) return { days: 0, rate: '0 (< 6 months service)' }
  if (effectiveDays < 365) {
    // 2 days per month of service
    const days = Math.floor(totalMonths * 2)
    return { days, rate: '2 days/month (< 1 year)' }
  }
  // 2.5 days per month = 30 days per year
  const days = Math.floor(totalMonths * 2.5)
  return { days, rate: '2.5 days/month (30 days/year)' }
}

function calcGratuity(basicSalary: number, totalServiceDays: number): { days: number; amount: number } {
  const dailyRate = basicSalary / 30
  const years = totalServiceDays / 365

  if (years < 1) return { days: 0, amount: 0 }

  let gratuityDays = 0
  if (years <= 5) {
    gratuityDays = 21 * years
  } else {
    gratuityDays = 21 * 5 + 30 * (years - 5)
  }

  const cap = basicSalary * 24 // 2 years' basic salary cap
  const raw = dailyRate * gratuityDays
  const amount = Math.min(raw, cap)

  return { days: gratuityDays, amount }
}

export default function UAELeaveSettlementCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [basicSalary, setBasicSalary] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [takenLeaveDays, setTakenLeaveDays] = useState('')
  const [unpaidLeaveDays, setUnpaidLeaveDays] = useState('')
  const [contractType, setContractType] = useState<ContractType>('unlimited')
  const [terminationReason, setTerminationReason] = useState<TerminationReason>('resignation')
  const [noticePeriodDays, setNoticePeriodDays] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const calculate = useCallback(() => {
    const errs: string[] = []
    const salary = parseFloat(basicSalary)
    const start = parseDate(startDate)
    const end = parseDate(endDate)
    const taken = parseFloat(takenLeaveDays) || 0
    const unpaid = parseFloat(unpaidLeaveDays) || 0
    const noticeDays = parseFloat(noticePeriodDays) || 0

    if (!salary || salary <= 0) errs.push(isAr ? 'أدخل الراتب الأساسي' : 'Enter a valid basic salary')
    if (!start) errs.push(isAr ? 'أدخل تاريخ البدء' : 'Enter a valid start date')
    if (!end) errs.push(isAr ? 'أدخل تاريخ الانتهاء' : 'Enter a valid end date')
    if (start && end && end <= start) errs.push(isAr ? 'يجب أن يكون تاريخ الانتهاء بعد تاريخ البدء' : 'End date must be after start date')

    if (errs.length) { setErrors(errs); return }
    setErrors([])

    const { totalDays, years, months, days } = calcServicePeriod(start!, end!, unpaid)
    const { days: accrued, rate: accrualRate } = calcAccruedLeave(totalDays, unpaid)
    const unused = Math.max(0, accrued - taken)
    const dailyRate = salary / 30
    const leaveEncashment = dailyRate * unused
    const { days: gratuityDays, amount: gratuityAmount } = calcGratuity(salary, totalDays)
    const noticePay = dailyRate * noticeDays
    const totalSettlement = leaveEncashment + gratuityAmount + noticePay

    const breakdown = [
      {
        label: 'Leave Encashment',
        labelAr: 'مكافأة الإجازة',
        amount: leaveEncashment,
        formula: `AED ${salary.toFixed(0)} ÷ 30 × ${unused} days`,
      },
      {
        label: 'End-of-Service Gratuity',
        labelAr: 'مكافأة نهاية الخدمة',
        amount: gratuityAmount,
        formula: `${gratuityDays.toFixed(1)} gratuity days × AED ${dailyRate.toFixed(2)}/day`,
      },
      ...(noticeDays > 0
        ? [{
            label: 'Notice Period Pay',
            labelAr: 'راتب فترة الإشعار',
            amount: noticePay,
            formula: `AED ${dailyRate.toFixed(2)}/day × ${noticeDays} days`,
          }]
        : []),
    ]

    setResult({
      serviceYears: years,
      serviceMonths: months,
      serviceDays: days,
      accrualRate,
      accruedLeaveDays: accrued,
      unusedLeaveDays: unused,
      dailyBasicRate: dailyRate,
      leaveEncashment,
      gratuityDays,
      gratuityAmount,
      totalSettlement,
      noticePay,
      breakdown,
    })
  }, [basicSalary, startDate, endDate, takenLeaveDays, unpaidLeaveDays, noticePeriodDays, isAr])

  function reset() {
    setBasicSalary(''); setStartDate(''); setEndDate('')
    setTakenLeaveDays(''); setUnpaidLeaveDays(''); setNoticePeriodDays('')
    setContractType('unlimited'); setTerminationReason('resignation')
    setResult(null); setErrors([])
  }

  const l = isAr ? {
    title: 'حاسبة تسوية الإجازة — الإمارات',
    basicSalary: 'الراتب الأساسي الشهري (درهم)',
    startDate: 'تاريخ بدء العمل',
    endDate: 'تاريخ انتهاء العمل',
    takenLeave: 'أيام الإجازة المأخوذة',
    unpaidLeave: 'أيام الإجازة غير مدفوعة الأجر',
    contractType: 'نوع العقد',
    terminationReason: 'سبب إنهاء العقد',
    noticePeriod: 'أيام فترة الإشعار',
    limited: 'محدد المدة',
    unlimited: 'غير محدد المدة',
    resignation: 'استقالة',
    termination: 'إنهاء من صاحب العمل',
    mutual: 'اتفاق متبادل',
    advanced: 'خيارات متقدمة',
    calculate: 'احسب التسوية',
    reset: 'إعادة تعيين',
    results: 'ملخص التسوية',
    servicePeriod: 'فترة الخدمة',
    leaveEntitlement: 'استحقاق الإجازة',
    accruedDays: 'أيام الإجازة المستحقة',
    takenDays: 'أيام الإجازة المأخوذة',
    unusedDays: 'أيام الإجازة غير المستخدمة',
    dailyRate: 'معدل الراتب اليومي',
    total: 'إجمالي التسوية المقدر',
    disclaimer: 'للأغراض التوضيحية فقط. ليس نصيحة قانونية أو مالية. استشر وزارة الموارد البشرية أو متخصصاً قانونياً. بناءً على المرسوم الاتحادي بقانون رقم 33 لسنة 2021.',
    enterAmount: 'أدخل المبلغ',
    years: 'سنة', months: 'شهر', days: 'يوم',
  } : {
    title: 'UAE Leave Settlement Calculator',
    basicSalary: 'Monthly Basic Salary (AED)',
    startDate: 'Employment Start Date',
    endDate: 'End / Termination Date',
    takenLeave: 'Annual Leave Days Already Taken',
    unpaidLeave: 'Unpaid Leave Days (total)',
    contractType: 'Contract Type',
    terminationReason: 'Termination Reason',
    noticePeriod: 'Notice Period Days (if owed)',
    limited: 'Limited (Fixed-term)',
    unlimited: 'Unlimited',
    resignation: 'Resignation',
    termination: 'Employer Termination',
    mutual: 'Mutual Agreement',
    advanced: 'Advanced Options',
    calculate: 'Calculate Settlement',
    reset: 'Reset',
    results: 'Settlement Summary',
    servicePeriod: 'Service Period',
    leaveEntitlement: 'Leave Entitlement',
    accruedDays: 'Accrued Leave Days',
    takenDays: 'Leave Taken',
    unusedDays: 'Unused Leave Days',
    dailyRate: 'Daily Basic Rate',
    total: 'Estimated Total Settlement',
    disclaimer: 'For illustrative purposes only. Not legal or financial advice. Consult MOHRE or a legal professional. Based on Federal Decree-Law No. 33 of 2021.',
    enterAmount: 'Enter amount',
    years: 'yrs', months: 'mo', days: 'days',
  }

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5"

  return (
    <div className="space-y-6">
      {/* Core Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Basic Salary */}
        <div className="sm:col-span-2">
          <label className={labelClass}>{l.basicSalary}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number" min="0" value={basicSalary}
              onChange={e => setBasicSalary(e.target.value)}
              placeholder={l.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
            />
          </div>
        </div>

        {/* Dates */}
        <div>
          <label className={labelClass}>{l.startDate}</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{l.endDate}</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
        </div>

        {/* Leave taken */}
        <div>
          <label className={labelClass}>{l.takenLeave}</label>
          <input type="number" min="0" value={takenLeaveDays} onChange={e => setTakenLeaveDays(e.target.value)}
            placeholder="0" className={inputClass} />
        </div>

        {/* Unpaid leave */}
        <div>
          <label className={labelClass}>{l.unpaidLeave}
            <span className="ml-1 text-xs font-normal text-gray-500" title="Unpaid leave days are excluded from service period per UAE law">ⓘ</span>
          </label>
          <input type="number" min="0" value={unpaidLeaveDays} onChange={e => setUnpaidLeaveDays(e.target.value)}
            placeholder="0" className={inputClass} />
        </div>
      </div>

      {/* Advanced Toggle */}
      <div>
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
        >
          <span>{showAdvanced ? '▾' : '▸'}</span> {l.advanced}
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{l.contractType}</label>
              <select value={contractType} onChange={e => setContractType(e.target.value as ContractType)} className={inputClass}>
                <option value="unlimited">{l.unlimited}</option>
                <option value="limited">{l.limited}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{l.terminationReason}</label>
              <select value={terminationReason} onChange={e => setTerminationReason(e.target.value as TerminationReason)} className={inputClass}>
                <option value="resignation">{l.resignation}</option>
                <option value="termination">{l.termination}</option>
                <option value="mutual">{l.mutual}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{l.noticePeriod}</label>
              <input type="number" min="0" value={noticePeriodDays} onChange={e => setNoticePeriodDays(e.target.value)}
                placeholder="0" className={inputClass} />
            </div>
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-600">{e}</p>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={calculate}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-sm">
          {l.calculate}
        </button>
        <button onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors text-sm">
          {l.reset}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-5 border border-gray-100">
          <h3 className="font-bold text-gray-900 text-base">{l.results}</h3>

          {/* Total — hero */}
          <div className="bg-teal-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">{l.total}</div>
            <div className="text-3xl font-black">{formatAED(result.totalSettlement)}</div>
          </div>

          {/* Service Period */}
          <Section title={l.servicePeriod}>
            <InfoRow
              label={isAr ? 'مدة الخدمة' : 'Total Service'}
              value={`${result.serviceYears} ${l.years} ${result.serviceMonths} ${l.months} ${result.serviceDays} ${l.days}`}
            />
            <InfoRow
              label={isAr ? 'معدل الراتب اليومي' : l.dailyRate}
              value={formatAED(result.dailyBasicRate)}
              sub={isAr ? `${formatAED(parseFloat(basicSalary))} ÷ 30` : `AED ${parseFloat(basicSalary).toFixed(0)} ÷ 30`}
            />
          </Section>

          {/* Leave Entitlement */}
          <Section title={l.leaveEntitlement}>
            <InfoRow
              label={isAr ? 'معدل الاستحقاق' : 'Accrual Rate'}
              value={result.accrualRate}
            />
            <InfoRow label={l.accruedDays} value={`${result.accruedLeaveDays} ${isAr ? 'يوم' : 'days'}`} />
            <InfoRow label={l.takenDays} value={`${takenLeaveDays || 0} ${isAr ? 'يوم' : 'days'}`} negative />
            <InfoRow label={l.unusedDays} value={`${result.unusedLeaveDays} ${isAr ? 'يوم' : 'days'}`} highlight />
          </Section>

          {/* Breakdown */}
          <Section title={isAr ? 'تفاصيل المبالغ' : 'Amount Breakdown'}>
            {result.breakdown.map((row, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-sm text-gray-600">{isAr ? row.labelAr : row.label}</span>
                  <div className="text-xs text-gray-500 mt-0.5 font-mono">{row.formula}</div>
                </div>
                <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatAED(row.amount)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3">
              <InfoRow
                label={l.total}
                value={formatAED(result.totalSettlement)}
                highlight
              />
            </div>
          </Section>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
            {l.disclaimer}
          </p>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, negative, highlight, sub }: {
  label: string; value: string; negative?: boolean; highlight?: boolean; sub?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="text-sm text-gray-600">{label}</span>
        {sub && <div className="text-xs text-gray-500 font-mono mt-0.5">{sub}</div>}
      </div>
      <span className={`text-sm font-semibold whitespace-nowrap ${highlight ? 'text-teal-600' : negative ? 'text-red-500' : 'text-gray-900'}`}>
        {negative && value !== '0 days' ? `− ${value}` : value}
      </span>
    </div>
  )
}
