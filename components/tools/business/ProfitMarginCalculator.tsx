'use client'

import { useState, useEffect } from 'react'

type Props = { locale: string }

type Country = {
  value: string
  label: string
  currency: string
  cit: number
}

// Standard headline corporate income tax rates (simplified — actual liability
// depends on free zone status, ownership nationality, and thresholds).
const COUNTRIES: Country[] = [
  { value: 'uae', label: 'UAE', currency: 'AED', cit: 0.09 },
  { value: 'saudi', label: 'Saudi Arabia', currency: 'SAR', cit: 0.20 },
  { value: 'qatar', label: 'Qatar', currency: 'QAR', cit: 0.10 },
  { value: 'kuwait', label: 'Kuwait', currency: 'KWD', cit: 0.15 },
  { value: 'bahrain', label: 'Bahrain', currency: 'BHD', cit: 0 },
  { value: 'oman', label: 'Oman', currency: 'OMR', cit: 0.15 },
  { value: 'egypt', label: 'Egypt', currency: 'EGP', cit: 0.225 },
]

export default function ProfitMarginCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [country, setCountry] = useState('uae')
  const [revenue, setRevenue] = useState<string>('')
  const [cogs, setCogs] = useState<string>('')
  const [operatingExpenses, setOperatingExpenses] = useState<string>('')
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const selectedCountry = COUNTRIES.find(c => c.value === country)!

  useEffect(() => {
    const rev = parseFloat(revenue) || 0
    const cost = parseFloat(cogs) || 0
    const opEx = parseFloat(operatingExpenses) || 0

    if (rev <= 0) {
      setResult(null)
      return
    }

    const grossProfit = rev - cost
    const grossMargin = rev > 0 ? (grossProfit / rev) * 100 : 0

    const netProfit = grossProfit - opEx
    const netMargin = rev > 0 ? (netProfit / rev) * 100 : 0

    // Simple estimated tax
    const estimatedTax = netProfit > 0 ? netProfit * selectedCountry.cit : 0
    const profitAfterTax = netProfit - estimatedTax

    setResult({
      grossProfit,
      grossMargin: Math.round(grossMargin * 100) / 100,
      netProfit,
      netMargin: Math.round(netMargin * 100) / 100,
      estimatedTax,
      profitAfterTax,
      currency: selectedCountry.currency,
    })
  }, [revenue, cogs, operatingExpenses, country])

  const formatNum = (n: number) => 
    `${selectedCountry.currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const labels = isAr ? {
    title: 'حاسبة هامش الربح',
    revenue: 'الإيرادات / المبيعات',
    cogs: 'تكلفة البضائع المباعة (COGS)',
    opEx: 'المصروفات التشغيلية',
    country: 'الدولة',
    grossProfit: 'الربح الإجمالي',
    grossMargin: 'هامش الربح الإجمالي',
    netProfit: 'الربح الصافي',
    netMargin: 'هامش الربح الصافي',
    estimatedTax: 'الضرائب التقديرية',
    afterTax: 'الربح بعد الضريبة',
    reset: 'إعادة تعيين',
    copy: 'نسخ النتائج',
    copied: 'تم النسخ!',
    taxNote: 'تقدير مبسط بناءً على معدل الضريبة القياسي. المسؤولية الفعلية تعتمد على هيكل الشركة، والمنطقة الحرة، وجنسية الملكية. استشر مستشارًا ضريبيًا.',
  } : {
    title: 'Profit Margin Calculator',
    revenue: 'Revenue / Sales',
    cogs: 'Cost of Goods Sold (COGS)',
    opEx: 'Operating Expenses',
    country: 'Country',
    grossProfit: 'Gross Profit',
    grossMargin: 'Gross Profit Margin',
    netProfit: 'Net Profit',
    netMargin: 'Net Profit Margin',
    estimatedTax: 'Estimated Tax',
    afterTax: 'Profit After Tax',
    reset: 'Reset',
    copy: 'Copy Results',
    copied: 'Copied!',
    taxNote: 'Simplified estimate using the standard headline tax rate. Actual liability depends on entity structure, free zone status, and ownership nationality. Consult a tax advisor.',
  }

  const copyResults = () => {
    if (!result) return
    const text = isAr 
      ? `هامش الربح الإجمالي: ${result.grossMargin}%\nالربح الصافي: ${result.netMargin}%\n${formatNum(result.netProfit)}`
      : `Gross Margin: ${result.grossMargin}%\nNet Margin: ${result.netMargin}%\n${formatNum(result.netProfit)}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setRevenue('')
    setCogs('')
    setOperatingExpenses('')
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{labels.title}</h1>
      </div>

      {/* Country Selector */}
      <div>
        <label className="block text-sm font-semibold mb-2">{labels.country}</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full p-4 border border-gray-200 rounded-2xl text-lg"
        >
          {COUNTRIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2">{labels.revenue}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {selectedCountry.currency}
            </span>
            <input
              type="number"
              min="0"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="0.00"
              className="w-full p-4 pl-16 text-2xl border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">{labels.cogs}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {selectedCountry.currency}
            </span>
            <input
              type="number"
              min="0"
              value={cogs}
              onChange={(e) => setCogs(e.target.value)}
              placeholder="0.00"
              className="w-full p-4 pl-16 text-2xl border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">{labels.opEx}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {selectedCountry.currency}
            </span>
            <input
              type="number"
              min="0"
              value={operatingExpenses}
              onChange={(e) => setOperatingExpenses(e.target.value)}
              placeholder="0.00"
              className="w-full p-4 pl-16 text-2xl border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-gray-600">{labels.grossMargin}</div>
              <div className="text-4xl font-bold text-emerald-700">{result.grossMargin}%</div>
            </div>
            <div>
              <div className="text-gray-600">{labels.netMargin}</div>
              <div className="text-4xl font-bold text-emerald-700">{result.netMargin}%</div>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t">
            <div className="flex justify-between"><span>{labels.grossProfit}</span><span className="font-semibold">{formatNum(result.grossProfit)}</span></div>
            <div className="flex justify-between"><span>{labels.netProfit}</span><span className="font-semibold">{formatNum(result.netProfit)}</span></div>
            <div className="flex justify-between"><span>{labels.estimatedTax}</span><span className="font-semibold text-red-600">{formatNum(result.estimatedTax)}</span></div>
            <div className="flex justify-between border-t pt-3 font-bold"><span>{labels.afterTax}</span><span>{formatNum(result.profitAfterTax)}</span></div>
          </div>

          <p className="text-xs text-gray-500 bg-white/60 rounded-lg px-3 py-2">{labels.taxNote}</p>

          <button onClick={copyResults} className="w-full py-4 bg-emerald-600 text-white font-semibold rounded-2xl">
            {copied ? labels.copied : labels.copy}
          </button>
        </div>
      )}

      <button onClick={reset} className="w-full py-4 border border-gray-300 rounded-2xl font-semibold">
        {labels.reset}
      </button>
    </div>
  )
}