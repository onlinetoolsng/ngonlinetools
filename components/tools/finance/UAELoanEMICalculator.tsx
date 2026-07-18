'use client'

import { useState, useMemo } from 'react'

type Props = { locale: string }

// Country config: max loan multiplier, max tenure months, max DBR %
const COUNTRY_CONFIG = {
  uae:     { label: 'UAE',          currency: 'AED', maxMultiplier: 20, maxTenure: 48, maxDBR: 50 },
  saudi:   { label: 'Saudi Arabia', currency: 'SAR', maxMultiplier: 20, maxTenure: 60, maxDBR: 33 },
  kuwait:  { label: 'Kuwait',       currency: 'KWD', maxMultiplier: 25, maxTenure: 60, maxDBR: 40 },
  qatar:   { label: 'Qatar',        currency: 'QAR', maxMultiplier: 18, maxTenure: 60, maxDBR: 50 },
  bahrain: { label: 'Bahrain',      currency: 'BHD', maxMultiplier: 15, maxTenure: 60, maxDBR: 50 },
  oman:    { label: 'Oman',         currency: 'OMR', maxMultiplier: 15, maxTenure: 60, maxDBR: 50 },
}

type CountryKey = keyof typeof COUNTRY_CONFIG

interface AmortizationRow {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

interface CalcResult {
  emi: number
  totalPayable: number
  totalInterest: number
  dbr: number
  exceedsMaxLoan: boolean
  exceedsDBR: boolean
  amortization: AmortizationRow[]
  currency: string
}

function calcEMI(
  principal: number,
  annualRate: number,
  months: number,
): number {
  if (annualRate === 0) return principal / months
  const r = annualRate / 12 / 100
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function buildAmortization(
  principal: number,
  annualRate: number,
  months: number,
  emi: number,
): AmortizationRow[] {
  const r = annualRate / 12 / 100
  const rows: AmortizationRow[] = []
  let balance = principal
  for (let m = 1; m <= months; m++) {
    const interest = balance * r
    const prinPaid = emi - interest
    balance = Math.max(0, balance - prinPaid)
    rows.push({
      month: m,
      payment: emi,
      principal: prinPaid,
      interest,
      balance,
    })
  }
  return rows
}

function fmt(n: number, currency: string, decimals = 0) {
  return `${currency} ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`
}

export default function UAELoanEMICalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [country, setCountry] = useState<CountryKey>('uae')
  const [income, setIncome] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [tenure, setTenure] = useState('24')
  const [rate, setRate] = useState('9')
  const [processingFee, setProcessingFee] = useState('')
  const [showAmortization, setShowAmortization] = useState(false)

  const config = COUNTRY_CONFIG[country]

  const result = useMemo<CalcResult | null>(() => {
    const P = parseFloat(loanAmount)
    const n = parseInt(tenure)
    const r = parseFloat(rate)
    const inc = parseFloat(income)
    if (!P || !n || isNaN(r) || P <= 0 || n <= 0) return null

    const emi = calcEMI(P, r, n)
    const totalPayable = emi * n
    const totalInterest = totalPayable - P
    const dbr = inc > 0 ? (emi / inc) * 100 : 0
    const exceedsMaxLoan = inc > 0 && P > inc * config.maxMultiplier
    const exceedsDBR = inc > 0 && dbr > config.maxDBR
    const amortization = buildAmortization(P, r, n, emi)

    return {
      emi,
      totalPayable,
      totalInterest,
      dbr,
      exceedsMaxLoan,
      exceedsDBR,
      amortization,
      currency: config.currency,
    }
  }, [loanAmount, tenure, rate, income, country, config])

  function downloadCSV() {
    if (!result) return
    const header = 'Month,Payment,Principal,Interest,Balance\n'
    const rows = result.amortization
      .map(r => `${r.month},${r.payment.toFixed(2)},${r.principal.toFixed(2)},${r.interest.toFixed(2)},${r.balance.toFixed(2)}`)
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'uae-loan-amortization.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function reset() {
    setIncome('')
    setLoanAmount('')
    setTenure('24')
    setRate('9')
    setProcessingFee('')
    setShowAmortization(false)
    setCountry('uae')
  }

  const t = isAr
    ? {
        title: 'حاسبة القرض الشخصي',
        country: 'الدولة',
        income: 'الراتب الشهري',
        loanAmount: 'مبلغ القرض',
        tenure: 'مدة القرض (أشهر)',
        rate: 'معدل الفائدة السنوي (%)',
        processingFee: 'رسوم المعالجة (اختياري)',
        calculate: 'احسب القسط',
        reset: 'إعادة تعيين',
        results: 'نتيجة الحساب',
        monthlyEMI: 'القسط الشهري',
        totalPayable: 'إجمالي المبلغ المدفوع',
        totalInterest: 'إجمالي الفوائد',
        dbr: 'نسبة عبء الدين',
        exceedsMaxLoan: '⚠️ يتجاوز الحد الأقصى للقرض',
        exceedsDBR: '⚠️ يتجاوز الحد المسموح به لعبء الدين',
        schedule: 'جدول السداد',
        hideSchedule: 'إخفاء الجدول',
        showSchedule: 'عرض جدول السداد',
        downloadCSV: 'تحميل CSV',
        month: 'الشهر',
        payment: 'القسط',
        principalPaid: 'الأصل',
        interestPaid: 'الفائدة',
        balance: 'الرصيد',
        disclaimer: 'هذه الحاسبة للأغراض التوضيحية فقط. المعدلات والموافقة تعتمد على البنك وملفك الشخصي. ليست نصيحة مالية.',
        enterAmount: 'أدخل المبلغ',
        feeNote: 'سيُضاف إلى التكلفة الإجمالية',
        maxLoanNote: 'الحد الأقصى للقرض',
        dbrLabel: 'عبء الدين الحالي',
        ofIncome: 'من الدخل',
        maxAllowed: 'الحد الأقصى',
      }
    : {
        title: 'Personal Loan EMI Calculator',
        country: 'Country',
        income: 'Monthly Salary (AED)',
        loanAmount: 'Loan Amount',
        tenure: 'Tenure (Months)',
        rate: 'Annual Interest Rate (%)',
        processingFee: 'Processing Fee (optional)',
        calculate: 'Calculate EMI',
        reset: 'Reset',
        results: 'Your Results',
        monthlyEMI: 'Monthly EMI',
        totalPayable: 'Total Payable',
        totalInterest: 'Total Interest',
        dbr: 'Debt Burden Ratio',
        exceedsMaxLoan: `⚠️ Exceeds max loan (${config.maxMultiplier}× salary)`,
        exceedsDBR: `⚠️ Exceeds max DBR (${config.maxDBR}%)`,
        schedule: 'Amortization Schedule',
        hideSchedule: 'Hide Schedule',
        showSchedule: 'View Amortization Schedule',
        downloadCSV: 'Download CSV',
        month: 'Month',
        payment: 'Payment',
        principalPaid: 'Principal',
        interestPaid: 'Interest',
        balance: 'Balance',
        disclaimer:
          'This is an illustrative calculator only. Actual rates, fees, and approval depend on the bank and your profile. Results do not constitute financial advice or a loan offer. Consult a licensed bank or financial advisor.',
        enterAmount: 'Enter amount',
        feeNote: 'Added to total cost',
        maxLoanNote: `Max loan: ${config.maxMultiplier}× salary`,
        dbrLabel: 'Your DBR',
        ofIncome: 'of income',
        maxAllowed: `max ${config.maxDBR}%`,
      }

  // DBR traffic light
  const dbrColor =
    !result || !parseFloat(income)
      ? 'text-gray-500'
      : result.exceedsDBR
      ? 'text-red-500'
      : result.dbr > config.maxDBR * 0.8
      ? 'text-amber-500'
      : 'text-emerald-600'

  const processingFeeVal = parseFloat(processingFee) || 0
  const totalCost = result ? result.totalPayable + processingFeeVal : 0

  return (
    <div className="space-y-6">
      {/* Country selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.country}</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(COUNTRY_CONFIG) as CountryKey[]).map(k => (
            <button
              key={k}
              onClick={() => setCountry(k)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                country === k
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-200 text-gray-600 hover:border-emerald-400'
              }`}
            >
              {COUNTRY_CONFIG[k].label}
            </button>
          ))}
        </div>
      </div>

      {/* Input grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Monthly income */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.income}
            <span className="ml-1 font-normal text-gray-500 text-xs">({t.maxLoanNote})</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {config.currency}
            </span>
            <input
              type="number"
              min="0"
              value={income}
              onChange={e => setIncome(e.target.value)}
              placeholder={t.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Loan amount */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.loanAmount}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {config.currency}
            </span>
            <input
              type="number"
              min="0"
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              placeholder={t.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
          {/* Max loan hint */}
          {income && parseFloat(income) > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Max eligible: {fmt(parseFloat(income) * config.maxMultiplier, config.currency)}
            </p>
          )}
        </div>

        {/* Tenure */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.tenure}
            <span className="ml-1 font-normal text-gray-500 text-xs">(max {config.maxTenure})</span>
          </label>
          <input
            type="number"
            min="1"
            max={config.maxTenure}
            value={tenure}
            onChange={e => {
              const v = Math.min(parseInt(e.target.value) || 1, config.maxTenure)
              setTenure(String(v))
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          {/* Tenure quick picks */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {[12, 24, 36, 48].filter(m => m <= config.maxTenure).map(m => (
              <button
                key={m}
                onClick={() => setTenure(String(m))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  tenure === String(m)
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-gray-200 text-gray-500 hover:border-emerald-400'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Interest rate */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.rate}
            <span className="ml-1 font-normal text-gray-500 text-xs">(reducing balance)</span>
          </label>
          <input
            type="number"
            min="0"
            max="30"
            step="0.1"
            value={rate}
            onChange={e => setRate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          {/* Rate quick picks */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {['7', '9', '11', '13'].map(r => (
              <button
                key={r}
                onClick={() => setRate(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  rate === r
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-gray-200 text-gray-500 hover:border-emerald-400'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>
        </div>

        {/* Processing fee */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.processingFee}
            <span className="ml-1 font-normal text-gray-500 text-xs">({t.feeNote})</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {config.currency}
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
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {/* results update live via useMemo */}}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors cursor-default"
        >
          {result ? '✓ ' : ''}{t.calculate}
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
          <h3 className="font-bold text-gray-900">{t.results}</h3>

          {/* Hero — Monthly EMI */}
          <div className="bg-emerald-600 rounded-xl p-4 text-white">
            <div className="text-sm opacity-80 mb-1">{t.monthlyEMI}</div>
            <div className="text-3xl font-black">{fmt(result.emi, result.currency, 2)}</div>
          </div>

          {/* Regulatory warnings */}
          {result.exceedsMaxLoan && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
              {t.exceedsMaxLoan}
            </div>
          )}
          {result.exceedsDBR && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
              {t.exceedsDBR}
            </div>
          )}

          {/* Breakdown rows */}
          <div className="space-y-3">
            <ResultRow label={isAr ? 'مبلغ القرض' : 'Loan Principal'} value={fmt(parseFloat(loanAmount), result.currency)} />
            <ResultRow label={t.totalInterest} value={fmt(result.totalInterest, result.currency)} />
            {processingFeeVal > 0 && (
              <ResultRow label={isAr ? 'رسوم المعالجة' : 'Processing Fee'} value={fmt(processingFeeVal, result.currency)} />
            )}
            <div className="border-t border-gray-200 pt-3">
              <ResultRow
                label={processingFeeVal > 0 ? (isAr ? 'إجمالي التكلفة (شامل الرسوم)' : 'Total Cost (incl. fees)') : t.totalPayable}
                value={fmt(processingFeeVal > 0 ? totalCost : result.totalPayable, result.currency)}
                highlight
              />
            </div>
          </div>

          {/* DBR indicator */}
          {parseFloat(income) > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">{t.dbrLabel}</span>
                <span className={`font-bold ${dbrColor}`}>
                  {fmtPct(result.dbr)} <span className="font-normal text-gray-500 text-xs">({t.maxAllowed})</span>
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    result.exceedsDBR ? 'bg-red-500' : result.dbr > config.maxDBR * 0.8 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min((result.dbr / config.maxDBR) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {isAr
                  ? `هذا القسط يستهلك ${fmtPct(result.dbr)} من دخلك الشهري`
                  : `This EMI uses ${fmtPct(result.dbr)} of your monthly income`}
              </p>
            </div>
          )}

          {/* Amortization toggle */}
          <div className="space-y-3">
            <button
              onClick={() => setShowAmortization(v => !v)}
              className="w-full text-center text-sm text-emerald-700 font-semibold hover:text-emerald-900 transition-colors py-2"
            >
              {showAmortization ? `▲ ${t.hideSchedule}` : `▼ ${t.showSchedule}`}
            </button>

            {showAmortization && (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={downloadCSV}
                    className="text-xs font-semibold text-gray-500 hover:text-emerald-700 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    ↓ {t.downloadCSV}
                  </button>
                </div>
                <div className="overflow-auto max-h-72 rounded-xl border border-gray-100">
                  <table className="w-full text-xs text-gray-700 border-collapse">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        {[t.month, t.payment, t.principalPaid, t.interestPaid, t.balance].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.amortization.map((row, i) => (
                        <tr key={row.month} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 font-medium">{row.month}</td>
                          <td className="px-3 py-2">{fmt(row.payment, result.currency, 2)}</td>
                          <td className="px-3 py-2 text-emerald-700">{fmt(row.principal, result.currency, 2)}</td>
                          <td className="px-3 py-2 text-red-500">{fmt(row.interest, result.currency, 2)}</td>
                          <td className="px-3 py-2 text-gray-500">{fmt(row.balance, result.currency, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
            ⚠️ {t.disclaimer}
          </p>
        </div>
      )}
    </div>
  )
}

function ResultRow({
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
