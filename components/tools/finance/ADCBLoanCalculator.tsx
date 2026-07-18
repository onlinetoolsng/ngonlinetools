'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = { locale: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const PERSONAL_RATE_MIN = 5.99
const PERSONAL_RATE_DEFAULT = 7.25
const MORTGAGE_RATE_MIN = 3.99
const MORTGAGE_RATE_DEFAULT = 4.49
const PROCESSING_FEE_RATE = 0.0105 // 1.05%
const DBR_LIMIT = 0.50             // 50% Central Bank cap
const VAT_RATE = 0.05              // 5% VAT on fees

const NATIONALITY_OPTIONS = [
  { value: 'national',    label: 'UAE National',   loanMultiple: 20, maxPersonal: 4_000_000, ltvFirst: 0.85, ltvAbove5M: 0.70 },
  { value: 'expat',       label: 'Expatriate',     loanMultiple: 15, maxPersonal: 2_000_000, ltvFirst: 0.80, ltvAbove5M: 0.65 },
  { value: 'nonresident', label: 'Non-Resident',   loanMultiple: 8,  maxPersonal: 750_000,   ltvFirst: 0.60, ltvAbove5M: 0.50 },
]

const QUICK_PRESETS_PERSONAL = [
  { label: 'AED 50k / 2yr',  amount: 50_000,  tenor: 24 },
  { label: 'AED 100k / 4yr', amount: 100_000, tenor: 48 },
  { label: 'AED 250k / 4yr', amount: 250_000, tenor: 48 },
]

const QUICK_PRESETS_MORTGAGE = [
  { label: 'AED 1M / 15yr',   amount: 1_000_000, tenor: 180, propValue: 1_250_000 },
  { label: 'AED 2M / 20yr',   amount: 2_000_000, tenor: 240, propValue: 2_500_000 },
  { label: 'AED 3.5M / 25yr', amount: 3_500_000, tenor: 300, propValue: 4_375_000 },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = 'personal' | 'mortgage'

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
  dbrPercent: number
  dbrWarning: boolean
  ltv?: number
  ltvWarning?: boolean
  schedule: AmortRow[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `AED ${(n / 1_000).toFixed(1)}k`
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
    const principalPaid = emi - interest
    const closing = Math.max(0, balance - principalPaid)
    rows.push({ month: m, openingBalance: balance, emi, interest, principal: principalPaid, closingBalance: closing })
    balance = closing
  }
  return rows
}

function calculate(
  tab: TabType,
  loanAmount: number,
  annualRate: number,
  tenorMonths: number,
  monthlySalary: number,
  existingDebts: number,
  propertyValue: number,
  nationalityValue: string,
  includeProcessingFee: boolean,
): CalcResult | null {
  if (!loanAmount || !annualRate || !tenorMonths) return null
  const nat = NATIONALITY_OPTIONS.find(n => n.value === nationalityValue)!

  const emi = calcEMI(loanAmount, annualRate, tenorMonths)
  const totalRepayment = emi * tenorMonths
  const totalInterest = totalRepayment - loanAmount
  const processingFee = includeProcessingFee ? loanAmount * PROCESSING_FEE_RATE : 0
  const processingFeeVAT = processingFee * VAT_RATE

  const dbrPercent = monthlySalary > 0 ? ((existingDebts + emi) / monthlySalary) * 100 : 0
  const dbrWarning = dbrPercent > DBR_LIMIT * 100

  let ltv: number | undefined
  let ltvWarning: boolean | undefined
  if (tab === 'mortgage' && propertyValue > 0) {
    ltv = (loanAmount / propertyValue) * 100
    const maxLTV = propertyValue > 5_000_000 ? nat.ltvAbove5M * 100 : nat.ltvFirst * 100
    ltvWarning = ltv > maxLTV
  }

  const schedule = buildSchedule(loanAmount, annualRate, tenorMonths, emi)
  return { emi, totalRepayment, totalInterest, processingFee, processingFeeVAT, dbrPercent, dbrWarning, ltv, ltvWarning, schedule }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, value, sub, neg, highlight, border }: {
  label: string; value: string; sub?: string; neg?: boolean; highlight?: boolean; border?: boolean
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${border ? 'pt-3 border-t border-gray-200' : ''}`}>
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        {sub && <div className="text-xs text-gray-500">{sub}</div>}
      </div>
      <span className={`text-sm font-semibold tabular-nums text-right ${highlight ? 'text-emerald-600' : neg ? 'text-red-500' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

function Warning({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
      <span className="mt-0.5 shrink-0">⚠️</span>
      <span>{text}</span>
    </div>
  )
}

function NumInput({ label, value, onChange, prefix, min, max, step, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void
  prefix?: string; min?: number; max?: number; step?: number; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 pointer-events-none">{prefix}</span>
        )}
        <input
          type="number"
          min={min}
          max={max}
          step={step ?? 1}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '0'}
          className={`w-full ${prefix ? 'pl-14' : 'pl-4'} pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white`}
        />
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ADCBLoanCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  // Tab
  const [tab, setTab] = useState<TabType>('personal')

  // Shared inputs
  const [nationality, setNationality] = useState('expat')
  const [salary, setSalary] = useState('')
  const [existingDebts, setExistingDebts] = useState('')
  const [includeProcessingFee, setIncludeProcessingFee] = useState(true)

  // Personal loan
  const [pLoanAmount, setPLoanAmount] = useState('')
  const [pTenorYears, setPTenorYears] = useState('4')
  const [pRate, setPRate] = useState(String(PERSONAL_RATE_DEFAULT))

  // Mortgage
  const [mPropertyValue, setMPropertyValue] = useState('')
  const [mDownPaymentPct, setMDownPaymentPct] = useState('20')
  const [mTenorYears, setMTenorYears] = useState('20')
  const [mRate, setMRate] = useState(String(MORTGAGE_RATE_DEFAULT))

  // Schedule
  const [showFullSchedule, setShowFullSchedule] = useState(false)
  const [result, setResult] = useState<CalcResult | null>(null)

  const nat = NATIONALITY_OPTIONS.find(n => n.value === nationality)!

  // Derived mortgage loan amount
  const mPropertyVal = parseFloat(mPropertyValue) || 0
  const mDownPct = parseFloat(mDownPaymentPct) || 20
  const mLoanAmount = mPropertyVal * (1 - mDownPct / 100)

  const tenorMonths = tab === 'personal'
    ? Math.round(parseFloat(pTenorYears) * 12) || 48
    : Math.round(parseFloat(mTenorYears) * 12) || 240

  // Recalculate on every input change
  useEffect(() => {
    const loanAmt = tab === 'personal' ? parseFloat(pLoanAmount) || 0 : mLoanAmount
    const rate = tab === 'personal' ? parseFloat(pRate) || PERSONAL_RATE_DEFAULT : parseFloat(mRate) || MORTGAGE_RATE_DEFAULT
    const propVal = tab === 'mortgage' ? mPropertyVal : 0

    const res = calculate(
      tab, loanAmt, rate, tenorMonths,
      parseFloat(salary) || 0,
      parseFloat(existingDebts) || 0,
      propVal, nationality,
      includeProcessingFee,
    )
    setResult(res)
  }, [tab, pLoanAmount, pTenorYears, pRate, mPropertyValue, mDownPaymentPct, mTenorYears, mRate, salary, existingDebts, nationality, includeProcessingFee])

  // Preset loaders
  function applyPersonalPreset(p: typeof QUICK_PRESETS_PERSONAL[0]) {
    setPLoanAmount(String(p.amount))
    setPTenorYears(String(p.tenor / 12))
    setPRate(String(PERSONAL_RATE_DEFAULT))
  }

  function applyMortgagePreset(p: typeof QUICK_PRESETS_MORTGAGE[0]) {
    setMPropertyValue(String(p.propValue))
    const downPct = Math.round((1 - p.amount / p.propValue) * 100)
    setMDownPaymentPct(String(downPct))
    setMTenorYears(String(p.tenor / 12))
    setMRate(String(MORTGAGE_RATE_DEFAULT))
  }

  function reset() {
    setPLoanAmount(''); setPTenorYears('4'); setPRate(String(PERSONAL_RATE_DEFAULT))
    setMPropertyValue(''); setMDownPaymentPct('20'); setMTenorYears('20'); setMRate(String(MORTGAGE_RATE_DEFAULT))
    setSalary(''); setExistingDebts(''); setResult(null); setShowFullSchedule(false)
  }

  // Schedule display
  const scheduleRows = showFullSchedule ? result?.schedule : result?.schedule.slice(0, 12)

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {(['personal', 'mortgage'] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setResult(null); setShowFullSchedule(false) }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'personal' ? '🏦 Personal Loan' : '🏠 Mortgage / Home Loan'}
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
                nationality === n.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          Affects max loan ({nat.loanMultiple}× salary), LTV, and eligibility limits.
        </p>
      </div>

      {/* ── PERSONAL LOAN INPUTS ── */}
      {tab === 'personal' && (
        <div className="space-y-5">
          {/* Quick presets */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quick scenarios</p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_PRESETS_PERSONAL.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPersonalPreset(p)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <NumInput
                label="Loan Amount (AED)"
                value={pLoanAmount}
                onChange={setPLoanAmount}
                prefix="AED"
                min={5000}
                max={nat.maxPersonal}
                hint={`Max for ${nat.label}: ${fmtShort(nat.maxPersonal)} · Min salary AED 5,000`}
              />
            </div>
            <NumInput
              label="Tenor (Years)"
              value={pTenorYears}
              onChange={setPTenorYears}
              min={0.5}
              max={4}
              step={0.5}
              hint="Personal loans: up to 4 years (48 months)"
            />
            <NumInput
              label="Annual Interest Rate (%)"
              value={pRate}
              onChange={setPRate}
              min={PERSONAL_RATE_MIN}
              max={24}
              step={0.01}
              hint={`ADCB from ${PERSONAL_RATE_MIN}% · Varies by profile`}
            />
          </div>
        </div>
      )}

      {/* ── MORTGAGE INPUTS ── */}
      {tab === 'mortgage' && (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quick scenarios</p>
            <div className="flex gap-2 flex-wrap">
              {QUICK_PRESETS_MORTGAGE.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyMortgagePreset(p)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <NumInput
                label="Property Value (AED)"
                value={mPropertyValue}
                onChange={setMPropertyValue}
                prefix="AED"
                min={100000}
                hint="Enter the full property purchase price"
              />
            </div>
            <NumInput
              label="Down Payment (%)"
              value={mDownPaymentPct}
              onChange={setMDownPaymentPct}
              min={15}
              max={50}
              step={1}
              hint={`Min ${nationality === 'national' ? '15%' : '20%'} for ${nat.label} · Max LTV ${mPropertyVal > 5_000_000 ? nat.ltvAbove5M * 100 : nat.ltvFirst * 100}%`}
            />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loan Amount (AED)</label>
              <div className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50">
                {mLoanAmount > 0 ? fmt(mLoanAmount) : '—'}
              </div>
              <p className="text-xs text-gray-500 mt-1">Auto-calculated from property value & down payment</p>
            </div>
            <NumInput
              label="Tenor (Years)"
              value={mTenorYears}
              onChange={setMTenorYears}
              min={1}
              max={25}
              step={1}
              hint="Mortgage: up to 25 years (UAE Central Bank)"
            />
            <NumInput
              label="Annual Interest Rate (%)"
              value={mRate}
              onChange={setMRate}
              min={MORTGAGE_RATE_MIN}
              max={12}
              step={0.01}
              hint={`ADCB from ${MORTGAGE_RATE_MIN}% · Fixed or variable`}
            />
          </div>
        </div>
      )}

      {/* Salary & DBR */}
      <div className="border-t border-dashed border-gray-200 pt-5">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
          Affordability Check (Optional)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumInput
            label="Gross Monthly Salary (AED)"
            value={salary}
            onChange={setSalary}
            prefix="AED"
            min={5000}
            hint="Used to calculate Debt Burden Ratio (DBR)"
          />
          <NumInput
            label="Existing Monthly Debts (AED)"
            value={existingDebts}
            onChange={setExistingDebts}
            prefix="AED"
            hint="Other loan repayments, credit card minimums"
          />
        </div>
      </div>

      {/* Toggle: include processing fee */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          onClick={() => setIncludeProcessingFee(v => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${includeProcessingFee ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${includeProcessingFee ? 'translate-x-5' : ''}`} />
        </div>
        <span className="text-sm text-gray-600">Include ADCB processing fee (1.05% + 5% VAT) in total cost</span>
      </label>

      {/* Reset */}
      <div className="flex justify-end">
        <button
          onClick={reset}
          className="px-5 py-2 text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium rounded-xl transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <div className="space-y-4">
          {/* Warnings */}
          {result.dbrWarning && salary && (
            <Warning text={`DBR is ${result.dbrPercent.toFixed(1)}% — exceeds the UAE Central Bank's 50% limit. Consider a lower loan amount or longer tenor.`} />
          )}
          {result.ltvWarning && tab === 'mortgage' && (
            <Warning text={`Loan-to-Value (${result.ltv?.toFixed(1)}%) may exceed ADCB's limit for ${nat.label}. Increase your down payment.`} />
          )}

          {/* Hero EMI */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
            <div className="text-sm opacity-75 mb-1">Monthly EMI / Instalment</div>
            <div className="text-4xl font-black tabular-nums">{fmt(result.emi)}</div>
            <div className="text-xs opacity-60 mt-1">Reducing balance method · Illustrative only</div>
          </div>

          {/* Summary breakdown */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm">Summary</h3>
            <Row label="Loan Amount (Principal)" value={fmt(tab === 'personal' ? parseFloat(pLoanAmount) || 0 : mLoanAmount)} />
            <Row label="Total Interest Paid" value={fmt(result.totalInterest)} neg />
            <Row label="Total Repayment" value={fmt(result.totalRepayment)} border />
            {includeProcessingFee && result.processingFee > 0 && (
              <>
                <Row label="Processing Fee (1.05%)" value={fmt(result.processingFee)} neg />
                <Row label="VAT on Fee (5%)" value={fmt(result.processingFeeVAT)} neg />
                <Row label="Total Cost of Finance" value={fmt(result.totalRepayment + result.processingFee + result.processingFeeVAT)} highlight border />
              </>
            )}
            {salary && (
              <Row
                label="Debt Burden Ratio (DBR)"
                value={`${result.dbrPercent.toFixed(1)}%`}
                neg={result.dbrWarning}
                highlight={!result.dbrWarning}
                border
                sub="Central Bank limit: 50%"
              />
            )}
            {tab === 'mortgage' && result.ltv !== undefined && (
              <Row label="Loan-to-Value (LTV)" value={`${result.ltv.toFixed(1)}%`} neg={result.ltvWarning} highlight={!result.ltvWarning} />
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
                      {['Month', 'Opening Balance', 'EMI', 'Interest', 'Principal', 'Closing Balance'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleRows?.map((row, i) => (
                      <tr key={row.month} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-3 py-2 font-semibold text-gray-700">{row.month}</td>
                        <td className="px-3 py-2 tabular-nums text-gray-600">{fmt(row.openingBalance)}</td>
                        <td className="px-3 py-2 tabular-nums font-semibold text-blue-700">{fmt(row.emi)}</td>
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
                  <button
                    onClick={() => setShowFullSchedule(v => !v)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {showFullSchedule ? '↑ Show fewer rows' : `↓ View all ${result.schedule.length} months`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-900 space-y-1.5">
            <p className="font-semibold">⚖️ Important Disclaimer</p>
            <p>This calculator provides illustrative estimates only. Actual rates, approval, fees, and terms depend on ADCB's credit assessment, AECB credit bureau check, documentation, and prevailing market conditions.</p>
            <p>Processing fee of 1.05% (plus 5% VAT) and other charges may apply. Rates shown are indicative — starting from {tab === 'personal' ? PERSONAL_RATE_MIN : MORTGAGE_RATE_MIN}% p.a. and subject to change.</p>
            <p>This tool is independent and not affiliated with, endorsed by, or sponsored by ADCB.</p>
            <p>DBR and LTV checks are based on UAE Central Bank guidelines. This tool is not a loan offer or commitment by ADCB. Visit <strong>adcb.com</strong> or contact ADCB directly for a personalised quote.</p>
          </div>
        </div>
      )}
    </div>
  )
}
