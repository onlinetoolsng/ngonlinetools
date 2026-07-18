'use client'

import { useState, useMemo } from 'react'

type Props = { locale: string }

// ─── Jurisdiction Rule-Sets ───────────────────────────────────────────────────

type FeeEntry = {
  id: string
  name_en: string
  name_ar: string
  defaultAmount: number
  applyMethod: 'upfront' | 'capitalized'
}

type JurisdictionRules = {
  id: string
  displayName: { en: string; ar: string }
  currency: string
  minTermMonths: number
  maxTermMonths: number
  minDownPaymentPercent: number
  maxLTVPercent: number
  typicalRateMin: number
  typicalRateMax: number
  typicalInterestTypes: ('reducing' | 'flat')[]
  fees: FeeEntry[]
  earlySettlement: { allowed: boolean; penaltyType: 'fixed' | 'percent' | 'none'; penaltyValue: number }
  usedCarMaxTermMonths: number
  usedCarMaxLTVPercent: number
  saleExportNote_en?: string
  saleExportNote_ar?: string
  requiredDisclosure_en: string
  requiredDisclosure_ar: string
  marketPracticeNote_en: string
  marketPracticeNote_ar: string
  lastUpdated: string
}

const RULES: Record<string, JurisdictionRules> = {
  uae: {
    id: 'uae',
    displayName: { en: 'UAE', ar: 'الإمارات' },
    currency: 'AED',
    minTermMonths: 12,
    maxTermMonths: 60,
    minDownPaymentPercent: 20,
    maxLTVPercent: 80,
    typicalRateMin: 2.49,
    typicalRateMax: 5.99,
    typicalInterestTypes: ['reducing', 'flat'],
    fees: [
      { id: 'processing', name_en: 'Processing Fee', name_ar: 'رسوم المعالجة', defaultAmount: 0, applyMethod: 'upfront' },
      { id: 'documentation', name_en: 'Documentation Fee', name_ar: 'رسوم التوثيق', defaultAmount: 0, applyMethod: 'upfront' },
    ],
    earlySettlement: { allowed: true, penaltyType: 'percent', penaltyValue: 1 },
    usedCarMaxTermMonths: 48,
    usedCarMaxLTVPercent: 75,
    saleExportNote_en: 'Financed vehicles in Dubai/UAE require a Bank NOC and Tourism Certificate to be transferred or exported. Contact your lender and RTA before any transfer.',
    saleExportNote_ar: 'تستلزم المركبات الممولة في دبي/الإمارات الحصول على خطاب عدم ممانعة من البنك وشهادة سياحية لأي نقل ملكية أو تصدير. راجع البنك وهيئة الطرق والمواصلات.',
    requiredDisclosure_en: 'Estimates are based on published guidelines from UAE Central Bank, ADCB, and RAKBANK product pages. This is not a loan offer. Final terms are set by your lender.',
    requiredDisclosure_ar: 'التقديرات مستندة إلى إرشادات مصرف الإمارات المركزي وصفحات منتجات ADCB وRAKBANK. هذه ليست عرضًا ائتمانيًا. تحدد شروطك النهائية جهةُ التمويل.',
    marketPracticeNote_en: 'Max LTV 80% and min 20% down payment reflect market practice at major UAE banks. Central Bank consumer-finance regulations apply.',
    marketPracticeNote_ar: 'يعكس الحد الأقصى لنسبة التمويل 80% والحد الأدنى للدفعة الأولى 20% الممارسة السائدة في البنوك الإماراتية الكبرى.',
    lastUpdated: '2025-01-01',
  },
  saudi: {
    id: 'saudi',
    displayName: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
    currency: 'SAR',
    minTermMonths: 12,
    maxTermMonths: 60,
    minDownPaymentPercent: 15,
    maxLTVPercent: 85,
    typicalRateMin: 2.99,
    typicalRateMax: 6.49,
    typicalInterestTypes: ['reducing', 'flat'],
    fees: [
      { id: 'admin', name_en: 'Administrative Fee', name_ar: 'رسوم إدارية', defaultAmount: 0, applyMethod: 'upfront' },
    ],
    earlySettlement: { allowed: true, penaltyType: 'percent', penaltyValue: 1 },
    usedCarMaxTermMonths: 48,
    usedCarMaxLTVPercent: 75,
    requiredDisclosure_en: 'Estimates based on SAMA (Saudi Central Bank) market practice guidelines. Not a loan offer.',
    requiredDisclosure_ar: 'التقديرات مستندة إلى إرشادات مؤسسة النقد العربي السعودي (ساما). ليست عرضًا ائتمانيًا.',
    marketPracticeNote_en: 'Rules reflect SAMA market practice. Verify with your lender for exact terms.',
    marketPracticeNote_ar: 'القواعد تعكس الممارسة السوقية وفق ساما. تحقق من البنك للحصول على الشروط الدقيقة.',
    lastUpdated: '2025-01-01',
  },
  qatar: {
    id: 'qatar',
    displayName: { en: 'Qatar', ar: 'قطر' },
    currency: 'QAR',
    minTermMonths: 12,
    maxTermMonths: 60,
    minDownPaymentPercent: 20,
    maxLTVPercent: 80,
    typicalRateMin: 2.75,
    typicalRateMax: 5.99,
    typicalInterestTypes: ['reducing', 'flat'],
    fees: [],
    earlySettlement: { allowed: true, penaltyType: 'percent', penaltyValue: 1 },
    usedCarMaxTermMonths: 48,
    usedCarMaxLTVPercent: 70,
    requiredDisclosure_en: 'Estimates based on Qatar Central Bank market practice. Not a loan offer.',
    requiredDisclosure_ar: 'التقديرات مستندة إلى ممارسة مصرف قطر المركزي. ليست عرضًا ائتمانيًا.',
    marketPracticeNote_en: 'Rules reflect Qatar Central Bank market practice.',
    marketPracticeNote_ar: 'القواعد تعكس الممارسة السوقية لمصرف قطر المركزي.',
    lastUpdated: '2025-01-01',
  },
  kuwait: {
    id: 'kuwait',
    displayName: { en: 'Kuwait', ar: 'الكويت' },
    currency: 'KWD',
    minTermMonths: 12,
    maxTermMonths: 60,
    minDownPaymentPercent: 20,
    maxLTVPercent: 80,
    typicalRateMin: 3.0,
    typicalRateMax: 6.0,
    typicalInterestTypes: ['reducing'],
    fees: [],
    earlySettlement: { allowed: true, penaltyType: 'none', penaltyValue: 0 },
    usedCarMaxTermMonths: 48,
    usedCarMaxLTVPercent: 70,
    requiredDisclosure_en: 'Estimates based on Central Bank of Kuwait market practice. Not a loan offer.',
    requiredDisclosure_ar: 'التقديرات مستندة إلى ممارسة بنك الكويت المركزي. ليست عرضًا ائتمانيًا.',
    marketPracticeNote_en: 'Rules reflect Central Bank of Kuwait market practice.',
    marketPracticeNote_ar: 'القواعد تعكس الممارسة السوقية لبنك الكويت المركزي.',
    lastUpdated: '2025-01-01',
  },
  bahrain: {
    id: 'bahrain',
    displayName: { en: 'Bahrain', ar: 'البحرين' },
    currency: 'BHD',
    minTermMonths: 12,
    maxTermMonths: 60,
    minDownPaymentPercent: 20,
    maxLTVPercent: 80,
    typicalRateMin: 2.99,
    typicalRateMax: 6.0,
    typicalInterestTypes: ['reducing', 'flat'],
    fees: [],
    earlySettlement: { allowed: true, penaltyType: 'percent', penaltyValue: 1 },
    usedCarMaxTermMonths: 48,
    usedCarMaxLTVPercent: 70,
    requiredDisclosure_en: 'Estimates based on Central Bank of Bahrain market practice. Not a loan offer.',
    requiredDisclosure_ar: 'التقديرات مستندة إلى ممارسة مصرف البحرين المركزي. ليست عرضًا ائتمانيًا.',
    marketPracticeNote_en: 'Rules reflect Central Bank of Bahrain market practice.',
    marketPracticeNote_ar: 'القواعد تعكس الممارسة السوقية لمصرف البحرين المركزي.',
    lastUpdated: '2025-01-01',
  },
  oman: {
    id: 'oman',
    displayName: { en: 'Oman', ar: 'عُمان' },
    currency: 'OMR',
    minTermMonths: 12,
    maxTermMonths: 60,
    minDownPaymentPercent: 20,
    maxLTVPercent: 80,
    typicalRateMin: 3.0,
    typicalRateMax: 6.5,
    typicalInterestTypes: ['reducing', 'flat'],
    fees: [],
    earlySettlement: { allowed: true, penaltyType: 'percent', penaltyValue: 1 },
    usedCarMaxTermMonths: 48,
    usedCarMaxLTVPercent: 70,
    requiredDisclosure_en: 'Estimates based on Central Bank of Oman market practice. Not a loan offer.',
    requiredDisclosure_ar: 'التقديرات مستندة إلى ممارسة البنك المركزي العُماني. ليست عرضًا ائتمانيًا.',
    marketPracticeNote_en: 'Rules reflect Central Bank of Oman market practice.',
    marketPracticeNote_ar: 'القواعد تعكس الممارسة السوقية للبنك المركزي العُماني.',
    lastUpdated: '2025-01-01',
  },
  egypt: {
    id: 'egypt',
    displayName: { en: 'Egypt', ar: 'مصر' },
    currency: 'EGP',
    minTermMonths: 12,
    maxTermMonths: 60,
    minDownPaymentPercent: 25,
    maxLTVPercent: 75,
    typicalRateMin: 18.0,
    typicalRateMax: 30.0,
    typicalInterestTypes: ['reducing', 'flat'],
    fees: [
      { id: 'admin', name_en: 'Administrative Fee', name_ar: 'رسوم إدارية', defaultAmount: 0, applyMethod: 'upfront' },
    ],
    earlySettlement: { allowed: true, penaltyType: 'percent', penaltyValue: 2 },
    usedCarMaxTermMonths: 48,
    usedCarMaxLTVPercent: 65,
    requiredDisclosure_en: 'Estimates based on Central Bank of Egypt market practice. Not a loan offer.',
    requiredDisclosure_ar: 'التقديرات مستندة إلى ممارسة البنك المركزي المصري. ليست عرضًا ائتمانيًا.',
    marketPracticeNote_en: 'Rules reflect Central Bank of Egypt market practice. Interest rates in Egypt are subject to change.',
    marketPracticeNote_ar: 'القواعد تعكس الممارسة السوقية للبنك المركزي المصري. معدلات الفائدة عرضة للتغيير.',
    lastUpdated: '2025-01-01',
  },
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AmortRow = { month: number; payment: number; principal: number; interest: number; balance: number }

type CalcResult = {
  financedAmount: number
  monthlyPayment: number
  totalInterest: number
  totalCost: number
  totalUpfrontFees: number
  aprPercent: number
  flatRateEquivalent: number | null
  earlySettlementAfter: number
  earlySettlementAmount: number
  schedule: AmortRow[]
  downPayment: number
  currency: string
  ruleId: string
  interestType: 'reducing' | 'flat'
  warnings: string[]
}

// ─── Calculation Engine ───────────────────────────────────────────────────────

function pmtReducing(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function flatRateToApr(flatRate: number, months: number): number {
  // Newton-Raphson solve for IRR
  const totalInterest = (flatRate / 100) * months / 12
  const payment = (1 + totalInterest) / months
  let r = flatRate / 100 / 12
  for (let i = 0; i < 100; i++) {
    const f = r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1) - payment
    const df = (Math.pow(1 + r, months) * (1 + r * months - Math.pow(1 + r, months))) /
               (Math.pow((Math.pow(1 + r, months) - 1), 2))
    const rNew = r - f / df
    if (Math.abs(rNew - r) < 1e-10) { r = rNew; break }
    r = rNew
  }
  return r * 12 * 100
}

function computeIRR(flows: number[]): number {
  let r = 0.01
  for (let i = 0; i < 200; i++) {
    const npv = flows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + r, t), 0)
    const dnpv = flows.reduce((acc, cf, t) => acc - t * cf / Math.pow(1 + r, t + 1), 0)
    const rNew = r - npv / dnpv
    if (Math.abs(rNew - r) < 1e-10) { r = rNew; break }
    r = rNew
  }
  return r * 12 * 100
}

function buildSchedule(principal: number, annualRate: number, months: number, monthly: number): AmortRow[] {
  const r = annualRate / 100 / 12
  const rows: AmortRow[] = []
  let balance = principal
  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    const princ = monthly - interest
    balance = Math.max(0, balance - princ)
    rows.push({ month: m, payment: monthly, principal: princ, interest, balance })
  }
  return rows
}

function runCalculation(
  rules: JurisdictionRules,
  vehiclePrice: number,
  downPayment: number,
  termMonths: number,
  annualRate: number,
  interestType: 'reducing' | 'flat',
  processingFee: number,
  feesCapitalized: boolean,
  isUsed: boolean,
  earlySettleMonth: number,
): CalcResult {
  const warnings: string[] = []

  // Effective limits
  const maxTerm = isUsed ? rules.usedCarMaxTermMonths : rules.maxTermMonths
  const maxLTV  = isUsed ? rules.usedCarMaxLTVPercent  : rules.maxLTVPercent
  if (termMonths > maxTerm) warnings.push(`Term capped at ${maxTerm} months for ${isUsed ? 'used' : 'new'} cars per market practice.`)
  const safeMonths = Math.min(termMonths, maxTerm)

  const minDown = vehiclePrice * (rules.minDownPaymentPercent / 100)
  if (downPayment < minDown) warnings.push(`Down payment below recommended minimum (${rules.minDownPaymentPercent}%). Some lenders may require more.`)

  const maxFinanceable = vehiclePrice * (maxLTV / 100)
  const rawFinanced = vehiclePrice - downPayment
  if (rawFinanced > maxFinanceable) warnings.push(`Financed amount exceeds ${maxLTV}% LTV. Down payment may need to increase.`)

  const upfrontFees    = feesCapitalized ? 0 : processingFee
  const capitFees      = feesCapitalized ? processingFee : 0
  const financedAmount = Math.min(rawFinanced + capitFees, maxFinanceable + capitFees)

  let monthly = 0
  let schedule: AmortRow[] = []
  let flatRateEquivalent: number | null = null

  if (interestType === 'reducing') {
    monthly  = pmtReducing(financedAmount, annualRate, safeMonths)
    schedule = buildSchedule(financedAmount, annualRate, safeMonths, monthly)
  } else {
    // Flat rate: total interest = principal * flatRate/100 * years
    const totalInterest = financedAmount * (annualRate / 100) * (safeMonths / 12)
    monthly = (financedAmount + totalInterest) / safeMonths
    flatRateEquivalent = flatRateToApr(annualRate, safeMonths)
    // Build schedule using the equivalent APR
    const eqMonthly = pmtReducing(financedAmount, flatRateEquivalent, safeMonths)
    schedule = buildSchedule(financedAmount, flatRateEquivalent, safeMonths, eqMonthly)
    warnings.push(`Flat rate ${annualRate}% p.a. is equivalent to ~${flatRateEquivalent.toFixed(2)}% p.a. reducing-balance APR. Shown for comparison.`)
  }

  const totalPaid     = monthly * safeMonths
  const totalInterest = totalPaid - financedAmount
  const totalCost     = totalPaid + upfrontFees + downPayment

  // APR via IRR
  const cashflows = [financedAmount - upfrontFees, ...Array(safeMonths).fill(-monthly)]
  const aprPercent = computeIRR(cashflows)

  // Early settlement
  let earlySettlementAmount = 0
  if (earlySettleMonth > 0 && earlySettleMonth < safeMonths) {
    const rowAfterK = schedule[earlySettleMonth - 1]
    const remainingPrincipal = rowAfterK?.balance ?? 0
    const penalty = rules.earlySettlement.penaltyType === 'percent'
      ? remainingPrincipal * (rules.earlySettlement.penaltyValue / 100)
      : rules.earlySettlement.penaltyType === 'fixed'
      ? rules.earlySettlement.penaltyValue
      : 0
    earlySettlementAmount = remainingPrincipal + penalty
  }

  return {
    financedAmount,
    monthlyPayment: monthly,
    totalInterest,
    totalCost,
    totalUpfrontFees: upfrontFees,
    aprPercent,
    flatRateEquivalent,
    earlySettlementAfter: earlySettleMonth,
    earlySettlementAmount,
    schedule,
    downPayment,
    currency: rules.currency,
    ruleId: rules.id,
    interestType,
    warnings,
  }
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function fmtCur(n: number, currency: string) {
  return `${currency} ${Math.round(n).toLocaleString('en-US')}`
}
function fmtPct(n: number) { return `${n.toFixed(2)}%` }

// ─── Component ────────────────────────────────────────────────────────────────

export default function CarLoanCalculatorUAE({ locale }: Props) {
  const isAr = locale === 'ar'

  // Inputs
  const [country, setCountry]             = useState('uae')
  const [vehiclePrice, setVehiclePrice]   = useState('')
  const [downPayment, setDownPayment]     = useState('')
  const [termMonths, setTermMonths]       = useState('48')
  const [annualRate, setAnnualRate]       = useState('3.99')
  const [interestType, setInterestType]   = useState<'reducing' | 'flat'>('reducing')
  const [processingFee, setProcessingFee] = useState('0')
  const [feesCapitalized, setFeesCap]     = useState(false)
  const [isUsed, setIsUsed]               = useState(false)
  const [earlySettleMonth, setEarlySettle]= useState('0')
  const [showSchedule, setShowSchedule]   = useState(false)
  const [result, setResult]               = useState<CalcResult | null>(null)

  const rules = RULES[country] ?? RULES['uae']

  // Live down-payment %
  const vp = parseFloat(vehiclePrice) || 0
  const dp = parseFloat(downPayment)  || 0
  const dpPct = vp > 0 ? ((dp / vp) * 100).toFixed(1) : '0.0'

  function calculate() {
    const vPrice  = parseFloat(vehiclePrice)  || 0
    const dPay    = parseFloat(downPayment)   || 0
    const term    = parseInt(termMonths)      || 48
    const rate    = parseFloat(annualRate)    || 0
    const pFee    = parseFloat(processingFee) || 0
    const esMonth = parseInt(earlySettleMonth)|| 0

    if (vPrice <= 0) return
    const r = runCalculation(rules, vPrice, dPay, term, rate, interestType, pFee, feesCapitalized, isUsed, esMonth)
    setResult(r)
  }

  function reset() {
    setVehiclePrice(''); setDownPayment(''); setTermMonths('48')
    setAnnualRate('3.99'); setInterestType('reducing')
    setProcessingFee('0'); setFeesCap(false); setIsUsed(false)
    setEarlySettle('0'); setResult(null); setShowSchedule(false)
  }

  const t = isAr ? {
    country: 'الدولة',
    vehiclePrice: 'سعر السيارة',
    downPayment: 'الدفعة الأولى',
    term: 'مدة القرض (أشهر)',
    rate: 'معدل الفائدة السنوي (%)',
    interestType: 'نوع الفائدة',
    reducing: 'متناقصة',
    flat: 'ثابتة',
    procFee: 'رسوم المعالجة',
    capitalize: 'إضافة الرسوم إلى القرض',
    usedCar: 'سيارة مستعملة',
    earlySettle: 'محاكاة السداد المبكر (بعد شهر)',
    calculate: 'احسب',
    reset: 'إعادة تعيين',
    results: 'النتائج',
    monthlyPayment: 'القسط الشهري',
    financed: 'المبلغ الممول',
    totalInterest: 'إجمالي الفائدة',
    totalCost: 'التكلفة الإجمالية',
    apr: 'معدل الفائدة الفعلي (APR)',
    flatEquiv: 'ما يعادله بالمتناقص',
    earlyPayoff: 'مبلغ السداد المبكر',
    showSchedule: 'عرض جدول السداد',
    hideSchedule: 'إخفاء جدول السداد',
    month: 'شهر',
    principal: 'أصل',
    interest: 'فائدة',
    balance: 'رصيد',
    warning: 'تنبيه',
    disclaimer: 'إخلاء مسؤولية',
    marketPractice: 'ممارسة السوق',
    exportNote: 'ملاحظة النقل/التصدير',
    downPct: 'الدفعة الأولى كنسبة',
    typicalRates: 'المعدلات الشائعة في السوق',
    enterAmount: 'أدخل المبلغ',
  } : {
    country: 'Country',
    vehiclePrice: 'Vehicle Price',
    downPayment: 'Down Payment',
    term: 'Loan Term (months)',
    rate: 'Annual Interest Rate (%)',
    interestType: 'Interest Type',
    reducing: 'Reducing Balance',
    flat: 'Flat Rate',
    procFee: 'Processing Fee',
    capitalize: 'Add fees to loan amount',
    usedCar: 'Used / Second-hand Car',
    earlySettle: 'Simulate Early Settlement (after month)',
    calculate: 'Calculate',
    reset: 'Reset',
    results: 'Your Results',
    monthlyPayment: 'Monthly Payment',
    financed: 'Financed Amount',
    totalInterest: 'Total Interest',
    totalCost: 'Total Cost of Finance',
    apr: 'Effective APR',
    flatEquiv: 'Flat → Reducing Equivalent',
    earlyPayoff: 'Early Settlement Amount',
    showSchedule: 'View Amortization Schedule',
    hideSchedule: 'Hide Schedule',
    month: 'Month',
    principal: 'Principal',
    interest: 'Interest',
    balance: 'Balance',
    warning: 'Note',
    disclaimer: 'Disclaimer',
    marketPractice: 'Market Practice',
    exportNote: 'Transfer / Export Notice',
    downPct: 'Down payment is',
    typicalRates: 'Typical market rates',
    enterAmount: 'Enter amount',
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Section 1: Country & Vehicle ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Country */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.country}</label>
          <select
            value={country}
            onChange={e => { setCountry(e.target.value); setResult(null) }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {Object.values(RULES).map(r => (
              <option key={r.id} value={r.id}>{isAr ? r.displayName.ar : r.displayName.en}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {t.typicalRates}: {fmtPct(rules.typicalRateMin)} – {fmtPct(rules.typicalRateMax)} · Min down: {rules.minDownPaymentPercent}% · Max LTV: {rules.maxLTVPercent}%
          </p>
        </div>

        {/* Vehicle Price */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.vehiclePrice}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">{rules.currency}</span>
            <input
              type="number" min="0" value={vehiclePrice}
              onChange={e => setVehiclePrice(e.target.value)}
              placeholder={t.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Down Payment */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.downPayment}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">{rules.currency}</span>
            <input
              type="number" min="0" value={downPayment}
              onChange={e => setDownPayment(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          {vp > 0 && (
            <p className={`mt-1 text-xs font-medium ${parseFloat(dpPct) < rules.minDownPaymentPercent ? 'text-amber-600' : 'text-emerald-600'}`}>
              {t.downPct} {dpPct}% {parseFloat(dpPct) < rules.minDownPaymentPercent ? `(min ${rules.minDownPaymentPercent}% recommended)` : '✓'}
            </p>
          )}
        </div>

        {/* Term */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.term}</label>
          <select
            value={termMonths}
            onChange={e => setTermMonths(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {[12,18,24,30,36,42,48,54,60].filter(m => m >= rules.minTermMonths && m <= rules.maxTermMonths).map(m => (
              <option key={m} value={m}>{m} {isAr ? 'شهرًا' : 'months'} ({(m/12).toFixed(1)} {isAr ? 'سنة' : 'yrs'})</option>
            ))}
          </select>
        </div>

        {/* Rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.rate}</label>
          <input
            type="number" min="0" max="50" step="0.01" value={annualRate}
            onChange={e => setAnnualRate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Interest Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.interestType}</label>
          <div className="flex gap-2">
            {(['reducing', 'flat'] as const).map(it => (
              <button
                key={it}
                onClick={() => setInterestType(it)}
                className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                  interestType === it
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {it === 'reducing' ? t.reducing : t.flat}
              </button>
            ))}
          </div>
        </div>

        {/* Processing Fee */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.procFee}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">{rules.currency}</span>
            <input
              type="number" min="0" value={processingFee}
              onChange={e => setProcessingFee(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Early Settlement */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.earlySettle}</label>
          <input
            type="number" min="0" max="60" value={earlySettleMonth}
            onChange={e => setEarlySettle(e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* ── Toggles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { value: feesCapitalized, set: setFeesCap,  label: t.capitalize },
          { value: isUsed,          set: setIsUsed,   label: t.usedCar    },
        ].map(({ value, set, label }, i) => (
          <button
            key={i}
            onClick={() => set(!value)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left ${
              value
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className={`w-4 h-4 rounded flex items-center justify-center text-xs flex-shrink-0 ${value ? 'bg-emerald-600 text-white' : 'bg-gray-200'}`}>
              {value ? '✓' : ''}
            </span>
            {label}
          </button>
        ))}
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
            <div className="text-sm opacity-80 mb-1">{t.monthlyPayment}</div>
            <div className="text-3xl font-black">{fmtCur(result.monthlyPayment, result.currency)}</div>
            <div className="mt-2 text-sm opacity-70">{t.apr}: {fmtPct(result.aprPercent)}</div>
          </div>

          {/* Metric grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
            {[
              { label: t.financed,      value: fmtCur(result.financedAmount, result.currency)  },
              { label: t.totalInterest, value: fmtCur(result.totalInterest,  result.currency)  },
              { label: t.totalCost,     value: fmtCur(result.totalCost,       result.currency) },
              ...(result.flatRateEquivalent !== null
                ? [{ label: t.flatEquiv, value: fmtPct(result.flatRateEquivalent) }]
                : []),
              ...(result.earlySettlementAfter > 0
                ? [{ label: `${t.earlyPayoff} (${isAr ? 'شهر' : 'mo.'} ${result.earlySettlementAfter})`, value: fmtCur(result.earlySettlementAmount, result.currency) }]
                : []),
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 mb-1">{label}</div>
                <div className="text-base font-bold text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
              <div className="text-sm font-bold text-amber-700">{t.warning}</div>
              {result.warnings.map((w, i) => (
                <div key={i} className="text-sm text-amber-700 flex gap-2"><span>!</span><span>{w}</span></div>
              ))}
            </div>
          )}

          {/* Export / sale note (UAE/Dubai) */}
          {rules.saleExportNote_en && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <div className="text-sm font-bold text-blue-700 mb-1">{t.exportNote}</div>
              <p className="text-sm text-blue-700">{isAr ? rules.saleExportNote_ar : rules.saleExportNote_en}</p>
            </div>
          )}

          {/* Amortization schedule toggle */}
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            <span className={`transition-transform ${showSchedule ? 'rotate-90' : ''}`}>▶</span>
            {showSchedule ? t.hideSchedule : t.showSchedule}
          </button>

          {showSchedule && (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    {[t.month, t.principal, t.interest, 'Payment', t.balance].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((row, i) => (
                    <tr key={row.month} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-1.5 text-gray-700">{row.month}</td>
                      <td className="px-3 py-1.5 text-gray-700">{Math.round(row.principal).toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-gray-700">{Math.round(row.interest).toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-gray-700">{Math.round(row.payment).toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-gray-700">{Math.round(row.balance).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Market practice note */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <div className="text-xs font-bold text-gray-500">{t.marketPractice}</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {isAr ? rules.marketPracticeNote_ar : rules.marketPracticeNote_en}
            </p>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 leading-relaxed">
            {isAr ? rules.requiredDisclosure_ar : rules.requiredDisclosure_en}
          </p>
        </div>
      )}
    </div>
  )
}
