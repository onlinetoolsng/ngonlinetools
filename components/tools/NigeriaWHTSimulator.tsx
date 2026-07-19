'use client'

import { useMemo, useState } from 'react'
import {
  WHT_CATEGORIES,
  getRateForCategory,
  checkSmallBusinessExemption,
  type Residency,
  type EntityType,
} from '@/lib/data/whtRates'

function formatNaira(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`
}

const PRESETS = [
  { label: 'Office rent to landlord', categoryId: 'rent', amount: 500_000, residency: 'resident' as Residency, entity: 'individual' as EntityType },
  { label: 'Dividend payout', categoryId: 'dividends-interest', amount: 2_000_000, residency: 'resident' as Residency, entity: 'individual' as EntityType },
  { label: 'Consultancy invoice', categoryId: 'professional-fees', amount: 1_000_000, residency: 'resident' as Residency, entity: 'corporate' as EntityType },
]

export function NigeriaWHTSimulator(_props: { locale: string }) {
  const [categoryId, setCategoryId] = useState('rent')
  const [amount, setAmount] = useState('1000000')
  const [residency, setResidency] = useState<Residency>('resident')
  const [entityType, setEntityType] = useState<EntityType>('corporate')
  const [hasTIN, setHasTIN] = useState(true)
  const [checkExemption, setCheckExemption] = useState(false)
  const [annualTurnover, setAnnualTurnover] = useState('20000000')
  const [fixedAssets, setFixedAssets] = useState('5000000')
  const [isProfessionalServices, setIsProfessionalServices] = useState(false)
  const [monthlyTransactionTotal, setMonthlyTransactionTotal] = useState('1000000')
  const [copied, setCopied] = useState(false)

  const category = WHT_CATEGORIES.find(c => c.id === categoryId) ?? WHT_CATEGORIES[0]
  const isPassiveIncome = category.id === 'dividends-interest'

  const result = useMemo(() => {
    const gross = Math.max(0, parseFloat(amount) || 0)
    const baseRate = getRateForCategory(category, residency, entityType)

    let exemption: { exempt: boolean; reason: string } | null = null
    if (checkExemption) {
      exemption = checkSmallBusinessExemption({
        annualTurnover: Math.max(0, parseFloat(annualTurnover) || 0),
        fixedAssets: Math.max(0, parseFloat(fixedAssets) || 0),
        isProfessionalServices,
        monthlyTransactionTotal: Math.max(0, parseFloat(monthlyTransactionTotal) || 0),
        hasValidTIN: hasTIN,
      })
    }

    const applicable = baseRate !== null
    const isExempt = exemption?.exempt ?? false
    const noTINPenaltyApplies = applicable && !hasTIN && !isPassiveIncome && !isExempt

    let effectiveRate: number | null = null
    if (applicable) {
      effectiveRate = isExempt ? 0 : (baseRate as number)
      if (noTINPenaltyApplies) {
        effectiveRate = Math.min(effectiveRate * 2, 20)
      }
    }

    const whtAmount = effectiveRate !== null ? (gross * effectiveRate) / 100 : 0
    const netAmount = gross - whtAmount

    return { gross, baseRate, effectiveRate, whtAmount, netAmount, exemption, applicable, noTINPenaltyApplies }
  }, [amount, category, residency, entityType, checkExemption, annualTurnover, fixedAssets, isProfessionalServices, monthlyTransactionTotal, hasTIN, isPassiveIncome])

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setCategoryId(preset.categoryId)
    setAmount(String(preset.amount))
    setResidency(preset.residency)
    setEntityType(preset.entity)
  }

  const copyResult = () => {
    const text = `${category.label}: Gross ${formatNaira(result.gross)} | WHT ${result.effectiveRate ?? 0}% (${formatNaira(result.whtAmount)}) | Net ${formatNaira(result.netAmount)}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Transaction type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transaction type</label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        >
          {WHT_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gross payment amount (₦)</label>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
      </div>

      {/* Recipient */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Recipient residency</label>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button type="button" onClick={() => setResidency('resident')} className={`flex-1 px-3 py-2.5 text-sm font-medium ${residency === 'resident' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Resident</button>
            <button type="button" onClick={() => setResidency('nonResident')} className={`flex-1 px-3 py-2.5 text-sm font-medium ${residency === 'nonResident' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Non-Resident</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Entity type</label>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button type="button" onClick={() => setEntityType('corporate')} className={`flex-1 px-3 py-2.5 text-sm font-medium ${entityType === 'corporate' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Corporate</button>
            <button type="button" onClick={() => setEntityType('individual')} className={`flex-1 px-3 py-2.5 text-sm font-medium ${entityType === 'individual' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Individual</button>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={hasTIN}
          onChange={e => setHasTIN(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-600">Recipient has a valid Tax Identification Number (TIN) — without one, the rate doubles (capped at 20%) for most transaction types</span>
      </label>

      {/* Small business exemption check */}
      <details className="group" open={checkExemption}>
        <summary
          className="text-sm font-medium text-indigo-700 hover:text-indigo-800 cursor-pointer list-none flex items-center gap-1"
          onClick={e => { e.preventDefault(); setCheckExemption(v => !v) }}
        >
          <span className={`transition-transform inline-block ${checkExemption ? 'rotate-90' : ''}`}>▸</span>
          Check small business WHT exemption
        </summary>
        {checkExemption && (
          <div className="mt-3 space-y-3 border border-gray-100 rounded-xl p-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Annual turnover (₦)</label>
                <input type="number" min={0} value={annualTurnover} onChange={e => setAnnualTurnover(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Total fixed assets (₦)</label>
                <input type="number" min={0} value={fixedAssets} onChange={e => setFixedAssets(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">This month's total transactions with this payer (₦)</label>
                <input type="number" min={0} value={monthlyTransactionTotal} onChange={e => setMonthlyTransactionTotal(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 mt-5">
                <input type="checkbox" checked={isProfessionalServices} onChange={e => setIsProfessionalServices(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                <span className="text-xs text-gray-600">Business provides professional services</span>
              </label>
            </div>
            {result.exemption && (
              <p className={`text-xs rounded-lg px-3 py-2 ${result.exemption.exempt ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
                {result.exemption.exempt ? '✓ Exempt: ' : '✗ Not exempt: '}{result.exemption.reason}
              </p>
            )}
          </div>
        )}
      </details>

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        {!result.applicable ? (
          <p className="text-sm text-indigo-900">WHT does not apply to this combination for this transaction type.</p>
        ) : (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">Gross Amount</span>
              <span className="font-semibold text-indigo-900">{formatNaira(result.gross)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">
                WHT Rate {result.exemption?.exempt && <span className="text-green-700">(exempt)</span>}
                {result.noTINPenaltyApplies && <span className="text-red-600"> (no TIN — doubled)</span>}
              </span>
              <span className="font-semibold text-indigo-900">{result.effectiveRate}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">WHT Deducted</span>
              <span className="font-semibold text-indigo-900">− {formatNaira(result.whtAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-indigo-200 pt-3">
              <span className="font-bold text-indigo-900">Net Amount Paid</span>
              <div className="text-2xl font-black text-indigo-900">{formatNaira(result.netAmount)}</div>
            </div>
            <div className="text-xs text-indigo-500">
              {category.finalTaxNonResident && residency === 'nonResident'
                ? 'This is usually a final tax for non-residents.'
                : 'Creditable — the recipient can offset this against their own tax liability using the WHT credit note.'}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={copyResult} className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl transition-colors">
          {copied ? '✓ Copied!' : 'Copy Result'}
        </button>
        <button type="button" onClick={() => window.print()} className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors">
          Print
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Rates as of 2026, per the Deduction of Tax at Source (Withholding) Regulations 2024, carried
        into the Nigeria Tax Act 2025 framework. The payer remits withheld tax to the Nigeria Revenue
        Service (companies) or the relevant State Internal Revenue Service (individuals) by the 21st
        of the month following deduction, and issues the recipient a WHT credit note. This simulator
        is for reference only and isn't tax advice — confirm your specific situation, including any
        applicable Double Taxation Agreement, with the NRS or a licensed tax professional.
      </p>
    </div>
  )
}
