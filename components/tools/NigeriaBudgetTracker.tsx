'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface IncomeSource {
  id: string
  name: string
  amount: number
}

interface CategoryDef {
  id: string
  name: string
  tip: string
  defaultPlanned: number
  isCustom?: boolean
}

interface CategoryState {
  id: string
  name: string
  planned: number
}

interface Transaction {
  id: string
  date: string // YYYY-MM-DD
  categoryId: string
  description: string
  amount: number // positive = expense, negative = refund/adjustment
}

interface BudgetMonthData {
  month: string // YYYY-MM
  incomeSources: IncomeSource[]
  categories: CategoryState[]
  transactions: Transaction[]
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const STORAGE_PREFIX = 'ngonlinetools-budget-'
const FX_CACHE_KEY = 'ngonlinetools-fx-ngn'

const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: 'food', name: 'Food & Groceries', tip: 'Market runs, foodstuff, restaurants', defaultPlanned: 60000 },
  { id: 'rent', name: 'Rent / Housing', tip: 'Often annual — this shows the monthly share', defaultPlanned: 50000 },
  { id: 'transport', name: 'Transportation', tip: 'Danfo, Uber/Bolt, bike, fuel', defaultPlanned: 25000 },
  { id: 'utilities', name: 'Utilities', tip: 'Electricity (NEPA), water, generator diesel, airtime/data', defaultPlanned: 20000 },
  { id: 'education', name: 'Education / School Fees', tip: 'Tuition, books, lesson fees', defaultPlanned: 15000 },
  { id: 'health', name: 'Healthcare & Meds', tip: 'Drugs, hospital visits, HMO', defaultPlanned: 10000 },
  { id: 'personal', name: 'Clothing & Personal Care', tip: 'Clothes, salon/barber, toiletries', defaultPlanned: 10000 },
  { id: 'entertainment', name: 'Entertainment & Eating Out', tip: 'Outings, streaming, small chops', defaultPlanned: 8000 },
  { id: 'family', name: 'Family Obligations', tip: 'Owambe contributions, remittances to family', defaultPlanned: 15000 },
  { id: 'savings', name: 'Savings / Investments / Debt', tip: 'Ajo/esusu, target savings, loan repayment', defaultPlanned: 20000 },
  { id: 'misc', name: 'Miscellaneous', tip: 'Anything that does not fit above', defaultPlanned: 7000 },
]

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['market', 'food', 'rice', 'grocery', 'foodstuff', 'restaurant', 'suya'],
  rent: ['rent', 'landlord', 'agent fee', 'housing'],
  transport: ['uber', 'bolt', 'danfo', 'fuel', 'petrol', 'keke', 'transport', 'bike'],
  utilities: ['nepa', 'electricity', 'phcn', 'diesel', 'generator', 'airtime', 'data', 'water bill'],
  education: ['school', 'tuition', 'fees', 'lesson', 'books'],
  health: ['hospital', 'drug', 'pharmacy', 'clinic', 'hmo', 'health'],
  personal: ['salon', 'barber', 'clothes', 'shopping', 'wear'],
  entertainment: ['cinema', 'netflix', 'showmax', 'party', 'outing', 'club'],
  family: ['owambe', 'remittance', 'family', 'contribution', 'send home'],
  savings: ['ajo', 'esusu', 'savings', 'loan', 'investment', 'target'],
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function blankMonth(month: string): BudgetMonthData {
  return {
    month,
    incomeSources: [{ id: makeId(), name: 'Primary income', amount: 0 }],
    categories: DEFAULT_CATEGORIES.map((c) => ({ id: c.id, name: c.name, planned: c.defaultPlanned })),
    transactions: [],
  }
}

function loadMonth(month: string): BudgetMonthData {
  if (typeof window === 'undefined') return blankMonth(month)
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + month)
    if (!raw) return blankMonth(month)
    const parsed = JSON.parse(raw) as BudgetMonthData
    if (!parsed.categories || !parsed.incomeSources) return blankMonth(month)
    return parsed
  } catch {
    return blankMonth(month)
  }
}

function saveMonth(data: BudgetMonthData) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_PREFIX + data.month, JSON.stringify(data))
  } catch {
    // storage full or unavailable — fail silently, data stays in memory for this session
  }
}

function listSavedMonths(): string[] {
  if (typeof window === 'undefined') return []
  const months: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) months.push(key.replace(STORAGE_PREFIX, ''))
  }
  return months.sort()
}

function suggestCategory(description: string): string | null {
  const lower = description.toLowerCase()
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return catId
  }
  return null
}

function toCSV(data: BudgetMonthData): string {
  const rows = [['date', 'category', 'description', 'amount']]
  for (const t of data.transactions) {
    const catName = data.categories.find((c) => c.id === t.categoryId)?.name || t.categoryId
    rows.push([t.date, catName, t.description.replace(/,/g, ' '), String(t.amount)])
  }
  return rows.map((r) => r.join(',')).join('\n')
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/* Small chart primitives (pure SVG — no extra dependency)              */
/* ------------------------------------------------------------------ */

const CHART_COLORS = [
  '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe',
  '#312e81', '#4338ca', '#3730a3', '#1e1b4b', '#8b5cf6', '#a78bfa',
]

function DonutChart({ segments }: { segments: { label: string; value: number }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total <= 0) {
    return <div className="text-sm text-gray-400 py-6 text-center">Add planned amounts to see the breakdown.</div>
  }
  let cumulative = 0
  const radius = 60
  const circumference = 2 * Math.PI * radius
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" width="140" height="140">
        <g transform="translate(80,80) rotate(-90)">
          {segments.map((seg, i) => {
            if (seg.value <= 0) return null
            const fraction = seg.value / total
            const dash = fraction * circumference
            const gap = circumference - dash
            const offset = -cumulative * circumference
            cumulative += fraction
            return (
              <circle
                key={i}
                r={radius}
                fill="transparent"
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth="24"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={offset}
              />
            )
          })}
        </g>
      </svg>
      <ul className="text-xs space-y-1 max-h-36 overflow-y-auto">
        {segments.filter((s) => s.value > 0).map((seg, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-gray-600">{seg.label}</span>
            <span className="text-gray-400">{Math.round((seg.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlannedVsActualBars({ rows }: { rows: { label: string; planned: number; actual: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.max(r.planned, r.actual)))
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{r.label}</span>
            <span>{formatNaira(r.actual)} / {formatNaira(r.planned)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-0.5">
            <div className="h-full bg-indigo-200 rounded-full" style={{ width: `${(r.planned / max) * 100}%` }} />
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${r.actual > r.planned ? 'bg-red-400' : 'bg-indigo-600'}`}
              style={{ width: `${(r.actual / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export default function NigeriaBudgetTracker({ locale }: { locale: string }) {
  const [monthKey, setMonthKey] = useState<string>(currentMonthKey())
  const [data, setData] = useState<BudgetMonthData>(() => loadMonth(currentMonthKey()))
  const [view, setView] = useState<'planned' | 'actual'>('planned')
  const [darkMode, setDarkMode] = useState(false)
  const [showForeign, setShowForeign] = useState(false)
  const [fxRates, setFxRates] = useState<Record<string, number> | null>(null)
  const [fxError, setFxError] = useState<string | null>(null)
  const [fxLoading, setFxLoading] = useState(false)

  const [txDate, setTxDate] = useState(todayISO())
  const [txCategory, setTxCategory] = useState(DEFAULT_CATEGORIES[0].id)
  const [txDescription, setTxDescription] = useState('')
  const [txAmount, setTxAmount] = useState('')
  const [txFilterCategory, setTxFilterCategory] = useState<string>('all')
  const [customCategoryName, setCustomCategoryName] = useState('')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  /* Load month whenever selector changes */
  useEffect(() => {
    setData(loadMonth(monthKey))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey])

  /* Debounced auto-save */
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveMonth(data), 400)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [data])

  /* Derived numbers */
  const totalIncome = useMemo(() => data.incomeSources.reduce((s, i) => s + (i.amount || 0), 0), [data.incomeSources])
  const totalPlanned = useMemo(() => data.categories.reduce((s, c) => s + (c.planned || 0), 0), [data.categories])
  const actualByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const c of data.categories) map[c.id] = 0
    for (const t of data.transactions) map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
    return map
  }, [data.categories, data.transactions])
  const totalActual = useMemo(() => Object.values(actualByCategory).reduce((s, v) => s + v, 0), [actualByCategory])
  const remaining = totalIncome - totalActual
  const remainingVsPlanned = totalIncome - totalPlanned

  const needsCategories = new Set(['food', 'rent', 'transport', 'utilities', 'health'])
  const savingsCategories = new Set(['savings'])
  const spendByBucket = useMemo(() => {
    let needs = 0, wants = 0, savings = 0
    for (const c of data.categories) {
      const amt = view === 'planned' ? c.planned : actualByCategory[c.id] || 0
      if (needsCategories.has(c.id)) needs += amt
      else if (savingsCategories.has(c.id)) savings += amt
      else wants += amt
    }
    return { needs, wants, savings }
  }, [data.categories, actualByCategory, view])

  /* Foreign exchange (optional, on demand) */
  async function fetchFx() {
    setFxLoading(true)
    setFxError(null)
    try {
      const cached = typeof window !== 'undefined' ? window.sessionStorage.getItem(FX_CACHE_KEY) : null
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Date.now() - parsed.ts < 1000 * 60 * 60) {
          setFxRates(parsed.rates)
          setFxLoading(false)
          return
        }
      }
      const res = await fetch('https://open.er-api.com/v6/latest/NGN')
      if (!res.ok) throw new Error('bad response')
      const json = await res.json()
      if (!json.rates) throw new Error('no rates')
      setFxRates(json.rates)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(FX_CACHE_KEY, JSON.stringify({ ts: Date.now(), rates: json.rates }))
      }
    } catch {
      setFxError('Live exchange rates are unavailable right now. Figures below stay in Naira only — please try again shortly.')
    } finally {
      setFxLoading(false)
    }
  }

  useEffect(() => {
    if (showForeign && !fxRates && !fxLoading) fetchFx()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForeign])

  /* Actions */
  function updateIncomeSource(id: string, amount: number) {
    setData((d) => ({ ...d, incomeSources: d.incomeSources.map((i) => (i.id === id ? { ...i, amount } : i)) }))
  }
  function updateIncomeName(id: string, name: string) {
    setData((d) => ({ ...d, incomeSources: d.incomeSources.map((i) => (i.id === id ? { ...i, name } : i)) }))
  }
  function addIncomeSource() {
    setData((d) => ({ ...d, incomeSources: [...d.incomeSources, { id: makeId(), name: 'Extra income', amount: 0 }] }))
  }
  function removeIncomeSource(id: string) {
    setData((d) => ({ ...d, incomeSources: d.incomeSources.filter((i) => i.id !== id) }))
  }
  function updatePlanned(id: string, planned: number) {
    setData((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, planned } : c)) }))
  }
  function addCustomCategory() {
    const name = customCategoryName.trim()
    if (!name) return
    setData((d) => ({ ...d, categories: [...d.categories, { id: makeId(), name, planned: 0 }] }))
    setCustomCategoryName('')
  }
  function removeCategory(id: string) {
    setData((d) => ({
      ...d,
      categories: d.categories.filter((c) => c.id !== id),
      transactions: d.transactions.filter((t) => t.categoryId !== id),
    }))
  }
  function addTransaction() {
    const amt = parseFloat(txAmount)
    if (!txDescription.trim() || !Number.isFinite(amt) || amt === 0) return
    setData((d) => ({
      ...d,
      transactions: [{ id: makeId(), date: txDate, categoryId: txCategory, description: txDescription.trim(), amount: amt }, ...d.transactions],
    }))
    setTxDescription('')
    setTxAmount('')
  }
  function onDescriptionChange(val: string) {
    setTxDescription(val)
    const suggestion = suggestCategory(val)
    if (suggestion && data.categories.some((c) => c.id === suggestion)) setTxCategory(suggestion)
  }
  function deleteTransaction(id: string) {
    setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) }))
  }
  function resetMonth() {
    if (!window.confirm('Clear all planned amounts and transactions for this month? Income sources are kept.')) return
    setData((d) => ({ ...blankMonth(d.month), incomeSources: d.incomeSources }))
  }
  function copyPreviousMonth() {
    const [y, m] = monthKey.split('-').map(Number)
    const prevDate = new Date(y, m - 2, 1)
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
    const prev = loadMonth(prevKey)
    setData({ ...prev, month: monthKey, transactions: [] })
  }
  function deleteAllData() {
    if (!window.confirm('This deletes every saved month permanently from this browser. Continue?')) return
    for (const m of listSavedMonths()) window.localStorage.removeItem(STORAGE_PREFIX + m)
    setData(blankMonth(monthKey))
  }
  function handlePrint() {
    window.print()
  }
  function handleExportCSV() {
    downloadFile(`budget-${monthKey}.csv`, toCSV(data), 'text/csv')
  }
  function handleExportJSON() {
    downloadFile(`budget-${monthKey}.json`, JSON.stringify(data, null, 2), 'application/json')
  }

  const savedMonths = useMemo(() => {
    const set = new Set(listSavedMonths())
    set.add(monthKey)
    return Array.from(set).sort()
  }, [monthKey, data])

  const filteredTransactions = useMemo(
    () => (txFilterCategory === 'all' ? data.transactions : data.transactions.filter((t) => t.categoryId === txFilterCategory)),
    [data.transactions, txFilterCategory]
  )

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="max-w-4xl mx-auto space-y-6 dark:text-gray-100">
        {/* Print-only styles */}
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; }
          }
          .print-only { display: none; }
        `}</style>

        {/* Header / dashboard summary */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5 no-print">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Budget Creator &amp; Tracker</h2>
            <div className="flex items-center gap-2">
              <select
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="rounded-lg border border-gray-200 text-sm px-2 py-1 dark:bg-gray-800 dark:border-gray-700"
              >
                {savedMonths.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <button onClick={() => setDarkMode((v) => !v)} className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1">
                {darkMode ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Income</div>
              <div className="font-semibold">{formatNaira(totalIncome)}</div>
            </div>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Planned spend</div>
              <div className="font-semibold">{formatNaira(totalPlanned)}</div>
            </div>
            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Actual spend</div>
              <div className="font-semibold">{formatNaira(totalActual)}</div>
            </div>
            <div className={`rounded-xl p-3 ${remaining >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
              <div className="text-xs text-gray-500 dark:text-gray-400">Remaining</div>
              <div className={`font-semibold ${remaining >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                {formatNaira(remaining)}
              </div>
            </div>
          </div>

          <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${totalActual > totalIncome ? 'bg-red-500' : 'bg-indigo-600'}`}
              style={{ width: `${totalIncome > 0 ? Math.min(100, (totalActual / totalIncome) * 100) : 0}%` }}
            />
          </div>
          {remainingVsPlanned < 0 && (
            <p className="text-xs text-red-500 mt-2">Planned spending is {formatNaira(Math.abs(remainingVsPlanned))} more than income — adjust categories below.</p>
          )}
        </div>

        {/* Income */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5 no-print">
          <h3 className="font-semibold mb-3">Income</h3>
          <div className="space-y-2">
            {data.incomeSources.map((src) => (
              <div key={src.id} className="flex items-center gap-2">
                <input
                  value={src.name}
                  onChange={(e) => updateIncomeName(src.id, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm px-3 py-2"
                />
                <input
                  type="number"
                  value={src.amount || ''}
                  onChange={(e) => updateIncomeSource(src.id, parseFloat(e.target.value) || 0)}
                  placeholder="₦0"
                  className="w-36 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm px-3 py-2"
                />
                {data.incomeSources.length > 1 && (
                  <button onClick={() => removeIncomeSource(src.id)} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={addIncomeSource} className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-medium">+ Add income source</button>

          <div className="mt-4 flex items-center gap-2">
            <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <input type="checkbox" checked={showForeign} onChange={(e) => setShowForeign(e.target.checked)} />
              Show foreign currency equivalent
            </label>
          </div>
          {showForeign && (
            <div className="mt-2 text-xs">
              {fxLoading && <span className="text-gray-400">Fetching current rates…</span>}
              {fxError && <span className="text-gray-400">{fxError}</span>}
              {fxRates && !fxLoading && (
                <div className="flex gap-4 text-gray-500 dark:text-gray-400">
                  <span>≈ ${(totalIncome * (fxRates.USD || 0)).toFixed(2)} USD</span>
                  <span>≈ £{(totalIncome * (fxRates.GBP || 0)).toFixed(2)} GBP</span>
                  <span>≈ €{(totalIncome * (fxRates.EUR || 0)).toFixed(2)} EUR</span>
                  <button onClick={fetchFx} className="underline">refresh</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5 no-print">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Categories</h3>
            <div className="flex text-xs rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => setView('planned')} className={`px-3 py-1 ${view === 'planned' ? 'bg-indigo-600 text-white' : ''}`}>Planned</button>
              <button onClick={() => setView('actual')} className={`px-3 py-1 ${view === 'actual' ? 'bg-indigo-600 text-white' : ''}`}>Actual</button>
            </div>
          </div>

          <div className="space-y-2">
            {data.categories.map((c) => {
              const def = DEFAULT_CATEGORIES.find((d) => d.id === c.id)
              const actual = actualByCategory[c.id] || 0
              const over = actual > c.planned && c.planned > 0
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="text-sm">{c.name}</div>
                    {def && <div className="text-xs text-gray-400">{def.tip}</div>}
                  </div>
                  {view === 'planned' ? (
                    <input
                      type="number"
                      value={c.planned || ''}
                      onChange={(e) => updatePlanned(c.id, parseFloat(e.target.value) || 0)}
                      className="w-32 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm px-3 py-2"
                    />
                  ) : (
                    <span className={`w-32 text-right text-sm ${over ? 'text-red-500' : ''}`}>{formatNaira(actual)}</span>
                  )}
                  {!def && (
                    <button onClick={() => removeCategory(c.id)} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              placeholder="Custom category name"
              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm px-3 py-2"
            />
            <button onClick={addCustomCategory} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap">+ Add category</button>
          </div>
        </div>

        {/* 50/30/20-style check */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5 no-print">
          <h3 className="font-semibold mb-3">Needs / Wants / Savings split</h3>
          {totalIncome > 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Needs {Math.round((spendByBucket.needs / totalIncome) * 100)}% · Wants {Math.round((spendByBucket.wants / totalIncome) * 100)}% · Savings {Math.round((spendByBucket.savings / totalIncome) * 100)}%
              {spendByBucket.savings / totalIncome < 0.1 && ' — savings is under 10% of income, consider trimming a wants category.'}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Add income to see your split against the 50/30/20 guide.</p>
          )}
        </div>

        {/* Transactions */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5 no-print">
          <h3 className="font-semibold mb-3">Transactions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mb-3">
            <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} className="rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm px-2 py-2" />
            <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)} className="rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm px-2 py-2">
              {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input
              value={txDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Description (e.g. market run)"
              className="sm:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm px-2 py-2"
            />
            <input
              type="number"
              value={txAmount}
              onChange={(e) => setTxAmount(e.target.value)}
              placeholder="Amount"
              className="rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm px-2 py-2"
            />
          </div>
          <button onClick={addTransaction} className="text-sm rounded-lg bg-indigo-600 text-white px-4 py-2 mb-4">Add transaction</button>

          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-gray-500 dark:text-gray-400">Filter:</label>
            <select value={txFilterCategory} onChange={(e) => setTxFilterCategory(e.target.value)} className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 px-2 py-1">
              <option value="all">All categories</option>
              {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="max-h-64 overflow-y-auto text-sm divide-y divide-gray-100 dark:divide-gray-800">
            {filteredTransactions.length === 0 && <p className="text-gray-400 text-xs py-3">No transactions yet.</p>}
            {filteredTransactions.map((t) => {
              const catName = data.categories.find((c) => c.id === t.categoryId)?.name || t.categoryId
              return (
                <div key={t.id} className="flex items-center justify-between py-2">
                  <div>
                    <div>{t.description}</div>
                    <div className="text-xs text-gray-400">{t.date} · {catName}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={t.amount < 0 ? 'text-green-600' : ''}>{formatNaira(t.amount)}</span>
                    <button onClick={() => deleteTransaction(t.id)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Charts */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5 no-print">
            <h3 className="font-semibold mb-3">Spend breakdown ({view})</h3>
            <DonutChart
              segments={data.categories.map((c) => ({ label: c.name, value: view === 'planned' ? c.planned : actualByCategory[c.id] || 0 }))}
            />
          </div>
          <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5 no-print">
            <h3 className="font-semibold mb-3">Planned vs actual</h3>
            <PlannedVsActualBars
              rows={data.categories.map((c) => ({ label: c.name, planned: c.planned, actual: actualByCategory[c.id] || 0 }))}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-5 no-print flex flex-wrap gap-2">
          <button onClick={handlePrint} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">Print report</button>
          <button onClick={handleExportCSV} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">Export CSV</button>
          <button onClick={handleExportJSON} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">Export JSON</button>
          <button onClick={copyPreviousMonth} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">Copy previous month</button>
          <button onClick={resetMonth} className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">Reset this month</button>
          <button onClick={deleteAllData} className="text-sm rounded-lg border border-red-200 text-red-600 px-3 py-2">Delete all data</button>
        </div>

        {/* Printable summary */}
        <div ref={printRef} className="print-only p-6">
          <h2 className="text-xl font-semibold mb-4">Budget report — {monthKey}</h2>
          <p>Income: {formatNaira(totalIncome)}</p>
          <p>Planned spend: {formatNaira(totalPlanned)}</p>
          <p>Actual spend: {formatNaira(totalActual)}</p>
          <p>Remaining: {formatNaira(remaining)}</p>
          <table className="w-full text-sm mt-4 border-collapse">
            <thead><tr><th className="text-left border-b py-1">Category</th><th className="text-right border-b py-1">Planned</th><th className="text-right border-b py-1">Actual</th></tr></thead>
            <tbody>
              {data.categories.map((c) => (
                <tr key={c.id}>
                  <td className="py-1">{c.name}</td>
                  <td className="text-right py-1">{formatNaira(c.planned)}</td>
                  <td className="text-right py-1">{formatNaira(actualByCategory[c.id] || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 no-print">
          All budget data stays only in your browser (localStorage) and is never sent to any server — clearing your browser data or using a different device will not carry it over.
          Figures are estimates you enter yourself; any foreign-currency equivalents shown are approximate and based on rates that update at most once an hour.
        </p>
      </div>
    </div>
  )
}
