'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

type Props = { locale: string }

// ─── Types ────────────────────────────────────────────────────────────────────

type NationalityType = 'uae-national' | 'expat-resident' | 'non-resident'
type PropertyPurpose = 'first-home' | 'second-home' | 'investment'
type RateType = 'reducing' | 'fixed'

type AmortizationRow = {
  month: number
  year: number
  openingBalance: number
  emi: number
  interest: number
  principal: number
  closingBalance: number
}

type ScenarioResult = {
  rate: number
  emi: number
  totalInterest: number
  totalRepayment: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LTV_CAPS: Record<NationalityType, Record<PropertyPurpose, { below5m: number; above5m: number }>> = {
  'uae-national':   { 'first-home': { below5m: 85, above5m: 75 }, 'second-home': { below5m: 75, above5m: 70 }, investment: { below5m: 70, above5m: 65 } },
  'expat-resident': { 'first-home': { below5m: 80, above5m: 70 }, 'second-home': { below5m: 65, above5m: 60 }, investment: { below5m: 60, above5m: 55 } },
  'non-resident':   { 'first-home': { below5m: 60, above5m: 55 }, 'second-home': { below5m: 55, above5m: 50 }, investment: { below5m: 50, above5m: 45 } },
}

const PRESETS = [
  { label: 'Apartment AED 1.5M',   price: 1500000, down: 20, rate: 4.5, years: 25 },
  { label: 'Apartment AED 2M',     price: 2000000, down: 20, rate: 4.5, years: 25 },
  { label: 'Villa AED 5M',         price: 5000000, down: 25, rate: 4.75, years: 25 },
  { label: 'Luxury AED 10M+',      price: 10000000, down: 30, rate: 5.0, years: 20 },
]

const RATE_SCENARIOS = [3.99, 4.5, 5.0, 5.5]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAED(n: number) {
  return `AED ${Math.round(n).toLocaleString('en-US')}`
}

function fmtAEDDec(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(n: number, dp = 1) { return `${n.toFixed(dp)}%` }

function calcEMI(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 12 / 100
  const n = years * 12
  if (r === 0 || n === 0) return n > 0 ? principal / n : 0
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function buildAmortization(principal: number, annualRate: number, years: number): AmortizationRow[] {
  const r = annualRate / 12 / 100
  const emi = calcEMI(principal, annualRate, years)
  const rows: AmortizationRow[] = []
  let balance = principal

  for (let m = 1; m <= years * 12; m++) {
    const opening = balance
    const interest = balance * r
    const princ = Math.min(emi - interest, balance)
    balance = Math.max(0, balance - princ)
    rows.push({
      month: m,
      year: Math.ceil(m / 12),
      openingBalance: opening,
      emi,
      interest,
      principal: princ,
      closingBalance: balance,
    })
    if (balance <= 0) break
  }
  return rows
}

function getMaxLtv(nationality: NationalityType, purpose: PropertyPurpose, price: number): number {
  const tier = LTV_CAPS[nationality][purpose]
  return price > 5000000 ? tier.above5m : tier.below5m
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button type="button"
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        className="w-4 h-4 rounded-full bg-rose-100 text-rose-500 text-[10px] font-bold inline-flex items-center justify-center cursor-help hover:bg-rose-200 transition-colors"
        aria-label="Info">?</button>
      {open && (
        <span className="absolute z-20 bottom-6 left-1/2 -translate-x-1/2 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-2xl leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  )
}

function LTVMeter({ ltv, maxLtv }: { ltv: number; maxLtv: number }) {
  const pct = Math.min(100, (ltv / 100) * 100)
  const over = ltv > maxLtv
  const near = ltv > maxLtv * 0.92
  const color = over ? 'bg-red-500' : near ? 'bg-amber-400' : 'bg-emerald-500'
  const textColor = over ? 'text-red-600' : near ? 'text-amber-600' : 'text-emerald-600'
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500 font-medium">LTV Ratio</span>
        <span className={`font-bold ${textColor}`}>{fmtPct(ltv)} / max {maxLtv}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {over && <p className="text-xs text-red-500 font-medium">⚠ Exceeds CBUAE LTV cap for your profile. Increase down payment.</p>}
    </div>
  )
}

function StatCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${accent ? 'bg-rose-600 text-white' : 'bg-white border border-gray-100'}`}>
      <p className={`text-xs font-semibold mb-1 ${accent ? 'text-rose-100' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-xl font-black leading-tight ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${accent ? 'text-rose-200' : 'text-gray-500'}`}>{sub}</p>}
    </div>
  )
}

function ResultRow({ label, value, sub, highlight = false, negative = false, bold = false }: {
  label: string; value: string; sub?: string; highlight?: boolean; negative?: boolean; bold?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <div>
        <span className={`text-sm ${bold ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{label}</span>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm font-semibold whitespace-nowrap ${highlight ? 'text-emerald-600' : negative ? 'text-red-500' : bold ? 'text-gray-900' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Pie Chart (SVG) ──────────────────────────────────────────────────────────

function PieChart({ principal, interest }: { principal: number; interest: number }) {
  const total = principal + interest
  const pPct = principal / total
  const r = 40
  const cx = 60, cy = 60
  const start = { x: cx + r, y: cy }
  const large = pPct < 0.5 ? 0 : 1
  const endX = cx + r * Math.cos(2 * Math.PI * pPct)
  const endY = cy + r * Math.sin(2 * Math.PI * pPct)
  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="#fde8e8" />
        <path
          d={`M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${endX} ${endY} Z`}
          fill="#e11d48"
        />
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
      </svg>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-rose-600 inline-block flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Principal</p>
            <p className="text-xs font-bold text-gray-800">{fmtAED(principal)} ({fmtPct(pPct * 100)})</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-rose-100 inline-block flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Interest</p>
            <p className="text-xs font-bold text-gray-800">{fmtAED(interest)} ({fmtPct((1 - pPct) * 100)})</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Amort Bar Chart ──────────────────────────────────────────────────────────

function AmortBarChart({ rows }: { rows: AmortizationRow[] }) {
  const byYear: { year: number; p: number; i: number }[] = []
  rows.forEach(r => {
    const e = byYear.find(b => b.year === r.year)
    if (e) { e.p += r.principal; e.i += r.interest }
    else byYear.push({ year: r.year, p: r.principal, i: r.interest })
  })
  const max = Math.max(...byYear.map(b => b.p + b.i))
  return (
    <div>
      <div className="flex items-end gap-0.5 h-24">
        {byYear.map(b => {
          const h = ((b.p + b.i) / max) * 100
          const pPct = (b.p / (b.p + b.i)) * 100
          return (
            <div key={b.year} className="flex-1 flex flex-col justify-end h-full">
              <div className="w-full rounded-t overflow-hidden" style={{ height: `${h}%` }}>
                <div className="bg-rose-600 w-full" style={{ height: `${pPct}%` }} />
                <div className="bg-rose-200 w-full" style={{ height: `${100 - pPct}%` }} />
              </div>
              {byYear.length <= 15 && <span className="text-[8px] text-gray-500 text-center mt-0.5">{b.year}</span>}
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-rose-600 inline-block" />Principal</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-rose-200 inline-block" />Interest</span>
      </div>
    </div>
  )
}

// ─── Rate Comparison ──────────────────────────────────────────────────────────

function RateComparison({ loanAmount, years, currentRate }: { loanAmount: number; years: number; currentRate: number }) {
  const scenarios: ScenarioResult[] = RATE_SCENARIOS.map(rate => {
    const emi = calcEMI(loanAmount, rate, years)
    const total = emi * years * 12
    return { rate, emi, totalInterest: total - loanAmount, totalRepayment: total }
  })
  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">Based on your loan amount of {fmtAED(loanAmount)} over {years} years.</p>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr className="text-gray-500">
              <th className="text-left py-2.5 px-3 font-semibold">Rate</th>
              <th className="text-right py-2.5 px-3 font-semibold">Monthly EMI</th>
              <th className="text-right py-2.5 px-3 font-semibold">Total Interest</th>
              <th className="text-right py-2.5 px-3 font-semibold">Total Repaid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {scenarios.map(s => (
              <tr key={s.rate} className={`${Math.abs(s.rate - currentRate) < 0.01 ? 'bg-rose-50 font-semibold' : 'hover:bg-gray-50'}`}>
                <td className="py-2.5 px-3 font-medium text-gray-800">{s.rate}%{Math.abs(s.rate - currentRate) < 0.01 ? ' ✓' : ''}</td>
                <td className="text-right py-2.5 px-3 text-rose-600 font-bold">{fmtAED(s.emi)}</td>
                <td className="text-right py-2.5 px-3 text-gray-600">{fmtAED(s.totalInterest)}</td>
                <td className="text-right py-2.5 px-3 text-gray-700">{fmtAED(s.totalRepayment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomeLoanCalculatorDubai({ locale }: Props) {
  const isAr = locale === 'ar'

  // Core inputs
  const [propertyPrice, setPropertyPrice] = useState(2000000)
  const [downPct, setDownPct] = useState(20)
  const [loanYears, setLoanYears] = useState(25)
  const [annualRate, setAnnualRate] = useState(4.5)
  const [nationality, setNationality] = useState<NationalityType>('expat-resident')
  const [purpose, setPurpose] = useState<PropertyPurpose>('first-home')
  const [monthlyIncome, setMonthlyIncome] = useState('')

  // UI
  const [activeTab, setActiveTab] = useState<'summary' | 'amortization' | 'comparison' | 'costs'>('summary')
  const [amortPage, setAmortPage] = useState(1)
  const AMORT_PAGE_SIZE = 24

  // Derived
  const downPaymentAED = Math.round(propertyPrice * (downPct / 100))
  const loanAmount     = propertyPrice - downPaymentAED
  const ltv            = (loanAmount / propertyPrice) * 100
  const maxLtv         = getMaxLtv(nationality, purpose, propertyPrice)

  // Calculated
  const emi = useMemo(() => calcEMI(loanAmount, annualRate, loanYears), [loanAmount, annualRate, loanYears])
  const totalRepayment  = emi * loanYears * 12
  const totalInterest   = totalRepayment - loanAmount
  const income          = parseFloat(monthlyIncome) || 0
  const dbrPct          = income > 0 ? (emi / income) * 100 : 0

  const amortization = useMemo(
    () => buildAmortization(loanAmount, annualRate, loanYears),
    [loanAmount, annualRate, loanYears]
  )

  // Fees
  const dldFee          = propertyPrice * 0.04
  const mortgageRegFee  = loanAmount * 0.0025 + 290
  const agentFee        = propertyPrice * 0.02
  const valuationFee    = 3000
  const totalFees       = dldFee + mortgageRegFee + agentFee + valuationFee
  const totalCashNeeded = downPaymentAED + totalFees

  // Amortization paging
  const totalAmortPages = Math.ceil(amortization.length / AMORT_PAGE_SIZE)
  const pagedAmort = amortization.slice((amortPage - 1) * AMORT_PAGE_SIZE, amortPage * AMORT_PAGE_SIZE)

  function applyPreset(p: typeof PRESETS[0]) {
    setPropertyPrice(p.price)
    setDownPct(p.down)
    setAnnualRate(p.rate)
    setLoanYears(p.years)
    setAmortPage(1)
  }

  function reset() {
    setPropertyPrice(2000000)
    setDownPct(20)
    setLoanYears(25)
    setAnnualRate(4.5)
    setNationality('expat-resident')
    setPurpose('first-home')
    setMonthlyIncome('')
    setAmortPage(1)
    setActiveTab('summary')
  }

  const dbrColor = dbrPct === 0 ? 'text-gray-500' : dbrPct <= 35 ? 'text-emerald-600' : dbrPct <= 50 ? 'text-amber-600' : 'text-red-600'

  const L = isAr ? {
    title: 'حاسبة قرض المنزل دبي',
    propPrice: 'قيمة العقار (درهم)',
    down: 'الدفعة الأولى',
    term: 'مدة القرض',
    rate: 'معدل الفائدة السنوي',
    nationality: 'الجنسية',
    purpose: 'الغرض من العقار',
    income: 'الدخل الشهري (درهم) — اختياري',
    presets: 'إعدادات سريعة',
    reset: 'إعادة التعيين',
    emi: 'القسط الشهري (EMI)',
    loanAmt: 'مبلغ القرض',
    totalRepay: 'إجمالي السداد',
    totalInt: 'إجمالي الفوائد',
    dbr: 'نسبة القسط من الدخل',
    tabSum: 'الملخص', tabAmort: 'جدول الإطفاء', tabComp: 'مقارنة المعدلات', tabCosts: 'التكاليف الإضافية',
    dld: 'رسوم دائرة الأراضي (4%)',
    mortReg: 'تسجيل الرهن (0.25% + 290)',
    agent: 'عمولة الوكيل (2%)',
    val: 'رسوم التقييم',
    totalFees: 'إجمالي الرسوم',
    cashNeeded: 'إجمالي النقد المطلوب',
    disclaimer: 'هذه أداة تعليمية تقديرية فقط. لا تمثل عرض قرض أو ضمانًا للأهلية. الشروط الفعلية تعتمد على تقييم البنك وملف المقترض والمعدلات الحالية. راجع بنكًا مرخصًا أو مستشارًا ماليًا.',
  } : {
    title: 'Home Loan Calculator Dubai',
    propPrice: 'Property Value (AED)',
    down: 'Down Payment',
    term: 'Loan Tenure',
    rate: 'Annual Interest Rate',
    nationality: 'Nationality / Residency',
    purpose: 'Property Purpose',
    income: 'Monthly Income (AED) — optional',
    presets: 'Quick Presets',
    reset: '↺ Reset',
    emi: 'Monthly EMI',
    loanAmt: 'Home Loan Amount',
    totalRepay: 'Total Repayment',
    totalInt: 'Total Interest',
    dbr: 'EMI as % of Income',
    tabSum: 'Summary', tabAmort: 'Amortization', tabComp: 'Rate Comparison', tabCosts: 'Buying Costs',
    dld: 'DLD Transfer Fee (4%)',
    mortReg: 'Mortgage Registration (0.25% + AED 290)',
    agent: "Agent's Commission (2%)",
    val: 'Property Valuation Fee',
    totalFees: 'Total Fees',
    cashNeeded: 'Total Cash Required',
    disclaimer: 'This is an educational estimation tool only. Calculations are indicative using the standard reducing balance formula. Actual offers depend on bank assessment, credit profile, property valuation, and current rates. Not financial advice. Consult a licensed bank or financial advisor.',
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Presets ── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{L.presets}</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.label} type="button" onClick={() => applyPreset(p)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold border border-gray-200 text-gray-600 hover:border-rose-400 hover:text-rose-600 transition-colors bg-white">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── INPUTS ── */}
      <div className="space-y-5">

        {/* Property Value */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-semibold text-gray-700">{L.propPrice}</label>
            <span className="text-sm font-bold text-rose-600">{fmtAED(propertyPrice)}</span>
          </div>
          <input type="range" min={300000} max={25000000} step={50000}
            value={propertyPrice} onChange={e => setPropertyPrice(Number(e.target.value))}
            className="w-full accent-rose-600" />
          <div className="flex justify-between text-xs text-gray-500 mt-0.5"><span>AED 300K</span><span>AED 25M</span></div>
        </div>

        {/* Down Payment */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-semibold text-gray-700">
              {L.down}
              <Tooltip text="CBUAE guidelines require minimum 15–20% for UAE nationals, 20%+ for expats (first home ≤ AED 5M). Higher amounts reduce your EMI and total interest." />
            </label>
            <span className="text-sm font-bold text-rose-600">{downPct}% — {fmtAED(downPaymentAED)}</span>
          </div>
          <input type="range" min={5} max={80} step={1}
            value={downPct} onChange={e => setDownPct(Number(e.target.value))}
            className="w-full accent-rose-600" />
          <div className="flex justify-between text-xs text-gray-500 mt-0.5"><span>5%</span><span>80%</span></div>
          <LTVMeter ltv={ltv} maxLtv={maxLtv} />
        </div>

        {/* Loan Tenure + Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-gray-700">{L.term}</label>
              <span className="text-sm font-bold text-rose-600">{loanYears} years</span>
            </div>
            <input type="range" min={1} max={25} step={1}
              value={loanYears} onChange={e => { setLoanYears(Number(e.target.value)); setAmortPage(1) }}
              className="w-full accent-rose-600" />
            <div className="flex justify-between text-xs text-gray-500 mt-0.5"><span>1 yr</span><span>25 yrs</span></div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-semibold text-gray-700">
                {L.rate}
                <Tooltip text="UAE home loan rates are EIBOR-linked, typically 3.5–5.5% in 2025. Use presets below for common bank rates, or slide to your quoted rate." />
              </label>
              <span className="text-sm font-bold text-rose-600">{annualRate.toFixed(2)}%</span>
            </div>
            <input type="range" min={2} max={9} step={0.25}
              value={annualRate} onChange={e => setAnnualRate(Number(e.target.value))}
              className="w-full accent-rose-600" />
            <div className="flex justify-between text-xs text-gray-500 mt-0.5"><span>2%</span><span>9%</span></div>
          </div>
        </div>

        {/* Rate quick-pick */}
        <div className="flex flex-wrap gap-2">
          {[3.49, 3.99, 4.25, 4.5, 4.99, 5.5].map(r => (
            <button key={r} type="button" onClick={() => setAnnualRate(r)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${Math.abs(annualRate - r) < 0.01 ? 'bg-rose-600 text-white border-rose-600' : 'border-gray-200 text-gray-600 hover:border-rose-400'}`}>
              {r}%
            </button>
          ))}
        </div>

        {/* Nationality + Purpose */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.nationality}</label>
            <select value={nationality} onChange={e => setNationality(e.target.value as NationalityType)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition">
              <option value="uae-national">UAE National</option>
              <option value="expat-resident">Expat / Resident</option>
              <option value="non-resident">Non-Resident / Overseas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.purpose}</label>
            <select value={purpose} onChange={e => setPurpose(e.target.value as PropertyPurpose)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition">
              <option value="first-home">First Home</option>
              <option value="second-home">Second Home</option>
              <option value="investment">Investment Property</option>
            </select>
          </div>
        </div>

        {/* CBUAE LTV info */}
        <div className="flex gap-3 bg-rose-50 border border-rose-100 rounded-xl p-3">
          <span className="text-rose-400 flex-shrink-0">ℹ</span>
          <p className="text-xs text-rose-700">
            <strong>CBUAE Guideline:</strong> Max LTV for your profile is <strong>{maxLtv}%</strong> — minimum down payment: <strong>{100 - maxLtv}%</strong>
            {propertyPrice > 5000000 ? ' (property > AED 5M applies stricter cap)' : ''}.
          </p>
        </div>

        {/* Income */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {L.income}
            <Tooltip text="Enter to see your Debt Burden Ratio (DBR). CBUAE requires total monthly debts ≤ 50% of gross income. A DBR under 35% is considered strong." />
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">AED</span>
            <input type="number" min="0" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)}
              placeholder="e.g. 25000"
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition" />
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-end">
        <button type="button" onClick={reset}
          className="text-sm px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors">
          {L.reset}
        </button>
      </div>

      {/* ── RESULTS ── */}
      {loanAmount > 0 && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">

          {/* Hero grid */}
          <div className="p-5 grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <StatCard label={L.emi} value={fmtAEDDec(emi)} sub={`${loanYears} yrs · ${annualRate}% · reducing balance`} accent />
            </div>
            <StatCard label={L.loanAmt}    value={fmtAED(loanAmount)} />
            <StatCard label={L.totalRepay} value={fmtAED(totalRepayment)} />
            <StatCard label={L.totalInt}   value={fmtAED(totalInterest)} />
            <StatCard
              label={L.dbr}
              value={dbrPct > 0 ? fmtPct(dbrPct) : '—'}
              sub={dbrPct > 0 ? (dbrPct > 50 ? '⚠ Exceeds 50% CBUAE limit' : dbrPct > 35 ? 'Approaching limit' : '✓ Within limits') : 'Enter income to calculate'}
            />
          </div>

          {/* Pie chart */}
          <div className="px-5 pb-4">
            <PieChart principal={loanAmount} interest={totalInterest} />
          </div>

          {/* Tabs */}
          <div className="flex border-t border-b border-gray-100 bg-white overflow-x-auto">
            {(['summary','amortization','comparison','costs'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-semibold whitespace-nowrap px-2 transition-colors ${activeTab === tab ? 'text-rose-600 border-b-2 border-rose-600' : 'text-gray-500 hover:text-gray-600'}`}>
                {tab === 'summary' ? L.tabSum : tab === 'amortization' ? L.tabAmort : tab === 'comparison' ? L.tabComp : L.tabCosts}
              </button>
            ))}
          </div>

          <div className="p-5">

            {/* ── Summary ── */}
            {activeTab === 'summary' && (
              <div>
                <ResultRow label={L.loanAmt}    value={fmtAED(loanAmount)} bold />
                <ResultRow label="Down Payment"  value={`${fmtAED(downPaymentAED)} (${downPct}%)`} />
                <ResultRow label={L.totalRepay}  value={fmtAED(totalRepayment)} />
                <ResultRow label={L.totalInt}    value={fmtAED(totalInterest)} negative />
                <ResultRow label="LTV Ratio"     value={fmtPct(ltv)} sub={`CBUAE max: ${maxLtv}%`} negative={ltv > maxLtv} />
                {dbrPct > 0 && (
                  <ResultRow label={L.dbr} value={fmtPct(dbrPct)}
                    sub="Max 50% per CBUAE guidelines"
                    negative={dbrPct > 50} highlight={dbrPct <= 35} />
                )}
              </div>
            )}

            {/* ── Amortization ── */}
            {activeTab === 'amortization' && (
              <div>
                <AmortBarChart rows={amortization} />
                <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-gray-500">
                        {['Month','Opening','EMI','Interest','Principal','Balance'].map(h => (
                          <th key={h} className="text-right py-2 px-2 first:text-left font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pagedAmort.map(r => (
                        <tr key={r.month} className="text-gray-600 hover:bg-rose-50/30">
                          <td className="py-2 px-2 font-medium">{r.month}</td>
                          <td className="text-right py-2 px-2">{Math.round(r.openingBalance).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 font-medium">{Math.round(r.emi).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-rose-500">{Math.round(r.interest).toLocaleString()}</td>
                          <td className="text-right py-2 px-2 text-emerald-600">{Math.round(r.principal).toLocaleString()}</td>
                          <td className="text-right py-2 px-2">{Math.round(r.closingBalance).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalAmortPages > 1 && (
                  <div className="flex items-center justify-between mt-3">
                    <button type="button" onClick={() => setAmortPage(p => Math.max(1, p - 1))} disabled={amortPage === 1}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">← Prev</button>
                    <span className="text-xs text-gray-500">Page {amortPage} of {totalAmortPages}</span>
                    <button type="button" onClick={() => setAmortPage(p => Math.min(totalAmortPages, p + 1))} disabled={amortPage === totalAmortPages}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next →</button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">All amounts in AED. Assumes constant interest rate throughout tenure.</p>
              </div>
            )}

            {/* ── Rate Comparison ── */}
            {activeTab === 'comparison' && (
              <RateComparison loanAmount={loanAmount} years={loanYears} currentRate={annualRate} />
            )}

            {/* ── Buying Costs ── */}
            {activeTab === 'costs' && (
              <div>
                <ResultRow label="Down Payment"  value={fmtAED(downPaymentAED)} bold />
                <ResultRow label={L.dld}          sub="Mandatory fee to Dubai Land Department" value={fmtAED(dldFee)} negative />
                <ResultRow label={L.mortReg}      sub="DLD mortgage registration (must be registered)" value={fmtAED(mortgageRegFee)} negative />
                <ResultRow label={L.agent}        sub="Typical buyer-side commission estimate" value={fmtAED(agentFee)} negative />
                <ResultRow label={L.val}          sub="Bank-approved valuation before approval" value={fmtAED(valuationFee)} negative />
                <div className="pt-2 mt-1 border-t-2 border-gray-100">
                  <ResultRow label={L.totalFees}  value={fmtAED(totalFees)} bold negative />
                  <ResultRow label={L.cashNeeded} sub="Down payment + all estimated fees" value={fmtAED(totalCashNeeded)} bold highlight />
                </div>
                <p className="text-xs text-gray-500 mt-3">Excludes: bank processing fees, mortgage life insurance (~0.3–0.6%/yr), building insurance, NOC fees. Actual costs may vary.</p>
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
