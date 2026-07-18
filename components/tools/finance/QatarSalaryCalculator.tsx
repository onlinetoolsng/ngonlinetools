'use client'

import { useState, useCallback, useEffect } from 'react'

type Props = { locale: string }

// ─── Constants (update annually) ──────────────────────────────────────────────

const OT_REGULAR_MULTIPLIER  = 1.25  // Extra hours on working days
const OT_NIGHT_MULTIPLIER    = 1.50  // Night work 9pm–6am
const OT_HOLIDAY_MULTIPLIER  = 1.50  // Rest day / public holiday

const MIN_WAGE_BASE          = 1000  // QAR
const MIN_WAGE_HOUSING       = 500   // QAR additional if no accommodation
const MIN_WAGE_FOOD          = 300   // QAR additional if no food

const MAX_DAILY_HOURS        = 10    // Qatar Labour Law absolute maximum
const STANDARD_DAILY_HOURS   = 8
const RAMADAN_DAILY_HOURS    = 6
const WORKING_DAYS_MONTH     = 26   // Standard working days for hourly rate
const CALENDAR_DAYS_MONTH    = 30   // For daily rate / leave / EOSB

const EOSB_FIRST_5_DAYS      = 21   // Days per year, first 5 years
const EOSB_AFTER_5_DAYS      = 30   // Days per year, after 5 years

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'salary' | 'overtime' | 'labour'
type ContractType = 'monthly' | 'daily' | 'hourly'
type Category = 'non-managerial' | 'managerial'

interface SharedInputs {
  basicSalary: string
  contractType: ContractType
  category: Category
  hasAccommodation: boolean
  hasFood: boolean
  workingDaysPerWeek: string
  ramadanMode: boolean
}

interface AllowanceInputs {
  housing: string
  food: string
  transport: string
  other: string
  deductions: string
}

interface OvertimeInputs {
  regularOtHours: string
  nightOtHours: string
  holidayOtHours: string
}

interface EosbInputs {
  yearsOfService: string
}

interface SalaryResult {
  basicSalary: number
  housing: number
  food: number
  transport: number
  other: number
  grossMonthly: number
  deductions: number
  netMonthly: number
  annualGross: number
  annualNet: number
  hourlyRate: number
  dailyRate: number
  minWageRequired: number
  minWagePassed: boolean
  minWageGap: number
}

interface OvertimeResult {
  hourlyRate: number
  regularOtPay: number
  nightOtPay: number
  holidayOtPay: number
  totalOtPay: number
  grandTotal: number
  totalHoursWarning: boolean
  managerialWarning: boolean
  maxDailyHours: number
}

interface EosbResult {
  years: number
  dailyRate: number
  first5Pay: number
  after5Pay: number
  total: number
}

// ─── Pure calculation functions ───────────────────────────────────────────────

function calcSalary(shared: SharedInputs, allowances: AllowanceInputs): SalaryResult {
  const basic    = parseFloat(shared.basicSalary) || 0
  const housing  = parseFloat(allowances.housing) || 0
  const food     = parseFloat(allowances.food) || 0
  const transport = parseFloat(allowances.transport) || 0
  const other    = parseFloat(allowances.other) || 0
  const deductions = parseFloat(allowances.deductions) || 0

  const grossMonthly = basic + housing + food + transport + other
  const netMonthly   = grossMonthly - deductions

  const workDays = parseFloat(shared.workingDaysPerWeek) || 6
  const workDaysMonth = (workDays / 7) * CALENDAR_DAYS_MONTH

  const hourlyRate = basic / WORKING_DAYS_MONTH / STANDARD_DAILY_HOURS
  const dailyRate  = basic / CALENDAR_DAYS_MONTH

  // Minimum wage validation
  let minWageRequired = MIN_WAGE_BASE
  if (!shared.hasAccommodation) minWageRequired += MIN_WAGE_HOUSING
  if (!shared.hasFood) minWageRequired += MIN_WAGE_FOOD

  const minWagePassed = basic >= minWageRequired
  const minWageGap = minWagePassed ? 0 : minWageRequired - basic

  return {
    basicSalary: basic, housing, food, transport, other,
    grossMonthly, deductions, netMonthly,
    annualGross: grossMonthly * 12,
    annualNet: netMonthly * 12,
    hourlyRate, dailyRate,
    minWageRequired, minWagePassed, minWageGap,
  }
}

function calcOvertime(shared: SharedInputs, ot: OvertimeInputs): OvertimeResult {
  const basic    = parseFloat(shared.basicSalary) || 0
  const regular  = parseFloat(ot.regularOtHours) || 0
  const night    = parseFloat(ot.nightOtHours) || 0
  const holiday  = parseFloat(ot.holidayOtHours) || 0

  const hourlyRate = basic / WORKING_DAYS_MONTH / STANDARD_DAILY_HOURS

  const regularOtPay = hourlyRate * regular  * OT_REGULAR_MULTIPLIER
  const nightOtPay   = hourlyRate * night    * OT_NIGHT_MULTIPLIER
  const holidayOtPay = hourlyRate * holiday  * OT_HOLIDAY_MULTIPLIER
  const totalOtPay   = regularOtPay + nightOtPay + holidayOtPay

  const maxDailyHours = shared.ramadanMode ? RAMADAN_DAILY_HOURS : STANDARD_DAILY_HOURS
  const totalExtraHours = regular + night + holiday
  const totalHoursWarning = totalExtraHours > 0 &&
    (maxDailyHours + totalExtraHours / 20) > MAX_DAILY_HOURS  // rough daily check

  return {
    hourlyRate,
    regularOtPay, nightOtPay, holidayOtPay, totalOtPay,
    grandTotal: basic + totalOtPay,
    totalHoursWarning,
    managerialWarning: shared.category === 'managerial',
    maxDailyHours,
  }
}

function calcEosb(basic: number, years: number): EosbResult {
  const dailyRate = basic / CALENDAR_DAYS_MONTH
  const fullYears = Math.floor(years)
  const first5    = Math.min(fullYears, 5)
  const after5    = Math.max(0, fullYears - 5)

  const first5Pay = first5 * EOSB_FIRST_5_DAYS * dailyRate
  const after5Pay = after5 * EOSB_AFTER_5_DAYS  * dailyRate

  return { years: fullYears, dailyRate, first5Pay, after5Pay, total: first5Pay + after5Pay }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function qar(n: number) {
  return `QAR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function qarInt(n: number) {
  return `QAR ${Math.round(n).toLocaleString('en-US')}`
}

// ─── Shared UI components ─────────────────────────────────────────────────────

function InputField({ label, value, onChange, prefix = 'QAR', hint, suffix }: {
  label: string; value: string; onChange: (v: string) => void
  prefix?: string; hint?: string; suffix?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', background: 'var(--color-background-primary)' }}>
        {prefix && <span style={{ padding: '0 10px', fontSize: 12, fontWeight: 500, color: 'var(--color-text-tertiary)', borderRight: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>{prefix}</span>}
        <input
          type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
          placeholder="0"
          style={{ flex: 1, border: 'none', outline: 'none', padding: '9px 12px', fontSize: 14, background: 'transparent', color: 'var(--color-text-primary)' }}
        />
        {suffix && <span style={{ padding: '0 10px', fontSize: 12, color: 'var(--color-text-tertiary)', borderLeft: '0.5px solid var(--color-border-tertiary)' }}>{suffix}</span>}
      </div>
      {hint && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{hint}</span>}
    </div>
  )
}

function Toggle({ label, checked, onChange, hint }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>{label}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        {(['Yes', 'No'] as const).map(opt => {
          const active = opt === 'Yes' ? checked : !checked
          return (
            <button key={opt} onClick={() => onChange(opt === 'Yes')} style={{
              padding: '7px 16px', fontSize: 13, border: '0.5px solid var(--color-border-secondary)',
              borderRadius: 'var(--border-radius-md)', cursor: 'pointer',
              background: active ? 'var(--color-background-primary)' : 'transparent',
              color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontWeight: active ? 500 : 400,
              boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}>{opt}</button>
          )
        })}
      </div>
      {hint && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{hint}</span>}
    </div>
  )
}

function StatCard({ label, value, sub, accent, warn, danger }: {
  label: string; value: string; sub?: string; accent?: boolean; warn?: boolean; danger?: boolean
}) {
  const bg = accent ? 'var(--color-background-success)' : warn ? 'var(--color-background-warning)' : danger ? 'var(--color-background-danger)' : 'var(--color-background-secondary)'
  const tc = accent ? 'var(--color-text-success)' : warn ? 'var(--color-text-warning)' : danger ? 'var(--color-text-danger)' : 'var(--color-text-primary)'
  const lc = accent ? 'var(--color-text-success)' : warn ? 'var(--color-text-warning)' : danger ? 'var(--color-text-danger)' : 'var(--color-text-secondary)'
  return (
    <div style={{ background: bg, borderRadius: 'var(--border-radius-md)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: lc }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 500, color: tc }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: lc }}>{sub}</span>}
    </div>
  )
}

function Row({ label, value, sub, color, bold, indent }: {
  label: string; value: string; sub?: string; color?: string; bold?: boolean; indent?: boolean
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', paddingLeft: indent ? 12 : 0 }}>
        {label}{sub && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 4 }}>{sub}</span>}
      </span>
      <span style={{ fontSize: 13, fontWeight: bold ? 500 : 400, color: color ?? 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

function Alert({ text, variant }: { text: string; variant: 'info' | 'warning' | 'danger' | 'success' }) {
  return (
    <div style={{
      background: `var(--color-background-${variant})`,
      border: `0.5px solid var(--color-border-${variant})`,
      borderRadius: 'var(--border-radius-md)',
      padding: '10px 14px', fontSize: 13,
      color: `var(--color-text-${variant})`,
    }}>{text}</div>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-tertiary)', margin: '14px 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </p>
  )
}

// ─── Shared inputs panel ──────────────────────────────────────────────────────

function SharedInputsPanel({ shared, setShared }: { shared: SharedInputs; setShared: (s: SharedInputs) => void }) {
  const set = (key: keyof SharedInputs) => (val: any) => setShared({ ...shared, [key]: val })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <InputField label="Basic salary (monthly)" value={shared.basicSalary} onChange={set('basicSalary')} hint="Required — foundation of all calculations" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Employment category</label>
          <select
            value={shared.category}
            onChange={e => set('category')(e.target.value)}
            style={{ border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', padding: '9px 12px', fontSize: 14, background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none' }}
          >
            <option value="non-managerial">Non-managerial (OT eligible)</option>
            <option value="managerial">Managerial / Supervisory</option>
          </select>
        </div>

        <InputField label="Working days per week" value={shared.workingDaysPerWeek} onChange={set('workingDaysPerWeek')} prefix="" suffix="days" hint="Default 6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Toggle label="Accommodation provided?" checked={shared.hasAccommodation} onChange={set('hasAccommodation')} hint="Affects minimum wage threshold" />
        <Toggle label="Food provided?" checked={shared.hasFood} onChange={set('hasFood')} hint="Affects minimum wage threshold" />
        <Toggle label="Ramadan mode" checked={shared.ramadanMode} onChange={set('ramadanMode')} hint="Reduces standard hours to 6/day" />
      </div>
    </div>
  )
}

// ─── TAB 1: Qatar Salary Calculator ──────────────────────────────────────────

function SalaryTab({ shared }: { shared: SharedInputs }) {
  const [allowances, setAllowances] = useState<AllowanceInputs>({ housing: '', food: '', transport: '', other: '', deductions: '' })
  const [result, setResult] = useState<SalaryResult | null>(null)

  const setA = (key: keyof AllowanceInputs) => (val: string) => setAllowances(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    const basic = parseFloat(shared.basicSalary) || 0
    if (basic > 0) setResult(calcSalary(shared, allowances))
    else setResult(null)
  }, [shared, allowances])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <InputField label="Housing allowance" value={allowances.housing} onChange={setA('housing')} />
        <InputField label="Food allowance" value={allowances.food} onChange={setA('food')} />
        <InputField label="Transport allowance" value={allowances.transport} onChange={setA('transport')} />
        <InputField label="Other allowances" value={allowances.other} onChange={setA('other')} />
        <InputField label="Deductions (loans, advances)" value={allowances.deductions} onChange={setA('deductions')} hint="Optional" />
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Minimum wage alert */}
          {!result.minWagePassed ? (
            <Alert variant="danger" text={`Below minimum wage threshold. Required: ${qar(result.minWageRequired)}. Gap: ${qar(result.minWageGap)}. (Base QAR 1,000${!shared.hasAccommodation ? ' + QAR 500 accommodation' : ''}${!shared.hasFood ? ' + QAR 300 food' : ''})`} />
          ) : (
            <Alert variant="success" text={`Minimum wage compliant — basic salary meets the QAR ${result.minWageRequired.toLocaleString()} threshold.`} />
          )}

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <StatCard label="Basic salary" value={qar(result.basicSalary)} />
            <StatCard label="Gross monthly" value={qar(result.grossMonthly)} />
            <StatCard label="Net monthly" value={qar(result.netMonthly)} accent />
            <StatCard label="Annual gross" value={qarInt(result.annualGross)} sub={`Net: ${qarInt(result.annualNet)}`} />
          </div>

          {/* Breakdown */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
            <SectionLabel>Monthly earnings</SectionLabel>
            <Row label="Basic salary" value={qar(result.basicSalary)} bold />
            {result.housing > 0 && <Row label="Housing allowance" value={qar(result.housing)} indent />}
            {result.food > 0 && <Row label="Food allowance" value={qar(result.food)} indent />}
            {result.transport > 0 && <Row label="Transport allowance" value={qar(result.transport)} indent />}
            {result.other > 0 && <Row label="Other allowances" value={qar(result.other)} indent />}
            <Row label="Gross salary" value={qar(result.grossMonthly)} bold />
            {result.deductions > 0 && <Row label="Deductions" value={`− ${qar(result.deductions)}`} color="var(--color-text-danger)" />}

            <SectionLabel>Rates</SectionLabel>
            <Row label="Hourly rate" sub="(basic ÷ 26 ÷ 8)" value={qar(result.hourlyRate)} />
            <Row label="Daily rate" sub="(basic ÷ 30)" value={qar(result.dailyRate)} />

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Net monthly take-home</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-success)' }}>{qar(result.netMonthly)}</span>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
            Qatar has no personal income tax or mandatory employee social insurance deductions for most private-sector workers. Net pay typically equals gross pay unless the employer applies contractual deductions.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── TAB 2: Qatar Overtime Calculator ────────────────────────────────────────

function OvertimeTab({ shared }: { shared: SharedInputs }) {
  const [ot, setOt] = useState<OvertimeInputs>({ regularOtHours: '', nightOtHours: '', holidayOtHours: '' })
  const [result, setResult] = useState<OvertimeResult | null>(null)

  const setO = (key: keyof OvertimeInputs) => (val: string) => setOt(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    const basic = parseFloat(shared.basicSalary) || 0
    if (basic > 0) setResult(calcOvertime(shared, ot))
    else setResult(null)
  }, [shared, ot])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Alert variant="info" text={`Qatar Labour Law: Overtime on working days = ×1.25. Night work (9pm–6am) = ×1.50. Rest day / public holiday = ×1.50. Max ${shared.ramadanMode ? RAMADAN_DAILY_HOURS : STANDARD_DAILY_HOURS} standard hours/day${shared.ramadanMode ? ' (Ramadan)' : ''}, absolute max ${MAX_DAILY_HOURS} hrs/day.`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <InputField label="Regular OT hours" value={ot.regularOtHours} onChange={setO('regularOtHours')} prefix="hrs" hint="Extra hours on working days (×1.25)" />
        <InputField label="Night OT hours" value={ot.nightOtHours} onChange={setO('nightOtHours')} prefix="hrs" hint="9pm–6am window (×1.50)" />
        <InputField label="Rest day / holiday hours" value={ot.holidayOtHours} onChange={setO('holidayOtHours')} prefix="hrs" hint="Friday / public holiday (×1.50)" />
      </div>

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {result.managerialWarning && (
            <Alert variant="warning" text="Managerial / supervisory roles are often exempt from Qatar's mandatory overtime provisions. Check your contract and consult HR." />
          )}
          {result.totalHoursWarning && (
            <Alert variant="warning" text={`Total hours may approach the daily maximum of ${MAX_DAILY_HOURS} hours. Review the schedule with your employer.`} />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <StatCard label="Hourly rate" value={qar(result.hourlyRate)} sub="basic ÷ 26 ÷ 8" />
            <StatCard label="Regular OT pay" value={qar(result.regularOtPay)} sub="×1.25" />
            <StatCard label="Night OT pay" value={qar(result.nightOtPay)} sub="×1.50" />
            <StatCard label="Holiday OT pay" value={qar(result.holidayOtPay)} sub="×1.50" />
          </div>

          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
            <SectionLabel>Overtime breakdown</SectionLabel>
            <Row label="Hourly rate" sub="(basic ÷ 26 ÷ 8)" value={qar(result.hourlyRate)} />
            {(parseFloat(ot.regularOtHours) || 0) > 0 &&
              <Row label={`Regular OT — ${ot.regularOtHours} hrs × hourly × 1.25`} value={qar(result.regularOtPay)} color="var(--color-text-success)" />}
            {(parseFloat(ot.nightOtHours) || 0) > 0 &&
              <Row label={`Night OT — ${ot.nightOtHours} hrs × hourly × 1.50`} value={qar(result.nightOtPay)} color="var(--color-text-success)" />}
            {(parseFloat(ot.holidayOtHours) || 0) > 0 &&
              <Row label={`Holiday OT — ${ot.holidayOtHours} hrs × hourly × 1.50`} value={qar(result.holidayOtPay)} color="var(--color-text-success)" />}
            <Row label="Total OT earnings" value={qar(result.totalOtPay)} bold color="var(--color-text-success)" />
            <Row label="Basic salary" value={qar(parseFloat(shared.basicSalary) || 0)} />

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Grand total this month</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-success)' }}>{qar(result.grandTotal)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TAB 3: Qatar Labour Salary Calculator (full payslip) ────────────────────

function LabourTab({ shared }: { shared: SharedInputs }) {
  const [allowances, setAllowances] = useState<AllowanceInputs>({ housing: '', food: '', transport: '', other: '', deductions: '' })
  const [ot, setOt] = useState<OvertimeInputs>({ regularOtHours: '', nightOtHours: '', holidayOtHours: '' })
  const [eosb, setEosb] = useState<EosbInputs>({ yearsOfService: '' })
  const [salResult, setSalResult] = useState<SalaryResult | null>(null)
  const [otResult, setOtResult]   = useState<OvertimeResult | null>(null)
  const [eosbResult, setEosbResult] = useState<EosbResult | null>(null)

  const setA = (key: keyof AllowanceInputs) => (val: string) => setAllowances(prev => ({ ...prev, [key]: val }))
  const setO = (key: keyof OvertimeInputs)  => (val: string) => setOt(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    const basic = parseFloat(shared.basicSalary) || 0
    if (basic <= 0) { setSalResult(null); setOtResult(null); return }
    setSalResult(calcSalary(shared, allowances))
    setOtResult(calcOvertime(shared, ot))
    const years = parseFloat(eosb.yearsOfService) || 0
    if (years > 0) setEosbResult(calcEosb(basic, years))
    else setEosbResult(null)
  }, [shared, allowances, ot, eosb])

  const totalMonthly = (salResult?.grossMonthly ?? 0) + (otResult?.totalOtPay ?? 0) - (salResult?.deductions ?? 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Allowances */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>Salary allowances</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <InputField label="Housing" value={allowances.housing} onChange={setA('housing')} />
          <InputField label="Food" value={allowances.food} onChange={setA('food')} />
          <InputField label="Transport" value={allowances.transport} onChange={setA('transport')} />
          <InputField label="Other" value={allowances.other} onChange={setA('other')} />
          <InputField label="Deductions" value={allowances.deductions} onChange={setA('deductions')} />
        </div>
      </div>

      {/* Overtime */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>Overtime this month</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <InputField label="Regular OT hrs" value={ot.regularOtHours} onChange={setO('regularOtHours')} prefix="hrs" />
          <InputField label="Night OT hrs" value={ot.nightOtHours} onChange={setO('nightOtHours')} prefix="hrs" />
          <InputField label="Holiday OT hrs" value={ot.holidayOtHours} onChange={setO('holidayOtHours')} prefix="hrs" />
        </div>
      </div>

      {/* EOSB */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>End-of-service gratuity estimate</p>
        <InputField label="Years of service" value={eosb.yearsOfService} onChange={v => setEosb({ yearsOfService: v })} prefix="yrs" hint="21 days/year for first 5 years, 30 days/year after" />
      </div>

      {/* Full payslip results */}
      {salResult && otResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {!salResult.minWagePassed ? (
            <Alert variant="danger" text={`Below minimum wage. Required: ${qar(salResult.minWageRequired)}. Gap: ${qar(salResult.minWageGap)}.`} />
          ) : (
            <Alert variant="success" text="Minimum wage compliant." />
          )}
          {otResult.managerialWarning && (
            <Alert variant="warning" text="Managerial / supervisory role — overtime rules may not apply. Verify contract terms." />
          )}

          {/* Hero cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <StatCard label="Basic salary" value={qar(salResult.basicSalary)} />
            <StatCard label="Gross salary" value={qar(salResult.grossMonthly)} />
            <StatCard label="Overtime pay" value={qar(otResult.totalOtPay)} />
            <StatCard label="Total monthly" value={qar(totalMonthly)} accent />
          </div>

          {/* Full payslip table */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px' }}>Monthly payslip summary</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '0 0 12px' }}>Qatar Labour Law calculation basis</p>

            <SectionLabel>Base compensation</SectionLabel>
            <Row label="Basic salary" value={qar(salResult.basicSalary)} bold />
            {salResult.housing > 0 && <Row label="Housing allowance" value={qar(salResult.housing)} indent />}
            {salResult.food > 0 && <Row label="Food allowance" value={qar(salResult.food)} indent />}
            {salResult.transport > 0 && <Row label="Transport allowance" value={qar(salResult.transport)} indent />}
            {salResult.other > 0 && <Row label="Other allowances" value={qar(salResult.other)} indent />}
            <Row label="Gross salary" value={qar(salResult.grossMonthly)} bold />

            <SectionLabel>Overtime</SectionLabel>
            <Row label="Hourly rate" sub="(basic ÷ 26 ÷ 8)" value={qar(otResult.hourlyRate)} />
            {(parseFloat(ot.regularOtHours)||0) > 0 && <Row label={`Regular OT (×1.25)`} value={qar(otResult.regularOtPay)} color="var(--color-text-success)" />}
            {(parseFloat(ot.nightOtHours)||0) > 0 && <Row label={`Night OT (×1.50)`} value={qar(otResult.nightOtPay)} color="var(--color-text-success)" />}
            {(parseFloat(ot.holidayOtHours)||0) > 0 && <Row label={`Holiday OT (×1.50)`} value={qar(otResult.holidayOtPay)} color="var(--color-text-success)" />}
            <Row label="Total overtime" value={qar(otResult.totalOtPay)} bold color="var(--color-text-success)" />

            {salResult.deductions > 0 && (
              <>
                <SectionLabel>Deductions</SectionLabel>
                <Row label="Deductions" value={`− ${qar(salResult.deductions)}`} color="var(--color-text-danger)" />
              </>
            )}

            <SectionLabel>Rates</SectionLabel>
            <Row label="Hourly rate" value={qar(otResult.hourlyRate)} />
            <Row label="Daily rate" sub="(basic ÷ 30)" value={qar(salResult.dailyRate)} />
            <Row label="Annual gross" value={qarInt(salResult.annualGross)} />

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: 4, borderTop: '0.5px solid var(--color-border-secondary)' }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>Total monthly compensation</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-success)' }}>{qar(totalMonthly)}</span>
            </div>
          </div>

          {/* EOSB */}
          {eosbResult && (
            <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>End-of-service gratuity estimate ({eosbResult.years} years)</p>
              <Row label="Daily rate" sub="(basic ÷ 30)" value={qar(eosbResult.dailyRate)} />
              {eosbResult.years <= 5 ? (
                <Row label={`${Math.min(eosbResult.years, 5)} years × 21 days × daily rate`} value={qar(eosbResult.first5Pay)} />
              ) : (
                <>
                  <Row label="First 5 years (× 21 days/year)" value={qar(eosbResult.first5Pay)} />
                  <Row label={`Years 6–${eosbResult.years} (× 30 days/year)`} value={qar(eosbResult.after5Pay)} />
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Estimated EOSB</span>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-success)' }}>{qar(eosbResult.total)}</span>
              </div>
            </div>
          )}

          {/* Compliance notes */}
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '14px 16px', fontSize: 13 }}>
            <p style={{ fontWeight: 500, margin: '0 0 8px' }}>Qatar Labour Law compliance notes</p>
            {[
              `Standard hours: ${shared.ramadanMode ? RAMADAN_DAILY_HOURS : STANDARD_DAILY_HOURS}/day, max ${MAX_DAILY_HOURS}/day absolute.`,
              'Minimum wage: QAR 1,000 basic + QAR 500 accommodation + QAR 300 food (if not provided in kind).',
              'Overtime: ×1.25 regular days, ×1.50 night / rest days / public holidays.',
              'EOSB: 21 days basic salary/year (first 5), 30 days/year thereafter. Requires minimum 1 year service.',
              'Qatar has no personal income tax on salaries.',
            ].map((note, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>—</span>
                <span>{note}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
            Estimates based on publicly available Qatar Labour Law information (Law No. 14/2004 and amendments). Not legal advice. Consult the Ministry of Labour or a licensed adviser for binding calculations.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QatarSalaryCalculator({ locale: _locale }: Props) {
  const [tab, setTab] = useState<Tab>('salary')
  const [shared, setShared] = useState<SharedInputs>({
    basicSalary: '',
    contractType: 'monthly',
    category: 'non-managerial',
    hasAccommodation: false,
    hasFood: false,
    workingDaysPerWeek: '6',
    ramadanMode: false,
  })

  const tabs: { id: Tab; label: string }[] = [
    { id: 'salary',   label: 'Salary calculator' },
    { id: 'overtime', label: 'Overtime calculator' },
    { id: 'labour',   label: 'Full labour calculator' },
  ]

  return (
    <div style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Shared inputs — always visible */}
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px 20px' }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', margin: '0 0 14px' }}>Your details</p>
        <SharedInputsPanel shared={shared} setShared={setShared} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 16px', fontSize: 13, fontWeight: tab === t.id ? 500 : 400,
            border: 'none',
            borderBottom: tab === t.id ? '2px solid var(--color-text-primary)' : '2px solid transparent',
            background: 'transparent',
            color: tab === t.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'salary'   && <SalaryTab shared={shared} />}
        {tab === 'overtime' && <OvertimeTab shared={shared} />}
        {tab === 'labour'   && <LabourTab shared={shared} />}
      </div>
    </div>
  )
}
