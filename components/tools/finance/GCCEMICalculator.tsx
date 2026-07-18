'use client'

import { useState, useCallback } from 'react'

type Props = { locale: string }

// ─── Country rules (sourced from central bank regulations) ───────────────────
const COUNTRIES = [
  {
    value: 'uae',
    label: 'UAE',
    labelAr: 'الإمارات',
    currency: 'AED',
    maxTenorMonths: 48,
    maxDBR: 0.50,
    maxInterestRate: 9,        // courts now enforce 5% in practice
    interestCapAtPrincipal: true, // UAE Supreme Court 2025
    minSalary: 3000,
    reducingBalanceOnly: true,
    adminFeeMax: null,
    maxLoanAmount: null,
    fixedRateOnly: false,
    note: 'UAE Supreme Court 2025: total interest cannot exceed principal.',
    noteAr: 'حكم المحكمة العليا الإماراتية 2025: لا يمكن أن يتجاوز إجمالي الفائدة قيمة أصل القرض.',
  },
  {
    value: 'saudi',
    label: 'Saudi Arabia',
    labelAr: 'المملكة العربية السعودية',
    currency: 'SAR',
    maxTenorMonths: null,
    maxDBR: 0.50,
    maxInterestRate: null,
    interestCapAtPrincipal: false,
    minSalary: null,
    reducingBalanceOnly: true,
    adminFeeMax: 2500,         // SAR 2,500 or 0.5% cap (SAMA 2026)
    adminFeePercent: 0.005,
    maxLoanAmount: null,
    fixedRateOnly: false,
    note: 'SAMA: Admin fees capped at SAR 2,500 or 0.5%. APR on reducing balance required.',
    noteAr: 'ساما: رسوم إدارية لا تتجاوز 2500 ريال أو 0.5%. يُحسب معدل الفائدة السنوي على الرصيد المتناقص.',
  },
  {
    value: 'qatar',
    label: 'Qatar',
    labelAr: 'قطر',
    currency: 'QAR',
    maxTenorMonths: 48,
    maxDBR: 0.50,
    maxInterestRate: 6.5,      // for expats
    interestCapAtPrincipal: false,
    minSalary: null,
    reducingBalanceOnly: true,
    adminFeeMax: null,
    maxLoanAmount: 400000,     // QAR for expats
    fixedRateOnly: false,
    note: 'Qatar: Max QAR 400,000 for expats. Max rate 6.5% for expats.',
    noteAr: 'قطر: الحد الأقصى للقرض 400,000 ريال للوافدين. الحد الأقصى للسعر 6.5%.',
  },
  {
    value: 'kuwait',
    label: 'Kuwait',
    labelAr: 'الكويت',
    currency: 'KWD',
    maxTenorMonths: 60,        // 5 years
    maxDBR: 0.40,              // strictest in GCC
    maxInterestRate: 7,        // 3% over CBK 4% discount rate
    interestCapAtPrincipal: false,
    minSalary: null,
    reducingBalanceOnly: true,
    adminFeeMax: null,
    maxLoanAmount: 25000,      // KWD
    fixedRateOnly: true,
    note: 'Kuwait: Fixed rate only. Max 7% (3% over CBK rate). DBR 40%. Max KD 25,000.',
    noteAr: 'الكويت: سعر ثابت فقط. حد أقصى 7% (3% فوق سعر بنك الكويت المركزي). نسبة DBR 40%. أقصى مبلغ 25,000 د.ك.',
  },
  {
    value: 'oman',
    label: 'Oman',
    labelAr: 'عُمان',
    currency: 'OMR',
    maxTenorMonths: 120,       // 10 years GPL
    maxDBR: 0.50,
    maxInterestRate: 6,        // CBO cap
    interestCapAtPrincipal: false,
    minSalary: null,
    reducingBalanceOnly: true,
    adminFeeMax: 25,           // OMR
    maxLoanAmount: null,
    fixedRateOnly: false,
    note: 'Oman CBO: 6% max rate. Reducing balance only. Processing fee ≤ OMR 25.',
    noteAr: 'بنك عُمان المركزي: حد أقصى 6%. رصيد متناقص فقط. رسوم معالجة ≤ 25 ريال عُماني.',
  },
  {
    value: 'bahrain',
    label: 'Bahrain',
    labelAr: 'البحرين',
    currency: 'BHD',
    maxTenorMonths: null,
    maxDBR: 0.50,
    maxInterestRate: null,
    interestCapAtPrincipal: false,
    minSalary: null,
    reducingBalanceOnly: true,
    adminFeeMax: null,
    maxLoanAmount: null,
    fixedRateOnly: false,
    note: 'Bahrain: Standard GCC reducing balance rules apply.',
    noteAr: 'البحرين: تطبق قواعد الرصيد المتناقص المعيارية لدول مجلس التعاون الخليجي.',
  },
  {
    value: 'egypt',
    label: 'Egypt',
    labelAr: 'مصر',
    currency: 'EGP',
    maxTenorMonths: null,
    maxDBR: 0.50,
    maxInterestRate: null,
    interestCapAtPrincipal: false,
    minSalary: null,
    reducingBalanceOnly: true,
    adminFeeMax: null,
    maxLoanAmount: null,
    fixedRateOnly: false,
    note: 'Egypt CBE: Installments capped at 50% of income. Current lending rate ~21%.',
    noteAr: 'البنك المركزي المصري: الأقساط لا تتجاوز 50% من الدخل. معدل الإقراض الحالي ~21%.',
  },
]

const RATE_MODES = [
  { value: 'conventional', label: 'Conventional (Interest)', labelAr: 'تقليدي (فائدة)' },
  { value: 'islamic', label: 'Islamic (Murabaha Profit)', labelAr: 'إسلامي (مرابحة)' },
]

type Warning = { key: string; msg: string; msgAr: string }

type Result = {
  emi: number
  totalPayable: number
  totalInterest: number
  principal: number
  apr: number
  currency: string
  amortization: { month: number; principal: number; interest: number; balance: number }[]
  adminFee: number
  isIslamic: boolean
  warnings: Warning[]
  compliant: boolean
}

function fmt(n: number, currency: string, decimals = 2) {
  return `${currency} ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function calcEMI(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function buildAmortization(principal: number, annualRate: number, months: number) {
  const emi = calcEMI(principal, annualRate, months)
  const r = annualRate / 100 / 12
  const rows: { month: number; principal: number; interest: number; balance: number }[] = []
  let balance = principal
  for (let m = 1; m <= months; m++) {
    const interestPart = balance * r
    const principalPart = emi - interestPart
    balance = Math.max(0, balance - principalPart)
    rows.push({ month: m, principal: principalPart, interest: interestPart, balance })
  }
  return rows
}

export default function GCCEMICalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [loanAmount, setLoanAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [tenorMonths, setTenorMonths] = useState('')
  const [country, setCountry] = useState('uae')
  const [rateMode, setRateMode] = useState('conventional')
  const [monthlySalary, setMonthlySalary] = useState('')
  const [processingFee, setProcessingFee] = useState('')
  const [showAmortization, setShowAmortization] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const selectedCountry = COUNTRIES.find(c => c.value === country)!
  const isIslamic = rateMode === 'islamic'

  const calculate = useCallback(() => {
    const P = parseFloat(loanAmount)
    const rate = parseFloat(interestRate)
    const n = parseInt(tenorMonths)
    const salary = parseFloat(monthlySalary) || 0
    const fee = parseFloat(processingFee) || 0

    if (!P || !rate || !n || P <= 0 || rate <= 0 || n <= 0) return

    const warnings: Warning[] = []
    let compliant = true

    // ── Tenor validation
    if (selectedCountry.maxTenorMonths && n > selectedCountry.maxTenorMonths) {
      warnings.push({
        key: 'tenor',
        msg: `${selectedCountry.label} max tenor is ${selectedCountry.maxTenorMonths} months.`,
        msgAr: `الحد الأقصى للمدة في ${selectedCountry.labelAr} هو ${selectedCountry.maxTenorMonths} شهراً.`,
      })
      compliant = false
    }

    // ── Rate validation
    if (selectedCountry.maxInterestRate && rate > selectedCountry.maxInterestRate) {
      warnings.push({
        key: 'rate',
        msg: `${selectedCountry.label} max rate is ${selectedCountry.maxInterestRate}%.`,
        msgAr: `الحد الأقصى للسعر في ${selectedCountry.labelAr} هو ${selectedCountry.maxInterestRate}%.`,
      })
      compliant = false
    }

    // ── Loan amount cap
    if (selectedCountry.maxLoanAmount && P > selectedCountry.maxLoanAmount) {
      warnings.push({
        key: 'maxloan',
        msg: `${selectedCountry.label} max loan is ${fmt(selectedCountry.maxLoanAmount, selectedCountry.currency, 0)}.`,
        msgAr: `الحد الأقصى للقرض في ${selectedCountry.labelAr} هو ${fmt(selectedCountry.maxLoanAmount, selectedCountry.currency, 0)}.`,
      })
      compliant = false
    }

    // ── Admin fee cap (Saudi)
    let adminFee = fee
    if (country === 'saudi' && fee > 0) {
      const capByPercent = P * 0.005
      const capAmount = Math.min(capByPercent, 2500)
      if (fee > capAmount) {
        adminFee = capAmount
        warnings.push({
          key: 'adminfee',
          msg: `Admin fee capped at SAR 2,500 or 0.5% per SAMA rules.`,
          msgAr: `الرسوم الإدارية محددة بـ 2,500 ريال أو 0.5% وفق أنظمة ساما.`,
        })
      }
    }

    // ── EMI calculation
    let emi: number
    let totalInterest: number
    let totalPayable: number
    let amortization: ReturnType<typeof buildAmortization> = []
    let apr: number

    if (isIslamic) {
      // Murabaha: profit = P × rate × years
      const years = n / 12
      const profit = P * (rate / 100) * years
      totalPayable = P + profit
      emi = totalPayable / n
      totalInterest = profit
      apr = rate  // flat profit disclosed as rate
      // Build pseudo-amortization for murabaha (equal installments)
      const principalPerMonth = P / n
      const profitPerMonth = profit / n
      let balance = P
      amortization = Array.from({ length: n }, (_, i) => {
        balance = Math.max(0, balance - principalPerMonth)
        return { month: i + 1, principal: principalPerMonth, interest: profitPerMonth, balance }
      })
    } else {
      emi = calcEMI(P, rate, n)
      totalPayable = emi * n
      totalInterest = totalPayable - P
      amortization = buildAmortization(P, rate, n)
      // APR ≈ rate (reducing balance; same formula)
      apr = rate
    }

    // ── UAE: total interest ≤ principal cap
    if (selectedCountry.interestCapAtPrincipal && totalInterest > P) {
      warnings.push({
        key: 'uaecap',
        msg: `UAE Supreme Court 2025: Total interest (${fmt(totalInterest, selectedCountry.currency)}) exceeds principal. Banks must waive the excess.`,
        msgAr: `حكم المحكمة العليا الإماراتية 2025: إجمالي الفائدة (${fmt(totalInterest, selectedCountry.currency)}) يتجاوز أصل القرض. يجب على البنوك التنازل عن الزيادة.`,
      })
      compliant = false
    }

    // ── DBR check
    if (salary > 0) {
      const dbr = emi / salary
      if (dbr > selectedCountry.maxDBR) {
        const pct = (dbr * 100).toFixed(1)
        warnings.push({
          key: 'dbr',
          msg: `DBR is ${pct}%, exceeding ${selectedCountry.label}'s ${selectedCountry.maxDBR * 100}% limit.`,
          msgAr: `نسبة العبء المالي ${pct}%، تتجاوز حد ${selectedCountry.labelAr} البالغ ${selectedCountry.maxDBR * 100}%.`,
        })
        compliant = false
      }
    }

    setResult({
      emi,
      totalPayable: totalPayable + adminFee,
      totalInterest,
      principal: P,
      apr,
      currency: selectedCountry.currency,
      amortization,
      adminFee,
      isIslamic,
      warnings,
      compliant,
    })
  }, [loanAmount, interestRate, tenorMonths, country, rateMode, monthlySalary, processingFee, isIslamic, selectedCountry])

  function reset() {
    setLoanAmount('')
    setInterestRate('')
    setTenorMonths('')
    setMonthlySalary('')
    setProcessingFee('')
    setShowAmortization(false)
    setResult(null)
  }

  const t = isAr
    ? {
        title: 'حاسبة القسط الشهري — دول الخليج',
        amount: 'مبلغ القرض',
        rate: 'سعر الفائدة / الربح السنوي (%)',
        tenor: 'المدة (بالأشهر)',
        country: 'الدولة',
        mode: 'نوع التمويل',
        salary: 'الراتب الشهري (للتحقق من DBR)',
        fee: 'رسوم المعالجة',
        calc: 'احسب القسط',
        reset: 'إعادة تعيين',
        results: 'النتائج',
        emi: 'القسط الشهري',
        totalPayable: 'إجمالي المبلغ المستحق',
        totalInterest: 'إجمالي الفائدة / الربح',
        apr: 'معدل الفائدة السنوي (APR)',
        adminFee: 'رسوم إدارية',
        compliant: '✅ متوافق مع القانون المحلي',
        notCompliant: '⚠️ يوجد تحذيرات قانونية',
        warnings: 'التحذيرات',
        showSchedule: 'عرض جدول السداد',
        hideSchedule: 'إخفاء جدول السداد',
        month: 'الشهر',
        principal: 'أصل القرض',
        interest: 'الفائدة',
        balance: 'الرصيد المتبقي',
        legalNote: 'الملاحظة القانونية',
        enterAmt: 'أدخل المبلغ',
        placeholder: '0',
      }
    : {
        title: 'GCC EMI Calculator',
        amount: 'Loan Amount',
        rate: 'Annual Interest / Profit Rate (%)',
        tenor: 'Loan Tenor (months)',
        country: 'Country',
        mode: 'Finance Type',
        salary: 'Monthly Salary (for DBR check)',
        fee: 'Processing Fee',
        calc: 'Calculate EMI',
        reset: 'Reset',
        results: 'Results',
        emi: 'Monthly EMI',
        totalPayable: 'Total Payable',
        totalInterest: 'Total Interest / Profit',
        apr: 'Annual Percentage Rate (APR)',
        adminFee: 'Admin / Processing Fee',
        compliant: '✅ Compliant with local law',
        notCompliant: '⚠️ Legal warnings detected',
        warnings: 'Warnings',
        showSchedule: 'Show Amortization Schedule',
        hideSchedule: 'Hide Schedule',
        month: 'Month',
        principal: 'Principal',
        interest: isAr ? 'الفائدة' : 'Interest',
        balance: 'Balance',
        legalNote: 'Legal Note',
        enterAmt: 'Enter amount',
        placeholder: '0',
      }

  const maxTenorHint = selectedCountry.maxTenorMonths
    ? `max ${selectedCountry.maxTenorMonths} mo`
    : ''

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {RATE_MODES.map(m => (
          <button
            key={m.value}
            onClick={() => setRateMode(m.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              rateMode === m.value
                ? 'bg-white shadow-sm text-emerald-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {isAr ? m.labelAr : m.label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Country */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.country}
          </label>
          <select
            value={country}
            onChange={e => { setCountry(e.target.value); setResult(null) }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {COUNTRIES.map(c => (
              <option key={c.value} value={c.value}>{isAr ? c.labelAr : c.label}</option>
            ))}
          </select>
        </div>

        {/* Loan Amount */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.amount}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {selectedCountry.currency}
            </span>
            <input
              type="number"
              min="0"
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              placeholder={t.enterAmt}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          {selectedCountry.maxLoanAmount && (
            <p className="text-xs text-gray-500 mt-1">
              max {fmt(selectedCountry.maxLoanAmount, selectedCountry.currency, 0)}
            </p>
          )}
        </div>

        {/* Rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.rate}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.1"
              value={interestRate}
              onChange={e => setInterestRate(e.target.value)}
              placeholder="e.g. 6.5"
              className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">%</span>
          </div>
          {selectedCountry.maxInterestRate && (
            <p className="text-xs text-gray-500 mt-1">max {selectedCountry.maxInterestRate}%</p>
          )}
          {selectedCountry.fixedRateOnly && (
            <p className="text-xs text-amber-500 mt-1">Fixed rate only (Kuwait law)</p>
          )}
        </div>

        {/* Tenor */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.tenor}
          </label>
          <input
            type="number"
            min="1"
            value={tenorMonths}
            onChange={e => setTenorMonths(e.target.value)}
            placeholder="e.g. 36"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          {maxTenorHint && (
            <p className="text-xs text-gray-500 mt-1">{maxTenorHint}</p>
          )}
        </div>

        {/* Monthly Salary */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.salary}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {selectedCountry.currency}
            </span>
            <input
              type="number"
              min="0"
              value={monthlySalary}
              onChange={e => setMonthlySalary(e.target.value)}
              placeholder={t.enterAmt}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">DBR limit: {selectedCountry.maxDBR * 100}%</p>
        </div>

        {/* Processing Fee */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.fee} <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {selectedCountry.currency}
            </span>
            <input
              type="number"
              min="0"
              value={processingFee}
              onChange={e => setProcessingFee(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          {selectedCountry.adminFeeMax && (
            <p className="text-xs text-gray-500 mt-1">
              {country === 'oman' ? `Max ${selectedCountry.currency} ${selectedCountry.adminFeeMax}` : `Max ${selectedCountry.currency} ${selectedCountry.adminFeeMax} or 0.5%`}
            </p>
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
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">{t.results}</h3>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${
                result.compliant
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {result.compliant ? t.compliant : t.notCompliant}
            </span>
          </div>

          {/* Hero EMI */}
          <div className="bg-emerald-600 rounded-xl p-4 text-white">
            <div className="text-sm opacity-80 mb-1">
              {t.emi} {result.isIslamic ? '(Murabaha)' : ''}
            </div>
            <div className="text-3xl font-black">
              {fmt(result.emi, result.currency)}
            </div>
            <div className="text-xs opacity-70 mt-1">per month</div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <Row label={isAr ? 'أصل القرض' : 'Loan Principal'} value={fmt(result.principal, result.currency)} />
            <Row
              label={result.isIslamic ? (isAr ? 'إجمالي الربح' : 'Total Profit') : t.totalInterest}
              value={fmt(result.totalInterest, result.currency)}
              negative
            />
            {result.adminFee > 0 && (
              <Row label={t.adminFee} value={`+ ${fmt(result.adminFee, result.currency)}`} negative />
            )}
            <div className="border-t border-gray-200 pt-3">
              <Row label={t.totalPayable} value={fmt(result.totalPayable, result.currency)} highlight />
              <Row label={t.apr} value={`${result.apr.toFixed(2)}%`} />
            </div>
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-bold text-amber-800">{t.warnings}</p>
              {result.warnings.map(w => (
                <p key={w.key} className="text-xs text-amber-700">
                  ⚠️ {isAr ? w.msgAr : w.msg}
                </p>
              ))}
            </div>
          )}

          {/* Legal note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 mb-1">{t.legalNote}</p>
            <p className="text-xs text-blue-600">
              {isAr ? selectedCountry.noteAr : selectedCountry.note}
            </p>
          </div>

          {/* Amortization toggle */}
          <button
            onClick={() => setShowAmortization(v => !v)}
            className="w-full py-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 border border-emerald-200 rounded-xl transition-colors"
          >
            {showAmortization ? t.hideSchedule : t.showSchedule}
          </button>

          {showAmortization && (
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
                  {result.amortization.map(row => (
                    <tr key={row.month} className="bg-white hover:bg-gray-50">
                      <td className="px-3 py-2 text-right text-gray-500">{row.month}</td>
                      <td className="px-3 py-2 text-right text-gray-900">{fmt(row.principal, result.currency)}</td>
                      <td className="px-3 py-2 text-right text-red-500">{fmt(row.interest, result.currency)}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(row.balance, result.currency)}</td>
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
