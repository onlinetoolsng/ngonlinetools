'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = { locale?: string }

// ─── Constants (UAE Federal Decree-Law No. 33 of 2021) ────────────────────────

const ANNUAL_DAYS_FULL = 30          // ≥1 year service — Art. 29
const ANNUAL_DAYS_SHORT = 2          // per month, <1 year — Art. 29
const DAYS_IN_MONTH = 30             // UAE standard divisor

// Maternity — Art. 30
const MATERNITY_FULL_PAY_DAYS = 45
const MATERNITY_HALF_PAY_DAYS = 15

// Sick — Art. 31
const SICK_FULL_PAY_DAYS = 15
const SICK_HALF_PAY_DAYS = 30
const SICK_ZERO_PAY_DAYS = 45

// Paternity — Art. 32
const PATERNITY_DAYS = 5

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveType = 'annual' | 'maternity' | 'sick' | 'paternity'
type CalcMode  = 'termination' | 'ongoing'

interface Inputs {
  joinDate: string
  calcDate: string
  basicSalary: string
  totalSalary: string
  leaveType: LeaveType
  calcMode: CalcMode
  usedDays: string
  sickDaysTaken: string
  includeProRate: boolean
}

interface AnnualResult {
  serviceYears: number
  serviceMonths: number
  totalAccruedDays: number
  usedDays: number
  unusedDays: number
  dailyRate: number
  totalPay: number
  proRateDays: number
  proRatePay: number
}

interface MaternityResult {
  fullPayDays: number
  fullPayAmount: number
  halfPayDays: number
  halfPayAmount: number
  totalDays: number
  totalPay: number
  dailyRate: number
}

interface SickResult {
  fullPayDays: number
  fullPayAmount: number
  halfPayDays: number
  halfPayAmount: number
  zeroDays: number
  totalPay: number
  dailyRate: number
}

interface PaternityResult {
  days: number
  dailyRate: number
  totalPay: number
}

type Results =
  | { type: 'annual';    data: AnnualResult }
  | { type: 'maternity'; data: MaternityResult }
  | { type: 'sick';      data: SickResult }
  | { type: 'paternity'; data: PaternityResult }

// ─── Calculation Engine ───────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function calcAnnual(inputs: Inputs): AnnualResult | null {
  const basic = parseFloat(inputs.basicSalary)
  if (!basic || basic <= 0 || !inputs.joinDate || !inputs.calcDate) return null

  const totalDays = daysBetween(inputs.joinDate, inputs.calcDate)
  const totalMonths = totalDays / 30.4375
  const serviceYears = Math.floor(totalDays / 365.25)
  const serviceMonths = Math.floor(totalMonths)

  let totalAccruedDays = 0
  if (totalMonths >= 12) {
    const fullYears = Math.floor(totalMonths / 12)
    const remainingMonths = totalMonths % 12
    totalAccruedDays = fullYears * ANNUAL_DAYS_FULL
    if (inputs.includeProRate) {
      totalAccruedDays += Math.floor(remainingMonths) * ANNUAL_DAYS_SHORT
    }
  } else if (totalMonths >= 6) {
    totalAccruedDays = Math.floor(totalMonths) * ANNUAL_DAYS_SHORT
  }

  const usedDays = parseFloat(inputs.usedDays) || 0
  const unusedDays = Math.max(0, totalAccruedDays - usedDays)

  const dailyRate = basic / DAYS_IN_MONTH
  const totalPay = unusedDays * dailyRate

  // Pro-rate for partial current year
  const partialMonths = totalMonths % 12
  const proRateDays = inputs.includeProRate ? Math.floor(partialMonths) * ANNUAL_DAYS_SHORT : 0
  const proRatePay = proRateDays * dailyRate

  return { serviceYears, serviceMonths, totalAccruedDays, usedDays, unusedDays, dailyRate, totalPay, proRateDays, proRatePay }
}

function calcMaternity(inputs: Inputs): MaternityResult | null {
  const salary = parseFloat(inputs.calcMode === 'ongoing' ? inputs.totalSalary || inputs.basicSalary : inputs.basicSalary)
  if (!salary || salary <= 0) return null
  const dailyRate = salary / DAYS_IN_MONTH
  const fullPayAmount = MATERNITY_FULL_PAY_DAYS * dailyRate
  const halfPayAmount = MATERNITY_HALF_PAY_DAYS * (dailyRate * 0.5)
  return {
    fullPayDays: MATERNITY_FULL_PAY_DAYS,
    fullPayAmount,
    halfPayDays: MATERNITY_HALF_PAY_DAYS,
    halfPayAmount,
    totalDays: MATERNITY_FULL_PAY_DAYS + MATERNITY_HALF_PAY_DAYS,
    totalPay: fullPayAmount + halfPayAmount,
    dailyRate,
  }
}

function calcSick(inputs: Inputs): SickResult | null {
  const basic = parseFloat(inputs.basicSalary)
  if (!basic || basic <= 0) return null
  const taken = Math.min(parseFloat(inputs.sickDaysTaken) || 0, SICK_FULL_PAY_DAYS + SICK_HALF_PAY_DAYS + SICK_ZERO_PAY_DAYS)
  const dailyRate = basic / DAYS_IN_MONTH

  const fullPayDays = Math.min(taken, SICK_FULL_PAY_DAYS)
  const halfPayDays = Math.min(Math.max(0, taken - SICK_FULL_PAY_DAYS), SICK_HALF_PAY_DAYS)
  const zeroDays = Math.max(0, taken - SICK_FULL_PAY_DAYS - SICK_HALF_PAY_DAYS)

  return {
    fullPayDays,
    fullPayAmount: fullPayDays * dailyRate,
    halfPayDays,
    halfPayAmount: halfPayDays * dailyRate * 0.5,
    zeroDays,
    totalPay: fullPayDays * dailyRate + halfPayDays * dailyRate * 0.5,
    dailyRate,
  }
}

function calcPaternity(inputs: Inputs): PaternityResult | null {
  const salary = parseFloat(inputs.totalSalary || inputs.basicSalary)
  if (!salary || salary <= 0) return null
  const dailyRate = salary / DAYS_IN_MONTH
  return { days: PATERNITY_DAYS, dailyRate, totalPay: PATERNITY_DAYS * dailyRate }
}

function calculate(inputs: Inputs): Results | null {
  switch (inputs.leaveType) {
    case 'annual':    { const d = calcAnnual(inputs);    return d ? { type: 'annual', data: d }    : null }
    case 'maternity': { const d = calcMaternity(inputs); return d ? { type: 'maternity', data: d } : null }
    case 'sick':      { const d = calcSick(inputs);      return d ? { type: 'sick', data: d }      : null }
    case 'paternity': { const d = calcPaternity(inputs); return d ? { type: 'paternity', data: d } : null }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children, tip }: { children: React.ReactNode; tip?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7f8a]">{children}</span>
      {tip && (
        <span className="group relative cursor-help">
          <span className="inline-flex items-center justify-center w-[15px] h-[15px] rounded-full bg-[#d4e6f0] text-[#3a6b8a] text-[9px] font-black">i</span>
          <span className="absolute left-5 top-0 z-20 hidden group-hover:block w-60 bg-[#0d1f2d] text-[#c8dde8] text-[11px] rounded-lg p-3 shadow-2xl leading-relaxed border border-[#1e3a50]">
            {tip}
          </span>
        </span>
      )}
    </div>
  )
}

function Input({ value, onChange, type = 'number', prefix, placeholder = '0.00' }: {
  value: string; onChange: (v: string) => void; type?: string; prefix?: string; placeholder?: string
}) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8aa8bc] select-none">{prefix}</span>}
      <input
        type={type}
        min={type === 'number' ? '0' : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${prefix ? 'pl-14' : 'pl-3'} pr-3 py-2.5 rounded-lg border border-[#ccdde8] bg-[#f4f9fc] text-sm font-mono text-[#0d1f2d] placeholder-[#aac2d0] focus:outline-none focus:ring-2 focus:ring-[#1a6fa0] transition`}
      />
    </div>
  )
}

function Row({ label, value, sub, negative, highlight, muted, bold }: {
  label: string; value: string; sub?: string; negative?: boolean; highlight?: boolean; muted?: boolean; bold?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 ${highlight ? 'border-t-2 border-[#ccdde8] mt-2 pt-3' : ''}`}>
      <div>
        <span className={`text-sm ${muted ? 'text-[#8aa8bc] text-xs' : 'text-[#2a4555]'}`}>{label}</span>
        {sub && <span className="block text-[10px] text-[#9ab8c8] mt-0.5">{sub}</span>}
      </div>
      <span className={`font-mono tabular-nums text-sm ${bold ? 'font-black text-base' : 'font-semibold'} ${highlight ? 'text-[#0e5f90] text-base font-black' : negative ? 'text-rose-600' : muted ? 'text-[#8aa8bc]' : 'text-[#0d1f2d]'}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UAELeavePayCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'

  const [inputs, setInputs] = useState<Inputs>({
    joinDate: '',
    calcDate: today(),
    basicSalary: '',
    totalSalary: '',
    leaveType: 'annual',
    calcMode: 'termination',
    usedDays: '',
    sickDaysTaken: '',
    includeProRate: true,
  })

  const [results, setResults] = useState<Results | null>(null)
  const [hasCalc, setHasCalc] = useState(false)

  const set = (k: keyof Inputs) => (v: string | boolean) =>
    setInputs(prev => ({ ...prev, [k]: v }))

  const run = useCallback(() => {
    setResults(calculate(inputs))
  }, [inputs])

  useEffect(() => { if (hasCalc) run() }, [inputs, hasCalc, run])

  function applyPreset(preset: 'resign' | 'maternity' | 'sick') {
    const base: Inputs = {
      joinDate: '2021-03-15',
      calcDate: today(),
      basicSalary: '8000',
      totalSalary: '10000',
      leaveType: 'annual',
      calcMode: 'termination',
      usedDays: '12',
      sickDaysTaken: '',
      includeProRate: true,
    }
    if (preset === 'resign') { /* defaults */ }
    if (preset === 'maternity') { base.leaveType = 'maternity'; base.calcMode = 'ongoing' }
    if (preset === 'sick') { base.leaveType = 'sick'; base.sickDaysTaken = '35'; base.calcMode = 'termination' }
    setInputs(base)
    setHasCalc(true)
    setTimeout(() => setResults(calculate(base)), 0)
  }

  function reset() {
    setInputs({ joinDate: '', calcDate: today(), basicSalary: '', totalSalary: '', leaveType: 'annual', calcMode: 'termination', usedDays: '', sickDaysTaken: '', includeProRate: true })
    setResults(null)
    setHasCalc(false)
  }

  const leaveTypes: { value: LeaveType; label: string; icon: string }[] = [
    { value: 'annual',    label: 'Annual Leave',   icon: '🏖️' },
    { value: 'maternity', label: 'Maternity Leave', icon: '🤱' },
    { value: 'sick',      label: 'Sick Leave',      icon: '🏥' },
    { value: 'paternity', label: 'Paternity Leave', icon: '👶' },
  ]

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="font-sans text-[#0d1f2d] max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#1a6fa0] flex items-center justify-center text-white text-xs font-black tracking-tight">UAE</div>
          <h2 className="text-xl font-bold text-[#0d1f2d] tracking-tight">UAE Leave Pay Calculator</h2>
        </div>
        <p className="text-sm text-[#4a6878] leading-relaxed">
          Calculate paid leave entitlements under <strong>UAE Federal Decree-Law No. 33 of 2021</strong> — annual leave encashment, maternity, sick, and paternity pay.
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 bg-[#e8f4fc] border border-[#b8d8ed] rounded-lg px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1a6fa0]">Updated 2026</span>
          <span className="text-[10px] text-[#5a8aa8]">· Federal Labour Law compliant</span>
        </div>
      </div>

      {/* Presets */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8aa8bc] mb-2 font-bold">Quick Scenarios</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'resign',    label: '📤 Resignation Payout' },
            { key: 'maternity', label: '🤱 Maternity Calculation' },
            { key: 'sick',      label: '🏥 Sick Leave Pay' },
          ].map(p => (
            <button key={p.key} onClick={() => applyPreset(p.key as any)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#ccdde8] bg-white text-[#2a4f6a] hover:bg-[#e8f4fc] hover:border-[#1a6fa0] transition-all font-semibold">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leave Type */}
      <div className="mb-5">
        <Label>Leave Type</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {leaveTypes.map(lt => (
            <button key={lt.value} onClick={() => set('leaveType')(lt.value)}
              className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${inputs.leaveType === lt.value ? 'border-[#1a6fa0] bg-[#1a6fa0] text-white shadow-md' : 'border-[#ccdde8] bg-white text-[#2a4f6a] hover:border-[#1a6fa0]'}`}>
              <span className="text-lg">{lt.icon}</span>
              {lt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calc Mode (annual only) */}
      {inputs.leaveType === 'annual' && (
        <div className="mb-5">
          <Label tip="Termination/encashment uses basic salary only (Art. 29.9). Ongoing leave may include allowances per contract.">Calculation Purpose</Label>
          <div className="flex gap-2">
            {[
              { value: 'termination', label: '📋 Termination / Encashment' },
              { value: 'ongoing',     label: '✅ While on Leave' },
            ].map(m => (
              <button key={m.value} onClick={() => set('calcMode')(m.value)}
                className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all ${inputs.calcMode === m.value ? 'border-[#1a6fa0] bg-[#1a6fa0] text-white' : 'border-[#ccdde8] bg-white text-[#2a4f6a] hover:border-[#1a6fa0]'}`}>
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#7a9fb8] mt-1.5">
            {inputs.calcMode === 'termination'
              ? 'Per Art. 29(9): basic salary only used for leave encashment on termination.'
              : 'Full salary (basic + allowances) typically applies while on approved leave.'}
          </p>
        </div>
      )}

      {/* Core inputs */}
      <div className="bg-white rounded-2xl border border-[#ccdde8] p-5 mb-4 space-y-4">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b9ab8] font-bold mb-3">Employee Details</p>

        {(inputs.leaveType === 'annual') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label tip="Used to calculate total service period and accrued leave days.">Join Date</Label>
              <Input type="date" value={inputs.joinDate} onChange={set('joinDate')} placeholder="" />
            </div>
            <div>
              <Label tip="Last working day (for termination) or today for accrual check.">End / Calc Date</Label>
              <Input type="date" value={inputs.calcDate} onChange={set('calcDate')} placeholder="" />
            </div>
          </div>
        )}

        <div>
          <Label tip="Basic salary is used for all leave pay calculations per UAE Labour Law. Exclude allowances here.">Basic Monthly Salary</Label>
          <Input value={inputs.basicSalary} onChange={set('basicSalary')} prefix="AED" />
        </div>

        {(inputs.leaveType === 'maternity' || inputs.leaveType === 'paternity' || (inputs.leaveType === 'annual' && inputs.calcMode === 'ongoing')) && (
          <div>
            <Label tip="Total gross including housing, transport allowances. Used for maternity and paternity calculations.">Total Monthly Salary (incl. allowances)</Label>
            <Input value={inputs.totalSalary} onChange={set('totalSalary')} prefix="AED" placeholder="Optional" />
          </div>
        )}

        {inputs.leaveType === 'annual' && (
          <>
            <div>
              <Label tip="Annual leave days already taken during the service period.">Used Annual Leave Days</Label>
              <Input value={inputs.usedDays} onChange={set('usedDays')} placeholder="0" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set('includeProRate')(!inputs.includeProRate)}
                className={`w-10 h-5 rounded-full transition-all relative ${inputs.includeProRate ? 'bg-[#1a6fa0]' : 'bg-[#ccdde8]'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${inputs.includeProRate ? 'left-5' : 'left-0.5'}`} />
              </div>
              <span className="text-xs text-[#2a4f6a] font-semibold">Include pro-rated partial year (2 days/month)</span>
            </label>
          </>
        )}

        {inputs.leaveType === 'sick' && (
          <div>
            <Label tip="Total sick days taken this year. First 15 = full pay, next 30 = half pay, next 45 = unpaid.">Sick Days Taken This Year</Label>
            <Input value={inputs.sickDaysTaken} onChange={set('sickDaysTaken')} placeholder="0" />
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => { run(); setHasCalc(true) }}
          className="flex-1 bg-[#1a6fa0] hover:bg-[#155d8a] active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-xl transition-all text-sm tracking-wide shadow-lg shadow-[#1a6fa020]">
          Calculate Leave Pay
        </button>
        <button onClick={reset}
          className="px-5 py-3.5 border-2 border-[#ccdde8] text-[#5a7888] hover:bg-[#f4f9fc] font-semibold rounded-xl transition-all text-sm">
          Reset
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">

          {/* Annual */}
          {results.type === 'annual' && (() => {
            const d = results.data
            return (
              <>
                {/* Hero */}
                <div className="bg-[#1a6fa0] rounded-2xl p-5 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60 mb-1">Total Leave Pay</div>
                  <div className="text-4xl font-black font-mono">{fmt(d.totalPay)}</div>
                  <div className="text-xs opacity-60 mt-1">Based on basic salary — Art. 29, Federal Decree-Law No. 33/2021</div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Accrued Days', value: d.totalAccruedDays.toFixed(1) },
                    { label: 'Used Days',    value: d.usedDays.toString() },
                    { label: 'Unused Days',  value: d.unusedDays.toFixed(1) },
                  ].map(c => (
                    <div key={c.label} className="bg-[#f4f9fc] border border-[#ccdde8] rounded-xl p-3 text-center">
                      <div className="text-lg font-black font-mono text-[#0d1f2d]">{c.value}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#6b9ab8] font-bold mt-0.5">{c.label}</div>
                    </div>
                  ))}
                </div>

                {/* Breakdown */}
                <div className="bg-white rounded-2xl border border-[#ccdde8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b9ab8] font-bold mb-3">Pay Breakdown</p>
                  <Row label="Service Period" value={`${d.serviceYears}y ${d.serviceMonths % 12}m`} />
                  <Row label="Daily Rate (Basic ÷ 30)" value={fmt(d.dailyRate)} sub="Art. 29 — 30-day month standard" />
                  <Row label="Unused Leave Days" value={`${d.unusedDays.toFixed(1)} days`} />
                  <Row label="Leave Pay (Unused × Daily Rate)" value={fmt(d.totalPay)} highlight />
                  {d.proRateDays > 0 && (
                    <Row label={`Pro-rated Partial Year (${d.proRateDays} days)`} value={fmt(d.proRatePay)} muted sub="2 days/month for incomplete year" />
                  )}
                </div>

                {/* Service note */}
                <div className="bg-[#fff8e6] border border-[#f5d87a] rounded-xl p-4">
                  <p className="text-xs text-[#7a5a00] leading-relaxed">
                    <strong>Note:</strong> {d.serviceYears >= 1
                      ? `With ≥1 year service, entitlement is ${ANNUAL_DAYS_FULL} calendar days per year (Art. 29).`
                      : d.serviceMonths >= 6
                      ? `With 6–11 months service, entitlement is 2 days per completed month (Art. 29).`
                      : `Service under 6 months: no statutory annual leave entitlement unless contract states otherwise.`}
                    {' '}Unused leave on termination is paid at basic salary only.
                  </p>
                </div>
              </>
            )
          })()}

          {/* Maternity */}
          {results.type === 'maternity' && (() => {
            const d = results.data
            return (
              <>
                <div className="bg-[#1a6fa0] rounded-2xl p-5 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60 mb-1">Total Maternity Pay</div>
                  <div className="text-4xl font-black font-mono">{fmt(d.totalPay)}</div>
                  <div className="text-xs opacity-60 mt-1">60 days total · Art. 30, Federal Decree-Law No. 33/2021</div>
                </div>
                <div className="bg-white rounded-2xl border border-[#ccdde8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b9ab8] font-bold mb-3">Maternity Pay Breakdown</p>
                  <Row label={`First ${MATERNITY_FULL_PAY_DAYS} days (100% pay)`} value={fmt(d.fullPayAmount)} />
                  <Row label={`Next ${MATERNITY_HALF_PAY_DAYS} days (50% pay)`} value={fmt(d.halfPayAmount)} />
                  <Row label="Daily Rate" value={fmt(d.dailyRate)} muted sub="Based on total monthly salary ÷ 30" />
                  <Row label="Total Maternity Pay" value={fmt(d.totalPay)} highlight />
                </div>
                <div className="bg-[#e8f4fc] border border-[#b8d8ed] rounded-xl p-4">
                  <p className="text-xs text-[#1a4a6a] leading-relaxed">
                    <strong>Art. 30:</strong> 60 days maternity leave — first 45 at full pay, next 15 at 50%. No minimum service requirement. An additional 45 unpaid days can be taken for illness. Mothers of children with illness or disability may take extra unpaid leave.
                  </p>
                </div>
              </>
            )
          })()}

          {/* Sick */}
          {results.type === 'sick' && (() => {
            const d = results.data
            return (
              <>
                <div className="bg-[#1a6fa0] rounded-2xl p-5 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60 mb-1">Total Sick Pay</div>
                  <div className="text-4xl font-black font-mono">{fmt(d.totalPay)}</div>
                  <div className="text-xs opacity-60 mt-1">Up to 90 days/year · Art. 31, Federal Decree-Law No. 33/2021</div>
                </div>
                <div className="bg-white rounded-2xl border border-[#ccdde8] p-5">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[#6b9ab8] font-bold mb-3">Sick Leave Pay Breakdown</p>
                  <Row label={`Days 1–15 (${d.fullPayDays} days @ 100%)`} value={fmt(d.fullPayAmount)} />
                  <Row label={`Days 16–45 (${d.halfPayDays} days @ 50%)`} value={fmt(d.halfPayAmount)} />
                  {d.zeroDays > 0 && <Row label={`Days 46–90 (${d.zeroDays} days @ 0%)`} value="AED 0.00" muted />}
                  <Row label="Daily Rate (Basic ÷ 30)" value={fmt(d.dailyRate)} muted />
                  <Row label="Total Sick Pay" value={fmt(d.totalPay)} highlight />
                </div>
                <div className="bg-[#fff8e6] border border-[#f5d87a] rounded-xl p-4">
                  <p className="text-xs text-[#7a5a00] leading-relaxed">
                    <strong>Art. 31:</strong> Sick leave requires a medical certificate from an approved medical entity. Applies after probation period. First 15 days: 100% pay. Next 30 days: 50% pay. Remaining 45 days: unpaid.
                  </p>
                </div>
              </>
            )
          })()}

          {/* Paternity */}
          {results.type === 'paternity' && (() => {
            const d = results.data
            return (
              <>
                <div className="bg-[#1a6fa0] rounded-2xl p-5 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60 mb-1">Total Paternity Pay</div>
                  <div className="text-4xl font-black font-mono">{fmt(d.totalPay)}</div>
                  <div className="text-xs opacity-60 mt-1">5 working days, fully paid · Art. 32, Federal Decree-Law No. 33/2021</div>
                </div>
                <div className="bg-white rounded-2xl border border-[#ccdde8] p-5">
                  <Row label="Paternity Days" value="5 working days" />
                  <Row label="Daily Rate" value={fmt(d.dailyRate)} muted sub="Based on total monthly salary ÷ 30" />
                  <Row label="Total Pay" value={fmt(d.totalPay)} highlight />
                </div>
                <div className="bg-[#e8f4fc] border border-[#b8d8ed] rounded-xl p-4">
                  <p className="text-xs text-[#1a4a6a] leading-relaxed">
                    <strong>Art. 32:</strong> 5 fully paid working days of paternity leave. Must be taken within 6 months of the child's birth. Applies to all private sector employees under federal UAE labour law.
                  </p>
                </div>
              </>
            )
          })()}

          {/* Disclaimer */}
          <p className="text-[11px] text-[#8aa8bc] text-center leading-relaxed px-4">
            For informational and estimation purposes only. Not legal advice. Calculations follow standard UAE private sector federal law — free zones, special contracts, or DIFC/ADGM regulations may differ. Consult MOHRE or a qualified HR professional for specific cases.
          </p>
        </div>
      )}
    </div>
  )
}
