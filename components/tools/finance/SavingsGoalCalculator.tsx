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
    inflationRate: 3.5,
    emergencyMonths: 6,
    notes: 'No income tax in UAE. Financial advisors recommend saving 20–30% of salary.',
    notesAr: 'لا ضريبة دخل في الإمارات. يُوصي الخبراء بادخار 20–30% من الراتب.',
  },
  {
    value: 'saudi',
    label: 'Saudi Arabia',
    labelAr: 'السعودية',
    currency: 'SAR',
    typicalSavingsRate: { min: 1.5, max: 5.0 },
    inflationRate: 2.5,
    emergencyMonths: 6,
    notes: 'Saudi nationals pay GOSI (9%) and Zakat (~2.5%) on net assets. Plan around net take-home.',
    notesAr: 'يدفع المواطنون السعوديون GOSI (9%) والزكاة (~2.5%). خطط على أساس صافي الراتب.',
  },
  {
    value: 'qatar',
    label: 'Qatar',
    labelAr: 'قطر',
    currency: 'QAR',
    typicalSavingsRate: { min: 1.5, max: 4.5 },
    inflationRate: 3.0,
    emergencyMonths: 6,
    notes: 'No income tax in Qatar. High cost of living in Doha; factor in housing when planning.',
    notesAr: 'لا ضريبة دخل في قطر. تكلفة المعيشة في الدوحة مرتفعة؛ احسب السكن في خطتك.',
  },
  {
    value: 'kuwait',
    label: 'Kuwait',
    labelAr: 'الكويت',
    currency: 'KWD',
    typicalSavingsRate: { min: 1.0, max: 4.0 },
    inflationRate: 2.8,
    emergencyMonths: 6,
    notes: 'No personal income tax in Kuwait. KWD is one of the world\'s highest-value currencies.',
    notesAr: 'لا ضريبة دخل شخصية في الكويت. الدينار الكويتي من أعلى العملات قيمةً عالمياً.',
  },
  {
    value: 'bahrain',
    label: 'Bahrain',
    labelAr: 'البحرين',
    currency: 'BHD',
    typicalSavingsRate: { min: 1.5, max: 4.5 },
    inflationRate: 2.5,
    emergencyMonths: 6,
    notes: 'No income tax in Bahrain. Lower cost of living than Dubai; good savings potential.',
    notesAr: 'لا ضريبة دخل في البحرين. تكلفة المعيشة أقل من دبي؛ إمكانية ادخار جيدة.',
  },
  {
    value: 'oman',
    label: 'Oman',
    labelAr: 'عُمان',
    currency: 'OMR',
    typicalSavingsRate: { min: 1.5, max: 4.5 },
    inflationRate: 2.0,
    emergencyMonths: 6,
    notes: 'No income tax in Oman. Expats should note mandatory social insurance for nationals.',
    notesAr: 'لا ضريبة دخل في عُمان. يلتزم المواطنون بالتأمين الاجتماعي الإلزامي.',
  },
]

const GOAL_PRESETS = [
  { label: 'Emergency Fund',    labelAr: 'صندوق الطوارئ',     multiplier: 'emergency' },
  { label: 'Down Payment',      labelAr: 'دفعة أولى سكن',     multiplier: null },
  { label: 'Car Purchase',      labelAr: 'شراء سيارة',        multiplier: null },
  { label: 'Wedding',           labelAr: 'حفل زفاف',          multiplier: null },
  { label: 'Education',         labelAr: 'تعليم',             multiplier: null },
  { label: 'Travel / Holiday',  labelAr: 'سفر / إجازة',       multiplier: null },
  { label: 'Retirement Fund',   labelAr: 'صندوق التقاعد',     multiplier: null },
  { label: 'Custom Goal',       labelAr: 'هدف مخصص',          multiplier: null },
]

// ─── Types ─────────────────────────────────────────────────────────────────────
type Result = {
  monthlyRequired: number
  totalSaved: number
  totalInterest: number
  finalBalance: number
  monthsToGoal: number | null   // if saving fixed amount, how long?
  shortfall: number             // if deadline fixed but savings not enough
  schedule: YearRow[]
  currency: string
  feasible: boolean
  savingsRatio: number | null   // % of salary
  emergencyTarget: number | null
}

type YearRow = {
  year: number
  opening: number
  contributions: number
  interest: number
  closing: number
  progress: number  // % toward goal
}

// ─── Core math ─────────────────────────────────────────────────────────────────
function calcSavingsGoal(
  goalAmount: number,
  currentSavings: number,
  annualRate: number,
  months: number,
  monthlySalary: number,
): Result & { currency: string } {
  const r = annualRate / 100 / 12
  const remaining = goalAmount - currentSavings

  // Monthly required (PMT formula: how much to save per month to hit goal in n months)
  let monthlyRequired: number
  if (r === 0) {
    monthlyRequired = remaining / months
  } else {
    monthlyRequired = (remaining * r) / (Math.pow(1 + r, months) - 1)
  }

  // Build yearly schedule using monthlyRequired
  const schedule: YearRow[] = []
  let balance = currentSavings
  const years = Math.ceil(months / 12)

  for (let y = 1; y <= years; y++) {
    const opening = balance
    const monthsThisYear = y === years ? (months % 12 || 12) : 12
    let yearContrib = 0
    let yearInterest = 0

    for (let m = 0; m < monthsThisYear; m++) {
      const interest = balance * r
      balance += interest + monthlyRequired
      yearContrib += monthlyRequired
      yearInterest += interest
    }

    schedule.push({
      year: y,
      opening,
      contributions: yearContrib,
      interest: yearInterest,
      closing: balance,
      progress: Math.min(100, (balance / goalAmount) * 100),
    })
  }

  const finalBalance = balance
  const totalContributions = monthlyRequired * months + currentSavings
  const totalInterest = finalBalance - totalContributions

  const savingsRatio = monthlySalary > 0 ? (monthlyRequired / monthlySalary) * 100 : null
  const feasible = monthlySalary === 0 || monthlyRequired <= monthlySalary * 0.8

  return {
    monthlyRequired,
    totalSaved: totalContributions,
    totalInterest,
    finalBalance,
    monthsToGoal: months,
    shortfall: monthlyRequired > monthlySalary * 0.8 && monthlySalary > 0
      ? monthlyRequired - monthlySalary * 0.5
      : 0,
    schedule,
    currency: '',
    feasible,
    savingsRatio,
    emergencyTarget: null,
  }
}

function fmt(n: number, currency: string) {
  return `${currency} ${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtShort(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── Progress ring ─────────────────────────────────────────────────────────────
function ProgressRing({ pct, label, sublabel }: { pct: number; label: string; sublabel: string }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0 -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="#059669" strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <g transform="rotate(90, 50, 50)">
        <text x="50" y="45" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#059669">{Math.round(pct)}%</text>
        <text x="50" y="57" textAnchor="middle" fontSize="6" fill="#6b7280">{label}</text>
        <text x="50" y="66" textAnchor="middle" fontSize="5.5" fill="#6b7280">{sublabel}</text>
      </g>
    </svg>
  )
}

// ─── Milestone bar ─────────────────────────────────────────────────────────────
function MilestoneBar({ schedule, goal, currency }: { schedule: YearRow[]; goal: number; currency: string }) {
  const milestones = [25, 50, 75, 100]
  return (
    <div className="space-y-2">
      {schedule.map(row => (
        <div key={row.year} className="flex items-center gap-2 text-xs">
          <span className="w-10 text-gray-500 flex-shrink-0 text-right">
            {row.year}yr
          </span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${row.progress}%`,
                background: row.progress >= 100
                  ? '#059669'
                  : `linear-gradient(90deg, #059669 ${row.progress}%, #34d399 100%)`,
              }}
            />
            {milestones.map(m => (
              <div
                key={m}
                className="absolute top-0 h-full w-px bg-white opacity-60"
                style={{ left: `${m}%` }}
              />
            ))}
          </div>
          <span className="w-20 text-gray-600 text-right flex-shrink-0">
            {currency} {fmtShort(row.closing)}
          </span>
        </div>
      ))}
      <div className="flex justify-between text-xs text-gray-500 px-12">
        <span>0%</span><span>25%</span><span>50%</span><span>75%</span>
        <span className="text-emerald-600 font-semibold">Goal</span>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function SavingsGoalCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [country, setCountry] = useState('uae')
  const [goalPreset, setGoalPreset] = useState(0)
  const [goalAmount, setGoalAmount] = useState('')
  const [currentSavings, setCurrentSavings] = useState('')
  const [targetMonths, setTargetMonths] = useState('')
  const [targetUnit, setTargetUnit] = useState<'months' | 'years'>('years')
  const [annualRate, setAnnualRate] = useState('')
  const [monthlySalary, setMonthlySalary] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const cfg = COUNTRIES.find(c => c.value === country)!

  // Auto-fill emergency fund when preset selected
  function handlePresetChange(idx: number) {
    setGoalPreset(idx)
    const preset = GOAL_PRESETS[idx]
    if (preset.multiplier === 'emergency' && monthlySalary) {
      const salary = parseFloat(monthlySalary)
      if (salary > 0) setGoalAmount((salary * cfg.emergencyMonths).toString())
    }
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!parseFloat(goalAmount) || parseFloat(goalAmount) <= 0)
      errs.goalAmount = isAr ? 'أدخل مبلغ هدف صحيحاً' : 'Enter a valid goal amount'
    const months = targetUnit === 'years'
      ? parseFloat(targetMonths) * 12
      : parseFloat(targetMonths)
    if (!months || months < 1 || months > 600)
      errs.targetMonths = isAr ? 'أدخل مدة بين شهر و50 سنة' : 'Enter a period between 1 month and 50 years'
    const rate = parseFloat(annualRate)
    if (isNaN(rate) || rate < 0 || rate > 50)
      errs.annualRate = isAr ? 'أدخل معدلاً بين 0 و50%' : 'Enter a rate between 0 and 50%'
    return errs
  }

  function calculate() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    const months = targetUnit === 'years'
      ? Math.round(parseFloat(targetMonths) * 12)
      : Math.round(parseFloat(targetMonths))

    const res = calcSavingsGoal(
      parseFloat(goalAmount),
      parseFloat(currentSavings) || 0,
      parseFloat(annualRate) || 0,
      months,
      parseFloat(monthlySalary) || 0,
    )

    // Emergency fund target
    const emergencyTarget = parseFloat(monthlySalary) > 0
      ? parseFloat(monthlySalary) * cfg.emergencyMonths
      : null

    setResult({
      ...res,
      currency: cfg.currency,
      emergencyTarget,
    })
    setShowSchedule(false)
  }

  function reset() {
    setGoalAmount('')
    setCurrentSavings('')
    setTargetMonths('')
    setAnnualRate('')
    setMonthlySalary('')
    setResult(null)
    setErrors({})
  }

  const t = {
    country: isAr ? 'الدولة' : 'Country',
    goalPreset: isAr ? 'نوع الهدف' : 'Goal Type',
    goalAmount: isAr ? 'مبلغ الهدف المستهدف' : 'Savings Goal Amount',
    currentSavings: isAr ? 'مدخراتك الحالية (اختياري)' : 'Current Savings (Optional)',
    targetMonths: isAr ? 'المدة الزمنية للوصول للهدف' : 'Time to Reach Goal',
    months: isAr ? 'شهور' : 'Months',
    years: isAr ? 'سنوات' : 'Years',
    annualRate: isAr ? 'معدل عائد الادخار السنوي (%)' : 'Annual Savings Return Rate (%)',
    monthlySalary: isAr ? 'راتبك الشهري (اختياري)' : 'Monthly Salary (Optional)',
    calculate: isAr ? 'احسب' : 'Calculate',
    reset: isAr ? 'إعادة تعيين' : 'Reset',
    results: isAr ? 'خطة ادخارك' : 'Your Savings Plan',
    monthlyRequired: isAr ? 'ادخار شهري مطلوب' : 'Monthly Savings Required',
    totalContrib: isAr ? 'إجمالي مساهماتك' : 'Total Your Contributions',
    totalInterest: isAr ? 'إجمالي فوائد مكتسبة' : 'Total Interest Earned',
    finalBalance: isAr ? 'الرصيد عند الهدف' : 'Balance at Goal Date',
    goalReached: isAr ? 'الهدف محقق' : 'Goal Reached',
    savingsRatio: isAr ? 'من راتبك الشهري' : 'of your monthly salary',
    feasible: isAr ? '✓ قابل للتحقيق ضمن راتبك' : '✓ Feasible within your salary',
    infeasible: isAr ? '⚠ يتجاوز 80% من راتبك — فكّر في تمديد المدة' : '⚠ Exceeds 80% of salary — consider extending timeline',
    emergencyNote: (n: number, cur: string) =>
      isAr
        ? `صندوق طوارئ موصى به (${cfg.emergencyMonths} أشهر): ${cur} ${fmtShort(n)}`
        : `Recommended emergency fund (${cfg.emergencyMonths} months): ${cur} ${fmtShort(n)}`,
    progressLabel: isAr ? 'نحو الهدف' : 'to goal',
    yearsLabel: isAr ? 'سنوات' : 'years',
    milestones: isAr ? 'تقدم سنة بسنة' : 'Year-by-Year Progress',
    schedule: isAr ? 'جدول الادخار التفصيلي' : 'Detailed Savings Schedule',
    showSchedule: isAr ? 'عرض الجدول' : 'Show Schedule',
    hideSchedule: isAr ? 'إخفاء الجدول' : 'Hide Schedule',
    yearCol: isAr ? 'السنة' : 'Year',
    openCol: isAr ? 'افتتاحي' : 'Opening',
    contribCol: isAr ? 'المضاف' : 'Added',
    intCol: isAr ? 'الفائدة' : 'Interest',
    closeCol: isAr ? 'ختامي' : 'Closing',
    progCol: isAr ? 'التقدم' : 'Progress',
    typicalRate: isAr
      ? `معدلات الادخار الشائعة في ${cfg.labelAr}: ${cfg.typicalSavingsRate.min}–${cfg.typicalSavingsRate.max}%`
      : `Typical savings rates in ${cfg.label}: ${cfg.typicalSavingsRate.min}–${cfg.typicalSavingsRate.max}%`,
    countryNote: isAr ? cfg.notesAr : cfg.notes,
    enter: isAr ? 'أدخل' : 'Enter',
    disclaimer: isAr
      ? 'هذه أداة تقدير تخطيطية فقط. العوائد الفعلية تختلف حسب المنتج والبنك والأسواق. الحسابات تتم في متصفحك.'
      : 'Planning estimate only. Actual returns vary by product, bank, and market conditions. Calculations happen in your browser.',
  }

  const progressPct = result
    ? ((parseFloat(currentSavings) || 0) / parseFloat(goalAmount)) * 100
    : 0

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Country ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.country}</label>
        <select
          value={country}
          onChange={e => { setCountry(e.target.value); setResult(null) }}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
        >
          {COUNTRIES.map(c => (
            <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{t.countryNote}</p>
      </div>

      {/* ── Goal type presets ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.goalPreset}</label>
        <div className="flex gap-2 flex-wrap">
          {GOAL_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => handlePresetChange(i)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                goalPreset === i
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isAr ? p.labelAr : p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Salary (used for emergency fund auto-calc + feasibility) ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.monthlySalary}</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">{cfg.currency}</span>
          <input
            type="number"
            min="0"
            value={monthlySalary}
            onChange={e => setMonthlySalary(e.target.value)}
            placeholder={t.enter}
            className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </div>

      {/* ── Goal amount + current savings ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.goalAmount}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">{cfg.currency}</span>
            <input
              type="number"
              min="0"
              value={goalAmount}
              onChange={e => setGoalAmount(e.target.value)}
              placeholder={t.enter}
              className={`w-full pl-14 pr-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${errors.goalAmount ? 'border-red-400' : 'border-gray-200'}`}
            />
          </div>
          {errors.goalAmount && <p className="text-xs text-red-500 mt-1">{errors.goalAmount}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.currentSavings}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">{cfg.currency}</span>
            <input
              type="number"
              min="0"
              value={currentSavings}
              onChange={e => setCurrentSavings(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.targetMonths}</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            value={targetMonths}
            onChange={e => setTargetMonths(e.target.value)}
            placeholder={t.enter}
            className={`flex-1 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${errors.targetMonths ? 'border-red-400' : 'border-gray-200'}`}
          />
          <button
            onClick={() => setTargetUnit('months')}
            className={`px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${targetUnit === 'months' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {t.months}
          </button>
          <button
            onClick={() => setTargetUnit('years')}
            className={`px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${targetUnit === 'years' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {t.years}
          </button>
        </div>
        {errors.targetMonths && <p className="text-xs text-red-500 mt-1">{errors.targetMonths}</p>}
      </div>

      {/* ── Rate ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-gray-700">{t.annualRate}</label>
          <span className="text-xs text-emerald-600 font-medium">{t.typicalRate}</span>
        </div>
        <div className="relative">
          <input
            type="number"
            min="0"
            max="50"
            step="0.1"
            value={annualRate}
            onChange={e => setAnnualRate(e.target.value)}
            placeholder={`${cfg.typicalSavingsRate.min}–${cfg.typicalSavingsRate.max}`}
            className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition ${errors.annualRate ? 'border-red-400' : 'border-gray-200'}`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">%</span>
        </div>
        {errors.annualRate && <p className="text-xs text-red-500 mt-1">{errors.annualRate}</p>}
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

          {/* Hero — monthly required */}
          <div className="bg-emerald-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">{t.monthlyRequired}</div>
            <div className="text-3xl font-black">{fmt(result.monthlyRequired, result.currency)}</div>
            {result.savingsRatio !== null && (
              <div className="text-sm opacity-75 mt-1">
                {result.savingsRatio.toFixed(1)}% {t.savingsRatio}
              </div>
            )}
          </div>

          {/* Feasibility badge */}
          {monthlySalary && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${result.feasible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {result.feasible ? t.feasible : t.infeasible}
            </div>
          )}

          {/* Emergency fund note */}
          {result.emergencyTarget && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
              {t.emergencyNote(result.emergencyTarget, result.currency)}
            </div>
          )}

          {/* Progress ring + breakdown */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ProgressRing
              pct={progressPct}
              label={isAr ? 'مدخر حالياً' : 'saved now'}
              sublabel={isAr ? 'نحو الهدف' : 'toward goal'}
            />
            <div className="flex-1 w-full space-y-2">
              <SRow label={isAr ? 'هدف الادخار' : 'Savings Goal'} value={fmt(parseFloat(goalAmount), result.currency)} color="text-gray-900" />
              <SRow label={isAr ? 'مدخرات حالية' : 'Current Savings'} value={fmt(parseFloat(currentSavings) || 0, result.currency)} color="text-gray-600" />
              <SRow label={t.totalContrib} value={fmt(result.totalSaved, result.currency)} color="text-emerald-600" />
              <SRow label={t.totalInterest} value={fmt(result.totalInterest, result.currency)} color="text-red-400" />
              <div className="border-t border-gray-200 pt-2">
                <SRow label={t.finalBalance} value={fmt(result.finalBalance, result.currency)} color="text-gray-900" bold />
              </div>
            </div>
          </div>

          {/* Year-by-year milestone bar */}
          {result.schedule.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">{t.milestones}</h4>
              <MilestoneBar schedule={result.schedule} goal={parseFloat(goalAmount)} currency={result.currency} />
            </div>
          )}

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
                    {[t.yearCol, t.openCol, t.contribCol, t.intCol, t.closeCol, t.progCol].map(h => (
                      <th key={h} className="px-3 py-2 text-right font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {result.schedule.map(row => (
                    <tr key={row.year} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500 text-right">{row.year}</td>
                      <td className="px-3 py-2 text-gray-700 text-right">{fmtShort(row.opening)}</td>
                      <td className="px-3 py-2 text-emerald-600 text-right">{fmtShort(row.contributions)}</td>
                      <td className="px-3 py-2 text-red-400 text-right">{fmtShort(row.interest)}</td>
                      <td className="px-3 py-2 text-gray-900 font-semibold text-right">{fmtShort(row.closing)}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`font-semibold ${row.progress >= 100 ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {row.progress.toFixed(0)}%
                        </span>
                      </td>
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

function SRow({ label, value, color, bold = false }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-semibold'} ${color}`}>{value}</span>
    </div>
  )
}
