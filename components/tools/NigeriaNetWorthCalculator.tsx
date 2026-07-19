'use client'

import { useEffect, useMemo, useState } from 'react'

type Props = {
  locale: string
}

interface AssetItem {
  id: string
  category: string
  description: string
  amountNaira: number
}

interface LiabilityItem {
  id: string
  category: string
  description: string
  amountNaira: number
}

const ASSET_CATEGORIES = [
  'Cash & Savings',
  'Real Estate / Land',
  'Investments (NGX, Bonds, Mutual Funds)',
  'RSA / Pension',
  'Vehicles',
  'Business Equity',
  'Foreign Currency Holdings',
  'Cooperative Savings',
  'Other',
]

const LIABILITY_CATEGORIES = [
  'Loans (Personal/Bank)',
  'Mortgage',
  'Credit Card / Overdraft',
  'Rent Owed',
  'Informal/Cooperative Debt',
  'Other Debts',
]

const ILLIQUID_CATEGORIES = new Set([
  'Real Estate / Land',
  'Vehicles',
  'Business Equity',
])

const STORAGE_KEY = 'ng-net-worth-calculator-v1'

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatNaira(value: number) {
  return '₦' + Math.round(value).toLocaleString('en-NG')
}

function formatUSD(value: number) {
  return (
    '$' +
    value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  )
}

export function NigeriaNetWorthCalculator({ locale }: Props) {
  const [assets, setAssets] = useState<AssetItem[]>([
    { id: newId(), category: 'Cash & Savings', description: '', amountNaira: 0 },
  ])
  const [liabilities, setLiabilities] = useState<LiabilityItem[]>([
    { id: newId(), category: 'Loans (Personal/Bank)', description: '', amountNaira: 0 },
  ])

  const [rate, setRate] = useState<number | null>(null)
  const [rateSource, setRateSource] = useState<string>('')
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string>('')
  const [rateError, setRateError] = useState<string>('')
  const [manualRate, setManualRate] = useState<string>('')
  const [showUSD, setShowUSD] = useState(true)
  const [loadedFromStorage, setLoadedFromStorage] = useState(false)

  // Load any saved session from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.assets) && parsed.assets.length) setAssets(parsed.assets)
        if (Array.isArray(parsed.liabilities) && parsed.liabilities.length) setLiabilities(parsed.liabilities)
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setLoadedFromStorage(true)
    }
  }, [])

  // Auto-save to localStorage
  useEffect(() => {
    if (!loadedFromStorage) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ assets, liabilities }))
    } catch {
      // ignore quota errors
    }
  }, [assets, liabilities, loadedFromStorage])

  // Fetch live USD/NGN rate on mount
  useEffect(() => {
    fetchRate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchRate() {
    setRateError('')
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD')
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      const ngn = data?.rates?.NGN
      if (data.result !== 'success' || !ngn) throw new Error('NGN rate missing')
      setRate(ngn)
      setRateSource('open.er-api.com')
      setRateUpdatedAt(new Date().toLocaleString('en-NG'))
    } catch {
      setRateError(
        'Could not fetch a live USD/NGN rate right now. Enter one manually below to see USD estimates, or continue in Naira only.'
      )
    }
  }

  function applyManualRate() {
    const parsed = parseFloat(manualRate)
    if (!isNaN(parsed) && parsed > 0) {
      setRate(parsed)
      setRateSource('manual entry')
      setRateUpdatedAt(new Date().toLocaleString('en-NG'))
      setRateError('')
    }
  }

  function addAsset() {
    setAssets((prev) => [
      ...prev,
      { id: newId(), category: ASSET_CATEGORIES[0], description: '', amountNaira: 0 },
    ])
  }

  function addLiability() {
    setLiabilities((prev) => [
      ...prev,
      { id: newId(), category: LIABILITY_CATEGORIES[0], description: '', amountNaira: 0 },
    ])
  }

  function updateAsset(id: string, patch: Partial<AssetItem>) {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  function updateLiability(id: string, patch: Partial<LiabilityItem>) {
    setLiabilities((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function removeAsset(id: string) {
    setAssets((prev) => (prev.length > 1 ? prev.filter((a) => a.id !== id) : prev))
  }

  function removeLiability(id: string) {
    setLiabilities((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev))
  }

  function resetAll() {
    setAssets([{ id: newId(), category: 'Cash & Savings', description: '', amountNaira: 0 }])
    setLiabilities([
      { id: newId(), category: 'Loans (Personal/Bank)', description: '', amountNaira: 0 },
    ])
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  function exportJSON() {
    const payload = {
      generatedAt: new Date().toISOString(),
      assets,
      liabilities,
      totals,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'net-worth-summary.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const totals = useMemo(() => {
    const totalAssets = assets.reduce((sum, a) => sum + (Number(a.amountNaira) || 0), 0)
    const totalLiabilities = liabilities.reduce((sum, l) => sum + (Number(l.amountNaira) || 0), 0)
    const netWorth = totalAssets - totalLiabilities

    const illiquidAssets = assets
      .filter((a) => ILLIQUID_CATEGORIES.has(a.category))
      .reduce((sum, a) => sum + (Number(a.amountNaira) || 0), 0)
    const liquidNetWorth = netWorth - illiquidAssets

    const byCategory: Record<string, number> = {}
    assets.forEach((a) => {
      byCategory[a.category] = (byCategory[a.category] || 0) + (Number(a.amountNaira) || 0)
    })

    return { totalAssets, totalLiabilities, netWorth, liquidNetWorth, byCategory }
  }, [assets, liabilities])

  const netWorthUSD = rate ? totals.netWorth / rate : null
  const isNegative = totals.netWorth < 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Results panel */}
      <div className="bg-indigo-50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-indigo-700">Your estimated net worth</span>
          {rateUpdatedAt && (
            <span className="text-xs text-indigo-500">Rate updated {rateUpdatedAt}</span>
          )}
        </div>
        <div
          className={`text-4xl font-bold ${
            isNegative ? 'text-red-600' : 'text-indigo-900'
          }`}
        >
          {formatNaira(totals.netWorth)}
        </div>
        {showUSD && netWorthUSD !== null && (
          <div className="text-lg text-indigo-500 mt-1">≈ {formatUSD(netWorthUSD)}</div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="rounded-xl bg-white p-4">
            <div className="text-xs text-gray-500">Total Assets</div>
            <div className="text-xl font-semibold text-gray-800">
              {formatNaira(totals.totalAssets)}
            </div>
          </div>
          <div className="rounded-xl bg-white p-4">
            <div className="text-xs text-gray-500">Total Liabilities</div>
            <div className="text-xl font-semibold text-gray-800">
              {formatNaira(totals.totalLiabilities)}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 mt-4">
          <div className="text-xs text-gray-500">Liquid Net Worth (excludes property, vehicles, business equity)</div>
          <div className="text-lg font-semibold text-gray-800">
            {formatNaira(totals.liquidNetWorth)}
          </div>
        </div>

        {Object.keys(totals.byCategory).length > 0 && totals.totalAssets > 0 && (
          <div className="mt-4 space-y-1">
            {Object.entries(totals.byCategory).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between text-sm text-indigo-800">
                <span>{cat}</span>
                <span>
                  {formatNaira(amt)} · {Math.round((amt / totals.totalAssets) * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rate controls */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-gray-600">
            {rate ? (
              <span>
                1 USD ≈ {formatNaira(rate)} <span className="text-gray-500">({rateSource})</span>
              </span>
            ) : (
              <span className="text-gray-500">No exchange rate loaded yet</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRate}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              type="button"
            >
              Refresh rate
            </button>
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showUSD}
                onChange={(e) => setShowUSD(e.target.checked)}
              />
              Show USD
            </label>
          </div>
        </div>
        {rateError && (
          <div className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
            {rateError}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                placeholder="e.g. 1600"
                value={manualRate}
                onChange={(e) => setManualRate(e.target.value)}
                className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-sm"
              />
              <button
                onClick={applyManualRate}
                className="text-sm px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                type="button"
              >
                Use this rate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assets */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Assets</h2>
        <div className="space-y-3">
          {assets.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <select
                value={item.category}
                onChange={(e) => updateAsset(item.id, { category: e.target.value })}
                className="col-span-4 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="e.g. Lekki Property"
                value={item.description}
                onChange={(e) => updateAsset(item.id, { description: e.target.value })}
                className="col-span-4 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Amount ₦"
                value={item.amountNaira || ''}
                onChange={(e) =>
                  updateAsset(item.id, { amountNaira: parseFloat(e.target.value) || 0 })
                }
                className="col-span-3 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              />
              <button
                onClick={() => removeAsset(item.id)}
                className="col-span-1 text-gray-500 hover:text-red-500"
                type="button"
                aria-label="Remove asset"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addAsset}
          className="mt-4 text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          type="button"
        >
          + Add Asset
        </button>
      </div>

      {/* Liabilities */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Liabilities</h2>
        <div className="space-y-3">
          {liabilities.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <select
                value={item.category}
                onChange={(e) => updateLiability(item.id, { category: e.target.value })}
                className="col-span-4 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                {LIABILITY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="e.g. Car loan"
                value={item.description}
                onChange={(e) => updateLiability(item.id, { description: e.target.value })}
                className="col-span-4 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Amount ₦"
                value={item.amountNaira || ''}
                onChange={(e) =>
                  updateLiability(item.id, { amountNaira: parseFloat(e.target.value) || 0 })
                }
                className="col-span-3 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              />
              <button
                onClick={() => removeLiability(item.id)}
                className="col-span-1 text-gray-500 hover:text-red-500"
                type="button"
                aria-label="Remove liability"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addLiability}
          className="mt-4 text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          type="button"
        >
          + Add Liability
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportJSON}
          className="text-sm px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
          type="button"
        >
          Export as JSON
        </button>
        <button
          onClick={resetAll}
          className="text-sm px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
          type="button"
        >
          Clear All / Reset
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        For personal estimation only. This is not financial, tax, or legal advice — consult a
        qualified professional for decisions that matter. Asset and liability values are estimates
        you provide; property and vehicle values should reflect realistic current resale value, not
        asking price. Naira/USD conversions use a public reference rate for personal overview only
        and are not valid for pricing goods, settling transactions, or customs/FX declarations —
        use an authorized dealer for those. Rates may differ from what banks or BDCs offer you.
      </p>
    </div>
  )
}
