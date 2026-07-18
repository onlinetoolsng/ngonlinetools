'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = { locale: string }

// ─── Types ───────────────────────────────────────────────────────────────────

type Nationality = 'saudi' | 'expat'
type TerminationReason = 'employer' | 'resignation'
type Tab = 'gross-net' | 'overtime' | 'eosb'

interface SalaryInputs {
  nationality: Nationality
  basicSalary: number
  housingAllowance: number
  transportAllowance: number
  otherAllowances: number
}

interface GrossNetResult {
  basic: number
  housing: number
  transport: number
  other: number
  grossMonthly: number
  gosiBase: number
  gosiEmployee: number
  gosiRate: number
  gosiCapped: boolean
  netMonthly: number
  annualGross: number
  annualNet: number
  employerGosi: number
  totalEmployerCost: number
}

interface OvertimeResult {
  hourlyRate: number
  regularOtPay: number
  holidayOtPay: number
  totalOtPay: number
  newMonthlyTotal: number
}

interface EOSBResult {
  serviceYears: number
  serviceMonths: number
  actualWage: number
  eosb: number
  unusedLeaveEncash: number
  total: number
  entitled: boolean
  reductionApplied: boolean
}

// ─── GOSI Cap ────────────────────────────────────────────────────────────────
const GOSI_CAP = 45000
const SAUDI_GOSI_EMPLOYEE = 0.0975   // 9.75% (pension 9% + unemployment 0.75%)
const SAUDI_GOSI_EMPLOYER = 0.1175   // 11.75%
const EXPAT_GOSI_EMPLOYER = 0.02     // 2% occupational hazard (employer only)

// ─── Pure calculation functions ───────────────────────────────────────────────

function calcGrossNet(inputs: SalaryInputs): GrossNetResult {
  const { nationality, basicSalary, housingAllowance, transportAllowance, otherAllowances } = inputs
  const gross = basicSalary + housingAllowance + transportAllowance + otherAllowances

  // GOSI base = basic + housing (standard practice)
  const gosiBase = basicSalary + housingAllowance
  const cappedBase = Math.min(gosiBase, GOSI_CAP)
  const gosiCapped = gosiBase > GOSI_CAP

  let gosiEmployee = 0
  let gosiRate = 0
  let employerGosi = 0

  if (nationality === 'saudi') {
    gosiEmployee = cappedBase * SAUDI_GOSI_EMPLOYEE
    gosiRate = SAUDI_GOSI_EMPLOYEE
    employerGosi = cappedBase * SAUDI_GOSI_EMPLOYER
  } else {
    gosiEmployee = 0  // expatriates pay no employee GOSI
    gosiRate = 0
    employerGosi = gross * EXPAT_GOSI_EMPLOYER
  }

  const net = gross - gosiEmployee

  return {
    basic: basicSalary,
    housing: housingAllowance,
    transport: transportAllowance,
    other: otherAllowances,
    grossMonthly: gross,
    gosiBase,
    gosiEmployee,
    gosiRate,
    gosiCapped,
    netMonthly: net,
    annualGross: gross * 12,
    annualNet: net * 12,
    employerGosi,
    totalEmployerCost: gross + employerGosi,
  }
}

function calcOvertime(basicSalary: number, regularHours: number, holidayHours: number): OvertimeResult {
  // Hourly rate based on 30-day month, 8h/day = 240 hours
  const hourlyRate = basicSalary / 240
  const regularOtPay = regularHours * hourlyRate * 1.5
  const holidayOtPay = holidayHours * hourlyRate * 2.0
  const totalOtPay = regularOtPay + holidayOtPay

  return {
    hourlyRate,
    regularOtPay,
    holidayOtPay,
    totalOtPay,
    newMonthlyTotal: basicSalary + totalOtPay,
  }
}

function calcEOSB(
  actualWage: number,
  startDate: string,
  endDate: string,
  terminationReason: TerminationReason,
  unusedLeaveDays: number,
): EOSBResult {
  if (!startDate || !endDate) {
    return { serviceYears: 0, serviceMonths: 0, actualWage, eosb: 0, unusedLeaveEncash: 0, total: 0, entitled: false, reductionApplied: false }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffMs = end.getTime() - start.getTime()
  const totalMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44)
  const years = totalMonths / 12
  const fullYears = Math.floor(years)
  const partialMonths = totalMonths - fullYears * 12

  if (years < 2) {
    return { serviceYears: fullYears, serviceMonths: Math.round(partialMonths), actualWage, eosb: 0, unusedLeaveEncash: 0, total: 0, entitled: false, reductionApplied: false }
  }

  // Base EOSB: first 5 years = 0.5 month per year, after 5 = 1 month per year
  const halfMonthWage = actualWage * 0.5
  let baseEosb = 0

  if (years <= 5) {
    baseEosb = halfMonthWage * years
  } else {
    baseEosb = (halfMonthWage * 5) + (actualWage * (years - 5))
  }

  // Resignation reduction
  let reductionApplied = false
  let eosb = baseEosb

  if (terminationReason === 'resignation') {
    if (years < 5) {
      eosb = baseEosb * (1 / 3)
      reductionApplied = true
    } else if (years < 10) {
      eosb = baseEosb * (2 / 3)
      reductionApplied = true
    }
    // 10+ years = full entitlement on resignation
  }

  const dailyRate = actualWage / 30
  const unusedLeaveEncash = unusedLeaveDays * dailyRate

  return {
    serviceYears: fullYears,
    serviceMonths: Math.round(partialMonths),
    actualWage,
    eosb,
    unusedLeaveEncash,
    total: eosb + unusedLeaveEncash,
    entitled: true,
    reductionApplied,
  }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function sar(n: number) {
  return `SAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function pct(n: number) {
  return `${(n * 100).toFixed(2)}%`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({
  label, value, onChange, placeholder, hint, prefix = 'SAR'
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  prefix?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', background: 'var(--color-background-primary)' }}>
        <span style={{ padding: '0 10px', fontSize: 12, fontWeight: 500, color: 'var(--color-text-tertiary)', borderRight: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>{prefix}</span>
        <input
          type="number"
          min="0"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '0'}
          style={{ flex: 1, border: 'none', outline: 'none', padding: '9px 12px', fontSize: 14, background: 'transparent', color: 'var(--color-text-primary)' }}
        />
      </div>
      {hint && <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{hint}</span>}
    </div>
  )
}

function Row({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{label}{sub && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 4 }}>{sub}</span>}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: color ?? 'var(--color-text-primary)' }}>{value}</span>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      background: accent ? 'var(--color-background-success)' : 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-md)',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontSize: 12, color: accent ? 'var(--color-text-success)' : 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 500, color: accent ? 'var(--color-text-success)' : 'var(--color-text-primary)' }}>{value}</span>
    </div>
  )
}

function Badge({ text, variant }: { text: string; variant: 'info' | 'warning' | 'success' | 'danger' }) {
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 11,
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 'var(--border-radius-md)',
      background: `var(--color-background-${variant})`,
      color: `var(--color-text-${variant})`,
    }}>{text}</span>
  )
}

// ─── Tab: Gross / Net ─────────────────────────────────────────────────────────

function GrossNetTab({ nationality }: { nationality: Nationality }) {
  const [basic, setBasic] = useState('')
  const [housing, setHousing] = useState('')
  const [transport, setTransport] = useState('')
  const [other, setOther] = useState('')
  const [result, setResult] = useState<GrossNetResult | null>(null)

  const calculate = useCallback(() => {
    const b = parseFloat(basic) || 0
    if (b <= 0) return
    setResult(calcGrossNet({
      nationality,
      basicSalary: b,
      housingAllowance: parseFloat(housing) || 0,
      transportAllowance: parseFloat(transport) || 0,
      otherAllowances: parseFloat(other) || 0,
    }))
  }, [basic, housing, transport, other, nationality])

  useEffect(() => { calculate() }, [calculate])

  function reset() { setBasic(''); setHousing(''); setTransport(''); setOther(''); setResult(null) }

  const showMinWageNote = nationality === 'saudi' && parseFloat(basic) > 0 && parseFloat(basic) < 4000

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {showMinWageNote && (
        <div style={{ background: 'var(--color-background-warning)', border: '0.5px solid var(--color-border-warning)', borderRadius: 'var(--border-radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--color-text-warning)' }}>
          Note: Minimum basic salary for Saudi nationals in the private sector is SAR 4,000.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <InputField label="Basic salary" value={basic} onChange={setBasic} hint="Primary compensation component" />
        <InputField label="Housing allowance" value={housing} onChange={setHousing} hint="Typically 25–30% of basic" />
        <InputField label="Transport allowance" value={transport} onChange={setTransport} />
        <InputField label="Other allowances" value={other} onChange={setOther} hint="Education, phone, etc." />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={reset} style={{ padding: '8px 16px', fontSize: 13 }}>Reset</button>
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>

          {/* Hero stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <StatCard label="Gross monthly" value={sar(result.grossMonthly)} />
            <StatCard label="Net take-home" value={sar(result.netMonthly)} accent />
            <StatCard label="Annual gross" value={sar(result.annualGross)} />
            <StatCard label="Annual net" value={sar(result.annualNet)} />
          </div>

          {/* Breakdown */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, marginTop: 0 }}>Monthly salary breakdown</p>
            <Row label="Basic salary" value={sar(result.basic)} />
            {result.housing > 0 && <Row label="Housing allowance" value={sar(result.housing)} />}
            {result.transport > 0 && <Row label="Transport allowance" value={sar(result.transport)} />}
            {result.other > 0 && <Row label="Other allowances" value={sar(result.other)} />}
            <Row label="Gross salary" value={sar(result.grossMonthly)} />

            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '14px 0 8px' }}>Deductions</p>
            {nationality === 'saudi' ? (
              <>
                <Row
                  label="GOSI — employee contribution"
                  sub={`(${pct(result.gosiRate)} of basic + housing${result.gosiCapped ? ', capped at SAR 45,000' : ''})`}
                  value={`− ${sar(result.gosiEmployee)}`}
                  color="var(--color-text-danger)"
                />
                <Row label="Income tax" value="None" color="var(--color-text-success)" />
              </>
            ) : (
              <>
                <Row label="GOSI — employee contribution" value="None" color="var(--color-text-success)" sub="(expatriates exempt)" />
                <Row label="Income tax" value="None" color="var(--color-text-success)" />
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Net take-home</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-success)' }}>{sar(result.netMonthly)}</span>
            </div>
          </div>

          {/* Employer cost */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, marginTop: 0 }}>Employer total cost (informational)</p>
            <Row label="Gross salary" value={sar(result.grossMonthly)} />
            <Row
              label={nationality === 'saudi' ? 'GOSI — employer share (11.75%)' : 'GOSI — occupational hazard (2%)'}
              value={sar(result.employerGosi)}
              color="var(--color-text-danger)"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Total employer cost</span>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{sar(result.totalEmployerCost)}</span>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
            Estimates based on standard Saudi Labour Law interpretations. Consult a licensed HR or legal professional for your specific situation.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Overtime ────────────────────────────────────────────────────────────

function OvertimeTab() {
  const [basic, setBasic] = useState('')
  const [regularHours, setRegularHours] = useState('')
  const [holidayHours, setHolidayHours] = useState('')
  const [result, setResult] = useState<OvertimeResult | null>(null)

  const calculate = useCallback(() => {
    const b = parseFloat(basic) || 0
    const r = parseFloat(regularHours) || 0
    const h = parseFloat(holidayHours) || 0
    if (b <= 0) return
    setResult(calcOvertime(b, r, h))
  }, [basic, regularHours, holidayHours])

  useEffect(() => { calculate() }, [calculate])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--color-background-info)', border: '0.5px solid var(--color-border-info)', borderRadius: 'var(--border-radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--color-text-info)' }}>
        Saudi Labour Law Article 107: overtime on regular days = 150% of hourly rate. Public holidays & weekends = 200%.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <InputField label="Basic salary" value={basic} onChange={setBasic} hint="Used to derive hourly rate" />
        <InputField label="Regular OT hours" value={regularHours} onChange={setRegularHours} prefix="hrs" hint="Weekday overtime (×1.5)" />
        <InputField label="Holiday/weekend OT" value={holidayHours} onChange={setHolidayHours} prefix="hrs" hint="Weekend/holiday OT (×2.0)" />
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <StatCard label="Hourly rate" value={sar(result.hourlyRate)} />
            <StatCard label="Regular OT pay" value={sar(result.regularOtPay)} />
            <StatCard label="Holiday OT pay" value={sar(result.holidayOtPay)} />
            <StatCard label="Total OT this month" value={sar(result.totalOtPay)} accent />
          </div>

          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8, marginTop: 0 }}>Formula breakdown</p>
            <Row label="Hourly rate" sub="(basic ÷ 240)" value={sar(result.hourlyRate)} />
            {(parseFloat(regularHours) || 0) > 0 &&
              <Row label={`Regular OT (${regularHours} hrs × hourly × 1.5)`} value={sar(result.regularOtPay)} />}
            {(parseFloat(holidayHours) || 0) > 0 &&
              <Row label={`Holiday OT (${holidayHours} hrs × hourly × 2.0)`} value={sar(result.holidayOtPay)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Monthly total with OT</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-success)' }}>{sar(result.newMonthlyTotal)}</span>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
            Standard hours: 8/day, 48/week (40 during Ramadan). Hourly rate = basic ÷ 240 hours/month.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Tab: EOSB ────────────────────────────────────────────────────────────────

function EOSBTab() {
  const [basic, setBasic] = useState('')
  const [housing, setHousing] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [termination, setTermination] = useState<TerminationReason>('employer')
  const [unusedLeave, setUnusedLeave] = useState('')
  const [result, setResult] = useState<EOSBResult | null>(null)

  const calculate = useCallback(() => {
    const b = parseFloat(basic) || 0
    const h = parseFloat(housing) || 0
    if (b <= 0 || !startDate || !endDate) return
    const actualWage = b + h
    setResult(calcEOSB(actualWage, startDate, endDate, termination, parseFloat(unusedLeave) || 0))
  }, [basic, housing, startDate, endDate, termination, unusedLeave])

  useEffect(() => { calculate() }, [calculate])

  const dateInputStyle = {
    width: '100%',
    border: '0.5px solid var(--color-border-secondary)',
    borderRadius: 'var(--border-radius-md)',
    padding: '9px 12px',
    fontSize: 14,
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    boxSizing: 'border-box' as const,
    outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--color-background-info)', border: '0.5px solid var(--color-border-info)', borderRadius: 'var(--border-radius-md)', padding: '10px 14px', fontSize: 13, color: 'var(--color-text-info)' }}>
        Based on Saudi Labour Law Article 84. EOSB uses Actual Wage (basic + housing). Minimum 2 years service required.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <InputField label="Basic salary" value={basic} onChange={setBasic} />
        <InputField label="Housing allowance" value={housing} onChange={setHousing} hint="Included in actual wage" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Employment start date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={dateInputStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Last working day</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={dateInputStyle} />
        </div>
        <InputField label="Unused annual leave" value={unusedLeave} onChange={setUnusedLeave} prefix="days" hint="Encashed at daily rate" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Termination reason</label>
          <select
            value={termination}
            onChange={e => setTermination(e.target.value as TerminationReason)}
            style={{ ...dateInputStyle, cursor: 'pointer' }}
          >
            <option value="employer">Employer-initiated (full entitlement)</option>
            <option value="resignation">Resignation</option>
          </select>
        </div>
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>

          {!result.entitled ? (
            <div style={{ background: 'var(--color-background-warning)', border: '0.5px solid var(--color-border-warning)', borderRadius: 'var(--border-radius-md)', padding: '14px 16px', fontSize: 14, color: 'var(--color-text-warning)' }}>
              Service period is {result.serviceYears} year{result.serviceYears !== 1 ? 's' : ''} {result.serviceMonths} months — EOSB requires a minimum of 2 years of continuous service.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <StatCard label="Service period" value={`${result.serviceYears}y ${result.serviceMonths}m`} />
                <StatCard label="Actual wage" value={sar(result.actualWage)} />
                <StatCard label="EOSB gratuity" value={sar(result.eosb)} />
                <StatCard label="Total entitlement" value={sar(result.total)} accent />
              </div>

              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: 0 }}>EOSB calculation</p>
                  {result.reductionApplied && <Badge text="Resignation reduction applied" variant="warning" />}
                </div>
                <Row label="Actual wage" sub="(basic + housing)" value={sar(result.actualWage)} />
                {result.serviceYears <= 5 ? (
                  <Row label={`First ${result.serviceYears} years (× 0.5 month/year)`} value={sar(result.eosb / (termination === 'resignation' ? (result.serviceYears < 5 ? 3 : 1.5) : 1))} />
                ) : (
                  <>
                    <Row label="First 5 years (× 0.5 month/year)" value={sar(result.actualWage * 0.5 * 5)} />
                    <Row label={`Years 6–${result.serviceYears} (× 1.0 month/year)`} value={sar(result.actualWage * (result.serviceYears - 5))} />
                  </>
                )}
                {result.reductionApplied && (
                  <Row
                    label={`Resignation reduction (${result.serviceYears < 5 ? '1/3' : '2/3'} of full amount)`}
                    value={`− some reduction applied`}
                    color="var(--color-text-warning)"
                  />
                )}
                <Row label="EOSB gratuity" value={sar(result.eosb)} />
                {result.unusedLeaveEncash > 0 && (
                  <Row label={`Unused leave encashment (${unusedLeave} days)`} value={sar(result.unusedLeaveEncash)} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Total entitlement</span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-success)' }}>{sar(result.total)}</span>
                </div>
              </div>

              <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '14px 16px', fontSize: 13 }}>
                <p style={{ fontWeight: 500, margin: '0 0 8px', fontSize: 13 }}>Resignation reduction schedule</p>
                <div style={{ display: 'grid', gap: 4 }}>
                  {[['Less than 2 years', 'No entitlement'], ['2–5 years', '1/3 of calculated amount'], ['5–10 years', '2/3 of calculated amount'], ['10+ years', 'Full entitlement']].map(([period, rule]) => (
                    <div key={period} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                      <span>{period}</span><span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
            Estimates based on Saudi Labour Law Article 84. Pro-rated partial years included. Consult a legal professional for disputes or complex contracts.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SaudiSalaryCalculator({ locale: _locale }: Props) {
  const [tab, setTab] = useState<Tab>('gross-net')
  const [nationality, setNationality] = useState<Nationality>('expat')

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'gross-net', label: 'Gross / net salary', icon: '💰' },
    { id: 'overtime', label: 'Overtime calculator', icon: '⏱️' },
    { id: 'eosb', label: 'End of service (EOSB)', icon: '📋' },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Nationality toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Nationality</span>
        <div style={{ display: 'flex', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: 3, gap: 2, width: 'fit-content' }}>
          {([['saudi', 'Saudi national'], ['expat', 'Expatriate']] as [Nationality, string][]).map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setNationality(val)}
              style={{
                padding: '7px 18px',
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                borderRadius: 'calc(var(--border-radius-md) - 2px)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: nationality === val ? 'var(--color-background-primary)' : 'transparent',
                color: nationality === val ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                boxShadow: nationality === val ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >{lbl}</button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
          {nationality === 'saudi'
            ? 'Saudi nationals: GOSI employee contribution 9.75% (pension + unemployment insurance) on basic + housing, capped at SAR 45,000.'
            : 'Expatriates: no employee GOSI deduction. Employer pays 2% occupational hazard insurance.'}
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: tab === t.id ? 500 : 400,
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--color-text-primary)' : '2px solid transparent',
              background: 'transparent',
              color: tab === t.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'gross-net' && <GrossNetTab nationality={nationality} />}
        {tab === 'overtime' && <OvertimeTab />}
        {tab === 'eosb' && <EOSBTab />}
      </div>
    </div>
  )
}
