'use client'

import { useState, useMemo } from 'react'

type Props = { locale: string }

// ─── Oman-law constants (Central Bank of Oman) ───────────────────────────────
const OMAN_MAX_RATE        = 6       // % per annum, reducing balance (GPL ceiling)
const OMAN_MAX_TENURE_GPL  = 10      // years — General Personal Loan
const OMAN_MAX_TENURE_HL   = 25      // years — Housing Loan
const OMAN_MAX_AGE         = 70      // years — borrower must repay by this age
const OMAN_DBR_GPL         = 0.50    // 50 % of net salary (GPL only)
const OMAN_DBR_GPL_HOUSING = 0.60    // 60 % of net salary (GPL + Housing)
const CURRENCY             = 'OMR'

// ─── Loan types ──────────────────────────────────────────────────────────────
const LOAN_TYPES = [
  { value: 'gpl',     labelEn: 'Personal Loan',  labelAr: 'قرض شخصي',   maxTenure: OMAN_MAX_TENURE_GPL, dbr: OMAN_DBR_GPL },
  { value: 'housing', labelEn: 'Housing Loan',   labelAr: 'قرض إسكاني', maxTenure: OMAN_MAX_TENURE_HL,  dbr: OMAN_DBR_GPL_HOUSING },
]

// ─── Core EMI engine ─────────────────────────────────────────────────────────
function calcEmi(principal: number, annualRate: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0
  const r = annualRate / 100 / 12
  if (r === 0) return principal / months
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function maxLoanFromSalary(
  salary: number,
  dbrRatio: number,
  annualRate: number,
  tenureYears: number,
): number {
  // Reverse EMI: P = EMI × [(1+r)^n − 1] / [r × (1+r)^n]
  const maxEmi = salary * dbrRatio
  const r = annualRate / 100 / 12
  const n = tenureYears * 12
  if (r === 0) return maxEmi * n
  return (maxEmi * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n))
}

// ─── Interfaces ──────────────────────────────────────────────────────────────
type Mode = 'emi' | 'loan'

type EmiResult = {
  emi: number
  totalInterest: number
  totalPayable: number
  months: number
  effectiveRate: number
  warnings: {
    rateClamped: boolean
    tenureClamped: boolean
    ageClamped: boolean
    aboveDbr: boolean
  }
}

type LoanResult = EmiResult & {
  maxLoan: number
}

// ─── Custom hook ─────────────────────────────────────────────────────────────
function useOmanCalc(
  mode: Mode,
  loanType: string,
  loanAmount: string,
  rate: string,
  tenureYears: string,
  salary: string,
  age: string,
) {
  return useMemo(() => {
    const lt       = LOAN_TYPES.find(l => l.value === loanType)!
    const maxTenure = lt.maxTenure
    const dbrRatio  = lt.dbr

    let P  = parseFloat(loanAmount) || 0
    let r  = parseFloat(rate)       || OMAN_MAX_RATE
    let T  = parseInt(tenureYears)  || 0
    const S  = parseFloat(salary)   || 0
    const A  = parseInt(age)        || 0

    const warnings = {
      rateClamped: false,
      tenureClamped: false,
      ageClamped: false,
      aboveDbr: false,
    }

    // 1. Clamp rate to Oman ceiling
    if (r > OMAN_MAX_RATE) { r = OMAN_MAX_RATE; warnings.rateClamped = true }

    // 2. Age-based max tenure
    let effectiveMaxTenure = maxTenure
    if (A > 0) {
      const ageLimit = OMAN_MAX_AGE - A
      if (ageLimit < effectiveMaxTenure) {
        effectiveMaxTenure = Math.max(0, ageLimit)
        if (T > effectiveMaxTenure) warnings.ageClamped = true
      }
    }

    // 3. Clamp tenure
    if (T > effectiveMaxTenure) { T = effectiveMaxTenure; warnings.tenureClamped = true }
    if (T < 1) T = 1

    const n   = T * 12
    const emi = calcEmi(P, r, n)

    // 4. DBR check
    if (S > 0 && emi > S * dbrRatio) warnings.aboveDbr = true

    const totalPayable   = emi * n
    const totalInterest  = totalPayable - P
    const effectiveRate  = r

    // Loan mode — compute max loan
    const maxLoan = mode === 'loan' && S > 0 && T > 0
      ? maxLoanFromSalary(S, dbrRatio, r, T)
      : 0

    return {
      emi,
      totalInterest,
      totalPayable,
      months: n,
      effectiveRate,
      maxLoan,
      warnings,
      isReady: P > 0 && T > 0,
    } satisfies (LoanResult & { isReady: boolean })
  }, [mode, loanType, loanAmount, rate, tenureYears, salary, age])
}

// ─── Formatting ──────────────────────────────────────────────────────────────
function fmt(n: number) {
  return `${CURRENCY} ${n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function OmanEmiCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [mode,         setMode]         = useState<Mode>('emi')
  const [loanType,     setLoanType]     = useState('gpl')
  const [loanAmount,   setLoanAmount]   = useState('')
  const [rate,         setRate]         = useState('6')
  const [tenureYears,  setTenureYears]  = useState('')
  const [salary,       setSalary]       = useState('')
  const [age,          setAge]          = useState('')
  const [submitted,    setSubmitted]    = useState(false)

  const result = useOmanCalc(mode, loanType, loanAmount, rate, tenureYears, salary, age)

  const lt = LOAN_TYPES.find(l => l.value === loanType)!

  // ── Labels ──────────────────────────────────────────────────────────────
  const t = isAr ? {
    modeEmi:         'حاسبة القسط الشهري',
    modeLoan:        'أقصى مبلغ قرض',
    loanType:        'نوع القرض',
    loanAmount:      'مبلغ القرض (ر.ع)',
    rate:            'نسبة الفائدة السنوية (%)',
    tenure:          'مدة القرض (بالسنوات)',
    salary:          'صافي الراتب الشهري (ر.ع)',
    age:             'عمرك الحالي (اختياري)',
    calculate:       'احسب',
    reset:           'إعادة تعيين',
    results:         'النتائج',
    monthlyEmi:      'القسط الشهري',
    totalInterest:   'إجمالي الفائدة',
    totalPayable:    'إجمالي المبلغ المستحق',
    tenureMonths:    'عدد الأشهر',
    effectiveRate:   'معدل الفائدة الفعلي',
    maxLoan:         'أقصى قرض ممكن',
    warnRate:        'يُقيّد البنك المركزي العُماني معدل الفائدة بحد أقصى 6% سنوياً — تم استخدام 6%.',
    warnTenure:      `القرض الشخصي في عُمان: الحد الأقصى للمدة ${lt.maxTenure} سنوات.`,
    warnAge:         'تم تعديل المدة لضمان السداد الكامل قبل سن 70.',
    warnDbr:         `يجب ألّا يتجاوز القسط الشهري ${Math.round(lt.dbr * 100)}% من صافي راتبك وفقاً لقواعد نسبة خدمة الدين.`,
    enterAmount:     'أدخل المبلغ',
    enterYears:      'أدخل عدد السنوات',
    enterSalary:     'أدخل الراتب',
    enterAge:        'مثال: 35',
    noteReducing:    'تُطبَّق الفائدة على الرصيد المتناقص وفق اشتراطات البنك المركزي العُماني.',
  } : {
    modeEmi:         'EMI Calculator',
    modeLoan:        'Max Loan Amount',
    loanType:        'Loan Type',
    loanAmount:      `Loan Amount (${CURRENCY})`,
    rate:            'Annual Interest Rate (%)',
    tenure:          'Tenure (Years)',
    salary:          `Net Monthly Salary (${CURRENCY})`,
    age:             'Your Current Age (optional)',
    calculate:       'Calculate',
    reset:           'Reset',
    results:         'Results',
    monthlyEmi:      'Monthly EMI',
    totalInterest:   'Total Interest',
    totalPayable:    'Total Payable',
    tenureMonths:    'Tenure (Months)',
    effectiveRate:   'Effective Rate',
    maxLoan:         'Max Loan You Can Get',
    warnRate:        'Central Bank of Oman caps personal-loan interest at 6% p.a. — using 6% for this calculation.',
    warnTenure:      `Oman personal loans: maximum tenure is ${lt.maxTenure} years.`,
    warnAge:         'Tenure adjusted to ensure full repayment before age 70.',
    warnDbr:         `Monthly repayment must not exceed ${Math.round(lt.dbr * 100)}% of your net salary under Oman DBR rules.`,
    enterAmount:     'Enter amount',
    enterYears:      'e.g. 3',
    enterSalary:     'Enter salary',
    enterAge:        'e.g. 35',
    noteReducing:    'Interest calculated on reducing balance per Central Bank of Oman requirements.',
  }

  function reset() {
    setLoanAmount(''); setRate('6'); setTenureYears('')
    setSalary(''); setAge(''); setSubmitted(false)
  }

  const warnings: string[] = []
  if (submitted) {
    if (result.warnings.rateClamped)   warnings.push(t.warnRate)
    if (result.warnings.tenureClamped || result.warnings.ageClamped) warnings.push(
      result.warnings.ageClamped ? t.warnAge : t.warnTenure
    )
    if (result.warnings.aboveDbr)      warnings.push(t.warnDbr)
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Mode toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {(['emi', 'loan'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setSubmitted(false) }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
              mode === m
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m === 'emi' ? t.modeEmi : t.modeLoan}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Loan type */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.loanType}
          </label>
          <div className="flex gap-3">
            {LOAN_TYPES.map(lt => (
              <button
                key={lt.value}
                onClick={() => setLoanType(lt.value)}
                className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  loanType === lt.value
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-300'
                }`}
              >
                {isAr ? lt.labelAr : lt.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Loan amount — only in EMI mode */}
        {mode === 'emi' && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {t.loanAmount}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                {CURRENCY}
              </span>
              <input
                type="number"
                min="500"
                max="100000"
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
                placeholder={t.enterAmount}
                className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>
        )}

        {/* Interest rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.rate}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              max="6"
              step="0.1"
              value={rate}
              onChange={e => setRate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {isAr ? 'الحد الأقصى: 6% (البنك المركزي العُماني)' : 'Max 6% per CBO regulations'}
          </p>
        </div>

        {/* Tenure */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.tenure}
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max={lt.maxTenure}
              value={tenureYears}
              onChange={e => setTenureYears(e.target.value)}
              placeholder={t.enterYears}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {isAr ? 'سنة' : 'yr'}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {isAr ? `الحد الأقصى: ${lt.maxTenure} سنوات` : `Max ${lt.maxTenure} years`}
          </p>
        </div>

        {/* Salary — always shown (used for DBR check in EMI mode; main input in Loan mode) */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.salary}
            {mode === 'emi' && (
              <span className="ml-1 text-xs text-gray-500 font-normal">
                ({isAr ? 'لفحص نسبة خدمة الدين' : 'for DBR check'})
              </span>
            )}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {CURRENCY}
            </span>
            <input
              type="number"
              min="0"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              placeholder={t.enterSalary}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Age — optional */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.age}
          </label>
          <input
            type="number"
            min="18"
            max="69"
            value={age}
            onChange={e => setAge(e.target.value)}
            placeholder={t.enterAge}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setSubmitted(true)}
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

      {/* Warnings */}
      {submitted && warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
              <span className="shrink-0">⚠️</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {submitted && result.isReady && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
          <h3 className="font-bold text-gray-900">{t.results}</h3>

          {/* Hero EMI card */}
          <div className="bg-emerald-600 rounded-xl p-4 text-white">
            <div className="text-sm opacity-80 mb-1">{t.monthlyEmi}</div>
            <div className="text-3xl font-black">{fmt(result.emi)}</div>
          </div>

          {/* Max loan card — only in loan mode */}
          {mode === 'loan' && result.maxLoan > 0 && (
            <div className="bg-teal-600 rounded-xl p-4 text-white">
              <div className="text-sm opacity-80 mb-1">{t.maxLoan}</div>
              <div className="text-3xl font-black">{fmt(result.maxLoan)}</div>
            </div>
          )}

          {/* Breakdown rows */}
          <div className="space-y-3">
            <ResultRow label={t.totalInterest}  value={fmt(result.totalInterest)} negative />
            <ResultRow label={t.totalPayable}    value={fmt(result.totalPayable)}  highlight />
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <ResultRow label={t.tenureMonths}  value={`${result.months} ${isAr ? 'شهر' : 'months'}`} />
              <ResultRow label={t.effectiveRate} value={`${result.effectiveRate.toFixed(2)}% p.a.`} />
            </div>
          </div>

          {/* Reducing balance note */}
          <p className="text-xs text-gray-500 pt-1">{t.noteReducing}</p>
        </div>
      )}

      {/* Amortisation preview — first 3 rows */}
      {submitted && result.isReady && (
        <AmortTable
          principal={parseFloat(loanAmount) || result.maxLoan}
          annualRate={parseFloat(rate) > OMAN_MAX_RATE ? OMAN_MAX_RATE : parseFloat(rate)}
          months={result.months}
          emi={result.emi}
          isAr={isAr}
        />
      )}
    </div>
  )
}

// ─── Amortisation mini-table (first 3 rows + last row) ───────────────────────
function AmortTable({
  principal, annualRate, months, emi, isAr,
}: {
  principal: number; annualRate: number; months: number; emi: number; isAr: boolean
}) {
  if (!principal || !months || !emi) return null

  const rows: { month: number; interest: number; principal: number; balance: number }[] = []
  let balance = principal
  const r = annualRate / 100 / 12

  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    const princ    = emi - interest
    balance        = Math.max(0, balance - princ)
    rows.push({ month: m, interest, principal: princ, balance })
  }

  const preview = [
    ...rows.slice(0, 3),
    ...(rows.length > 4 ? [{ month: -1, interest: 0, principal: 0, balance: 0 }] : []),
    rows[rows.length - 1],
  ]

  const th = 'px-3 py-2 text-xs font-semibold text-gray-500 text-left'
  const td = 'px-3 py-2 text-xs text-gray-700'

  const headers = isAr
    ? ['الشهر', 'الفائدة', 'أصل الدين', 'الرصيد']
    : ['Month', 'Interest', 'Principal', 'Balance']

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {headers.map(h => <th key={h} className={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {preview.map((row, i) =>
            row.month === -1 ? (
              <tr key="ellipsis">
                <td colSpan={4} className="px-3 py-1.5 text-center text-xs text-gray-500">· · ·</td>
              </tr>
            ) : (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className={td}>{row.month}</td>
                <td className={td}>{row.interest.toFixed(3)}</td>
                <td className={td}>{row.principal.toFixed(3)}</td>
                <td className={`${td} font-semibold`}>{row.balance.toFixed(3)}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Reusable result row ──────────────────────────────────────────────────────
function ResultRow({
  label, value, negative = false, highlight = false,
}: {
  label: string; value: string; negative?: boolean; highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${
        highlight ? 'text-emerald-600' : negative ? 'text-red-500' : 'text-gray-900'
      }`}>
        {value}
      </span>
    </div>
  )
}
