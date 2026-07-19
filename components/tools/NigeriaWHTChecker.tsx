'use client'

import { useMemo, useState } from 'react'
import {
  WHT_CATEGORIES,
  getRateForCategory,
  type Residency,
  type EntityType,
} from '@/lib/data/whtRates'

function formatNaira(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`
}

export function NigeriaWHTChecker(_props: { locale: string }) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>('rent')
  const [residency, setResidency] = useState<Residency>('resident')
  const [entityType, setEntityType] = useState<EntityType>('corporate')
  const [exampleAmount, setExampleAmount] = useState('1000000')

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return WHT_CATEGORIES
    const q = search.toLowerCase()
    return WHT_CATEGORIES.filter(
      c => c.label.toLowerCase().includes(q) || c.keywords.some(k => k.includes(q))
    )
  }, [search])

  const selected = WHT_CATEGORIES.find(c => c.id === selectedId) ?? WHT_CATEGORIES[0]
  const rate = getRateForCategory(selected, residency, entityType)
  const amount = Math.max(0, parseFloat(exampleAmount) || 0)
  const whtAmount = rate !== null ? (amount * rate) / 100 : 0
  const netAmount = amount - whtAmount

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Search transaction type
        </label>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="e.g. rent, consultancy, dividends..."
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
      </div>

      {/* Category list */}
      <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {filteredCategories.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedId(c.id)}
            className={`text-left px-3.5 py-2.5 rounded-xl border text-sm font-medium transition ${
              selectedId === c.id
                ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {c.label}
          </button>
        ))}
        {filteredCategories.length === 0 && (
          <p className="col-span-2 text-sm text-gray-500 px-1">
            No match found — for transaction types not listed here, consult the Nigeria Revenue Service directly.
          </p>
        )}
      </div>

      {/* Recipient details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Recipient residency</label>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setResidency('resident')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium ${residency === 'resident' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              Resident
            </button>
            <button
              type="button"
              onClick={() => setResidency('nonResident')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium ${residency === 'nonResident' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              Non-Resident
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Entity type</label>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setEntityType('corporate')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium ${entityType === 'corporate' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              Corporate
            </button>
            <button
              type="button"
              onClick={() => setEntityType('individual')}
              className={`flex-1 px-3 py-2.5 text-sm font-medium ${entityType === 'individual' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              Individual
            </button>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <div className="text-sm font-medium text-indigo-900 mb-1">{selected.label}</div>
        {rate === null ? (
          <div className="text-lg font-bold text-indigo-900">Not applicable to this combination</div>
        ) : (
          <>
            <div className="text-4xl font-black text-indigo-900 mb-1">{rate}%</div>
            <div className="text-xs text-indigo-500 mb-4">
              {selected.finalTaxNonResident && residency === 'nonResident' ? 'Usually a final tax for non-residents' : 'Creditable against final tax liability'}
            </div>
          </>
        )}
        <p className="text-sm text-indigo-900/80 leading-relaxed">{selected.notes}</p>
      </div>

      {/* Example calculation */}
      {rate !== null && (
        <div className="border border-gray-100 rounded-xl p-4">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Example: payment amount (₦)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={exampleAmount}
            onChange={e => setExampleAmount(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-3"
          />
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-gray-500 text-xs">Gross</div>
              <div className="font-semibold text-gray-900">{formatNaira(amount)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">WHT ({rate}%)</div>
              <div className="font-semibold text-gray-900">{formatNaira(whtAmount)}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Net Paid</div>
              <div className="font-semibold text-gray-900">{formatNaira(netAmount)}</div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        Rates as of 2026, per the Deduction of Tax at Source (Withholding) Regulations 2024, carried
        into the Nigeria Tax Act 2025 framework. Rates can change — this is for reference only, not
        tax advice. For amounts eligible for the small business exemption, or non-resident payments
        that may qualify for a reduced treaty rate, confirm with the Nigeria Revenue Service or a
        licensed tax professional. Payments are remitted by the 21st of the month following
        deduction.
      </p>
    </div>
  )
}
