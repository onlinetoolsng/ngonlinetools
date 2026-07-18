'use client'

import { useState } from 'react'

type Props = { locale: string }

type LoanType = 'home' | 'personal' | 'auto' | 'other'
type SettlementType = 'full' | 'partial'
type FrequencyType = 'monthly' | 'quarterly' | 'biannual' | 'annual'

interface SettlementResult {
  outstandingBalance: number
  partialAmount: number | null
  accruedInterest: number
  settlementFee: number
  feeCapApplied: boolean
  feeCapType: 'statutory' | 'bank-term'
  adminFee: number
  totalPayable: number
  ruleApplied: string
  ruleLabel: string
  loanType: LoanType
  settlementType: SettlementType
}

const LOAN_TYPES: { value: LoanType; label: string; labelAr: string; feeNote: string; feeNoteAr: string }[] = [
  {
    value: 'home',
    label: 'Home Loan / Mortgage',
    labelAr: 'قرض عقاري / رهن',
    feeNote: 'CBUAE cap: 1% of outstanding or AED 10,000 (whichever lower)',
    feeNoteAr: 'حد البنك المركزي الإماراتي: 1% من الرصيد أو 10,000 درهم أيهما أقل',
  },
  {
    value: 'personal',
    label: 'Personal Finance',
    labelAr: 'تمويل شخصي',
    feeNote: 'Bank-disclosed fee applies (typically 1% of outstanding)',
    feeNoteAr: 'رسوم البنك المُفصح عنها (عادةً 1% من الرصيد)',
  },
  {
    value: 'auto',
    label: 'Auto Finance',
    labelAr: 'تمويل سيارة',
    feeNote: 'Bank-disclosed fee applies (check Key Facts Statement)',
    feeNoteAr: 'رسوم البنك المُفصح عنها (راجع بيان الحقائق الرئيسية)',
  },
  {
    value: 'other',
    label: 'Other Retail Finance',
    labelAr: 'تمويل آخر',
    feeNote: 'Bank-disclosed fee applies (check your loan agreement)',
    feeNoteAr: 'رسوم البنك المُفصح عنها (راجع اتفاقية قرضك)',
  },
]

const FREQUENCIES: { value: FrequencyType; label: string; labelAr: string; periodsPerYear: number }[] = [
  { value: 'monthly',   label: 'Monthly',    labelAr: 'شهري',     periodsPerYear: 12  },
  { value: 'quarterly', label: 'Quarterly',  labelAr: 'ربع سنوي', periodsPerYear: 4   },
  { value: 'biannual',  label: 'Bi-annual',  labelAr: 'نصف سنوي', periodsPerYear: 2   },
  { value: 'annual',    label: 'Annual',     labelAr: 'سنوي',     periodsPerYear: 1   },
]

function fmt(n: number) {
  return `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(n: number) {
  return `${n.toFixed(3)}%`
}

function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)))
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function calcAccruedInterest(
  outstanding: number,
  annualRate: number,
  settlementDate: string,
  nextPaymentDate: string,
  frequency: FrequencyType,
): number {
  if (!settlementDate || !nextPaymentDate || !annualRate) return 0
  const settle = new Date(settlementDate)
  const next = new Date(nextPaymentDate)
  if (settle >= next) return 0

  const freq = FREQUENCIES.find(f => f.value === frequency)!
  const periodDays = 365 / freq.periodsPerYear
  const daysAccrued = daysBetween(settle, next)
  const daysInPeriod = periodDays

  const dailyRate = annualRate / 100 / 365
  return outstanding * dailyRate * Math.min(daysAccrued, daysInPeriod)
}

function calcSettlement(
  loanType: LoanType,
  settlementType: SettlementType,
  outstanding: number,
  partialAmount: number | null,
  accruedInterest: number,
  bankFeePercent: number,
  adminFee: number,
): SettlementResult {
  const base = settlementType === 'partial' && partialAmount ? partialAmount : outstanding

  let settlementFee = 0
  let feeCapApplied = false
  let feeCapType: 'statutory' | 'bank-term' = 'bank-term'
  let ruleApplied = ''
  let ruleLabel = ''

  if (loanType === 'home') {
    // CBUAE statutory cap: 1% or AED 10,000 whichever lower
    const rawFee = base * 0.01
    settlementFee = Math.min(rawFee, 10000)
    feeCapApplied = rawFee > 10000
    feeCapType = 'statutory'
    ruleApplied = 'CBUAE Mortgage Regulation — Early Settlement Fee Cap'
    ruleLabel = feeCapApplied
      ? 'Capped at AED 10,000 (1% would exceed cap)'
      : `1% of outstanding = ${fmt(rawFee)}`
  } else {
    // Bank-disclosed fee
    const rawFee = base * (bankFeePercent / 100)
    settlementFee = rawFee
    feeCapType = 'bank-term'
    ruleApplied = 'Bank-Disclosed Product Terms (Key Facts Statement)'
    ruleLabel = `${fmtPct(bankFeePercent)} of ${settlementType === 'partial' ? 'partial amount' : 'outstanding balance'}`
  }

  const totalPayable = outstanding + accruedInterest + settlementFee + adminFee

  return {
    outstandingBalance: outstanding,
    partialAmount: settlementType === 'partial' ? partialAmount : null,
    accruedInterest,
    settlementFee,
    feeCapApplied,
    feeCapType,
    adminFee,
    totalPayable,
    ruleApplied,
    ruleLabel,
    loanType,
    settlementType,
  }
}

export default function UAEEarlySettlementCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [loanType, setLoanType] = useState<LoanType>('home')
  const [settlementType, setSettlementType] = useState<SettlementType>('full')
  const [outstanding, setOutstanding] = useState('')
  const [partialAmount, setPartialAmount] = useState('')
  const [settlementDate, setSettlementDate] = useState(todayStr())
  const [nextPaymentDate, setNextPaymentDate] = useState('')
  const [frequency, setFrequency] = useState<FrequencyType>('monthly')
  const [annualRate, setAnnualRate] = useState('')
  const [bankFeePercent, setBankFeePercent] = useState('1')
  const [adminFee, setAdminFee] = useState('0')
  const [result, setResult] = useState<SettlementResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const selectedLoanType = LOAN_TYPES.find(l => l.value === loanType)!

  function validate(): { errors: string[]; ok: boolean } {
    const errs: string[] = []
    const o = parseFloat(outstanding)
    const p = parseFloat(partialAmount)
    const r = parseFloat(annualRate)
    const bf = parseFloat(bankFeePercent)

    if (!o || o <= 0) errs.push(isAr ? 'أدخل الرصيد المتبقي الصحيح' : 'Enter a valid outstanding balance')
    if (settlementType === 'partial') {
      if (!p || p <= 0) errs.push(isAr ? 'أدخل مبلغ السداد الجزئي' : 'Enter the partial settlement amount')
      if (p >= o) errs.push(isAr ? 'مبلغ السداد الجزئي يجب أن يكون أقل من الرصيد المتبقي' : 'Partial amount must be less than outstanding balance')
    }
    if (settlementDate < todayStr()) errs.push(isAr ? 'تاريخ التسوية لا يمكن أن يكون في الماضي' : 'Settlement date cannot be in the past')
    if (nextPaymentDate && nextPaymentDate <= settlementDate) errs.push(isAr ? 'تاريخ الدفعة التالية يجب أن يكون بعد تاريخ التسوية' : 'Next payment date must be after settlement date')
    if (nextPaymentDate && annualRate && (isNaN(r) || r <= 0)) errs.push(isAr ? 'أدخل معدل فائدة صحيح لحساب الفائدة المستحقة' : 'Enter a valid interest rate to calculate accrued interest')
    if (loanType !== 'home' && (isNaN(bf) || bf < 0)) errs.push(isAr ? 'أدخل نسبة رسوم البنك' : 'Enter the bank fee percentage')
    if (loanType === 'home' && bf > 1) errs.push(isAr ? '⚠ رسوم التسوية المبكرة للرهن العقاري محدودة بـ 1% أو 10,000 درهم. لا يمكن تطبيق نسبة أعلى.' : '⚠ UAE mortgage early settlement fee is capped at 1% or AED 10,000. A higher rate cannot be applied.')
    if (!loanType) errs.push(isAr ? 'يجب اختيار نوع القرض' : 'Loan type is required — fee rules differ by product')

    return { errors: errs, ok: errs.filter(e => !e.startsWith('⚠')).length === 0 }
  }

  function calculate() {
    const { errors: errs, ok } = validate()
    setErrors(errs)
    if (!ok) { setResult(null); return }

    const o = parseFloat(outstanding)
    const p = parseFloat(partialAmount) || null
    const r = parseFloat(annualRate) || 0
    const bf = loanType === 'home' ? 1 : parseFloat(bankFeePercent) || 1
    const af = parseFloat(adminFee) || 0

    const accrued = nextPaymentDate && r
      ? calcAccruedInterest(o, r, settlementDate, nextPaymentDate, frequency)
      : 0

    const res = calcSettlement(loanType, settlementType, o, p, accrued, bf, af)
    setResult(res)
  }

  function reset() {
    setLoanType('home'); setSettlementType('full')
    setOutstanding(''); setPartialAmount('')
    setSettlementDate(todayStr()); setNextPaymentDate('')
    setFrequency('monthly'); setAnnualRate('')
    setBankFeePercent('1'); setAdminFee('0')
    setResult(null); setErrors([])
  }

  const L = isAr ? {
    loanType: 'نوع القرض',
    settlementType: 'نوع التسوية',
    full: 'تسوية كاملة',
    partial: 'تسوية جزئية',
    outstanding: 'الرصيد المتبقي (الأصل)',
    partialAmount: 'مبلغ السداد الجزئي',
    settlementDate: 'تاريخ التسوية',
    nextPayment: 'تاريخ الدفعة التالية (اختياري)',
    frequency: 'تكرار السداد',
    annualRate: 'معدل الفائدة السنوي % (اختياري)',
    bankFee: 'نسبة رسوم البنك %',
    adminFee: 'الرسوم الإدارية (درهم)',
    calculate: 'احسب',
    reset: 'إعادة تعيين',
    totalPayable: 'إجمالي المبلغ المستحق',
    breakdown: 'تفاصيل الحساب',
    principalOutstanding: 'الأصل المتبقي',
    accruedInterest: 'الفائدة المستحقة',
    settlementFee: 'رسوم التسوية المبكرة',
    adminFeeLabel: 'الرسوم الإدارية',
    ruleApplied: 'الأساس القانوني',
    feeDetail: 'تفاصيل الرسوم',
    capApplied: '✓ تم تطبيق الحد الأقصى القانوني (AED 10,000)',
    jurisdiction: 'الإمارات — قانون الرهن العقاري للبنك المركزي الإماراتي',
    jurisdictionBank: 'الإمارات — شروط منتج البنك المُفصح عنها',
    partialNote: 'الرصيد المتبقي بعد التسوية الجزئية',
  } : {
    loanType: 'Loan Type',
    settlementType: 'Settlement Type',
    full: 'Full Settlement',
    partial: 'Partial Settlement',
    outstanding: 'Outstanding Principal Balance',
    partialAmount: 'Partial Settlement Amount',
    settlementDate: 'Settlement Date',
    nextPayment: 'Next Payment Date (Optional — for accrued interest)',
    frequency: 'Repayment Frequency',
    annualRate: 'Annual Interest Rate % (Optional)',
    bankFee: 'Bank Fee Percentage %',
    adminFee: 'Administrative Charges (AED)',
    calculate: 'Calculate Settlement',
    reset: 'Reset',
    totalPayable: 'Total Settlement Amount',
    breakdown: 'Calculation Breakdown',
    principalOutstanding: 'Principal Outstanding',
    accruedInterest: 'Accrued Interest',
    settlementFee: 'Early Settlement Fee',
    adminFeeLabel: 'Administrative Charges',
    ruleApplied: 'Rule Applied',
    feeDetail: 'Fee Calculation',
    capApplied: '✓ AED 10,000 cap applied (1% exceeded cap)',
    jurisdiction: 'UAE — CBUAE Mortgage Regulation (Statutory Cap)',
    jurisdictionBank: 'UAE — Bank-Disclosed Product Terms',
    partialNote: 'Remaining balance after partial settlement',
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Jurisdiction badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
        <span className="text-blue-600 font-bold text-xs">🇦🇪 UAE</span>
        <span className="text-xs text-blue-700">
          {isAr
            ? 'هذه الأداة مخصصة للإمارات فقط. القواعد تختلف حسب نوع المنتج.'
            : 'This calculator applies UAE regulations only. Fee rules differ by loan product.'}
        </span>
      </div>

      {/* Loan type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.loanType}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LOAN_TYPES.map(lt => (
            <button key={lt.value}
              onClick={() => setLoanType(lt.value)}
              className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all text-left ${
                loanType === lt.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}>
              {isAr ? lt.labelAr : lt.label}
            </button>
          ))}
        </div>
        <p className={`mt-1.5 text-xs px-1 ${loanType === 'home' ? 'text-green-700' : 'text-amber-700'}`}>
          ℹ {isAr ? selectedLoanType.feeNoteAr : selectedLoanType.feeNote}
        </p>
      </div>

      {/* Settlement type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.settlementType}</label>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {(['full', 'partial'] as SettlementType[]).map(st => (
            <button key={st}
              onClick={() => setSettlementType(st)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                settlementType === st ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}>
              {st === 'full' ? L.full : L.partial}
            </button>
          ))}
        </div>
      </div>

      {/* Outstanding balance */}
      <div className={`grid grid-cols-1 gap-4 ${settlementType === 'partial' ? 'sm:grid-cols-2' : ''}`}>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.outstanding}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">AED</span>
            <input type="number" min="0" value={outstanding} onChange={e => setOutstanding(e.target.value)}
              placeholder="500,000"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
        </div>
        {settlementType === 'partial' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.partialAmount}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">AED</span>
              <input type="number" min="0" value={partialAmount} onChange={e => setPartialAmount(e.target.value)}
                placeholder="100,000"
                className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>
        )}
      </div>

      {/* Settlement date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.settlementDate}</label>
          <input type="date" min={todayStr()} value={settlementDate} onChange={e => setSettlementDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.nextPayment}</label>
          <input type="date" value={nextPaymentDate} onChange={e => setNextPaymentDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>
      </div>

      {/* Accrued interest inputs — only if next payment provided */}
      {nextPaymentDate && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-dashed border-gray-200 rounded-xl p-4">
          <p className="sm:col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {isAr ? 'حساب الفائدة المستحقة حتى تاريخ التسوية' : 'Accrued Interest Calculation to Settlement Date'}
          </p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.frequency}</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value as FrequencyType)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
              {FREQUENCIES.map(f => (
                <option key={f.value} value={f.value}>{isAr ? f.labelAr : f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.annualRate}</label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">%</span>
              <input type="number" min="0" step="0.1" value={annualRate} onChange={e => setAnnualRate(e.target.value)}
                placeholder="7.5"
                className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>
        </div>
      )}

      {/* Fee inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loanType !== 'home' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.bankFee}</label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">%</span>
              <input type="number" min="0" max="10" step="0.05" value={bankFeePercent} onChange={e => setBankFeePercent(e.target.value)}
                placeholder="1"
                className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.adminFee}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">AED</span>
            <input type="number" min="0" value={adminFee} onChange={e => setAdminFee(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((e, i) => (
            <p key={i} className={`text-sm px-3 py-2 rounded-lg ${e.startsWith('⚠') ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{e}</p>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={calculate}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors">
          {L.calculate}
        </button>
        <button onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors">
          {L.reset}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Hero total */}
          <div className="bg-blue-600 rounded-2xl p-6 text-white">
            <div className="text-sm opacity-80 mb-1">{L.totalPayable}</div>
            <div className="text-4xl font-black tracking-tight">{fmt(result.totalPayable)}</div>
            <div className="mt-2 text-xs opacity-70">
              {result.feeCapType === 'statutory' ? L.jurisdiction : L.jurisdictionBank}
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 space-y-3">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">{L.breakdown}</h3>

            <BRow label={L.principalOutstanding} value={fmt(result.outstandingBalance)} />
            {result.accruedInterest > 0 && (
              <BRow label={L.accruedInterest} value={fmt(result.accruedInterest)} accent="amber" />
            )}
            <BRow
              label={L.settlementFee}
              value={fmt(result.settlementFee)}
              accent="red"
              sub={result.feeCapApplied ? L.capApplied : result.ruleLabel}
            />
            {result.adminFee > 0 && (
              <BRow label={L.adminFeeLabel} value={fmt(result.adminFee)} accent="amber" />
            )}
            <div className="border-t border-gray-200 pt-3">
              <BRow label={L.totalPayable} value={fmt(result.totalPayable)} bold accent="blue" />
            </div>

            {/* Partial: remaining balance */}
            {result.settlementType === 'partial' && result.partialAmount && (
              <div className="border-t border-gray-200 pt-3">
                <BRow
                  label={L.partialNote}
                  value={fmt(result.outstandingBalance - result.partialAmount)}
                  accent="gray"
                />
              </div>
            )}
          </div>

          {/* Rule card */}
          <div className={`rounded-xl border px-5 py-4 space-y-1 ${result.feeCapType === 'statutory' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${result.feeCapType === 'statutory' ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>
                {result.feeCapType === 'statutory'
                  ? (isAr ? 'حد قانوني' : 'Statutory Cap')
                  : (isAr ? 'شروط البنك' : 'Bank Terms')}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800">{result.ruleApplied}</p>
            <p className="text-xs text-gray-600">{result.ruleLabel}</p>
            {result.feeCapType === 'statutory' && (
              <p className="text-xs text-gray-500 pt-1">
                {isAr
                  ? 'وفقاً للبنك المركزي الإماراتي، تُحدد رسوم التسوية المبكرة للرهن العقاري بـ 1% من الرصيد المتبقي أو 10,000 درهم أيهما أقل.'
                  : 'Per CBUAE regulations, the early settlement fee on home loans is capped at 1% of outstanding balance or AED 10,000, whichever is lower.'}
              </p>
            )}
            {result.feeCapType === 'bank-term' && (
              <p className="text-xs text-gray-500 pt-1">
                {isAr
                  ? 'لا يسري الحد القانوني البالغ 1%/10,000 درهم على هذا النوع من المنتجات بموجب اللوائح المُتاحة للعموم. تحقق من بيان الحقائق الرئيسية لقرضك.'
                  : 'The 1%/AED 10,000 statutory cap is confirmed for UAE home loans. For this product type, verify the fee in your Key Facts Statement or loan agreement.'}
              </p>
            )}
          </div>

          {/* Regulatory notes */}
          <div className="text-xs text-gray-500 space-y-0.5 px-1">
            <p>• {isAr ? 'تم إلغاء رسوم التسوية المبكرة البالغة 3% على الرهن العقاري من قبل البنك المركزي الإماراتي.' : 'CBUAE removed the former 3% early settlement fee on mortgages.'}</p>
            <p>• {isAr ? 'يجب على البنوك الالتزام بشروط العقد الأصلي للعملاء الذين تم تغيير رسومهم بأثر رجعي.' : 'Banks must honour original contract terms where fees were changed retroactively.'}</p>
            <p>• {isAr ? 'الهذه الحاسبة للأغراض الإرشادية فقط. تحقق من البنك الخاص بك للحصول على الرقم النهائي.' : 'This calculator is for guidance only. Confirm the final figure with your bank.'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function BRow({
  label, value, accent = 'gray', sub, bold,
}: {
  label: string
  value: string
  accent?: 'gray' | 'red' | 'blue' | 'amber'
  sub?: string
  bold?: boolean
}) {
  const colors = {
    gray: 'text-gray-900',
    red: 'text-red-600',
    blue: 'text-blue-600',
    amber: 'text-amber-700',
  }
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{label}</span>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm font-semibold whitespace-nowrap ${colors[accent]} ${bold ? 'text-base' : ''}`}>{value}</span>
    </div>
  )
}
