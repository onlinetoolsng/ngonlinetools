'use client'

import { useState, useEffect, useMemo } from 'react'

type Props = { locale: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const PERSONAL_RATE_DEFAULT = 5.99
const CAR_RATE_DEFAULT = 2.99
const PROCESSING_FEE_RATE = 0.0105
const VAT_RATE = 0.05
const DBR_LIMIT = 0.50
const MIN_SALARY = 5_000

const NATIONALITY_OPTIONS = [
  { value: 'national', label: 'UAE National',   maxPersonal: 4_000_000, salaryMultiple: 20 },
  { value: 'expat',    label: 'Expatriate',      maxPersonal: 3_000_000, salaryMultiple: 20 },
]

const RATE_PRESETS_PERSONAL = [5.99, 7.0, 9.99, 12.0]
const RATE_PRESETS_CAR      = [2.99, 3.99, 4.99]

const QUICK_PRESETS_PERSONAL = [
  { label: 'AED 50k / 2yr',  amount: 50_000,  tenor: 24 },
  { label: 'AED 100k / 4yr', amount: 100_000, tenor: 48 },
  { label: 'AED 250k / 4yr', amount: 250_000, tenor: 48 },
]

const QUICK_PRESETS_CAR = [
  { label: 'AED 80k / 3yr',  vehicleValue: 100_000, downPct: 20, tenor: 36 },
  { label: 'AED 160k / 4yr', vehicleValue: 200_000, downPct: 20, tenor: 48 },
  { label: 'AED 240k / 5yr', vehicleValue: 300_000, downPct: 20, tenor: 60 },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = 'personal' | 'car'

type AmortRow = {
  month: number
  openingBalance: number
  emi: number
  interest: number
  principal: number
  closingBalance: number
}

type CalcResult = {
  emi: number
  totalRepayment: number
  totalInterest: number
  processingFee: number
  processingFeeVAT: number
  totalCost: number
  interestPct: number   // interest as % of total repayment
  dbrPercent: number
  dbrWarning: boolean
  salaryMultipleWarning: boolean
  ltvWarning: boolean
  schedule: AmortRow[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `AED ${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(0)}k`
  return `AED ${n.toFixed(0)}`
}

function calcEMI(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function buildSchedule(principal: number, annualRate: number, months: number, emi: number): AmortRow[] {
  const r = annualRate / 100 / 12
  const rows: AmortRow[] = []
  let balance = principal
  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    const principalPaid = Math.min(emi - interest, balance)
    const closing = Math.max(0, balance - principalPaid)
    rows.push({ month: m, openingBalance: balance, emi, interest, principal: principalPaid, closingBalance: closing })
    balance = closing
    if (balance < 0.01) break
  }
  return rows
}

function doCalc(
  tab: TabType,
  loanAmount: number,
  annualRate: number,
  tenorMonths: number,
  salary: number,
  existingDebts: number,
  vehicleValue: number,
  downPct: number,
  nationalityVal: string,
  includeProcessingFee: boolean,
): CalcResult | null {
  if (!loanAmount || loanAmount <= 0 || !annualRate || !tenorMonths) return null

  const nat = NATIONALITY_OPTIONS.find(n => n.value === nationalityVal)!
  const emi = calcEMI(loanAmount, annualRate, tenorMonths)
  const totalRepayment = emi * tenorMonths
  const totalInterest = totalRepayment - loanAmount
  const interestPct = (totalInterest / totalRepayment) * 100
  const processingFee = includeProcessingFee ? loanAmount * PROCESSING_FEE_RATE : 0
  const processingFeeVAT = processingFee * VAT_RATE
  const totalCost = totalRepayment + processingFee + processingFeeVAT

  const dbrPercent = salary > 0 ? ((existingDebts + emi) / salary) * 100 : 0
  const dbrWarning = salary > 0 && dbrPercent > DBR_LIMIT * 100
  const salaryMultipleWarning = salary > 0 && loanAmount > salary * nat.salaryMultiple

  const ltv = vehicleValue > 0 ? (loanAmount / vehicleValue) * 100 : 0
  const ltvWarning = tab === 'car' && ltv > 80

  const schedule = buildSchedule(loanAmount, annualRate, tenorMonths, emi)
  return { emi, totalRepayment, totalInterest, processingFee, processingFeeVAT, totalCost, interestPct, dbrPercent, dbrWarning, salaryMultipleWarning, ltvWarning, schedule }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, value, sub, neg, highlight, border }: {
  label: string; value: string; sub?: string; neg?: boolean; highlight?: boolean; border?: boolean
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${border ? 'pt-3 border-t border-gray-200' : ''}`}>
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
      <span className={`text-sm font-semibold tabular-nums text-right shrink-0 ${highlight ? 'text-emerald-600' : neg ? 'text-red-500' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

function Warning({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
      <span className="mt-0.5 shrink-0">⚠️</span><span>{text}</span>
    </div>
  )
}

function NumInput({ label, value, onChange, prefix, min, max, step, hint, placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  prefix?: string; min?: number; max?: number; step?: number; hint?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none select-none">{prefix}</span>
        )}
        <input
          type="number"
          min={min} max={max} step={step ?? 1}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '0'}
          className={`w-full ${prefix ? 'pl-14' : 'pl-4'} pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition bg-white`}
        />
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

// Simple bar: principal vs interest
function SplitBar({ principalPct }: { principalPct: number }) {
  const intPct = 100 - principalPct
  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
        <div className="bg-red-600 transition-all duration-500" style={{ width: `${principalPct}%` }} />
        <div className="bg-red-200 transition-all duration-500" style={{ width: `${intPct}%` }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-gray-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />Principal {principalPct.toFixed(0)}%
        </span>
        <span className="text-xs text-gray-500 flex items-center gap-1.5">
          Interest {intPct.toFixed(0)}%<span className="w-2 h-2 rounded-full bg-red-200 inline-block" />
        </span>
      </div>
    </div>
  )
}

// DBR gauge bar
function DBRBar({ pct }: { pct: number }) {
  const capped = Math.min(pct, 100)
  const color = pct > 50 ? 'bg-red-500' : pct > 35 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-2.5 bg-gray-100">
        <div className={`${color} transition-all duration-500`} style={{ width: `${capped}%` }} />
        {/* 50% marker */}
      </div>
      <div className="relative mt-0.5" style={{ paddingLeft: '50%' }}>
        <div className="absolute left-1/2 -translate-x-1/2 w-px h-2 bg-gray-400" style={{ top: '-10px' }} />
        <span className="text-xs text-gray-500 absolute left-1/2 -translate-x-1/2 top-0.5">50% limit</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmiratesNBDLoanCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [tab, setTab] = useState<TabType>('personal')
  const [nationality, setNationality] = useState('expat')

  // Personal
  const [pAmount, setPAmount] = useState('')
  const [pTenor, setPTenor] = useState('48')
  const [pRate, setPRate] = useState(String(PERSONAL_RATE_DEFAULT))

  // Car
  const [cVehicleValue, setCVehicleValue] = useState('')
  const [cDownPct, setCDownPct] = useState('20')
  const [cTenor, setCTenor] = useState('60')
  const [cRate, setCRate] = useState(String(CAR_RATE_DEFAULT))

  // Shared optional
  const [salary, setSalary] = useState('')
  const [existingDebts, setExistingDebts] = useState('')
  const [salaryTransfer, setSalaryTransfer] = useState(true)
  const [includeProcessingFee, setIncludeProcessingFee] = useState(true)

  // UI
  const [showFullSchedule, setShowFullSchedule] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  // Compare
  const [cmpRate, setCmpRate] = useState('')
  const [cmpTenor, setCmpTenor] = useState('')

  const nat = NATIONALITY_OPTIONS.find(n => n.value === nationality)!

  // Derived car loan
  const vehicleVal = parseFloat(cVehicleValue) || 0
  const downPct = parseFloat(cDownPct) || 20
  const carLoanAmount = vehicleVal * (1 - downPct / 100)

  const loanAmount = tab === 'personal' ? parseFloat(pAmount) || 0 : carLoanAmount
  const annualRate = tab === 'personal' ? parseFloat(pRate) || PERSONAL_RATE_DEFAULT : parseFloat(cRate) || CAR_RATE_DEFAULT
  const tenorMonths = tab === 'personal' ? parseInt(pTenor) || 48 : parseInt(cTenor) || 60

  const result = useMemo(() => doCalc(
    tab, loanAmount, annualRate, tenorMonths,
    parseFloat(salary) || 0,
    parseFloat(existingDebts) || 0,
    vehicleVal, downPct,
    nationality, includeProcessingFee,
  ), [tab, loanAmount, annualRate, tenorMonths, salary, existingDebts, vehicleVal, downPct, nationality, includeProcessingFee])

  const cmpResult = useMemo(() => {
    if (!showCompare || !cmpRate || !cmpTenor) return null
    return doCalc(tab, loanAmount, parseFloat(cmpRate), parseInt(cmpTenor),
      parseFloat(salary) || 0, parseFloat(existingDebts) || 0,
      vehicleVal, downPct, nationality, includeProcessingFee)
  }, [showCompare, cmpRate, cmpTenor, tab, loanAmount, salary, existingDebts, vehicleVal, downPct, nationality, includeProcessingFee])

  function applyPersonalPreset(p: typeof QUICK_PRESETS_PERSONAL[0]) {
    setPAmount(String(p.amount)); setPTenor(String(p.tenor)); setPRate(String(PERSONAL_RATE_DEFAULT))
  }
  function applyCarPreset(p: typeof QUICK_PRESETS_CAR[0]) {
    setCVehicleValue(String(p.vehicleValue)); setCDownPct(String(p.downPct)); setCTenor(String(p.tenor)); setCRate(String(CAR_RATE_DEFAULT))
  }
  function reset() {
    setPAmount(''); setPTenor('48'); setPRate(String(PERSONAL_RATE_DEFAULT))
    setCVehicleValue(''); setCDownPct('20'); setCTenor('60'); setCRate(String(CAR_RATE_DEFAULT))
    setSalary(''); setExistingDebts(''); setShowFullSchedule(false); setShowCompare(false)
  }

  const scheduleRows = showFullSchedule ? result?.schedule : result?.schedule.slice(0, 12)
  const principalPct = result ? 100 - result.interestPct : 50

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {([['personal', '💳 Personal Loan'], ['car', '🚗 Car Loan']] as [TabType, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => { setTab(t); setShowFullSchedule(false); setShowCompare(false) }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === t ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Nationality */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nationality / Residency</label>
        <div className="flex gap-2 flex-wrap">
          {NATIONALITY_OPTIONS.map(n => (
            <button
              key={n.value}
              onClick={() => setNationality(n.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                nationality === n.value ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">Max loan: {fmtShort(nat.maxPersonal)} · Up to {nat.salaryMultiple}× monthly salary</p>
      </div>

      {/* Salary transfer toggle */}
      {tab === 'personal' && (
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setSalaryTransfer(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${salaryTransfer ? 'bg-red-600' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${salaryTransfer ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm text-gray-600">
            Salary Transfer to Emirates NBD
            <span className="ml-1.5 text-xs text-emerald-600 font-medium">{salaryTransfer ? '✓ May qualify for lower rates' : 'Higher rates may apply'}</span>
          </span>
        </label>
      )}

      {/* ── PERSONAL LOAN ── */}
      {tab === 'personal' && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quick scenarios</p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_PRESETS_PERSONAL.map(p => (
                <button key={p.label} onClick={() => applyPersonalPreset(p)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <NumInput label="Loan Amount (AED)" value={pAmount} onChange={setPAmount}
                prefix="AED" min={5000} max={nat.maxPersonal}
                hint={`Max for ${nat.label}: ${fmtShort(nat.maxPersonal)} · Min AED 5,000`} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loan Tenure</label>
              <select value={pTenor} onChange={e => setPTenor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition">
                {[12,18,24,36,48].map(m => <option key={m} value={m}>{m} months ({(m/12).toFixed(m%12===0?0:1)} {m===12?'year':'years'})</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Personal loans: up to 48 months (CBUAE limit)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Interest Rate (% p.a. — Reducing Balance)
              </label>
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {RATE_PRESETS_PERSONAL.map(r => (
                  <button key={r} onClick={() => setPRate(String(r))}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      pRate === String(r) ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-600 hover:border-red-300'}`}>
                    {r}%
                  </button>
                ))}
              </div>
              <input type="number" min={0.5} max={30} step={0.01} value={pRate} onChange={e => setPRate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white" />
              <p className="text-xs text-gray-500 mt-1">Emirates NBD from {PERSONAL_RATE_DEFAULT}% reducing · Varies by profile</p>
            </div>
          </div>
        </div>
      )}

      {/* ── CAR LOAN ── */}
      {tab === 'car' && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quick scenarios</p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_PRESETS_CAR.map(p => (
                <button key={p.label} onClick={() => applyCarPreset(p)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <NumInput label="Vehicle Value (AED)" value={cVehicleValue} onChange={setCVehicleValue}
                prefix="AED" min={20000} hint="Enter the on-road price of the vehicle" />
            </div>
            <NumInput label="Down Payment (%)" value={cDownPct} onChange={setCDownPct}
              min={20} max={60} step={1} hint="Minimum 20% required (max 80% financing)" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Financed Amount (AED)</label>
              <div className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm font-semibold text-red-700 bg-red-50">
                {carLoanAmount > 0 ? fmt(carLoanAmount) : '—'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Max 80% of vehicle value (CBUAE)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loan Tenure</label>
              <select value={cTenor} onChange={e => setCTenor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition">
                {[12,24,36,48,60].map(m => <option key={m} value={m}>{m} months ({(m/12).toFixed(m%12===0?0:1)} {m===12?'year':'years'})</option>)}
              </select>
              <p className="text-xs text-gray-500 mt-1">Car loans: up to 60 months</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Interest Rate (% p.a. — Reducing Balance)</label>
              <div className="flex gap-1.5 mb-2">
                {RATE_PRESETS_CAR.map(r => (
                  <button key={r} onClick={() => setCRate(String(r))}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      cRate === String(r) ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-600 hover:border-red-300'}`}>
                    {r}%
                  </button>
                ))}
              </div>
              <input type="number" min={0.5} max={15} step={0.01} value={cRate} onChange={e => setCRate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition bg-white" />
              <p className="text-xs text-gray-500 mt-1">Emirates NBD car finance from {CAR_RATE_DEFAULT}% · Subject to approval</p>
            </div>
          </div>
        </div>
      )}

      {/* Affordability */}
      <div className="border-t border-dashed border-gray-200 pt-5">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Affordability Check (Optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumInput label="Gross Monthly Salary (AED)" value={salary} onChange={setSalary}
            prefix="AED" min={MIN_SALARY} hint="Used for DBR and max loan eligibility checks" />
          <NumInput label="Other Monthly Debt Payments (AED)" value={existingDebts} onChange={setExistingDebts}
            prefix="AED" hint="Existing loan EMIs, credit card minimums" />
        </div>
      </div>

      {/* Processing fee toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div onClick={() => setIncludeProcessingFee(v => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${includeProcessingFee ? 'bg-red-600' : 'bg-gray-300'}`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${includeProcessingFee ? 'translate-x-5' : ''}`} />
        </div>
        <span className="text-sm text-gray-600">Include processing fee (1.05% + 5% VAT) in total cost</span>
      </label>

      {/* Compare mode toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div onClick={() => setShowCompare(v => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${showCompare ? 'bg-red-600' : 'bg-gray-300'}`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${showCompare ? 'translate-x-5' : ''}`} />
        </div>
        <span className="text-sm text-gray-600">Compare with an alternative rate / tenure</span>
      </label>

      {showCompare && (
        <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <NumInput label="Alt. Rate (%)" value={cmpRate} onChange={setCmpRate} min={0.5} max={30} step={0.01} />
          <NumInput label="Alt. Tenure (months)" value={cmpTenor} onChange={setCmpTenor} min={1} max={60} step={1} />
        </div>
      )}

      {/* Reset */}
      <div className="flex justify-end">
        <button onClick={reset} className="px-5 py-2 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl transition-colors">
          Reset All
        </button>
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <div className="space-y-4">
          {/* Warnings */}
          {result.dbrWarning && salary && (
            <Warning text={`DBR is ${result.dbrPercent.toFixed(1)}% — exceeds the UAE Central Bank's 50% limit. Try reducing the loan amount or extending the tenure.`} />
          )}
          {result.salaryMultipleWarning && salary && (
            <Warning text={`Loan amount exceeds ${nat.salaryMultiple}× your monthly salary — the regulatory maximum. Reduce the loan amount to stay within eligibility limits.`} />
          )}
          {result.ltvWarning && tab === 'car' && (
            <Warning text={`Financing exceeds 80% of vehicle value. Increase your down payment to meet UAE Central Bank LTV requirements.`} />
          )}

          {/* Compare layout */}
          <div className={showCompare && cmpResult ? 'grid grid-cols-2 gap-3' : ''}>

            {/* Main result */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-5 text-white">
                <div className="text-xs opacity-70 mb-0.5 uppercase tracking-wide">
                  {tab === 'personal' ? 'Personal Loan' : 'Car Loan'} · {annualRate}% · {tenorMonths}mo
                </div>
                <div className="text-sm opacity-75 mb-1">Monthly EMI</div>
                <div className="text-4xl font-black tabular-nums">{fmt(result.emi)}</div>
                <div className="text-xs opacity-60 mt-1">Reducing balance · Illustrative only</div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm">Breakdown</h3>
                <SplitBar principalPct={principalPct} />
                <Row label="Loan Amount (Principal)" value={fmt(loanAmount)} />
                <Row label="Total Interest Paid" value={fmt(result.totalInterest)} neg />
                <Row label="Total Repayment" value={fmt(result.totalRepayment)} border />
                {includeProcessingFee && result.processingFee > 0 && <>
                  <Row label="Processing Fee (1.05%)" value={fmt(result.processingFee)} neg />
                  <Row label="VAT on Fee (5%)" value={fmt(result.processingFeeVAT)} neg />
                  <Row label="Total Cost of Finance" value={fmt(result.totalCost)} highlight border />
                </>}
                {salary && <>
                  <Row label="Debt Burden Ratio (DBR)" value={`${result.dbrPercent.toFixed(1)}%`}
                    neg={result.dbrWarning} highlight={!result.dbrWarning}
                    sub="Central Bank cap: 50%" border />
                  <DBRBar pct={result.dbrPercent} />
                </>}
              </div>
            </div>

            {/* Compare result */}
            {showCompare && cmpResult && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl p-5 text-white">
                  <div className="text-xs opacity-70 mb-0.5 uppercase tracking-wide">
                    Alternative · {cmpRate}% · {cmpTenor}mo
                  </div>
                  <div className="text-sm opacity-75 mb-1">Monthly EMI</div>
                  <div className="text-4xl font-black tabular-nums">{fmt(cmpResult.emi)}</div>
                  <div className={`text-xs mt-1 font-semibold ${cmpResult.emi < result.emi ? 'text-emerald-300' : 'text-red-300'}`}>
                    {cmpResult.emi < result.emi ? '↓ ' : '↑ '}{fmt(Math.abs(cmpResult.emi - result.emi))} / mo vs main
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm">Breakdown</h3>
                  <SplitBar principalPct={100 - cmpResult.interestPct} />
                  <Row label="Total Interest Paid" value={fmt(cmpResult.totalInterest)} neg />
                  <Row label="Total Repayment" value={fmt(cmpResult.totalRepayment)} border />
                  {includeProcessingFee && cmpResult.processingFee > 0 && (
                    <Row label="Total Cost of Finance" value={fmt(cmpResult.totalCost)} highlight border />
                  )}
                  <Row label="vs Main — Interest Saving"
                    value={fmt(Math.abs(result.totalInterest - cmpResult.totalInterest))}
                    highlight={cmpResult.totalInterest < result.totalInterest}
                    neg={cmpResult.totalInterest > result.totalInterest}
                    border
                    sub={cmpResult.totalInterest < result.totalInterest ? 'You save with alternative' : 'Main option is cheaper'} />
                </div>
              </div>
            )}
          </div>

          {/* Amortization table */}
          {result.schedule.length > 0 && (
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">Repayment Schedule</h3>
                <span className="text-xs text-gray-500">{result.schedule.length} months total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Month','Opening Balance','EMI','Interest','Principal','Closing Balance'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleRows?.map((row, i) => (
                      <tr key={row.month} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-3 py-2 font-semibold text-gray-700">{row.month}</td>
                        <td className="px-3 py-2 tabular-nums text-gray-600">{fmt(row.openingBalance)}</td>
                        <td className="px-3 py-2 tabular-nums font-semibold text-red-700">{fmt(row.emi)}</td>
                        <td className="px-3 py-2 tabular-nums text-red-500">{fmt(row.interest)}</td>
                        <td className="px-3 py-2 tabular-nums text-emerald-600">{fmt(row.principal)}</td>
                        <td className="px-3 py-2 tabular-nums text-gray-700">{fmt(row.closingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.schedule.length > 12 && (
                <div className="px-4 py-3 border-t border-gray-200 text-center">
                  <button onClick={() => setShowFullSchedule(v => !v)}
                    className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors">
                    {showFullSchedule ? '↑ Show fewer rows' : `↓ View all ${result.schedule.length} months`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 space-y-1.5">
            <p className="font-semibold text-gray-800">⚖️ Important Disclaimer</p>
            <p>This tool is independent and not affiliated with, endorsed by, or sponsored by Emirates NBD.</p>
            <p>This tool provides illustrative estimates only and is not a loan offer, commitment, or financial advice. Actual Emirates NBD rates, fees, and approval depend on your credit profile, AECB credit score, employment status, salary transfer arrangement, and prevailing market conditions.</p>
            <p>Interest rates shown are indicative, starting from {tab === 'personal' ? PERSONAL_RATE_DEFAULT : CAR_RATE_DEFAULT}% p.a. on a reducing balance basis. A processing fee of 1.05% (plus 5% VAT) and other charges may apply. DBR and eligibility checks are based on UAE Central Bank guidelines (Regulation No. 29/2011).</p>
            <p>Visit <strong>emiratesnbd.com</strong> for official rates, Key Facts Statements, and to apply. Results are for guidance only.</p>
          </div>
        </div>
      )}
    </div>
  )
}
