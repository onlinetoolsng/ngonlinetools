'use client'

import { useState, useCallback } from 'react'

type Props = { locale: string }

// ─── Kuwait lending rules (CBK / NBK / Gulf Bank sources) ────────────────────
const LOAN_CLASSES = {
  consumer: {
    label: 'Consumer Finance',
    labelAr: 'التمويل الاستهلاكي',
    maxAmount: 25000,          // KD 25,000 (CBK)
    maxTermMonths: 60,         // 5 years (CBK)
    employeeDBR: 0.40,         // 40% of net salary
    pensionerDBR: 0.30,        // 30% of net salary
    note: 'Consumer finance: max KD 25,000, 60 months, 40% salary cap.',
    noteAr: 'التمويل الاستهلاكي: أقصى مبلغ 25,000 د.ك، 60 شهراً، 40% من الراتب.',
  },
  housing: {
    label: 'Housing Finance',
    labelAr: 'تمويل سكني',
    maxAmount: 70000,          // KD 70,000 (NBK housing product)
    maxTermMonths: 180,        // 15 years (common Kuwait housing)
    employeeDBR: 0.40,
    pensionerDBR: 0.30,
    note: 'Housing finance: max KD 70,000. Affordability cap still applies.',
    noteAr: 'التمويل السكني: أقصى مبلغ 70,000 د.ك. نسبة الأعباء لا تزال مطبقة.',
  },
  illustrative: {
    label: 'Custom / Illustrative',
    labelAr: 'مخصص / توضيحي',
    maxAmount: Infinity,
    maxTermMonths: Infinity,
    employeeDBR: 0.40,
    pensionerDBR: 0.30,
    note: 'Illustrative only — does not represent a legal Kuwait loan offer.',
    noteAr: 'للتوضيح فقط — لا يمثل عرض قرض قانونياً في الكويت.',
  },
}

const EMPLOYMENT_STATUSES = [
  { value: 'employee', label: 'Employee', labelAr: 'موظف' },
  { value: 'pensioner', label: 'Pensioner / Retired', labelAr: 'متقاعد' },
]

const RATE_TYPES = [
  { value: 'reducing', label: 'Reducing Balance', labelAr: 'رصيد متناقص' },
  { value: 'flat', label: 'Flat Rate (display only)', labelAr: 'معدل ثابت (للعرض فقط)' },
]

type LoanClass = keyof typeof LOAN_CLASSES

type ViolationRule =
  | 'amount_exceeds_ceiling'
  | 'term_exceeds_ceiling'
  | 'installment_exceeds_salary_cap'
  | 'none'

type ComplianceStatus = 'compliant' | 'blocked' | 'illustrative'

type Suggestion = {
  maxAffordableAmount: number
  maxAffordableTerm: number
  suggestedEMI: number
}

type Result = {
  emi: number
  totalPayable: number
  totalInterest: number
  principal: number
  termMonths: number
  status: ComplianceStatus
  violations: ViolationRule[]
  violationMessages: string[]
  violationMessagesAr: string[]
  suggestion: Suggestion | null
  dbrUsed: number
  dbrLimit: number
  maxAllowedAmount: number
  maxAllowedTerm: number
  rateType: string
  loanClass: LoanClass
  isIllustrative: boolean
}

function fmt(n: number, decimals = 2) {
  return `KD ${n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
}

// Reducing-balance EMI formula
function calcEMI(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

// Flat-rate monthly payment (for display only — banks may quote this)
function calcFlatEMI(principal: number, annualRate: number, months: number): number {
  const totalInterest = principal * (annualRate / 100) * (months / 12)
  return (principal + totalInterest) / months
}

// Max affordable amount given salary, DBR, rate, term
function maxAffordableAmount(salary: number, dbr: number, annualRate: number, months: number): number {
  const maxPayment = salary * dbr
  if (annualRate === 0) return maxPayment * months
  const r = annualRate / 100 / 12
  return (maxPayment * (Math.pow(1 + r, months) - 1)) / (r * Math.pow(1 + r, months))
}

// Max term given principal, salary, DBR, rate
function maxAffordableTerm(principal: number, salary: number, dbr: number, annualRate: number): number {
  const maxPayment = salary * dbr
  if (annualRate === 0) return Math.ceil(principal / maxPayment)
  const r = annualRate / 100 / 12
  // n = -ln(1 - P*r/EMI) / ln(1+r)
  const ratio = (principal * r) / maxPayment
  if (ratio >= 1) return Infinity
  return Math.ceil(-Math.log(1 - ratio) / Math.log(1 + r))
}

export default function KuwaitEMICalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [loanClass, setLoanClass] = useState<LoanClass>('consumer')
  const [employment, setEmployment] = useState('employee')
  const [salary, setSalary] = useState('')
  const [amount, setAmount] = useState('')
  const [termMonths, setTermMonths] = useState('')
  const [rate, setRate] = useState('')
  const [rateType, setRateType] = useState('reducing')
  const [result, setResult] = useState<Result | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [amortization, setAmortization] = useState<
    { month: number; principal: number; interest: number; balance: number }[]
  >([])

  const rules = LOAN_CLASSES[loanClass]
  const dbrLimit = employment === 'pensioner' ? rules.pensionerDBR : rules.employeeDBR

  const calculate = useCallback(() => {
    const P = parseFloat(amount)
    const n = parseInt(termMonths)
    const r = parseFloat(rate)
    const salaryVal = parseFloat(salary) || 0

    if (!P || !n || !r || P <= 0 || n <= 0 || r <= 0) return

    // ── Step 1: Determine class rules
    const classRules = LOAN_CLASSES[loanClass]
    const dbrCap = employment === 'pensioner' ? classRules.pensionerDBR : classRules.employeeDBR
    const isIllustrative = loanClass === 'illustrative'

    // ── Step 2–3: Validate amount & term (in order)
    const violations: ViolationRule[] = []
    const violationMessages: string[] = []
    const violationMessagesAr: string[] = []

    if (!isIllustrative && P > classRules.maxAmount) {
      violations.push('amount_exceeds_ceiling')
      violationMessages.push(
        `Loan amount (${fmt(P)}) exceeds the maximum allowed ${fmt(classRules.maxAmount)} for ${classRules.label}.`
      )
      violationMessagesAr.push(
        `مبلغ القرض (${fmt(P)}) يتجاوز الحد الأقصى المسموح به ${fmt(classRules.maxAmount)} للـ${classRules.labelAr}.`
      )
    }

    if (!isIllustrative && n > classRules.maxTermMonths) {
      violations.push('term_exceeds_ceiling')
      violationMessages.push(
        `Term (${n} months) exceeds the maximum ${classRules.maxTermMonths} months for ${classRules.label}.`
      )
      violationMessagesAr.push(
        `المدة (${n} شهراً) تتجاوز الحد الأقصى ${classRules.maxTermMonths} شهراً لـ${classRules.labelAr}.`
      )
    }

    // ── Step 4: Compute EMI
    const emi = rateType === 'flat' ? calcFlatEMI(P, r, n) : calcEMI(P, r, n)
    const totalPayable = emi * n
    const totalInterest = totalPayable - P

    // ── Step 5: Check salary cap
    if (salaryVal > 0 && emi > salaryVal * dbrCap) {
      violations.push('installment_exceeds_salary_cap')
      violationMessages.push(
        `Monthly installment (${fmt(emi)}) exceeds ${dbrCap * 100}% of net salary (${fmt(salaryVal * dbrCap)}). Reduce amount or extend term.`
      )
      violationMessagesAr.push(
        `القسط الشهري (${fmt(emi)}) يتجاوز ${dbrCap * 100}% من صافي الراتب (${fmt(salaryVal * dbrCap)}). قلل المبلغ أو مدد الفترة.`
      )
    }

    // ── Step 6: Build suggestion (nearest compliant values)
    let suggestion: Suggestion | null = null
    if (violations.length > 0 && salaryVal > 0 && !isIllustrative) {
      const capAmount = Math.min(
        classRules.maxAmount,
        maxAffordableAmount(salaryVal, dbrCap, r, Math.min(n, classRules.maxTermMonths))
      )
      const suggestedP = Math.max(0, Math.floor(capAmount))
      const suggestedN = Math.min(
        classRules.maxTermMonths,
        maxAffordableTerm(P, salaryVal, dbrCap, r)
      )
      const suggestedEMI =
        suggestedP > 0 && suggestedN > 0
          ? rateType === 'flat'
            ? calcFlatEMI(suggestedP, r, suggestedN)
            : calcEMI(suggestedP, r, suggestedN)
          : 0
      suggestion = {
        maxAffordableAmount: suggestedP,
        maxAffordableTerm: isFinite(suggestedN) ? suggestedN : classRules.maxTermMonths,
        suggestedEMI,
      }
    }

    // ── Build amortization (reducing only; flat = equal installments)
    const rows: { month: number; principal: number; interest: number; balance: number }[] = []
    if (rateType === 'reducing') {
      const rMonthly = r / 100 / 12
      let balance = P
      for (let m = 1; m <= n; m++) {
        const interestPart = balance * rMonthly
        const principalPart = emi - interestPart
        balance = Math.max(0, balance - principalPart)
        rows.push({ month: m, principal: principalPart, interest: interestPart, balance })
      }
    } else {
      const principalPerMonth = P / n
      const profitPerMonth = totalInterest / n
      let balance = P
      for (let m = 1; m <= n; m++) {
        balance = Math.max(0, balance - principalPerMonth)
        rows.push({ month: m, principal: principalPerMonth, interest: profitPerMonth, balance })
      }
    }
    setAmortization(rows)

    const status: ComplianceStatus = isIllustrative
      ? 'illustrative'
      : violations.length > 0
      ? 'blocked'
      : 'compliant'

    setResult({
      emi,
      totalPayable,
      totalInterest,
      principal: P,
      termMonths: n,
      status,
      violations,
      violationMessages,
      violationMessagesAr,
      suggestion,
      dbrUsed: salaryVal > 0 ? emi / salaryVal : 0,
      dbrLimit: dbrCap,
      maxAllowedAmount: isIllustrative ? Infinity : classRules.maxAmount,
      maxAllowedTerm: isIllustrative ? Infinity : classRules.maxTermMonths,
      rateType,
      loanClass,
      isIllustrative,
    })
  }, [amount, termMonths, rate, salary, loanClass, employment, rateType])

  function reset() {
    setAmount('')
    setTermMonths('')
    setRate('')
    setSalary('')
    setLoanClass('consumer')
    setEmployment('employee')
    setRateType('reducing')
    setResult(null)
    setShowSchedule(false)
    setAmortization([])
  }

  const t = isAr
    ? {
        loanClass: 'نوع القرض',
        employment: 'الوضع الوظيفي',
        salary: 'صافي الراتب الشهري (للتحقق من الأعباء)',
        amount: 'مبلغ القرض',
        term: 'المدة (بالأشهر)',
        rate: 'معدل الفائدة السنوي (%)',
        rateType: 'نوع المعدل',
        calc: 'احسب القسط',
        reset: 'إعادة تعيين',
        results: 'النتائج',
        emi: 'القسط الشهري المقدر',
        totalPayable: 'إجمالي المستحق',
        totalInterest: 'إجمالي الفائدة',
        maxAllowedAmt: 'أقصى مبلغ مسموح',
        maxAllowedTerm: 'أقصى مدة مسموحة',
        dbrStatus: 'نسبة العبء المالي',
        compliant: '✅ ضمن الحدود القانونية',
        blocked: '🚫 يتجاوز الحدود القانونية',
        illustrative: '⚠️ توضيحي فقط',
        violations: 'المخالفات القانونية',
        suggestion: 'أقرب قيم ممكنة قانونياً',
        suggestedAmt: 'أقصى مبلغ ممكن',
        suggestedTerm: 'أقصى مدة ممكنة',
        suggestedEMI: 'القسط المقترح',
        showSchedule: 'عرض جدول السداد',
        hideSchedule: 'إخفاء جدول السداد',
        month: 'الشهر',
        principal: 'الأصل',
        interest: 'الفائدة',
        balance: 'الرصيد',
        legalNote: 'ملاحظة قانونية',
        enterAmt: 'أدخل المبلغ',
        estimate: 'تقدير — ليس عرضاً ملزماً من البنك.',
        months: 'شهراً',
      }
    : {
        loanClass: 'Loan Category',
        employment: 'Employment Status',
        salary: 'Net Monthly Salary (for DBR check)',
        amount: 'Loan Amount',
        term: 'Term (months)',
        rate: 'Annual Interest Rate (%)',
        rateType: 'Rate Type',
        calc: 'Calculate EMI',
        reset: 'Reset',
        results: 'Results',
        emi: 'Estimated Monthly Installment',
        totalPayable: 'Total Payable',
        totalInterest: 'Total Interest',
        maxAllowedAmt: 'Max Allowed Amount',
        maxAllowedTerm: 'Max Allowed Term',
        dbrStatus: 'Debt Burden Ratio',
        compliant: '✅ Within legal limits',
        blocked: '🚫 Exceeds Kuwait legal limits',
        illustrative: '⚠️ Illustrative only',
        violations: 'Rule Violations',
        suggestion: 'Nearest Compliant Values',
        suggestedAmt: 'Max Affordable Amount',
        suggestedTerm: 'Max Affordable Term',
        suggestedEMI: 'Suggested Installment',
        showSchedule: 'Show Amortization Schedule',
        hideSchedule: 'Hide Schedule',
        month: 'Month',
        principal: 'Principal',
        interest: 'Interest',
        balance: 'Balance',
        legalNote: 'Legal Note',
        enterAmt: 'Enter amount',
        estimate: 'Estimate only — not a binding bank offer.',
        months: 'months',
      }

  const statusColor = (s?: ComplianceStatus) => {
    if (s === 'compliant') return 'bg-emerald-100 text-emerald-700'
    if (s === 'blocked') return 'bg-red-100 text-red-700'
    return 'bg-amber-100 text-amber-700'
  }

  const heroColor = (s?: ComplianceStatus) => {
    if (s === 'compliant') return 'bg-emerald-600'
    if (s === 'blocked') return 'bg-red-500'
    return 'bg-amber-500'
  }

  return (
    <div className="space-y-6">
      {/* Inputs — ordered per validation sequence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Step 1: Loan category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.loanClass}
          </label>
          <select
            value={loanClass}
            onChange={e => { setLoanClass(e.target.value as LoanClass); setResult(null) }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {Object.entries(LOAN_CLASSES).map(([k, v]) => (
              <option key={k} value={k}>{isAr ? v.labelAr : v.label}</option>
            ))}
          </select>
          {loanClass !== 'illustrative' && (
            <p className="text-xs text-gray-500 mt-1">
              Max {fmt(LOAN_CLASSES[loanClass].maxAmount, 0)} · {LOAN_CLASSES[loanClass].maxTermMonths} {t.months}
            </p>
          )}
        </div>

        {/* Step 2: Employment status */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.employment}
          </label>
          <select
            value={employment}
            onChange={e => { setEmployment(e.target.value); setResult(null) }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {EMPLOYMENT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{isAr ? s.labelAr : s.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Salary cap: {dbrLimit * 100}%
          </p>
        </div>

        {/* Step 3: Salary */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.salary}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">KD</span>
            <input
              type="number"
              min="0"
              value={salary}
              onChange={e => setSalary(e.target.value)}
              placeholder={t.enterAmt}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Step 4: Loan amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.amount}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">KD</span>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={t.enterAmt}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Step 5: Term */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.term}
          </label>
          <input
            type="number"
            min="1"
            value={termMonths}
            onChange={e => setTermMonths(e.target.value)}
            placeholder="e.g. 48"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Step 6a: Rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.rate}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.1"
              value={rate}
              onChange={e => setRate(e.target.value)}
              placeholder="e.g. 7"
              className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Kuwait max: 7% (CBK)</p>
        </div>

        {/* Step 6b: Rate type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.rateType}
          </label>
          <select
            value={rateType}
            onChange={e => setRateType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {RATE_TYPES.map(rt => (
              <option key={rt.value} value={rt.value}>{isAr ? rt.labelAr : rt.label}</option>
            ))}
          </select>
          {rateType === 'flat' && (
            <p className="text-xs text-amber-500 mt-1">Flat rate is for display only — reducing balance is the legal standard.</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {t.calc}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {t.reset}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-gray-900">{t.results}</h3>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(result.status)}`}>
              {result.status === 'compliant'
                ? t.compliant
                : result.status === 'blocked'
                ? t.blocked
                : t.illustrative}
            </span>
          </div>

          {/* Hero EMI */}
          <div className={`${heroColor(result.status)} rounded-xl p-4 text-white`}>
            <div className="text-sm opacity-80 mb-1">{t.emi}</div>
            <div className="text-3xl font-black">{fmt(result.emi)}</div>
            {rateType === 'flat' && (
              <div className="text-xs opacity-70 mt-1">Flat rate — illustrative display only</div>
            )}
          </div>

          {/* Violations — shown before breakdown if blocked */}
          {result.violations.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-red-800">{t.violations}</p>
              {(isAr ? result.violationMessagesAr : result.violationMessages).map((msg, i) => (
                <p key={i} className="text-xs text-red-700">🚫 {msg}</p>
              ))}
            </div>
          )}

          {/* Nearest compliant suggestion */}
          {result.suggestion && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-bold text-emerald-800">{t.suggestion}</p>
              <Row label={t.suggestedAmt} value={fmt(result.suggestion.maxAffordableAmount)} highlight />
              <Row label={t.suggestedTerm} value={`${result.suggestion.maxAffordableTerm} ${t.months}`} />
              <Row label={t.suggestedEMI} value={fmt(result.suggestion.suggestedEMI)} highlight />
            </div>
          )}

          {/* Breakdown */}
          <div className="space-y-3">
            <Row label={isAr ? 'أصل القرض' : 'Loan Principal'} value={fmt(result.principal)} />
            <Row label={t.totalInterest} value={fmt(result.totalInterest)} negative />
            <div className="border-t border-gray-200 pt-3">
              <Row label={t.totalPayable} value={fmt(result.totalPayable)} highlight />
            </div>
          </div>

          {/* Legal limits strip */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">{t.maxAllowedAmt}</div>
              <div className="text-sm font-bold text-gray-800">
                {isFinite(result.maxAllowedAmount) ? fmt(result.maxAllowedAmount, 0) : '—'}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">{t.maxAllowedTerm}</div>
              <div className="text-sm font-bold text-gray-800">
                {isFinite(result.maxAllowedTerm) ? `${result.maxAllowedTerm} ${t.months}` : '—'}
              </div>
            </div>
          </div>

          {/* DBR meter */}
          {result.dbrUsed > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-600">{t.dbrStatus}</span>
                <span className={`text-xs font-bold ${result.dbrUsed > result.dbrLimit ? 'text-red-600' : 'text-emerald-600'}`}>
                  {(result.dbrUsed * 100).toFixed(1)}% / {result.dbrLimit * 100}% limit
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${result.dbrUsed > result.dbrLimit ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(result.dbrUsed / result.dbrLimit * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Legal note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-blue-700">{t.legalNote}</p>
            <p className="text-xs text-blue-600">
              {isAr ? LOAN_CLASSES[result.loanClass].noteAr : LOAN_CLASSES[result.loanClass].note}
            </p>
            <p className="text-xs text-blue-500 italic">{t.estimate}</p>
          </div>

          {/* Amortization toggle */}
          <button
            onClick={() => setShowSchedule(v => !v)}
            className="w-full py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-200 rounded-xl transition-colors"
          >
            {showSchedule ? t.hideSchedule : t.showSchedule}
          </button>

          {showSchedule && amortization.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    {[t.month, t.principal, t.interest, t.balance].map(h => (
                      <th key={h} className="px-3 py-2 text-right font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {amortization.map(row => (
                    <tr key={row.month} className="bg-white hover:bg-gray-50">
                      <td className="px-3 py-2 text-right text-gray-500">{row.month}</td>
                      <td className="px-3 py-2 text-right text-gray-900">{fmt(row.principal)}</td>
                      <td className="px-3 py-2 text-right text-red-500">{fmt(row.interest)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({
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
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
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
