'use client'

import { useState } from 'react'

type Props = { locale: string }

// ─── Country config ────────────────────────────────────────────────────────────
const COUNTRIES = [
  {
    value: 'uae',
    label: 'UAE',
    labelAr: 'الإمارات',
    currency: 'AED',
    typicalSavingsRate: { min: 1.5, max: 5.5 },
    notes: 'UAE has no personal income tax on savings or investment returns.',
    notesAr: 'لا تُفرض في الإمارات ضريبة على الدخل الشخصي أو عوائد الاستثمار.',
  },
  {
    value: 'saudi',
    label: 'Saudi Arabia',
    labelAr: 'السعودية',
    currency: 'SAR',
    typicalSavingsRate: { min: 1.5, max: 5.0 },
    notes: 'Saudi nationals pay Zakat (~2.5%) on net assets held over a lunar year.',
    notesAr: 'يدفع المواطنون السعوديون الزكاة (~2.5%) على الأصول المحتفظ بها لحول قمري.',
  },
  {
    value: 'qatar',
    label: 'Qatar',
    labelAr: 'قطر',
    currency: 'QAR',
    typicalSavingsRate: { min: 1.5, max: 4.5 },
    notes: 'Qatar has no personal income or capital gains tax for individuals.',
    notesAr: 'لا تُفرض في قطر ضريبة دخل أو أرباح رأسمالية على الأفراد.',
  },
  {
    value: 'kuwait',
    label: 'Kuwait',
    labelAr: 'الكويت',
    currency: 'KWD',
    typicalSavingsRate: { min: 1.0, max: 4.0 },
    notes: 'Kuwait imposes no personal income tax. Savings returns are tax-free.',
    notesAr: 'لا توجد ضريبة دخل شخصية في الكويت. عوائد المدخرات معفاة من الضرائب.',
  },
]

const COMPOUND_FREQUENCIES = [
  { value: 1,   label: 'Annually',    labelAr: 'سنوياً'      },
  { value: 2,   label: 'Semi-annually', labelAr: 'نصف سنوي'  },
  { value: 4,   label: 'Quarterly',   labelAr: 'ربع سنوي'    },
  { value: 12,  label: 'Monthly',     labelAr: 'شهرياً'      },
  { value: 365, label: 'Daily',       labelAr: 'يومياً'      },
]

// ─── Types ─────────────────────────────────────────────────────────────────────
type YearRow = {
  year: number
  startBalance: number
  contributions: number
  interest: number
  endBalance: number
}

type Result = {
  finalBalance: number
  totalContributions: number
  totalInterest: number
  schedule: YearRow[]
  currency: string
  doublingYears: number | null
}

// ─── Calculation ───────────────────────────────────────────────────────────────
function calcCompound(
  principal: number,
  annualRate: number,
  years: number,
  frequency: number,
  monthlyContribution: number,
): Result {
  const r = annualRate / 100
  const n = frequency
  const schedule: YearRow[] = []
  let balance = principal
  let totalContrib = principal

  for (let y = 1; y <= years; y++) {
    const startBalance = balance
    const yearlyContrib = monthlyContribution * 12

    // Grow existing balance for the year
    balance = balance * Math.pow(1 + r / n, n)

    // Add monthly contributions compounded within the year
    if (monthlyContribution > 0) {
      // FV of annuity for monthly contributions within a year
      const monthlyRate = r / 12
      if (monthlyRate > 0) {
        balance += monthlyContribution * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate)
      } else {
        balance += yearlyContrib
      }
    }

    const interest = balance - startBalance - yearlyContrib
    totalContrib += yearlyContrib

    schedule.push({
      year: y,
      startBalance,
      contributions: yearlyContrib,
      interest,
      endBalance: balance,
    })
  }

  // Rule of 72 — doubling time
  const doublingYears = annualRate > 0 ? Math.round(72 / annualRate) : null

  return {
    finalBalance: balance,
    totalContributions: totalContrib,
    totalInterest: balance - totalContrib,
    schedule,
    currency: '',
    doublingYears,
  }
}

function fmt(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtShort(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Bar chart ─────────────────────────────────────────────────────────────────
function GrowthChart({ schedule, currency }: { schedule: YearRow[]; currency: string }) {
  if (!schedule.length) return null
  const max = Math.max(...schedule.map(r => r.endBalance))
  const show = schedule.length > 20 ? schedule.filter((_, i) => i % Math.ceil(schedule.length / 20) === 0 || i === schedule.length - 1) : schedule

  return (
    <div className="space-y-1">
      {show.map(row => {
        const contribPct = Math.min(100, (row.endBalance - (row.endBalance - row.contributions - row.interest < 0 ? 0 : row.endBalance - row.contributions - row.interest)) / max * 100)
        const totalPct = Math.min(100, (row.endBalance / max) * 100)
        const interestPct = totalPct - Math.min(totalPct, (row.contributions / max) * 100 * (row.year))
        return (
          <div key={row.year} className="flex items-center gap-2 text-xs">
            <span className="w-8 text-gray-500 text-right flex-shrink-0">Y{row.year}</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${totalPct}%` }}
              />
              <div
                className="h-full bg-emerald-200 rounded-full absolute top-0 left-0"
                style={{ width: `${Math.min(totalPct, (row.contributions * row.year / max) * 100)}%` }}
              />
            </div>
            <span className="w-24 text-gray-600 text-right flex-shrink-0">{fmtShort(row.endBalance)}</span>
          </div>
        )
      })}
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" /> Total balance</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-200 inline-block" /> Contributions</span>
      </div>
    </div>
  )
}

// ─── Pie chart ─────────────────────────────────────────────────────────────────
function PieChart({ principal, contributions, interest }: { principal: number; contributions: number; interest: number }) {
  const total = principal + contributions + interest
  if (!total || interest <= 0) return null
  const pPct = principal / total
  const cPct = contributions / total
  const iPct = interest / total

  // Build arcs
  function arc(startFraction: number, endFraction: number) {
    const startAngle = startFraction * 2 * Math.PI - Math.PI / 2
    const endAngle = endFraction * 2 * Math.PI - Math.PI / 2
    const x1 = 50 + 40 * Math.cos(startAngle)
    const y1 = 50 + 40 * Math.sin(startAngle)
    const x2 = 50 + 40 * Math.cos(endAngle)
    const y2 = 50 + 40 * Math.sin(endAngle)
    const large = (endFraction - startFraction) > 0.5 ? 1 : 0
    return `M 50 50 L ${x1} ${y1} A 40 40 0 ${large} 1 ${x2} ${y2} Z`
  }

  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">
      <path d={arc(0, pPct)} fill="#059669" />
      <path d={arc(pPct, pPct + cPct)} fill="#34d399" />
      <path d={arc(pPct + cPct, 1)} fill="#fca5a5" />
      <circle cx="50" cy="50" r="22" fill="white" />
      <text x="50" y="47" textAnchor="middle" fontSize="7" fill="#6b7280">Interest</text>
      <text x="50" y="56" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#059669">
        {Math.round(iPct * 100)}%
      </text>
    </svg>
  )
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function CompoundInterestCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [country, setCountry] = useState('uae')
  const [principal, setPrincipal] = useState('')
  const [rate, setRate] = useState('')
  const [years, setYears] = useState('')
  const [frequency, setFrequency] = useState(12)
  const [monthlyContrib, setMonthlyContrib] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const cfg = COUNTRIES.find(c => c.value === country)!

  function validate() {
    const errs: Record<string, string> = {}
    if (!parseFloat(principal) || parseFloat(principal) <= 0)
      errs.principal = isAr ? 'أدخل مبلغاً صحيحاً' : 'Enter a valid amount'
    if (!parseFloat(rate) || parseFloat(rate) <= 0 || parseFloat(rate) > 100)
      errs.rate = isAr ? 'أدخل نسبة بين 0 و100' : 'Enter a rate between 0 and 100'
    if (!parseFloat(years) || parseFloat(years) < 1 || parseFloat(years) > 50)
      errs.years = isAr ? 'أدخل مدة بين 1 و50 سنة' : 'Enter a period between 1 and 50 years'
    return errs
  }

  function calculate() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    const res = calcCompound(
      parseFloat(principal),
      parseFloat(rate),
      Math.round(parseFloat(years)),
      frequency,
      parseFloat(monthlyContrib) || 0,
    )
    setResult({ ...res, currency: cfg.currency })
    setShowSchedule(false)
  }

  function reset() {
    setPrincipal('')
    setRate('')
    setYears('')
    setMonthlyContrib('')
    setResult(null)
    setErrors({})
  }

  const t = {
    country: isAr ? 'الدولة' : 'Country',
    principal: isAr ? 'المبلغ الأولي (رأس المال)' : 'Initial Amount (Principal)',
    rate: isAr ? 'معدل الفائدة السنوي (%)' : 'Annual Interest Rate (%)',
    years: isAr ? 'مدة الاستثمار (سنوات)' : 'Investment Period (Years)',
    frequency: isAr ? 'تكرار المضاعفة' : 'Compounding Frequency',
    monthlyContrib: isAr ? 'إضافة شهرية (اختياري)' : 'Monthly Contribution (Optional)',
    calculate: isAr ? 'احسب' : 'Calculate',
    reset: isAr ? 'إعادة تعيين' : 'Reset',
    results: isAr ? 'نتائجك' : 'Your Results',
    finalBalance: isAr ? 'الرصيد النهائي' : 'Final Balance',
    totalContrib: isAr ? 'إجمالي المساهمات' : 'Total Contributions',
    totalInterest: isAr ? 'إجمالي الفوائد المكتسبة' : 'Total Interest Earned',
    interestRatio: isAr ? 'نسبة النمو' : 'Growth Ratio',
    doubling: isAr ? 'قاعدة 72 — مدة مضاعفة رأس المال' : 'Rule of 72 — Doubling Time',
    doublingYears: (y: number) => isAr ? `~${y} سنة بهذا المعدل` : `~${y} years at this rate`,
    growthChart: isAr ? 'مخطط النمو السنوي' : 'Year-by-Year Growth',
    schedule: isAr ? 'جدول الفوائد المركبة' : 'Compound Interest Schedule',
    hideSchedule: isAr ? 'إخفاء الجدول' : 'Hide Schedule',
    showSchedule: isAr ? 'عرض الجدول' : 'Show Schedule',
    year: isAr ? 'السنة' : 'Year',
    startBal: isAr ? 'الرصيد الافتتاحي' : 'Opening Balance',
    added: isAr ? 'المضاف' : 'Added',
    interest: isAr ? 'الفائدة' : 'Interest',
    endBal: isAr ? 'الرصيد الختامي' : 'Closing Balance',
    typicalRate: isAr
      ? `معدلات الادخار الشائعة في ${cfg.labelAr}: ${cfg.typicalSavingsRate.min}–${cfg.typicalSavingsRate.max}%`
      : `Typical savings rates in ${cfg.label}: ${cfg.typicalSavingsRate.min}–${cfg.typicalSavingsRate.max}%`,
    countryNote: isAr ? cfg.notesAr : cfg.notes,
    enter: isAr ? 'أدخل' : 'Enter',
    disclaimer: isAr
      ? 'هذه أداة تقدير فقط. النتائج الفعلية تختلف حسب المنتج المالي والبنك والأسواق. الحسابات تتم في متصفحك.'
      : 'Estimation tool only. Actual returns vary by product, bank, and market conditions. Calculations happen in your browser.',
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Country ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.country}</label>
        <select
          value={country}
          onChange={e => { setCountry(e.target.value); setResult(null) }}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
        >
          {COUNTRIES.map(c => (
            <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{t.countryNote}</p>
      </div>

      {/* ── Principal ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.principal}</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">{cfg.currency}</span>
          <input
            type="number"
            min="0"
            value={principal}
            onChange={e => setPrincipal(e.target.value)}
            placeholder={t.enter}
            className={`w-full pl-14 pr-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${errors.principal ? 'border-red-400' : 'border-gray-200'}`}
          />
        </div>
        {errors.principal && <p className="text-xs text-red-500 mt-1">{errors.principal}</p>}
      </div>

      {/* ── Rate + Years ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-gray-700">{t.rate}</label>
            <span className="text-xs text-emerald-600 font-medium">{t.typicalRate}</span>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={rate}
              onChange={e => setRate(e.target.value)}
              placeholder={`${cfg.typicalSavingsRate.min}–${cfg.typicalSavingsRate.max}`}
              className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${errors.rate ? 'border-red-400' : 'border-gray-200'}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">%</span>
          </div>
          {errors.rate && <p className="text-xs text-red-500 mt-1">{errors.rate}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.years}</label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="50"
              value={years}
              onChange={e => setYears(e.target.value)}
              placeholder="1–50"
              className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition ${errors.years ? 'border-red-400' : 'border-gray-200'}`}
            />
          </div>
          {errors.years && <p className="text-xs text-red-500 mt-1">{errors.years}</p>}
        </div>
      </div>

      {/* ── Frequency ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.frequency}</label>
        <div className="flex gap-2 flex-wrap">
          {COMPOUND_FREQUENCIES.map(f => (
            <button
              key={f.value}
              onClick={() => setFrequency(f.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                frequency === f.value
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isAr ? f.labelAr : f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Monthly contribution ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.monthlyContrib}</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">{cfg.currency}</span>
          <input
            type="number"
            min="0"
            value={monthlyContrib}
            onChange={e => setMonthlyContrib(e.target.value)}
            placeholder="0"
            className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* ── Buttons ── */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {t.calculate}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {t.reset}
        </button>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-5 border border-gray-100">
          <h3 className="font-bold text-gray-900">{t.results}</h3>

          {/* Hero */}
          <div className="bg-emerald-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">{t.finalBalance}</div>
            <div className="text-3xl font-black">{fmt(result.finalBalance, result.currency)}</div>
          </div>

          {/* Pie + breakdown */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <PieChart
              principal={parseFloat(principal)}
              contributions={(parseFloat(monthlyContrib) || 0) * Math.round(parseFloat(years)) * 12}
              interest={result.totalInterest}
            />
            <div className="flex-1 w-full space-y-2">
              <BreakRow label={isAr ? 'رأس المال الأولي' : 'Initial Principal'} value={fmt(parseFloat(principal), result.currency)} color="text-emerald-700" dot="bg-emerald-600" />
              {(parseFloat(monthlyContrib) || 0) > 0 && (
                <BreakRow label={isAr ? 'مجموع الإضافات الشهرية' : 'Total Monthly Contributions'} value={fmt((parseFloat(monthlyContrib) || 0) * Math.round(parseFloat(years)) * 12, result.currency)} color="text-emerald-500" dot="bg-emerald-300" />
              )}
              <BreakRow label={t.totalInterest} value={fmt(result.totalInterest, result.currency)} color="text-red-500" dot="bg-red-300" />
              <div className="border-t border-gray-200 pt-2">
                <BreakRow
                  label={t.interestRatio}
                  value={`${((result.totalInterest / result.totalContributions) * 100).toFixed(1)}%`}
                  color="text-gray-900"
                  highlight
                />
              </div>
            </div>
          </div>

          {/* Rule of 72 */}
          {result.doublingYears && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              <span className="font-semibold">{t.doubling}:</span>{' '}
              {t.doublingYears(result.doublingYears)}
            </div>
          )}

          {/* Growth bar chart */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{t.growthChart}</h4>
            <GrowthChart schedule={result.schedule} currency={result.currency} />
          </div>

          {/* Schedule toggle */}
          <button
            onClick={() => setShowSchedule(v => !v)}
            className="w-full text-center text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors py-2 border border-emerald-200 rounded-xl"
          >
            {showSchedule ? t.hideSchedule : t.showSchedule}
          </button>

          {showSchedule && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 text-gray-600 uppercase">
                  <tr>
                    {[t.year, t.startBal, t.added, t.interest, t.endBal].map(h => (
                      <th key={h} className="px-3 py-2 text-right font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.schedule.map(row => (
                    <tr key={row.year} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500 text-right">{row.year}</td>
                      <td className="px-3 py-2 text-gray-900 text-right">{fmtShort(row.startBalance)}</td>
                      <td className="px-3 py-2 text-emerald-600 text-right">{fmtShort(row.contributions)}</td>
                      <td className="px-3 py-2 text-red-500 text-right">{fmtShort(row.interest)}</td>
                      <td className="px-3 py-2 text-gray-900 font-semibold text-right">{fmtShort(row.endBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 leading-relaxed">{t.disclaimer}</p>
    </div>
  )
}

function BreakRow({
  label, value, color, dot, highlight = false,
}: {
  label: string; value: string; color: string; dot?: string; highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {dot && <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`} />}
      <span className="text-gray-600">{label}</span>
      <span className={`ml-auto font-semibold ${color}`}>{value}</span>
    </div>
  )
}
