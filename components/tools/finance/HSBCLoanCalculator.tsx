'use client'

import { useState, useMemo } from 'react'

type Props = { locale: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const PERSONAL_RATE_DEFAULT = 7.0
const PERSONAL_RATE_MIN     = 5.99
const MORTGAGE_RATE_DEFAULT = 4.25
const MORTGAGE_RATE_MIN     = 3.75
const EIBOR_RATE            = 4.85   // illustrative EIBOR — update periodically
const PROCESSING_FEE_RATE   = 0.01   // 1%
const VAT_RATE              = 0.05
const DBR_LIMIT             = 50     // percent

const NATIONALITY_OPTIONS = [
  { value: 'national', label: 'UAE National',   maxPersonal: 1_000_000, ltvFirst: 0.85, ltvAbove5M: 0.70 },
  { value: 'expat',    label: 'Expatriate',      maxPersonal: 750_000,   ltvFirst: 0.80, ltvAbove5M: 0.65 },
]

const PERSONAL_TENURE_OPTIONS = [6, 12, 18, 24, 36, 48]
const MORTGAGE_TENURE_OPTIONS = [5, 10, 15, 20, 25]

const QUICK_PRESETS_PERSONAL = [
  { label: 'AED 50k / 2yr',  amount: 50_000,  tenorM: 24 },
  { label: 'AED 150k / 4yr', amount: 150_000, tenorM: 48 },
  { label: 'AED 500k / 4yr', amount: 500_000, tenorM: 48 },
]
const QUICK_PRESETS_MORTGAGE = [
  { label: 'AED 1M / 20yr',   amount: 1_000_000, propVal: 1_250_000, tenorY: 20 },
  { label: 'AED 2M / 25yr',   amount: 2_000_000, propVal: 2_500_000, tenorY: 25 },
  { label: 'AED 3.5M / 25yr', amount: 3_500_000, propVal: 4_375_000, tenorY: 25 },
]

type TabType = 'personal' | 'mortgage'
type MortgageRateType = 'fixed' | 'eibor'

type AmortRow = {
  month: number
  opening: number
  emi: number
  interest: number
  principal: number
  closing: number
}

type CalcResult = {
  emi: number
  totalRepayment: number
  totalInterest: number
  processingFee: number
  processingFeeVAT: number
  totalCost: number
  principalPct: number
  interestPct: number
  feesPct: number
  dbrPct: number
  dbrWarning: boolean
  salaryWarning: boolean
  ltvPct?: number
  ltvWarning?: boolean
  schedule: AmortRow[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  `AED ${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtShort = (n: number) =>
  n >= 1_000_000 ? `AED ${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `AED ${(n / 1_000).toFixed(0)}k`
  : `AED ${n.toFixed(0)}`

function calcEMI(p: number, annualRate: number, months: number) {
  if (annualRate === 0) return p / months
  const r = annualRate / 100 / 12
  return (p * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function buildSchedule(p: number, annualRate: number, months: number, emi: number): AmortRow[] {
  const r = annualRate / 100 / 12
  const rows: AmortRow[] = []
  let bal = p
  for (let m = 1; m <= months; m++) {
    const interest = bal * r
    const principal = Math.min(emi - interest, bal)
    const closing = Math.max(0, bal - principal)
    rows.push({ month: m, opening: bal, emi, interest, principal, closing })
    bal = closing
    if (bal < 0.01) break
  }
  return rows
}

function compute(
  tab: TabType, amount: number, annualRate: number, months: number,
  salary: number, existingDebts: number, propVal: number, natVal: string,
  includeProcessingFee: boolean,
): CalcResult | null {
  if (!amount || amount <= 0 || !annualRate || !months) return null
  const nat = NATIONALITY_OPTIONS.find(n => n.value === natVal)!
  const emi = calcEMI(amount, annualRate, months)
  const totalRepayment = emi * months
  const totalInterest = totalRepayment - amount
  const processingFee = includeProcessingFee ? amount * PROCESSING_FEE_RATE : 0
  const processingFeeVAT = processingFee * VAT_RATE
  const totalCost = totalRepayment + processingFee + processingFeeVAT

  const totalBase = amount + totalInterest + processingFee + processingFeeVAT
  const principalPct = (amount / totalBase) * 100
  const interestPct  = (totalInterest / totalBase) * 100
  const feesPct      = ((processingFee + processingFeeVAT) / totalBase) * 100

  const dbrPct = salary > 0 ? ((existingDebts + emi) / salary) * 100 : 0
  const dbrWarning = salary > 0 && dbrPct > DBR_LIMIT
  const salaryWarning = salary > 0 && amount > salary * 20  // CBUAE 20x cap

  let ltvPct: number | undefined
  let ltvWarning: boolean | undefined
  if (tab === 'mortgage' && propVal > 0) {
    ltvPct = (amount / propVal) * 100
    const maxLTV = (propVal > 5_000_000 ? nat.ltvAbove5M : nat.ltvFirst) * 100
    ltvWarning = ltvPct > maxLTV
  }

  return {
    emi, totalRepayment, totalInterest, processingFee, processingFeeVAT, totalCost,
    principalPct, interestPct, feesPct, dbrPct, dbrWarning, salaryWarning,
    ltvPct, ltvWarning,
    schedule: buildSchedule(amount, annualRate, months, emi),
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, value, sub, neg, highlight, border }: {
  label: string; value: string; sub?: string; neg?: boolean; highlight?: boolean; border?: boolean
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${border ? 'pt-3 border-t border-gray-200' : ''}`}>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm font-semibold tabular-nums shrink-0 text-right ${highlight ? 'text-emerald-600' : neg ? 'text-red-500' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

function Alert({ text, type = 'warn' }: { text: string; type?: 'warn' | 'info' }) {
  const styles = type === 'warn'
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-blue-50 border-blue-200 text-blue-800'
  return (
    <div className={`flex items-start gap-2 border rounded-xl p-3 text-xs ${styles}`}>
      <span className="mt-0.5 shrink-0">{type === 'warn' ? '⚠️' : 'ℹ️'}</span>
      <span>{text}</span>
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
          type="number" min={min} max={max} step={step ?? 1}
          value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '0'}
          className={`w-full ${prefix ? 'pl-14' : 'pl-4'} pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#DB0011] focus:border-transparent transition bg-white`}
        />
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

// Stacked bar: principal / interest / fees
function CostBar({ principalPct, interestPct, feesPct }: { principalPct: number; interestPct: number; feesPct: number }) {
  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-3">
        <div className="bg-[#DB0011] transition-all duration-500" style={{ width: `${principalPct}%` }} title="Principal" />
        <div className="bg-[#f77] transition-all duration-500"   style={{ width: `${interestPct}%` }}  title="Interest"  />
        <div className="bg-gray-300 transition-all duration-500" style={{ width: `${feesPct}%` }}      title="Fees"      />
      </div>
      <div className="flex gap-4 mt-1.5 flex-wrap">
        {[
          { label: `Principal ${principalPct.toFixed(0)}%`, color: 'bg-[#DB0011]' },
          { label: `Interest ${interestPct.toFixed(0)}%`,  color: 'bg-[#f77]' },
          { label: `Fees ${feesPct.toFixed(1)}%`,          color: 'bg-gray-300' },
        ].map(({ label, color }) => (
          <span key={label} className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color} inline-block`} />{label}
          </span>
        ))}
      </div>
    </div>
  )
}

// DBR progress bar
function DBRBar({ pct }: { pct: number }) {
  const capped = Math.min(pct, 100)
  const color = pct > DBR_LIMIT ? 'bg-red-500' : pct > 35 ? 'bg-amber-400' : 'bg-emerald-500'
  return (
    <div className="mt-2">
      <div className="relative h-2.5 bg-gray-100 rounded-full overflow-visible">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${capped}%` }} />
        {/* 50% marker */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-gray-500 rounded" style={{ left: '50%' }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">0%</span>
        <span className="text-xs text-gray-500 font-semibold">50% limit</span>
        <span className="text-xs text-gray-500">100%</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HSBCLoanCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [tab, setTab]               = useState<TabType>('personal')
  const [nationality, setNationality] = useState('expat')
  const [salaryTransfer, setSalaryTransfer] = useState(true)

  // Personal
  const [pAmount, setPAmount] = useState('')
  const [pTenorM, setPTenorM] = useState('48')
  const [pRate,   setPRate]   = useState(String(PERSONAL_RATE_DEFAULT))

  // Mortgage
  const [mPropVal,   setMPropVal]   = useState('')
  const [mDownPct,   setMDownPct]   = useState('20')
  const [mTenorY,    setMTenorY]    = useState('20')
  const [mRate,      setMRate]      = useState(String(MORTGAGE_RATE_DEFAULT))
  const [mRateType,  setMRateType]  = useState<MortgageRateType>('fixed')

  // Shared optional
  const [salary,        setSalary]        = useState('')
  const [existingDebts, setExistingDebts] = useState('')
  const [includeProcessingFee, setIncludeProcessingFee] = useState(true)

  // UI
  const [showFullSchedule, setShowFullSchedule] = useState(false)
  const [showEligibility,  setShowEligibility]  = useState(false)

  const nat = NATIONALITY_OPTIONS.find(n => n.value === nationality)!

  // Derived values
  const propVal     = parseFloat(mPropVal) || 0
  const downPct     = parseFloat(mDownPct) || 20
  const mLoanAmount = propVal * (1 - downPct / 100)

  const effectiveMortgageRate = mRateType === 'eibor'
    ? EIBOR_RATE + parseFloat(mRate) || EIBOR_RATE + 1.5
    : parseFloat(mRate) || MORTGAGE_RATE_DEFAULT

  const loanAmount  = tab === 'personal' ? parseFloat(pAmount) || 0 : mLoanAmount
  const annualRate  = tab === 'personal' ? parseFloat(pRate) || PERSONAL_RATE_DEFAULT : effectiveMortgageRate
  const months      = tab === 'personal' ? parseInt(pTenorM) || 48 : (parseInt(mTenorY) || 20) * 12

  const result = useMemo(() => compute(
    tab, loanAmount, annualRate, months,
    parseFloat(salary) || 0,
    parseFloat(existingDebts) || 0,
    propVal, nationality, includeProcessingFee,
  ), [tab, loanAmount, annualRate, months, salary, existingDebts, propVal, nationality, includeProcessingFee])

  // Quick eligibility
  const salaryNum = parseFloat(salary) || 0
  const eligible = salaryNum >= 7_500 && parseInt(pTenorM) <= 48 && loanAmount <= nat.maxPersonal
  const eligibilityLabel = !salary ? 'Enter salary above to check' : eligible ? '✅ Likely eligible' : '❌ May not qualify — check with HSBC'
  const eligibilityColor = !salary ? 'text-gray-500' : eligible ? 'text-emerald-600' : 'text-red-500'

  function applyPersonalPreset(p: typeof QUICK_PRESETS_PERSONAL[0]) {
    setPAmount(String(p.amount)); setPTenorM(String(p.tenorM)); setPRate(String(PERSONAL_RATE_DEFAULT))
  }
  function applyMortgagePreset(p: typeof QUICK_PRESETS_MORTGAGE[0]) {
    setMPropVal(String(p.propVal))
    setMDownPct(String(Math.round((1 - p.amount / p.propVal) * 100)))
    setMTenorY(String(p.tenorY))
    setMRate(String(MORTGAGE_RATE_DEFAULT))
    setMRateType('fixed')
  }
  function reset() {
    setPAmount(''); setPTenorM('48'); setPRate(String(PERSONAL_RATE_DEFAULT))
    setMPropVal(''); setMDownPct('20'); setMTenorY('20'); setMRate(String(MORTGAGE_RATE_DEFAULT)); setMRateType('fixed')
    setSalary(''); setExistingDebts(''); setShowFullSchedule(false); setShowEligibility(false)
  }

  const scheduleRows = showFullSchedule ? result?.schedule : result?.schedule.slice(0, 12)

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Tab ── */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {([['personal', '💳 Personal Loan'], ['mortgage', '🏠 Home Loan / Mortgage']] as [TabType, string][]).map(([t, label]) => (
          <button key={t}
            onClick={() => { setTab(t); setShowFullSchedule(false) }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === t ? 'bg-white text-[#DB0011] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Nationality ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nationality / Residency</label>
        <div className="flex gap-2 flex-wrap">
          {NATIONALITY_OPTIONS.map(n => (
            <button key={n.value} onClick={() => setNationality(n.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                nationality === n.value ? 'bg-[#DB0011] text-white border-[#DB0011]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0011]/40'
              }`}>
              {n.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">Max personal loan {fmtShort(nat.maxPersonal)} · Min salary AED 7,500 (HSBC)</p>
      </div>

      {/* ── Salary transfer ── */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div onClick={() => setSalaryTransfer(v => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${salaryTransfer ? 'bg-[#DB0011]' : 'bg-gray-300'}`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${salaryTransfer ? 'translate-x-5' : ''}`} />
        </div>
        <span className="text-sm text-gray-600">
          Salary Transfer to HSBC
          <span className={`ml-1.5 text-xs font-medium ${salaryTransfer ? 'text-emerald-600' : 'text-gray-500'}`}>
            {salaryTransfer ? '✓ May qualify for lower rates' : 'Standard rates apply'}
          </span>
        </span>
      </label>

      {/* ── PERSONAL LOAN ── */}
      {tab === 'personal' && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quick scenarios</p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_PRESETS_PERSONAL.map(p => (
                <button key={p.label} onClick={() => applyPersonalPreset(p)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-red-50 hover:border-[#DB0011]/40 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <NumInput label="Loan Amount (AED)" value={pAmount} onChange={setPAmount}
                prefix="AED" min={10000} max={nat.maxPersonal}
                hint={`HSBC UAE: AED 10,000 – ${fmtShort(nat.maxPersonal)} for ${nat.label}s`} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loan Term</label>
              <div className="flex gap-1.5 flex-wrap">
                {PERSONAL_TENURE_OPTIONS.map(m => (
                  <button key={m} onClick={() => setPTenorM(String(m))}
                    className={`flex-1 min-w-[48px] py-2 text-xs font-semibold rounded-lg border transition-all ${
                      pTenorM === String(m) ? 'bg-[#DB0011] text-white border-[#DB0011]' : 'border-gray-200 text-gray-600 hover:border-[#DB0011]/40'
                    }`}>
                    {m}mo
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Max 48 months (CBUAE)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Annual Rate (% — Reducing Balance)
              </label>
              <input type="number" min={PERSONAL_RATE_MIN} max={30} step={0.01}
                value={pRate} onChange={e => setPRate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#DB0011] transition bg-white" />
              <p className="text-xs text-gray-500 mt-1">
                HSBC from {PERSONAL_RATE_MIN}% · {salaryTransfer ? 'Salary transfer may lower your rate' : 'Rate may be higher without salary transfer'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── MORTGAGE ── */}
      {tab === 'mortgage' && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quick scenarios</p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_PRESETS_MORTGAGE.map(p => (
                <button key={p.label} onClick={() => applyMortgagePreset(p)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-red-50 hover:border-[#DB0011]/40 transition-colors">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <NumInput label="Property Value (AED)" value={mPropVal} onChange={setMPropVal}
                prefix="AED" min={350000} hint="Enter the agreed purchase price of the property" />
            </div>
            <NumInput label="Down Payment (%)" value={mDownPct} onChange={setMDownPct}
              min={15} max={60} step={1}
              hint={`Min ${nationality === 'national' ? '15' : '20'}% for ${nat.label}s · Max LTV ${(nat.ltvFirst * 100).toFixed(0)}%`} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Finance Amount (AED)</label>
              <div className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm font-semibold text-[#DB0011] bg-red-50">
                {mLoanAmount > 0 ? fmt(mLoanAmount) : '—'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Auto-calculated from property value & down payment</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loan Term</label>
              <div className="flex gap-1.5 flex-wrap">
                {MORTGAGE_TENURE_OPTIONS.map(y => (
                  <button key={y} onClick={() => setMTenorY(String(y))}
                    className={`flex-1 min-w-[36px] py-2 text-xs font-semibold rounded-lg border transition-all ${
                      mTenorY === String(y) ? 'bg-[#DB0011] text-white border-[#DB0011]' : 'border-gray-200 text-gray-600 hover:border-[#DB0011]/40'
                    }`}>
                    {y}yr
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Max 25 years (CBUAE)</p>
            </div>

            {/* Rate type */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rate Type</label>
              <div className="flex gap-2 mb-3">
                {([['fixed', 'Fixed Rate'], ['eibor', 'EIBOR + Margin']] as [MortgageRateType, string][]).map(([rt, label]) => (
                  <button key={rt} onClick={() => setMRateType(rt)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      mRateType === rt ? 'bg-[#DB0011] text-white border-[#DB0011]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#DB0011]/40'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              {mRateType === 'fixed' ? (
                <>
                  <input type="number" min={MORTGAGE_RATE_MIN} max={12} step={0.01}
                    value={mRate} onChange={e => setMRate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#DB0011] transition bg-white" />
                  <p className="text-xs text-gray-500 mt-1">HSBC UAE fixed rates from {MORTGAGE_RATE_MIN}% p.a.</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-3 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-600 whitespace-nowrap">
                      EIBOR {EIBOR_RATE}% +
                    </div>
                    <input type="number" min={0.5} max={5} step={0.01}
                      value={mRate} onChange={e => setMRate(e.target.value)} placeholder="Margin %"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#DB0011] transition bg-white" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Effective rate: {effectiveMortgageRate.toFixed(2)}% p.a. · EIBOR is variable and will change over time.
                  </p>
                  <Alert type="info" text={`EIBOR (Emirates Interbank Offered Rate) rate shown is illustrative (${EIBOR_RATE}%). Your actual rate will fluctuate with EIBOR changes. Monthly repayments on variable-rate mortgages can increase significantly.`} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Affordability ── */}
      <div className="border-t border-dashed border-gray-200 pt-5">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Affordability & DBR Check (Optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumInput label="Gross Monthly Income (AED)" value={salary} onChange={setSalary}
            prefix="AED" min={7500} hint="HSBC UAE minimum ~AED 7,500 (selected segments)" />
          <NumInput label="Existing Monthly Debts (AED)" value={existingDebts} onChange={setExistingDebts}
            prefix="AED" hint="Other loan EMIs, credit card minimums" />
        </div>
      </div>

      {/* Eligibility quick check */}
      <div className="border border-gray-200 rounded-xl p-4">
        <button onClick={() => setShowEligibility(v => !v)}
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-700">
          <span>🔍 Quick Eligibility Check</span>
          <span className="text-gray-500">{showEligibility ? '▲' : '▼'}</span>
        </button>
        {showEligibility && (
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Min salary (AED 7,500)</span>
              <span className={salaryNum >= 7_500 || !salary ? (salary ? 'text-emerald-600' : 'text-gray-500') : 'text-red-500'}>
                {!salary ? '—' : salaryNum >= 7_500 ? '✅ Met' : '❌ Below minimum'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max loan amount</span>
              <span className={!loanAmount || loanAmount <= nat.maxPersonal ? 'text-emerald-600' : 'text-red-500'}>
                {!loanAmount ? '—' : loanAmount <= nat.maxPersonal ? `✅ Within limit (${fmtShort(nat.maxPersonal)})` : '❌ Exceeds limit'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tenure limit (≤ 48 months)</span>
              <span className={tab === 'mortgage' || parseInt(pTenorM) <= 48 ? 'text-emerald-600' : 'text-red-500'}>
                {tab === 'mortgage' ? 'N/A (mortgage rules apply)' : parseInt(pTenorM) <= 48 ? '✅ Within limit' : '❌ Exceeds 48 months'}
              </span>
            </div>
            <div className={`font-semibold mt-2 pt-2 border-t border-gray-100 ${eligibilityColor}`}>
              {eligibilityLabel}
            </div>
            <p className="text-xs text-gray-500">This is a rough guide only. HSBC's actual eligibility assessment includes credit score, employment type, liabilities, and other factors.</p>
          </div>
        )}
      </div>

      {/* Toggles */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div onClick={() => setIncludeProcessingFee(v => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${includeProcessingFee ? 'bg-[#DB0011]' : 'bg-gray-300'}`}>
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${includeProcessingFee ? 'translate-x-5' : ''}`} />
        </div>
        <span className="text-sm text-gray-600">Include HSBC processing fee (1% + 5% VAT) in total cost</span>
      </label>

      <div className="flex justify-end">
        <button onClick={reset}
          className="px-5 py-2 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl transition-colors">
          Reset All
        </button>
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <div className="space-y-4">
          {result.dbrWarning     && salary && <Alert text={`Your estimated DBR is ${result.dbrPct.toFixed(1)}% — above the CBUAE's 50% limit. Consider a lower loan amount or longer term.`} />}
          {result.salaryWarning  && salary && <Alert text={`Loan amount exceeds 20× your monthly income — the CBUAE regulatory cap. Please reduce the loan amount.`} />}
          {result.ltvWarning     && tab === 'mortgage' && <Alert text={`Loan-to-Value (${result.ltvPct?.toFixed(1)}%) exceeds the CBUAE limit for ${nat.label}s. Increase your down payment.`} />}
          {mRateType === 'eibor' && tab === 'mortgage' && <Alert type="info" text="Variable-rate mortgage: your actual monthly repayment will change as EIBOR moves. The estimate shown uses today's illustrative EIBOR rate." />}

          {/* Hero */}
          <div className="bg-gradient-to-br from-[#DB0011] to-[#a8000d] rounded-2xl p-5 text-white">
            <div className="text-xs opacity-70 mb-0.5 uppercase tracking-wide">
              {tab === 'personal' ? 'Personal Loan' : 'Home Loan'} · {annualRate.toFixed(2)}% · {months}mo
            </div>
            <div className="text-sm opacity-75 mb-1">Monthly {tab === 'mortgage' ? 'Repayment' : 'EMI'}</div>
            <div className="text-4xl font-black tabular-nums">{fmt(result.emi)}</div>
            <div className="text-xs opacity-60 mt-1">Reducing balance method · Indicative only</div>
          </div>

          {/* Breakdown */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Cost Breakdown</h3>
            <CostBar principalPct={result.principalPct} interestPct={result.interestPct} feesPct={result.feesPct} />
            <Row label="Loan Amount (Principal)" value={fmt(loanAmount)} />
            <Row label="Total Interest Paid" value={fmt(result.totalInterest)} neg
              sub={`${((result.totalInterest / loanAmount) * 100).toFixed(1)}% of principal`} />
            <Row label="Total Repayment" value={fmt(result.totalRepayment)} border />
            {includeProcessingFee && result.processingFee > 0 && <>
              <Row label="Processing Fee (1%)" value={fmt(result.processingFee)} neg />
              <Row label="VAT on Fee (5%)"     value={fmt(result.processingFeeVAT)} neg />
              <Row label="Total Cost of Finance" value={fmt(result.totalCost)} highlight border />
            </>}
            {tab === 'mortgage' && result.ltvPct !== undefined && (
              <Row label="Loan-to-Value (LTV)" value={`${result.ltvPct.toFixed(1)}%`}
                neg={result.ltvWarning} highlight={!result.ltvWarning}
                sub={`Max for ${nat.label}: ${(nat.ltvFirst * 100).toFixed(0)}%`} border />
            )}
          </div>

          {/* DBR */}
          {salary && (
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Debt Burden Ratio (DBR)</h3>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Your estimated DBR</span>
                <span className={`text-sm font-bold tabular-nums ${result.dbrWarning ? 'text-red-500' : 'text-emerald-600'}`}>
                  {result.dbrPct.toFixed(1)}%
                </span>
              </div>
              <DBRBar pct={result.dbrPct} />
              <p className="text-xs text-gray-500 mt-2">UAE Central Bank cap: 50% of gross monthly income (all debts combined)</p>
            </div>
          )}

          {/* Amortization */}
          {result.schedule.length > 0 && (
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">Repayment Schedule</h3>
                <span className="text-xs text-gray-500">{result.schedule.length} monthly payments</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Month','Opening Balance','Payment','Interest','Principal','Closing Balance'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleRows?.map((row, i) => (
                      <tr key={row.month} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-3 py-2 font-semibold text-gray-700">{row.month}</td>
                        <td className="px-3 py-2 tabular-nums text-gray-600">{fmt(row.opening)}</td>
                        <td className="px-3 py-2 tabular-nums font-semibold text-[#DB0011]">{fmt(row.emi)}</td>
                        <td className="px-3 py-2 tabular-nums text-red-400">{fmt(row.interest)}</td>
                        <td className="px-3 py-2 tabular-nums text-emerald-600">{fmt(row.principal)}</td>
                        <td className="px-3 py-2 tabular-nums text-gray-700">{fmt(row.closing)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {result.schedule.length > 12 && (
                <div className="px-4 py-3 border-t border-gray-200 text-center">
                  <button onClick={() => setShowFullSchedule(v => !v)}
                    className="text-sm text-[#DB0011] hover:text-red-800 font-medium transition-colors">
                    {showFullSchedule ? '↑ Show fewer rows' : `↓ View all ${result.schedule.length} months`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600 space-y-2">
            <p className="font-semibold text-gray-800">⚖️ Important Disclaimer</p>
            <p>This tool is independent and not affiliated with, endorsed by, or sponsored by HSBC. It is an indicative calculator for illustration purposes only. It does not constitute a quote, offer, approval, or financial advice. Actual HSBC UAE rates, fees, eligibility, and repayment amounts depend on your individual credit profile, AECB credit score, employment type, salary transfer status, and HSBC's prevailing terms and conditions.</p>
            <p>Personal loan rates shown are indicative, starting from {PERSONAL_RATE_MIN}% p.a. (reducing balance). Mortgage rates start from {MORTGAGE_RATE_MIN}% p.a. A processing fee of approximately 1% (plus 5% UAE VAT) applies. For EIBOR-linked mortgages, monthly repayments will vary as EIBOR changes.</p>
            <p>DBR and LTV checks are based on UAE Central Bank regulatory guidelines. Minimum monthly income for HSBC UAE personal loans is approximately AED 7,500. Visit <strong>hsbc.ae</strong> or contact HSBC directly for personalised quotations and formal product terms.</p>
          </div>
        </div>
      )}
    </div>
  )
}
