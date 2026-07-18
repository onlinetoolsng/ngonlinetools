'use client'

import { useState, useMemo } from 'react'

type Props = { locale: string }

type LoanType = 'personal' | 'car' | 'general'
type Nationality = 'expat' | 'national'

interface Inputs {
  loanType: LoanType
  income: string
  nationality: Nationality
  existingDebt: string
  tenure: number
  rate: string
  vehiclePrice: string
  downPayment: string
}

interface EligibilityResult {
  currentDBR: number
  remainingCapacity: number
  maxLoanAmount: number
  estimatedEMI: number
  totalInterest: number
  totalPayable: number
  dbrAfterLoan: number
  maxTenure: number
  eligibilityLevel: 'green' | 'yellow' | 'red'
  tips: string[]
  carMaxLTV?: number
  minDownPayment?: number
}

// ─── EMI formula (reducing balance) ───────────────────────────
function calcEMI(P: number, annualRate: number, n: number): number {
  if (annualRate === 0) return P / n
  const r = annualRate / 12 / 100
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// ─── Max principal from EMI capacity ──────────────────────────
function maxPrincipalFromEMI(emiCapacity: number, annualRate: number, n: number): number {
  if (annualRate === 0) return emiCapacity * n
  const r = annualRate / 12 / 100
  return (emiCapacity * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n))
}

function fmt(n: number, decimals = 0) {
  return `AED ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
}

const PERSONAL_MAX_TENURE = 48
const CAR_MAX_TENURE = 60
const MAX_DBR = 0.5
const PERSONAL_MAX_MULTIPLIER = 20
const CAR_MAX_LTV = 0.8

export default function UAELoanEligibilityCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [inputs, setInputs] = useState<Inputs>({
    loanType: 'general',
    income: '',
    nationality: 'expat',
    existingDebt: '',
    tenure: 36,
    rate: '9',
    vehiclePrice: '',
    downPayment: '',
  })

  function set<K extends keyof Inputs>(k: K, v: Inputs[K]) {
    setInputs(prev => ({ ...prev, [k]: v }))
  }

  const result = useMemo<EligibilityResult | null>(() => {
    const income = parseFloat(inputs.income)
    const existing = parseFloat(inputs.existingDebt) || 0
    const rate = parseFloat(inputs.rate) || 9
    const { tenure, loanType, nationality } = inputs

    if (!income || income <= 0) return null

    const maxAllowedDebt = income * MAX_DBR
    const remainingCapacity = Math.max(0, maxAllowedDebt - existing)
    const currentDBR = (existing / income) * 100

    const maxTenure = loanType === 'car' ? CAR_MAX_TENURE : PERSONAL_MAX_TENURE
    const effectiveTenure = Math.min(tenure, maxTenure)

    // Max by DBR capacity
    const maxByCapacity = maxPrincipalFromEMI(remainingCapacity, rate, effectiveTenure)

    let maxLoanAmount = 0

    if (loanType === 'personal' || loanType === 'general') {
      const maxByMultiplier = income * PERSONAL_MAX_MULTIPLIER
      maxLoanAmount = Math.min(maxByCapacity, maxByMultiplier)
    }

    if (loanType === 'car') {
      const vehiclePrice = parseFloat(inputs.vehiclePrice) || 0
      const maxByLTV = vehiclePrice * CAR_MAX_LTV
      maxLoanAmount = vehiclePrice > 0
        ? Math.min(maxByCapacity, maxByLTV)
        : maxByCapacity
    }

    if (loanType === 'general') {
      // Show personal only for general view
      const maxByMultiplier = income * PERSONAL_MAX_MULTIPLIER
      maxLoanAmount = Math.min(maxByCapacity, maxByMultiplier)
    }

    maxLoanAmount = Math.max(0, maxLoanAmount)

    const estimatedEMI = maxLoanAmount > 0 ? calcEMI(maxLoanAmount, rate, effectiveTenure) : 0
    const totalPayable = estimatedEMI * effectiveTenure
    const totalInterest = totalPayable - maxLoanAmount
    const dbrAfterLoan = ((existing + estimatedEMI) / income) * 100

    // Eligibility traffic light
    let eligibilityLevel: 'green' | 'yellow' | 'red' = 'green'
    if (currentDBR >= 50 || maxLoanAmount <= 0) eligibilityLevel = 'red'
    else if (dbrAfterLoan > 40) eligibilityLevel = 'yellow'
    else eligibilityLevel = 'green'

    // Tips
    const tips: string[] = []
    if (loanType === 'car') {
      const vp = parseFloat(inputs.vehiclePrice) || 0
      const dp = parseFloat(inputs.downPayment) || 0
      const minDP = vp * 0.2
      if (dp < minDP && vp > 0) tips.push(`Increase down payment to at least ${fmt(minDP)} (20% of vehicle price).`)
    }
    if (dbrAfterLoan > 35) tips.push('Reducing existing debt before applying will improve your DBR and approval odds.')
    if (existing > 0) tips.push('Consolidating existing loans may lower your total monthly obligation.')
    if (maxLoanAmount > 0 && dbrAfterLoan < 30) tips.push('Your DBR looks healthy. Transferring your salary to the lending bank may unlock lower interest rates.')
    if (eligibilityLevel === 'red' && currentDBR < 50) tips.push('Try a shorter loan amount or extend your tenure to reduce the monthly EMI.')
    if (nationality === 'national') tips.push('As a UAE national, you may qualify for preferential rates through government-linked banks and the Nafis programme.')

    return {
      currentDBR,
      remainingCapacity,
      maxLoanAmount,
      estimatedEMI,
      totalInterest,
      totalPayable,
      dbrAfterLoan,
      maxTenure,
      eligibilityLevel,
      tips,
      carMaxLTV: loanType === 'car' ? CAR_MAX_LTV * 100 : undefined,
      minDownPayment:
        loanType === 'car' && parseFloat(inputs.vehiclePrice) > 0
          ? parseFloat(inputs.vehiclePrice) * 0.2
          : undefined,
    }
  }, [inputs])

  function reset() {
    setInputs({
      loanType: 'general',
      income: '',
      nationality: 'expat',
      existingDebt: '',
      tenure: 36,
      rate: '9',
      vehiclePrice: '',
      downPayment: '',
    })
  }

  const t = isAr
    ? {
        loanType: 'نوع القرض',
        personal: 'قرض شخصي',
        car: 'قرض سيارة',
        general: 'أهلية عامة',
        income: 'الراتب الشهري الإجمالي',
        nationality: 'الجنسية',
        expat: 'وافد / غير مواطن',
        national: 'مواطن إماراتي',
        existingDebt: 'الالتزامات الشهرية القائمة',
        existingDebtHint: 'أقساط القروض الحالية + ~5% من حدود بطاقات الائتمان',
        tenure: 'مدة القرض (أشهر)',
        rate: 'معدل الفائدة السنوي (%)',
        vehiclePrice: 'سعر السيارة',
        downPayment: 'الدفعة الأولى',
        calculate: 'احسب الأهلية',
        reset: 'إعادة تعيين',
        results: 'نتيجة الأهلية',
        maxLoan: 'الحد الأقصى للقرض',
        monthlyEMI: 'القسط الشهري التقديري',
        totalInterest: 'إجمالي الفوائد',
        totalPayable: 'إجمالي المبلغ المدفوع',
        currentDBR: 'نسبة عبء الدين الحالية',
        dbrAfterLoan: 'نسبة عبء الدين بعد القرض',
        remainingCapacity: 'القدرة الشهرية المتبقية',
        tips: 'نصائح لتحسين أهليتك',
        disclaimer: 'هذه الأداة تقديرية للأغراض التعليمية فقط. الموافقة الفعلية تعتمد على درجة ائتمانك لدى الاتحاد للمعلومات الائتمانية (AECB) وسياسات البنك وعوامل أخرى. ليست نصيحة مالية.',
        green: 'أهلية عالية',
        yellow: 'أهلية محتملة',
        red: 'أهلية منخفضة',
        greenDesc: 'نسبة عبء دين صحية — فرص الموافقة جيدة',
        yellowDesc: 'قريب من الحد الأقصى — الموافقة ممكنة لكن محدودة',
        redDesc: 'تجاوز الحد الأقصى — من المرجح رفض القرض',
        enterAmount: 'أدخل المبلغ',
        maxTenureNote: 'الحد الأقصى للمدة',
        carLTVNote: '80% من قيمة السيارة كحد أقصى',
        personalCapNote: '20× الراتب كحد أقصى',
      }
    : {
        loanType: 'Loan Type',
        personal: 'Personal Loan',
        car: 'Car Loan',
        general: 'General Eligibility',
        income: 'Gross Monthly Salary',
        nationality: 'Nationality',
        expat: 'Expatriate / Non-national',
        national: 'UAE National',
        existingDebt: 'Existing Monthly Obligations',
        existingDebtHint: 'Current loan EMIs + ~5% of total credit card limits',
        tenure: 'Loan Tenure (Months)',
        rate: 'Annual Interest Rate (%)',
        vehiclePrice: 'Vehicle Price',
        downPayment: 'Down Payment',
        calculate: 'Check Eligibility',
        reset: 'Reset',
        results: 'Your Eligibility Results',
        maxLoan: 'Max Loan Amount',
        monthlyEMI: 'Estimated Monthly EMI',
        totalInterest: 'Total Interest',
        totalPayable: 'Total Payable',
        currentDBR: 'Current DBR',
        dbrAfterLoan: 'DBR After New Loan',
        remainingCapacity: 'Monthly Repayment Capacity',
        tips: 'Tips to Improve Your Eligibility',
        disclaimer:
          'This is an educational estimation tool based on CBUAE regulations. It is not a loan approval, financial advice, or guarantee. Actual approval depends on your AECB credit score, employment profile, and bank-specific policies. Consult a licensed bank or financial advisor.',
        green: 'High Eligibility',
        yellow: 'Possible — Borderline',
        red: 'Low Eligibility',
        greenDesc: 'Healthy DBR — strong approval odds',
        yellowDesc: 'Approaching the limit — approval tighter',
        redDesc: 'Exceeds CBUAE cap — approval unlikely',
        enterAmount: 'Enter amount',
        maxTenureNote: 'max tenure',
        carLTVNote: 'Max 80% of vehicle value',
        personalCapNote: 'Max 20× salary',
      }

  const eligibilityConfig = {
    green: { bg: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-800', label: t.green, desc: t.greenDesc },
    yellow: { bg: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800', label: t.yellow, desc: t.yellowDesc },
    red: { bg: 'bg-red-500', badge: 'bg-red-100 text-red-700', label: t.red, desc: t.redDesc },
  }

  const ec = result ? eligibilityConfig[result.eligibilityLevel] : null

  const maxTenure = inputs.loanType === 'car' ? CAR_MAX_TENURE : PERSONAL_MAX_TENURE

  return (
    <div className="space-y-6">
      {/* Loan type selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.loanType}</label>
        <div className="flex gap-2 flex-wrap">
          {(['general', 'personal', 'car'] as LoanType[]).map(type => (
            <button
              key={type}
              onClick={() => set('loanType', type)}
              className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors ${
                inputs.loanType === type
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-200 text-gray-600 hover:border-emerald-400'
              }`}
            >
              {t[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Input grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Income */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.income}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number"
              min="0"
              value={inputs.income}
              onChange={e => set('income', e.target.value)}
              placeholder={t.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          {inputs.loanType !== 'car' && (
            <p className="mt-1 text-xs text-gray-500">
              {t.personalCapNote}
              {inputs.income && parseFloat(inputs.income) > 0
                ? ` — up to ${fmt(parseFloat(inputs.income) * 20)}`
                : ''}
            </p>
          )}
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.nationality}</label>
          <select
            value={inputs.nationality}
            onChange={e => set('nationality', e.target.value as Nationality)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            <option value="expat">{t.expat}</option>
            <option value="national">{t.national}</option>
          </select>
        </div>

        {/* Existing debt */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.existingDebt}
            <span className="ml-1 font-normal text-gray-500 text-xs">(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number"
              min="0"
              value={inputs.existingDebt}
              onChange={e => set('existingDebt', e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">{t.existingDebtHint}</p>
        </div>

        {/* Car-specific fields */}
        {inputs.loanType === 'car' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t.vehiclePrice}
                <span className="ml-1 font-normal text-gray-500 text-xs">({t.carLTVNote})</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
                <input
                  type="number"
                  min="0"
                  value={inputs.vehiclePrice}
                  onChange={e => {
                    set('vehiclePrice', e.target.value)
                    // Auto-fill 20% down
                    const dp = parseFloat(e.target.value) * 0.2
                    if (!isNaN(dp)) set('downPayment', String(Math.round(dp)))
                  }}
                  placeholder={t.enterAmount}
                  className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t.downPayment}
                <span className="ml-1 font-normal text-gray-500 text-xs">(min 20%)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
                <input
                  type="number"
                  min="0"
                  value={inputs.downPayment}
                  onChange={e => set('downPayment', e.target.value)}
                  placeholder={t.enterAmount}
                  className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
              {inputs.vehiclePrice && parseFloat(inputs.vehiclePrice) > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Min: {fmt(parseFloat(inputs.vehiclePrice) * 0.2)} (20%)
                </p>
              )}
            </div>
          </>
        )}

        {/* Tenure */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.tenure}
            <span className="ml-1 font-normal text-gray-500 text-xs">(max {maxTenure}m)</span>
          </label>
          <input
            type="number"
            min="6"
            max={maxTenure}
            value={inputs.tenure}
            onChange={e => set('tenure', Math.min(parseInt(e.target.value) || 6, maxTenure))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {[12, 24, 36, 48, ...(inputs.loanType === 'car' ? [60] : [])]
              .filter(m => m <= maxTenure)
              .map(m => (
                <button
                  key={m}
                  onClick={() => set('tenure', m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    inputs.tenure === m
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-gray-200 text-gray-500 hover:border-emerald-400'
                  }`}
                >
                  {m}m
                </button>
              ))}
          </div>
        </div>

        {/* Rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.rate}
            <span className="ml-1 font-normal text-gray-500 text-xs">(reducing balance)</span>
          </label>
          <input
            type="number"
            min="0"
            max="30"
            step="0.5"
            value={inputs.rate}
            onChange={e => set('rate', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {['5', '7', '9', '11', '13'].map(r => (
              <button
                key={r}
                onClick={() => set('rate', r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  inputs.rate === r
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-gray-200 text-gray-500 hover:border-emerald-400'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <div className={`flex-1 text-center font-semibold py-3 px-6 rounded-xl text-white transition-colors ${
          result ? 'bg-emerald-600' : 'bg-emerald-600 opacity-60'
        }`}>
          {result ? '✓ Results updating live' : t.calculate}
        </div>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {t.reset}
        </button>
      </div>

      {/* Results */}
      {result && ec && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-5 border border-gray-100">
          <h3 className="font-bold text-gray-900">{t.results}</h3>

          {/* Eligibility badge */}
          <div className={`${ec.bg} rounded-xl p-4 text-white`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {result.eligibilityLevel === 'green' ? '✓' : result.eligibilityLevel === 'yellow' ? '⚠' : '✗'}
              </span>
              <div>
                <div className="font-black text-xl">{ec.label}</div>
                <div className="text-sm opacity-80">{ec.desc}</div>
              </div>
            </div>
          </div>

          {/* Max loan — hero */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">{t.maxLoan}</div>
              <div className="text-lg font-black text-gray-900">{fmt(result.maxLoanAmount)}</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">{t.monthlyEMI}</div>
              <div className="text-lg font-black text-gray-900">{fmt(result.estimatedEMI, 2)}</div>
            </div>
          </div>

          {/* DBR gauges */}
          <div className="space-y-3">
            <DBRBar
              label={t.currentDBR}
              value={result.currentDBR}
              max={50}
              color={result.currentDBR >= 50 ? 'red' : result.currentDBR > 35 ? 'amber' : 'emerald'}
            />
            <DBRBar
              label={t.dbrAfterLoan}
              value={result.dbrAfterLoan}
              max={50}
              color={result.dbrAfterLoan >= 50 ? 'red' : result.dbrAfterLoan > 40 ? 'amber' : 'emerald'}
            />
          </div>

          {/* Detail rows */}
          <div className="space-y-3 bg-white border border-gray-100 rounded-xl p-4">
            <Row label={t.remainingCapacity} value={fmt(result.remainingCapacity, 2)} />
            <Row label={t.totalInterest} value={fmt(result.totalInterest)} />
            <div className="border-t border-gray-100 pt-3">
              <Row label={t.totalPayable} value={fmt(result.totalPayable)} highlight />
            </div>
          </div>

          {/* Tips */}
          {result.tips.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-800">{t.tips}</p>
              <ul className="space-y-1.5">
                {result.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-blue-700 flex gap-2">
                    <span className="shrink-0">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
            ⚠️ {t.disclaimer}
          </p>
        </div>
      )}
    </div>
  )
}

function DBRBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: 'emerald' | 'amber' | 'red'
}) {
  const pct = Math.min((value / max) * 100, 100)
  const barColor =
    color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-400' : 'bg-red-500'
  const textColor =
    color === 'emerald' ? 'text-emerald-700' : color === 'amber' ? 'text-amber-600' : 'text-red-600'

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-bold ${textColor}`}>{fmtPct(value)} <span className="text-gray-500 font-normal text-xs">/ 50% max</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
