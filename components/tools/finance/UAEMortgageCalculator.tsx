'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = { locale: string }

// ─── Types ────────────────────────────────────────────────────────────────────

type BorrowerType = 'uae-national' | 'expat-resident' | 'non-resident'
type PropertyPurpose = 'first-home' | 'second-home' | 'investment' | 'off-plan'

type AmortizationRow = {
  month: number
  year: number
  payment: number
  principal: number
  interest: number
  balance: number
}

type Result = {
  loanAmount: number
  ltv: number
  monthlyEMI: number
  totalRepayment: number
  totalInterest: number
  dbr: number
  stressDbr: number
  maxAffordablePrice: number
  amortization: AmortizationRow[]
  dldFee: number
  agentFee: number
  registrationFee: number
  totalCashNeeded: number
  ltvStatus: 'green' | 'yellow' | 'red'
  dbrStatus: 'green' | 'yellow' | 'red'
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LTV_CAPS: Record<BorrowerType, Record<PropertyPurpose, number>> = {
  'uae-national':    { 'first-home': 85, 'second-home': 75, investment: 70, 'off-plan': 50 },
  'expat-resident':  { 'first-home': 80, 'second-home': 65, investment: 60, 'off-plan': 50 },
  'non-resident':    { 'first-home': 60, 'second-home': 55, investment: 50, 'off-plan': 50 },
}

const MAX_TENURE = 25
const MAX_DBR = 50
const STRESS_BUFFER = 2 // +2% stress test

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAED(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtAEDDec(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
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
  const totalMonths = years * 12

  for (let m = 1; m <= totalMonths; m++) {
    const interest = balance * r
    const principalPart = emi - interest
    balance = Math.max(0, balance - principalPart)
    rows.push({
      month: m,
      year: Math.ceil(m / 12),
      payment: emi,
      principal: principalPart,
      interest,
      balance,
    })
  }
  return rows
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, label }: { status: 'green' | 'yellow' | 'red'; label: string }) {
  const colors = {
    green:  'bg-emerald-100 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-100 text-amber-700 border-amber-200',
    red:    'bg-red-100 text-red-700 border-red-200',
  }
  const icons = { green: '✓', yellow: '⚠', red: '✕' }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${colors[status]}`}>
      {icons[status]} {label}
    </span>
  )
}

function ProgressBar({ value, max, status }: { value: number; max: number; status: 'green' | 'yellow' | 'red' }) {
  const pct = Math.min(100, (value / max) * 100)
  const barColor = { green: 'bg-emerald-500', yellow: 'bg-amber-400', red: 'bg-red-500' }
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor[status]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function ResultRow({
  label,
  value,
  sub,
  highlight = false,
  negative = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  negative?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <span className="text-sm text-gray-600">{label}</span>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm font-semibold whitespace-nowrap ${highlight ? 'text-emerald-600' : negative ? 'text-red-500' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block ml-1">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs font-bold inline-flex items-center justify-center cursor-help"
        aria-label="More information"
        type="button"
      >?</button>
      {open && (
        <div className="absolute z-10 bottom-6 left-1/2 -translate-x-1/2 w-56 bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-xl">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </span>
  )
}

// ─── Mini Bar Chart (amortization preview) ────────────────────────────────────

function AmortizationChart({ rows }: { rows: AmortizationRow[] }) {
  // Group by year, show up to 25 years
  const byYear: { year: number; principal: number; interest: number }[] = []
  rows.forEach(r => {
    const existing = byYear.find(b => b.year === r.year)
    if (existing) {
      existing.principal += r.principal
      existing.interest  += r.interest
    } else {
      byYear.push({ year: r.year, principal: r.principal, interest: r.interest })
    }
  })

  const maxTotal = Math.max(...byYear.map(b => b.principal + b.interest))

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Annual Repayment Breakdown</p>
      <div className="flex items-end gap-1 h-28">
        {byYear.map(b => {
          const total = b.principal + b.interest
          const pPct = (b.principal / total) * 100
          const iPct = (b.interest / total) * 100
          const heightPct = (total / maxTotal) * 100
          return (
            <div key={b.year} className="flex-1 flex flex-col justify-end h-full group relative">
              <div
                className="w-full rounded-t overflow-hidden"
                style={{ height: `${heightPct}%` }}
                title={`Year ${b.year}: Principal ${fmtAED(b.principal)}, Interest ${fmtAED(b.interest)}`}
              >
                <div className="bg-emerald-500 w-full" style={{ height: `${pPct}%` }} />
                <div className="bg-blue-300 w-full" style={{ height: `${iPct}%` }} />
              </div>
              {byYear.length <= 15 && (
                <span className="text-[9px] text-gray-500 text-center mt-0.5">{b.year}</span>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Principal</span>
        <span className="flex items-center gap-1 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-blue-300 inline-block" /> Interest</span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UAEMortgageCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  // Inputs
  const [propertyPrice, setPropertyPrice] = useState(1500000)
  const [downPaymentPct, setDownPaymentPct] = useState(20)
  const [loanTerm, setLoanTerm] = useState(25)
  const [annualRate, setAnnualRate] = useState(4.5)
  const [borrowerType, setBorrowerType] = useState<BorrowerType>('expat-resident')
  const [purpose, setPurpose] = useState<PropertyPurpose>('first-home')
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [otherDebts, setOtherDebts] = useState('')
  const [showAmortization, setShowAmortization] = useState(false)
  const [activeTab, setActiveTab] = useState<'results' | 'amortization' | 'costs'>('results')

  const [result, setResult] = useState<Result | null>(null)

  // Derived
  const downPaymentAED = Math.round(propertyPrice * (downPaymentPct / 100))
  const loanAmount     = propertyPrice - downPaymentAED
  const ltv            = (loanAmount / propertyPrice) * 100
  const maxLtv         = LTV_CAPS[borrowerType][purpose]

  const ltvStatus: 'green' | 'yellow' | 'red' =
    ltv <= maxLtv * 0.9 ? 'green' : ltv <= maxLtv ? 'yellow' : 'red'

  const calculate = useCallback(() => {
    if (propertyPrice <= 0 || loanAmount <= 0) return

    const emi = calcEMI(loanAmount, annualRate, loanTerm)
    const totalRepayment = emi * loanTerm * 12
    const totalInterest  = totalRepayment - loanAmount

    // DBR
    const income = parseFloat(monthlyIncome) || 0
    const debts  = parseFloat(otherDebts) || 0
    const dbr     = income > 0 ? ((emi + debts) / income) * 100 : 0
    const stressEmi = calcEMI(loanAmount, annualRate + STRESS_BUFFER, loanTerm)
    const stressDbr = income > 0 ? ((stressEmi + debts) / income) * 100 : 0

    const dbrStatus: 'green' | 'yellow' | 'red' =
      dbr === 0 ? 'green' : dbr <= 40 ? 'green' : dbr <= 50 ? 'yellow' : 'red'

    // Max affordable price (reverse calc)
    let maxAffordablePrice = 0
    if (income > 0) {
      const maxEmi   = (income * (MAX_DBR / 100)) - debts
      const r        = annualRate / 12 / 100
      const n        = loanTerm * 12
      const maxLoan  = maxEmi * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)))
      const minDp    = 100 - maxLtv
      maxAffordablePrice = Math.round(maxLoan / ((100 - minDp) / 100))
    }

    // Fees
    const dldFee          = propertyPrice * 0.04
    const agentFee        = propertyPrice * 0.02
    const registrationFee = propertyPrice < 500000 ? 2000 : 4000
    const totalCashNeeded = downPaymentAED + dldFee + agentFee + registrationFee

    const amortization = buildAmortization(loanAmount, annualRate, loanTerm)

    setResult({
      loanAmount,
      ltv,
      monthlyEMI: emi,
      totalRepayment,
      totalInterest,
      dbr,
      stressDbr,
      maxAffordablePrice,
      amortization,
      dldFee,
      agentFee,
      registrationFee,
      totalCashNeeded,
      ltvStatus,
      dbrStatus,
    })
  }, [propertyPrice, loanAmount, loanTerm, annualRate, monthlyIncome, otherDebts, ltv, ltvStatus, maxLtv])

  // Auto-calculate on input change
  useEffect(() => {
    const t = setTimeout(calculate, 150)
    return () => clearTimeout(t)
  }, [calculate])

  function reset() {
    setPropertyPrice(1500000)
    setDownPaymentPct(20)
    setLoanTerm(25)
    setAnnualRate(4.5)
    setBorrowerType('expat-resident')
    setPurpose('first-home')
    setMonthlyIncome('')
    setOtherDebts('')
    setResult(null)
  }

  const L = isAr
    ? {
        propPrice: 'سعر العقار (درهم)',
        downPct: 'نسبة الدفعة الأولى',
        downAmt: 'مبلغ الدفعة الأولى',
        term: 'مدة القرض (سنوات)',
        rate: 'معدل الفائدة السنوي',
        borrower: 'نوع المقترض',
        purpose: 'الغرض من العقار',
        income: 'الدخل الشهري (درهم) — اختياري',
        otherDebts: 'ديون شهرية أخرى (درهم)',
        reset: 'إعادة تعيين',
        results: 'نتائج حاسبة الرهن العقاري',
        loanAmt: 'مبلغ القرض',
        emi: 'الدفعة الشهرية (EMI)',
        totalRepay: 'إجمالي المبلغ المُسدَّد',
        totalInterest: 'إجمالي الفوائد',
        ltv: 'نسبة القرض إلى القيمة (LTV)',
        dbr: 'نسبة عبء الديون (DBR)',
        stressDbr: 'DBR بعد اختبار الإجهاد (+2%)',
        maxPrice: 'أقصى سعر عقار يمكن تحمّله',
        disclaimer: 'التقديرات لأغراض إعلامية فقط. الشروط الفعلية تعتمد على موافقة البنك وتحقق الدخل. راجع مستشارًا مرخصًا.',
        tabResults: 'النتائج',
        tabAmort: 'جدول السداد',
        tabCosts: 'التكاليف الإضافية',
        dld: 'رسوم دائرة الأراضي (4%)',
        agent: 'عمولة الوكيل (2%)',
        reg: 'رسوم التسجيل',
        totalCash: 'إجمالي النقد المطلوب',
      }
    : {
        propPrice: 'Property Price (AED)',
        downPct: 'Down Payment',
        downAmt: 'Down Payment Amount',
        term: 'Loan Term (Years)',
        rate: 'Annual Interest Rate',
        borrower: 'Borrower Type',
        purpose: 'Property Purpose',
        income: 'Monthly Income (AED) — optional',
        otherDebts: 'Other Monthly Debts (AED)',
        reset: 'Reset',
        results: 'Mortgage Calculation Results',
        loanAmt: 'Loan Amount',
        emi: 'Monthly Payment (EMI)',
        totalRepay: 'Total Repayment',
        totalInterest: 'Total Interest',
        ltv: 'Loan-to-Value (LTV)',
        dbr: 'Debt Burden Ratio (DBR)',
        stressDbr: 'Stress-Test DBR (+2% rate)',
        maxPrice: 'Max Affordable Property Price',
        disclaimer: 'Estimates for informational purposes only. Actual terms depend on bank approval, credit check & income verification. Consult a licensed advisor. Not financial advice.',
        tabResults: 'Results',
        tabAmort: 'Amortization',
        tabCosts: 'Additional Costs',
        dld: 'DLD Transfer Fee (4%)',
        agent: "Agent's Fee (2%)",
        reg: 'Registration Fee',
        totalCash: 'Total Cash Required',
      }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── INPUTS ── */}
      <div className="space-y-5">

        {/* Property Price */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-semibold text-gray-700">{L.propPrice}</label>
            <span className="text-sm font-bold text-emerald-600">{fmtAED(propertyPrice)}</span>
          </div>
          <input
            type="range" min={300000} max={20000000} step={50000}
            value={propertyPrice}
            onChange={e => setPropertyPrice(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>AED 300K</span><span>AED 20M</span>
          </div>
        </div>

        {/* Down Payment */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-semibold text-gray-700">
              {L.downPct}
              <Tooltip text={`Max LTV for selected profile: ${maxLtv}%. Minimum down payment: ${100 - maxLtv}%.`} />
            </label>
            <span className="text-sm font-bold text-emerald-600">{downPaymentPct}% — {fmtAED(downPaymentAED)}</span>
          </div>
          <input
            type="range" min={5} max={90} step={1}
            value={downPaymentPct}
            onChange={e => setDownPaymentPct(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-0.5">
            <span>5%</span>
            <span className={`font-semibold ${ltvStatus === 'red' ? 'text-red-500' : ltvStatus === 'yellow' ? 'text-amber-500' : 'text-emerald-600'}`}>
              LTV: {ltv.toFixed(1)}% {ltvStatus === 'red' ? '⚠ Exceeds cap' : ltvStatus === 'yellow' ? '⚠ Near cap' : '✓'}
            </span>
            <span>90%</span>
          </div>
        </div>

        {/* Loan Term + Rate (side by side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-gray-700">{L.term}</label>
              <span className="text-sm font-bold text-emerald-600">{loanTerm} yrs</span>
            </div>
            <input
              type="range" min={5} max={25} step={1}
              value={loanTerm}
              onChange={e => setLoanTerm(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-0.5"><span>5</span><span>25</span></div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-gray-700">{L.rate}
                <Tooltip text="EIBOR-linked mortgages in UAE typically range 4–6%. Fixed rates may differ. Last updated: 2025." />
              </label>
              <span className="text-sm font-bold text-emerald-600">{annualRate}%</span>
            </div>
            <input
              type="range" min={2} max={9} step={0.25}
              value={annualRate}
              onChange={e => setAnnualRate(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-0.5"><span>2%</span><span>9%</span></div>
          </div>
        </div>

        {/* Quick rate presets */}
        <div className="flex flex-wrap gap-2">
          {[3.5, 4.0, 4.5, 5.0, 5.5, 6.0].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setAnnualRate(r)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${annualRate === r ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:border-emerald-400'}`}
            >
              {r}%
            </button>
          ))}
        </div>

        {/* Borrower Type + Purpose */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.borrower}</label>
            <select
              value={borrowerType}
              onChange={e => setBorrowerType(e.target.value as BorrowerType)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="uae-national">UAE National</option>
              <option value="expat-resident">Expat / Resident</option>
              <option value="non-resident">Non-Resident</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.purpose}</label>
            <select
              value={purpose}
              onChange={e => setPurpose(e.target.value as PropertyPurpose)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="first-home">First Home</option>
              <option value="second-home">Second Home</option>
              <option value="investment">Investment Property</option>
              <option value="off-plan">Off-Plan</option>
            </select>
          </div>
        </div>

        {/* Max LTV info bar */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <span className="text-blue-500 text-lg">ℹ</span>
          <p className="text-xs text-blue-700">
            <strong>CBUAE guideline:</strong> Max LTV for your profile is <strong>{maxLtv}%</strong> (min. down payment: <strong>{100 - maxLtv}%</strong>).
          </p>
        </div>

        {/* Optional: Income + Debts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.income}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">AED</span>
              <input
                type="number" min="0"
                value={monthlyIncome}
                onChange={e => setMonthlyIncome(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.otherDebts}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">AED</span>
              <input
                type="number" min="0"
                value={otherDebts}
                onChange={e => setOtherDebts(e.target.value)}
                placeholder="e.g. 2000"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reset button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors text-sm"
        >
          ↺ {L.reset}
        </button>
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">

          {/* Hero EMI */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-white">
            <div className="text-sm opacity-80 mb-1">{L.emi}</div>
            <div className="text-4xl font-black tracking-tight">{fmtAEDDec(result.monthlyEMI)}</div>
            <div className="text-sm opacity-70 mt-1">/month for {loanTerm} years</div>

            {/* LTV + DBR badges */}
            <div className="flex flex-wrap gap-2 mt-4">
              <StatusBadge status={result.ltvStatus} label={`LTV ${fmtPct(result.ltv)}`} />
              {result.dbr > 0 && (
                <StatusBadge status={result.dbrStatus} label={`DBR ${fmtPct(result.dbr)}`} />
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 bg-white">
            {(['results', 'amortization', 'costs'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab === 'results' ? L.tabResults : tab === 'amortization' ? L.tabAmort : L.tabCosts}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-1">

            {/* ── Tab: Results ── */}
            {activeTab === 'results' && (
              <div className="space-y-1 divide-y divide-gray-100">
                <ResultRow label={L.loanAmt} value={fmtAED(result.loanAmount)} />
                <ResultRow label={L.totalRepay} value={fmtAED(result.totalRepayment)} />
                <ResultRow label={L.totalInterest} value={fmtAED(result.totalInterest)} negative />

                {/* LTV bar */}
                <div className="pt-3 pb-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">{L.ltv}</span>
                    <span className="text-sm font-semibold text-gray-900">{fmtPct(result.ltv)} / max {maxLtv}%</span>
                  </div>
                  <ProgressBar value={result.ltv} max={maxLtv} status={result.ltvStatus} />
                </div>

                {/* DBR section (only if income entered) */}
                {result.dbr > 0 && (
                  <>
                    <div className="pt-1 pb-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{L.dbr}
                          <Tooltip text="CBUAE mandates max 50% DBR. Includes all monthly debt obligations vs gross income." />
                        </span>
                        <span className="text-sm font-semibold">{fmtPct(result.dbr)}</span>
                      </div>
                      <ProgressBar value={result.dbr} max={50} status={result.dbrStatus} />
                    </div>
                    <ResultRow
                      label={L.stressDbr}
                      sub="CBUAE stress test: +2% rate scenario"
                      value={fmtPct(result.stressDbr)}
                      negative={result.stressDbr > 50}
                    />
                    {result.maxAffordablePrice > 0 && (
                      <ResultRow
                        label={L.maxPrice}
                        sub="Based on 50% DBR limit & your income"
                        value={fmtAED(result.maxAffordablePrice)}
                        highlight
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Tab: Amortization ── */}
            {activeTab === 'amortization' && (
              <div>
                <AmortizationChart rows={result.amortization} />
                <div className="mt-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="text-gray-500">
                        <th className="text-left py-1.5 font-semibold">Yr</th>
                        <th className="text-right py-1.5 font-semibold">EMI</th>
                        <th className="text-right py-1.5 font-semibold">Principal</th>
                        <th className="text-right py-1.5 font-semibold">Interest</th>
                        <th className="text-right py-1.5 font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.amortization
                        .filter(r => r.month % 12 === 0)
                        .map(r => (
                          <tr key={r.month} className="text-gray-700">
                            <td className="py-1.5">{r.year}</td>
                            <td className="text-right">{Math.round(r.payment).toLocaleString()}</td>
                            <td className="text-right text-emerald-600">{Math.round(r.principal * 12).toLocaleString()}</td>
                            <td className="text-right text-blue-500">{Math.round(r.interest * 12).toLocaleString()}</td>
                            <td className="text-right">{Math.round(r.balance).toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-500 mt-2">All amounts in AED. Yearly rows shown (end of year).</p>
                </div>
              </div>
            )}

            {/* ── Tab: Additional Costs ── */}
            {activeTab === 'costs' && (
              <div className="space-y-1 divide-y divide-gray-100">
                <ResultRow label={L.downAmt} value={fmtAED(downPaymentAED)} />
                <ResultRow label={L.dld} sub="Dubai Land Department transfer fee" value={fmtAED(result.dldFee)} negative />
                <ResultRow label={L.agent} sub="Typical agent commission estimate" value={fmtAED(result.agentFee)} negative />
                <ResultRow label={L.reg} sub="DLD registration fee (AED 2K / 4K)" value={fmtAED(result.registrationFee)} negative />
                <div className="pt-2">
                  <ResultRow label={L.totalCash} sub="Down payment + all estimated fees" value={fmtAED(result.totalCashNeeded)} highlight />
                </div>
                <p className="text-xs text-gray-500 pt-2">
                  Fees are estimates. Mortgage registration, valuation, and insurance fees are not included. Actual costs may vary.
                </p>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="mx-5 mb-5 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              ⚠️ <strong>Disclaimer:</strong> {L.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
