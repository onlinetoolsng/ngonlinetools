'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = { locale?: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const SPF_CAP = 3000 // OMR monthly gross cap for SPF contributions

// SPF (Social Protection Fund / PASI) rates — Royal Decree 53/2023
const SPF_EMPLOYEE_OMANI = 0.075   // 7.5% employee share
const SPF_EMPLOYER_OMANI = 0.115   // 11.5% employer share (incl. work injury)
const SPF_EMPLOYER_EXPAT_INJURY = 0.01 // 1% work injury for expats (employer only)

const MINIMUM_WAGE_BASIC = 325     // OMR — minimum basic wage for Omanis

// ─── Types ────────────────────────────────────────────────────────────────────

type Nationality = 'omani' | 'expat'
type Mode = 'employee' | 'employer'

interface Inputs {
  nationality: Nationality
  basicSalary: string
  housingAllowance: string
  transportAllowance: string
  otherAllowances: string
  startDate: string
  endDate: string
  overtime: string
  bonus: string
  otherDeductions: string
}

interface Results {
  grossMonthly: number
  spfEmployee: number
  otherDeductionsVal: number
  totalDeductions: number
  netMonthly: number
  annualGross: number
  annualNet: number
  spfEmployer: number
  workInjury: number
  totalEmployerContributions: number
  totalEmployerCost: number
  gratuity: number
  yearsOfService: number
  effectiveDeductionRate: number
}

// ─── Calculation Engine ───────────────────────────────────────────────────────

function calculateOmanPayroll(inputs: Inputs): Results | null {
  const basic = parseFloat(inputs.basicSalary) || 0
  const housing = parseFloat(inputs.housingAllowance) || 0
  const transport = parseFloat(inputs.transportAllowance) || 0
  const other = parseFloat(inputs.otherAllowances) || 0
  const overtime = parseFloat(inputs.overtime) || 0
  const bonus = parseFloat(inputs.bonus) || 0
  const otherDeductionsVal = parseFloat(inputs.otherDeductions) || 0

  if (basic <= 0) return null

  const grossMonthly = basic + housing + transport + other + overtime + bonus

  // SPF contributions (capped at OMR 3,000 gross)
  const spfBase = Math.min(grossMonthly, SPF_CAP)
  let spfEmployee = 0
  let spfEmployer = 0
  let workInjury = 0

  if (inputs.nationality === 'omani') {
    spfEmployee = spfBase * SPF_EMPLOYEE_OMANI
    spfEmployer = spfBase * SPF_EMPLOYER_OMANI
    workInjury = 0 // included in employer share above
  } else {
    spfEmployee = 0
    workInjury = grossMonthly * SPF_EMPLOYER_EXPAT_INJURY
    spfEmployer = workInjury
  }

  const totalDeductions = spfEmployee + otherDeductionsVal
  const netMonthly = grossMonthly - totalDeductions

  // Gratuity (Article 61, Oman Labour Law — new law)
  let gratuity = 0
  let yearsOfService = 0
  if (inputs.startDate && inputs.endDate) {
    const start = new Date(inputs.startDate)
    const end = new Date(inputs.endDate)
    const diffMs = end.getTime() - start.getTime()
    if (diffMs > 0) {
      yearsOfService = diffMs / (1000 * 60 * 60 * 24 * 365.25)
      // 1 month basic per full year served
      gratuity = basic * Math.floor(yearsOfService)
      // Pro-rate partial final year (if > 6 months)
      const partial = yearsOfService - Math.floor(yearsOfService)
      if (partial >= 0.5) gratuity += basic * partial
    }
  }

  const totalEmployerContributions = spfEmployer
  const totalEmployerCost = grossMonthly + totalEmployerContributions

  return {
    grossMonthly,
    spfEmployee,
    otherDeductionsVal,
    totalDeductions,
    netMonthly,
    annualGross: grossMonthly * 12,
    annualNet: netMonthly * 12,
    spfEmployer,
    workInjury,
    totalEmployerContributions,
    totalEmployerCost,
    gratuity,
    yearsOfService,
    effectiveDeductionRate: grossMonthly > 0 ? (totalDeductions / grossMonthly) * 100 : 0,
  }
}

function fmt(n: number) {
  return `OMR ${n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
}

function pct(n: number) {
  return `${n.toFixed(1)}%`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  placeholder = '0.000',
  type = 'number',
  prefix,
  tooltip,
  warning,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  prefix?: string
  tooltip?: string
  warning?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-[#5a6a5e]">{label}</label>
        {tooltip && (
          <span className="group relative cursor-help">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#c8d5cb] text-[#3d5240] text-[10px] font-bold">?</span>
            <span className="absolute left-6 top-0 z-10 hidden group-hover:block w-56 bg-[#1e2d20] text-[#c8d5cb] text-xs rounded-lg p-2.5 shadow-xl leading-relaxed">
              {tooltip}
            </span>
          </span>
        )}
      </div>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7a9080] select-none">{prefix}</span>
        )}
        <input
          type={type}
          min={type === 'number' ? '0' : undefined}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${prefix ? 'pl-12' : 'pl-3'} pr-3 py-2.5 rounded-lg border text-sm font-mono text-[#1e2d20] placeholder-[#b0bdb3] bg-[#f5f8f5] focus:outline-none focus:ring-2 focus:ring-[#3d7a50] transition ${warning ? 'border-amber-400 bg-amber-50' : 'border-[#d0dbd3]'}`}
        />
      </div>
      {warning && <p className="text-xs text-amber-600 font-medium">{warning}</p>}
    </div>
  )
}

function ResultRow({
  label,
  value,
  sub,
  negative,
  highlight,
  muted,
}: {
  label: string
  value: string
  sub?: string
  negative?: boolean
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 ${highlight ? 'border-t border-[#c8d5cb] mt-1 pt-3' : ''}`}>
      <div>
        <span className={`text-sm ${muted ? 'text-[#8a9e8e] text-xs' : 'text-[#3a4d3d]'}`}>{label}</span>
        {sub && <span className="block text-[10px] text-[#9aad9e] mt-0.5">{sub}</span>}
      </div>
      <span className={`text-sm font-bold font-mono tabular-nums ${highlight ? 'text-[#2d6a42] text-base' : negative ? 'text-rose-600' : muted ? 'text-[#8a9e8e]' : 'text-[#1e2d20]'}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OmanSalaryCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'
  const [mode, setMode] = useState<Mode>('employee')
  const [annualView, setAnnualView] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [results, setResults] = useState<Results | null>(null)
  const [hasCalculated, setHasCalculated] = useState(false)

  const [inputs, setInputs] = useState<Inputs>({
    nationality: 'omani',
    basicSalary: '',
    housingAllowance: '',
    transportAllowance: '',
    otherAllowances: '',
    startDate: '',
    endDate: '',
    overtime: '',
    bonus: '',
    otherDeductions: '',
  })

  const set = (key: keyof Inputs) => (val: string) =>
    setInputs(prev => ({ ...prev, [key]: val }))

  const recalculate = useCallback(() => {
    const res = calculateOmanPayroll(inputs)
    setResults(res)
    if (res) setHasCalculated(true)
  }, [inputs])

  useEffect(() => {
    if (hasCalculated) recalculate()
  }, [inputs, hasCalculated, recalculate])

  function applyPreset(preset: 'entry-omani' | 'mid-expat' | 'manager') {
    const presets = {
      'entry-omani': { nationality: 'omani' as Nationality, basicSalary: '450', housingAllowance: '100', transportAllowance: '50', otherAllowances: '', startDate: '2022-01-01', endDate: new Date().toISOString().slice(0, 10), overtime: '', bonus: '', otherDeductions: '' },
      'mid-expat':   { nationality: 'expat' as Nationality, basicSalary: '900', housingAllowance: '300', transportAllowance: '100', otherAllowances: '', startDate: '2021-06-01', endDate: new Date().toISOString().slice(0, 10), overtime: '', bonus: '', otherDeductions: '' },
      'manager':     { nationality: 'omani' as Nationality, basicSalary: '2000', housingAllowance: '600', transportAllowance: '150', otherAllowances: '250', startDate: '2018-03-01', endDate: new Date().toISOString().slice(0, 10), overtime: '', bonus: '500', otherDeductions: '' },
    }
    setInputs(presets[preset])
    setHasCalculated(true)
    setTimeout(() => setResults(calculateOmanPayroll(presets[preset])), 0)
  }

  function reset() {
    setInputs({ nationality: 'omani', basicSalary: '', housingAllowance: '', transportAllowance: '', otherAllowances: '', startDate: '', endDate: '', overtime: '', bonus: '', otherDeductions: '' })
    setResults(null)
    setHasCalculated(false)
  }

  const belowMinWage = inputs.nationality === 'omani' && parseFloat(inputs.basicSalary) > 0 && parseFloat(inputs.basicSalary) < MINIMUM_WAGE_BASIC

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="font-sans text-[#1e2d20] max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#3d7a50] flex items-center justify-center text-white text-sm font-bold">OM</div>
          <h2 className="text-xl font-bold text-[#1e2d20] tracking-tight">Oman Salary Calculator</h2>
        </div>
        <p className="text-sm text-[#5a6a5e] leading-relaxed">
          Calculate net take-home pay, SPF contributions, employer costs, and end-of-service gratuity for Oman — updated for Royal Decree 53/2023.
        </p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 bg-[#eaf0eb] rounded-xl p-1 mb-5">
        {(['employee', 'employer'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${mode === m ? 'bg-white text-[#2d6a42] shadow-sm' : 'text-[#5a6a5e] hover:text-[#2d6a42]'}`}>
            {m === 'employee' ? '👤 Employee View' : '🏢 Employer View'}
          </button>
        ))}
      </div>

      {/* Presets */}
      <div className="mb-5">
        <p className="text-xs uppercase tracking-widest text-[#8a9e8e] mb-2 font-semibold">Quick Presets</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'entry-omani', label: 'Entry-level Omani' },
            { key: 'mid-expat', label: 'Mid-level Expat' },
            { key: 'manager', label: 'Senior Manager' },
          ].map(p => (
            <button key={p.key} onClick={() => applyPreset(p.key as any)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#c8d5cb] bg-white text-[#3d5240] hover:bg-[#eaf0eb] hover:border-[#3d7a50] transition-all font-medium">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Nationality toggle */}
      <div className="mb-5">
        <p className="text-xs uppercase tracking-widest text-[#5a6a5e] mb-2 font-semibold">Nationality</p>
        <div className="flex gap-2">
          {[
            { value: 'omani', label: '🇴🇲 Omani National' },
            { value: 'expat', label: '🌍 Expatriate' },
          ].map(n => (
            <button key={n.value} onClick={() => set('nationality')(n.value)}
              className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${inputs.nationality === n.value ? 'border-[#3d7a50] bg-[#3d7a50] text-white' : 'border-[#d0dbd3] bg-white text-[#3d5240] hover:border-[#3d7a50]'}`}>
              {n.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#8a9e8e] mt-2">
          {inputs.nationality === 'omani'
            ? 'SPF deductions of 7.5% (employee) apply. Employer contributes 11.5%.'
            : 'No SPF deduction for expatriates. Employer pays 1% work injury insurance only.'}
        </p>
      </div>

      {/* Salary Inputs */}
      <div className="bg-white rounded-2xl border border-[#d0dbd3] p-5 mb-4 space-y-4">
        <p className="text-xs uppercase tracking-widest text-[#5a6a5e] font-semibold mb-3">Salary Components</p>
        <InputField
          label="Basic Salary"
          value={inputs.basicSalary}
          onChange={set('basicSalary')}
          prefix="OMR"
          tooltip="Foundation of your package. Used for gratuity, overtime & SPF calculations per Oman Labour Law."
          warning={belowMinWage ? `Below minimum wage (OMR ${MINIMUM_WAGE_BASIC}) for Omani nationals` : undefined}
        />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Housing Allowance" value={inputs.housingAllowance} onChange={set('housingAllowance')} prefix="OMR" tooltip="Separate from basic; not used for gratuity calculation." />
          <InputField label="Transport Allowance" value={inputs.transportAllowance} onChange={set('transportAllowance')} prefix="OMR" />
        </div>
        <InputField label="Other Allowances" value={inputs.otherAllowances} onChange={set('otherAllowances')} prefix="OMR" tooltip="Education, phone, or any other regular allowances." />
      </div>

      {/* Gratuity Inputs */}
      <div className="bg-white rounded-2xl border border-[#d0dbd3] p-5 mb-4 space-y-4">
        <p className="text-xs uppercase tracking-widest text-[#5a6a5e] font-semibold">Gratuity Period</p>
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Contract Start" value={inputs.startDate} onChange={set('startDate')} type="date" placeholder="" />
          <InputField label="Contract End" value={inputs.endDate} onChange={set('endDate')} type="date" placeholder="" />
        </div>
      </div>

      {/* Advanced */}
      <button onClick={() => setShowAdvanced(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-[#f5f8f5] rounded-xl border border-[#d0dbd3] text-sm font-semibold text-[#3d5240] hover:bg-[#eaf0eb] transition mb-4">
        <span>⚙️ Advanced (Overtime, Bonus, Custom Deductions)</span>
        <span className="text-lg">{showAdvanced ? '−' : '+'}</span>
      </button>
      {showAdvanced && (
        <div className="bg-white rounded-2xl border border-[#d0dbd3] p-5 mb-4 space-y-4">
          <InputField label="Overtime Amount" value={inputs.overtime} onChange={set('overtime')} prefix="OMR" tooltip="Monthly overtime pay (1.25× regular for first 3 hrs; 1.5× thereafter per law)." />
          <InputField label="Bonus / Commission" value={inputs.bonus} onChange={set('bonus')} prefix="OMR" />
          <InputField label="Other Deductions" value={inputs.otherDeductions} onChange={set('otherDeductions')} prefix="OMR" tooltip="Advances, loans, etc. Capped per law — cannot exceed certain % of salary without written consent." />
        </div>
      )}

      {/* Calculate / Reset */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => { recalculate(); setHasCalculated(true) }}
          className="flex-1 bg-[#3d7a50] hover:bg-[#2d6a42] active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-xl transition-all text-sm tracking-wide shadow-md shadow-[#3d7a5030]">
          Calculate Salary
        </button>
        <button onClick={reset}
          className="px-5 py-3.5 border-2 border-[#d0dbd3] text-[#5a6a5e] hover:bg-[#f5f8f5] font-semibold rounded-xl transition-all text-sm">
          Reset
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Hero cards */}
          <div className="grid grid-cols-2 gap-3">
            {mode === 'employee' ? (
              <>
                <div className="bg-[#3d7a50] rounded-2xl p-4 text-white col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase tracking-widest opacity-70">Net Monthly Take-Home</span>
                    <div className="flex gap-1">
                      <button onClick={() => setAnnualView(false)} className={`text-xs px-2 py-0.5 rounded-md font-bold transition ${!annualView ? 'bg-white text-[#3d7a50]' : 'opacity-60 hover:opacity-100'}`}>Mo</button>
                      <button onClick={() => setAnnualView(true)} className={`text-xs px-2 py-0.5 rounded-md font-bold transition ${annualView ? 'bg-white text-[#3d7a50]' : 'opacity-60 hover:opacity-100'}`}>Yr</button>
                    </div>
                  </div>
                  <div className="text-3xl font-black font-mono tabular-nums">
                    {fmt(annualView ? results.annualNet : results.netMonthly)}
                  </div>
                  <div className="text-xs opacity-60 mt-1">No personal income tax in Oman</div>
                </div>
                <div className="bg-[#f5f8f5] border border-[#d0dbd3] rounded-2xl p-4">
                  <div className="text-xs text-[#8a9e8e] uppercase tracking-widest font-semibold mb-1">Deduction Rate</div>
                  <div className="text-2xl font-black text-[#1e2d20] font-mono">{pct(results.effectiveDeductionRate)}</div>
                </div>
                <div className="bg-[#f5f8f5] border border-[#d0dbd3] rounded-2xl p-4">
                  <div className="text-xs text-[#8a9e8e] uppercase tracking-widest font-semibold mb-1">SPF Deducted</div>
                  <div className="text-2xl font-black text-rose-600 font-mono">{fmt(results.spfEmployee)}</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#1e2d20] rounded-2xl p-4 text-white col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-widest opacity-60">Total Cost to Employer</span>
                  <div className="text-3xl font-black font-mono mt-1">{fmt(annualView ? results.totalEmployerCost * 12 : results.totalEmployerCost)}</div>
                  <div className="text-xs opacity-50 mt-1">Gross + SPF employer contributions</div>
                </div>
                <div className="bg-[#f5f8f5] border border-[#d0dbd3] rounded-2xl p-4">
                  <div className="text-xs text-[#8a9e8e] uppercase tracking-widest font-semibold mb-1">Employer SPF</div>
                  <div className="text-xl font-black text-[#1e2d20] font-mono">{fmt(results.spfEmployer)}</div>
                </div>
                <div className="bg-[#f5f8f5] border border-[#d0dbd3] rounded-2xl p-4">
                  <div className="text-xs text-[#8a9e8e] uppercase tracking-widest font-semibold mb-1">Employee Net</div>
                  <div className="text-xl font-black text-[#3d7a50] font-mono">{fmt(results.netMonthly)}</div>
                </div>
              </>
            )}
          </div>

          {/* Annual toggle */}
          {mode === 'employer' && (
            <div className="flex justify-end gap-1">
              <button onClick={() => setAnnualView(false)} className={`text-xs px-3 py-1 rounded-lg font-bold transition ${!annualView ? 'bg-[#3d7a50] text-white' : 'bg-[#f5f8f5] text-[#5a6a5e]'}`}>Monthly</button>
              <button onClick={() => setAnnualView(true)} className={`text-xs px-3 py-1 rounded-lg font-bold transition ${annualView ? 'bg-[#3d7a50] text-white' : 'bg-[#f5f8f5] text-[#5a6a5e]'}`}>Annual</button>
            </div>
          )}

          {/* Detailed breakdown */}
          <div className="bg-white rounded-2xl border border-[#d0dbd3] p-5">
            <p className="text-xs uppercase tracking-widest text-[#5a6a5e] font-semibold mb-3">Monthly Breakdown</p>
            <ResultRow label="Gross Salary" value={fmt(results.grossMonthly)} />
            {results.spfEmployee > 0 && (
              <ResultRow label="SPF / PASI (Employee 7.5%)" sub="Capped at OMR 3,000 base" value={`− ${fmt(results.spfEmployee)}`} negative />
            )}
            {results.otherDeductionsVal > 0 && (
              <ResultRow label="Other Deductions" value={`− ${fmt(results.otherDeductionsVal)}`} negative />
            )}
            {results.spfEmployee === 0 && results.otherDeductionsVal === 0 && (
              <ResultRow label="Deductions" value="None (Expat)" muted />
            )}
            <ResultRow label="Net Take-Home" value={fmt(results.netMonthly)} highlight />
          </div>

          {/* Employer cost */}
          {mode === 'employer' && (
            <div className="bg-white rounded-2xl border border-[#d0dbd3] p-5">
              <p className="text-xs uppercase tracking-widest text-[#5a6a5e] font-semibold mb-3">Employer Contributions</p>
              <ResultRow label="Gross Salary" value={fmt(results.grossMonthly)} />
              {inputs.nationality === 'omani' ? (
                <ResultRow label="SPF Employer Share (11.5%)" sub="Incl. work injury & disability" value={`+ ${fmt(results.spfEmployer)}`} />
              ) : (
                <ResultRow label="Work Injury Insurance (1%)" sub="Employer only for expatriates" value={`+ ${fmt(results.workInjury)}`} />
              )}
              <ResultRow label="Total Employer Cost / Month" value={fmt(results.totalEmployerCost)} highlight />
              <ResultRow label="Total Employer Cost / Year" value={fmt(results.totalEmployerCost * 12)} muted />
            </div>
          )}

          {/* Gratuity */}
          {results.gratuity > 0 && (
            <div className="bg-[#f0f7f2] rounded-2xl border border-[#b8d5c0] p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏅</span>
                <p className="text-xs uppercase tracking-widest text-[#3d5240] font-semibold">End-of-Service Gratuity</p>
              </div>
              <div className="text-2xl font-black font-mono text-[#2d6a42] mb-1">{fmt(results.gratuity)}</div>
              <div className="text-xs text-[#5a6a5e]">Based on {results.yearsOfService.toFixed(1)} years of service · 1 month basic salary per full year</div>
              <div className="mt-3 text-xs text-[#8a9e8e] italic">Per Oman Labour Law Article 61 (Royal Decree 53/2023). Actual gratuity may vary. SPF recipients may have adjusted entitlements.</div>
            </div>
          )}

          {/* Annual summary */}
          <div className="bg-white rounded-2xl border border-[#d0dbd3] p-5">
            <p className="text-xs uppercase tracking-widest text-[#5a6a5e] font-semibold mb-3">Annual Summary</p>
            <ResultRow label="Annual Gross" value={fmt(results.annualGross)} />
            <ResultRow label="Annual Deductions" value={`− ${fmt(results.totalDeductions * 12)}`} negative={results.totalDeductions > 0} />
            <ResultRow label="Annual Net Take-Home" value={fmt(results.annualNet)} highlight />
          </div>

          {/* Note */}
          <p className="text-xs text-[#9aad9e] text-center px-4 leading-relaxed">
            Calculations based on standard SPF rates per Royal Decree 53/2023. This tool is for informational purposes only and does not constitute legal or financial advice. Rates may vary — consult a qualified HR professional or PASI for official figures.
          </p>
        </div>
      )}
    </div>
  )
}
