'use client'

import { useState, useMemo } from 'react'

type Props = { locale?: string }

type DebtEntry = { id: string; label: string; amount: string }

function calcEMI(principal: number, annualRate: number, months: number): number {
  if (!principal || principal <= 0 || months <= 0) return 0
  const r = annualRate / 100 / 12
  if (r === 0) return principal / months
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function fmt(n: number) {
  return n.toLocaleString('en-AE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function fmtDec(n: number) {
  return n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

let idCounter = 0
function newId() { return `debt_${++idCounter}` }

const STATUS_CONFIG = {
  safe:    { label: 'Eligible',       labelAr: 'مؤهل',             color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200', bar: 'bg-emerald-500' },
  caution: { label: 'Approaching Limit', labelAr: 'قريب من الحد',  color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200',   bar: 'bg-amber-400'  },
  over:    { label: 'Exceeds Limit',  labelAr: 'يتجاوز الحد',      color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200',     bar: 'bg-red-500'    },
}

export default function DBRCalculator({ locale = 'en' }: Props) {
  const isAr = locale === 'ar'

  // Income
  const [income, setIncome] = useState('')
  const [isPensioner, setIsPensioner] = useState(false)
  const [isNational, setIsNational] = useState(false)
  const [jointMode, setJointMode] = useState(false)
  const [income2, setIncome2] = useState('')

  // Existing debts
  const [debtEntries, setDebtEntries] = useState<DebtEntry[]>([
    { id: newId(), label: 'Personal Loan EMI', amount: '' },
  ])
  const [creditCardLimit, setCreditCardLimit] = useState('')
  const [rentalIncome, setRentalIncome] = useState('')
  const [includeRental, setIncludeRental] = useState(false)

  // Proposed loan
  const [showProposed, setShowProposed] = useState(false)
  const [proposedAmount, setProposedAmount] = useState('')
  const [proposedRate, setProposedRate] = useState('9.99')
  const [proposedTenure, setProposedTenure] = useState('48')
  const [isMortgage, setIsMortgage] = useState(false)
  const [stressRate, setStressRate] = useState(2)

  // Helpers
  const addDebtEntry = () => setDebtEntries(d => [...d, { id: newId(), label: '', amount: '' }])
  const removeDebt = (id: string) => setDebtEntries(d => d.filter(e => e.id !== id))
  const updateDebt = (id: string, field: 'label' | 'amount', val: string) =>
    setDebtEntries(d => d.map(e => e.id === id ? { ...e, [field]: val } : e))

  const results = useMemo(() => {
    const grossIncome = parseFloat(income) || 0
    const grossIncome2 = jointMode ? (parseFloat(income2) || 0) : 0
    const totalIncome = grossIncome + grossIncome2

    // Rental income: banks deduct ~2 months for vacancy, so usable = (annual / 12) * (10/12)
    const rentalMonthly = includeRental ? (parseFloat(rentalIncome) || 0) * (10 / 12) : 0
    const effectiveIncome = totalIncome + rentalMonthly

    const maxDBR = isPensioner ? 0.30 : 0.50
    const maxAllowed = effectiveIncome * maxDBR

    // Credit card: 5% of total limit
    const ccObligation = (parseFloat(creditCardLimit) || 0) * 0.05

    // Existing EMI sum
    const existingEMIs = debtEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)

    const existingTotal = existingEMIs + ccObligation

    // Proposed
    const pAmt = parseFloat(proposedAmount) || 0
    const pRate = parseFloat(proposedRate) || 0
    const pMonths = parseInt(proposedTenure) || 0
    const proposedEMI = pAmt > 0 && pRate > 0 && pMonths > 0 ? calcEMI(pAmt, pRate, pMonths) : 0
    const stressedEMI = isMortgage && proposedEMI > 0 ? calcEMI(pAmt, pRate + stressRate, pMonths) : 0

    const projectedTotal = existingTotal + proposedEMI
    const projectedTotalStressed = isMortgage ? existingTotal + stressedEMI : projectedTotal

    const currentDBR = effectiveIncome > 0 ? (existingTotal / effectiveIncome) * 100 : 0
    const projectedDBR = effectiveIncome > 0 ? (projectedTotal / effectiveIncome) * 100 : 0
    const stressedDBR = effectiveIncome > 0 ? (projectedTotalStressed / effectiveIncome) * 100 : 0

    const headroom = Math.max(0, maxAllowed - existingTotal)
    const headroomAfter = Math.max(0, maxAllowed - projectedTotal)

type StatusKey = keyof typeof STATUS_CONFIG

const getStatus = (dbr: number): StatusKey =>
  dbr >= maxDBR * 100
    ? 'over'
    : dbr >= maxDBR * 100 * 0.8
      ? 'caution'
      : 'safe'

    return {
      effectiveIncome, maxAllowed, maxDBR,
      ccObligation, existingEMIs, existingTotal,
      proposedEMI, stressedEMI,
      projectedTotal, projectedTotalStressed,
      currentDBR, projectedDBR, stressedDBR,
      headroom, headroomAfter,
      currentStatus: getStatus(currentDBR),
      projectedStatus: getStatus(projectedDBR),
      hasIncome: effectiveIncome > 0,
      hasProposed: proposedEMI > 0,
    }
  }, [income, income2, jointMode, isPensioner, debtEntries, creditCardLimit, rentalIncome, includeRental, proposedAmount, proposedRate, proposedTenure, isMortgage, stressRate])

  const t = isAr ? {
    title: 'حاسبة نسبة الاستدانة (DBR)',
    incomeSection: 'بيانات الدخل',
    grossIncome: 'الراتب الإجمالي الشهري (AED)',
    pensioner: 'متقاعد / ذو معاش',
    national: 'مواطن إماراتي',
    joint: 'طلب مشترك (زوجين)',
    income2: 'دخل المتقدم الثاني (AED)',
    rentalToggle: 'إضافة دخل إيجاري',
    rentalIncome: 'الإيجار الشهري (AED)',
    debtsSection: 'الالتزامات الشهرية الحالية',
    addDebt: '+ إضافة التزام',
    debtLabel: 'الوصف',
    debtAmount: 'القسط الشهري (AED)',
    ccLimit: 'إجمالي حدود بطاقات الائتمان (AED)',
    ccNote: '5% من الحد يُحتسب كالتزام شهري',
    proposedSection: 'القرض أو التمويل المقترح',
    addProposed: '+ إضافة قرض مقترح',
    removeProposed: '− إزالة',
    proposedAmount: 'مبلغ القرض (AED)',
    proposedRate: 'معدل الفائدة السنوي (%)',
    proposedTenure: 'المدة (أشهر)',
    mortgageToggle: 'هذا قرض عقاري (تحليل إجهاد)',
    stressRate: 'نسبة الإجهاد المضافة (%)',
    currentDBR: 'نسبة DBR الحالية',
    projectedDBR: 'نسبة DBR المتوقعة',
    stressedDBR: 'نسبة DBR تحت الإجهاد',
    maxAllowed: 'الحد الأقصى المسموح',
    headroom: 'مساحة الاقتراض المتاحة',
    breakdown: 'تفاصيل الحساب',
    effectiveIncome: 'الدخل الفعّال',
    existingDebt: 'الالتزامات الحالية',
    ccObligation: 'الالتزام الشهري للبطاقات',
    proposedEMI: 'القسط الشهري المقترح',
    totalDebt: 'إجمالي الالتزامات',
    disclaimer: 'هذه الأداة للأغراض التوضيحية وفق إرشادات المصرف المركزي الإماراتي (حد DBR 50%). تجري البنوك فحوصات إضافية عبر الاتحاد الائتماني (AECB) وقد تطبّق معايير داخلية أكثر صرامة. هذه الأداة ليست نصيحة مالية.',
  } : {
    title: 'Debt Burden Ratio (DBR) Calculator',
    incomeSection: 'Income',
    grossIncome: 'Gross Monthly Income (AED)',
    pensioner: 'Pensioner / Retiree',
    national: 'UAE National',
    joint: 'Joint Application',
    income2: 'Second Applicant Income (AED)',
    rentalToggle: 'Add Rental Income',
    rentalIncome: 'Monthly Rental Income (AED)',
    debtsSection: 'Existing Monthly Obligations',
    addDebt: '+ Add Obligation',
    debtLabel: 'Description',
    debtAmount: 'Monthly EMI (AED)',
    ccLimit: 'Total Credit Card Limit(s) (AED)',
    ccNote: '5% of limit counted as monthly obligation (UAE bank standard)',
    proposedSection: 'Proposed New Loan',
    addProposed: '+ Add Proposed Loan',
    removeProposed: '− Remove',
    proposedAmount: 'Loan Amount (AED)',
    proposedRate: 'Annual Interest Rate (%)',
    proposedTenure: 'Tenure (Months)',
    mortgageToggle: 'This is a mortgage (stress test)',
    stressRate: 'Stress Rate Add-on (%)',
    currentDBR: 'Current DBR',
    projectedDBR: 'Projected DBR',
    stressedDBR: 'Stressed DBR',
    maxAllowed: 'Max Allowed Monthly Debt',
    headroom: 'Borrowing Headroom',
    breakdown: 'Calculation Breakdown',
    effectiveIncome: 'Effective Income',
    existingDebt: 'Existing Obligations',
    ccObligation: 'Credit Card Obligation',
    proposedEMI: 'Proposed Monthly EMI',
    totalDebt: 'Total Monthly Debt',
    disclaimer: 'This is an estimate based on CBUAE guidelines (50% max DBR; 30% for pensioners). Banks perform final AECB credit bureau checks and may apply stricter internal policies. Not financial advice.',
  }

  const currentCfg   = STATUS_CONFIG[results.currentStatus]
  const projectedCfg = STATUS_CONFIG[results.projectedStatus]

  return (
    <div className="space-y-7 font-sans" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── INCOME SECTION ── */}
      <Section title={t.incomeSection}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>{t.grossIncome}</Label>
            <AEDInput value={income} onChange={setIncome} placeholder="e.g. 15000" />
          </div>

          {/* Toggles */}
          <Toggle label={t.pensioner} checked={isPensioner} onChange={setIsPensioner} />
          <Toggle label={t.national}  checked={isNational}  onChange={setIsNational}  />
          <Toggle label={t.joint}     checked={jointMode}    onChange={setJointMode}   />

          {jointMode && (
            <div className="sm:col-span-2">
              <Label>{t.income2}</Label>
              <AEDInput value={income2} onChange={setIncome2} placeholder="e.g. 10000" />
            </div>
          )}

          <Toggle label={t.rentalToggle} checked={includeRental} onChange={setIncludeRental} />
          {includeRental && (
            <div className="sm:col-span-2">
              <Label>{t.rentalIncome}</Label>
              <AEDInput value={rentalIncome} onChange={setRentalIncome} placeholder="e.g. 5000" />
              <p className="text-xs text-gray-500 mt-1">Banks apply ~10/12 months for vacancy. Effective monthly: AED {fmt((parseFloat(rentalIncome)||0) * 10/12)}</p>
            </div>
          )}
        </div>
      </Section>

      {/* ── EXISTING DEBTS ── */}
      <Section title={t.debtsSection}>
        <div className="space-y-3">
          {debtEntries.map((e, i) => (
            <div key={e.id} className="grid grid-cols-5 gap-2 items-end">
              <div className="col-span-3">
                {i === 0 && <Label>{t.debtLabel}</Label>}
                <input
                  type="text"
                  value={e.label}
                  onChange={ev => updateDebt(e.id, 'label', ev.target.value)}
                  placeholder="e.g. Car loan"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A3D7C] focus:border-transparent transition"
                />
              </div>
              <div className="col-span-2 relative">
                {i === 0 && <Label>{t.debtAmount}</Label>}
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">AED</span>
                  <input
                    type="number"
                    min={0}
                    value={e.amount}
                    onChange={ev => updateDebt(e.id, 'amount', ev.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-2 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A3D7C] focus:border-transparent transition"
                  />
                </div>
              </div>
              {debtEntries.length > 1 && (
                <button
                  onClick={() => removeDebt(e.id)}
                  className="col-span-5 text-xs text-red-400 hover:text-red-600 text-right -mt-1"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            onClick={addDebtEntry}
            className="text-sm font-semibold text-[#0A3D7C] hover:underline"
          >
            {t.addDebt}
          </button>

          {/* Credit card */}
          <div className="pt-2 border-t border-gray-100">
            <Label>{t.ccLimit}</Label>
            <AEDInput value={creditCardLimit} onChange={setCreditCardLimit} placeholder="e.g. 30000" />
            <p className="text-xs text-gray-500 mt-1">{t.ccNote}
              {creditCardLimit && ` → AED ${fmtDec((parseFloat(creditCardLimit)||0)*0.05)}/mo`}
            </p>
          </div>
        </div>
      </Section>

      {/* ── PROPOSED LOAN ── */}
      <Section title={t.proposedSection}>
        {!showProposed ? (
          <button
            onClick={() => setShowProposed(true)}
            className="text-sm font-semibold text-[#0A3D7C] hover:underline"
          >
            {t.addProposed}
          </button>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setShowProposed(false)}
              className="text-xs text-gray-500 hover:text-gray-600"
            >
              {t.removeProposed}
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <Label>{t.proposedAmount}</Label>
                <AEDInput value={proposedAmount} onChange={setProposedAmount} placeholder="e.g. 200000" />
              </div>
              <div>
                <Label>{t.proposedRate}</Label>
                <div className="relative">
                  <input
                    type="number" min={0} max={60} step={0.25}
                    value={proposedRate}
                    onChange={e => setProposedRate(e.target.value)}
                    className="w-full pr-7 pl-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A3D7C] focus:border-transparent transition"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">%</span>
                </div>
              </div>
              <div>
                <Label>{t.proposedTenure}</Label>
                <input
                  type="number" min={1} max={300}
                  value={proposedTenure}
                  onChange={e => setProposedTenure(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0A3D7C] focus:border-transparent transition"
                />
              </div>
              <div className="sm:col-span-1 flex items-end">
                {results.hasProposed && (
                  <div className="w-full rounded-xl bg-[#0A3D7C]/5 px-3 py-2.5 text-center">
                    <p className="text-xs text-gray-500">EMI</p>
                    <p className="font-black text-[#0A3D7C] text-sm">AED {fmtDec(results.proposedEMI)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mortgage stress test */}
            <Toggle label={t.mortgageToggle} checked={isMortgage} onChange={setIsMortgage} />
            {isMortgage && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-amber-700">CBUAE Mortgage Stress Test</p>
                <div className="flex items-center gap-4">
                  <Label>{t.stressRate}</Label>
                  <div className="flex gap-2">
                    {[2, 3, 4].map(v => (
                      <button
                        key={v}
                        onClick={() => setStressRate(v)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          stressRate === v
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'border-amber-200 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        +{v}%
                      </button>
                    ))}
                  </div>
                </div>
                {results.stressedEMI > 0 && (
                  <p className="text-xs text-amber-700">
                    Stressed EMI at {parseFloat(proposedRate) + stressRate}%: <strong>AED {fmtDec(results.stressedEMI)}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── RESULTS ── */}
      {results.hasIncome && (
        <div className="space-y-4">
          {/* DBR Gauges */}
          <div className={`rounded-2xl border ${currentCfg.border} ${currentCfg.bg} overflow-hidden`}>
            {/* Hero */}
            <div className="px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{t.currentDBR}</p>
              <div className="flex items-end gap-3">
                <span className={`text-5xl font-black ${currentCfg.color}`}>
                  {results.currentDBR.toFixed(1)}%
                </span>
                <span className={`text-sm font-bold pb-1.5 ${currentCfg.color}`}>
                  {isAr ? currentCfg.labelAr : currentCfg.label}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${currentCfg.bar}`}
                  style={{ width: `${Math.min(100, results.currentDBR / (results.maxDBR * 100) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="font-semibold">Max {(results.maxDBR * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Max allowed + headroom */}
            <div className="border-t border-gray-100 grid grid-cols-2 divide-x divide-gray-100 bg-white/60">
              <div className="px-4 py-3">
                <p className="text-xs text-gray-500">{t.maxAllowed}</p>
                <p className="font-bold text-sm text-gray-800">AED {fmt(results.maxAllowed)}/mo</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-gray-500">{t.headroom}</p>
                <p className={`font-bold text-sm ${results.headroom > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  AED {fmt(results.headroom)}/mo
                </p>
              </div>
            </div>
          </div>

          {/* Projected DBR */}
          {results.hasProposed && (
            <div className={`rounded-2xl border ${projectedCfg.border} ${projectedCfg.bg} px-6 py-5 space-y-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{t.projectedDBR}</p>
                  <div className="flex items-end gap-3">
                    <span className={`text-4xl font-black ${projectedCfg.color}`}>
                      {results.projectedDBR.toFixed(1)}%
                    </span>
                    <span className={`text-sm font-bold pb-1 ${projectedCfg.color}`}>
                      {isAr ? projectedCfg.labelAr : projectedCfg.label}
                    </span>
                  </div>
                </div>
                {results.headroomAfter > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Remaining headroom</p>
                    <p className="font-bold text-sm text-emerald-600">AED {fmt(results.headroomAfter)}/mo</p>
                  </div>
                )}
              </div>
              <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${projectedCfg.bar}`}
                  style={{ width: `${Math.min(100, results.projectedDBR / (results.maxDBR * 100) * 100)}%` }}
                />
              </div>

              {/* Stressed DBR */}
              {isMortgage && results.stressedDBR > 0 && (
                <div className="mt-2 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-amber-700 mb-1">{t.stressedDBR} (+{stressRate}%)</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black ${results.stressedDBR >= results.maxDBR * 100 ? 'text-red-600' : 'text-amber-600'}`}>
                      {results.stressedDBR.toFixed(1)}%
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${results.stressedDBR >= results.maxDBR * 100 ? 'bg-red-500' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(100, results.stressedDBR / (results.maxDBR * 100) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Breakdown table */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">{t.breakdown}</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <BRow label={t.effectiveIncome}  value={`AED ${fmt(results.effectiveIncome)}`} bold />
                {results.existingEMIs > 0 && (
                  <BRow label={t.existingDebt}   value={`AED ${fmt(results.existingEMIs)}`} negative />
                )}
                {results.ccObligation > 0 && (
                  <BRow label={t.ccObligation}   value={`AED ${fmtDec(results.ccObligation)}`} negative />
                )}
                {results.hasProposed && (
                  <BRow label={t.proposedEMI}    value={`AED ${fmtDec(results.proposedEMI)}`} negative />
                )}
                <BRow label={t.totalDebt}        value={`AED ${fmt(results.projectedTotal)}`} border />
                <BRow
                  label={`${t.currentDBR} (${isAr ? 'بدون قرض مقترح' : 'without proposed'})`}
                  value={`${results.currentDBR.toFixed(2)}%`}
                  accent
                />
                {results.hasProposed && (
                  <BRow label={t.projectedDBR} value={`${results.projectedDBR.toFixed(2)}%`} accent />
                )}
              </tbody>
            </table>
          </div>

          {isPensioner && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700">
              <strong>Pensioner cap applied:</strong> Maximum DBR is 30% (AED {fmt(results.maxAllowed)}/mo) rather than the standard 50%.
            </div>
          )}
        </div>
      )}

      {/* ── DISCLAIMER ── */}
      <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-xs text-gray-500 leading-relaxed space-y-1.5">
        <p className="font-semibold text-gray-600">Important Disclaimer</p>
        <p>{t.disclaimer}</p>
        <p>CBUAE rules: DBR ≤ 50% gross income · Pensioners ≤ 30% · Credit cards: 5% of limit · Mortgages: stress test +2–4% · Reducing balance method.</p>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#0A3D7C] uppercase tracking-widest border-b border-gray-100 pb-2">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-gray-700 mb-1.5">{children}</label>
}

function AEDInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">AED</span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0A3D7C] focus:border-transparent transition"
      />
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${checked ? 'bg-[#0A3D7C]' : 'bg-gray-200'}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  )
}

function BRow({
  label, value, negative = false, accent = false, bold = false, border = false,
}: {
  label: string; value: string; negative?: boolean; accent?: boolean; bold?: boolean; border?: boolean
}) {
  return (
    <tr className={border ? 'border-t border-gray-100' : ''}>
      <td className={`px-4 py-2.5 text-gray-600 ${bold ? 'font-semibold' : ''}`}>{label}</td>
      <td className={`px-4 py-2.5 text-right font-semibold ${
        accent ? 'text-[#0A3D7C]' : negative ? 'text-red-500' : bold ? 'text-gray-900' : 'text-gray-700'
      }`}>{value}</td>
    </tr>
  )
}
