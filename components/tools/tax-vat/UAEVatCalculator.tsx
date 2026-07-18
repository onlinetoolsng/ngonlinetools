'use client'

import { useState, useEffect } from 'react'

type Props = { locale: string }

type Mode = 'excl' | 'incl'
type SupplyType = 'standard' | 'zero' | 'exempt'

const UAE_VAT_RATE = 0.05

export default function UAEVatCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [amount, setAmount] = useState<string>('')
  const [mode, setMode] = useState<Mode>('excl')
  const [supplyType, setSupplyType] = useState<SupplyType>('standard')
  const [copied, setCopied] = useState(false)
  const [result, setResult] = useState<{
    net: number
    vat: number
    gross: number
  } | null>(null)

  const labels = isAr
    ? {
        title: 'حاسبة ضريبة القيمة المضافة في الإمارات',
        amount: 'المبلغ',
        modeExcl: 'السعر بدون ضريبة (شائع)',
        modeIncl: 'السعر شامل الضريبة',
        supplyType: 'نوع التوريد',
        standard: 'قياسي (5%)',
        zero: 'صفرية (0%)',
        exempt: 'معفاة',
        calculate: 'احسب',
        reset: 'إعادة تعيين',
        net: 'المبلغ الصافي',
        vat: 'ضريبة القيمة المضافة',
        gross: 'المبلغ الإجمالي',
        copy: 'نسخ النتائج',
        presets: 'مبالغ سريعة',
        disclaimer: 'لأغراض توضيحية فقط. استشر هيئة الضرائب الاتحادية (FTA) أو مستشاراً ضريبياً للحصول على نصيحة مهنية. الأسعار حالية حتى 2026.',
      }
    : {
        title: 'UAE VAT Calculator',
        amount: 'Amount',
        modeExcl: 'Price Excluding VAT (Most Common)',
        modeIncl: 'Price Including VAT',
        supplyType: 'Supply Type',
        standard: 'Standard (5%)',
        zero: 'Zero-Rated (0%)',
        exempt: 'Exempt',
        calculate: 'Calculate',
        reset: 'Reset',
        net: 'Net Amount',
        vat: 'VAT Amount',
        gross: 'Gross Amount (Total)',
        copy: 'Copy Results',
        presets: 'Quick Presets',
        disclaimer: 'For illustrative purposes only. Consult the Federal Tax Authority (FTA) or a qualified tax advisor for professional advice. Rates current as of 2026.',
      }

  // Live calculation
  useEffect(() => {
    const num = parseFloat(amount)
    if (!num || num <= 0) {
      setResult(null)
      return
    }

    let vat = 0
    let net = 0
    let gross = 0

    const isZeroOrExempt = supplyType === 'zero' || supplyType === 'exempt'

    if (mode === 'excl') {
      net = num
      vat = isZeroOrExempt ? 0 : num * UAE_VAT_RATE
      gross = net + vat
    } else {
      gross = num
      vat = isZeroOrExempt ? 0 : (num / 1.05) * UAE_VAT_RATE
      net = gross - vat
    }

    setResult({ net, vat, gross })
  }, [amount, mode, supplyType])

  const formatAED = (n: number) =>
    `AED ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const copyResults = () => {
    if (!result) return
    const text = isAr
      ? `المبلغ الصافي: ${formatAED(result.net)}\nضريبة القيمة المضافة: ${formatAED(result.vat)}\nالمبلغ الإجمالي: ${formatAED(result.gross)}`
      : `Net Amount: ${formatAED(result.net)}\nVAT Amount: ${formatAED(result.vat)}\nGross Amount: ${formatAED(result.gross)}`
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setAmount('')
    setMode('excl')
    setSupplyType('standard')
    setResult(null)
  }

  const presets = [100, 500, 1000, 5000, 10000]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="text-4xl">🇦🇪</span>
          <h1 className="text-3xl font-bold text-gray-900">{labels.title}</h1>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex border border-gray-200 rounded-xl p-1 bg-gray-50">
        <button
          onClick={() => setMode('excl')}
          className={`flex-1 py-3 rounded-lg font-semibold transition ${mode === 'excl' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}
        >
          {labels.modeExcl}
        </button>
        <button
          onClick={() => setMode('incl')}
          className={`flex-1 py-3 rounded-lg font-semibold transition ${mode === 'incl' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}
        >
          {labels.modeIncl}
        </button>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {labels.amount} (AED)
        </label>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-6 pr-4 py-4 text-2xl border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <p className="text-sm text-gray-500 mb-2">{labels.presets}</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((val) => (
            <button
              key={val}
              onClick={() => setAmount(val.toString())}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition"
            >
              {val.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Supply Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {labels.supplyType}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'standard', label: labels.standard },
            { value: 'zero', label: labels.zero },
            { value: 'exempt', label: labels.exempt },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSupplyType(value as SupplyType)}
              className={`py-3 px-4 rounded-xl text-sm font-medium border transition ${
                supplyType === value
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {(supplyType === 'zero' || supplyType === 'exempt') && (
          <p className="mt-2 text-sm text-amber-600">
            {isAr 
              ? 'سيتم حساب ضريبة القيمة المضافة بـ 0% لهذا النوع من التوريد.'
              : 'VAT will be calculated at 0% for this supply type.'}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 space-y-6">
          <div className="text-center">
            <div className="text-emerald-700 text-sm font-semibold tracking-widest">
              {labels.gross}
            </div>
            <div className="text-5xl font-black text-emerald-800 mt-2">
              {formatAED(result.gross)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-emerald-100">
            <div>
              <div className="text-gray-600">{labels.net}</div>
              <div className="text-2xl font-semibold mt-1">{formatAED(result.net)}</div>
            </div>
            <div>
              <div className="text-gray-600">{labels.vat}</div>
              <div className="text-2xl font-semibold mt-1 text-emerald-700">
                {formatAED(result.vat)}
              </div>
            </div>
          </div>

          <button
            onClick={copyResults}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition"
          >
            {copied ? (isAr ? '✓ تم النسخ' : '✓ Copied!') : labels.copy}
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex-1 py-4 border border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition"
        >
          {labels.reset}
        </button>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-500 text-center leading-relaxed max-w-md mx-auto">
        {labels.disclaimer}
      </div>
    </div>
  )
}