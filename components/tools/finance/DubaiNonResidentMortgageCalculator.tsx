'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = { locale: string }

// ─── Types ────────────────────────────────────────────────────────────────────

type EmploymentType = 'salaried' | 'self-employed'

type AmortizationRow = {
  year: number
  openingBalance: number
  annualPayment: number
  principalPaid: number
  interestPaid: number
  closingBalance: number
}

type Result = {
  loanAmount: number
  ltv: number
  monthlyEMI: number
  totalRepayment: number
  totalInterest: number
  dbrPct: number
  amortization: AmortizationRow[]
  dldTransferFee: number
  mortgageRegFee: number
  agentFee: number
  valuationFee: number
  totalExtraCosts: number
  totalCashNeeded: number
}

type Scenario = {
  label: string
  rate: number
  term: number
  downPct: number
  emi: number
  totalInterest: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NON_RESIDENT_DEFAULT_DOWN_PCT = 40
const NON_RESIDENT_MAX_LTV = 60   // CBUAE cap; banks often more conservative
const MAX_TENURE = 25
const DLD_TRANSFER_PCT = 0.04
const MORTGAGE_REG_PCT = 0.0025
const MORTGAGE_REG_ADMIN = 290
const AGENT_FEE_PCT = 0.02
const VALUATION_FEE = 3000

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAED(n: number) {
  return `AED ${Math.round(n).toLocaleString('en-US')}`
}

function fmtAEDDec(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(n: number, dp = 1) {
  return `${n.toFixed(dp)}%`
}

function calcEMI(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 12 / 100
  const n = years * 12
  if (r === 0) return principal / n
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function buildAmortization(principal: number, annualRate: number, years: number): AmortizationRow[] {
  const r = annualRate / 12 / 100
  const emi = calcEMI(principal, annualRate, years)
  const rows: AmortizationRow[] = []
  let balance = principal

  for (let y = 1; y <= years; y++) {
    const opening = balance
    let annualPrincipal = 0
    let annualInterest = 0
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break
      const interest = balance * r
      const princ = Math.min(emi - interest, balance)
      annualInterest += interest
      annualPrincipal += princ
      balance = Math.max(0, balance - princ)
    }
    rows.push({
      year: y,
      openingBalance: opening,
      annualPayment: emi * 12,
      principalPaid: annualPrincipal,
      interestPaid: annualInterest,
      closingBalance: balance,
    })
    if (balance <= 0) break
  }
  return rows
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold inline-flex items-center justify-center cursor-help hover:bg-slate-300 transition-colors"
        aria-label="More info"
      >?</button>
      {open && (
        <span className="absolute z-20 bottom-6 left-1/2 -translate-x-1/2 w-60 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-2xl leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  )
}

function LTVGauge({ ltv, maxLtv }: { ltv: number; maxLtv: number }) {
  const pct = Math.min(100, (ltv / 100) * 100)
  const status = ltv > maxLtv ? 'red' : ltv > maxLtv * 0.9 ? 'amber' : 'emerald'
  const barColor = { red: 'bg-red-500', amber: 'bg-amber-400', emerald: 'bg-emerald-500' }[status]
  const textColor = { red: 'text-red-600', amber: 'text-amber-600', emerald: 'text-emerald-600' }[status]
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">LTV Ratio</span>
        <span className={`font-bold ${textColor}`}>{fmtPct(ltv)} / max ~{maxLtv}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      {ltv > maxLtv && (
        <p className="text-xs text-red-500 font-medium">⚠ Exceeds typical non-resident LTV cap (~{maxLtv}%). Increase your down payment.</p>
      )}
    </div>
  )
}

function ResultRow({ label, value, sub, highlight = false, negative = false, bold = false }: {
  label: string; value: string; sub?: string; highlight?: boolean; negative?: boolean; bold?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <div>
        <span className={`text-sm ${bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{label}</span>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm font-semibold whitespace-nowrap ${highlight ? 'text-emerald-600' : negative ? 'text-red-500' : bold ? 'text-slate-900' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  )
}

function ScenarioCard({ s, active, onClick }: { s: Scenario; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-0 rounded-xl p-3 text-left border-2 transition-all ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
    >
      <p className="text-xs font-bold text-slate-500 mb-1 truncate">{s.label}</p>
      <p className="text-base font-black text-slate-900">{fmtAED(s.emi)}<span className="text-xs font-normal text-slate-400">/mo</span></p>
      <p className="text-xs text-slate-500 mt-0.5">Interest: {fmtAED(s.totalInterest)}</p>
      <p className="text-xs text-slate-400">{s.rate}% · {s.term}yr · {s.downPct}% down</p>
    </button>
  )
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function AmortChart({ rows }: { rows: AmortizationRow[] }) {
  const maxVal = Math.max(...rows.map(r => r.annualPayment))
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Annual Repayment — Principal vs Interest</p>
      <div className="flex items-end gap-1 h-24">
        {rows.map(r => {
          const totalH = (r.annualPayment / maxVal) * 100
          const pPct = (r.principalPaid / r.annualPayment) * 100
          return (
            <div key={r.year} className="flex-1 flex flex-col justify-end h-full">
              <div className="w-full rounded-t overflow-hidden" style={{ height: `${totalH}%` }}>
                <div className="bg-emerald-500 w-full" style={{ height: `${pPct}%` }} />
                <div className="bg-sky-300 w-full" style={{ height: `${100 - pPct}%` }} />
              </div>
              {rows.length <= 20 && <span className="text-[8px] text-slate-400 text-center mt-0.5">{r.year}</span>}
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Principal</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-sky-300 inline-block" />Interest</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DubaiNonResidentMortgageCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  // Core inputs
  const [propertyPrice, setPropertyPrice] = useState(2000000)
  const [downPct, setDownPct] = useState(NON_RESIDENT_DEFAULT_DOWN_PCT)
  const [loanTerm, setLoanTerm] = useState(20)
  const [annualRate, setAnnualRate] = useState(5.0)
  const [employmentType, setEmploymentType] = useState<EmploymentType>('salaried')
  const [monthlyIncome, setMonthlyIncome] = useState('')

  // UI state
  const [activeTab, setActiveTab] = useState<'results' | 'amortization' | 'costs' | 'compare'>('results')
  const [activeScenario, setActiveScenario] = useState<number | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  // Derived
  const downPaymentAED = Math.round(propertyPrice * (downPct / 100))
  const loanAmount     = propertyPrice - downPaymentAED
  const ltv            = (loanAmount / propertyPrice) * 100

  const calculate = useCallback(() => {
    if (propertyPrice <= 0 || loanAmount <= 0) return

    const emi           = calcEMI(loanAmount, annualRate, loanTerm)
    const totalRepay    = emi * loanTerm * 12
    const totalInterest = totalRepay - loanAmount

    const income  = parseFloat(monthlyIncome) || 0
    const dbrPct  = income > 0 ? (emi / income) * 100 : 0

    // Extra costs
    const dldTransferFee  = propertyPrice * DLD_TRANSFER_PCT
    const mortgageRegFee  = loanAmount * MORTGAGE_REG_PCT + MORTGAGE_REG_ADMIN
    const agentFee        = propertyPrice * AGENT_FEE_PCT
    const totalExtraCosts = dldTransferFee + mortgageRegFee + agentFee + VALUATION_FEE
    const totalCashNeeded = downPaymentAED + totalExtraCosts

    const amortization = buildAmortization(loanAmount, annualRate, loanTerm)

    setResult({
      loanAmount,
      ltv,
      monthlyEMI: emi,
      totalRepayment: totalRepay,
      totalInterest,
      dbrPct,
      amortization,
      dldTransferFee,
      mortgageRegFee,
      agentFee,
      valuationFee: VALUATION_FEE,
      totalExtraCosts,
      totalCashNeeded,
    })
  }, [propertyPrice, loanAmount, loanTerm, annualRate, monthlyIncome, ltv])

  useEffect(() => {
    const t = setTimeout(calculate, 120)
    return () => clearTimeout(t)
  }, [calculate])

  function resetDefaults() {
    setPropertyPrice(2000000)
    setDownPct(NON_RESIDENT_DEFAULT_DOWN_PCT)
    setLoanTerm(20)
    setAnnualRate(5.0)
    setEmploymentType('salaried')
    setMonthlyIncome('')
    setActiveScenario(null)
    setResult(null)
  }

  // Compare scenarios
  const SCENARIOS: Scenario[] = [
    { label: 'Conservative (40% down, 5%)', rate: 5.0, term: 20, downPct: 40, emi: calcEMI(propertyPrice * 0.60, 5.0, 20), totalInterest: calcEMI(propertyPrice * 0.60, 5.0, 20) * 240 - propertyPrice * 0.60 },
    { label: 'Moderate (35% down, 5.5%)',   rate: 5.5, term: 20, downPct: 35, emi: calcEMI(propertyPrice * 0.65, 5.5, 20), totalInterest: calcEMI(propertyPrice * 0.65, 5.5, 20) * 240 - propertyPrice * 0.65 },
    { label: 'Aggressive (25% down, 6%)',    rate: 6.0, term: 25, downPct: 25, emi: calcEMI(propertyPrice * 0.75, 6.0, 25), totalInterest: calcEMI(propertyPrice * 0.75, 6.0, 25) * 300 - propertyPrice * 0.75 },
  ]

  function applyScenario(idx: number) {
    const s = SCENARIOS[idx]
    setDownPct(s.downPct)
    setAnnualRate(s.rate)
    setLoanTerm(s.term)
    setActiveScenario(idx)
  }

  const dbrStatus = result && result.dbrPct > 0
    ? result.dbrPct <= 35 ? 'emerald' : result.dbrPct <= 50 ? 'amber' : 'red'
    : 'emerald'

  const L = isAr ? {
    propPrice: 'سعر العقار (درهم)',
    down: 'الدفعة الأولى',
    term: 'مدة القرض (سنوات)',
    rate: 'معدل الفائدة السنوي',
    employment: 'نوع التوظيف',
    income: 'الدخل الشهري (درهم) — اختياري',
    reset: 'إعادة التعيين لقيم غير المقيمين',
    emi: 'الدفعة الشهرية',
    loanAmt: 'مبلغ القرض',
    totalRepay: 'إجمالي المبلغ المُسدَّد',
    totalInt: 'إجمالي الفوائد',
    dbr: 'نسبة العبء على الدخل',
    tabRes: 'النتائج', tabAmort: 'جدول الإطفاء', tabCosts: 'التكاليف', tabCompare: 'المقارنة',
    dld: 'رسوم نقل دائرة الأراضي (4%)',
    mortReg: 'رسوم تسجيل الرهن (0.25% + 290)',
    agent: 'عمولة الوكيل (2%)',
    val: 'رسوم التقييم',
    extraTotal: 'إجمالي الرسوم الإضافية',
    cashNeeded: 'إجمالي النقد المطلوب',
    disclaimer: 'هذه الأداة للأغراض التوضيحية فقط وليست عرض قرض أو ضماناً للأهلية. الشروط الفعلية تعتمد على سياسات البنك وملف المقترض واللوائح الحالية. استشر بنكاً مرخصاً أو مستشاراً ماليًا.',
  } : {
    propPrice: 'Property Price (AED)',
    down: 'Down Payment',
    term: 'Loan Term (Years)',
    rate: 'Annual Interest Rate',
    employment: 'Employment Type',
    income: 'Monthly Income (AED) — optional',
    reset: '↺ Reset to Non-Resident Defaults',
    emi: 'Monthly Payment (EMI)',
    loanAmt: 'Loan Amount',
    totalRepay: 'Total Repayment',
    totalInt: 'Total Interest Paid',
    dbr: 'EMI as % of Income',
    tabRes: 'Results', tabAmort: 'Amortization', tabCosts: 'Extra Costs', tabCompare: 'Compare',
    dld: 'DLD Transfer Fee (4%)',
    mortReg: 'Mortgage Registration (0.25% + AED 290)',
    agent: "Agent's Fee (2%)",
    val: 'Property Valuation Fee',
    extraTotal: 'Total Additional Fees',
    cashNeeded: 'Total Cash Required at Purchase',
    disclaimer: 'This is an estimation tool for illustrative purposes only. It does not constitute financial advice, a loan offer, or eligibility guarantee. Actual terms depend on the bank, your credit profile, income verification, nationality, and current regulations. Consult a licensed bank or financial advisor. Non-resident mortgage availability and terms vary significantly by lender.',
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Non-Resident Notice Banner ── */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex gap-3">
        <span className="text-sky-500 text-xl flex-shrink-0">🌍</span>
        <div>
          <p className="text-sm font-semibold text-sky-800">Non-Resident / Overseas Buyer Settings</p>
          <p className="text-xs text-sky-600 mt-0.5">
            Defaults reflect typical non-resident mortgage terms in Dubai: 40% minimum down payment, 
            max ~60% LTV, rate range 4.5–6.5%. Terms vary by bank and nationality.
            <Tooltip text="Non-residents face stricter LTV caps (~50–60%) and higher rates than UAE residents. Some banks also require a minimum monthly income of AED 15,000–25,000 equivalent from your home country." />
          </p>
        </div>
      </div>

      {/* ── INPUTS ── */}
      <div className="space-y-5">

        {/* Property Price */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-semibold text-slate-700">{L.propPrice}</label>
            <span className="text-sm font-bold text-emerald-600">{fmtAED(propertyPrice)}</span>
          </div>
          <input type="range" min={500000} max={15000000} step={50000}
            value={propertyPrice} onChange={e => setPropertyPrice(Number(e.target.value))}
            className="w-full accent-emerald-600" />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>AED 500K</span><span>AED 15M</span></div>
        </div>

        {/* Down Payment */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-semibold text-slate-700">
              {L.down}
              <Tooltip text="Non-residents typically need 35–50%+ down payment. The CBUAE caps LTV at ~60% for non-residents, but banks may require more depending on your profile." />
            </label>
            <span className="text-sm font-bold text-emerald-600">{downPct}% — {fmtAED(downPaymentAED)}</span>
          </div>
          <input type="range" min={20} max={80} step={1}
            value={downPct} onChange={e => { setDownPct(Number(e.target.value)); setActiveScenario(null) }}
            className="w-full accent-emerald-600" />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>20%</span><span>80%</span></div>
          <div className="mt-2">
            <LTVGauge ltv={ltv} maxLtv={NON_RESIDENT_MAX_LTV} />
          </div>
        </div>

        {/* Loan Term + Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-700">{L.term}</label>
              <span className="text-sm font-bold text-emerald-600">{loanTerm} yrs</span>
            </div>
            <input type="range" min={5} max={MAX_TENURE} step={1}
              value={loanTerm} onChange={e => { setLoanTerm(Number(e.target.value)); setActiveScenario(null) }}
              className="w-full accent-emerald-600" />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>5</span><span>25</span></div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-slate-700">
                {L.rate}
                <Tooltip text="Non-resident rates in Dubai are typically 4.5–6.5% p.a. (EIBOR + bank margin). Rates fluctuate with global monetary policy. Last updated: 2025." />
              </label>
              <span className="text-sm font-bold text-emerald-600">{annualRate.toFixed(2)}%</span>
            </div>
            <input type="range" min={3.0} max={9.0} step={0.25}
              value={annualRate} onChange={e => { setAnnualRate(Number(e.target.value)); setActiveScenario(null) }}
              className="w-full accent-emerald-600" />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>3%</span><span>9%</span></div>
          </div>
        </div>

        {/* Rate quick-pick */}
        <div className="flex flex-wrap gap-2">
          {[4.0, 4.5, 5.0, 5.5, 6.0, 6.5].map(r => (
            <button key={r} type="button"
              onClick={() => { setAnnualRate(r); setActiveScenario(null) }}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${annualRate === r ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:border-emerald-400'}`}>
              {r}%
            </button>
          ))}
        </div>

        {/* Employment + Income */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{L.employment}</label>
            <select value={employmentType} onChange={e => setEmploymentType(e.target.value as EmploymentType)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition">
              <option value="salaried">Salaried Employee</option>
              <option value="self-employed">Self-Employed / Business Owner</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {L.income}
              <Tooltip text="Banks typically require a minimum AED 15,000–25,000/month equivalent. Income from your home country is accepted with proper documentation." />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">AED</span>
              <input type="number" min="0" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)}
                placeholder="e.g. 30000"
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition" />
            </div>
          </div>
        </div>
      </div>

      {/* Reset button */}
      <div className="flex justify-end">
        <button type="button" onClick={resetDefaults}
          className="text-sm px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl transition-colors">
          {L.reset}
        </button>
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">

          {/* Hero */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
            <p className="text-sm opacity-60 mb-1">{L.emi}</p>
            <p className="text-4xl font-black tracking-tight">{fmtAEDDec(result.monthlyEMI)}</p>
            <p className="text-sm opacity-50 mt-1">per month · {loanTerm} year term · {annualRate}% p.a.</p>
            {result.dbrPct > 0 && (
              <div className="mt-4 inline-flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  dbrStatus === 'emerald' ? 'bg-emerald-500/20 text-emerald-300' :
                  dbrStatus === 'amber' ? 'bg-amber-400/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {fmtPct(result.dbrPct)} of income
                  {result.dbrPct > 50 ? ' — ⚠ exceeds 50% DBR' : result.dbrPct > 35 ? ' — ⚠ near limit' : ' — ✓ within limits'}
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-white overflow-x-auto">
            {(['results','amortization','costs','compare'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-semibold whitespace-nowrap transition-colors px-2 ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {tab === 'results' ? L.tabRes : tab === 'amortization' ? L.tabAmort : tab === 'costs' ? L.tabCosts : L.tabCompare}
              </button>
            ))}
          </div>

          <div className="p-5">

            {/* ── Results tab ── */}
            {activeTab === 'results' && (
              <div>
                <ResultRow label={L.loanAmt}    value={fmtAED(result.loanAmount)} bold />
                <ResultRow label={L.totalRepay}  value={fmtAED(result.totalRepayment)} />
                <ResultRow label={L.totalInt}    value={fmtAED(result.totalInterest)} negative />
                <ResultRow label="LTV Ratio"
                  sub={`Non-resident CBUAE cap: ~${NON_RESIDENT_MAX_LTV}%`}
                  value={fmtPct(result.ltv)}
                  negative={result.ltv > NON_RESIDENT_MAX_LTV} />
                {result.dbrPct > 0 && (
                  <ResultRow label={L.dbr}
                    sub="CBUAE max 50% recommended"
                    value={fmtPct(result.dbrPct)}
                    negative={result.dbrPct > 50}
                    highlight={result.dbrPct <= 35} />
                )}
              </div>
            )}

            {/* ── Amortization tab ── */}
            {activeTab === 'amortization' && (
              <div>
                <AmortChart rows={result.amortization} />
                <div className="mt-5 max-h-64 overflow-y-auto rounded-xl border border-slate-100">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr className="text-slate-500">
                        {['Year','Opening Bal.','Annual EMI','Principal','Interest','Closing Bal.'].map(h => (
                          <th key={h} className="text-right py-2 px-2 first:text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {result.amortization.map(r => (
                        <tr key={r.year} className="text-slate-600 hover:bg-slate-50">
                          <td className="py-2 px-2 font-medium">{r.year}</td>
                          <td className="text-right py-2 px-2">{Math.round(r.openingBalance).toLocaleString()}</td>
                          <td className="text-right py-2 px-2">{Math.round(r.annualPayment).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-emerald-600">{Math.round(r.principalPaid).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-sky-500">{Math.round(r.interestPaid).toLocaleString()}</td>
                          <td className="text-right py-2 px-2">{Math.round(r.closingBalance).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-2">All amounts in AED. Figures are estimates assuming a fixed interest rate throughout.</p>
              </div>
            )}

            {/* ── Costs tab ── */}
            {activeTab === 'costs' && (
              <div>
                <ResultRow label="Down Payment"     value={fmtAED(downPaymentAED)} bold />
                <ResultRow label={L.dld}   sub="Dubai Land Department mandatory transfer fee" value={fmtAED(result.dldTransferFee)} negative />
                <ResultRow label={L.mortReg} sub="DLD mortgage registration (must be registered)" value={fmtAED(result.mortgageRegFee)} negative />
                <ResultRow label={L.agent} sub="Typical agent commission (confirm with agent)" value={fmtAED(result.agentFee)} negative />
                <ResultRow label={L.val}   sub="Property valuation by bank-approved valuer" value={fmtAED(result.valuationFee)} negative />
                <div className="mt-2 pt-2 border-t-2 border-slate-200">
                  <ResultRow label={L.extraTotal} value={fmtAED(result.totalExtraCosts)} bold negative />
                  <ResultRow label={L.cashNeeded}
                    sub="Down payment + all estimated fees"
                    value={fmtAED(result.totalCashNeeded)} bold highlight />
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Not included: bank processing fees, building insurance, mortgage life insurance, NOC fees, currency conversion costs. Actual figures may vary.
                </p>
              </div>
            )}

            {/* ── Compare tab ── */}
            {activeTab === 'compare' && (
              <div>
                <p className="text-xs text-slate-500 mb-3">Select a scenario to apply it to the calculator:</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {SCENARIOS.map((s, i) => (
                    <ScenarioCard key={i} s={s} active={activeScenario === i} onClick={() => applyScenario(i)} />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">Scenario EMIs are based on your current property price of {fmtAED(propertyPrice)}.</p>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="mx-5 mb-5 bg-amber-50 border border-amber-100 rounded-xl p-3.5">
            <p className="text-xs text-amber-700 leading-relaxed">
              ⚠️ <strong>Disclaimer:</strong> {L.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
