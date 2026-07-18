'use client'

import { useState, useCallback } from 'react'

type Props = { locale: string }

// ─── Pure calculation function (exportable for tests) ─────────────────────────

export interface UAEGratuityInput {
  startDate: Date
  endDate: Date
  basicSalary: number
  unpaidAbsenceDays?: number
  partTime?: boolean
  partTimeRatio?: number   // e.g. 0.5 for 50% part-time
  owedDeductions?: number
}

export interface UAEGratuityResult {
  eligible: boolean
  ineligibleReason?: string
  totalDays: number
  yearsOfService: number
  yearsLabel: string
  dailyWage: number
  tier1Years: number
  tier1Amount: number
  tier2Years: number
  tier2Amount: number
  rawGratuity: number
  capped: boolean
  capAmount: number
  grossGratuity: number
  deductions: number
  netGratuity: number
  currency: 'AED'
}

export function calculateUAEGratuity(input: UAEGratuityInput): UAEGratuityResult {
  const {
    startDate,
    endDate,
    basicSalary,
    unpaidAbsenceDays = 0,
    partTime = false,
    partTimeRatio = 1,
    owedDeductions = 0,
  } = input

  const totalDays = Math.max(
    0,
    Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000) - unpaidAbsenceDays,
  )

  const yearsOfService = totalDays / 365.25
  const capAmount = basicSalary * 24

  if (yearsOfService < 1) {
    return {
      eligible: false,
      ineligibleReason: 'Minimum 1 year of continuous service required for gratuity entitlement.',
      totalDays,
      yearsOfService,
      yearsLabel: formatYearsLabel(yearsOfService),
      dailyWage: basicSalary / 30,
      tier1Years: 0,
      tier1Amount: 0,
      tier2Years: 0,
      tier2Amount: 0,
      rawGratuity: 0,
      capped: false,
      capAmount,
      grossGratuity: 0,
      deductions: 0,
      netGratuity: 0,
      currency: 'AED',
    }
  }

  const dailyWage = basicSalary / 30

  // Tier 1: first 5 years → 21 days' pay per year
  const tier1Years = Math.min(5, yearsOfService)
  const tier1Amount = dailyWage * 21 * tier1Years

  // Tier 2: beyond 5 years → 30 days' pay per year
  const tier2Years = Math.max(0, yearsOfService - 5)
  const tier2Amount = dailyWage * 30 * tier2Years

  let rawGratuity = tier1Amount + tier2Amount

  // Part-time pro-rating
  if (partTime && partTimeRatio > 0 && partTimeRatio < 1) {
    rawGratuity = rawGratuity * partTimeRatio
  }

  // 2-year cap
  const capped = rawGratuity > capAmount
  const grossGratuity = Math.min(rawGratuity, capAmount)
  const netGratuity = Math.max(0, grossGratuity - owedDeductions)

  return {
    eligible: true,
    totalDays,
    yearsOfService,
    yearsLabel: formatYearsLabel(yearsOfService),
    dailyWage,
    tier1Years,
    tier1Amount: partTime ? tier1Amount * (partTimeRatio || 1) : tier1Amount,
    tier2Years,
    tier2Amount: partTime ? tier2Amount * (partTimeRatio || 1) : tier2Amount,
    rawGratuity,
    capped,
    capAmount,
    grossGratuity,
    deductions: owedDeductions,
    netGratuity,
    currency: 'AED',
  }
}

function formatYearsLabel(years: number): string {
  const y = Math.floor(years)
  const months = Math.round((years - y) * 12)
  if (y === 0 && months === 0) return 'Less than 1 month'
  if (y === 0) return `${months} month${months !== 1 ? 's' : ''}`
  if (months === 0) return `${y} year${y !== 1 ? 's' : ''}`
  return `${y} year${y !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`
}

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Component ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]
const defaultStart = `${new Date().getFullYear() - 3}-01-01`

interface FormState {
  startDate: string
  endDate: string
  basicSalary: string
  unpaidAbsenceDays: string
  partTime: boolean
  partTimePercent: string
  owedDeductions: string
  nationality: 'expat' | 'national'
  showAdvanced: boolean
}

export default function UAEIndemnityCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [form, setForm] = useState<FormState>({
    startDate: defaultStart,
    endDate: today,
    basicSalary: '',
    unpaidAbsenceDays: '',
    partTime: false,
    partTimePercent: '50',
    owedDeductions: '',
    nationality: 'expat',
    showAdvanced: false,
  })

  const [result, setResult] = useState<UAEGratuityResult | null>(null)
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
    if (!salary || salary <= 0) errs.basicSalary = 'Enter a valid basic salary greater than 0'
    if (form.partTime) {
      const pct = parseFloat(form.partTimePercent)
      if (!pct || pct <= 0 || pct >= 100) errs.partTimePercent = 'Enter a percentage between 1 and 99'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [form])

  function calculate() {
    if (!validate()) return

    const res = calculateUAEGratuity({
      startDate: new Date(form.startDate),
      endDate: new Date(form.endDate),
      basicSalary: parseFloat(form.basicSalary),
      unpaidAbsenceDays: parseInt(form.unpaidAbsenceDays) || 0,
      partTime: form.partTime,
      partTimeRatio: form.partTime ? parseFloat(form.partTimePercent) / 100 : 1,
      owedDeductions: parseFloat(form.owedDeductions) || 0,
    })

    setResult(res)
  }

  function reset() {
    setForm({
      startDate: defaultStart,
      endDate: today,
      basicSalary: '',
      unpaidAbsenceDays: '',
      partTime: false,
      partTimePercent: '50',
      owedDeductions: '',
      nationality: 'expat',
      showAdvanced: false,
    })
    setResult(null)
    setErrors({})
  }

  // Progress toward 5-year milestone
  const serviceYears = result?.yearsOfService ?? 0
  const tier1Progress = Math.min(100, (serviceYears / 5) * 100)
  const tier2Progress = serviceYears > 5 ? Math.min(100, ((serviceYears - 5) / 5) * 100) : 0

  const isNational = form.nationality === 'national'

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* UAE Nationals notice */}
      {isNational && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <strong>Note for UAE Nationals:</strong> Emirati employees are generally covered under the
          General Pension and Social Security Authority (GPSSA) rather than the end-of-service
          gratuity scheme. This calculator reflects the federal gratuity law for expatriate employees.
          Please consult{' '}
          <a href="https://www.gpssa.gov.ae" target="_blank" rel="noopener noreferrer"
            className="underline font-semibold">GPSSA</a> for your entitlements.
        </div>
      )}

      {/* ── INPUTS ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Nationality */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Employee Type
          </label>
          <select value={form.nationality} onChange={set('nationality')} className={fieldCls(false)}>
            <option value="expat">Expatriate / Non-UAE National</option>
            <option value="national">UAE National</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            First Working Day
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
            Last Working Day
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
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Monthly Basic Salary
            <Tooltip text="Basic salary only — excludes housing, transport, bonuses, commissions and all other allowances." />
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">
              AED
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.basicSalary}
              onChange={set('basicSalary')}
              placeholder="e.g. 10,000"
              className={`${fieldCls(!!errors.basicSalary)} pl-14`}
            />
          </div>
          {errors.basicSalary && <FieldError msg={errors.basicSalary} />}
          <p className="text-xs text-gray-500 mt-1">
            ⚠ Use basic salary only. Allowances are excluded by law.
          </p>
        </div>
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setForm(p => ({ ...p, showAdvanced: !p.showAdvanced }))}
        className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5 transition-colors"
      >
        <span>{form.showAdvanced ? '▲' : '▼'}</span>
        {form.showAdvanced ? 'Hide' : 'Show'} Advanced Options
      </button>

      {form.showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
          {/* Unpaid Absence */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Unpaid Absence / Leave Days
              <Tooltip text="Days of unpaid absence are excluded from the service period under UAE Labour Law." />
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.unpaidAbsenceDays}
              onChange={set('unpaidAbsenceDays')}
              placeholder="0"
              className={fieldCls(false)}
            />
          </div>

          {/* Owed Deductions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Employer Deductions (AED)
              <Tooltip text="Any advances, loans, or amounts owed to the employer that may be offset from gratuity." />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">AED</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.owedDeductions}
                onChange={set('owedDeductions')}
                placeholder="0"
                className={`${fieldCls(false)} pl-14`}
              />
            </div>
          </div>

          {/* Part-time */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.partTime}
                onChange={setCheck('partTime')}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-semibold text-gray-700">
                Part-time / Flexible Contract
                <Tooltip text="Under Cabinet Resolution No. 1 of 2022, part-time gratuity is pro-rated by actual hours worked vs. full-time equivalent." />
              </span>
            </label>
            {form.partTime && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  % of Full-Time Hours
                </label>
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
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Calculate Indemnity
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
              <strong>Not Eligible:</strong> {result.ineligibleReason}
              <p className="mt-1 text-red-600">
                Service so far: {result.yearsLabel} ({result.totalDays.toLocaleString()} days).
              </p>
            </div>
          )}

          {/* Eligible results */}
          {result.eligible && (
            <>
              {/* Hero total */}
              <div className="bg-emerald-600 rounded-2xl p-6 text-white">
                <div className="text-sm opacity-80 mb-1">Estimated Total Indemnity (Gratuity)</div>
                <div className="text-4xl font-black tracking-tight">{fmt(result.netGratuity)}</div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-75">
                  <span>📅 {result.yearsLabel}</span>
                  <span>📊 Daily rate: AED {result.dailyWage.toFixed(2)}</span>
                  {result.capped && <span>🔒 2-year cap applied</span>}
                </div>
              </div>

              {/* 5-year tier progress */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="font-semibold text-gray-700">Tier 1: First 5 Years (21 days/year)</span>
                    <span className="text-gray-500">{Math.min(5, serviceYears).toFixed(1)} / 5 yrs</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${tier1Progress}%` }} />
                  </div>
                </div>
                {serviceYears >= 5 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="font-semibold text-gray-700">Tier 2: Beyond 5 Years (30 days/year)</span>
                      <span className="text-gray-500">{Math.max(0, serviceYears - 5).toFixed(1)} yrs</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all duration-700"
                        style={{ width: `${tier2Progress}%` }} />
                    </div>
                  </div>
                )}
                {serviceYears < 5 && (
                  <p className="text-xs text-gray-500">
                    {Math.ceil((5 - serviceYears) * 12)} months until the higher 30-day rate applies.
                  </p>
                )}
              </div>

              {/* Breakdown table */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm">Calculation Breakdown</h4>
                </div>
                <div className="divide-y divide-gray-100">
                  <BreakdownRow
                    label={`First ${result.tier1Years.toFixed(2)} years × 21 days`}
                    value={fmt(result.tier1Amount)}
                  />
                  {result.tier2Years > 0 && (
                    <BreakdownRow
                      label={`Beyond 5 years (${result.tier2Years.toFixed(2)} yrs) × 30 days`}
                      value={fmt(result.tier2Amount)}
                    />
                  )}
                  {form.partTime && (
                    <BreakdownRow
                      label={`Part-time adjustment (${form.partTimePercent}%)`}
                      value="Applied"
                      muted
                    />
                  )}
                  <BreakdownRow
                    label="Raw Gratuity Total"
                    value={fmt(result.rawGratuity)}
                  />
                  {result.capped && (
                    <BreakdownRow
                      label={`2-Year Salary Cap (AED ${(parseFloat(form.basicSalary) * 24).toLocaleString()})`}
                      value="Applied ⚠"
                      negative
                    />
                  )}
                  {result.deductions > 0 && (
                    <BreakdownRow
                      label="Employer Deductions"
                      value={`− ${fmt(result.deductions)}`}
                      negative
                    />
                  )}
                  <div className="px-5 py-4 bg-gray-100/80 flex items-center justify-between">
                    <span className="font-bold text-gray-900">Net Estimated Indemnity</span>
                    <span className="font-black text-emerald-700 text-lg">{fmt(result.netGratuity)}</span>
                  </div>
                </div>
              </div>

              {/* Cap warning */}
              {result.capped && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                  <strong>2-Year Cap Applied:</strong> UAE Labour Law caps total gratuity at 2 years'
                  basic salary (AED {(parseFloat(form.basicSalary) * 24).toLocaleString('en-US', { minimumFractionDigits: 0 })}). Your
                  calculated raw amount of {fmt(result.rawGratuity)} has been reduced accordingly.
                </div>
              )}

              {/* Payment timing */}
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                <strong>Payment Timing:</strong> Your employer must settle all end-of-service dues,
                including indemnity, within <strong>14 days</strong> of your last working day under
                Federal Decree-Law No. 33 of 2021. Delays can be reported to{' '}
                <a href="https://www.mohre.gov.ae" target="_blank" rel="noopener noreferrer"
                  className="underline font-semibold">MoHRE</a>.
              </div>

              {/* Savings scheme note */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                <strong className="text-gray-800">DIFC / ADGM / Voluntary Savings Scheme:</strong> If
                your employer participates in a recognised savings scheme (such as DIFC's DEWS or an
                ADGM-approved scheme), your gratuity may be replaced by those contributions and
                investment returns. Check your contract or HR department.
              </div>
            </>
          )}

          {/* Disclaimer */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
            <p>
              <strong className="text-gray-700">⚠ Estimate only.</strong> This calculator is based on
              Federal Decree-Law No. 33 of 2021 and Cabinet Resolution No. 1 of 2022. Results are
              indicative and may differ from official MoHRE determinations.
            </p>
            <p>
              Free zone employers (DIFC, ADGM, JAFZA, etc.) may apply different rules. Consult{' '}
              <a href="https://www.mohre.gov.ae" target="_blank" rel="noopener noreferrer" className="underline">MoHRE</a>{' '}
              or{' '}
              <a href="https://www.u.ae/en/information-and-services/jobs/leaving-a-job/end-of-service-benefits" target="_blank" rel="noopener noreferrer" className="underline">u.ae</a>{' '}
              for official guidance. This is not legal or financial advice.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BreakdownRow({
  label, value, negative = false, muted = false,
}: {
  label: string
  value: string
  negative?: boolean
  muted?: boolean
}) {
  return (
    <div className="px-5 py-3 flex items-center justify-between gap-4">
      <span className={`text-sm ${muted ? 'text-gray-500 italic' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm font-semibold ${negative ? 'text-amber-600' : 'text-gray-900'}`}>
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
      <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center font-bold leading-none">
        i
      </span>
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
