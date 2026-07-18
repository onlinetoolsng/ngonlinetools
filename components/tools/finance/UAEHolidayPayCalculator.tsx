'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = { locale?: string }

// ─── UAE Public Holidays 2026 (Cabinet-announced) ─────────────────────────────
const UAE_HOLIDAYS_2026 = [
  { nameEn: "New Year's Day",         nameAr: 'رأس السنة الميلادية',      date: '2026-01-01', days: 1 },
  { nameEn: 'Eid Al Fitr',            nameAr: 'عيد الفطر',               date: '2026-03-20', days: 3 },
  { nameEn: 'Arafat Day (Eid Al Adha Eve)', nameAr: 'يوم عرفة',          date: '2026-05-27', days: 1 },
  { nameEn: 'Eid Al Adha',            nameAr: 'عيد الأضحى',              date: '2026-05-28', days: 3 },
  { nameEn: 'Islamic New Year',       nameAr: 'رأس السنة الهجرية',       date: '2026-06-16', days: 1 },
  { nameEn: "Prophet's Birthday",     nameAr: 'المولد النبوي الشريف',     date: '2026-08-26', days: 1 },
  { nameEn: 'Commemoration Day',      nameAr: 'يوم الشهيد',               date: '2026-11-30', days: 1 },
  { nameEn: 'National Day',           nameAr: 'اليوم الوطني',             date: '2026-12-02', days: 2 },
]

const DAYS_IN_MONTH = 30
const STANDARD_HOURS_DAY = 8

type Tab = 'holiday' | 'annual'
type ServiceBand = 'over1y' | '6to12m' | 'under6m'

interface HolidayInputs {
  basicSalary: string
  workedFull: boolean
  hoursWorked: string
  selectedHoliday: string
  wantSubDay: boolean
}

interface AnnualInputs {
  basicSalary: string
  serviceBand: ServiceBand
  completedMonths: string
  usedDays: string
  leaveStartDate: string
  leaveDays: string
}

interface HolidayResult {
  dailyRate: number
  normalPay: number
  premium: number
  totalPay: number
  substituteDay: boolean
  holidayName: string
  isPartial: boolean
  hoursWorked: number
}

interface AnnualResult {
  entitlementDays: number
  unusedDays: number
  dailyRate: number
  totalLeavePay: number
  holidaysInLeave: number
  annualPay: number
}

// ─── Calculation Engine ───────────────────────────────────────────────────────

function calcDailyRate(basic: number) {
  return basic / DAYS_IN_MONTH
}

function calcHolidayPay(inputs: HolidayInputs): HolidayResult | null {
  const basic = parseFloat(inputs.basicSalary)
  if (!basic || basic <= 0 || !inputs.selectedHoliday) return null

  const holiday = UAE_HOLIDAYS_2026.find(h => h.date === inputs.selectedHoliday)
  if (!holiday) return null

  const dailyRate = calcDailyRate(basic)
  const hours = parseFloat(inputs.hoursWorked) || STANDARD_HOURS_DAY
  const fraction = inputs.workedFull ? 1 : Math.min(hours, STANDARD_HOURS_DAY) / STANDARD_HOURS_DAY

  // Art. 28: normal daily wage + at least 50% premium = 150% of daily wage
  const normalPay = dailyRate * fraction
  const premium = normalPay * 0.5      // 50% premium on top
  const totalPay = normalPay + premium // 150% total

  return {
    dailyRate,
    normalPay,
    premium,
    totalPay,
    substituteDay: inputs.wantSubDay,
    holidayName: holiday.nameEn,
    isPartial: !inputs.workedFull,
    hoursWorked: hours,
  }
}

function calcAnnualLeave(inputs: AnnualInputs): AnnualResult | null {
  const basic = parseFloat(inputs.basicSalary)
  if (!basic || basic <= 0) return null

  const months = parseInt(inputs.completedMonths) || 0
  let entitlementDays = 0

  if (inputs.serviceBand === 'over1y')   entitlementDays = 30
  else if (inputs.serviceBand === '6to12m') entitlementDays = Math.min(months, 11) * 2
  else entitlementDays = 0

  const usedDays = parseFloat(inputs.usedDays) || 0
  const unusedDays = Math.max(0, entitlementDays - usedDays)
  const dailyRate = calcDailyRate(basic)
  const totalLeavePay = unusedDays * dailyRate
  const annualPay = entitlementDays * dailyRate

  // Holidays within leave period
  let holidaysInLeave = 0
  if (inputs.leaveStartDate && inputs.leaveDays) {
    const start = new Date(inputs.leaveStartDate)
    const leaveDayCount = parseInt(inputs.leaveDays) || 0
    const end = new Date(start.getTime() + leaveDayCount * 86400000)
    holidaysInLeave = UAE_HOLIDAYS_2026.filter(h => {
      const d = new Date(h.date)
      return d >= start && d < end
    }).length
  }

  return { entitlementDays, unusedDays, dailyRate, totalLeavePay, holidaysInLeave, annualPay }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tip({ children }: { children: string }) {
  return (
    <span className="group relative cursor-help ml-1">
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#e0e8f5] text-[#2a4fa0] text-[9px] font-black select-none">?</span>
      <span className="absolute left-5 top-0 z-20 hidden group-hover:block w-60 bg-[#0a1628] text-[#c5d5f0] text-[11px] rounded-xl p-3 shadow-2xl leading-relaxed border border-[#1e3060]">
        {children}
      </span>
    </span>
  )
}

function Field({ label, tip, children }: { label: string; tip?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-[#5a6a90]">{label}</span>
        {tip && <Tip>{tip}</Tip>}
      </div>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, prefix, placeholder = '0.00', type = 'number' }: {
  value: string; onChange: (v: string) => void; prefix?: string; placeholder?: string; type?: string
}) {
  return (
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8095c0] select-none">{prefix}</span>}
      <input
        type={type}
        min={type === 'number' ? '0' : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${prefix ? 'pl-14' : 'pl-3'} pr-3 py-2.5 rounded-lg border border-[#c5d0e8] bg-[#f5f7fc] text-sm font-mono text-[#0a1628] placeholder-[#a0adc8] focus:outline-none focus:ring-2 focus:ring-[#2a5fd0] transition`}
      />
    </div>
  )
}

function Row({ label, value, sub, negative, highlight, muted }: {
  label: string; value: string; sub?: string; negative?: boolean; highlight?: boolean; muted?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 ${highlight ? 'border-t-2 border-[#c5d0e8] mt-2 pt-3' : ''}`}>
      <div>
        <span className={`text-sm ${muted ? 'text-[#8095c0] text-xs' : 'text-[#1a2a50]'}`}>{label}</span>
        {sub && <span className="block text-[10px] text-[#90a5c5] mt-0.5">{sub}</span>}
      </div>
      <span className={`font-mono tabular-nums text-sm font-bold ${highlight ? 'text-[#1a4fd0] text-base' : negative ? 'text-rose-600' : muted ? 'text-[#8095c0]' : 'text-[#0a1628]'}`}>
        {value}
      </span>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div onClick={onChange}
        className={`w-10 h-5 rounded-full relative transition-all ${checked ? 'bg-[#2a5fd0]' : 'bg-[#c5d0e8]'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
      </div>
      <span className="text-xs text-[#2a3a60] font-semibold">{label}</span>
    </label>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UAEHolidayPayCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'
  const [tab, setTab] = useState<Tab>('holiday')

  // Holiday Pay state
  const [hInputs, setHInputs] = useState<HolidayInputs>({
    basicSalary: '',
    workedFull: true,
    hoursWorked: '8',
    selectedHoliday: '',
    wantSubDay: false,
  })
  const [hResult, setHResult] = useState<HolidayResult | null>(null)
  const [hCalced, setHCalced] = useState(false)

  // Annual Leave state
  const [aInputs, setAInputs] = useState<AnnualInputs>({
    basicSalary: '',
    serviceBand: 'over1y',
    completedMonths: '12',
    usedDays: '',
    leaveStartDate: '',
    leaveDays: '',
  })
  const [aResult, setAResult] = useState<AnnualResult | null>(null)
  const [aCalced, setACalced] = useState(false)

  const setH = (k: keyof HolidayInputs) => (v: string | boolean) =>
    setHInputs(prev => ({ ...prev, [k]: v }))

  const setA = (k: keyof AnnualInputs) => (v: string) =>
    setAInputs(prev => ({ ...prev, [k]: v }))

  const runH = useCallback(() => setHResult(calcHolidayPay(hInputs)), [hInputs])
  const runA = useCallback(() => setAResult(calcAnnualLeave(aInputs)), [aInputs])

  useEffect(() => { if (hCalced) runH() }, [hInputs, hCalced, runH])
  useEffect(() => { if (aCalced) runA() }, [aInputs, aCalced, runA])

  // ── Presets ──
  function applyHPreset(type: 'eid' | 'national' | 'partial') {
    const base: HolidayInputs = {
      basicSalary: '9000',
      workedFull: true,
      hoursWorked: '8',
      selectedHoliday: '2026-05-28',
      wantSubDay: false,
    }
    if (type === 'national') base.selectedHoliday = '2026-12-02'
    if (type === 'partial') { base.workedFull = false; base.hoursWorked = '4'; base.selectedHoliday = '2026-05-28' }
    setHInputs(base)
    setHCalced(true)
    setTimeout(() => setHResult(calcHolidayPay(base)), 0)
  }

  function applyAPreset(type: 'full' | 'partial' | 'termination') {
    const base: AnnualInputs = {
      basicSalary: '10000',
      serviceBand: 'over1y',
      completedMonths: '24',
      usedDays: type === 'termination' ? '10' : '5',
      leaveStartDate: type === 'full' ? '2026-06-01' : '',
      leaveDays: type === 'full' ? '14' : '',
    }
    if (type === 'partial') base.serviceBand = '6to12m'
    setAInputs(base)
    setACalced(true)
    setTimeout(() => setAResult(calcAnnualLeave(base)), 0)
  }

  function resetH() { setHInputs({ basicSalary: '', workedFull: true, hoursWorked: '8', selectedHoliday: '', wantSubDay: false }); setHResult(null); setHCalced(false) }
  function resetA() { setAInputs({ basicSalary: '', serviceBand: 'over1y', completedMonths: '12', usedDays: '', leaveStartDate: '', leaveDays: '' }); setAResult(null); setACalced(false) }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="font-sans text-[#0a1628] max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2a5fd0] to-[#1a3fa0] flex items-center justify-center">
            <span className="text-white text-[10px] font-black tracking-tight">UAE</span>
          </div>
          <h2 className="text-xl font-bold text-[#0a1628] tracking-tight">UAE Holiday Pay Calculator</h2>
        </div>
        <p className="text-sm text-[#3a5070] leading-relaxed">
          Calculate public holiday work compensation and annual leave pay under <strong>Federal Decree-Law No. 33 of 2021</strong> — Articles 28 & 29.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 bg-[#edf1fc] border border-[#c0d0f0] rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2a5fd0]">Updated 2026</span>
          <span className="inline-flex items-center gap-1 bg-[#edf1fc] border border-[#c0d0f0] rounded-lg px-2.5 py-1 text-[10px] text-[#4a6090]">MOHRE Compliant</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#edf1fc] rounded-xl p-1 mb-6">
        {([
          { key: 'holiday', icon: '🎌', label: 'Public Holiday Work Pay' },
          { key: 'annual',  icon: '🏖️', label: 'Annual Leave Pay' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${tab === t.key ? 'bg-white text-[#2a5fd0] shadow-sm' : 'text-[#5a6a90] hover:text-[#2a5fd0]'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Holiday Work Pay ── */}
      {tab === 'holiday' && (
        <>
          {/* Presets */}
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8095c0] mb-2 font-bold">Quick Examples</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { k: 'eid',      label: '🌙 Worked Eid Al Adha' },
                { k: 'national', label: '🇦🇪 Worked National Day' },
                { k: 'partial',  label: '⏱ Half-day on Eid' },
              ].map(p => (
                <button key={p.k} onClick={() => applyHPreset(p.k as any)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#c5d0e8] bg-white text-[#1a2a50] hover:bg-[#edf1fc] hover:border-[#2a5fd0] transition-all font-semibold">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="bg-white rounded-2xl border border-[#c5d0e8] p-5 mb-4 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6a7aaa] font-bold">Salary & Holiday Details</p>

            <Field label="Basic Monthly Salary" tip="Art. 28 uses basic salary for holiday pay. Excludes allowances unless contract states otherwise.">
              <TextInput value={hInputs.basicSalary} onChange={v => setH('basicSalary')(v)} prefix="AED" />
            </Field>

            <Field label="Public Holiday Worked" tip="Select the official UAE public holiday you worked. Dates are indicative — Cabinet announces exact dates annually.">
              <select value={hInputs.selectedHoliday} onChange={e => setH('selectedHoliday')(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#c5d0e8] bg-[#f5f7fc] text-sm text-[#0a1628] focus:outline-none focus:ring-2 focus:ring-[#2a5fd0] transition">
                <option value="">Select a holiday…</option>
                {UAE_HOLIDAYS_2026.map(h => (
                  <option key={h.date} value={h.date}>{h.nameEn} — {h.date}</option>
                ))}
              </select>
            </Field>

            <div className="space-y-3">
              <Toggle checked={hInputs.workedFull} onChange={() => setH('workedFull')(!hInputs.workedFull)} label="Worked full day (8 hours)" />
              {!hInputs.workedFull && (
                <Field label="Hours Worked">
                  <TextInput value={hInputs.hoursWorked} onChange={v => setH('hoursWorked')(v)} placeholder="e.g. 4" />
                </Field>
              )}
              <Toggle checked={hInputs.wantSubDay} onChange={() => setH('wantSubDay')(!hInputs.wantSubDay)} label="I prefer a substitute rest day instead" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-6">
            <button onClick={() => { runH(); setHCalced(true) }}
              className="flex-1 bg-[#2a5fd0] hover:bg-[#1a4fc0] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-sm tracking-wide shadow-lg shadow-[#2a5fd030] transition-all">
              Calculate Holiday Pay
            </button>
            <button onClick={resetH}
              className="px-5 py-3.5 border-2 border-[#c5d0e8] text-[#5a6a90] hover:bg-[#f5f7fc] font-semibold rounded-xl text-sm transition-all">
              Reset
            </button>
          </div>

          {/* Results */}
          {hResult && (
            <div className="space-y-4">
              {hResult.substituteDay ? (
                <div className="bg-[#2a5fd0] rounded-2xl p-5 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60 mb-1">Substitute Rest Day Requested</div>
                  <div className="text-2xl font-black">1 Day Off in Lieu</div>
                  <div className="text-xs opacity-60 mt-1">+ Normal daily wage for the holiday worked — Art. 28</div>
                  <div className="mt-3 text-lg font-bold font-mono">{fmt(hResult.normalPay)} <span className="text-sm font-normal opacity-70">daily pay for day worked</span></div>
                </div>
              ) : (
                <div className="bg-[#2a5fd0] rounded-2xl p-5 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60 mb-1">
                    Total Holiday Pay — {hResult.holidayName} {hResult.isPartial ? `(${hResult.hoursWorked}h)` : '(Full Day)'}
                  </div>
                  <div className="text-4xl font-black font-mono">{fmt(hResult.totalPay)}</div>
                  <div className="text-xs opacity-60 mt-1">150% of daily basic wage — Art. 28, Federal Decree-Law No. 33/2021</div>
                </div>
              )}

{/* Breakdown */}
{!hResult.substituteDay && (
  <div className="bg-white rounded-2xl border border-[#c5d0e8] p-5">
    <p className="text-[10px] uppercase tracking-[0.14em] text-[#6a7aaa] font-bold mb-3">Pay Breakdown</p>
    <Row label="Daily Basic Rate (Salary ÷ 30)" value={fmt(hResult.dailyRate)} sub="Art. 28 — 30-day standard month" />
    {hResult.isPartial && (
      <Row label={`Partial Day Factor (${hResult.hoursWorked}h ÷ 8h)`} value={`× ${(hResult.hoursWorked / 8).toFixed(2)}`} muted />
    )}
    <Row label="Normal Day Pay (100%)" value={fmt(hResult.normalPay)} />
    <Row label="Holiday Premium (50%)" value={`+ ${fmt(hResult.premium)}`} />
    <Row label="Total Holiday Compensation (150%)" value={fmt(hResult.totalPay)} highlight />
  </div>
)}

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl border-2 p-4 text-center ${!hResult.substituteDay ? 'border-[#2a5fd0] bg-[#edf1fc]' : 'border-[#c5d0e8] bg-white'}`}>
                  <div className="text-xs font-bold text-[#2a3a60] mb-2">💰 Cash Pay Option</div>
                  <div className="text-lg font-black font-mono text-[#2a5fd0]">{fmt(hResult.totalPay)}</div>
                  <div className="text-[10px] text-[#6a7aaa] mt-1">150% of daily wage</div>
                </div>
                <div className={`rounded-xl border-2 p-4 text-center ${hResult.substituteDay ? 'border-[#2a5fd0] bg-[#edf1fc]' : 'border-[#c5d0e8] bg-white'}`}>
                  <div className="text-xs font-bold text-[#2a3a60] mb-2">📅 Substitute Day Option</div>
                  <div className="text-lg font-black text-[#2a5fd0]">1 Day Off</div>
                  <div className="text-[10px] text-[#6a7aaa] mt-1">+ {fmt(hResult.normalPay)} normal pay</div>
                </div>
              </div>

              {/* Law note */}
              <div className="bg-[#edf1fc] border border-[#b5c5e8] rounded-xl p-4">
                <p className="text-xs text-[#1a2a50] leading-relaxed">
                  <strong>Art. 28, Federal Decree-Law No. 33/2021:</strong> If required to work on an official public holiday, the employer must either grant a substitute rest day or pay the normal daily wage <em>plus</em> a premium of at least 50% of basic wage — totalling 150% minimum.
                </p>
              </div>

              {/* Holiday list */}
              <div className="bg-white rounded-2xl border border-[#c5d0e8] p-5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#6a7aaa] font-bold mb-3">UAE Public Holidays 2026</p>
                <div className="space-y-2">
                  {UAE_HOLIDAYS_2026.map(h => (
                    <div key={h.date} className={`flex justify-between items-center py-1.5 px-2 rounded-lg text-sm ${h.date === hInputs.selectedHoliday ? 'bg-[#edf1fc]' : ''}`}>
                      <span className="text-[#1a2a50] font-medium">{h.nameEn}</span>
                      <span className="text-[#8095c0] text-xs font-mono">{h.date} · {h.days}d</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-[#8095c0] mt-2 italic">Exact dates confirmed annually by UAE Cabinet. Dates above are indicative for 2026.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: Annual Leave Pay ── */}
      {tab === 'annual' && (
        <>
          {/* Presets */}
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8095c0] mb-2 font-bold">Quick Scenarios</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { k: 'full',        label: '📅 Full Year + Holiday Check' },
                { k: 'partial',     label: '⏳ Partial Year (6–12m)' },
                { k: 'termination', label: '📤 Termination Payout' },
              ].map(p => (
                <button key={p.k} onClick={() => applyAPreset(p.k as any)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#c5d0e8] bg-white text-[#1a2a50] hover:bg-[#edf1fc] hover:border-[#2a5fd0] transition-all font-semibold">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="bg-white rounded-2xl border border-[#c5d0e8] p-5 mb-4 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#6a7aaa] font-bold">Leave Details</p>

            <Field label="Basic Monthly Salary" tip="Annual leave pay uses basic salary ÷ 30 per day. Allowances included only if contract states so.">
              <TextInput value={aInputs.basicSalary} onChange={setA('basicSalary')} prefix="AED" />
            </Field>

            <Field label="Service Length" tip="Determines your annual leave entitlement under Art. 29.">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'over1y',  l: '≥ 1 Year', sub: '30 days' },
                  { v: '6to12m', l: '6–12 Months', sub: '2d/month' },
                  { v: 'under6m', l: '< 6 Months', sub: 'No entitlement' },
                ] as const).map(s => (
                  <button key={s.v} onClick={() => setA('serviceBand')(s.v)}
                    className={`flex flex-col items-center py-3 px-2 rounded-xl border-2 text-xs font-bold transition-all ${aInputs.serviceBand === s.v ? 'border-[#2a5fd0] bg-[#2a5fd0] text-white' : 'border-[#c5d0e8] bg-white text-[#1a2a50] hover:border-[#2a5fd0]'}`}>
                    {s.l}
                    <span className={`text-[10px] mt-0.5 ${aInputs.serviceBand === s.v ? 'opacity-70' : 'text-[#8095c0]'}`}>{s.sub}</span>
                  </button>
                ))}
              </div>
            </Field>

            {aInputs.serviceBand === '6to12m' && (
              <Field label="Completed Months" tip="Enter completed months of service (6–11) to calculate 2 days × months entitlement.">
                <TextInput value={aInputs.completedMonths} onChange={setA('completedMonths')} placeholder="e.g. 9" />
              </Field>
            )}

            <Field label="Leave Days Already Used" tip="Annual leave days taken so far this year.">
              <TextInput value={aInputs.usedDays} onChange={setA('usedDays')} placeholder="0" />
            </Field>

            <div className="border-t border-[#e5ecf8] pt-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8095c0] font-bold mb-3">Holiday Overlap Check (Optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Leave Start Date">
                  <TextInput type="date" value={aInputs.leaveStartDate} onChange={setA('leaveStartDate')} placeholder="" />
                </Field>
                <Field label="Leave Duration (days)">
                  <TextInput value={aInputs.leaveDays} onChange={setA('leaveDays')} placeholder="e.g. 14" />
                </Field>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-6">
            <button onClick={() => { runA(); setACalced(true) }}
              className="flex-1 bg-[#2a5fd0] hover:bg-[#1a4fc0] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-sm tracking-wide shadow-lg shadow-[#2a5fd030] transition-all">
              Calculate Leave Pay
            </button>
            <button onClick={resetA}
              className="px-5 py-3.5 border-2 border-[#c5d0e8] text-[#5a6a90] hover:bg-[#f5f7fc] font-semibold rounded-xl text-sm transition-all">
              Reset
            </button>
          </div>

          {/* Results */}
          {aResult && (
            <div className="space-y-4">
              {aInputs.serviceBand === 'under6m' ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5">
                  <p className="font-bold text-amber-800 mb-1">No Statutory Annual Leave Entitlement</p>
                  <p className="text-sm text-amber-700">Under Art. 29, employees with less than 6 months of service have no mandatory annual leave. Check your employment contract for any contractual leave benefit.</p>
                </div>
              ) : (
                <>
                  {/* Hero */}
                  <div className="bg-[#2a5fd0] rounded-2xl p-5 text-white">
                    <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60 mb-1">Leave Pay (Unused Days)</div>
                    <div className="text-4xl font-black font-mono">{fmt(aResult.totalLeavePay)}</div>
                    <div className="text-xs opacity-60 mt-1">Based on basic salary — Art. 29, Federal Decree-Law No. 33/2021</div>
                  </div>

                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: 'Entitled', v: `${aResult.entitlementDays}d` },
                      { l: 'Used',     v: `${parseFloat(aInputs.usedDays) || 0}d` },
                      { l: 'Unused',   v: `${aResult.unusedDays.toFixed(0)}d` },
                    ].map(c => (
                      <div key={c.l} className="bg-[#f5f7fc] border border-[#c5d0e8] rounded-xl p-3 text-center">
                        <div className="text-xl font-black font-mono text-[#0a1628]">{c.v}</div>
                        <div className="text-[10px] uppercase tracking-widest text-[#8095c0] font-bold mt-0.5">{c.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Breakdown */}
                  <div className="bg-white rounded-2xl border border-[#c5d0e8] p-5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[#6a7aaa] font-bold mb-3">Pay Breakdown</p>
                    <Row label={`Entitlement (${aInputs.serviceBand === 'over1y' ? '1 year = 30 days' : `${aInputs.completedMonths} months × 2`})`} value={`${aResult.entitlementDays} days`} />
                    <Row label="Daily Rate (Basic ÷ 30)" value={fmt(aResult.dailyRate)} sub="UAE standard 30-day month" />
                    <Row label="Full Entitlement Value" value={fmt(aResult.annualPay)} muted />
                    <Row label="Unused Days × Daily Rate" value={fmt(aResult.totalLeavePay)} highlight />
                  </div>

                  {/* Holiday overlap */}
                  {aInputs.leaveStartDate && aInputs.leaveDays && (
                    <div className={`rounded-xl p-4 border-2 ${aResult.holidaysInLeave > 0 ? 'bg-amber-50 border-amber-300' : 'bg-[#edf1fc] border-[#c5d0e8]'}`}>
                      {aResult.holidaysInLeave > 0 ? (
                        <>
                          <p className="text-sm font-bold text-amber-800 mb-1">⚠️ {aResult.holidaysInLeave} Public Holiday{aResult.holidaysInLeave > 1 ? 's' : ''} Fall Within Your Leave</p>
                          <p className="text-xs text-amber-700 leading-relaxed">Per Art. 29, public holidays falling within annual leave are counted <em>within</em> the leave period — no extra days are added. Plan your dates accordingly or discuss with HR.</p>
                        </>
                      ) : (
                        <p className="text-xs text-[#2a3a60]">✅ No UAE public holidays fall within your selected leave period ({aInputs.leaveStartDate} + {aInputs.leaveDays} days).</p>
                      )}
                    </div>
                  )}

                  {/* Law note */}
                  <div className="bg-[#edf1fc] border border-[#b5c5e8] rounded-xl p-4">
                    <p className="text-xs text-[#1a2a50] leading-relaxed">
                      <strong>Art. 29(9):</strong> Unused annual leave is encashed at basic salary only on termination. Leave pay during active employment may include allowances per contract terms. Employees cannot waive their leave entitlement.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Disclaimer */}
      <div className="mt-6 text-[11px] text-[#8095c0] text-center leading-relaxed px-4">
        For informational and estimation purposes only. Not legal advice. Results are based on UAE federal private sector law (Federal Decree-Law No. 33 of 2021). DIFC, ADGM, and specific free zone employment may have different provisions. Consult MOHRE or a qualified HR professional for your specific situation.
      </div>
    </div>
  )
}
