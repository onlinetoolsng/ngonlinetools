'use client'

import { useState, useCallback } from 'react'

type Props = { locale: string }

// ─── Pure calculation (exportable for tests) ──────────────────────────────────

export interface LeaveInput {
  startDate: Date
  endDate: Date
  basicSalary: number
  housingAllowance?: number
  otherAllowances?: number
  leavesTaken?: number
  scenario: 'taking' | 'encashment'
  partTime?: boolean
  partTimeRatio?: number
}

export interface LeaveResult {
  eligible: boolean
  ineligibleReason?: string
  totalMonths: number
  totalDays: number
  accrualNote: string
  grossAccruedDays: number
  leavesTaken: number
  unusedDays: number
  // Payment
  scenario: 'taking' | 'encashment'
  dailyBasic: number
  dailyFull: number
  dailyRateUsed: number
  totalPayable: number
  basicSalary: number
  fixedAllowances: number
  currency: 'AED'
}

export function calculateUAELeave(input: LeaveInput): LeaveResult {
  const {
    startDate,
    endDate,
    basicSalary,
    housingAllowance = 0,
    otherAllowances = 0,
    leavesTaken = 0,
    scenario,
    partTime = false,
    partTimeRatio = 1,
  } = input

  const msPerDay = 86_400_000
  const totalCalendarDays = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay))
  const totalMonths = totalCalendarDays / 30.4375 // average month

  const fixedAllowances = housingAllowance + otherAllowances
  const dailyBasic = basicSalary / 30
  const dailyFull = (basicSalary + fixedAllowances) / 30

  // Ineligible: < 6 months
  if (totalMonths < 6) {
    return {
      eligible: false,
      ineligibleReason: 'Employees must complete at least 6 months of continuous service to accrue annual leave.',
      totalMonths,
      totalDays: totalCalendarDays,
      accrualNote: '',
      grossAccruedDays: 0,
      leavesTaken: 0,
      unusedDays: 0,
      scenario,
      dailyBasic,
      dailyFull,
      dailyRateUsed: 0,
      totalPayable: 0,
      basicSalary,
      fixedAllowances,
      currency: 'AED',
    }
  }

  let grossAccruedDays: number
  let accrualNote: string

  if (totalMonths < 12) {
    // 6–11 months: 2 days per month
    grossAccruedDays = totalMonths * 2
    accrualNote = `${totalMonths.toFixed(1)} months × 2 days/month (partial first year)`
  } else {
    // 1+ full years: 30 days per completed year + 2.5 days per extra month
    const fullYears = Math.floor(totalMonths / 12)
    const extraMonths = totalMonths % 12
    grossAccruedDays = fullYears * 30 + extraMonths * 2.5
    accrualNote = `${fullYears} year${fullYears !== 1 ? 's' : ''} × 30 days + ${extraMonths.toFixed(1)} months × 2.5 days`
  }

  // Part-time pro-rating
  if (partTime && partTimeRatio > 0 && partTimeRatio < 1) {
    grossAccruedDays = grossAccruedDays * partTimeRatio
  }

  grossAccruedDays = Math.max(0, grossAccruedDays)
  const unusedDays = Math.max(0, grossAccruedDays - leavesTaken)

  // Payment rate depends on scenario
  // Taking leave (still employed) → full wage
  // Encashment on exit → basic salary only
  const dailyRateUsed = scenario === 'taking' ? dailyFull : dailyBasic
  const totalPayable = dailyRateUsed * unusedDays

  return {
    eligible: true,
    totalMonths,
    totalDays: totalCalendarDays,
    accrualNote,
    grossAccruedDays,
    leavesTaken,
    unusedDays,
    scenario,
    dailyBasic,
    dailyFull,
    dailyRateUsed,
    totalPayable,
    basicSalary,
    fixedAllowances,
    currency: 'AED',
  }
}

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDays(n: number) {
  return `${n.toFixed(1)} day${n !== 1 ? 's' : ''}`
}

// ─── Component ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]
const defaultStart = `${new Date().getFullYear() - 2}-01-01`

interface FormState {
  startDate: string
  endDate: string
  basicSalary: string
  housingAllowance: string
  otherAllowances: string
  leavesTaken: string
  scenario: 'taking' | 'encashment'
  partTime: boolean
  partTimePercent: string
  showAdvanced: boolean
}

export default function UAELeaveCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [form, setForm] = useState<FormState>({
    startDate: defaultStart,
    endDate: today,
    basicSalary: '',
    housingAllowance: '',
    otherAllowances: '',
    leavesTaken: '',
    scenario: 'encashment',
    partTime: false,
    partTimePercent: '50',
    showAdvanced: false,
  })

  const [result, setResult] = useState<LeaveResult | null>(null)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }))

  const setCheck = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.checked }))

  const validate = useCallback((): boolean => {
    const errs: typeof errors = {}
    const start = new Date(form.startDate)
    const end = new Date(form.endDate)
    const salary = parseFloat(form.basicSalary)

    if (!form.startDate) errs.startDate = 'Start date is required'
    if (!form.endDate)   errs.endDate   = 'End date is required'
    if (end <= start)    errs.endDate   = 'End date must be after start date'
    if (!salary || salary <= 0) errs.basicSalary = 'Enter a valid basic salary'
    if (form.partTime) {
      const pct = parseFloat(form.partTimePercent)
      if (!pct || pct <= 0 || pct >= 100) errs.partTimePercent = 'Enter a % between 1 and 99'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [form])

  function calculate() {
    if (!validate()) return
    setResult(calculateUAELeave({
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      basicSalary: parseFloat(form.basicSalary),
      housingAllowance: parseFloat(form.housingAllowance) || 0,
      otherAllowances: parseFloat(form.otherAllowances) || 0,
      leavesTaken: parseFloat(form.leavesTaken) || 0,
      scenario: form.scenario,
      partTime: form.partTime,
      partTimeRatio: form.partTime ? parseFloat(form.partTimePercent) / 100 : 1,
    }))
  }

  function reset() {
    setForm({
      startDate: defaultStart,
      endDate: today,
      basicSalary: '',
      housingAllowance: '',
      otherAllowances: '',
      leavesTaken: '',
      scenario: 'encashment',
      partTime: false,
      partTimePercent: '50',
      showAdvanced: false,
    })
    setResult(null)
    setErrors({})
  }

  // Accrual progress bar — percent toward 30 days
  const accrualProgress = result?.eligible
    ? Math.min(100, (result.grossAccruedDays / 30) * 100)
    : 0

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Scenario tabs */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">What are you calculating?</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              value: 'encashment',
              label: 'Leave Encashment',
              sub: 'Payout on exit / termination',
            },
            {
              value: 'taking',
              label: 'Annual Leave Pay',
              sub: 'Pay while taking approved leave',
            },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(p => ({ ...p, scenario: opt.value as 'taking' | 'encashment' }))}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                form.scenario === opt.value
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`text-sm font-bold ${form.scenario === opt.value ? 'text-emerald-700' : 'text-gray-800'}`}>
                {opt.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.sub}</div>
            </button>
          ))}
        </div>

        {/* Scenario rate note */}
        <div className={`mt-2 rounded-lg px-3 py-2 text-xs ${
          form.scenario === 'taking'
            ? 'bg-blue-50 text-blue-700 border border-blue-100'
            : 'bg-amber-50 text-amber-700 border border-amber-100'
        }`}>
          {form.scenario === 'taking'
            ? '📋 Approved leave pay uses full wage (basic + all fixed allowances) under Article 29 of Federal Decree-Law No. 33/2021.'
            : '📋 Leave encashment on exit uses basic salary only under Article 29(9) of Federal Decree-Law No. 33/2021.'}
        </div>
      </div>

      {/* ── INPUTS ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Employment Start Date
          </label>
          <input
            type="date"
            value={form.startDate}
            max={today}
            onChange={set('startDate')}
            className={fieldCls(!!errors.startDate)}
          />
          {errors.startDate && <FieldError msg={errors.startDate} />}
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {form.scenario === 'encashment' ? 'Last Working Day' : 'Leave Reference Date'}
          </label>
          <input
            type="date"
            value={form.endDate}
            max={today}
            onChange={set('endDate')}
            className={fieldCls(!!errors.endDate)}
          />
          {errors.endDate && <FieldError msg={errors.endDate} />}
        </div>

        {/* Basic Salary */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Monthly Basic Salary
            <Tooltip text="Basic salary only — excludes all allowances, bonuses, and commissions. This is used for encashment payouts." />
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">AED</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.basicSalary}
              onChange={set('basicSalary')}
              placeholder="e.g. 8,000"
              className={`${fieldCls(!!errors.basicSalary)} pl-14`}
            />
          </div>
          {errors.basicSalary && <FieldError msg={errors.basicSalary} />}
        </div>

        {/* Housing Allowance */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Housing Allowance
            <Tooltip text="Included in full wage for approved leave pay. Not used for encashment." />
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">AED</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.housingAllowance}
              onChange={set('housingAllowance')}
              placeholder="0"
              className={`${fieldCls(false)} pl-14`}
            />
          </div>
        </div>

        {/* Other Allowances */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Other Fixed Allowances
            <Tooltip text="Transport, phone, food, and other regular fixed allowances. Included in full wage for approved leave only." />
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">AED</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.otherAllowances}
              onChange={set('otherAllowances')}
              placeholder="0"
              className={`${fieldCls(false)} pl-14`}
            />
          </div>
        </div>

        {/* Leaves Taken */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Leave Days Already Taken
            <Tooltip text="Calendar days of annual leave already taken in the current accrual period." />
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={form.leavesTaken}
            onChange={set('leavesTaken')}
            placeholder="0"
            className={fieldCls(false)}
          />
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setForm(p => ({ ...p, showAdvanced: !p.showAdvanced }))}
        className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5 transition-colors"
      >
        <span>{form.showAdvanced ? '▲' : '▼'}</span>
        {form.showAdvanced ? 'Hide' : 'Show'} Part-time Options
      </button>

      {form.showAdvanced && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.partTime}
              onChange={setCheck('partTime')}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-semibold text-gray-700">
              Part-time / Flexible Contract
              <Tooltip text="Part-time leave entitlement is pro-rated by contracted hours vs. full-time equivalent, per Federal Decree-Law No. 33/2021." />
            </span>
          </label>
          {form.partTime && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">% of Full-Time Hours</label>
              <input
                type="number"
                min="1"
                max="99"
                value={form.partTimePercent}
                onChange={set('partTimePercent')}
                placeholder="50"
                className={fieldCls(!!errors.partTimePercent)}
              />
              {errors.partTimePercent && <FieldError msg={errors.partTimePercent} />}
            </div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Calculate Leave Salary
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          Reset
        </button>
      </div>

      {/* ── RESULTS ────────────────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-4">

          {/* Ineligible */}
          {!result.eligible && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-5 text-sm text-red-800">
              <strong>No Entitlement:</strong> {result.ineligibleReason}
              <p className="mt-1 text-red-600 text-xs">
                Service so far: {result.totalMonths.toFixed(1)} months ({result.totalDays.toLocaleString()} calendar days).
              </p>
            </div>
          )}

          {result.eligible && (
            <>
              {/* Hero card */}
              <div className="bg-emerald-600 rounded-2xl p-6 text-white">
                <div className="text-sm opacity-80 mb-1">
                  {result.scenario === 'taking'
                    ? 'Leave Pay (Full Wage Basis)'
                    : 'Leave Encashment (Basic Salary Basis)'}
                </div>
                <div className="text-4xl font-black tracking-tight">{fmt(result.totalPayable)}</div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-75">
                  <span>📅 {result.totalMonths.toFixed(1)} months service</span>
                  <span>🏖 {fmtDays(result.unusedDays)} unused</span>
                  <span>📊 {fmt(result.dailyRateUsed)}/day</span>
                </div>
              </div>

              {/* Accrual progress */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-semibold text-gray-700">Leave Accrual Progress (toward 30 days/year)</span>
                  <span className="text-gray-500">{fmtDays(result.grossAccruedDays)}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${accrualProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{result.accrualNote}</p>
              </div>

              {/* Breakdown table */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm">Calculation Breakdown</h4>
                </div>
                <div className="divide-y divide-gray-100">
                  <BRow label="Total Accrued Leave Days" value={fmtDays(result.grossAccruedDays)} />
                  <BRow label="Days Already Taken" value={`− ${fmtDays(result.leavesTaken)}`} negative={result.leavesTaken > 0} />
                  <BRow label="Unused / Payable Days" value={fmtDays(result.unusedDays)} highlight />

                  <div className="px-5 py-3 bg-gray-100/50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Calculation</p>
                  </div>

                  <BRow label="Basic Salary / 30" value={`${fmt(result.dailyBasic)}/day`} />
                  {result.scenario === 'taking' && result.fixedAllowances > 0 && (
                    <BRow
                      label={`Fixed Allowances / 30 (AED ${result.fixedAllowances.toLocaleString()})`}
                      value={`${fmt(result.fixedAllowances / 30)}/day`}
                    />
                  )}
                  <BRow
                    label={`Daily Rate Used (${result.scenario === 'taking' ? 'Full Wage' : 'Basic Only'})`}
                    value={`${fmt(result.dailyRateUsed)}/day`}
                  />
                  <BRow
                    label={`${fmtDays(result.unusedDays)} × ${fmt(result.dailyRateUsed)}`}
                    value={fmt(result.totalPayable)}
                  />

                  <div className="px-5 py-4 bg-gray-100/80 flex items-center justify-between">
                    <span className="font-bold text-gray-900">Total Leave Salary</span>
                    <span className="font-black text-emerald-700 text-lg">{fmt(result.totalPayable)}</span>
                  </div>
                </div>
              </div>

              {/* Scenario-specific notes */}
              {result.scenario === 'taking' && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
                  <strong>Approved Leave:</strong> Your employer must pay your full leave salary <em>before</em> your
                  leave starts (Article 29 of Federal Decree-Law No. 33/2021). Full wage includes basic salary
                  plus all fixed monthly allowances.
                </div>
              )}

              {result.scenario === 'encashment' && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
                  <strong>Leave Encashment on Exit:</strong> On termination or resignation, unused leave is paid
                  out at <strong>basic salary only</strong> (Article 29(9)). Housing and other allowances are
                  excluded from this final settlement calculation.
                </div>
              )}

              {/* Carry-forward note */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                <strong className="text-gray-800">Carry-Forward:</strong> Employees may carry forward up to half
                their annual entitlement (typically 15 days) to the following year, subject to employer policy.
                Employers cannot prevent employees from taking accrued leave for more than two consecutive years.
              </div>
            </>
          )}

          {/* Disclaimer */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
            <p>
              <strong className="text-gray-700">⚠ Estimate only.</strong> Based on Federal Decree-Law No. 33
              of 2021 (Article 29) and Cabinet Resolution No. 1 of 2022. Results are for guidance and may
              differ from your contract terms, MoHRE rulings, or free zone regulations.
            </p>
            <p>
              Consult{' '}
              <a href="https://www.mohre.gov.ae" target="_blank" rel="noopener noreferrer" className="underline">MoHRE</a>
              {' '}or{' '}
              <a href="https://u.ae/en/information-and-services/jobs/leaving-a-job/end-of-service-benefits" target="_blank" rel="noopener noreferrer" className="underline">u.ae</a>
              {' '}for official guidance. Not legal advice.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BRow({
  label, value, negative = false, highlight = false,
}: {
  label: string; value: string; negative?: boolean; highlight?: boolean
}) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-emerald-700' : negative ? 'text-red-500' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-red-500 mt-1">{msg}</p>
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex ml-1.5 cursor-help">
      <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center font-bold leading-none">i</span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-lg leading-relaxed">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  )
}

function fieldCls(hasError: boolean) {
  return `w-full px-4 py-3 border rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${
    hasError ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-200'
  }`
}
