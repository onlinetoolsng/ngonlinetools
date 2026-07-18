'use client'

import { useState, useCallback } from 'react'

type Props = { locale: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const CUTOFF_DATE = new Date('2024-03-01') // New SIO regime starts

const NATIONALITY_OPTIONS = [
  { value: 'expat',    label: 'Non-Bahraini (Private Sector)' },
  { value: 'bahraini', label: 'Bahraini National'             },
  { value: 'domestic', label: 'Domestic Worker'               },
]

const TERMINATION_OPTIONS = [
  { value: 'termination', label: 'Termination by Employer' },
  { value: 'resignation', label: 'Resignation'             },
  { value: 'contract_end', label: 'Contract End'           },
  { value: 'other',       label: 'Other'                   },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Inputs {
  startDate: string
  endDate: string
  basicSalary: string
  socialAllowance: string
  nationality: string
  terminationReason: string
}

interface PeriodResult {
  label: string
  months: number
  years: number
  rate: string
  amount: number
  payer: 'employer' | 'sio'
}

interface GratuityResult {
  totalMonths: number
  totalYears: number
  employerAmount: number   // pre-2024 lump sum
  sioAmount: number        // post-2024 SIO-managed
  totalAmount: number
  periods: PeriodResult[]
  baseSalary: number
  currency: 'BHD'
}

// ─── Core calculation (pure function, exportable for tests) ───────────────────

export function calculateBahrainGratuity(
  startDate: Date,
  endDate: Date,
  basicSalary: number,
  socialAllowance: number,
): GratuityResult {
  const base = basicSalary + socialAllowance
  const periods: PeriodResult[] = []

  let employerAmount = 0
  let sioAmount = 0

  // Helper: months between two dates (inclusive start, exclusive end), using
  // 30-day-month convention common in Gulf labour calculations.
  function monthsBetween(from: Date, to: Date): number {
    const years  = to.getFullYear()  - from.getFullYear()
    const months = to.getMonth()     - from.getMonth()
    const days   = to.getDate()      - from.getDate()
    return Math.max(0, years * 12 + months + days / 30)
  }

  // Determine if service spans the cutoff
  const preEnd  = endDate < CUTOFF_DATE ? endDate   : CUTOFF_DATE
  const postStart = CUTOFF_DATE

  // ── PRE-2024 PERIOD ────────────────────────────────────────────────────────
  if (startDate < CUTOFF_DATE) {
    const preMonths = monthsBetween(startDate, preEnd)

    if (preMonths > 0) {
      // First 36 months → ½ month per year (½ × base / 12 per month)
      const tier1Months = Math.min(preMonths, 36)
      const tier2Months = Math.max(0, preMonths - 36)

      const tier1Amount = (base / 2 / 12) * tier1Months
      const tier2Amount = (base      / 12) * tier2Months
      const preAmount   = tier1Amount + tier2Amount

      employerAmount += preAmount

      if (tier1Months > 0) {
        periods.push({
          label: `Pre-Mar 2024 — First ${formatMonths(tier1Months)}`,
          months: tier1Months,
          years:  tier1Months / 12,
          rate:   '½ month per year',
          amount: tier1Amount,
          payer:  'employer',
        })
      }
      if (tier2Months > 0) {
        periods.push({
          label: `Pre-Mar 2024 — Beyond 3 Years (${formatMonths(tier2Months)})`,
          months: tier2Months,
          years:  tier2Months / 12,
          rate:   '1 full month per year',
          amount: tier2Amount,
          payer:  'employer',
        })
      }
    }
  }

  // ── POST-2024 PERIOD ───────────────────────────────────────────────────────
  if (endDate > CUTOFF_DATE) {
    const effectivePostStart = startDate > CUTOFF_DATE ? startDate : postStart
    const postMonths = monthsBetween(effectivePostStart, endDate)

    if (postMonths > 0) {
      // Total service at the point of post-2024 start (to determine tier)
      const totalAtCutoff = startDate < CUTOFF_DATE
        ? monthsBetween(startDate, CUTOFF_DATE)
        : 0

      // Months already served before the post-2024 period starts
      let runningMonths = totalAtCutoff

      // For simplicity (and accuracy for most cases), calculate the post-2024
      // equivalent lump sum using the same tier logic.
      const remainingTier1 = Math.max(0, 36 - runningMonths)
      const postTier1Months = Math.min(postMonths, remainingTier1)
      const postTier2Months = Math.max(0, postMonths - postTier1Months)

      const postTier1Amount = (base / 2 / 12) * postTier1Months
      const postTier2Amount = (base      / 12) * postTier2Months
      const postAmount = postTier1Amount + postTier2Amount

      sioAmount += postAmount

      if (postTier1Months > 0) {
        periods.push({
          label: `Post-Mar 2024 — First Years (${formatMonths(postTier1Months)})`,
          months: postTier1Months,
          years:  postTier1Months / 12,
          rate:   '½ month per year (SIO 4.2%)',
          amount: postTier1Amount,
          payer:  'sio',
        })
      }
      if (postTier2Months > 0) {
        periods.push({
          label: `Post-Mar 2024 — Beyond 3 Years (${formatMonths(postTier2Months)})`,
          months: postTier2Months,
          years:  postTier2Months / 12,
          rate:   '1 full month per year (SIO 8.4%)',
          amount: postTier2Amount,
          payer:  'sio',
        })
      }
    }
  }

  const totalMonths = monthsBetween(startDate, endDate)

  return {
    totalMonths,
    totalYears: totalMonths / 12,
    employerAmount,
    sioAmount,
    totalAmount: employerAmount + sioAmount,
    periods,
    baseSalary: base,
    currency: 'BHD',
  }
}

function formatMonths(m: number): string {
  const y = Math.floor(m / 12)
  const mo = Math.round(m % 12)
  if (y === 0) return `${mo}m`
  if (mo === 0) return `${y}y`
  return `${y}y ${mo}m`
}

function fmt(n: number) {
  return `BHD ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Component ────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0]
const defaultStart = `${new Date().getFullYear() - 3}-01-01`

export default function BahrainGratuityCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [inputs, setInputs] = useState<Inputs>({
    startDate: defaultStart,
    endDate: today,
    basicSalary: '',
    socialAllowance: '',
    nationality: 'expat',
    terminationReason: 'termination',
  })
  const [result, setResult] = useState<GratuityResult | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof Inputs, string>>>({})

  const set = (key: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setInputs(prev => ({ ...prev, [key]: e.target.value }))

  const validate = useCallback((): boolean => {
    const errs: typeof errors = {}
    const start = new Date(inputs.startDate)
    const end   = new Date(inputs.endDate)
    const basic = parseFloat(inputs.basicSalary)

    if (!inputs.startDate) errs.startDate = 'Start date is required'
    if (!inputs.endDate)   errs.endDate   = 'End date is required'
    if (end <= start)      errs.endDate   = 'End date must be after start date'
    if (!basic || basic <= 0) errs.basicSalary = 'Enter a valid salary greater than 0'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [inputs])

  function calculate() {
    if (!validate()) return
    if (inputs.nationality !== 'expat' && inputs.nationality !== 'domestic') {
      setResult(null)
      return
    }

    const start  = new Date(inputs.startDate)
    const end    = new Date(inputs.endDate)
    const basic  = parseFloat(inputs.basicSalary)
    const social = parseFloat(inputs.socialAllowance) || 0

    setResult(calculateBahrainGratuity(start, end, basic, social))
  }

  function reset() {
    setInputs({
      startDate: defaultStart,
      endDate: today,
      basicSalary: '',
      socialAllowance: '',
      nationality: 'expat',
      terminationReason: 'termination',
    })
    setResult(null)
    setErrors({})
  }

  // Progress toward 3-year tier milestone
  const progress = result
    ? Math.min(100, (result.totalMonths / 36) * 100)
    : 0

  const isBahraini = inputs.nationality === 'bahraini'

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Nationality notice for Bahrainis */}
      {isBahraini && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <strong>Note:</strong> Bahraini nationals are covered under the Social Insurance Organisation
          (SIO) pension scheme, not the end-of-service gratuity system. This calculator is designed
          for non-Bahraini private-sector employees. Please consult the{' '}
          <a href="https://www.sio.gov.bh" target="_blank" rel="noopener noreferrer"
            className="underline font-semibold">SIO portal</a> for your entitlements.
        </div>
      )}

      {/* ── INPUTS ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Start Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Employment Start Date
          </label>
          <input
            type="date"
            value={inputs.startDate}
            max={today}
            onChange={set('startDate')}
            className={fieldClass(!!errors.startDate)}
          />
          {errors.startDate && <FieldError msg={errors.startDate} />}
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Employment End Date
          </label>
          <input
            type="date"
            value={inputs.endDate}
            max={today}
            onChange={set('endDate')}
            className={fieldClass(!!errors.endDate)}
          />
          {errors.endDate && <FieldError msg={errors.endDate} />}
        </div>

        {/* Basic Salary */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Monthly Basic Salary
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">
              BHD
            </span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={inputs.basicSalary}
              onChange={set('basicSalary')}
              placeholder="e.g. 500"
              className={`${fieldClass(!!errors.basicSalary)} pl-14`}
            />
          </div>
          {errors.basicSalary && <FieldError msg={errors.basicSalary} />}
        </div>

        {/* Social Allowance */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Social Allowance <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 select-none">
              BHD
            </span>
            <input
              type="number"
              min="0"
              step="0.001"
              value={inputs.socialAllowance}
              onChange={set('socialAllowance')}
              placeholder="0"
              className={`${fieldClass(false)} pl-14`}
            />
          </div>
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Employee Nationality
          </label>
          <select value={inputs.nationality} onChange={set('nationality')} className={fieldClass(false)}>
            {NATIONALITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Termination Reason */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Reason for Leaving <span className="font-normal text-gray-500">(for context)</span>
          </label>
          <select value={inputs.terminationReason} onChange={set('terminationReason')} className={fieldClass(false)}>
            {TERMINATION_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          disabled={isBahraini}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Calculate Gratuity
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          Reset
        </button>
      </div>

      {/* ── RESULTS ────────────────────────────────────────────────────────── */}
      {result && !isBahraini && (
        <div className="space-y-4">

          {/* Total hero card */}
          <div className="bg-emerald-600 rounded-2xl p-6 text-white">
            <div className="text-sm opacity-80 mb-1">Estimated Total Gratuity</div>
            <div className="text-4xl font-black tracking-tight">{fmt(result.totalAmount)}</div>
            <div className="mt-3 text-sm opacity-75">
              {Math.floor(result.totalYears)} years {Math.round(result.totalMonths % 12)} months of service
              &nbsp;·&nbsp; Base used: {fmt(result.baseSalary)}/month
            </div>
          </div>

          {/* 3-year tier progress */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-semibold text-gray-700">Progress toward 3-year rate milestone</span>
              <span className="text-gray-500">{Math.min(36, Math.round(result.totalMonths))} / 36 months</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {result.totalMonths >= 36
                ? '✓ Full-month rate (1 month/year) applies for service beyond 3 years.'
                : `${Math.max(0, Math.ceil(36 - result.totalMonths))} months until full-month rate kicks in.`}
            </p>
          </div>

          {/* Split: Employer vs SIO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PayerCard
              title="Employer Pays (Pre-Mar 2024)"
              subtitle="Lump sum directly to you"
              amount={result.employerAmount}
              color="blue"
            />
            <PayerCard
              title="SIO Pays (Post-Mar 2024)"
              subtitle="Claim via SIO portal with e-key"
              amount={result.sioAmount}
              color="emerald"
            />
          </div>

          {/* Detailed breakdown table */}
          {result.periods.length > 0 && (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm">Detailed Breakdown</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="text-left px-5 py-3 font-semibold">Period</th>
                      <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Rate</th>
                      <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Paid by</th>
                      <th className="text-right px-5 py-3 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.periods.map((p, i) => (
                      <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-100/60 transition-colors">
                        <td className="px-5 py-3 text-gray-800">{p.label}</td>
                        <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{p.rate}</td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.payer === 'employer'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {p.payer === 'employer' ? 'Employer' : 'SIO'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">
                          {fmt(p.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100/80">
                      <td colSpan={3} className="px-5 py-3 font-bold text-gray-800">Total</td>
                      <td className="px-5 py-3 text-right font-black text-emerald-700">
                        {fmt(result.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Termination reason note */}
          {inputs.terminationReason === 'resignation' && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
              <strong>Resignation:</strong> Under Bahrain Labour Law, voluntary resignation may affect
              your entitlement for service under 3 years. Consult{' '}
              <a href="https://www.lmra.gov.bh" target="_blank" rel="noopener noreferrer"
                className="underline font-semibold">LMRA</a> or your employer for exact entitlement.
            </div>
          )}

          {/* Disclaimer */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-xs text-gray-500 space-y-1">
            <p><strong className="text-gray-700">⚠ Estimate only.</strong> This calculator provides an approximation based on the Bahrain Labour Law (Article 116) and SIO Resolution 109/2023 effective 1 March 2024.</p>
            <p>Actual SIO calculations may differ. For post-March 2024 service, claim your benefit via the <a href="https://www.sio.gov.bh" target="_blank" rel="noopener noreferrer" className="underline">SIO portal</a> using your e-key within 10 working days of leaving.</p>
            <p>This is not legal or financial advice. Consult <a href="https://www.lmra.gov.bh" target="_blank" rel="noopener noreferrer" className="underline">LMRA</a>, your employer, or a licensed legal adviser for official guidance.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PayerCard({
  title, subtitle, amount, color,
}: {
  title: string
  subtitle: string
  amount: number
  color: 'blue' | 'emerald'
}) {
  const cls = color === 'emerald'
    ? 'bg-emerald-50 border-emerald-200'
    : 'bg-blue-50 border-blue-200'
  const valCls = color === 'emerald' ? 'text-emerald-700' : 'text-blue-700'
  const labelCls = color === 'emerald' ? 'text-emerald-800' : 'text-blue-800'

  return (
    <div className={`rounded-xl border p-5 ${cls}`}>
      <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${labelCls}`}>{title}</div>
      <div className={`text-2xl font-black ${valCls}`}>
        {amount > 0 ? `BHD ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
      </div>
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    </div>
  )
}

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-red-500 mt-1">{msg}</p>
}

function fieldClass(hasError: boolean) {
  return `w-full px-4 py-3 border rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${
    hasError ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-200'
  }`
}
