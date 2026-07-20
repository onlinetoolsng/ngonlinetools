'use client'

import { useEffect, useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ─── Nigeria-specific benchmarks (comment-maintained, not live-scraped) ────
// CAC business name registration: CAC's own filing fee runs roughly
// ₦10,000–₦20,000 (₦500–₦1,000 name reservation + registration), with a
// realistic ₦15,000–₦35,000+ all-in once cybercafé/agent assistance is
// included — cross-checked against multiple 2026 CAC fee-schedule guides.
// Always confirm the current figure on portal.cac.gov.ng before paying.
//
// POS agent: terminal ₦0–₦90,000 (many providers subsidize or waive this),
// float ₦50,000–₦250,000+ (higher in busy Lagos locations), typical monthly
// operating cost ₦35,000–₦80,000. From 1 April 2026, CBN's agent banking
// guidelines require every POS agent to work with a single principal
// (one bank, mobile money operator, microfinance bank, or super-agent) —
// worth knowing before signing up with more than one provider.
//
// Provision/retail shop: realistic small-shop total (rent + shelving +
// stock) ₦300,000–₦800,000+, with initial stock alone often ₦100,000–
// ₦1,000,000+ depending on scale; shop rent commonly quoted annually
// (₦50,000–₦400,000+/year) rather than monthly.
//
// Small services (salon, repair, food vendor): typically ₦150,000–
// ₦500,000+ startup, weighted toward tools/equipment and consumables
// rather than a large stock float.
//
// Nigeria Tax Act 2025 (NTA), effective 1 January 2026 — same constants
// used in this site's SME tax estimator, for consistency:
const PIT_FREE_THRESHOLD = 800_000
const CIT_SMALL_COMPANY_TURNOVER_CAP = 100_000_000
const CIT_SMALL_COMPANY_ASSET_CAP = 250_000_000
const VAT_REGISTRATION_THRESHOLD = 50_000_000
const MINIMUM_TAX_RATE = 0.005 // 0.5% of turnover, for non-small companies with little/no taxable profit
const FALLBACK_USD_NGN = 1600

type BusinessType = 'pos' | 'shop' | 'services'
type Location = 'national' | 'lagos' | 'abuja' | 'other'

interface LineItem {
  id: string
  name: string
  amount: string
}

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function formatNaira(value: number) {
  return '₦' + Math.round(value).toLocaleString('en-NG')
}

function sumItems(items: LineItem[]) {
  return items.reduce((s, i) => s + (Math.max(0, parseFloat(i.amount) || 0)), 0)
}

const LOCATION_MULTIPLIER: Record<Location, number> = {
  national: 1,
  lagos: 1.5,
  abuja: 1.25,
  other: 0.85,
}

const BUSINESS_LABELS: Record<BusinessType, string> = {
  pos: 'POS Agent',
  shop: 'Retail / Provision Shop',
  services: 'Small Services',
}

const MARGIN_DEFAULTS: Record<BusinessType, number> = {
  pos: 80, // most of the transaction fee is retained after the provider's cut and data cost
  shop: 22, // blended FMCG/retail margin — 8–15% on staples, 20–40% on personal care/household goods
  services: 55, // labor-heavy, low cost of goods
}

const REVENUE_LABEL: Record<BusinessType, string> = {
  pos: 'Average fee earned per transaction (₦)',
  shop: 'Expected monthly sales revenue (₦)',
  services: 'Expected monthly revenue (₦)',
}

function makeItems(list: { name: string; amount: number }[]): LineItem[] {
  return list.map(l => ({ id: newId(), name: l.name, amount: String(l.amount) }))
}

function defaultsFor(type: BusinessType, loc: Location) {
  const m = LOCATION_MULTIPLIER[loc]
  const scale = (n: number) => Math.round((n * m) / 500) * 500

  if (type === 'pos') {
    return {
      setupItems: makeItems([
        { name: 'CAC Business Name Registration', amount: 15_000 },
        { name: 'POS Terminal (subsidized / caution fee)', amount: 25_000 },
        { name: 'Table, Umbrella / Kiosk Setup & Signage', amount: 20_000 },
        { name: 'Branding, Data Setup & Misc', amount: 10_000 },
      ]),
      workingCapital: String(scale(150_000)),
      monthlyItems: makeItems([
        { name: 'Data & Airtime', amount: 8_000 },
        { name: 'Table / Site Rent', amount: scale(10_000) },
        { name: 'Transport', amount: 10_000 },
        { name: 'Maintenance & Misc', amount: 7_000 },
      ]),
      revenueMode: 'transactions' as const,
      avgTransactionValue: '300',
      dailyTransactionCount: '40',
      operatingDays: '26',
      monthlyRevenue: '312000',
      marginPct: String(MARGIN_DEFAULTS.pos),
    }
  }
  if (type === 'shop') {
    return {
      setupItems: makeItems([
        { name: 'CAC Business Name Registration', amount: 15_000 },
        { name: 'Shelving, Furniture & Signage', amount: 80_000 },
        { name: 'Branding & Misc Setup', amount: 20_000 },
      ]),
      workingCapital: String(scale(400_000)),
      monthlyItems: makeItems([
        { name: 'Rent (monthly equivalent)', amount: scale(12_500) },
        { name: 'Utilities / Generator Fuel', amount: 8_000 },
        { name: 'Data & Airtime', amount: 3_000 },
        { name: 'Transport & Restocking', amount: 10_000 },
        { name: 'Local Government Levies', amount: 3_000 },
      ]),
      revenueMode: 'monthly' as const,
      avgTransactionValue: '2000',
      dailyTransactionCount: '30',
      operatingDays: '26',
      monthlyRevenue: '600000',
      marginPct: String(MARGIN_DEFAULTS.shop),
    }
  }
  return {
    setupItems: makeItems([
      { name: 'CAC Business Name Registration', amount: 15_000 },
      { name: 'Tools & Equipment', amount: 100_000 },
      { name: 'Setup, Branding & Signage', amount: 25_000 },
    ]),
    workingCapital: String(scale(50_000)),
    monthlyItems: makeItems([
      { name: 'Rent / Space', amount: scale(20_000) },
      { name: 'Utilities', amount: 8_000 },
      { name: 'Products & Consumables', amount: 40_000 },
      { name: 'Marketing & Data', amount: 5_000 },
      { name: 'Transport', amount: 5_000 },
    ]),
    revenueMode: 'monthly' as const,
    avgTransactionValue: '5000',
    dailyTransactionCount: '4',
    operatingDays: '24',
    monthlyRevenue: '350000',
    marginPct: String(MARGIN_DEFAULTS.services),
  }
}

const SCENARIOS = [
  { label: 'Pessimistic', mult: 0.7 },
  { label: 'Realistic', mult: 1 },
  { label: 'Optimistic', mult: 1.3 },
]

const PIE_COLORS = ['#4338ca', '#f59e0b', '#059669']

export function NigeriaStartupBreakEvenAnalyzer(_props: { locale: string }) {
  const [tab, setTab] = useState<'startup' | 'breakeven'>('startup')
  const [businessType, setBusinessType] = useState<BusinessType>('pos')
  const [location, setLocation] = useState<Location>('national')

  const initial = defaultsFor('pos', 'national')
  const [setupItems, setSetupItems] = useState<LineItem[]>(initial.setupItems)
  const [workingCapital, setWorkingCapital] = useState(initial.workingCapital)
  const [monthlyItems, setMonthlyItems] = useState<LineItem[]>(initial.monthlyItems)
  const [revenueMode, setRevenueMode] = useState<'monthly' | 'transactions'>(initial.revenueMode)
  const [avgTransactionValue, setAvgTransactionValue] = useState(initial.avgTransactionValue)
  const [dailyTransactionCount, setDailyTransactionCount] = useState(initial.dailyTransactionCount)
  const [operatingDays, setOperatingDays] = useState(initial.operatingDays)
  const [monthlyRevenue, setMonthlyRevenue] = useState(initial.monthlyRevenue)
  const [marginPct, setMarginPct] = useState(initial.marginPct)
  const [annualProfitOverride, setAnnualProfitOverride] = useState('')
  const [isIncorporated, setIsIncorporated] = useState(false)

  const [usdNgn, setUsdNgn] = useState(FALLBACK_USD_NGN)
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'fallback'>('loading')
  const [showUSD, setShowUSD] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchRate() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        if (!res.ok) throw new Error('bad response')
        const data = await res.json()
        const ngn = data?.rates?.NGN
        if (!cancelled && typeof ngn === 'number' && ngn > 0) {
          setUsdNgn(ngn)
          setRateStatus('live')
        } else {
          throw new Error('missing NGN rate')
        }
      } catch {
        if (!cancelled) {
          setUsdNgn(FALLBACK_USD_NGN)
          setRateStatus('fallback')
        }
      }
    }
    fetchRate()
    return () => { cancelled = true }
  }, [])

  function loadDefaults(type: BusinessType, loc: Location) {
    const d = defaultsFor(type, loc)
    setSetupItems(d.setupItems)
    setWorkingCapital(d.workingCapital)
    setMonthlyItems(d.monthlyItems)
    setRevenueMode(d.revenueMode)
    setAvgTransactionValue(d.avgTransactionValue)
    setDailyTransactionCount(d.dailyTransactionCount)
    setOperatingDays(d.operatingDays)
    setMonthlyRevenue(d.monthlyRevenue)
    setMarginPct(d.marginPct)
  }

  function selectBusinessType(type: BusinessType) {
    setBusinessType(type)
    loadDefaults(type, location)
  }
  function selectLocation(loc: Location) {
    setLocation(loc)
    loadDefaults(businessType, loc)
  }
  function applyPreset(type: BusinessType, loc: Location) {
    setBusinessType(type)
    setLocation(loc)
    loadDefaults(type, loc)
  }

  function addSetupItem() {
    setSetupItems(prev => [...prev, { id: newId(), name: '', amount: '' }])
  }
  function removeSetupItem(id: string) {
    setSetupItems(prev => prev.filter(i => i.id !== id))
  }
  function updateSetupItem(id: string, patch: Partial<LineItem>) {
    setSetupItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))
  }
  function addMonthlyItem() {
    setMonthlyItems(prev => [...prev, { id: newId(), name: '', amount: '' }])
  }
  function removeMonthlyItem(id: string) {
    setMonthlyItems(prev => prev.filter(i => i.id !== id))
  }
  function updateMonthlyItem(id: string, patch: Partial<LineItem>) {
    setMonthlyItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)))
  }

  const calc = useMemo(() => {
    const totalSetup = sumItems(setupItems)
    const capital = Math.max(0, parseFloat(workingCapital) || 0)
    const totalMonthlyFixed = sumItems(monthlyItems)
    const totalStartup = totalSetup + capital

    const margin = Math.max(0, Math.min(100, parseFloat(marginPct) || 0)) / 100

    let projectedMonthlyRevenue = 0
    if (revenueMode === 'transactions') {
      const avgVal = Math.max(0, parseFloat(avgTransactionValue) || 0)
      const dailyCount = Math.max(0, parseFloat(dailyTransactionCount) || 0)
      const days = Math.max(1, parseFloat(operatingDays) || 26)
      projectedMonthlyRevenue = avgVal * dailyCount * days
    } else {
      projectedMonthlyRevenue = Math.max(0, parseFloat(monthlyRevenue) || 0)
    }

    // Classic break-even: Fixed Costs / Contribution Margin Ratio
    const breakEvenRevenue = margin > 0 ? totalMonthlyFixed / margin : Infinity
    const breakEvenUnits =
      revenueMode === 'transactions' && parseFloat(avgTransactionValue) > 0
        ? breakEvenRevenue / parseFloat(avgTransactionValue)
        : null

    const scenarios = SCENARIOS.map(s => {
      const revenue = projectedMonthlyRevenue * s.mult
      const monthlyNetProfit = revenue * margin - totalMonthlyFixed
      const monthsToBreakEven = monthlyNetProfit > 0 ? totalStartup / monthlyNetProfit : null
      return { ...s, revenue, monthlyNetProfit, monthsToBreakEven }
    })

    const realistic = scenarios[1]
    const impliedAnnualProfit = Math.max(0, realistic.monthlyNetProfit) * 12
    const annualProfit = annualProfitOverride
      ? Math.max(0, parseFloat(annualProfitOverride) || 0)
      : impliedAnnualProfit

    return {
      totalSetup, capital, totalMonthlyFixed, totalStartup, margin,
      projectedMonthlyRevenue, breakEvenRevenue, breakEvenUnits, scenarios,
      impliedAnnualProfit, annualProfit,
    }
  }, [
    setupItems, workingCapital, monthlyItems, marginPct, revenueMode,
    avgTransactionValue, dailyTransactionCount, operatingDays, monthlyRevenue,
    annualProfitOverride,
  ])

  const taxNote = useMemo(() => {
    const profit = calc.annualProfit
    if (isIncorporated) {
      const smallCompany = profit <= CIT_SMALL_COMPANY_TURNOVER_CAP // treating estimated profit as a turnover proxy here — informational only
      if (smallCompany) {
        return `As an incorporated company with turnover under ₦${CIT_SMALL_COMPANY_TURNOVER_CAP.toLocaleString('en-NG')} and fixed assets under ₦${CIT_SMALL_COMPANY_ASSET_CAP.toLocaleString('en-NG')}, you'd likely qualify as a "small company" — 0% Companies Income Tax and 0% Development Levy under the Nigeria Tax Act 2025. You'd still need to file annual returns.`
      }
      return `Above the small-company thresholds, Companies Income Tax is a flat 30% of taxable profit plus a 4% Development Levy — and if your company reports little or no taxable profit despite meaningful turnover, a minimum tax of ${(MINIMUM_TAX_RATE * 100).toFixed(1)}% of turnover can apply instead.`
    }
    if (profit <= PIT_FREE_THRESHOLD) {
      return `As a sole proprietor / business name (taxed as an individual), the first ₦${PIT_FREE_THRESHOLD.toLocaleString('en-NG')} of annual chargeable income is tax-free under the Nigeria Tax Act 2025's Personal Income Tax bands — at this profit level you'd likely owe little or no PIT.`
    }
    return `As a sole proprietor / business name, you're taxed as an individual under Personal Income Tax bands starting at 15% above the first ₦${PIT_FREE_THRESHOLD.toLocaleString('en-NG')} of annual chargeable income, rising to 25% on income above ₦50,000,000.`
  }, [calc.annualProfit, isIncorporated])

  const pieData = useMemo(() => {
    const firstMonthOperating = calc.totalMonthlyFixed
    return [
      { name: 'One-time Setup', value: calc.totalSetup },
      { name: 'Working Capital / Float / Stock', value: calc.capital },
      { name: 'First-Month Operating Costs', value: firstMonthOperating },
    ].filter(d => d.value > 0)
  }, [calc])

  const chartData = useMemo(
    () => calc.scenarios.map(s => ({ name: s.label, value: Math.max(0, s.monthlyNetProfit) })),
    [calc.scenarios]
  )

  const usdDisplay = (ngn: number) => (showUSD ? ` (~$${Math.round(ngn / usdNgn).toLocaleString('en-US')})` : '')

  const copySummary = () => {
    const text = `${BUSINESS_LABELS[businessType]} — Total Startup: ${formatNaira(calc.totalStartup)} | Monthly Fixed Costs: ${formatNaira(calc.totalMonthlyFixed)} | Break-Even Revenue: ${formatNaira(calc.breakEvenRevenue)} | Realistic Monthly Profit: ${formatNaira(calc.scenarios[1].monthlyNetProfit)}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Business type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type</label>
        <div className="grid grid-cols-3 gap-2">
          {(['pos', 'shop', 'services'] as BusinessType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => selectBusinessType(t)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                businessType === t
                  ? 'bg-indigo-700 text-white border-indigo-700'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {BUSINESS_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden max-w-md text-sm">
          {(['national', 'lagos', 'abuja', 'other'] as Location[]).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => selectLocation(l)}
              className={`flex-1 px-3 py-2.5 font-medium ${location === l ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              {l === 'national' ? 'National Avg' : l === 'other' ? 'Smaller City' : l[0].toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          Scales default rent, float, and stock estimates — Lagos runs higher, smaller cities lower.
          Edit any line item below to override.
        </p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => applyPreset('pos', 'lagos')} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50">
          Typical Lagos POS Agent
        </button>
        <button type="button" onClick={() => applyPreset('shop', 'abuja')} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50">
          Small Abuja Shop
        </button>
        <button type="button" onClick={() => applyPreset('services', 'other')} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50">
          Roadside Service
        </button>
      </div>

      {/* USD toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input type="checkbox" checked={showUSD} onChange={e => setShowUSD(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <span className="text-xs text-gray-600">
            Show USD equivalents ({rateStatus === 'loading' ? 'loading rate…' : `₦${usdNgn.toFixed(0)}/$1`}{rateStatus === 'fallback' ? ', fallback' : ''})
          </span>
        </label>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
        <button type="button" onClick={() => setTab('startup')} className={`flex-1 py-3 text-sm font-semibold ${tab === 'startup' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>
          Startup Costs
        </button>
        <button type="button" onClick={() => setTab('breakeven')} className={`flex-1 py-3 text-sm font-semibold ${tab === 'breakeven' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>
          Break-Even Analysis
        </button>
      </div>

      {tab === 'startup' && (
        <div className="space-y-5">
          {/* One-time setup */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">One-Time / Fixed Setup Costs</p>
              <button type="button" onClick={addSetupItem} className="text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {setupItems.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => updateSetupItem(item.id, { name: e.target.value })}
                    className="col-span-7 rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    placeholder="Item name"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formatNumberInput(item.amount)}
                    onChange={e => updateSetupItem(item.id, { amount: cleanNumberInput(e.target.value) })}
                    className="col-span-4 rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    placeholder="₦ amount"
                  />
                  <button type="button" onClick={() => removeSetupItem(item.id)} className="col-span-1 text-gray-500 hover:text-red-500" aria-label="Remove item">✕</button>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-100">
              <span className="text-gray-600">Subtotal — Setup</span>
              <span className="font-semibold text-gray-900">{formatNaira(calc.totalSetup)}{usdDisplay(calc.totalSetup)}</span>
            </div>
          </div>

          {/* Working capital */}
          <div className="border border-gray-100 rounded-xl p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {businessType === 'pos' ? 'Cash Float' : businessType === 'shop' ? 'Initial Inventory / Stock' : 'Initial Materials & Working Capital'} (₦)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(workingCapital)}
              onChange={e => setWorkingCapital(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              {businessType === 'pos' && 'Critical for POS — running out of float stops you from serving customers mid-day. Typical range: ₦50,000–₦250,000+, higher in busy Lagos locations.'}
              {businessType === 'shop' && 'Typical range for a small shop: ₦100,000–₦1,000,000+ depending on scale and product mix.'}
              {businessType === 'services' && 'Tools/equipment usually matter more than stock here — this covers starter materials and consumables.'}
            </p>
          </div>

          {/* Monthly costs */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Ongoing Monthly Costs</p>
              <button type="button" onClick={addMonthlyItem} className="text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {monthlyItems.map(item => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => updateMonthlyItem(item.id, { name: e.target.value })}
                    className="col-span-7 rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    placeholder="Item name"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formatNumberInput(item.amount)}
                    onChange={e => updateMonthlyItem(item.id, { amount: cleanNumberInput(e.target.value) })}
                    className="col-span-4 rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    placeholder="₦/month"
                  />
                  <button type="button" onClick={() => removeMonthlyItem(item.id)} className="col-span-1 text-gray-500 hover:text-red-500" aria-label="Remove item">✕</button>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-100">
              <span className="text-gray-600">Subtotal — Monthly Fixed Costs</span>
              <span className="font-semibold text-gray-900">{formatNaira(calc.totalMonthlyFixed)}{usdDisplay(calc.totalMonthlyFixed)}</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">Total Setup + Working Capital</span>
              <span className="font-bold text-indigo-900">{formatNaira(calc.totalStartup)}{usdDisplay(calc.totalStartup)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">Monthly Fixed Costs</span>
              <span className="font-semibold text-indigo-900">{formatNaira(calc.totalMonthlyFixed)}{usdDisplay(calc.totalMonthlyFixed)}</span>
            </div>
          </div>

          {pieData.length > 0 && (
            <div className="flex items-center gap-6">
              <div className="h-32 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={50}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => formatNaira(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium text-gray-900">Cost breakdown</p>
                {pieData.map(d => (
                  <p key={d.name}>{d.name}: {formatNaira(d.value)}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'breakeven' && (
        <div className="space-y-5">
          {/* Revenue mode */}
          <div className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-700">Revenue Inputs</p>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                <button type="button" onClick={() => setRevenueMode('monthly')} className={`px-2.5 py-1 font-medium ${revenueMode === 'monthly' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Monthly total</button>
                <button type="button" onClick={() => setRevenueMode('transactions')} className={`px-2.5 py-1 font-medium ${revenueMode === 'transactions' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Per-transaction</button>
              </div>
            </div>

            {revenueMode === 'monthly' ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{REVENUE_LABEL[businessType]}</label>
                <input
                  type="text" inputMode="decimal"
                  value={formatNumberInput(monthlyRevenue)}
                  onChange={e => setMonthlyRevenue(cleanNumberInput(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{REVENUE_LABEL[businessType]}</label>
                  <input type="text" inputMode="decimal" value={formatNumberInput(avgTransactionValue)} onChange={e => setAvgTransactionValue(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Transactions / day</label>
                  <input type="text" inputMode="decimal" value={formatNumberInput(dailyTransactionCount)} onChange={e => setDailyTransactionCount(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Operating days / month</label>
                  <input type="text" inputMode="decimal" value={formatNumberInput(operatingDays)} onChange={e => setOperatingDays(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
                </div>
                <p className="col-span-3 text-xs text-gray-500">
                  Implied monthly revenue: {formatNaira(calc.projectedMonthlyRevenue)}
                </p>
              </div>
            )}

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Gross margin (%)</label>
              <input type="text" inputMode="decimal" value={marginPct} onChange={e => setMarginPct(cleanNumberInput(e.target.value))} className="w-full max-w-[120px] rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              <p className="text-xs text-gray-500 mt-1">
                Share of each naira of revenue left after direct/variable costs (stock cost, transaction cost, materials).
                Not a computed figure — set it based on your own cost structure; the default reflects typical ranges for {BUSINESS_LABELS[businessType].toLowerCase()}.
              </p>
            </div>
          </div>

          {/* Break-even results */}
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">Break-Even Revenue (monthly)</span>
              <span className="font-bold text-indigo-900">
                {Number.isFinite(calc.breakEvenRevenue) ? formatNaira(calc.breakEvenRevenue) + usdDisplay(calc.breakEvenRevenue) : '—'}
              </span>
            </div>
            {calc.breakEvenUnits !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-indigo-900">Break-Even Transactions (monthly)</span>
                <span className="font-semibold text-indigo-900">{Math.ceil(calc.breakEvenUnits).toLocaleString('en-NG')}</span>
              </div>
            )}
            <p className="text-xs text-indigo-700/80 pt-1">
              Break-even Revenue = Monthly Fixed Costs ÷ Gross Margin. At this revenue, you cover costs exactly — profit starts above it.
            </p>
          </div>

          {/* Scenarios */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Scenarios (monthly)</p>
            <div className="grid grid-cols-3 gap-3">
              {calc.scenarios.map(s => (
                <div key={s.label} className={`rounded-xl p-3 border text-center ${s.label === 'Realistic' ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100'}`}>
                  <p className="text-xs font-semibold text-gray-600">{s.label}</p>
                  <p className="text-xs text-gray-400 mb-1">{formatNaira(s.revenue)} revenue</p>
                  <p className={`text-sm font-bold ${s.monthlyNetProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatNaira(s.monthlyNetProfit)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {s.monthsToBreakEven !== null ? `${s.monthsToBreakEven.toFixed(1)} mo. to recover` : 'Not profitable yet'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: unknown) => formatNaira(Number(v ?? 0))} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#4338ca" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tax awareness */}
          <div className="border border-amber-100 bg-amber-50 rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-semibold text-amber-900">Tax Awareness (informational — not a precise calculation)</p>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={!isIncorporated} onChange={() => setIsIncorporated(false)} className="text-indigo-600" />
                Sole proprietor / business name
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={isIncorporated} onChange={() => setIsIncorporated(true)} className="text-indigo-600" />
                Incorporated company
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-amber-800 mb-1">
                Projected annual profit (defaults to realistic scenario × 12 — override if you like)
              </label>
              <input
                type="text" inputMode="decimal"
                value={formatNumberInput(annualProfitOverride || String(Math.round(calc.impliedAnnualProfit)))}
                onChange={e => setAnnualProfitOverride(cleanNumberInput(e.target.value))}
                className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm bg-white"
              />
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">{taxNote}</p>
            <p className="text-[11px] text-amber-700">
              VAT registration is only required above ₦{VAT_REGISTRATION_THRESHOLD.toLocaleString('en-NG')} annual turnover — well above the range
              most micro-businesses in this tool operate at. Keep records of income and expenses either way; they're what make any of these
              deductions or exemptions provable later.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={copySummary} className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl transition-colors">
          {copied ? '✓ Copied!' : 'Copy Summary'}
        </button>
        <button type="button" onClick={() => window.print()} className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors">
          Print
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        For illustration only, based on editable inputs and general Nigerian market ranges — not financial, legal, or tax advice.
        CAC fees change periodically; confirm the current schedule at portal.cac.gov.ng before paying. Tax notes reference the
        Nigeria Tax Act 2025, effective 1 January 2026 (Personal Income Tax bands, the ₦100,000,000 small-company Companies
        Income Tax threshold, and the ₦50,000,000 VAT registration threshold) — verify your specific situation with the Nigeria
        Revenue Service, your State Internal Revenue Service, or a licensed tax professional. POS agents should also confirm
        current agent-banking requirements directly with their provider and the CBN.
      </p>
    </div>
  )
}
