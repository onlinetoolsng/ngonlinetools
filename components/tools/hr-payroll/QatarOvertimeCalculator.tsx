'use client'

import { useState, useCallback } from 'react'

type Props = { locale: string }

type EmployeeType = 'non-managerial' | 'managerial'
type Period = 'day' | 'week' | 'month'

type OTEntry = {
  daytime: string
  night: string
  restday: string
}

type BreakdownRow = {
  category: string
  hours: number
  multiplier: number
  rate: number
  amount: number
}

type Result = {
  hourlyRate: number
  breakdown: BreakdownRow[]
  totalOTPay: number
  basicForPeriod: number
  grandTotal: number
  totalOTHours: number
  maxDailyWarning: boolean
  ramadan: boolean
  period: Period
}

function fmt(n: number) {
  return `QAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtH(n: number) {
  return `${parseFloat(n.toFixed(2))} hrs`
}

export default function QatarOvertimeCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [salary, setSalary] = useState('')
  const [ramadan, setRamadan] = useState(false)
  const [employeeType, setEmployeeType] = useState<EmployeeType>('non-managerial')
  const [period, setPeriod] = useState<Period>('day')
  const [ot, setOt] = useState<OTEntry>({ daytime: '', night: '', restday: '' })
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  const standardHours = ramadan ? 6 : 8

  const calculate = useCallback(() => {
    setError('')
    const salaryVal = parseFloat(salary)
    if (!salaryVal || salaryVal <= 0) {
      setError(isAr ? 'يرجى إدخال راتب أساسي صحيح' : 'Please enter a valid basic salary')
      return
    }
    if (employeeType === 'managerial') {
      setError(isAr
        ? 'المديرون والمشرفون قد يُعفَون من قواعد العمل الإضافي وفق نظام العمل القطري.'
        : 'Managers and supervisors may be exempt from overtime rules under Qatar Labour Law.')
      return
    }

    const daytimeHrs = parseFloat(ot.daytime) || 0
    const nightHrs = parseFloat(ot.night) || 0
    const restdayHrs = parseFloat(ot.restday) || 0
    const totalOTHours = daytimeHrs + nightHrs + restdayHrs

    // Hourly rate: Basic / 26 days / 8 hours (standard)
    const hourlyRate = salaryVal / 26 / 8

    const maxDailyWarning = (standardHours + totalOTHours) > 10

    const breakdown: BreakdownRow[] = []

    if (daytimeHrs > 0) {
      const amount = daytimeHrs * hourlyRate * 1.25
      breakdown.push({
        category: isAr ? 'عمل إضافي نهاري' : 'Daytime Overtime',
        hours: daytimeHrs,
        multiplier: 1.25,
        rate: hourlyRate * 1.25,
        amount,
      })
    }
    if (nightHrs > 0) {
      const amount = nightHrs * hourlyRate * 1.50
      breakdown.push({
        category: isAr ? 'عمل إضافي ليلي (9م–6ص)' : 'Night Overtime (9PM–6AM)',
        hours: nightHrs,
        multiplier: 1.50,
        rate: hourlyRate * 1.50,
        amount,
      })
    }
    if (restdayHrs > 0) {
      const amount = restdayHrs * hourlyRate * 1.50
      breakdown.push({
        category: isAr ? 'يوم راحة / عطلة رسمية' : 'Rest Day / Public Holiday',
        hours: restdayHrs,
        multiplier: 1.50,
        rate: hourlyRate * 1.50,
        amount,
      })
    }

    const totalOTPay = breakdown.reduce((s, r) => s + r.amount, 0)

    // Basic pay for period
    let basicForPeriod = 0
    if (period === 'day') basicForPeriod = salaryVal / 26
    else if (period === 'week') basicForPeriod = salaryVal / 4.33
    else basicForPeriod = salaryVal

    setResult({
      hourlyRate,
      breakdown,
      totalOTPay,
      basicForPeriod,
      grandTotal: basicForPeriod + totalOTPay,
      totalOTHours,
      maxDailyWarning,
      ramadan,
      period,
    })
  }, [salary, ot, period, ramadan, employeeType, standardHours, isAr])

  function reset() {
    setSalary('')
    setRamadan(false)
    setEmployeeType('non-managerial')
    setPeriod('day')
    setOt({ daytime: '', night: '', restday: '' })
    setResult(null)
    setError('')
  }

  function loadExample() {
    setSalary('3000')
    setRamadan(false)
    setEmployeeType('non-managerial')
    setPeriod('day')
    setOt({ daytime: '2', night: '1', restday: '0' })
    setResult(null)
    setError('')
  }

  const lbl = isAr ? {
    salary: 'الراتب الأساسي الشهري (ريال قطري)',
    salaryHint: 'الراتب الأساسي فقط — لا يشمل البدلات أو المكافآت',
    ramadan: 'وضع رمضان (6 ساعات يومياً)',
    empType: 'نوع الموظف',
    nonMgr: 'غير إداري / موظف عادي',
    mgr: 'مديري / إشرافي',
    period: 'فترة الحساب',
    day: 'يوم واحد', week: 'أسبوع', month: 'شهر',
    daytime: 'ساعات إضافية نهارية',
    night: 'ساعات إضافية ليلية (9م–6ص)',
    restday: 'ساعات يوم الراحة / العطلة الرسمية',
    calculate: 'احسب',
    reset: 'إعادة تعيين',
    example: 'مثال',
    results: 'نتائج العمل الإضافي',
    hourlyRate: 'الأجر بالساعة',
    totalOT: 'إجمالي مستحق الإضافي',
    basicPeriod: 'الراتب الأساسي للفترة',
    grandTotal: 'الإجمالي الكلي',
    hours: 'الساعات',
    multiplier: 'المضاعف',
    rateHr: 'الأجر/ساعة',
    amount: 'المبلغ',
    maxWarn: '⚠️ إجمالي ساعات العمل يتجاوز الحد الأقصى اليومي (10 ساعات) وفق نظام العمل القطري.',
    ramadanNote: '🕌 وضع رمضان: يوم العمل المعياري = 6 ساعات. يبدأ الإضافي مبكراً.',
    disclaimer: 'تقديرات استرشادية وفق نظام العمل القطري (قانون رقم 14 لسنة 2004). تعتمد المستحقات الفعلية على عقدك ودورك ومزود العمل. استشر وزارة العمل أو متخصصاً قانونياً.',
    noOT: 'لا يوجد عمل إضافي. أدخل الساعات الإضافية للحساب.',
    category: 'النوع',
    exemptWarn: '⚠️ المديرون والمشرفون قد يُعفَون من أحكام العمل الإضافي.',
    enterHours: 'أدخل الساعات',
    articleNote: 'وفق المادة 74 من نظام العمل القطري',
  } : {
    salary: 'Basic Monthly Salary (QAR)',
    salaryHint: 'Basic salary only — excludes allowances, bonuses',
    ramadan: 'Ramadan Mode (6 hrs/day standard)',
    empType: 'Employee Type',
    nonMgr: 'Non-managerial / Regular Employee',
    mgr: 'Managerial / Supervisory',
    period: 'Calculation Period',
    day: 'Single Day', week: 'Week', month: 'Month',
    daytime: 'Daytime Overtime Hours',
    night: 'Night Overtime Hours (9PM–6AM)',
    restday: 'Rest Day / Public Holiday Hours',
    calculate: 'Calculate',
    reset: 'Reset',
    example: 'Load Example',
    results: 'Overtime Results',
    hourlyRate: 'Hourly Rate',
    totalOT: 'Total Overtime Pay',
    basicPeriod: 'Basic Pay for Period',
    grandTotal: 'Grand Total',
    hours: 'Hours',
    multiplier: 'Rate',
    rateHr: 'Rate/hr',
    amount: 'Amount',
    maxWarn: '⚠️ Total hours exceed the legal 10-hour daily maximum under Qatar Labour Law.',
    ramadanNote: '🕌 Ramadan Mode: Standard day = 6 hours. Overtime starts earlier.',
    disclaimer: 'Estimates based on Qatar Labour Law minimums (Law No. 14/2004). Actual entitlements depend on your contract, role, and employer policy. Consult the Ministry of Labour or a legal professional. Not applicable to managers/supervisors in many cases.',
    noOT: 'No overtime hours entered. Add hours above to see your calculation.',
    category: 'Category',
    exemptWarn: '⚠️ Managers and supervisors may be exempt from overtime provisions.',
    enterHours: 'e.g. 2',
    articleNote: 'Per Article 74, Qatar Labour Law',
  }

  const periods: { value: Period; label: string }[] = [
    { value: 'day', label: lbl.day },
    { value: 'week', label: lbl.week },
    { value: 'month', label: lbl.month },
  ]

  // Hours vs max progress
  const totalH = (parseFloat(ot.daytime) || 0) + (parseFloat(ot.night) || 0) + (parseFloat(ot.restday) || 0)
  const usedH = standardHours + totalH
  const progressPct = Math.min((usedH / 10) * 100, 100)

  return (
    <div className="space-y-6">

      {/* Period selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{lbl.period}</label>
        <div className="grid grid-cols-3 gap-2">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => { setPeriod(p.value); setResult(null) }}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all ${
                period === p.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Salary */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">{lbl.salary}</label>
          <p className="text-xs text-gray-500 mb-1.5">{lbl.salaryHint}</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">QAR</span>
            <input
              type="number"
              min="0"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              placeholder="e.g. 3000"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Employee Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{lbl.empType}</label>
          <select
            value={employeeType}
            onChange={e => { setEmployeeType(e.target.value as EmployeeType); setResult(null); setError('') }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          >
            <option value="non-managerial">{lbl.nonMgr}</option>
            <option value="managerial">{lbl.mgr}</option>
          </select>
          {employeeType === 'managerial' && (
            <p className="text-xs text-amber-600 mt-1.5 font-medium">{lbl.exemptWarn}</p>
          )}
        </div>

        {/* Ramadan toggle */}
        <div className="flex items-center gap-3 self-end pb-1">
          <button
            onClick={() => { setRamadan(v => !v); setResult(null) }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              ramadan ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              ramadan ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <span className="text-sm font-semibold text-gray-700">{lbl.ramadan}</span>
        </div>

        {/* Daytime OT */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {lbl.daytime}
            <span className="ml-1.5 text-xs font-normal text-blue-600">×1.25</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={ot.daytime}
            onChange={e => setOt(v => ({ ...v, daytime: e.target.value }))}
            placeholder={lbl.enterHours}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Night OT */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {lbl.night}
            <span className="ml-1.5 text-xs font-normal text-purple-600">×1.50</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={ot.night}
            onChange={e => setOt(v => ({ ...v, night: e.target.value }))}
            placeholder={lbl.enterHours}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Rest day OT */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {lbl.restday}
            <span className="ml-1.5 text-xs font-normal text-red-500">×1.50</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={ot.restday}
            onChange={e => setOt(v => ({ ...v, restday: e.target.value }))}
            placeholder={lbl.enterHours}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Daily hours progress */}
      {(totalH > 0 || parseFloat(salary) > 0) && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{isAr ? `مجموع ساعات اليوم: ${usedH.toFixed(1)} / 10` : `Daily hours: ${usedH.toFixed(1)} / 10 max`}</span>
            <span className={usedH > 10 ? 'text-red-500 font-semibold' : 'text-gray-500'}>
              {usedH > 10 ? (isAr ? 'تجاوز الحد' : 'Exceeds limit') : `${(10 - usedH).toFixed(1)} ${isAr ? 'متبقية' : 'remaining'}`}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                usedH > 10 ? 'bg-red-500' : usedH > 8 ? 'bg-amber-400' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{lbl.articleNote}</p>
        </div>
      )}

      {/* Ramadan banner */}
      {ramadan && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-sm text-blue-700 font-medium">{lbl.ramadanNote}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-700 font-medium">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={calculate}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {lbl.calculate}
        </button>
        <button
          onClick={loadExample}
          className="px-4 py-3 border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl transition-colors text-sm"
        >
          {lbl.example}
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
        <div className="bg-gray-50 rounded-2xl p-6 space-y-5 border border-gray-100">
          <h3 className="font-bold text-gray-900">{lbl.results}</h3>

          {result.maxDailyWarning && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 font-medium">{lbl.maxWarn}</p>
            </div>
          )}

          {/* Hero: Total OT pay */}
          <div className="bg-blue-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">{lbl.totalOT}</div>
            <div className="text-3xl font-black">{fmt(result.totalOTPay)}</div>
          </div>

          {/* Breakdown table */}
          {result.breakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-gray-500 font-semibold pb-2">{lbl.category}</th>
                    <th className="text-right text-gray-500 font-semibold pb-2">{lbl.hours}</th>
                    <th className="text-right text-gray-500 font-semibold pb-2">{lbl.multiplier}</th>
                    <th className="text-right text-gray-500 font-semibold pb-2">{lbl.rateHr}</th>
                    <th className="text-right text-gray-500 font-semibold pb-2">{lbl.amount}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.breakdown.map((row, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-gray-800 font-medium">{row.category}</td>
                      <td className="py-2.5 text-right text-gray-700">{fmtH(row.hours)}</td>
                      <td className="py-2.5 text-right">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          row.multiplier === 1.25
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>×{row.multiplier}</span>
                      </td>
                      <td className="py-2.5 text-right text-gray-700">QAR {row.rate.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-semibold text-gray-900">QAR {row.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">{lbl.noOT}</p>
          )}

          {/* Summary rows */}
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <SRow label={isAr ? 'الأجر بالساعة الأساسية' : 'Base Hourly Rate'} value={`QAR ${result.hourlyRate.toFixed(2)}`} />
            <SRow label={lbl.basicPeriod} value={fmt(result.basicForPeriod)} />
            <SRow label={lbl.totalOT} value={fmt(result.totalOTPay)} />
            <SRow label={lbl.grandTotal} value={fmt(result.grandTotal)} highlight />
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

function SRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}
