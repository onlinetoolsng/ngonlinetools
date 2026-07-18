'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Props = { locale: string }

type Results = {
  emiFlat: number
  emiReducing: number
  totalIntFlat: number
  totalIntReducing: number
  totalRepay: number
  totalFee: number
  effectiveRate: number
  savings: number
  principal: number
  flatRate: number
  tenureMonths: number
}

type AmortRow = {
  month: number
  emi: number
  principal: number
  interest: number
  balance: number
}

// ─── Pure math utilities ───────────────────────────────────────────────────

function calcReducingEMI(P: number, annualRate: number, n: number): number {
  const r = annualRate / 12 / 100
  if (r === 0) return P / n
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

/** Binary-search the effective reducing rate that produces the same EMI as the flat schedule */
function findEffectiveRate(P: number, flatEMI: number, n: number): number {
  let lo = 0.001
  let hi = 100
  for (let i = 0; i < 120; i++) {
    const mid = (lo + hi) / 2
    calcReducingEMI(P, mid, n) > flatEMI ? (hi = mid) : (lo = mid)
  }
  return (lo + hi) / 2
}

function buildAmortization(P: number, annualRate: number, n: number, method: 'flat' | 'reducing'): AmortRow[] {
  const rows: AmortRow[] = []
  let bal = P
  const r = annualRate / 12 / 100
  const emi =
    method === 'flat'
      ? (P + P * (annualRate / 100) * (n / 12)) / n
      : calcReducingEMI(P, annualRate, n)
  const fixedInt = method === 'flat' ? (P * (annualRate / 100) * (n / 12)) / n : 0

  for (let m = 1; m <= n; m++) {
    const interest = method === 'flat' ? fixedInt : bal * r
    const principal = emi - interest
    bal = Math.max(0, bal - principal)
    rows.push({ month: m, emi, principal, interest, balance: bal })
  }
  return rows
}

// ─── Formatters ───────────────────────────────────────────────────────────

function fmtAED(n: number, currency = 'AED') {
  return `${currency} ${Math.round(n).toLocaleString('en-AE')}`
}

function fmtPct(n: number) {
  return `${n.toFixed(2)}%`
}

function sliderLabel(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return `${v}`
}

// ─── Sub-components ───────────────────────────────────────────────────────

function ResultRow({
  label,
  value,
  negative = false,
  highlight = false,
}: {
  label: string
  value: string
  negative?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight ? 'text-emerald-600' : negative ? 'text-red-500' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function MetricCard({ label, value, color = 'default' }: { label: string; value: string; color?: 'default' | 'danger' | 'info' | 'success' }) {
  const colorMap: Record<string, string> = {
    default: 'text-gray-900',
    danger: 'text-red-500',
    info: 'text-blue-600',
    success: 'text-emerald-600',
  }
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${colorMap[color]}`}>{value}</div>
    </div>
  )
}

// ─── Amortization table ───────────────────────────────────────────────────

function AmortTable({ rows }: { rows: AmortRow[] }) {
  return (
    <div className="overflow-x-auto max-h-72 overflow-y-auto rounded-xl border border-gray-100">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            {['Month', 'EMI', 'Principal', 'Interest', 'Balance'].map(h => (
              <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium border-b border-gray-100">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.month} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 text-gray-500">{r.month}</td>
              <td className="px-3 py-2 text-gray-700">{fmtAED(r.emi)}</td>
              <td className="px-3 py-2 text-gray-700">{fmtAED(r.principal)}</td>
              <td className="px-3 py-2 text-red-400">{fmtAED(r.interest)}</td>
              <td className="px-3 py-2 text-gray-700">{fmtAED(r.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── CSV export ───────────────────────────────────────────────────────────

function exportCSV(rows: AmortRow[]) {
  const header = 'Month,EMI (AED),Principal (AED),Interest (AED),Balance (AED)\n'
  const body = rows
    .map(r => `${r.month},${r.emi.toFixed(2)},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${r.balance.toFixed(2)}`)
    .join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'uae-flat-rate-amortization.csv'
  a.click()
}

// ─── Balance chart (Chart.js via dynamic import) ──────────────────────────

function BalanceChart({ flatRows, reducingRows }: { flatRows: AmortRow[]; reducingRows: AmortRow[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<unknown>(null)

  useEffect(() => {
    if (!canvasRef.current || !flatRows.length) return

    import('chart.js/auto').then(({ Chart }) => {
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()

      chartRef.current = new Chart(canvasRef.current!, {
        type: 'line',
        data: {
          labels: flatRows.map(r => r.month),
          datasets: [
            {
              label: 'Flat rate balance',
              data: flatRows.map(r => Math.round(r.balance)),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239,68,68,0.07)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 2,
              borderDash: [5, 4],
            },
            {
              label: 'Reducing balance',
              data: reducingRows.map(r => Math.round(r.balance)),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16,185,129,0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
  const value = ctx.parsed.y ?? 0
  return `${ctx.dataset.label}: AED ${value.toLocaleString()}`
},
              },
            },
          },
          scales: {
            x: {
              title: { display: true, text: 'Month', color: '#6b7280', font: { size: 11 } },
              ticks: { color: '#6b7280', font: { size: 10 }, maxTicksLimit: 10, autoSkip: true },
              grid: { color: 'rgba(156,163,175,0.15)' },
            },
            y: {
              title: { display: true, text: 'Outstanding (AED)', color: '#6b7280', font: { size: 11 } },
              ticks: {
                color: '#6b7280',
                font: { size: 10 },
                callback: (v: unknown) => {
                  const n = v as number
                  return n >= 1000 ? `${(n / 1000).toFixed(0)}K` : `${n}`
                },
              },
              grid: { color: 'rgba(156,163,175,0.15)' },
            },
          },
        },
      })
    })

    return () => {
      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy()
    }
  }, [flatRows, reducingRows])

  return (
    <div className="relative w-full h-52">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Line chart comparing outstanding balance for flat rate vs reducing balance loans over time"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────

export default function FlatInterestRateCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  // Inputs
  const [loanAmt, setLoanAmt] = useState('100000')
  const [flatRate, setFlatRate] = useState('3.5')
  const [tenure, setTenure] = useState('24')
  const [useFee, setUseFee] = useState(false)
  const [feePercent, setFeePercent] = useState('1')
  const [feeFixed, setFeeFixed] = useState('0')

  // UI state
  const [results, setResults] = useState<Results | null>(null)
  const [flatAmort, setFlatAmort] = useState<AmortRow[]>([])
  const [reducingAmort, setReducingAmort] = useState<AmortRow[]>([])
  const [activeTab, setActiveTab] = useState<'chart' | 'amort'>('chart')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback(() => {
    const errs: Record<string, string> = {}
    const P = parseFloat(loanAmt)
    const r = parseFloat(flatRate)
    const n = parseInt(tenure)
    if (!P || P < 1000) errs.loanAmt = isAr ? 'الحد الأدنى 1,000 درهم' : 'Minimum AED 1,000'
    if (!r || r <= 0 || r > 15) errs.flatRate = isAr ? 'معدل بين 0.01 و 15' : 'Rate must be 0.01–15%'
    if (!n || n < 6 || n > 60) errs.tenure = isAr ? 'مدة 6–60 شهرًا' : 'Tenure must be 6–60 months'
    return errs
  }, [loanAmt, flatRate, tenure, isAr])

  const calculate = useCallback(() => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    const P = parseFloat(loanAmt)
    const r = parseFloat(flatRate)
    const n = parseInt(tenure)
    const fp = useFee ? parseFloat(feePercent) || 0 : 0
    const ff = useFee ? parseFloat(feeFixed) || 0 : 0

    const totalIntFlat = P * (r / 100) * (n / 12)
    const totalFee = P * (fp / 100) + ff
    const totalRepay = P + totalIntFlat + totalFee
    const emiFlat = totalRepay / n
    const emiFlatNoFee = (P + totalIntFlat) / n

    const effectiveRate = findEffectiveRate(P, emiFlatNoFee, n)
    const emiReducing = calcReducingEMI(P, effectiveRate, n)
    const totalIntReducing = emiReducing * n - P

    const flat = buildAmortization(P, r, n, 'flat')
    const reducing = buildAmortization(P, effectiveRate, n, 'reducing')

    setFlatAmort(flat)
    setReducingAmort(reducing)
    setResults({
      emiFlat,
      emiReducing,
      totalIntFlat,
      totalIntReducing,
      totalRepay,
      totalFee,
      effectiveRate,
      savings: totalIntFlat - totalIntReducing,
      principal: P,
      flatRate: r,
      tenureMonths: n,
    })
  }, [loanAmt, flatRate, tenure, useFee, feePercent, feeFixed, validate])

  function reset() {
    setLoanAmt('100000')
    setFlatRate('3.5')
    setTenure('24')
    setUseFee(false)
    setFeePercent('1')
    setFeeFixed('0')
    setResults(null)
    setErrors({})
    setFlatAmort([])
    setReducingAmort([])
  }

  const L = isAr
    ? {
        title: 'حاسبة معدل الفائدة الثابت — الإمارات',
        subtitle: 'قارن بين طريقة الفائدة الثابتة والرصيد المتناقص. يُلزم مصرف الإمارات المركزي البنوك بالإفصاح عن المعدل الفعلي.',
        loanAmt: 'مبلغ القرض (درهم)',
        flatRate: 'معدل الفائدة الثابت (%)',
        tenure: 'مدة القرض (أشهر)',
        fee: 'إضافة رسوم المعالجة',
        feePercent: 'رسوم المعالجة (%)',
        feeFixed: 'أو مبلغ ثابت (درهم)',
        calculate: 'احسب',
        reset: 'إعادة تعيين',
        flatEMI: 'القسط الشهري (ثابت)',
        reducingEMI: 'القسط الشهري (متناقص)',
        effectiveRate: 'المعدل الفعلي السنوي',
        totalRepay: 'إجمالي المبلغ المسدد',
        totalInterest: 'إجمالي الفوائد',
        savings: 'الوفر (الرصيد المتناقص)',
        breakdown: 'التفاصيل الكاملة',
        chart: 'مخطط الرصيد',
        amort: 'جدول الاستهلاك',
        exportCSV: 'تصدير CSV',
        disclaimer: 'هذه الأداة للأغراض التوضيحية والتعليمية فقط. النتائج تقريبية ولا تُعدّ استشارة مالية. تعتمد شروط القرض الفعلية على البنك وملفك الائتماني واتفاقيتك الموقّعة. استشر بنكك أو مستشارًا ماليًا مرخّصًا. لا توجد أي صلة بأي بنك أو مصرف الإمارات المركزي (CBUAE).',
      }
    : {
        title: 'Flat Interest Rate Calculator — UAE',
        subtitle: 'Compare flat rate vs reducing balance loans. Per CBUAE regulations, banks must disclose the effective (reducing balance) rate alongside any quoted flat rate.',
        loanAmt: 'Loan amount (AED)',
        flatRate: 'Flat interest rate (%)',
        tenure: 'Loan tenure (months)',
        fee: 'Include processing fee',
        feePercent: 'Processing fee (%)',
        feeFixed: 'Or fixed amount (AED)',
        calculate: 'Calculate',
        reset: 'Reset',
        flatEMI: 'Monthly EMI (flat)',
        reducingEMI: 'Monthly EMI (reducing)',
        effectiveRate: 'Effective annual rate',
        totalRepay: 'Total repayment',
        totalInterest: 'Total interest',
        savings: 'Savings (reducing)',
        breakdown: 'Full breakdown',
        chart: 'Balance chart',
        amort: 'Amortization table',
        exportCSV: 'Export CSV',
        disclaimer: 'This tool is for illustrative and educational purposes only. Results are approximate and do not constitute financial advice. Actual loan terms, rates, EMIs and fees depend on your bank, credit profile and signed agreement. Consult your bank or a licensed financial advisor before making any decisions. Not affiliated with any bank or the Central Bank of UAE (CBUAE). CBUAE requires banks to disclose the effective rate alongside any flat rate.',
      }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* CBUAE regulatory badge */}
      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2 w-fit">
        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-2.118-.549-4.108-1.515-5.843L12 4.964z" />
        </svg>
        CBUAE Compliant Methodology
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Loan amount */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">{L.loanAmt}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number"
              min={1000}
              max={5_000_000}
              step={1000}
              value={loanAmt}
              onChange={e => setLoanAmt(e.target.value)}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              aria-label={L.loanAmt}
            />
          </div>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="range"
              min={1000}
              max={1_000_000}
              step={1000}
              value={Math.min(parseFloat(loanAmt) || 1000, 1_000_000)}
              onChange={e => setLoanAmt(e.target.value)}
              className="flex-1 accent-emerald-600"
              aria-label="Loan amount slider"
            />
            <span className="text-xs text-gray-500 w-10 text-right">{sliderLabel(parseFloat(loanAmt) || 0)}</span>
          </div>
          {errors.loanAmt && <p className="text-xs text-red-500">{errors.loanAmt}</p>}
        </div>

        {/* Flat rate */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">{L.flatRate}</label>
          <div className="relative">
            <input
              type="number"
              min={0.01}
              max={15}
              step={0.01}
              value={flatRate}
              onChange={e => setFlatRate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              aria-label={L.flatRate}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.01}
              value={Math.min(parseFloat(flatRate) || 0.5, 10)}
              onChange={e => setFlatRate(e.target.value)}
              className="flex-1 accent-emerald-600"
              aria-label="Flat rate slider"
            />
            <span className="text-xs text-gray-500 w-10 text-right">{parseFloat(flatRate).toFixed(2)}%</span>
          </div>
          {errors.flatRate && <p className="text-xs text-red-500">{errors.flatRate}</p>}
        </div>

        {/* Tenure */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">{L.tenure}</label>
          <div className="relative">
            <input
              type="number"
              min={6}
              max={60}
              step={1}
              value={tenure}
              onChange={e => setTenure(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              aria-label={L.tenure}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">mo</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="range"
              min={6}
              max={60}
              step={1}
              value={Math.min(parseInt(tenure) || 6, 60)}
              onChange={e => setTenure(e.target.value)}
              className="flex-1 accent-emerald-600"
              aria-label="Tenure slider"
            />
            <span className="text-xs text-gray-500 w-12 text-right">{tenure} mo</span>
          </div>
          {errors.tenure && <p className="text-xs text-red-500">{errors.tenure}</p>}
        </div>

        {/* Processing fee toggle */}
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              checked={useFee}
              onChange={e => setUseFee(e.target.checked)}
              className="accent-emerald-600 w-4 h-4"
            />
            {L.fee}
          </label>

          {useFee && (
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">{L.feePercent}</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={feePercent}
                    onChange={e => setFeePercent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">%</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-gray-500">{L.feeFixed}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">AED</span>
                  <input
                    type="number"
                    min={0}
                    value={feeFixed}
                    onChange={e => setFeeFixed(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {L.calculate}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {L.reset}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">

          {/* Hero EMI */}
          <div className="bg-emerald-600 rounded-2xl p-5 text-white">
            <div className="text-sm opacity-75 mb-1">{L.flatEMI}</div>
            <div className="text-4xl font-black tracking-tight">{fmtAED(results.emiFlat)}</div>
            <div className="text-sm opacity-60 mt-1">
              {results.tenureMonths} {isAr ? 'قسطًا شهريًا' : 'monthly payments'} · {fmtPct(results.flatRate)} {isAr ? 'معدل ثابت' : 'flat rate'}
            </div>
          </div>

          {/* Flat vs Reducing side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <span className="text-xs font-medium text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                {isAr ? 'ثابت' : 'Flat rate'}
              </span>
              <div className="text-xl font-bold text-gray-900 mt-2">{fmtAED(results.emiFlat)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {isAr ? 'إجمالي الفوائد:' : 'Total interest:'} {fmtAED(results.totalIntFlat)}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <span className="text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                {isAr ? 'متناقص' : 'Reducing'}
              </span>
              <div className="text-xl font-bold text-emerald-700 mt-2">{fmtAED(results.emiReducing)}</div>
              <div className="text-xs text-emerald-500 mt-1">
                {isAr ? 'إجمالي الفوائد:' : 'Total interest:'} {fmtAED(results.totalIntReducing)}
              </div>
            </div>
          </div>

          {/* CBUAE insight */}
          <div className="border-l-4 border-emerald-500 bg-emerald-50 rounded-r-xl px-4 py-3 text-sm text-emerald-800 leading-relaxed">
            {isAr
              ? `معدلك الثابت البالغ ${fmtPct(results.flatRate)} يعادل معدلًا فعليًا (رصيد متناقص) يبلغ تقريبًا ${fmtPct(results.effectiveRate)}. وفقًا للوائح مصرف الإمارات المركزي، يتعين على البنوك الإفصاح عن هذا المعدل. ستوفّر ${fmtAED(results.savings)} من الفوائد بالرصيد المتناقص.`
              : `Your flat rate of ${fmtPct(results.flatRate)} is equivalent to an effective reducing balance rate of approx. ${fmtPct(results.effectiveRate)}. Per CBUAE regulations, banks must disclose this effective rate. You would save ${fmtAED(results.savings)} in interest on a reducing balance loan.`
            }
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label={L.effectiveRate} value={fmtPct(results.effectiveRate)} color="info" />
            <MetricCard label={L.totalRepay} value={fmtAED(results.totalRepay)} />
            <MetricCard label={L.totalInterest} value={fmtAED(results.totalIntFlat)} color="danger" />
            <MetricCard label={L.savings} value={fmtAED(results.savings)} color="success" />
          </div>

          {/* Full breakdown */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-1">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">{L.breakdown}</h3>
            <ResultRow label={isAr ? 'أصل القرض' : 'Loan principal'} value={fmtAED(results.principal)} />
            <ResultRow label={isAr ? 'معدل الفائدة الثابت' : 'Flat interest rate'} value={fmtPct(results.flatRate)} />
            <ResultRow label={isAr ? 'المدة' : 'Tenure'} value={`${results.tenureMonths} ${isAr ? 'شهرًا' : 'months'} (${(results.tenureMonths / 12).toFixed(1)} ${isAr ? 'سنوات' : 'yrs'})`} />
            <ResultRow label={isAr ? 'إجمالي الفوائد (ثابت)' : 'Total interest (flat)'} value={fmtAED(results.totalIntFlat)} negative />
            {results.totalFee > 0 && (
              <ResultRow label={isAr ? 'رسوم المعالجة' : 'Processing fee'} value={fmtAED(results.totalFee)} negative />
            )}
            <ResultRow label={isAr ? 'إجمالي المسدد' : 'Total repayment'} value={fmtAED(results.totalRepay)} highlight />
            <ResultRow label={isAr ? 'القسط الشهري' : 'Monthly EMI'} value={fmtAED(results.emiFlat)} highlight />
            <ResultRow label={isAr ? 'المعدل الفعلي السنوي' : 'Effective annual rate'} value={fmtPct(results.effectiveRate)} />
          </div>

          {/* Chart / Amort tabs */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <div className="flex gap-1 mb-4 border-b border-gray-200">
              {(['chart', 'amort'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-600'
                  }`}
                >
                  {tab === 'chart' ? L.chart : L.amort}
                </button>
              ))}
            </div>

            {activeTab === 'chart' && (
              <BalanceChart flatRows={flatAmort} reducingRows={reducingAmort} />
            )}

            {activeTab === 'amort' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => exportCSV(flatAmort)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    {L.exportCSV}
                  </button>
                </div>
                <AmortTable rows={flatAmort} />
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 leading-relaxed border border-gray-100">
            <span className="font-semibold text-gray-500">{isAr ? 'إخلاء المسؤولية: ' : 'Disclaimer: '}</span>
            {L.disclaimer}
          </div>
        </div>
      )}
    </div>
  )
}
