'use client'

import { useState, useMemo } from 'react'

type Props = { locale: string }

type ContractType = 'limited' | 'unlimited'
type SeparationReason = 'resignation' | 'termination' | 'expiry' | 'misconduct'

type Inputs = {
  basicSalary: string
  grossSalary: string
  startDate: string
  endDate: string
  contractType: ContractType
  separationReason: SeparationReason
  accruedLeaveDays: string
  usedLeaveDays: string
  unpaidAbsenceDays: string
  noticeInContract: string
  noticeServed: 'yes' | 'no'
  airTicket: 'yes' | 'no'
  airTicketAmount: string
  pendingOvertimeDays: string
  deductions: string
}

type SettlementResult = {
  serviceDuration: { years: number; months: number; days: number; totalDays: number; adjustedDays: number }
  dailyBasicRate: number
  dailyGrossRate: number
  gratuity: number
  leavePay: number
  unpaidSalary: number
  noticeCompensation: number
  airTicketAmount: number
  overtimePay: number
  deductions: number
  total: number
  isGratuityEligible: boolean
  isMisconduct: boolean
  cappedGratuity: boolean
  reductionApplied: boolean
  reductionLabel: string
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

function calcSettlement(inputs: Inputs): SettlementResult | null {
  const basic = parseFloat(inputs.basicSalary) || 0
  const gross = parseFloat(inputs.grossSalary) || basic
  if (basic <= 0 || !inputs.startDate || !inputs.endDate) return null
  if (new Date(inputs.endDate) <= new Date(inputs.startDate)) return null

  const dur = diffDates(inputs.startDate, inputs.endDate)
  const unpaidDays = parseFloat(inputs.unpaidAbsenceDays) || 0
  const adjustedDays = Math.max(dur.totalDays - unpaidDays, 0)
  const totalYears = adjustedDays / 365.25

  const dailyBasicRate = basic / 30
  const dailyGrossRate = gross / 30

  const isMisconduct = inputs.separationReason === 'misconduct'
  const isGratuityEligible = totalYears >= 1 && !isMisconduct

  // ── Gratuity ──────────────────────────────────────────────────────────────
  let gratuity = 0
  let cappedGratuity = false
  let reductionApplied = false
  let reductionLabel = 'Full entitlement'

  if (isGratuityEligible) {
    const yearsFirst5 = Math.min(totalYears, 5)
    const yearsAfter5 = Math.max(totalYears - 5, 0)
    const raw = dailyBasicRate * 21 * yearsFirst5 + dailyBasicRate * 30 * yearsAfter5

    // Unlimited + resignation reductions (legacy)
    let factor = 1
    if (inputs.contractType === 'unlimited' && inputs.separationReason === 'resignation') {
      if (totalYears < 3) { factor = 1 / 3; reductionLabel = '1/3 (resignation 1–3 yrs, unlimited)' }
      else if (totalYears < 5) { factor = 2 / 3; reductionLabel = '2/3 (resignation 3–5 yrs, unlimited)' }
      else reductionLabel = 'Full (5+ yrs unlimited, resignation)'
      if (factor < 1) reductionApplied = true
    }

    const afterReduction = raw * factor
    const cap = basic * 24
    if (afterReduction > cap) { gratuity = cap; cappedGratuity = true }
    else gratuity = afterReduction
  }

  // ── Unused Leave ──────────────────────────────────────────────────────────
  const accrued = parseFloat(inputs.accruedLeaveDays) || 0
  const used = parseFloat(inputs.usedLeaveDays) || 0
  const unusedDays = Math.max(accrued - used, 0)
  const leavePay = dailyBasicRate * unusedDays

  // ── Unpaid Salary (pending days in last month) ────────────────────────────
  // Estimate: fractional days in the last partial month
  const lastMonthDays = dur.days > 0 ? dur.days : 0
  const unpaidSalary = dailyGrossRate * lastMonthDays

  // ── Notice Compensation ───────────────────────────────────────────────────
  const noticeDays = parseFloat(inputs.noticeInContract) || 0
  let noticeCompensation = 0
  if (inputs.noticeServed === 'no' && noticeDays > 0) {
    noticeCompensation = dailyGrossRate * noticeDays
  }

  // ── Air Ticket ────────────────────────────────────────────────────────────
  const airTicketAmt = inputs.airTicket === 'yes' ? (parseFloat(inputs.airTicketAmount) || 0) : 0

  // ── Overtime ──────────────────────────────────────────────────────────────
  const overtimeDays = parseFloat(inputs.pendingOvertimeDays) || 0
  const overtimePay = dailyGrossRate * overtimeDays

  // ── Deductions ────────────────────────────────────────────────────────────
  const deductionsAmt = parseFloat(inputs.deductions) || 0

  const total = gratuity + leavePay + unpaidSalary + noticeCompensation + airTicketAmt + overtimePay - deductionsAmt

  return {
    serviceDuration: { ...dur, adjustedDays },
    dailyBasicRate,
    dailyGrossRate,
    gratuity,
    leavePay,
    unpaidSalary,
    noticeCompensation,
    airTicketAmount: airTicketAmt,
    overtimePay,
    deductions: deductionsAmt,
    total: Math.max(total, 0),
    isGratuityEligible,
    isMisconduct,
    cappedGratuity,
    reductionApplied,
    reductionLabel,
  }
}

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

type RowProps = { label: string; value: string; sub?: boolean; negative?: boolean; highlight?: boolean; note?: string }
function Row({ label, value, sub, negative, highlight, note }: RowProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${sub ? 'pl-4' : ''}`}>
      <div>
        <span className={`text-sm ${sub ? 'text-gray-500' : 'text-gray-700'}`}>{label}</span>
        {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
      </div>
      <span className={`text-sm font-semibold whitespace-nowrap ${highlight ? 'text-emerald-600 text-base' : negative ? 'text-red-500' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

type SectionProps = { title: string; children: React.ReactNode }
function Section({ title, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</h4>
      {children}
    </div>
  )
}

export default function UAEFinalSettlementCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [inputs, setInputs] = useState<Inputs>({
    basicSalary: '',
    grossSalary: '',
    startDate: '',
    endDate: '',
    contractType: 'limited',
    separationReason: 'resignation',
    accruedLeaveDays: '',
    usedLeaveDays: '',
    unpaidAbsenceDays: '0',
    noticeInContract: '30',
    noticeServed: 'yes',
    airTicket: 'no',
    airTicketAmount: '',
    pendingOvertimeDays: '0',
    deductions: '0',
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof Inputs, string>>>({})

  const result = useMemo(() => (submitted ? calcSettlement(inputs) : null), [inputs, submitted])

  function set<K extends keyof Inputs>(key: K, val: Inputs[K]) {
    setInputs(p => ({ ...p, [key]: val }))
    if (submitted) setErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const e: Partial<Record<keyof Inputs, string>> = {}
    if (!inputs.basicSalary || parseFloat(inputs.basicSalary) <= 0) e.basicSalary = isAr ? 'أدخل راتباً أساسياً صحيحاً' : 'Enter a valid basic salary'
    if (!inputs.startDate) e.startDate = isAr ? 'اختر تاريخ الانضمام' : 'Select joining date'
    if (!inputs.endDate) e.endDate = isAr ? 'اختر آخر يوم عمل' : 'Select last working day'
    if (inputs.startDate && inputs.endDate && new Date(inputs.endDate) <= new Date(inputs.startDate))
      e.endDate = isAr ? 'يجب أن يكون تاريخ الانتهاء بعد تاريخ البداية' : 'End date must be after start date'
    if (parseFloat(inputs.usedLeaveDays) > parseFloat(inputs.accruedLeaveDays))
      e.usedLeaveDays = isAr ? 'لا يمكن أن تتجاوز الإجازة المستخدمة المستحقة' : 'Used leave cannot exceed accrued'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function calculate() { if (validate()) setSubmitted(true) }
  function reset() {
    setInputs({ basicSalary: '', grossSalary: '', startDate: '', endDate: '', contractType: 'limited', separationReason: 'resignation', accruedLeaveDays: '', usedLeaveDays: '', unpaidAbsenceDays: '0', noticeInContract: '30', noticeServed: 'yes', airTicket: 'no', airTicketAmount: '', pendingOvertimeDays: '0', deductions: '0' })
    setSubmitted(false)
    setErrors({})
  }

  const inputCls = (field: keyof Inputs) =>
    `w-full px-4 py-3 border rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  const dur = result?.serviceDuration

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>⚠ {isAr ? 'تنبيه قانوني' : 'Legal Disclaimer'}:</strong>{' '}
        {isAr
          ? 'هذه الأداة تقدير استرشادي فقط بناءً على المرسوم بقانون الاتحادي رقم 33 لسنة 2021. ليست مشورة قانونية. تحقق مع وزارة الموارد البشرية أو مستشار قانوني. موظفو المناطق الحرة (DIFC، ADGM) قد يخضعون لأنظمة مختلفة.'
          : 'This tool provides estimates based on UAE Federal Decree-Law No. 33 of 2021. It is not legal advice. Results vary by contract, MOHRE rulings, and individual circumstances. Free zone employees (DIFC, ADGM) may follow different rules. Verify with MOHRE or a qualified professional.'}
      </div>

      {/* ── SECTION 1: Employment ── */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          {isAr ? '١. تفاصيل الوظيفة' : '1. Employment Details'}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'تاريخ الانضمام' : 'Joining Date'}</label>
          <input type="date" value={inputs.startDate} onChange={e => set('startDate', e.target.value)} className={inputCls('startDate')} />
          {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'آخر يوم عمل' : 'Last Working Day'}</label>
          <input type="date" value={inputs.endDate} onChange={e => set('endDate', e.target.value)} className={inputCls('endDate')} />
          {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'نوع العقد' : 'Contract Type'}</label>
          <select value={inputs.contractType} onChange={e => set('contractType', e.target.value as ContractType)} className={inputCls('contractType')}>
            <option value="limited">{isAr ? 'محدد المدة' : 'Limited (Fixed-Term)'}</option>
            <option value="unlimited">{isAr ? 'غير محدد المدة (قديم)' : 'Unlimited (Legacy)'}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'سبب إنهاء الخدمة' : 'Reason for Separation'}</label>
          <select value={inputs.separationReason} onChange={e => set('separationReason', e.target.value as SeparationReason)} className={inputCls('separationReason')}>
            <option value="resignation">{isAr ? 'استقالة' : 'Resignation'}</option>
            <option value="termination">{isAr ? 'إنهاء من صاحب العمل' : 'Termination by Employer'}</option>
            <option value="expiry">{isAr ? 'انتهاء العقد' : 'Contract Expiry'}</option>
            <option value="misconduct">{isAr ? 'مخالفة تأديبية' : 'Misconduct / Article 44'}</option>
          </select>
        </div>
      </div>

      {/* ── SECTION 2: Salary ── */}
      <div className="space-y-1 pt-2">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          {isAr ? '٢. تفاصيل الراتب' : '2. Salary Details'}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {isAr ? 'الراتب الأساسي الشهري (درهم)' : 'Basic Monthly Salary (AED)'}
          </label>
          <p className="text-xs text-gray-500 mb-1.5">{isAr ? 'الراتب الأساسي فقط — بدون بدلات' : 'Basic only — exclude allowances'}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">AED</span>
            <input type="number" min="0" value={inputs.basicSalary} onChange={e => set('basicSalary', e.target.value)} placeholder="e.g. 10000" className={`${inputCls('basicSalary')} pl-12`} />
          </div>
          {errors.basicSalary && <p className="text-xs text-red-500 mt-1">{errors.basicSalary}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {isAr ? 'الراتب الإجمالي الشهري (اختياري)' : 'Gross Monthly Salary (optional)'}
          </label>
          <p className="text-xs text-gray-500 mb-1.5">{isAr ? 'للراتب غير المسدد وتعويض الإشعار' : 'Used for unpaid salary & notice compensation'}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">AED</span>
            <input type="number" min="0" value={inputs.grossSalary} onChange={e => set('grossSalary', e.target.value)} placeholder={isAr ? 'مساوٍ للأساسي إن تُرك فارغاً' : 'Defaults to basic if blank'} className={`${inputCls('grossSalary')} pl-12`} />
          </div>
        </div>
      </div>

      {/* ── SECTION 3: Leave ── */}
      <div className="space-y-1 pt-2">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          {isAr ? '٣. الإجازة والغياب' : '3. Leave & Absences'}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'إجازة مستحقة (أيام)' : 'Accrued Leave (days)'}</label>
          <input type="number" min="0" value={inputs.accruedLeaveDays} onChange={e => set('accruedLeaveDays', e.target.value)} placeholder="e.g. 30" className={inputCls('accruedLeaveDays')} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'إجازة مستخدمة (أيام)' : 'Used Leave (days)'}</label>
          <input type="number" min="0" value={inputs.usedLeaveDays} onChange={e => set('usedLeaveDays', e.target.value)} placeholder="e.g. 10" className={inputCls('usedLeaveDays')} />
          {errors.usedLeaveDays && <p className="text-xs text-red-500 mt-1">{errors.usedLeaveDays}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'أيام غياب بلا راتب' : 'Unpaid Absence (days)'}</label>
          <input type="number" min="0" value={inputs.unpaidAbsenceDays} onChange={e => set('unpaidAbsenceDays', e.target.value)} placeholder="0" className={inputCls('unpaidAbsenceDays')} />
        </div>
      </div>

      {/* ── SECTION 4: Notice & Other ── */}
      <div className="space-y-1 pt-2">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
          {isAr ? '٤. الإشعار والمستحقات الأخرى' : '4. Notice Period & Other Entitlements'}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'مدة الإشعار بالعقد (أيام)' : 'Notice Period in Contract (days)'}</label>
          <input type="number" min="0" value={inputs.noticeInContract} onChange={e => set('noticeInContract', e.target.value)} placeholder="30" className={inputCls('noticeInContract')} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'هل تم تقديم الإشعار؟' : 'Notice Period Served?'}</label>
          <select value={inputs.noticeServed} onChange={e => set('noticeServed', e.target.value as 'yes' | 'no')} className={inputCls('noticeServed')}>
            <option value="yes">{isAr ? 'نعم' : 'Yes — fully served'}</option>
            <option value="no">{isAr ? 'لا — تعويض مستحق' : 'No — compensation due'}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'تذكرة عودة مستحقة؟' : 'Air Ticket Entitlement?'}</label>
          <select value={inputs.airTicket} onChange={e => set('airTicket', e.target.value as 'yes' | 'no')} className={inputCls('airTicket')}>
            <option value="no">{isAr ? 'لا' : 'No'}</option>
            <option value="yes">{isAr ? 'نعم' : 'Yes'}</option>
          </select>
        </div>
        {inputs.airTicket === 'yes' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'قيمة التذكرة (درهم)' : 'Air Ticket Value (AED)'}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">AED</span>
              <input type="number" min="0" value={inputs.airTicketAmount} onChange={e => set('airTicketAmount', e.target.value)} placeholder="e.g. 2000" className={`${inputCls('airTicketAmount')} pl-12`} />
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'أيام عمل إضافي معلقة' : 'Pending Overtime (days)'}</label>
          <input type="number" min="0" value={inputs.pendingOvertimeDays} onChange={e => set('pendingOvertimeDays', e.target.value)} placeholder="0" className={inputCls('pendingOvertimeDays')} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isAr ? 'خصومات (سلف، قروض، درهم)' : 'Deductions (loans, advances, AED)'}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">AED</span>
            <input type="number" min="0" value={inputs.deductions} onChange={e => set('deductions', e.target.value)} placeholder="0" className={`${inputCls('deductions')} pl-12`} />
          </div>
        </div>
      </div>

      {/* Misconduct warning */}
      {inputs.separationReason === 'misconduct' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
          {isAr
            ? '⚠ إنهاء الخدمة بسبب مخالفة تأديبية (المادة 44) قد يُسقط حق المكافأة كلياً أو جزئياً. راجع مستشاراً قانونياً.'
            : '⚠ Termination for misconduct (Article 44) may result in partial or full forfeiture of gratuity. Consult a legal professional.'}
        </div>
      )}

      {/* Unlimited + resignation note */}
      {inputs.contractType === 'unlimited' && inputs.separationReason === 'resignation' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          {isAr
            ? 'عقد غير محدد + استقالة: تُطبق قواعد الاستحقاق الجزئي — ثلث للسنوات 1–3، ثلثان للسنوات 3–5، كامل بعد 5 سنوات.'
            : 'Unlimited contract + resignation: legacy partial entitlement rules apply — 1/3 for 1–3 yrs, 2/3 for 3–5 yrs, full after 5 yrs.'}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button onClick={calculate} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
          {isAr ? 'احسب التسوية النهائية' : 'Calculate Final Settlement'}
        </button>
        <button onClick={reset} className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors">
          {isAr ? 'إعادة تعيين' : 'Reset'}
        </button>
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-5 border border-gray-100">
          <h3 className="font-bold text-gray-900">{isAr ? 'التسوية النهائية التقديرية' : 'Estimated Final Settlement'}</h3>

          {/* Hero */}
          <div className="bg-emerald-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">{isAr ? 'إجمالي التسوية' : 'Total Settlement Amount'}</div>
            <div className="text-3xl font-black">{fmt(result.total)}</div>
            <div className="text-xs opacity-70 mt-1">{isAr ? 'يجب الدفع خلال 14 يوماً من آخر يوم عمل' : 'Must be paid within 14 days of last working day'}</div>
          </div>

          {/* Service Duration */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{isAr ? 'مدة الخدمة' : 'Service Duration'}</p>
            <p className="text-gray-900 font-semibold text-sm">
              {dur && `${dur.years} ${isAr ? 'سنة' : 'yr(s)'}, ${dur.months} ${isAr ? 'شهر' : 'mo(s)'}, ${dur.days} ${isAr ? 'يوم' : 'day(s)'}`}
              {(parseFloat(inputs.unpaidAbsenceDays) || 0) > 0 && (
                <span className="text-gray-500 text-xs ml-2">
                  ({isAr ? 'بعد خصم أيام الغياب' : `adjusted for ${inputs.unpaidAbsenceDays} unpaid days`})
                </span>
              )}
            </p>
          </div>

          {/* Breakdown */}
          <div className="space-y-4">

            <Section title={isAr ? 'مكافأة نهاية الخدمة' : 'End of Service Gratuity'}>
              {!result.isGratuityEligible ? (
                <p className="text-sm text-red-600">
                  {result.isMisconduct
                    ? (isAr ? 'المكافأة ساقطة بسبب المخالفة التأديبية — استشر محامياً.' : 'Gratuity may be forfeited due to misconduct — consult a lawyer.')
                    : (isAr ? 'لا تستحق المكافأة — يُشترط سنة كاملة على الأقل (المادة 51).' : 'Not eligible — minimum 1 year of continuous service required (Article 51).')}
                </p>
              ) : (
                <>
                  <Row label={isAr ? 'معدل الأجر اليومي' : 'Daily Basic Rate'} value={fmt(result.dailyBasicRate)} sub />
                  {result.reductionApplied && <Row label={isAr ? 'نوع الاستحقاق' : 'Entitlement Type'} value={result.reductionLabel} sub />}
                  {result.cappedGratuity && <Row label={isAr ? 'تم تطبيق الحد الأقصى (24 شهراً)' : '2-Year Cap Applied'} value="⚠" sub note={isAr ? 'لا تتجاوز المكافأة راتب سنتين' : 'Gratuity capped at 2 years basic salary'} />}
                  <Row label={isAr ? 'مكافأة نهاية الخدمة' : 'Gratuity Amount'} value={fmt(result.gratuity)} />
                </>
              )}
            </Section>

            <div className="border-t border-gray-200" />

            <Section title={isAr ? 'إجازة وراتب معلق' : 'Leave & Pending Pay'}>
              <Row
                label={isAr ? `إجازة غير مستخدمة (${Math.max((parseFloat(inputs.accruedLeaveDays) || 0) - (parseFloat(inputs.usedLeaveDays) || 0), 0)} أيام)` : `Unused Leave (${Math.max((parseFloat(inputs.accruedLeaveDays) || 0) - (parseFloat(inputs.usedLeaveDays) || 0), 0)} days)`}
                value={fmt(result.leavePay)}
                note={isAr ? 'بناءً على الراتب الأساسي' : 'Based on basic salary'}
              />
              {result.unpaidSalary > 0 && (
                <Row label={isAr ? 'راتب معلق (أيام جزئية)' : 'Pending Salary (partial month)'} value={fmt(result.unpaidSalary)} note={isAr ? 'بناءً على الراتب الإجمالي' : 'Based on gross salary'} />
              )}
            </Section>

            {(result.noticeCompensation > 0 || result.airTicketAmount > 0 || result.overtimePay > 0) && (
              <>
                <div className="border-t border-gray-200" />
                <Section title={isAr ? 'مستحقات أخرى' : 'Other Entitlements'}>
                  {result.noticeCompensation > 0 && (
                    <Row label={isAr ? `تعويض إشعار (${inputs.noticeInContract} أيام)` : `Notice Compensation (${inputs.noticeInContract} days)`} value={fmt(result.noticeCompensation)} note={isAr ? 'بناءً على الراتب الإجمالي' : 'Based on gross salary'} />
                  )}
                  {result.airTicketAmount > 0 && (
                    <Row label={isAr ? 'تذكرة سفر' : 'Air Ticket'} value={fmt(result.airTicketAmount)} />
                  )}
                  {result.overtimePay > 0 && (
                    <Row label={isAr ? 'عمل إضافي معلق' : 'Pending Overtime'} value={fmt(result.overtimePay)} />
                  )}
                </Section>
              </>
            )}

            {result.deductions > 0 && (
              <>
                <div className="border-t border-gray-200" />
                <Section title={isAr ? 'الخصومات' : 'Deductions'}>
                  <Row label={isAr ? 'خصومات (سلف / قروض)' : 'Advances / Loans / Other'} value={`− ${fmt(result.deductions)}`} negative />
                </Section>
              </>
            )}

            <div className="border-t-2 border-gray-300 pt-4">
              <Row label={isAr ? 'إجمالي التسوية النهائية' : 'Total Final Settlement'} value={fmt(result.total)} highlight />
            </div>
          </div>

          {/* Payment note */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
            ✓ {isAr
              ? 'يلتزم صاحب العمل بسداد جميع المستحقات خلال 14 يوماً من آخر يوم عمل (المادة 53). يمكن تقديم شكوى عبر موهره في حال التأخير.'
              : 'Employer must settle all dues within 14 days of the last working day (Article 53). File a complaint via MOHRE if payment is delayed.'}
          </div>
        </div>
      )}
    </div>
  )
}
