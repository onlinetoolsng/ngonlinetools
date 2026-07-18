'use client'

import { useState } from 'react'

type Props = { locale: string }

const COUNTRIES = [
  { value: 'uae',     label: 'UAE',          currency: 'AED', gosi: false },
  { value: 'saudi',   label: 'Saudi Arabia', currency: 'SAR', gosi: true  },
  { value: 'qatar',   label: 'Qatar',        currency: 'QAR', gosi: false },
  { value: 'kuwait',  label: 'Kuwait',       currency: 'KWD', gosi: false },
  { value: 'bahrain', label: 'Bahrain',      currency: 'BHD', gosi: false },
  { value: 'oman',    label: 'Oman',         currency: 'OMR', gosi: false },
  { value: 'egypt',   label: 'Egypt',        currency: 'EGP', gosi: false },
]

const NATIONALITIES = [
  { value: 'expat',   label: 'Expatriate / Non-national' },
  { value: 'national', label: 'GCC National' },
]

type Result = {
  grossMonthly: number
  deductions: number
  netMonthly: number
  annualGross: number
  annualNet: number
  currency: string
  gosiDeducted: boolean
}

function formatNum(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function SalaryCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [gross, setGross] = useState('')
  const [country, setCountry] = useState('uae')
  const [nationality, setNationality] = useState('expat')
  const [result, setResult] = useState<Result | null>(null)

  const selectedCountry = COUNTRIES.find(c => c.value === country)!

  function calculate() {
    const grossVal = parseFloat(gross)
    if (!grossVal || grossVal <= 0) return

    let deductions = 0
    let gosiDeducted = false

    // KSA GOSI: expats pay 2%, nationals pay 9%
    if (country === 'saudi') {
      deductions = nationality === 'national'
        ? grossVal * 0.09
        : grossVal * 0.02
      gosiDeducted = true
    }

    // Egypt income tax (simplified flat estimate for display)
    if (country === 'egypt') {
      if (grossVal > 7667) deductions = grossVal * 0.20
      else if (grossVal > 3833) deductions = grossVal * 0.10
    }

    const net = grossVal - deductions

    setResult({
      grossMonthly: grossVal,
      deductions,
      netMonthly: net,
      annualGross: grossVal * 12,
      annualNet: net * 12,
      currency: selectedCountry.currency,
      gosiDeducted,
    })
  }

  function reset() {
    setGross('')
    setCountry('uae')
    setNationality('expat')
    setResult(null)
  }

  const labels = isAr
    ? {
        gross: 'الراتب الشهري الإجمالي',
        country: 'الدولة',
        nationality: 'الجنسية',
        calculate: 'احسب',
        reset: 'إعادة تعيين',
        results: 'النتائج',
        netMonthly: 'صافي الراتب الشهري',
        deductions: 'الخصومات',
        annualGross: 'الراتب الإجمالي السنوي',
        annualNet: 'صافي الراتب السنوي',
        noDeductions: 'لا توجد خصومات إلزامية',
        gosi: 'اشتراك التأمينات الاجتماعية',
        enterAmount: 'أدخل المبلغ',
      }
    : {
        gross: 'Gross Monthly Salary',
        country: 'Country',
        nationality: 'Nationality',
        calculate: 'Calculate',
        reset: 'Reset',
        results: 'Your Results',
        netMonthly: 'Net Monthly Salary',
        deductions: 'Deductions',
        annualGross: 'Annual Gross',
        annualNet: 'Annual Net',
        noDeductions: 'No mandatory deductions',
        gosi: 'Social Insurance (GOSI)',
        enterAmount: 'Enter amount',
      }

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gross salary */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {labels.gross}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {selectedCountry.currency}
            </span>
            <input
              type="number"
              min="0"
              value={gross}
              onChange={e => setGross(e.target.value)}
              placeholder={labels.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {labels.country}
          </label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {COUNTRIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Nationality */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {labels.nationality}
          </label>
          <select
            value={nationality}
            onChange={e => setNationality(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {NATIONALITIES.map(n => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {labels.calculate}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {labels.reset}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
          <h3 className="font-bold text-gray-900">{labels.results}</h3>

          {/* Net monthly — hero result */}
          <div className="bg-emerald-600 rounded-xl p-4 text-white">
            <div className="text-sm opacity-80 mb-1">{labels.netMonthly}</div>
            <div className="text-3xl font-black">
              {formatNum(result.netMonthly, result.currency)}
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <ResultRow
              label={isAr ? 'الراتب الإجمالي' : 'Gross Salary'}
              value={formatNum(result.grossMonthly, result.currency)}
            />
            <ResultRow
              label={result.gosiDeducted ? labels.gosi : labels.noDeductions}
              value={result.deductions > 0
                ? `− ${formatNum(result.deductions, result.currency)}`
                : '—'}
              negative={result.deductions > 0}
            />
            <div className="border-t border-gray-200 pt-3">
              <ResultRow
                label={labels.annualGross}
                value={formatNum(result.annualGross, result.currency)}
              />
              <ResultRow
                label={labels.annualNet}
                value={formatNum(result.annualNet, result.currency)}
                highlight
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultRow({
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
