'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Nigeria Tax Act 2025 (effective 1 January 2026) ───────────────────────
// Standard VAT rate: 7.5% (unchanged since the Finance Act 2019 increase).
// Zero-rated: basic food items, agricultural equipment/inputs, baby products,
// sanitary products, exports, shared passenger road transport.
// Exempt: healthcare services & medicines, education services, rent on
// accommodation. (Zero-rated and exempt both work out to 0% VAT charged —
// the legal difference is about input VAT recovery, which this calculator
// doesn't model; it's a consumer-facing price calculator, not a filing tool.)
const VAT_RATE = 0.075

type Mode = 'excl' | 'incl'
type SupplyType = 'standard' | 'zero' | 'exempt'

function formatNaira(value: number) {
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function VATCalculator(_props: { locale: string }) {
  const [amount, setAmount] = useState<string>('')
  const [mode, setMode] = useState<Mode>('excl')
  const [supplyType, setSupplyType] = useState<SupplyType>('standard')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const num = parseFloat(amount)
    if (!num || num <= 0) return null

    const isZeroOrExempt = supplyType === 'zero' || supplyType === 'exempt'
    const rate = isZeroOrExempt ? 0 : VAT_RATE

    let net: number
    let vat: number
    let gross: number

    if (mode === 'excl') {
      net = num
      vat = net * rate
      gross = net + vat
    } else {
      gross = num
      vat = isZeroOrExempt ? 0 : (gross * rate) / (1 + rate)
      net = gross - vat
    }

    return { net, vat, gross }
  }, [amount, mode, supplyType])

  const reset = () => {
    setAmount('')
    setMode('excl')
    setSupplyType('standard')
  }

  const copyResult = () => {
    if (!result) return
    const text = `Net: ${formatNaira(result.net)} | VAT (7.5%): ${formatNaira(result.vat)} | Gross: ${formatNaira(result.gross)}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Amount + mode */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Amount (₦)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
            ₦
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(amount)}
            onChange={e => setAmount(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="0.00"
          />
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => setMode('excl')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
              mode === 'excl'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Add VAT (excl. VAT)
          </button>
          <button
            type="button"
            onClick={() => setMode('incl')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
              mode === 'incl'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Extract VAT (incl. VAT)
          </button>
        </div>
      </div>

      {/* Supply type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Supply Type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'standard', label: 'Standard (7.5%)' },
            { value: 'zero', label: 'Zero-Rated' },
            { value: 'exempt', label: 'Exempt' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSupplyType(value as SupplyType)}
              className={`py-2.5 px-2 rounded-xl text-xs sm:text-sm font-medium border transition ${
                supplyType === value
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {(supplyType === 'zero' || supplyType === 'exempt') && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            {supplyType === 'zero'
              ? 'Zero-rated: 0% VAT is charged. Examples under the Nigeria Tax Act 2025 include basic food items, baby products, and exports.'
              : 'Exempt: 0% VAT is charged. Examples include healthcare, education services, and residential rent.'}
          </p>
        )}
      </div>

      {/* Results */}
      {result ? (
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">Net Amount</span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.net)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">
              VAT {supplyType === 'standard' ? '(7.5%)' : '(0%)'}
            </span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.vat)}</span>
          </div>
          <div className="flex justify-between border-t border-indigo-200 pt-3">
            <span className="font-bold text-indigo-900">Gross Amount</span>
            <span className="text-2xl font-black text-indigo-900">{formatNaira(result.gross)}</span>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">Enter an amount to calculate VAT</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={copyResult}
          disabled={!result}
          className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy Result'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors"
        >
          Reset
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Nigeria's standard VAT rate is 7.5% under the Nigeria Tax Act 2025 (effective 1 January
        2026). Some goods and services are zero-rated or exempt — check the FIRS/NRS guidance or
        consult an accountant if you're unsure which category applies to your transaction. This
        calculator is for guidance only and doesn't constitute tax advice.
      </p>
    </div>
  )
}
