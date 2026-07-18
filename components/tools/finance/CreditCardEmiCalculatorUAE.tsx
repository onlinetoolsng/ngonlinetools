'use client'

import { useState, useCallback } from 'react'

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type Locale = 'en' | 'ar'
type Mode = 'generic' | 'installment'
type Scenario = 'purchase' | 'balance' | 'cash'
type RateUnit = 'monthly' | 'annual' | 'profit'
type MinPayType = 'pct_principal' | 'pct_statement' | 'bank_formula'
type FeeType = 'nil' | 'one_time' | 'monthly'

interface Inputs {
  amount: string
  tenor: string
  rate: string
  rateUnit: RateUnit
  feeType: FeeType
  feeValue: string
  minPayType: MinPayType
  minPayPct: string
  minPayFloor: string
  dailyInterest: boolean
  mode: Mode
  scenario: Scenario
  unknownRate: boolean
}

interface Results {
  monthlyPayment: number
  totalRepayment: number
  totalFinanceCost: number
  totalFees: number
  payoffMonths: number
  minPayMonthly: number
  minPayTotalMonths: number
  minPayTotalCost: number
  amortization: { month: number; principal: number; interest: number; balance: number; fee: number }[]
  rateMonthly: number
  rateAnnual: number
  conversionNote: string
}

/* ─────────────────────────────────────────────
   i18n
───────────────────────────────────────────── */
const T = {
  en: {
    title: 'Credit Card EMI Calculator',
    subtitle: 'UAE — Estimate your card installment or repayment cost',
    modeLabel: 'Calculator Mode',
    modeGeneric: 'Generic Balance Conversion',
    modeInstallment: 'Issuer-Specific Installment Plan',
    scenarioLabel: 'Scenario',
    scenarioPurchase: 'Purchase Installment',
    scenarioBalance: 'Balance Conversion',
    scenarioCash: 'Cash Advance',
    amountLabel: 'Card Balance / Amount (AED)',
    tenorLabel: 'Tenor (Months)',
    rateLabel: 'Finance Charge Rate',
    rateUnitLabel: 'Rate Type',
    rateUnitMonthly: 'Monthly Rate (%)',
    rateUnitAnnual: 'Annual Rate / APR (%)',
    rateUnitProfit: 'Plan Profit Rate (%/mo)',
    unknownRateLabel: "I don't know my rate",
    unknownRateNote: 'Results will be estimates only. Please check your issuer\'s Key Facts Statement (KFS).',
    feeTypeLabel: 'Processing Fee Structure',
    feeNil: 'No Processing Fee',
    feeOneTime: 'One-Time Fee',
    feeMonthly: 'Monthly Fee',
    feeValueLabel: 'Fee Amount (AED or %)',
    minPayTypeLabel: 'Minimum Payment Method',
    minPayPctPrincipal: '% of Principal',
    minPayPctStatement: '% of Statement Balance',
    minPayBankFormula: 'Bank-Specific Formula',
    minPayPctLabel: 'Minimum Payment %',
    minPayFloorLabel: 'Minimum Floor Amount (AED)',
    dailyInterestLabel: 'Issuer calculates interest daily',
    calculate: 'Calculate',
    reset: 'Reset',
    results: 'Results',
    monthlyPayment: 'Monthly Installment',
    totalRepayment: 'Total Repayment',
    totalFinanceCost: 'Total Finance Cost',
    totalFees: 'Total Fees',
    payoffMonths: 'Payoff Period',
    months: 'months',
    minPathTitle: 'Minimum Payment Path',
    minPayMonthly: 'Minimum Due (Month 1)',
    minPayTotalMonths: 'Months to Pay Off',
    minPayTotalCost: 'Total Cost (Min. Pay)',
    amortLabel: 'Amortization Schedule',
    colMonth: 'Month',
    colPrincipal: 'Principal',
    colInterest: 'Interest',
    colFee: 'Fee',
    colBalance: 'Balance',
    disclosure: '⚠ Disclosure',
    disclosureText: 'This calculator is based on user-entered terms and published card conditions. It is not a bank quote, approval, or promise. Always verify against your issuer\'s Key Facts Statement (KFS) and card statement. UAE Consumer Protection regulations require full disclosure of all card terms.',
    issuerTerms: 'Issuer Terms Applied',
    rateConversion: 'Rate Conversion',
    cashAdvanceNote: '⚠ Cash advance finance charges differ from retail transaction rates. UAE issuers typically apply a higher rate and an immediate cash advance fee. Verify with your issuer.',
    insufficientData: 'Insufficient data to compute. Please fill all required fields.',
    errorAmount: 'Amount must be a positive number.',
    errorTenor: 'Tenor must be a whole number ≥ 1.',
    errorRate: 'Finance rate must be a non-negative number.',
    errorFee: 'Fee value must be a non-negative number.',
    errorMinPct: 'Minimum payment % must be between 0 and 100.',
    estimateLabel: '(Estimate — verify with issuer KFS)',
    aed: 'AED',
  },
  ar: {
    title: 'حاسبة أقساط بطاقة الائتمان',
    subtitle: 'الإمارات — احسب تكلفة أقساط بطاقتك أو سداد الرصيد',
    modeLabel: 'وضع الحاسبة',
    modeGeneric: 'تحويل رصيد عام',
    modeInstallment: 'خطة تقسيط محددة من الجهة المصدرة',
    scenarioLabel: 'نوع المعاملة',
    scenarioPurchase: 'تقسيط مشتريات',
    scenarioBalance: 'تحويل رصيد',
    scenarioCash: 'سلفة نقدية',
    amountLabel: 'رصيد البطاقة / المبلغ (درهم)',
    tenorLabel: 'مدة السداد (أشهر)',
    rateLabel: 'معدل الرسوم المالية',
    rateUnitLabel: 'نوع المعدل',
    rateUnitMonthly: 'معدل شهري (%)',
    rateUnitAnnual: 'معدل سنوي / APR (%)',
    rateUnitProfit: 'معدل ربح الخطة (%/شهر)',
    unknownRateLabel: 'لا أعرف معدلي',
    unknownRateNote: 'ستكون النتائج تقديرية فقط. يرجى مراجعة وثيقة الحقائق الأساسية (KFS) من جهتك المصدرة.',
    feeTypeLabel: 'هيكل رسوم المعالجة',
    feeNil: 'بدون رسوم معالجة',
    feeOneTime: 'رسوم لمرة واحدة',
    feeMonthly: 'رسوم شهرية',
    feeValueLabel: 'قيمة الرسوم (درهم أو %)',
    minPayTypeLabel: 'طريقة الحد الأدنى للسداد',
    minPayPctPrincipal: '% من الرصيد الأصلي',
    minPayPctStatement: '% من رصيد الكشف',
    minPayBankFormula: 'صيغة البنك المحددة',
    minPayPctLabel: 'نسبة الحد الأدنى %',
    minPayFloorLabel: 'الحد الأدنى للمبلغ (درهم)',
    dailyInterestLabel: 'الجهة المصدرة تحسب الفائدة يومياً',
    calculate: 'احسب',
    reset: 'إعادة تعيين',
    results: 'النتائج',
    monthlyPayment: 'القسط الشهري',
    totalRepayment: 'إجمالي السداد',
    totalFinanceCost: 'إجمالي الرسوم المالية',
    totalFees: 'إجمالي الرسوم',
    payoffMonths: 'مدة السداد',
    months: 'شهر',
    minPathTitle: 'مسار الحد الأدنى للسداد',
    minPayMonthly: 'الحد الأدنى المستحق (الشهر 1)',
    minPayTotalMonths: 'أشهر حتى السداد الكامل',
    minPayTotalCost: 'التكلفة الإجمالية (الحد الأدنى)',
    amortLabel: 'جدول الإطفاء',
    colMonth: 'الشهر',
    colPrincipal: 'الأصل',
    colInterest: 'الفائدة',
    colFee: 'الرسوم',
    colBalance: 'الرصيد',
    disclosure: '⚠ إفصاح',
    disclosureText: 'تعتمد هذه الحاسبة على البيانات التي أدخلتها وشروط البطاقة المنشورة. وهي ليست عرضاً أو موافقة من البنك. يرجى التحقق دائماً من وثيقة الحقائق الأساسية (KFS) وكشف حسابك.',
    issuerTerms: 'شروط الجهة المصدرة المطبقة',
    rateConversion: 'تحويل المعدل',
    cashAdvanceNote: '⚠ تختلف رسوم السلفة النقدية عن رسوم المعاملات الاعتيادية. يُرجى التحقق من الجهة المصدرة.',
    insufficientData: 'بيانات غير كافية. يرجى ملء جميع الحقول المطلوبة.',
    errorAmount: 'يجب أن يكون المبلغ رقماً موجباً.',
    errorTenor: 'يجب أن تكون المدة عدداً صحيحاً ≥ 1.',
    errorRate: 'يجب أن يكون معدل الرسوم رقماً غير سالب.',
    errorFee: 'يجب أن تكون قيمة الرسوم رقماً غير سالب.',
    errorMinPct: 'نسبة الحد الأدنى يجب أن تكون بين 0 و 100.',
    estimateLabel: '(تقديري — تحقق من وثيقة KFS)',
    aed: 'درهم',
  },
}

/* ─────────────────────────────────────────────
   Calculation engines
───────────────────────────────────────────── */
function toMonthlyRate(rate: number, unit: RateUnit): { monthly: number; annual: number; note: string } {
  if (unit === 'monthly' || unit === 'profit') {
    return { monthly: rate / 100, annual: rate * 12, note: `${rate}%/mo → APR ${(rate * 12).toFixed(2)}%` }
  }
  // annual / APR
  const monthly = rate / 12
  return { monthly: monthly / 100, annual: rate, note: `APR ${rate}% → ${monthly.toFixed(4)}%/mo` }
}

function calcInstallmentEMI(principal: number, monthlyRate: number, n: number, feeType: FeeType, feeValue: number, dailyInterest: boolean) {
  // If daily interest: use daily compounding rate
  const r = dailyInterest ? Math.pow(1 + monthlyRate, 1 / 30) ** 30 - 1 : monthlyRate

  let emi: number
  if (r === 0) {
    emi = principal / n
  } else {
    emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  }

  let totalFees = 0
  let monthlyFee = 0
  if (feeType === 'one_time') totalFees = feeValue
  if (feeType === 'monthly') { monthlyFee = feeValue; totalFees = feeValue * n }

  const totalRepay = emi * n + totalFees
  const totalFinanceCost = totalRepay - principal - totalFees

  // Amortization
  const schedule: Results['amortization'] = []
  let bal = principal
  for (let m = 1; m <= n; m++) {
    const interest = bal * r
    const principal_paid = emi - interest
    bal = Math.max(0, bal - principal_paid)
    schedule.push({ month: m, principal: principal_paid, interest, balance: bal, fee: m === 1 && feeType === 'one_time' ? feeValue : monthlyFee })
  }

  return { emi, totalRepay, totalFinanceCost, totalFees, schedule }
}

function calcMinPayPath(balance: number, monthlyRate: number, minPct: number, minFloor: number) {
  let bal = balance
  let totalCost = 0
  let months = 0
  const MAX = 600
  let minMonthly = 0
  let firstMin = 0

  while (bal > 0.01 && months < MAX) {
    const interest = bal * monthlyRate
    const minDue = Math.max(bal * (minPct / 100), minFloor, interest + 0.01)
    const payment = Math.min(minDue, bal + interest)
    if (months === 0) { firstMin = payment; minMonthly = payment }
    bal = bal + interest - payment
    totalCost += payment
    months++
  }

  return { minMonthly: firstMin, totalMonths: months, totalCost }
}

/* ─────────────────────────────────────────────
   Validation
───────────────────────────────────────────── */
function validate(inputs: Inputs, t: typeof T['en']): string[] {
  const errs: string[] = []
  const amount = parseFloat(inputs.amount)
  const tenor = parseInt(inputs.tenor)
  const rate = parseFloat(inputs.rate)
  const fee = parseFloat(inputs.feeValue || '0')
  const minPct = parseFloat(inputs.minPayPct || '0')

  if (isNaN(amount) || amount <= 0) errs.push(t.errorAmount)
  if (isNaN(tenor) || tenor < 1 || !Number.isInteger(tenor)) errs.push(t.errorTenor)
  if (!inputs.unknownRate && (isNaN(rate) || rate < 0)) errs.push(t.errorRate)
  if (inputs.feeType !== 'nil' && (isNaN(fee) || fee < 0)) errs.push(t.errorFee)
  if (isNaN(minPct) || minPct < 0 || minPct > 100) errs.push(t.errorMinPct)
  return errs
}

/* ─────────────────────────────────────────────
   Default inputs
───────────────────────────────────────────── */
const DEFAULT: Inputs = {
  amount: '',
  tenor: '12',
  rate: '',
  rateUnit: 'monthly',
  feeType: 'nil',
  feeValue: '0',
  minPayType: 'pct_statement',
  minPayPct: '5',
  minPayFloor: '100',
  dailyInterest: false,
  mode: 'generic',
  scenario: 'purchase',
  unknownRate: false,
}

/* ─────────────────────────────────────────────
   Formatting
───────────────────────────────────────────── */
const fmt = (n: number) => n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
export default function CreditCardEmiCalculatorUAE({ locale = 'en' }: { locale?: string }) {
  const lang = (locale === 'ar' ? 'ar' : 'en') as Locale
  const t = T[lang]
  const isRtl = lang === 'ar'

  const [inputs, setInputs] = useState<Inputs>(DEFAULT)
  const [results, setResults] = useState<Results | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [showAmort, setShowAmort] = useState(false)

  const set = useCallback(<K extends keyof Inputs>(key: K, val: Inputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: val }))
    setResults(null)
  }, [])

  const handleCalculate = () => {
    const errs = validate(inputs, t)
    setErrors(errs)
    if (errs.length > 0) return

    const amount = parseFloat(inputs.amount)
    const tenor = parseInt(inputs.tenor)
    const rateRaw = inputs.unknownRate ? 1.5 : parseFloat(inputs.rate) // default 1.5%/mo if unknown
    const feeValue = parseFloat(inputs.feeValue || '0')
    const minPct = parseFloat(inputs.minPayPct || '5')
    const minFloor = parseFloat(inputs.minPayFloor || '100')

    const { monthly, annual, note } = toMonthlyRate(rateRaw, inputs.rateUnit)

    const { emi, totalRepay, totalFinanceCost, totalFees, schedule } = calcInstallmentEMI(
      amount, monthly, tenor, inputs.feeType, feeValue, inputs.dailyInterest
    )

    const { minMonthly, totalMonths, totalCost: minTotalCost } = calcMinPayPath(amount, monthly, minPct, minFloor)

    setResults({
      monthlyPayment: emi,
      totalRepayment: totalRepay,
      totalFinanceCost,
      totalFees,
      payoffMonths: tenor,
      minPayMonthly: minMonthly,
      minPayTotalMonths: totalMonths,
      minPayTotalCost: minTotalCost,
      amortization: schedule,
      rateMonthly: monthly * 100,
      rateAnnual: annual,
      conversionNote: note,
    })
    setShowAmort(false)
  }

  const handleReset = () => {
    setInputs(DEFAULT)
    setResults(null)
    setErrors([])
    setShowAmort(false)
  }

  /* ── render ── */
  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ fontFamily: "'DM Sans', 'Tajawal', sans-serif", maxWidth: 820, margin: '0 auto', padding: '0 1rem 3rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap');
        .emi-card { background:#fff; border-radius:16px; border:1.5px solid #e5e9f0; padding:1.5rem; margin-bottom:1.25rem; box-shadow:0 2px 8px rgba(0,30,80,.04); }
        .emi-label { font-size:.78rem; font-weight:600; color:#64748b; letter-spacing:.04em; text-transform:uppercase; margin-bottom:.35rem; display:block; }
        .emi-input { width:100%; padding:.65rem .9rem; border:1.5px solid #dde2eb; border-radius:10px; font-size:.97rem; background:#fafbfc; color:#1e293b; outline:none; transition:border .15s; box-sizing:border-box; }
        .emi-input:focus { border-color:#2563eb; background:#fff; }
        .emi-select { width:100%; padding:.65rem .9rem; border:1.5px solid #dde2eb; border-radius:10px; font-size:.97rem; background:#fafbfc; color:#1e293b; outline:none; appearance:none; cursor:pointer; }
        .emi-select:focus { border-color:#2563eb; }
        .emi-btn { padding:.75rem 2rem; border-radius:12px; font-size:.97rem; font-weight:700; cursor:pointer; border:none; transition:all .15s; }
        .emi-btn-primary { background:#1d4ed8; color:#fff; }
        .emi-btn-primary:hover { background:#1e40af; transform:translateY(-1px); }
        .emi-btn-secondary { background:#f1f5f9; color:#475569; margin-inline-start:1rem; }
        .emi-btn-secondary:hover { background:#e2e8f0; }
        .emi-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        @media(max-width:540px){ .emi-grid2 { grid-template-columns:1fr; } }
        .emi-toggle { display:flex; align-items:center; gap:.6rem; cursor:pointer; user-select:none; }
        .emi-toggle input[type=checkbox] { width:18px; height:18px; cursor:pointer; accent-color:#2563eb; }
        .result-stat { background:#f8faff; border:1.5px solid #dbeafe; border-radius:12px; padding:1rem 1.25rem; }
        .result-stat .stat-label { font-size:.75rem; font-weight:600; color:#3b82f6; text-transform:uppercase; letter-spacing:.05em; }
        .result-stat .stat-value { font-size:1.55rem; font-weight:700; color:#1e293b; margin-top:.15rem; }
        .result-stat .stat-sub { font-size:.75rem; color:#64748b; margin-top:.1rem; }
        .disclosure-box { background:#fffbeb; border:1.5px solid #fde68a; border-radius:12px; padding:1rem 1.25rem; font-size:.83rem; color:#78350f; line-height:1.6; }
        .cash-note { background:#fef2f2; border:1.5px solid #fecaca; border-radius:10px; padding:.75rem 1rem; font-size:.83rem; color:#991b1b; margin-bottom:1rem; }
        .estimate-badge { display:inline-block; font-size:.72rem; background:#dbeafe; color:#1d4ed8; border-radius:20px; padding:.15rem .6rem; margin-inline-start:.4rem; vertical-align:middle; font-weight:600; }
        .amort-table { width:100%; border-collapse:collapse; font-size:.82rem; }
        .amort-table th { background:#f1f5f9; color:#475569; padding:.5rem .75rem; text-align:start; font-weight:600; border-bottom:2px solid #e2e8f0; }
        .amort-table td { padding:.45rem .75rem; border-bottom:1px solid #f1f5f9; color:#334155; }
        .amort-table tr:hover td { background:#f8faff; }
        .tab-btn { padding:.45rem 1.1rem; border-radius:8px; font-size:.85rem; font-weight:600; cursor:pointer; border:1.5px solid #e2e8f0; background:#fff; color:#475569; transition:all .12s; }
        .tab-btn.active { background:#1d4ed8; color:#fff; border-color:#1d4ed8; }
        .section-title { font-size:1rem; font-weight:700; color:#1e293b; margin-bottom:1rem; }
        .min-path-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.75rem; }
        @media(max-width:540px){ .min-path-grid { grid-template-columns:1fr; } }
        .error-list { background:#fef2f2; border:1.5px solid #fecaca; border-radius:10px; padding:.75rem 1rem; margin-bottom:1rem; }
        .error-list li { font-size:.85rem; color:#b91c1c; margin:.2rem 0; list-style:disc; margin-inline-start:1.2rem; }
        .unknown-note { background:#fefce8; border:1px solid #fde68a; border-radius:8px; padding:.55rem .9rem; font-size:.8rem; color:#92400e; margin-top:.4rem; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem', paddingTop: '1rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{t.title}</h1>
        <p style={{ fontSize: '.93rem', color: '#64748b', marginTop: '.35rem' }}>{t.subtitle}</p>
      </div>

      {/* Cash advance note */}
      {inputs.scenario === 'cash' && <div className="cash-note">{t.cashAdvanceNote}</div>}

      {/* Mode + Scenario */}
      <div className="emi-card">
        <div className="emi-grid2">
          <div>
            <label className="emi-label">{t.modeLabel}</label>
            <select className="emi-select" value={inputs.mode} onChange={e => set('mode', e.target.value as Mode)}>
              <option value="generic">{t.modeGeneric}</option>
              <option value="installment">{t.modeInstallment}</option>
            </select>
          </div>
          <div>
            <label className="emi-label">{t.scenarioLabel}</label>
            <select className="emi-select" value={inputs.scenario} onChange={e => set('scenario', e.target.value as Scenario)}>
              <option value="purchase">{t.scenarioPurchase}</option>
              <option value="balance">{t.scenarioBalance}</option>
              <option value="cash">{t.scenarioCash}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Amount + Tenor */}
      <div className="emi-card">
        <div className="emi-grid2">
          <div>
            <label className="emi-label">{t.amountLabel}</label>
            <input className="emi-input" type="number" min="1" placeholder="e.g. 10000" value={inputs.amount} onChange={e => set('amount', e.target.value)} />
          </div>
          <div>
            <label className="emi-label">{t.tenorLabel}</label>
            <input className="emi-input" type="number" min="1" max="84" placeholder="e.g. 12" value={inputs.tenor} onChange={e => set('tenor', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Finance Rate */}
      <div className="emi-card">
        <div className="emi-grid2">
          <div>
            <label className="emi-label">{t.rateLabel}</label>
            <input className="emi-input" type="number" min="0" step="0.01" placeholder={inputs.rateUnit === 'annual' ? 'e.g. 36' : 'e.g. 3'} value={inputs.unknownRate ? '' : inputs.rate} disabled={inputs.unknownRate} onChange={e => set('rate', e.target.value)} />
          </div>
          <div>
            <label className="emi-label">{t.rateUnitLabel}</label>
            <select className="emi-select" value={inputs.rateUnit} onChange={e => set('rateUnit', e.target.value as RateUnit)} disabled={inputs.unknownRate}>
              <option value="monthly">{t.rateUnitMonthly}</option>
              <option value="annual">{t.rateUnitAnnual}</option>
              <option value="profit">{t.rateUnitProfit}</option>
            </select>
          </div>
        </div>
        <label className="emi-toggle" style={{ marginTop: '.85rem' }}>
          <input type="checkbox" checked={inputs.unknownRate} onChange={e => set('unknownRate', e.target.checked)} />
          <span style={{ fontSize: '.88rem', color: '#475569', fontWeight: 500 }}>{t.unknownRateLabel}</span>
        </label>
        {inputs.unknownRate && <div className="unknown-note">{t.unknownRateNote}</div>}
      </div>

      {/* Fees */}
      <div className="emi-card">
        <div className="emi-grid2">
          <div>
            <label className="emi-label">{t.feeTypeLabel}</label>
            <select className="emi-select" value={inputs.feeType} onChange={e => set('feeType', e.target.value as FeeType)}>
              <option value="nil">{t.feeNil}</option>
              <option value="one_time">{t.feeOneTime}</option>
              <option value="monthly">{t.feeMonthly}</option>
            </select>
          </div>
          {inputs.feeType !== 'nil' && (
            <div>
              <label className="emi-label">{t.feeValueLabel}</label>
              <input className="emi-input" type="number" min="0" step="0.01" placeholder="0" value={inputs.feeValue} onChange={e => set('feeValue', e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Minimum Payment */}
      <div className="emi-card">
        <div className="emi-grid2">
          <div>
            <label className="emi-label">{t.minPayTypeLabel}</label>
            <select className="emi-select" value={inputs.minPayType} onChange={e => set('minPayType', e.target.value as MinPayType)}>
              <option value="pct_principal">{t.minPayPctPrincipal}</option>
              <option value="pct_statement">{t.minPayPctStatement}</option>
              <option value="bank_formula">{t.minPayBankFormula}</option>
            </select>
          </div>
          <div>
            <label className="emi-label">{t.minPayPctLabel}</label>
            <input className="emi-input" type="number" min="1" max="100" step="0.1" placeholder="5" value={inputs.minPayPct} onChange={e => set('minPayPct', e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label className="emi-label">{t.minPayFloorLabel}</label>
          <input className="emi-input" type="number" min="0" placeholder="100" value={inputs.minPayFloor} onChange={e => set('minPayFloor', e.target.value)} style={{ maxWidth: 220 }} />
        </div>
      </div>

      {/* Daily Interest Toggle */}
      <div className="emi-card">
        <label className="emi-toggle">
          <input type="checkbox" checked={inputs.dailyInterest} onChange={e => set('dailyInterest', e.target.checked)} />
          <span style={{ fontSize: '.92rem', color: '#334155', fontWeight: 500 }}>{t.dailyInterestLabel}</span>
        </label>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="error-list">
          <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.75rem' }}>
        <button className="emi-btn emi-btn-primary" onClick={handleCalculate}>{t.calculate}</button>
        <button className="emi-btn emi-btn-secondary" onClick={handleReset}>{t.reset}</button>
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Disclosure */}
          <div className="disclosure-box" style={{ marginBottom: '1.25rem' }}>
            <strong>{t.disclosure}:</strong> {t.disclosureText}
            {inputs.unknownRate && <><br /><em>{t.estimateLabel}</em></>}
          </div>

          {/* Rate conversion note */}
          <div style={{ fontSize: '.78rem', color: '#64748b', marginBottom: '1rem', background: '#f8faff', borderRadius: 8, padding: '.5rem .85rem', border: '1px solid #e0e9ff' }}>
            <strong>{t.rateConversion}:</strong> {results.conversionNote}
            {inputs.mode === 'installment' && <span style={{ marginInlineStart: '.5rem', color: '#1d4ed8', fontWeight: 600 }}>· {t.issuerTerms}: {
              inputs.feeType === 'nil' ? t.feeNil :
              inputs.feeType === 'one_time' ? t.feeOneTime : t.feeMonthly
            }</span>}
          </div>

          {/* Main stats */}
          <div className="emi-card">
            <div className="section-title">{t.results}</div>
            <div className="emi-grid2" style={{ marginBottom: '1rem' }}>
              <div className="result-stat">
                <div className="stat-label">{t.monthlyPayment}</div>
                <div className="stat-value">AED {fmt(results.monthlyPayment)}</div>
                <div className="stat-sub">{t.payoffMonths}: {results.payoffMonths} {t.months}</div>
              </div>
              <div className="result-stat">
                <div className="stat-label">{t.totalRepayment}</div>
                <div className="stat-value">AED {fmt(results.totalRepayment)}</div>
                <div className="stat-sub">{t.totalFinanceCost}: AED {fmt(results.totalFinanceCost)}</div>
              </div>
            </div>
            <div className="emi-grid2">
              <div className="result-stat">
                <div className="stat-label">{t.totalFinanceCost}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem', color: '#dc2626' }}>AED {fmt(results.totalFinanceCost)}</div>
              </div>
              <div className="result-stat">
                <div className="stat-label">{t.totalFees}</div>
                <div className="stat-value" style={{ fontSize: '1.2rem', color: results.totalFees === 0 ? '#16a34a' : '#ea580c' }}>
                  AED {fmt(results.totalFees)}
                  {results.totalFees === 0 && <span style={{ fontSize: '.8rem', color: '#16a34a', marginInlineStart: '.4rem' }}>✓ Zero</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Minimum payment path */}
          <div className="emi-card">
            <div className="section-title">{t.minPathTitle}</div>
            <div className="min-path-grid">
              <div className="result-stat">
                <div className="stat-label">{t.minPayMonthly}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem' }}>AED {fmt(results.minPayMonthly)}</div>
              </div>
              <div className="result-stat">
                <div className="stat-label">{t.minPayTotalMonths}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem', color: results.minPayTotalMonths > 60 ? '#dc2626' : '#1e293b' }}>
                  {results.minPayTotalMonths} {t.months}
                  {results.minPayTotalMonths >= 600 && ' (600+)'}
                </div>
              </div>
              <div className="result-stat">
                <div className="stat-label">{t.minPayTotalCost}</div>
                <div className="stat-value" style={{ fontSize: '1.1rem', color: '#dc2626' }}>AED {fmt(results.minPayTotalCost)}</div>
              </div>
            </div>
          </div>

          {/* Amortization */}
          <div className="emi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div className="section-title" style={{ margin: 0 }}>{t.amortLabel}</div>
              <button className={`tab-btn ${showAmort ? 'active' : ''}`} onClick={() => setShowAmort(p => !p)}>
                {showAmort ? '▲ Hide' : '▼ Show'}
              </button>
            </div>
            {showAmort && (
              <div style={{ overflowX: 'auto' }}>
                <table className="amort-table">
                  <thead>
                    <tr>
                      <th>{t.colMonth}</th>
                      <th>{t.colPrincipal}</th>
                      <th>{t.colInterest}</th>
                      <th>{t.colFee}</th>
                      <th>{t.colBalance}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.amortization.map(row => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td>{fmt(row.principal)}</td>
                        <td>{fmt(row.interest)}</td>
                        <td>{fmt(row.fee)}</td>
                        <td>{fmt(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── SEO Article (700+ words) ── */}
      <article style={{ marginTop: '2.5rem', color: '#334155', lineHeight: 1.8, fontSize: '.95rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: '.75rem' }}>
          Credit Card EMI Calculator UAE — Everything You Need to Know
        </h2>
        <p>
          If you carry a balance on a UAE credit card, understanding your monthly repayment and the true cost of financing is
          essential for healthy financial planning. This <strong>credit card EMI calculator UAE</strong> gives you a transparent
          breakdown of monthly installments, total finance charges, and the difference between a fixed repayment plan and paying
          only the minimum each month.
        </p>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginTop: '1.5rem' }}>
          What Is a Credit Card Installment Plan in the UAE?
        </h3>
        <p>
          UAE banks offer what are commonly called Easy Payment Plans (EPP) or balance-conversion installment schemes. When you
          convert a purchase or outstanding balance into an installment plan, the bank fixes a repayment tenor — typically 3 to 48
          months — and charges a monthly profit rate or a one-time processing fee. This <strong>credit card installment
          calculator</strong> supports all three UAE fee structures: zero-fee plans, one-time processing fees, and monthly profit
          rate plans, so you get an accurate picture regardless of which product your bank offers.
        </p>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginTop: '1.5rem' }}>
          How Is the Monthly Card Repayment Calculated?
        </h3>
        <p>
          The standard formula for a <strong>monthly card repayment</strong> uses the reducing-balance method. The bank applies
          the monthly finance charge to your outstanding principal, and each payment reduces both the interest due and the
          principal. The formula is:
        </p>
        <p style={{ background: '#f1f5f9', borderRadius: 8, padding: '.75rem 1rem', fontFamily: 'monospace', fontSize: '.88rem', color: '#1e293b' }}>
          EMI = P × r × (1 + r)ⁿ ÷ [(1 + r)ⁿ − 1]
        </p>
        <p>
          Where P is the principal, r is the monthly rate, and n is the number of months. Some UAE issuers calculate interest
          daily — compounding the daily equivalent rate each day — which produces a slightly different amortization schedule.
          Enable the <em>daily interest</em> toggle in this tool to reflect that method.
        </p>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginTop: '1.5rem' }}>
          Balance Conversion EMI vs. Revolving Balance
        </h3>
        <p>
          A <strong>balance conversion EMI</strong> locks your balance into a fixed repayment plan, giving you predictable
          monthly payments and often a lower effective rate than the standard retail finance charge. By contrast, if you keep the
          balance revolving and pay only the minimum, the high monthly <strong>card finance charges UAE</strong> banks apply —
          often 2.99–3.5% per month — mean it can take years to clear even a modest balance. This calculator's minimum-payment
          engine shows you exactly how long that path takes and how much extra you would pay compared with a structured EMI.
        </p>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginTop: '1.5rem' }}>
          Understanding the Minimum Payment Calculator
        </h3>
        <p>
          UAE issuers disclose minimum payment rules in their Key Facts Statements (KFS). A common formula is 5% of the
          statement balance or AED 100, whichever is higher, plus any overdue amounts. The <strong>minimum payment
          calculator</strong> in this tool lets you choose your bank's exact method — percentage of principal, percentage of
          statement balance, or a bank-specific formula — so the comparison is accurate, not generic. If you are unsure, the
          5% statement balance with an AED 100 floor is the most widely used rule in the UAE market.
        </p>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginTop: '1.5rem' }}>
          Credit Card Loan Calculator UAE — Scenarios Covered
        </h3>
        <p>
          This <strong>credit card loan calculator UAE</strong> covers three distinct scenarios because UAE card products treat
          them differently in their fee schedules:
        </p>
        <ul style={{ paddingInlineStart: '1.5rem' }}>
          <li><strong>Purchase Installment:</strong> Converting a recent retail transaction into fixed monthly payments.</li>
          <li><strong>Balance Conversion:</strong> Moving an existing revolving balance into a structured repayment plan, often at a promotional rate.</li>
          <li><strong>Cash Advance:</strong> Using the card for a cash withdrawal, which typically attracts a higher finance charge and an immediate cash advance fee under UAE card terms.</li>
        </ul>
        <p>
          Selecting the correct scenario routes you to the right calculation path and surfaces the relevant fee disclosures, so
          you are not comparing apples with oranges when evaluating bank offers.
        </p>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginTop: '1.5rem' }}>
          UAE Central Bank Consumer Protection and Card Disclosures
        </h3>
        <p>
          The UAE Central Bank's Consumer Protection Regulation and Standards require banks to publish a Key Facts Statement
          (KFS) for every credit card product. The KFS must disclose the finance charge rate, the minimum payment formula, all
          applicable fees (processing, annual, late payment, over-limit, foreign transaction), and the method used to calculate
          interest — whether daily or monthly. This tool mirrors that structure: every numeric output is labelled with the same
          line items your issuer must disclose, making it easy to cross-check the calculator's result against your actual card
          statement or KFS document.
        </p>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginTop: '1.5rem' }}>
          How to Use This Credit Card EMI Calculator
        </h3>
        <ol style={{ paddingInlineStart: '1.5rem' }}>
          <li>Select the mode: Generic Balance Conversion for an estimate, or Issuer-Specific Installment Plan if you have your bank's published plan terms.</li>
          <li>Choose your scenario: purchase installment, balance conversion, or cash advance.</li>
          <li>Enter the amount and tenor in months.</li>
          <li>Enter your card's finance charge and select whether it is quoted as a monthly rate, annual rate (APR), or plan profit rate. If you do not know the rate, tick the box and the tool will use a typical UAE market rate as a placeholder and mark the result as an estimate.</li>
          <li>Select the fee structure: nil, one-time fee, or monthly fee.</li>
          <li>Configure the minimum payment method to match your issuer's formula.</li>
          <li>Enable daily interest if your issuer calculates finance charges daily.</li>
          <li>Click Calculate to see the full breakdown, including the amortization schedule and the minimum-payment comparison.</li>
        </ol>

        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginTop: '1.5rem' }}>
          Frequently Asked Questions
        </h3>
        <p>
          <strong>Is this calculator specific to a particular UAE bank?</strong> No. The tool accepts the terms from any UAE card
          issuer's KFS. Enter your bank's published rate and fee structure for a card-specific result.
        </p>
        <p>
          <strong>What is the typical finance charge on UAE credit cards?</strong> Most UAE retail credit cards charge between
          2.75% and 3.75% per month on the outstanding balance, equivalent to an APR of roughly 33–45%. Promotional installment
          plans often offer lower rates or zero processing fees for a limited period.
        </p>
        <p>
          <strong>Does VAT apply to credit card fees in the UAE?</strong> UAE VAT at 5% applies to financial services fees
          such as annual fees, late payment fees, and processing fees. Finance charges (interest) are generally outside the
          scope of UAE VAT. Always check your card statement for VAT-inclusive and VAT-exclusive line items.
        </p>
        <p style={{ marginTop: '1.5rem', fontSize: '.83rem', color: '#94a3b8' }}>
          This calculator is provided for informational purposes only. It is not financial advice and does not constitute an
          offer, quote, or approval from any bank or financial institution. Always verify your repayment plan and all associated
          charges against your card issuer's Key Facts Statement and official card terms and conditions.
        </p>
      </article>
    </div>
  )
}
