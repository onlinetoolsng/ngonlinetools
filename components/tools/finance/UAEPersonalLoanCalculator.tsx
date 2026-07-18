'use client'

import { useState } from 'react'

type Props = { locale: string }

// ─── UAE Rule Object ───────────────────────────────────────────────────────────
// Structured as a country-rule map for future extensibility

const UAE_PERSONAL_LOAN = {
  currency: 'AED',
  maxMultipleOfSalary: 20,
  maxTermMonths: 48,
  maxInstallmentRatio: 0.50,
  primaryRateBasis: 'reducing' as const,
  comparisonRateBasis: 'flat' as const,
  rateHardCapPct: 24, // sanity ceiling; no single statutory cap published
  notes: 'Salary must be stable and verifiable. Bank disclosure uses reducing balance per UAE regulations.',
}

// ─── Engine: pure functions ────────────────────────────────────────────────────

function calcReducingEmi(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100
  if (r === 0) return principal / months
  const factor = Math.pow(1 + r, months)
  return (principal * r * factor) / (factor - 1)
}

/** Convert flat annual rate → approximate reducing annual rate equivalent */
function flatToReducing(flatRate: number, months: number): number {
  // Standard approximation: reducingRate ≈ 2 * n * flatRate / (n + 1)
  return (2 * months * flatRate) / (months + 1)
}

type AmortRow = {
  month: number
  opening: number
  interest: number
  principal: number
  closing: number
}

function buildSchedule(principal: number, annualRate: number, months: number, emi: number): AmortRow[] {
  const r = annualRate / 12 / 100
  const rows: AmortRow[] = []
  let balance = principal
  for (let m = 1; m <= Math.min(months, 360); m++) {
    const interest = Math.round(balance * r * 100) / 100
    const principalComp = Math.round((emi - interest) * 100) / 100
    const closing = Math.max(0, Math.round((balance - principalComp) * 100) / 100)
    rows.push({ month: m, opening: balance, interest, principal: principalComp, closing })
    balance = closing
  }
  return rows
}

type ValidationResult = {
  loanCapOk: boolean
  termOk: boolean
  installmentOk: boolean
  loanCeiling: number
  maxDeduction: number
  errors: string[]
}

function validate(
  salary: number,
  loanAmount: number,
  termMonths: number,
  emi: number,
): ValidationResult {
  const rules = UAE_PERSONAL_LOAN
  const loanCeiling = salary * rules.maxMultipleOfSalary
  const maxDeduction = salary * rules.maxInstallmentRatio
  const errors: string[] = []

  const loanCapOk = loanAmount <= loanCeiling
  if (!loanCapOk) errors.push('ERR_LOAN_EXCEEDS_20X_SALARY')

  const termOk = termMonths <= rules.maxTermMonths
  if (!termOk) errors.push('ERR_TERM_EXCEEDS_48_MONTHS')

  const installmentOk = emi <= maxDeduction
  if (!installmentOk) errors.push('ERR_INSTALLMENT_EXCEEDS_50PCT_SALARY')

  return { loanCapOk, termOk, installmentOk, loanCeiling, maxDeduction, errors }
}

// ─── Formatting ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtPct(n: number) {
  return `${n.toFixed(2)}%`
}

// ─── Component ────────────────────────────────────────────────────────────────

type RateType = 'reducing' | 'flat'

type Result = {
  emi: number
  totalPayment: number
  totalInterest: number
  reducingRate: number
  flatRateIfEntered: number | null
  flatEmi: number | null
  schedule: AmortRow[]
  validation: ValidationResult
  eligible: boolean
}

export default function UAEPersonalLoanCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [salary, setSalary]       = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [termMonths, setTermMonths] = useState('24')
  const [rateInput, setRateInput]  = useState('7.0')
  const [rateType, setRateType]    = useState<RateType>('reducing')
  const [result, setResult]        = useState<Result | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)

  function calculate() {
    const sal  = parseFloat(salary)
    const loan = parseFloat(loanAmount)
    const term = parseInt(termMonths)
    const rate = parseFloat(rateInput)

    if (!sal || sal <= 0 || !loan || loan <= 0 || !term || term <= 0 || !rate || rate <= 0) return

    // Determine reducing rate (primary legal basis)
    let reducingRate: number
    let flatRateIfEntered: number | null = null
    let flatEmi: number | null = null

    if (rateType === 'flat') {
      flatRateIfEntered = rate
      reducingRate = flatToReducing(rate, term)
      // Also compute flat EMI for comparison
      const totalInterestFlat = loan * (rate / 100) * (term / 12)
      flatEmi = Math.round(((loan + totalInterestFlat) / term) * 100) / 100
    } else {
      reducingRate = rate
      // Show flat equivalent for comparison
      // Reverse: flatRate ≈ reducingRate * (n+1) / (2*n)
      const flatEquiv = reducingRate * (term + 1) / (2 * term)
      flatRateIfEntered = flatEquiv
      flatEmi = (() => {
        const totalInterestFlat = loan * (flatEquiv / 100) * (term / 12)
        return Math.round(((loan + totalInterestFlat) / term) * 100) / 100
      })()
    }

    const emi          = Math.round(calcReducingEmi(loan, reducingRate, term) * 100) / 100
    const totalPayment = Math.round(emi * term * 100) / 100
    const totalInterest = Math.round((totalPayment - loan) * 100) / 100
    const schedule     = buildSchedule(loan, reducingRate, term, emi)
    const validation   = validate(sal, loan, term, emi)
    const eligible     = validation.errors.length === 0

    setResult({ emi, totalPayment, totalInterest, reducingRate, flatRateIfEntered, flatEmi, schedule, validation, eligible })
    setShowSchedule(false)
  }

  function reset() {
    setSalary(''); setLoanAmount(''); setTermMonths('24'); setRateInput('7.0')
    setRateType('reducing'); setResult(null); setShowSchedule(false)
  }

  // i18n
  const L = isAr ? {
    salary: 'الراتب الشهري (درهم)',
    loanAmount: 'مبلغ القرض (درهم)',
    term: 'مدة السداد (بالأشهر)',
    rateType: 'نوع معدل الفائدة',
    rate: 'معدل الفائدة السنوي (%)',
    reducing: 'رصيد متناقص',
    flat: 'معدل ثابت',
    calculate: 'احسب',
    reset: 'إعادة تعيين',
    eligibility: 'الأهلية',
    eligible: '✓ مؤهل',
    notEligible: '✗ غير مؤهل',
    emi: 'القسط الشهري',
    totalPayment: 'إجمالي المدفوعات',
    totalInterest: 'إجمالي الفائدة',
    loanCeiling: 'سقف القرض المسموح (20× الراتب)',
    maxDeduction: 'الحد الأقصى للقسط (50% من الراتب)',
    reducingBasis: 'أساس الاحتساب: رصيد متناقص',
    flatComparison: 'القسط بالمعدل الثابت (للمقارنة فقط)',
    flatEquivRate: 'المعدل الثابت المعادل (تقريبي)',
    legalDisclosure: 'تُلزم الجهات التنظيمية في الإمارات البنوك بالإفصاح عن الفائدة على أساس الرصيد المتناقص',
    showSchedule: 'عرض جدول الاستهلاك',
    hideSchedule: 'إخفاء الجدول',
    month: 'الشهر', opening: 'الرصيد الافتتاحي', interest: 'الفائدة',
    principalComp: 'الأصل', closing: 'الرصيد الختامي',
    whyBlock: 'لماذا هذه النتيجة؟',
    enterAmount: 'أدخل المبلغ',
  } : {
    salary: 'Monthly Salary (AED)',
    loanAmount: 'Loan Amount (AED)',
    term: 'Loan Term (Months)',
    rateType: 'Interest Rate Type',
    rate: 'Annual Interest Rate (%)',
    reducing: 'Reducing Balance',
    flat: 'Flat Rate',
    calculate: 'Calculate',
    reset: 'Reset',
    eligibility: 'Eligibility',
    eligible: '✓ Eligible',
    notEligible: '✗ Not Eligible',
    emi: 'Monthly Installment',
    totalPayment: 'Total Repayment',
    totalInterest: 'Total Interest',
    loanCeiling: 'Loan Ceiling (20× Salary)',
    maxDeduction: 'Max Monthly Deduction (50% Salary)',
    reducingBasis: 'Rate Basis: Reducing Balance',
    flatComparison: 'Flat Rate Installment (comparison only)',
    flatEquivRate: 'Flat Rate Equivalent (approx.)',
    legalDisclosure: 'UAE regulations require banks to disclose interest on a reducing-balance basis',
    showSchedule: 'Show Amortisation Schedule',
    hideSchedule: 'Hide Schedule',
    month: 'Month', opening: 'Opening', interest: 'Interest',
    principalComp: 'Principal', closing: 'Closing',
    whyBlock: 'Why this result?',
    enterAmount: 'Enter amount',
  }

  const errMsg: Record<string, string> = isAr ? {
    ERR_LOAN_EXCEEDS_20X_SALARY: `مبلغ القرض يتجاوز 20 ضعف الراتب (${result ? fmt(result.validation.loanCeiling) : ''})`,
    ERR_TERM_EXCEEDS_48_MONTHS: 'مدة السداد تتجاوز الحد القانوني البالغ 48 شهراً في الإمارات',
    ERR_INSTALLMENT_EXCEEDS_50PCT_SALARY: `القسط الشهري يتجاوز 50% من الراتب (${result ? fmt(result.validation.maxDeduction) : ''})`,
  } : {
    ERR_LOAN_EXCEEDS_20X_SALARY: `Loan exceeds 20× salary ceiling (${result ? fmt(result.validation.loanCeiling) : ''})`,
    ERR_TERM_EXCEEDS_48_MONTHS: 'Term exceeds UAE legal maximum of 48 months',
    ERR_INSTALLMENT_EXCEEDS_50PCT_SALARY: `Installment exceeds 50% of salary (max: ${result ? fmt(result.validation.maxDeduction) : ''})`,
  }

  const whyText = (r: Result) => {
    if (isAr) {
      const lines = ['تم تطبيق قواعد القروض الشخصية في الإمارات (مصدر: u.ae):']
      lines.push(`• سقف القرض: ${fmt(r.validation.loanCeiling)} (20× الراتب)`)
      lines.push(`• أقصى مدة: 48 شهراً`)
      lines.push(`• أقصى قسط: ${fmt(r.validation.maxDeduction)} (50% من الراتب)`)
      lines.push(`• أساس الاحتساب القانوني: الرصيد المتناقص`)
      if (!r.validation.loanCapOk) lines.push('✗ فشل: سقف القرض')
      if (!r.validation.termOk)    lines.push('✗ فشل: الحد الأقصى للمدة')
      if (!r.validation.installmentOk) lines.push('✗ فشل: حد القسط')
      return lines.join('\n')
    }
    const lines = ['UAE Personal Loan rules applied (source: u.ae):']
    lines.push(`• Loan ceiling: ${fmt(r.validation.loanCeiling)} (20× salary)`)
    lines.push(`• Max term: 48 months`)
    lines.push(`• Max deduction: ${fmt(r.validation.maxDeduction)} (50% of salary)`)
    lines.push(`• Legal rate basis: Reducing balance`)
    if (!r.validation.loanCapOk) lines.push('✗ Failed: Loan ceiling')
    if (!r.validation.termOk)    lines.push('✗ Failed: Max term')
    if (!r.validation.installmentOk) lines.push('✗ Failed: Installment cap')
    return lines.join('\n')
  }

  return (
    <div className="space-y-6">

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Salary */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.salary}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number" min="0" value={salary}
              onChange={e => setSalary(e.target.value)}
              placeholder={L.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Loan amount */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.loanAmount}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number" min="0" value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              placeholder={L.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Term */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.term}</label>
          <input
            type="number" min="1" max="48" value={termMonths}
            onChange={e => setTermMonths(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <p className="text-xs text-gray-500 mt-1">{isAr ? 'الحد الأقصى القانوني: 48 شهراً' : 'UAE legal max: 48 months'}</p>
        </div>

        {/* Rate type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.rateType}</label>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['reducing', 'flat'] as RateType[]).map(rt => (
              <button
                key={rt}
                onClick={() => setRateType(rt)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  rateType === rt
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {rt === 'reducing' ? L.reducing : L.flat}
              </button>
            ))}
          </div>
        </div>

        {/* Rate */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.rate}</label>
          <div className="relative">
            <input
              type="number" min="0.1" max="24" step="0.1" value={rateInput}
              onChange={e => setRateInput(e.target.value)}
              className="w-full pr-10 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
          </div>
        </div>
      </div>

      {/* Legal note */}
      <div className="text-xs text-gray-500 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100 flex items-start gap-2">
        <span className="mt-0.5 text-blue-400">ℹ</span>
        <span>{L.legalDisclosure}</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
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
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">

          {/* Eligibility badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
            result.eligible
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {result.eligible ? L.eligible : L.notEligible}
          </div>

          {/* Hero: monthly EMI */}
          <div className={`rounded-xl p-4 text-white ${result.eligible ? 'bg-blue-600' : 'bg-gray-400'}`}>
            <div className="text-sm opacity-80 mb-1">{L.emi}</div>
            <div className="text-3xl font-black">{fmt(result.emi)}</div>
            <div className="text-xs opacity-70 mt-1">{L.reducingBasis}</div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <Row label={L.totalInterest}  value={fmt(result.totalInterest)} negative />
            <Row label={L.totalPayment}   value={fmt(result.totalPayment)} highlight />
          </div>

          {/* Eligibility gates */}
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <GateRow
              label={L.loanCeiling}
              value={fmt(result.validation.loanCeiling)}
              ok={result.validation.loanCapOk}
            />
            <GateRow
              label={isAr ? 'أقصى مدة' : 'Max Term'}
              value={`${UAE_PERSONAL_LOAN.maxTermMonths} ${isAr ? 'شهر' : 'months'}`}
              ok={result.validation.termOk}
            />
            <GateRow
              label={L.maxDeduction}
              value={fmt(result.validation.maxDeduction)}
              ok={result.validation.installmentOk}
            />
          </div>

          {/* Flat rate comparison panel */}
          {result.flatEmi !== null && result.flatRateIfEntered !== null && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                {isAr ? 'مقارنة المعدل الثابت (للمقارنة فقط — ليس أساساً قانونياً)' : 'Flat Rate Comparison (comparison only — not the legal basis)'}
              </p>
              <Row
                label={rateType === 'flat'
                  ? (isAr ? 'المعدل الثابت المُدخل' : 'Flat Rate Entered')
                  : L.flatEquivRate}
                value={fmtPct(result.flatRateIfEntered)}
              />
              <Row label={L.flatComparison} value={fmt(result.flatEmi)} />
              <Row
                label={isAr ? 'فارق التكلفة (رصيد متناقص مقابل ثابت)' : 'Cost difference (reducing vs flat)'}
                value={fmt(Math.abs(result.emi - result.flatEmi))}
                negative={result.flatEmi > result.emi}
                highlight={result.flatEmi < result.emi}
              />
            </div>
          )}

          {/* Errors */}
          {result.validation.errors.length > 0 && (
            <div className="space-y-2">
              {result.validation.errors.map(e => (
                <div key={e} className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <span className="mt-0.5">⚠</span>
                  <span>{errMsg[e] ?? e}</span>
                </div>
              ))}
            </div>
          )}

          {/* Why this result */}
          <details className="bg-white border border-gray-200 rounded-xl">
            <summary className="px-4 py-3 text-sm font-semibold text-gray-600 cursor-pointer select-none">
              {L.whyBlock}
            </summary>
            <pre className="px-4 pb-4 text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
              {whyText(result)}
            </pre>
          </details>

          {/* Amortisation toggle */}
          {result.eligible && (
            <>
              <button
                onClick={() => setShowSchedule(s => !s)}
                className="w-full text-sm text-blue-700 font-semibold py-2 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
              >
                {showSchedule ? L.hideSchedule : L.showSchedule}
              </button>

              {showSchedule && (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-xs text-gray-700">
                    <thead className="bg-gray-100 text-gray-500 font-semibold">
                      <tr>
                        {[L.month, L.opening, L.interest, L.principalComp, L.closing].map(h => (
                          <th key={h} className="px-3 py-2 text-right">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.map((row, i) => (
                        <tr key={row.month} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-1.5 text-right font-semibold">{row.month}</td>
                          <td className="px-3 py-1.5 text-right">{row.opening.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td className="px-3 py-1.5 text-right text-red-500">{row.interest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td className="px-3 py-1.5 text-right text-blue-600">{row.principal.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                          <td className="px-3 py-1.5 text-right">{row.closing.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Row({ label, value, negative = false, highlight = false }: {
  label: string; value: string; negative?: boolean; highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${
        highlight ? 'text-blue-600' : negative ? 'text-red-500' : 'text-gray-900'
      }`}>{value}</span>
    </div>
  )
}

function GateRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold w-4 ${ok ? 'text-emerald-500' : 'text-red-500'}`}>
          {ok ? '✓' : '✗'}
        </span>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${ok ? 'text-gray-900' : 'text-red-500'}`}>{value}</span>
    </div>
  )
}
