'use client'

import { useEffect, useMemo, useState } from 'react'

// -----------------------------------------------------------------------
// Pilgrimage Budget & Checklist — pure client component.
// No SEO responsibility, no schema, no registry imports (per site rules).
// Receives { locale } only because the page shell always passes it down;
// the tool itself is English-only (site is Nigeria-only, no Arabic
// content per project rules), so `locale` is accepted but not branched on.
//
// Regulatory context (informational only, not legal/travel advice): Hajj
// from Nigeria is administered by the National Hajj Commission of Nigeria
// (NAHCON), established under the NAHCON (Establishment) Act 2006. NAHCON
// fixes an official, zone-based fare each cycle that already bundles
// flights, visa processing, and camp accommodation in Makkah/Madinah.
// Registration only happens through State Muslim Pilgrims Welfare Boards
// or the NAHCON portal — this tool does not sell, book, or register
// anything. Umrah has no official NAHCON fare and is booked through
// licensed private tour operators instead.
// -----------------------------------------------------------------------

const LAST_UPDATED = '22 July 2026'

type Zone = 'maiduguri-yola' | 'northern' | 'southern'
type TripType = 'hajj' | 'umrah'
type Currency = 'NGN' | 'SAR' | 'USD'

// Official 2026 NAHCON Hajj fares (as reviewed and announced 10 Nov 2025),
// which already bundle flights, visa processing, and Makkah/Madinah camp
// accommodation. These are fixed centrally and change every cycle, so the
// tool clearly flags them as reference figures rather than a live price.
const ZONE_LABELS: Record<Zone, string> = {
  'maiduguri-yola': 'Maiduguri / Yola Zone (Borno, Adamawa, Yobe, Taraba)',
  northern: 'Northern Zone',
  southern: 'Southern Zone',
}

const ZONE_BASE_FARE_NGN: Record<Zone, number> = {
  'maiduguri-yola': 7_579_021,
  northern: 7_696_770,
  southern: 7_991_142,
}

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

function formatMoney(amount: number, currency: Currency, rates: Rates): string {
  if (currency === 'NGN') return naira.format(amount)
  const converted = currency === 'SAR' ? amount * rates.ngnToSar : amount * rates.ngnToUsd
  const symbol = currency === 'SAR' ? 'SAR ' : '$'
  return `${symbol}${converted.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function clampNumber(value: string): number {
  const n = parseFloat(value.replace(/,/g, ''))
  if (!isFinite(n) || n < 0) return 0
  return n
}

// ─── FX ──────────────────────────────────────────────────────────────────

interface Rates {
  ngnToUsd: number
  ngnToSar: number
  isLive: boolean
  lastFetched: Date | null
}

// Static fallback used only if the live fetch fails, so the calculator
// still returns a usable, clearly-labelled estimate.
const FALLBACK_RATES: Rates = {
  ngnToUsd: 1 / 1500,
  ngnToSar: 1 / 400,
  isLive: false,
  lastFetched: null,
}

async function fetchLiveRates(): Promise<Rates> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/NGN')
    if (!res.ok) throw new Error('FX source returned an error')
    const data = await res.json()
    const usd = data?.rates?.USD
    const sar = data?.rates?.SAR
    if (!usd || !sar) throw new Error('Malformed FX response')
    return { ngnToUsd: usd, ngnToSar: sar, isLive: true, lastFetched: new Date() }
  } catch {
    return FALLBACK_RATES
  }
}

// ─── Checklist data ──────────────────────────────────────────────────────

type ChecklistPhase = 'pre-registration' | 'health-documents' | 'travel-prep' | 'during-hajj' | 'post-return'

const PHASE_LABELS: Record<ChecklistPhase, string> = {
  'pre-registration': 'Pre-registration',
  'health-documents': 'Health & documents',
  'travel-prep': 'Travel preparation',
  'during-hajj': 'During the pilgrimage',
  'post-return': 'After you return',
}

interface ChecklistItem {
  id: string
  text: string
  phase: ChecklistPhase
  done: boolean
  custom?: boolean
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'done'>[] = [
  { id: 'c1', phase: 'pre-registration', text: 'Register through your State Muslim Pilgrims Welfare Board or the NAHCON portal — never an unofficial agent' },
  { id: 'c2', phase: 'pre-registration', text: 'Pay your fare deposit before the NAHCON deadline for the current cycle' },
  { id: 'c3', phase: 'pre-registration', text: 'Confirm passport has at least 6 months validity remaining' },
  { id: 'c4', phase: 'pre-registration', text: 'Complete the medical fitness assessment (chronic conditions, pregnancy, and mobility are reviewed for fitness-to-travel)' },
  { id: 'c5', phase: 'health-documents', text: 'Get the Meningococcal ACWY vaccination (mandatory, valid 3 years)' },
  { id: 'c6', phase: 'health-documents', text: 'Get the Polio vaccine/booster if required for Nigerian travellers that cycle' },
  { id: 'c7', phase: 'health-documents', text: 'Check current Saudi entry requirements for COVID-19 and Yellow Fever (Yellow Card) before travel' },
  { id: 'c8', phase: 'health-documents', text: 'Carry a copy of your international passport, visa, and medical certificate separately from the originals' },
  { id: 'c9', phase: 'health-documents', text: 'Arrange forex/BTA (Basic Travel Allowance) through CBN-approved channels' },
  { id: 'c10', phase: 'travel-prep', text: 'Pack Ihram garments and confirm your assigned group/camp zone with your state board' },
  { id: 'c11', phase: 'travel-prep', text: 'Check your airline\u2019s luggage weight limits' },
  { id: 'c12', phase: 'travel-prep', text: 'Save your group leader\u2019s and state board\u2019s emergency contact numbers' },
  { id: 'c13', phase: 'travel-prep', text: 'Label all luggage clearly with your name and group/camp number' },
  { id: 'c14', phase: 'during-hajj', text: 'Keep your camp/tent location and group number written down or photographed' },
  { id: 'c15', phase: 'during-hajj', text: 'Stay with your official group during Masha\u2019ir (Mina, Muzdalifah, Arafat) movements' },
  { id: 'c16', phase: 'during-hajj', text: 'Keep a small daily cash reserve separate from your main funds' },
  { id: 'c17', phase: 'post-return', text: 'Complete any post-Hajj report or feedback form your state board requires' },
  { id: 'c18', phase: 'post-return', text: 'Keep receipts in case of a fare refund/reconciliation from your state board' },
]

const PHASE_ORDER: ChecklistPhase[] = ['pre-registration', 'health-documents', 'travel-prep', 'during-hajj', 'post-return']

// ─── Persistence ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'pilgrimage-budget-checklist:v1'

interface SavedState {
  zone: Zone
  tripType: TripType
  numPilgrims: number
  duration: number
  firstTime: boolean
  accommodationNights: number
  accommodationPerNight: number
  mealsPerDay: number
  healthEssentials: number
  miscellaneous: number
  umrahFlightVisa: number
  contingencyPct: number
  checklist: ChecklistItem[]
}

function loadSavedState(): SavedState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedState
  } catch {
    return null
  }
}

function saveState(state: SavedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable (private browsing, quota) — fail silently
  }
}

// ─── Component ───────────────────────────────────────────────────────────

export function PilgrimageBudgetChecklist(_props: { locale: string }) {
  const [zone, setZone] = useState<Zone>('northern')
  const [tripType, setTripType] = useState<TripType>('hajj')
  const [numPilgrims, setNumPilgrims] = useState(1)
  const [duration, setDuration] = useState(21)
  const [firstTime, setFirstTime] = useState(true)

  const [accommodationNights, setAccommodationNights] = useState(10)
  const [accommodationPerNight, setAccommodationPerNight] = useState(45_000)
  const [mealsPerDay, setMealsPerDay] = useState(6_000)
  const [healthEssentials, setHealthEssentials] = useState(85_000)
  const [miscellaneous, setMiscellaneous] = useState(150_000)
  const [umrahFlightVisa, setUmrahFlightVisa] = useState(1_800_000)
  const [contingencyPct, setContingencyPct] = useState(10)

  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    DEFAULT_CHECKLIST.map((item) => ({ ...item, done: false }))
  )
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'pending' | 'done'>('all')
  const [customItemText, setCustomItemText] = useState('')

  const [currency, setCurrency] = useState<Currency>('NGN')
  const [rates, setRates] = useState<Rates>(FALLBACK_RATES)
  const [ratesLoading, setRatesLoading] = useState(true)

  const [hydrated, setHydrated] = useState(false)

  // Load any saved profile/checklist on mount
  useEffect(() => {
    const saved = loadSavedState()
    if (saved) {
      setZone(saved.zone)
      setTripType(saved.tripType)
      setNumPilgrims(saved.numPilgrims)
      setDuration(saved.duration)
      setFirstTime(saved.firstTime)
      setAccommodationNights(saved.accommodationNights)
      setAccommodationPerNight(saved.accommodationPerNight)
      setMealsPerDay(saved.mealsPerDay)
      setHealthEssentials(saved.healthEssentials)
      setMiscellaneous(saved.miscellaneous)
      setUmrahFlightVisa(saved.umrahFlightVisa)
      setContingencyPct(saved.contingencyPct)
      setChecklist(saved.checklist)
    }
    setHydrated(true)
  }, [])

  // Fetch live FX on mount, fall back silently
  useEffect(() => {
    let cancelled = false
    setRatesLoading(true)
    fetchLiveRates().then((r) => {
      if (!cancelled) {
        setRates(r)
        setRatesLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Persist on any change, once initial hydration is done
  useEffect(() => {
    if (!hydrated) return
    saveState({
      zone,
      tripType,
      numPilgrims,
      duration,
      firstTime,
      accommodationNights,
      accommodationPerNight,
      mealsPerDay,
      healthEssentials,
      miscellaneous,
      umrahFlightVisa,
      contingencyPct,
      checklist,
    })
  }, [
    hydrated,
    zone,
    tripType,
    numPilgrims,
    duration,
    firstTime,
    accommodationNights,
    accommodationPerNight,
    mealsPerDay,
    healthEssentials,
    miscellaneous,
    umrahFlightVisa,
    contingencyPct,
    checklist,
  ])

  const totals = useMemo(() => {
    const baseFarePerPerson = tripType === 'hajj' ? ZONE_BASE_FARE_NGN[zone] : umrahFlightVisa
    const accommodationTotal = tripType === 'umrah' ? accommodationNights * accommodationPerNight : 0
    const mealsTotal = mealsPerDay * duration
    const perPersonSubtotal = baseFarePerPerson + accommodationTotal + mealsTotal + healthEssentials + miscellaneous
    const groupSubtotal = perPersonSubtotal * numPilgrims
    const contingencyAmount = groupSubtotal * (contingencyPct / 100)
    const grandTotal = groupSubtotal + contingencyAmount

    return {
      baseFarePerPerson,
      accommodationTotal,
      mealsTotal,
      perPersonSubtotal,
      groupSubtotal,
      contingencyAmount,
      grandTotal,
    }
  }, [tripType, zone, umrahFlightVisa, accommodationNights, accommodationPerNight, mealsPerDay, duration, healthEssentials, miscellaneous, numPilgrims, contingencyPct])

  const money = (n: number) => formatMoney(n, currency, rates)

  const checklistProgress = useMemo(() => {
    const done = checklist.filter((c) => c.done).length
    return { done, total: checklist.length, pct: checklist.length ? Math.round((done / checklist.length) * 100) : 0 }
  }, [checklist])

  const visibleChecklist = useMemo(() => {
    if (checklistFilter === 'pending') return checklist.filter((c) => !c.done)
    if (checklistFilter === 'done') return checklist.filter((c) => c.done)
    return checklist
  }, [checklist, checklistFilter])

  function toggleItem(id: string) {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)))
  }

  function addCustomItem() {
    const text = customItemText.trim()
    if (!text) return
    const id = `custom-${Date.now()}`
    setChecklist((prev) => [...prev, { id, text, phase: 'pre-registration', done: false, custom: true }])
    setCustomItemText('')
  }

  function removeCustomItem(id: string) {
    setChecklist((prev) => prev.filter((c) => c.id !== id))
  }

  function handleExport() {
    const payload = {
      profile: { zone, tripType, numPilgrims, duration, firstTime },
      budget: totals,
      currency,
      checklist,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pilgrimage-budget-checklist.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Profile setup */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your trip details</h2>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setTripType('hajj')}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                tripType === 'hajj' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Hajj
            </button>
            <button
              type="button"
              onClick={() => setTripType('umrah')}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                tripType === 'umrah' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Umrah
            </button>
          </div>

          {tripType === 'hajj' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departure zone</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value as Zone)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              >
                {(Object.keys(ZONE_LABELS) as Zone[]).map((z) => (
                  <option key={z} value={z}>
                    {ZONE_LABELS[z]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Auto-fills the official NAHCON 2026 fare for that zone, which already bundles flights, visa, and camp accommodation. Editable below.
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of pilgrims</label>
              <input
                type="number"
                min={1}
                max={10}
                value={numPilgrims}
                onChange={(e) => setNumPilgrims(Math.min(10, Math.max(1, clampNumber(e.target.value))))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(clampNumber(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={firstTime} onChange={(e) => setFirstTime(e.target.checked)} />
            First-time pilgrim
          </label>
        </div>

        {/* Budget breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Budget breakdown (per pilgrim)</h2>
            <div className="flex gap-1">
              {(['NGN', 'SAR', 'USD'] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                    currency === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          {ratesLoading ? (
            <p className="text-xs text-gray-500">Fetching live exchange rates…</p>
          ) : (
            <p className={`text-xs ${rates.isLive ? 'text-gray-500' : 'text-amber-700'}`}>
              {rates.isLive
                ? `Live NGN exchange rate as of ${rates.lastFetched?.toLocaleTimeString('en-NG')}.`
                : 'Exchange rate source unavailable — showing an offline reference rate. Amounts in SAR/USD are approximate.'}
            </p>
          )}

          {tripType === 'hajj' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Official NAHCON base fare ({ZONE_LABELS[zone]})
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={money(totals.baseFarePerPerson).replace(/[^0-9.,]/g, '')}
                onChange={() => {
                  /* base fare is auto-filled per zone; edit via zone selector to keep it accurate */
                }}
                readOnly
                className="w-full rounded-xl border border-gray-300 px-3 py-2 bg-gray-50 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Bundles flights, visa processing, and Makkah/Madinah camp accommodation. Confirm the current cycle&apos;s exact figure on nahcon.gov.ng before paying.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flights + visa (Umrah, estimate)</label>
              <input
                type="number"
                min={0}
                value={umrahFlightVisa}
                onChange={(e) => setUmrahFlightVisa(clampNumber(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Umrah has no official NAHCON fare — this is booked through a licensed private tour operator. Get a written quote before paying any deposit.
              </p>
            </div>
          )}

          {tripType === 'umrah' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Accommodation nights</label>
                <input
                  type="number"
                  min={0}
                  value={accommodationNights}
                  onChange={(e) => setAccommodationNights(clampNumber(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Per night (NGN)</label>
                <input
                  type="number"
                  min={0}
                  value={accommodationPerNight}
                  onChange={(e) => setAccommodationPerNight(clampNumber(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meals & daily expenses (per day, NGN)</label>
            <input
              type="number"
              min={0}
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(clampNumber(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Food, water, Zamzam, and other daily incidentals — {duration} days total.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Health & essentials (NGN)</label>
            <input
              type="number"
              min={0}
              value={healthEssentials}
              onChange={(e) => setHealthEssentials(clampNumber(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Vaccinations, medical fitness certificate, medication, Ihram/clothing.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Miscellaneous (NGN)</label>
            <input
              type="number"
              min={0}
              value={miscellaneous}
              onChange={(e) => setMiscellaneous(clampNumber(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">Shopping, gifts, sadaqah, and emergency buffer beyond the contingency below.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contingency: {contingencyPct}%
            </label>
            <input
              type="range"
              min={0}
              max={25}
              value={contingencyPct}
              onChange={(e) => setContingencyPct(clampNumber(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">A buffer on top of your total for exchange-rate shifts or unplanned costs. NAHCON typically recommends planning for some cushion.</p>
          </div>
        </div>

        {/* Checklist */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Checklist</h2>
            <span className="text-sm text-gray-500">
              {checklistProgress.done}/{checklistProgress.total} done ({checklistProgress.pct}%)
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all" style={{ width: `${checklistProgress.pct}%` }} />
          </div>

          <div className="flex gap-2">
            {(['all', 'pending', 'done'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setChecklistFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize ${
                  checklistFilter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            {PHASE_ORDER.map((phase) => {
              const items = visibleChecklist.filter((c) => c.phase === phase)
              if (items.length === 0) return null
              return (
                <div key={phase}>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">{PHASE_LABELS[phase]}</h3>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleItem(item.id)}
                          className="mt-0.5"
                        />
                        <span className={`text-sm flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.text}
                        </span>
                        {item.custom && (
                          <button
                            type="button"
                            onClick={() => removeCustomItem(item.id)}
                            className="text-xs text-gray-400 hover:text-red-600"
                          >
                            remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <input
              type="text"
              value={customItemText}
              onChange={(e) => setCustomItemText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomItem()}
              placeholder="Add your own checklist item"
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addCustomItem}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Results panel */}
      <div className="space-y-4">
        <div className="rounded-xl bg-indigo-50 p-6 space-y-4 sticky top-4">
          <h2 className="text-lg font-semibold text-gray-900">Estimated total</h2>

          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>{tripType === 'hajj' ? 'NAHCON base fare' : 'Flights + visa'}</span>
              <span>{money(totals.baseFarePerPerson)}</span>
            </div>
            {tripType === 'umrah' && (
              <div className="flex justify-between">
                <span>Accommodation</span>
                <span>{money(totals.accommodationTotal)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Meals & daily expenses</span>
              <span>{money(totals.mealsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Health & essentials</span>
              <span>{money(healthEssentials)}</span>
            </div>
            <div className="flex justify-between">
              <span>Miscellaneous</span>
              <span>{money(miscellaneous)}</span>
            </div>
            <div className="flex justify-between border-t border-indigo-100 pt-2 font-medium">
              <span>Per pilgrim subtotal</span>
              <span>{money(totals.perPersonSubtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>× {numPilgrims} pilgrim{numPilgrims > 1 ? 's' : ''}</span>
              <span>{money(totals.groupSubtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Contingency ({contingencyPct}%)</span>
              <span>{money(totals.contingencyAmount)}</span>
            </div>
          </div>

          <div className="border-t border-indigo-200 pt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-medium text-gray-700">Grand total</span>
              <span className="text-2xl font-bold text-indigo-900">{money(totals.grandTotal)}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 px-3 py-2 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-100"
            >
              Print
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 px-3 py-2 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-medium hover:bg-indigo-100"
            >
              Export JSON
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-2">
          <h3 className="text-sm font-semibold text-gray-800">Tips & reminders</h3>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
            <li>Register only through your State Muslim Pilgrims Welfare Board or the NAHCON portal — never an unofficial agent.</li>
            {firstTime && <li>As a first-time pilgrim, budget extra time for the medical fitness assessment and vaccination appointments before the registration deadline.</li>}
            {tripType === 'hajj' && <li>The fare above is fixed centrally per zone and bundles flights, visa, and camp accommodation — it isn&apos;t negotiable through third parties.</li>}
            {tripType === 'umrah' && <li>Umrah has no fixed government fare — compare quotes from more than one licensed tour operator before paying a deposit.</li>}
            <li>
              See{' '}
              <a href="https://nahcon.gov.ng" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                nahcon.gov.ng
              </a>{' '}
              for the current cycle&apos;s exact fare, deadlines, and medical requirements.
            </li>
          </ul>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          Planning estimate only — not an official NAHCON figure, a booking, or a registration. Fares, vaccination rules, and deadlines change every Hajj/Umrah cycle; confirm current details with your State Pilgrims Welfare Board or NAHCON before making any payment. All data you enter here stays in your browser (localStorage) and is never sent to any server. Last updated {LAST_UPDATED}.
        </p>
      </div>
    </div>
  )
}

export default PilgrimageBudgetChecklist
