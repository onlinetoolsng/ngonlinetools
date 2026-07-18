'use client'

import { useState, useMemo, useCallback } from 'react'

type Props = { locale: string }

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  loanAmount: 75000,
  annualRate: 4.5,
  tenureMonths: 48,
  processingFee: 0,
}

const PRESETS = [
  { label: 'Economy', labelAr: 'اقتصادي', amount: 50000, rate: 4.5, months: 48 },
  { label: 'Mid-range', labelAr: 'متوسط', amount: 120000, rate: 4.2, months: 60 },
  { label: 'Luxury', labelAr: 'فاخر', amount: 300000, rate: 3.9, months: 60 },
]

// ─── Pure calculation functions ───────────────────────────────────────────────
function calcEMI(principal: number, annualRate: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0
  const r = annualRate / 100 / 12
  if (r === 0) return Math.round((principal / months) * 100) / 100
  const emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  return Math.round(emi * 100) / 100
}

function calcEffectiveRate(principal: number, emi: number, months: number): number {
  // Newton-Raphson to find monthly rate from EMI
  if (emi <= 0 || principal <= 0) return 0
  let r = 0.005
  for (let i = 0; i < 100; i++) {
    const f = principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1) - emi
    const df = principal * (Math.pow(1 + r, months) * (1 + r * months) - Math.pow(1 + r, months)) /
      Math.pow(Math.pow(1 + r, months) - 1, 2)
    const rNew = r - f / df
    if (Math.abs(rNew - r) < 1e-10) break
    r = rNew
  }
  return r * 12 * 100
}

interface ScheduleRow {
  month: number
  emi: number
  interest: number
  principalPaid: number
  balance: number
}

function generateSchedule(principal: number, annualRate: number, months: number, emi: number): ScheduleRow[] {
  let balance = principal
  const r = annualRate / 100 / 12
  const rows: ScheduleRow[] = []
  for (let i = 1; i <= months; i++) {
    const interest = Math.round(balance * r * 100) / 100
    const principalPaid = Math.round((emi - interest) * 100) / 100
    balance = Math.max(0, Math.round((balance - principalPaid) * 100) / 100)
    rows.push({ month: i, emi, interest, principalPaid, balance })
  }
  return rows
}

function calcFlatEMI(principal: number, flatRate: number, months: number) {
  const totalInterest = principal * (flatRate / 100) * (months / 12)
  const emi = Math.round(((principal + totalInterest) / months) * 100) / 100
  return { emi, totalInterest }
}

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmtAED = (n: number) =>
  `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtPct = (n: number) => `${n.toFixed(2)}%`

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${accent ? 'bg-teal-600 text-white' : 'bg-slate-50 border border-slate-200'}`}>
      <div className={`text-xs font-semibold uppercase tracking-widest mb-1 ${accent ? 'opacity-70' : 'text-slate-500'}`}>
        {label}
      </div>
      <div className={`text-2xl font-black tracking-tight ${accent ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </div>
      {sub && <div className={`text-xs mt-1 ${accent ? 'opacity-60' : 'text-slate-400'}`}>{sub}</div>}
    </div>
  )
}

function SliderInput({
  label, value, min, max, step, onChange, display, sub,
}: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; display: string; sub?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</label>
        <span className="text-sm font-black text-slate-900">{display}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #0d9488 ${pct}%, #e2e8f0 ${pct}%)`,
          }}
        />
      </div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  )
}

function TabBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
        active ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Donut chart (pure SVG) ───────────────────────────────────────────────────
function DonutChart({ principal, interest, fee }: { principal: number; interest: number; fee: number }) {
  const total = principal + interest + fee
  if (total <= 0) return null
  const r = 52
  const cx = 70
  const cy = 70
  const circ = 2 * Math.PI * r

  const segments = [
    { value: principal, color: '#0d9488', label: 'Principal' },
    { value: interest, color: '#f59e0b', label: 'Interest' },
    ...(fee > 0 ? [{ value: fee, color: '#94a3b8', label: 'Fee' }] : []),
  ]

  let offset = 0
  const arcs = segments.map(seg => {
    const dash = (seg.value / total) * circ
    const gap = circ - dash
    const arc = { ...seg, dash, gap, offset }
    offset += dash
    return arc
  })

  return (
    <div className="flex items-center gap-6">
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={18} />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={18}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={-arc.offset + circ / 4}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-xs" fontSize={9} fill="#64748b">TOTAL</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fontWeight="800" fill="#0f172a">
          {`AED ${(total / 1000).toFixed(0)}K`}
        </text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <div className="flex-1 text-xs text-slate-600">{seg.label}</div>
            <div className="text-xs font-bold text-slate-800">{((seg.value / total) * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Amortization table ───────────────────────────────────────────────────────
function AmortizationTable({ schedule, isAr }: { schedule: ScheduleRow[]; isAr: boolean }) {
  const [page, setPage] = useState(0)
  const perPage = 12
  const pages = Math.ceil(schedule.length / perPage)
  const visible = schedule.slice(page * perPage, (page + 1) * perPage)

  const headers = isAr
    ? ['الشهر', 'القسط', 'الفائدة', 'الأصل', 'الرصيد']
    : ['Month', 'EMI', 'Interest', 'Principal', 'Balance']

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {headers.map(h => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map(row => (
              <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2 font-semibold text-slate-700">{row.month}</td>
                <td className="px-3 py-2 text-slate-900 font-medium">{fmtAED(row.emi)}</td>
                <td className="px-3 py-2 text-amber-600 font-medium">{fmtAED(row.interest)}</td>
                <td className="px-3 py-2 text-teal-600 font-medium">{fmtAED(row.principalPaid)}</td>
                <td className="px-3 py-2 text-slate-600">{fmtAED(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
          >
            {isAr ? 'السابق' : 'Previous'}
          </button>
          <span className="text-xs text-slate-500">{page + 1} / {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
            disabled={page === pages - 1}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors"
          >
            {isAr ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function UAECarLoanCalculator({ locale }: Props) {
  const isAr = locale === 'ar'
  const dir = isAr ? 'rtl' : 'ltr'

  const [amount, setAmount] = useState(DEFAULTS.loanAmount)
  const [rate, setRate] = useState(DEFAULTS.annualRate)
  const [months, setMonths] = useState(DEFAULTS.tenureMonths)
  const [processingFee, setProcessingFee] = useState(DEFAULTS.processingFee)
  const [showFlat, setShowFlat] = useState(false)
  const [flatRate, setFlatRate] = useState(2.5)
  const [showSchedule, setShowSchedule] = useState(false)
  const [showDBR, setShowDBR] = useState(false)
  const [monthlySalary, setMonthlySalary] = useState(15000)
  const [activeTab, setActiveTab] = useState<'results' | 'schedule' | 'compare'>('results')
  const [animKey, setAnimKey] = useState(0)

  const result = useMemo(() => {
    const emi = calcEMI(amount, rate, months)
    const totalRepayment = emi * months + processingFee
    const totalInterest = totalRepayment - amount - processingFee
    const effectiveRate = calcEffectiveRate(amount, emi, months)
    const schedule = generateSchedule(amount, rate, months, emi)

    const flat = calcFlatEMI(amount, flatRate, months)

    return {
      emi,
      totalRepayment,
      totalInterest,
      effectiveRate,
      schedule,
      flat,
      dbrMax: monthlySalary * 0.5,
      dbrOk: emi <= monthlySalary * 0.5,
    }
  }, [amount, rate, months, processingFee, flatRate, monthlySalary])

  const applyPreset = useCallback((p: typeof PRESETS[0]) => {
    setAmount(p.amount)
    setRate(p.rate)
    setMonths(p.months)
    setAnimKey(k => k + 1)
  }, [])

  const exportCSV = useCallback(() => {
    const headers = 'Month,EMI,Interest,Principal,Balance\n'
    const rows = result.schedule.map(r =>
      `${r.month},${r.emi},${r.interest},${r.principalPaid},${r.balance}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'uae-car-loan-schedule.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [result.schedule])

  const l = isAr ? {
    amount: 'مبلغ القرض',
    rate: 'معدل الفائدة / الربح السنوي',
    tenure: 'مدة القرض',
    fee: 'رسوم المعالجة (اختياري)',
    presets: 'أمثلة سريعة',
    monthlyEMI: 'القسط الشهري',
    totalRepayment: 'إجمالي السداد',
    totalInterest: 'إجمالي الفائدة',
    effectiveRate: 'المعدل الفعلي السنوي',
    results: 'النتائج',
    schedule: 'جدول السداد',
    compare: 'مقارنة المعدلات',
    flatRate: 'المعدل الثابت',
    flatEMI: 'القسط (معدل ثابت)',
    flatInterest: 'إجمالي الفائدة (ثابت)',
    reducingEMI: 'القسط (رصيد متناقص)',
    reducingInterest: 'إجمالي الفائدة (متناقص)',
    dbrTitle: 'تقدير نسبة الدين للدخل',
    dbrSalary: 'الراتب الشهري الإجمالي',
    dbrMax: 'الحد الأقصى المسموح (50%)',
    dbrStatus: (ok: boolean) => ok ? '✓ ضمن الحد المسموح' : '⚠ يتجاوز الحد الموصى به',
    exportCSV: 'تصدير CSV',
    disclaimer: 'هذه الأداة توضيحية استناداً إلى طريقة الرصيد المتناقص وفق إرشادات المصرف المركزي الإماراتي. لا تمثل عرضاً رسمياً من أي بنك. استشر بنكك للحصول على عرض رسمي.',
    months: 'شهراً',
    years: 'سنوات',
  } : {
    amount: 'Loan Amount',
    rate: 'Annual Interest / Profit Rate',
    tenure: 'Loan Tenure',
    fee: 'Processing Fee (optional)',
    presets: 'Quick presets',
    monthlyEMI: 'Monthly EMI',
    totalRepayment: 'Total Repayment',
    totalInterest: 'Total Interest / Profit',
    effectiveRate: 'Effective Annual Rate',
    results: 'Results',
    schedule: 'Amortization',
    compare: 'Rate Comparison',
    flatRate: 'Flat Rate',
    flatEMI: 'EMI (Flat)',
    flatInterest: 'Total Interest (Flat)',
    reducingEMI: 'EMI (Reducing)',
    reducingInterest: 'Total Interest (Reducing)',
    dbrTitle: 'DBR Estimator',
    dbrSalary: 'Gross Monthly Salary',
    dbrMax: 'Max recommended EMI (50% DBR)',
    dbrStatus: (ok: boolean) => ok ? '✓ Within DBR limit' : '⚠ Exceeds recommended limit',
    exportCSV: 'Export CSV',
    disclaimer: 'Illustrative tool based on reducing balance method per CBUAE guidelines (Regulation No. 29/2011). Actual bank offers may vary — including fees, insurance, and conditions. Not a substitute for professional advice. Consult your bank for a formal offer.',
    months: 'months',
    years: 'yrs',
  }

  return (
    <div dir={dir} className="space-y-6">

      {/* Presets */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">{l.presets}</div>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 rounded-lg transition-colors"
            >
              {isAr ? p.labelAr : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-5">
        <SliderInput
          label={l.amount}
          value={amount}
          min={10000}
          max={1000000}
          step={5000}
          onChange={setAmount}
          display={`AED ${amount.toLocaleString('en-US')}`}
        />
        <SliderInput
          label={l.rate}
          value={rate}
          min={0.5}
          max={20}
          step={0.1}
          onChange={setRate}
          display={fmtPct(rate)}
          sub={isAr
            ? 'الفائدة التقليدية أو معدل الربح الإسلامي'
            : 'Conventional interest rate or Islamic profit rate'}
        />
        <SliderInput
          label={l.tenure}
          value={months}
          min={6}
          max={60}
          step={6}
          onChange={setMonths}
          display={`${months} ${l.months} (${(months / 12).toFixed(1)} ${l.years})`}
        />

        {/* Processing fee */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{l.fee}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">AED</span>
            <input
              type="number"
              min={0}
              value={processingFee || ''}
              onChange={e => setProcessingFee(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        <TabBtn active={activeTab === 'results'} label={l.results} onClick={() => setActiveTab('results')} />
        <TabBtn active={activeTab === 'schedule'} label={l.schedule} onClick={() => setActiveTab('schedule')} />
        <TabBtn active={activeTab === 'compare'} label={l.compare} onClick={() => setActiveTab('compare')} />
      </div>

      {/* ── Tab: Results ── */}
      {activeTab === 'results' && (
        <div key={`r-${animKey}`} style={{ animation: 'fadeUp 0.3s ease both' }} className="space-y-4">

          {/* Hero EMI */}
          <div className="bg-teal-600 rounded-2xl p-5 text-white">
            <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">{l.monthlyEMI}</div>
            <div className="text-4xl font-black tracking-tight">{fmtAED(result.emi)}</div>
            <div className="text-xs opacity-60 mt-1">{l.effectiveRate}: {fmtPct(result.effectiveRate)}</div>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={l.totalRepayment} value={fmtAED(result.totalRepayment)} />
            <StatCard label={l.totalInterest} value={fmtAED(result.totalInterest)} />
          </div>

          {/* Donut */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <DonutChart
              principal={amount}
              interest={result.totalInterest}
              fee={processingFee}
            />
          </div>

          {/* DBR estimator toggle */}
          <div>
            <button
              onClick={() => setShowDBR(v => !v)}
              className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
            >
              {l.dbrTitle} {showDBR ? '▲' : '▼'}
            </button>
            {showDBR && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-1">{l.dbrSalary}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">AED</span>
                    <input
                      type="number"
                      min={0}
                      value={monthlySalary}
                      onChange={e => setMonthlySalary(parseFloat(e.target.value) || 0)}
                      className="w-full pl-12 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{l.dbrMax}</span>
                  <span className="font-bold">{fmtAED(result.dbrMax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{l.monthlyEMI}</span>
                  <span className="font-bold">{fmtAED(result.emi)}</span>
                </div>
                <div className={`text-sm font-bold rounded-lg px-3 py-2 text-center ${result.dbrOk ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {l.dbrStatus(result.dbrOk)}
                </div>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? 'الحد الأقصى لنسبة الدين للدخل (DBR) هو 50% وفق توجيهات المصرف المركزي. للأغراض التوعوية فقط.'
                    : 'CBUAE sets a maximum 50% DBR for total monthly loan obligations. For educational purposes only.'}
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">{l.disclaimer}</p>
        </div>
      )}

      {/* ── Tab: Amortization ── */}
      {activeTab === 'schedule' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">{months} {l.months} · {fmtAED(result.emi)}/mo</span>
            <button
              onClick={exportCSV}
              className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors"
            >
              ↓ {l.exportCSV}
            </button>
          </div>
          <AmortizationTable schedule={result.schedule} isAr={isAr} />
        </div>
      )}

      {/* ── Tab: Flat vs Reducing comparison ── */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div>
            <SliderInput
              label={l.flatRate}
              value={flatRate}
              min={0.5}
              max={10}
              step={0.1}
              onChange={setFlatRate}
              display={fmtPct(flatRate)}
              sub={isAr ? 'أدخل المعدل الثابت للمقارنة' : 'Enter flat rate for comparison'}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-teal-600">
                    {isAr ? 'رصيد متناقص' : 'Reducing Balance'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-amber-600">
                    {isAr ? 'معدل ثابت' : 'Flat Rate'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 text-slate-600 text-xs">{isAr ? 'المعدل' : 'Rate'}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{fmtPct(rate)}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{fmtPct(flatRate)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600 text-xs">{l.monthlyEMI}</td>
                  <td className="px-4 py-3 font-bold text-teal-600">{fmtAED(result.emi)}</td>
                  <td className="px-4 py-3 font-bold text-amber-600">{fmtAED(result.flat.emi)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600 text-xs">{isAr ? 'إجمالي الفائدة' : 'Total Interest'}</td>
                  <td className="px-4 py-3 font-bold text-teal-600">{fmtAED(result.totalInterest)}</td>
                  <td className="px-4 py-3 font-bold text-amber-600">{fmtAED(result.flat.totalInterest)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600 text-xs">{l.effectiveRate}</td>
                  <td className="px-4 py-3 font-bold text-teal-600">{fmtPct(rate)}</td>
                  <td className="px-4 py-3 font-bold text-amber-600">{fmtPct(calcEffectiveRate(amount, result.flat.emi, months))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed">
            {isAr
              ? 'يُلزم المصرف المركزي الإماراتي البنوك باستخدام طريقة الرصيد المتناقص. المعدل الثابت يبدو أقل لكنه يعني فائدة أعلى فعلياً. المضاعف النموذجي: حوالي 1.8 مرة لتحويل المعدل الثابت إلى معدل فعلي.'
              : 'CBUAE (Regulation No. 29/2011) mandates the reducing balance method. Flat rates appear lower but result in higher effective cost. A typical multiplier is ~1.8–1.9× to convert flat to effective rate.'}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0d9488;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        input[type='range']::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0d9488;
          cursor: pointer;
          border: 2px solid white;
        }
      `}</style>
    </div>
  )
}
