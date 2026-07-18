'use client'

import { useState } from 'react'

type Props = { locale: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const DBR_CAP = 0.50          // UAE Central Bank hard cap: 50 % of income
const DBR_CAP_PENSIONER = 0.30 // 30 % for pensioners
const DEFAULT_RATE = 0.0599   // ~6 % p.a. – indicative UAE personal-loan rate
const MAX_TENOR_MONTHS = 48   // UAE banks typically cap personal loans at 4 yrs for top-ups

// ─── Types ────────────────────────────────────────────────────────────────────

type EligibilityStatus = 'eligible' | 'conditional' | 'ineligible'

type Result = {
  status: EligibilityStatus
  currentDBR: number
  postTopUpDBR: number
  dbrHeadroom: number
  maxTopUp: number
  requestedTopUp: number
  newMonthlyPayment: number
  combinedMonthly: number
  hardReasons: string[]
  softFlags: string[]
  dbrCap: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pmt(rate: number, nper: number, pv: number): number {
  // Standard amortisation formula
  if (rate === 0) return pv / nper
  const r = rate / 12
  return (pv * r * Math.pow(1 + r, nper)) / (Math.pow(1 + r, nper) - 1)
}

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TopUpLoanCalculatorUAE({ locale }: Props) {
  const isAr = locale === 'ar'

  // ── Inputs ──
  const [monthlyIncome, setMonthlyIncome] = useState('')
  const [existingInstalment, setExistingInstalment] = useState('')
  const [cardMinimums, setCardMinimums]   = useState('')
  const [remainingBalance, setRemainingBalance] = useState('')
  const [remainingTenor, setRemainingTenor]   = useState('')
  const [desiredTopUp, setDesiredTopUp]     = useState('')
  const [newTenor, setNewTenor]           = useState('24')
  const [interestRate, setInterestRate]   = useState('5.99')
  const [isExistingCustomer, setIsExistingCustomer] = useState(true)
  const [salaryTransferred, setSalaryTransferred]   = useState(true)
  const [isPensioner, setIsPensioner]     = useState(false)

  const [result, setResult] = useState<Result | null>(null)
  const [showAdvanced, setShowAdvanced]   = useState(false)

  // ── Calculation ──
  function calculate() {
    const income   = parseFloat(monthlyIncome)     || 0
    const instalment = parseFloat(existingInstalment) || 0
    const cards    = parseFloat(cardMinimums)      || 0
    const balance  = parseFloat(remainingBalance)  || 0
    const tenor    = parseInt(remainingTenor)      || 0
    const desired  = parseFloat(desiredTopUp)      || 0
    const nTenor   = parseInt(newTenor)            || 24
    const rate     = parseFloat(interestRate) / 100 || DEFAULT_RATE

    if (income <= 0) return

    const cap      = isPensioner ? DBR_CAP_PENSIONER : DBR_CAP
    const hardReasons: string[] = []
    const softFlags: string[]   = []

    // Current DBR
    const currentMonthlyObligation = instalment + cards
    const currentDBR = income > 0 ? currentMonthlyObligation / income : 1

    // DBR headroom — how much more monthly payment can we absorb?
    const maxMonthlyAdditional = Math.max(0, income * cap - currentMonthlyObligation)

    // New monthly payment for the requested top-up
    const newPayment = desired > 0 ? pmt(rate, nTenor, desired) : 0

    // Post top-up DBR
    const combinedMonthly = currentMonthlyObligation + newPayment
    const postDBR = income > 0 ? combinedMonthly / income : 1

    // Maximum top-up that keeps us within DBR
    // Back-solve: maxMonthlyAdditional = pmt(rate, nTenor, X) → X = maxMonthlyAdditional / pmt(rate,nTenor,1)
    const pmtPerUnit = pmt(rate, nTenor, 1)
    const maxTopUp   = pmtPerUnit > 0 ? Math.floor(maxMonthlyAdditional / pmtPerUnit) : 0

    // ── Hard rules ──
    if (currentDBR >= cap) {
      hardReasons.push(
        isAr
          ? `نسبة عبء الدين الحالية (${pct(currentDBR)}) تتجاوز الحد الأقصى (${pct(cap)})`
          : `Current DBR (${pct(currentDBR)}) already at or above the ${pct(cap)} UAE cap`
      )
    }
    if (desired > 0 && postDBR > cap) {
      hardReasons.push(
        isAr
          ? `مبلغ القرض المطلوب سيرفع نسبة عبء الدين إلى ${pct(postDBR)}، وهو فوق الحد المسموح`
          : `Requested amount pushes DBR to ${pct(postDBR)}, exceeding the ${pct(cap)} cap`
      )
    }
    if (nTenor > MAX_TENOR_MONTHS) {
      hardReasons.push(
        isAr
          ? `المدة المطلوبة تتجاوز الحد الأقصى المعتاد للقروض الشخصية (${MAX_TENOR_MONTHS} شهرًا)`
          : `Requested tenor exceeds typical UAE personal loan maximum of ${MAX_TENOR_MONTHS} months`
      )
    }

    // ── Soft rules ──
    if (!isExistingCustomer) {
      softFlags.push(
        isAr
          ? 'القرض الإضافي يستلزم عادةً أن تكون عميلًا حاليًا لدى البنك'
          : 'Top-up is generally restricted to existing customers of the same lender'
      )
    }
    if (!salaryTransferred) {
      softFlags.push(
        isAr
          ? 'كثير من البنوك الإماراتية تشترط تحويل الراتب للموافقة'
          : 'Many UAE banks require salary transfer to the same bank for approval'
      )
    }
    if (income < 5000) {
      softFlags.push(
        isAr
          ? 'بعض البنوك تشترط دخلًا أدنى يبلغ 5,000 درهم'
          : 'Some UAE lenders require a minimum monthly income of AED 5,000'
      )
    }

    // ── Status ──
    let status: EligibilityStatus = 'eligible'
    if (hardReasons.length > 0) {
      status = 'ineligible'
    } else if (softFlags.length > 0) {
      status = 'conditional'
    }

    setResult({
      status,
      currentDBR,
      postTopUpDBR: postDBR,
      dbrHeadroom: Math.max(0, cap - currentDBR),
      maxTopUp,
      requestedTopUp: desired,
      newMonthlyPayment: newPayment,
      combinedMonthly,
      hardReasons,
      softFlags,
      dbrCap: cap,
    })
  }

  function reset() {
    setMonthlyIncome(''); setExistingInstalment(''); setCardMinimums('')
    setRemainingBalance(''); setRemainingTenor(''); setDesiredTopUp('')
    setNewTenor('24'); setInterestRate('5.99')
    setIsExistingCustomer(true); setSalaryTransferred(true); setIsPensioner(false)
    setResult(null)
  }

  // ── Labels ──
  const t = isAr
    ? {
        title: 'حاسبة القرض الإضافي – الإمارات',
        income: 'الراتب الشهري الإجمالي',
        instalment: 'القسط الشهري الحالي',
        cards: 'الحد الأدنى لبطاقات الائتمان',
        balance: 'الرصيد المتبقي للقرض',
        tenor: 'الأشهر المتبقية للقرض',
        desired: 'المبلغ الإضافي المطلوب',
        newTenor: 'مدة القرض الجديد (أشهر)',
        rate: 'معدل الفائدة السنوي (%)',
        existingCustomer: 'أنا عميل حالي لدى البنك',
        salaryTransfer: 'راتبي محوّل لنفس البنك',
        pensioner: 'أنا متقاعد',
        advanced: 'إعدادات متقدمة',
        calculate: 'احسب',
        reset: 'إعادة تعيين',
        eligible: 'مؤهل للحصول على القرض الإضافي',
        conditional: 'مؤهل مبدئيًا (يخضع لشروط البنك)',
        ineligible: 'غير مؤهل حاليًا',
        currentDBR: 'نسبة عبء الدين الحالية',
        postDBR: 'نسبة عبء الدين بعد القرض',
        headroom: 'الهامش المتاح',
        maxTopUp: 'الحد الأقصى للقرض الإضافي',
        newPayment: 'القسط الشهري الجديد',
        combined: 'إجمالي الأقساط الشهرية',
        hardIssues: 'موانع قانونية',
        softFlags: 'شروط البنك',
        disclaimer: 'هذه الحاسبة للاسترشاد فقط ولا تمثل عرضًا ائتمانيًا رسميًا.',
        enterAmount: 'أدخل المبلغ',
        cap: 'الحد الأقصى لنسبة عبء الدين',
      }
    : {
        title: 'Top-Up Loan Calculator UAE',
        income: 'Gross Monthly Income',
        instalment: 'Existing Monthly Instalment',
        cards: 'Credit Card Minimum Payments',
        balance: 'Remaining Loan Balance',
        tenor: 'Remaining Loan Tenor (months)',
        desired: 'Additional Amount Needed',
        newTenor: 'New Loan Tenor (months)',
        rate: 'Annual Interest Rate (%)',
        existingCustomer: 'I am an existing customer of this bank',
        salaryTransfer: 'My salary is transferred to this bank',
        pensioner: 'I am a pensioner / retiree',
        advanced: 'Advanced Settings',
        calculate: 'Calculate Eligibility',
        reset: 'Reset',
        eligible: 'Eligible for Top-Up',
        conditional: 'Conditionally Eligible',
        ineligible: 'Not Eligible at This Amount',
        currentDBR: 'Current DBR',
        postDBR: 'Post Top-Up DBR',
        headroom: 'DBR Headroom',
        maxTopUp: 'Max Safe Top-Up',
        newPayment: 'New Monthly Payment',
        combined: 'Total Monthly Obligations',
        hardIssues: 'Hard Rule Failures',
        softFlags: 'Bank Policy Checks',
        disclaimer: 'This calculator is an estimate based on published UAE Central Bank guidelines. Final approval depends on your lender.',
        enterAmount: 'Enter amount',
        cap: 'DBR Cap Applied',
      }

  // ── Status config ──
  const statusConfig = {
    eligible:    { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✓', color: 'text-emerald-700', badge: 'bg-emerald-600' },
    conditional: { bg: 'bg-amber-50',   border: 'border-amber-200',   icon: '~', color: 'text-amber-700',   badge: 'bg-amber-500'   },
    ineligible:  { bg: 'bg-red-50',     border: 'border-red-200',     icon: '✗', color: 'text-red-700',     badge: 'bg-red-600'     },
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Section 1: Core inputs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Income */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.income}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number" min="0" value={monthlyIncome}
              onChange={e => setMonthlyIncome(e.target.value)}
              placeholder={t.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Existing instalment */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.instalment}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number" min="0" value={existingInstalment}
              onChange={e => setExistingInstalment(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Card minimums */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.cards}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number" min="0" value={cardMinimums}
              onChange={e => setCardMinimums(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Remaining balance */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.balance}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number" min="0" value={remainingBalance}
              onChange={e => setRemainingBalance(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Remaining tenor */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.tenor}</label>
          <input
            type="number" min="1" max="48" value={remainingTenor}
            onChange={e => setRemainingTenor(e.target.value)}
            placeholder="e.g. 24"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Desired top-up */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.desired}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">AED</span>
            <input
              type="number" min="0" value={desiredTopUp}
              onChange={e => setDesiredTopUp(e.target.value)}
              placeholder={t.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      {/* ── Toggles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { key: 'existingCustomer', value: isExistingCustomer, set: setIsExistingCustomer, label: t.existingCustomer },
          { key: 'salaryTransfer',   value: salaryTransferred,  set: setSalaryTransferred,  label: t.salaryTransfer },
          { key: 'pensioner',        value: isPensioner,        set: setIsPensioner,        label: t.pensioner },
        ].map(({ key, value, set, label }) => (
          <button
            key={key}
            onClick={() => set(!value)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left ${
              value
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <span className={`w-4 h-4 rounded flex items-center justify-center text-xs flex-shrink-0 ${value ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {value ? '✓' : ''}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* ── Advanced settings ── */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
        >
          <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
          {t.advanced}
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.newTenor}</label>
              <input
                type="number" min="6" max="48" value={newTenor}
                onChange={e => setNewTenor(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.rate}</label>
              <input
                type="number" min="0" max="30" step="0.01" value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>
        )}
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
      {result && (() => {
        const sc = statusConfig[result.status]
        return (
          <div className={`rounded-2xl border ${sc.border} ${sc.bg} p-6 space-y-5`}>

            {/* Status badge */}
            <div className="flex items-center gap-3">
              <span className={`w-9 h-9 rounded-full ${sc.badge} text-white flex items-center justify-center font-bold text-lg`}>
                {sc.icon}
              </span>
              <span className={`font-bold text-lg ${sc.color}`}>
                {t[result.status]}
              </span>
            </div>

            {/* Hero metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: t.maxTopUp,    value: fmt(result.maxTopUp),           highlight: true  },
                { label: t.newPayment,  value: fmt(result.newMonthlyPayment),  highlight: false },
                { label: t.combined,    value: fmt(result.combinedMonthly),    highlight: false },
              ].map(({ label, value, highlight }) => (
                <div key={label} className={`rounded-xl p-4 ${highlight ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-100'}`}>
                  <div className={`text-xs mb-1 ${highlight ? 'opacity-80' : 'text-gray-500'}`}>{label}</div>
                  <div className={`text-lg font-black ${highlight ? '' : 'text-gray-900'}`}>{value}</div>
                </div>
              ))}
            </div>

            {/* DBR breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <DBRBar label={t.currentDBR} value={result.currentDBR} cap={result.dbrCap} />
              <DBRBar label={t.postDBR}    value={result.postTopUpDBR} cap={result.dbrCap} isPost />
              <Row label={t.headroom} value={pct(result.dbrHeadroom)} />
              <Row label={t.cap}      value={pct(result.dbrCap)} />
            </div>

            {/* Hard rules */}
            {result.hardReasons.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                <div className="text-sm font-bold text-red-700">{t.hardIssues}</div>
                {result.hardReasons.map((r, i) => (
                  <div key={i} className="flex gap-2 text-sm text-red-700">
                    <span>✗</span><span>{r}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Soft flags */}
            {result.softFlags.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                <div className="text-sm font-bold text-amber-700">{t.softFlags}</div>
                {result.softFlags.map((f, i) => (
                  <div key={i} className="flex gap-2 text-sm text-amber-700">
                    <span>!</span><span>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 leading-relaxed">{t.disclaimer}</p>
          </div>
        )
      })()}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function DBRBar({ label, value, cap, isPost = false }: { label: string; value: number; cap: number; isPost?: boolean }) {
  const pctVal  = Math.min(value, 1)
  const capPct  = cap * 100
  const valPct  = pctVal * 100
  const exceeded = value > cap

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className={`font-semibold ${exceeded ? 'text-red-600' : isPost ? 'text-blue-600' : 'text-gray-700'}`}>
          {pct(value)}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full relative overflow-hidden">
        {/* Cap marker */}
        <div className="absolute top-0 bottom-0 w-px bg-gray-400" style={{ left: `${capPct}%` }} />
        {/* Fill */}
        <div
          className={`h-full rounded-full transition-all ${exceeded ? 'bg-red-500' : isPost ? 'bg-blue-400' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(valPct, 100)}%` }}
        />
      </div>
    </div>
  )
}
