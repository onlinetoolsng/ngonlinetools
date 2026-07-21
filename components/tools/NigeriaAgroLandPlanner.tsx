'use client'

import { useEffect, useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Zone = 'south' | 'middle-belt' | 'north'
type Soil = 'loamy' | 'sandy' | 'clay' | 'not-sure'
type Irrigation = 'yes' | 'no' | 'unknown'
type Goal = 'food' | 'commercial' | 'mixed'
type Budget = 'low' | 'medium' | 'high'
type LandUnit = 'ha' | 'acre' | 'plot' | 'sqm'

interface ZoneProfile {
  suitability: 0 | 1 | 2 | 3 // 0 none, 1 low, 2 medium, 3 high
  plantingMonths: number[] // 1-12
  plantingText: string
  irrigationDependent?: boolean
}

interface CropData {
  label: string
  icon: string
  zones: Record<Zone, ZoneProfile>
  soilBest: Soil[]
  standPerHa: number
  standUnit: string
  harvestMonthsAfterPlanting: number | null // null for perennials
  perennialNote?: string
  yieldRange: { low: number; high: number } // t/ha
  marketNote: string
  risks: string
  goalFit: Goal[]
  demand: 'high' | 'medium'
  inputCostNgnPerHa: { low: number; medium: number; high: number }
  intercrop: string
}

// ---------------------------------------------------------------------------
// Reference data
// Agro-ecological groupings and crop calendars are simplified from Nigeria's
// three broad zones (Humid Forest/Rainforest South, Guinea Savannah Middle
// Belt, Sudan/Sahel North), aligned with public FAO/USDA-style crop
// suitability patterns and NAERLS extension guidance. These are planning
// aids, not site-specific agronomic assessments.
// ---------------------------------------------------------------------------

const STATE_ZONE: Record<string, Zone> = {
  Lagos: 'south', Ogun: 'south', Oyo: 'south', Osun: 'south', Ondo: 'south', Ekiti: 'south',
  Abia: 'south', Anambra: 'south', Ebonyi: 'south', Enugu: 'south', Imo: 'south',
  'Akwa Ibom': 'south', Bayelsa: 'south', 'Cross River': 'south', Delta: 'south', Edo: 'south', Rivers: 'south',
  Benue: 'middle-belt', Kogi: 'middle-belt', Kwara: 'middle-belt', Nasarawa: 'middle-belt',
  Niger: 'middle-belt', Plateau: 'middle-belt', FCT: 'middle-belt', Taraba: 'middle-belt', Adamawa: 'middle-belt',
  Kano: 'north', Katsina: 'north', Kaduna: 'north', Jigawa: 'north', Kebbi: 'north', Sokoto: 'north',
  Zamfara: 'north', Bauchi: 'north', Gombe: 'north', Borno: 'north', Yobe: 'north',
}

const STATES = Object.keys(STATE_ZONE).sort()

const ZONE_LABEL: Record<Zone, string> = {
  south: 'South (Humid Forest / Rainforest)',
  'middle-belt': 'Middle Belt (Guinea Savannah)',
  north: 'North (Sudan / Sahel)',
}

const SOIL_LABEL: Record<Soil, string> = {
  loamy: 'Loamy (most versatile — good drainage and fertility)',
  sandy: 'Sandy (drains fast, lower fertility)',
  clay: 'Clay (holds water — good for lowland rice)',
  'not-sure': "Not sure / don't know",
}

const CROP_DATA: Record<string, CropData> = {
  cassava: {
    label: 'Cassava', icon: '🥔',
    zones: {
      south: { suitability: 3, plantingMonths: [3, 4, 5, 8, 9], plantingText: 'Mar–May or Aug–Sep (bimodal rains)' },
      'middle-belt': { suitability: 2, plantingMonths: [4, 5, 6], plantingText: 'Apr–Jun' },
      north: { suitability: 1, plantingMonths: [6], plantingText: 'Jun (irrigated only — limited rainfall)', irrigationDependent: true },
    },
    soilBest: ['sandy', 'loamy'],
    standPerHa: 10000, standUnit: 'plants/ha',
    harvestMonthsAfterPlanting: 10,
    yieldRange: { low: 8, high: 25 },
    marketNote: 'Major garri/fufu staple with strong year-round demand and processing options.',
    risks: 'Mealybug and mosaic virus; needs well-drained soil to avoid tuber rot.',
    goalFit: ['food', 'commercial', 'mixed'], demand: 'high',
    inputCostNgnPerHa: { low: 80000, medium: 180000, high: 350000 },
    intercrop: 'Commonly intercropped with maize or melon in the first few months before the canopy closes.',
  },
  yam: {
    label: 'Yam', icon: '🍠',
    zones: {
      south: { suitability: 3, plantingMonths: [2, 3, 4], plantingText: 'Feb–Apr (seed yam on mounds)' },
      'middle-belt': { suitability: 3, plantingMonths: [3, 4], plantingText: 'Mar–Apr (Benue/Middle Belt yam belt)' },
      north: { suitability: 0, plantingMonths: [], plantingText: 'Not typical without irrigation' },
    },
    soilBest: ['loamy'],
    standPerHa: 10000, standUnit: 'mounds/ha',
    harvestMonthsAfterPlanting: 8,
    yieldRange: { low: 8, high: 20 },
    marketNote: 'High-value staple with strong festive-season and export demand.',
    risks: 'Labor-intensive mounding; yam beetle and anthracnose are common threats.',
    goalFit: ['food', 'commercial'], demand: 'high',
    inputCostNgnPerHa: { low: 150000, medium: 300000, high: 550000 },
    intercrop: 'Often intercropped with maize, egusi (melon), or vegetables between mounds.',
  },
  maize: {
    label: 'Maize / Corn', icon: '🌽',
    zones: {
      south: { suitability: 2, plantingMonths: [3, 4, 8], plantingText: 'Mar–Apr (early) or Aug (late rains)' },
      'middle-belt': { suitability: 3, plantingMonths: [4, 5, 6], plantingText: 'Apr–Jun' },
      north: { suitability: 2, plantingMonths: [6, 7], plantingText: 'Jun–Jul (needs fertilizer + reliable rain)' },
    },
    soilBest: ['loamy'],
    standPerHa: 53000, standUnit: 'plants/ha',
    harvestMonthsAfterPlanting: 4,
    yieldRange: { low: 1.0, high: 3.5 },
    marketNote: 'Staple grain plus strong poultry and livestock feed demand.',
    risks: 'Fall armyworm nationwide; Striga weed pressure in northern soils.',
    goalFit: ['food', 'commercial', 'mixed'], demand: 'high',
    inputCostNgnPerHa: { low: 60000, medium: 130000, high: 250000 },
    intercrop: 'Classic pairing with cowpea or soybean — the legume fixes nitrogen for the maize.',
  },
  rice: {
    label: 'Rice (Paddy)', icon: '🌾',
    zones: {
      south: { suitability: 2, plantingMonths: [6, 7], plantingText: 'Jun–Jul rainfed; year-round where irrigated (lowland/swamp)' },
      'middle-belt': { suitability: 2, plantingMonths: [6, 7], plantingText: 'Jun–Jul' },
      north: { suitability: 3, plantingMonths: [6, 7, 11, 12], plantingText: 'Jun–Jul rainfed, or Nov–Feb dry-season irrigated (e.g. Kebbi schemes)' },
    },
    soilBest: ['clay', 'loamy'],
    standPerHa: 250000, standUnit: 'hills/ha (transplanted)',
    harvestMonthsAfterPlanting: 4,
    yieldRange: { low: 1.5, high: 5.0 },
    marketNote: 'High-demand staple and an import-substitution priority crop nationally.',
    risks: 'Water control is critical; bird damage and blast disease are common.',
    goalFit: ['food', 'commercial', 'mixed'], demand: 'high',
    inputCostNgnPerHa: { low: 100000, medium: 220000, high: 420000 },
    intercrop: 'Not typically intercropped — usually rotated with a legume after harvest instead.',
  },
  sorghum: {
    label: 'Sorghum / Guinea Corn', icon: '🌾',
    zones: {
      south: { suitability: 0, plantingMonths: [], plantingText: 'Not typical in southern rainfall conditions' },
      'middle-belt': { suitability: 2, plantingMonths: [5, 6], plantingText: 'May–Jun' },
      north: { suitability: 3, plantingMonths: [6, 7], plantingText: 'Jun–Jul' },
    },
    soilBest: ['sandy', 'loamy'],
    standPerHa: 44000, standUnit: 'plants/ha',
    harvestMonthsAfterPlanting: 5,
    yieldRange: { low: 0.8, high: 2.5 },
    marketNote: 'Brewing-industry demand alongside its role as a northern food staple.',
    risks: 'Quelea bird damage and Striga weed are the main threats.',
    goalFit: ['food', 'mixed'], demand: 'medium',
    inputCostNgnPerHa: { low: 40000, medium: 90000, high: 180000 },
    intercrop: 'Often grown with cowpea or groundnut in the same field.',
  },
  millet: {
    label: 'Millet', icon: '🌾',
    zones: {
      south: { suitability: 0, plantingMonths: [], plantingText: 'Not typical in southern rainfall conditions' },
      'middle-belt': { suitability: 1, plantingMonths: [6], plantingText: 'Jun (limited)' },
      north: { suitability: 3, plantingMonths: [6, 7], plantingText: 'Jun–Jul' },
    },
    soilBest: ['sandy'],
    standPerHa: 44000, standUnit: 'plants/ha',
    harvestMonthsAfterPlanting: 4,
    yieldRange: { low: 0.5, high: 2.0 },
    marketNote: 'Drought-resilient staple with growing health-food market interest.',
    risks: 'Downy mildew and bird damage are the main risks.',
    goalFit: ['food'], demand: 'medium',
    inputCostNgnPerHa: { low: 35000, medium: 75000, high: 150000 },
    intercrop: 'Frequently intercropped with cowpea across the far north.',
  },
  cowpea: {
    label: 'Cowpea / Beans', icon: '🫘',
    zones: {
      south: { suitability: 1, plantingMonths: [7], plantingText: 'Jul (limited — better as an intercrop)' },
      'middle-belt': { suitability: 2, plantingMonths: [6, 7], plantingText: 'Jun–Jul' },
      north: { suitability: 3, plantingMonths: [7, 8], plantingText: 'Jul–Aug (after early cereals)' },
    },
    soilBest: ['sandy', 'loamy'],
    standPerHa: 83000, standUnit: 'plants/ha',
    harvestMonthsAfterPlanting: 3,
    yieldRange: { low: 0.5, high: 2.2 },
    marketNote: 'Major protein source with strong local and regional trade demand.',
    risks: 'Pod-sucking insects and Striga weed can cut yield sharply without spraying.',
    goalFit: ['food', 'commercial'], demand: 'high',
    inputCostNgnPerHa: { low: 45000, medium: 95000, high: 190000 },
    intercrop: 'Pairs naturally with maize, sorghum, or millet as a nitrogen-fixing companion.',
  },
  groundnut: {
    label: 'Groundnut / Peanut', icon: '🥜',
    zones: {
      south: { suitability: 1, plantingMonths: [4], plantingText: 'Apr (limited)' },
      'middle-belt': { suitability: 2, plantingMonths: [5, 6], plantingText: 'May–Jun' },
      north: { suitability: 3, plantingMonths: [6, 7], plantingText: 'Jun–Jul' },
    },
    soilBest: ['sandy'],
    standPerHa: 133000, standUnit: 'plants/ha',
    harvestMonthsAfterPlanting: 4,
    yieldRange: { low: 0.8, high: 2.6 },
    marketNote: 'Strong edible oil and snack-food demand, with export potential.',
    risks: 'Rosette disease and aflatoxin risk if pods aren\u2019t dried properly after harvest.',
    goalFit: ['commercial', 'mixed'], demand: 'medium',
    inputCostNgnPerHa: { low: 60000, medium: 130000, high: 250000 },
    intercrop: 'Commonly intercropped with maize or cassava.',
  },
  cocoa: {
    label: 'Cocoa', icon: '🍫',
    zones: {
      south: { suitability: 3, plantingMonths: [4, 5, 6], plantingText: 'Apr–Jun (establish seedlings at start of rains)' },
      'middle-belt': { suitability: 0, plantingMonths: [], plantingText: 'Not suitable — needs humid forest conditions' },
      north: { suitability: 0, plantingMonths: [], plantingText: 'Not suitable' },
    },
    soilBest: ['loamy'],
    standPerHa: 1111, standUnit: 'trees/ha (3m x 3m)',
    harvestMonthsAfterPlanting: null,
    perennialNote: 'First bearing after roughly 2–3 years, then an annual main harvest around Oct–Dec.',
    yieldRange: { low: 0.3, high: 0.9 },
    marketNote: 'Major export crop; farm-gate price tracks the global cocoa market closely.',
    risks: 'Black pod disease, long payback period, and ongoing shade-tree management needed.',
    goalFit: ['commercial'], demand: 'high',
    inputCostNgnPerHa: { low: 200000, medium: 450000, high: 900000 },
    intercrop: 'Plantain or banana is commonly used as temporary shade while young trees establish.',
  },
  'oil-palm': {
    label: 'Oil Palm', icon: '🌴',
    zones: {
      south: { suitability: 3, plantingMonths: [4, 5, 6], plantingText: 'Apr–Jun (establish seedlings)' },
      'middle-belt': { suitability: 1, plantingMonths: [5], plantingText: 'May (marginal, needs consistent rainfall)' },
      north: { suitability: 0, plantingMonths: [], plantingText: 'Not suitable' },
    },
    soilBest: ['loamy', 'clay'],
    standPerHa: 143, standUnit: 'palms/ha (9m triangular)',
    harvestMonthsAfterPlanting: null,
    perennialNote: 'First fresh fruit bunches after roughly 3–4 years, then continuous harvest year-round.',
    yieldRange: { low: 3, high: 15 },
    marketNote: 'Strong domestic edible-oil demand with added income from local processing.',
    risks: 'Long establishment period before any income; needs consistent rainfall.',
    goalFit: ['commercial'], demand: 'high',
    inputCostNgnPerHa: { low: 250000, medium: 500000, high: 950000 },
    intercrop: 'Cassava or maize is often intercropped between rows before the canopy closes.',
  },
  tomato: {
    label: 'Tomato', icon: '🍅',
    zones: {
      south: { suitability: 2, plantingMonths: [11, 12, 1], plantingText: 'Nov–Jan (dry-season lowlands)' },
      'middle-belt': { suitability: 2, plantingMonths: [9, 10, 11], plantingText: 'Sep–Nov' },
      north: { suitability: 3, plantingMonths: [10, 11, 12], plantingText: 'Oct–Dec (irrigated dry season — the Kano/Jigawa tomato belt)', irrigationDependent: true },
    },
    soilBest: ['loamy'],
    standPerHa: 20000, standUnit: 'plants/ha',
    harvestMonthsAfterPlanting: 3,
    yieldRange: { low: 8, high: 25 },
    marketNote: 'High-value perishable with strong urban demand but sharp price swings.',
    risks: 'Highly perishable; Tuta absoluta leafminer is a serious pest risk; needs reliable water.',
    goalFit: ['commercial'], demand: 'high',
    inputCostNgnPerHa: { low: 150000, medium: 350000, high: 700000 },
    intercrop: 'Sometimes paired with pepper or onion on the same irrigated plot.',
  },
  soybean: {
    label: 'Soybean', icon: '🫛',
    zones: {
      south: { suitability: 1, plantingMonths: [5], plantingText: 'May (limited)' },
      'middle-belt': { suitability: 3, plantingMonths: [6, 7], plantingText: 'Jun–Jul' },
      north: { suitability: 2, plantingMonths: [6, 7], plantingText: 'Jun–Jul (with reliable rains)' },
    },
    soilBest: ['loamy'],
    standPerHa: 300000, standUnit: 'plants/ha',
    harvestMonthsAfterPlanting: 4,
    yieldRange: { low: 0.8, high: 2.3 },
    marketNote: 'Growing demand from the poultry and livestock feed industry.',
    risks: 'Needs rhizobium inoculant for best yield; pods shatter if harvest is delayed.',
    goalFit: ['commercial', 'mixed'], demand: 'medium',
    inputCostNgnPerHa: { low: 70000, medium: 140000, high: 260000 },
    intercrop: 'Rotates well with maize and helps replenish soil nitrogen.',
  },
}

const HA_PER_ACRE = 0.4047
const HA_PER_PLOT = 465 / 10000 // ~465 m² standard reference plot (varies by region/state)
const HA_PER_SQM = 1 / 10000

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DEFAULT_NGN_FALLBACK = 1550

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function landSizeToHa(value: number, unit: LandUnit): number {
  switch (unit) {
    case 'ha': return value
    case 'acre': return value * HA_PER_ACRE
    case 'plot': return value * HA_PER_PLOT
    case 'sqm': return value * HA_PER_SQM
  }
}

function formatNgn(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(value)
}

interface ScoredCrop {
  key: string
  crop: CropData
  score: number
  soilMatch: boolean
  seasonMatch: boolean
  irrigationWarning: boolean
}

function scoreCrops(zone: Zone, soil: Soil, monthNum: number, irrigation: Irrigation, goal: Goal): ScoredCrop[] {
  const results: ScoredCrop[] = []

  for (const [key, crop] of Object.entries(CROP_DATA)) {
    const zp = crop.zones[zone]
    if (!zp || zp.suitability === 0) continue

    let score: number = zp.suitability
    const soilMatch = soil !== 'not-sure' && crop.soilBest.includes(soil)
    if (soilMatch) score += 1

    const seasonMatch = zp.plantingMonths.includes(monthNum)
    if (seasonMatch) score += 1

    let irrigationWarning = false
    if (zp.irrigationDependent && irrigation === 'no') {
      score -= 1.5
      irrigationWarning = true
    }

    if (crop.goalFit.includes(goal)) score += 0.5

    results.push({ key, crop, score, soilMatch, seasonMatch, irrigationWarning })
  }

  return results.sort((a, b) => b.score - a.score)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NigeriaAgroLandPlanner({ locale }: { locale: string }) {
  const [landSize, setLandSize] = useState('1')
  const [landUnit, setLandUnit] = useState<LandUnit>('ha')
  const [state, setState] = useState('')
  const [zoneOverride, setZoneOverride] = useState<Zone | ''>('')
  const [soil, setSoil] = useState<Soil>('not-sure')
  const [irrigation, setIrrigation] = useState<Irrigation>('unknown')
  const [useCurrentMonth, setUseCurrentMonth] = useState(true)
  const [plantingMonth, setPlantingMonth] = useState<number>(new Date().getMonth() + 1)
  const [budget, setBudget] = useState<Budget>('medium')
  const [goal, setGoal] = useState<Goal>('mixed')

  const [errors, setErrors] = useState<string[]>([])
  const [calculated, setCalculated] = useState(false)

  const [rateNgn, setRateNgn] = useState<number>(DEFAULT_NGN_FALLBACK)
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'fallback'>('loading')

  useEffect(() => {
    let cancelled = false
    async function fetchRate() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        if (!res.ok) throw new Error('rate fetch failed')
        const data = await res.json()
        const usdToNgn = data?.rates?.NGN
        if (!usdToNgn) throw new Error('missing rate')
        if (!cancelled) {
          setRateNgn(usdToNgn)
          setRateStatus('live')
        }
      } catch {
        if (!cancelled) setRateStatus('fallback')
      }
    }
    fetchRate()
    return () => {
      cancelled = true
    }
  }, [])

  const zone: Zone | '' = zoneOverride || (state ? STATE_ZONE[state] : '')
  const currentMonthNum = new Date().getMonth() + 1
  const effectiveMonth = useCurrentMonth ? currentMonthNum : plantingMonth

  const landSizeHa = useMemo(() => {
    const v = Number(landSize) || 0
    return landSizeToHa(v, landUnit)
  }, [landSize, landUnit])

  function handleCalculate() {
    const issues: string[] = []
    if (!landSize || Number(landSize) <= 0) issues.push('Enter a land size greater than 0.')
    if (Number(landSize) > 0 && landSizeHa > 5000) issues.push('That land size looks unrealistic for a single farm plan — double-check your unit.')
    if (!zone) issues.push('Select your state (or a zone) to get region-specific recommendations.')
    setErrors(issues)
    setCalculated(issues.length === 0)
  }

  function handleReset() {
    setLandSize('1')
    setLandUnit('ha')
    setState('')
    setZoneOverride('')
    setSoil('not-sure')
    setIrrigation('unknown')
    setUseCurrentMonth(true)
    setPlantingMonth(new Date().getMonth() + 1)
    setBudget('medium')
    setGoal('mixed')
    setErrors([])
    setCalculated(false)
  }

  const scored = useMemo(() => {
    if (!calculated || !zone) return []
    return scoreCrops(zone as Zone, soil, effectiveMonth, irrigation, goal).slice(0, 8)
  }, [calculated, zone, soil, effectiveMonth, irrigation, goal])

  const topPicks = scored.slice(0, 3)

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Top disclaimer */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
        General planning guidance based on public agro-ecological data — not site-specific agronomic or legal advice. Soil
        conditions, microclimate, and land documentation vary by farm. Consult your state Agricultural Development Programme
        (ADP), NAERLS, or the Ministry of Agriculture, and confirm land title before committing to a plan.
      </div>

      {/* Input card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Land & Goals</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Land Size</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={landUnit}
                onChange={(e) => setLandUnit(e.target.value as LandUnit)}
                className="rounded-xl border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ha">hectares</option>
                <option value="acre">acres</option>
                <option value="plot">plots (~465m² std.)</option>
                <option value="sqm">square meters</option>
              </select>
            </div>
            {Number(landSize) > 0 && <p className="text-xs text-gray-400 mt-1">≈ {landSizeHa.toFixed(2)} hectares</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value)
                setZoneOverride('')
              }}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select state…</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-gray-400">Don&apos;t know your state?</span>
              <select
                value={zoneOverride}
                onChange={(e) => {
                  setZoneOverride(e.target.value as Zone | '')
                  if (e.target.value) setState('')
                }}
                className="text-xs rounded-lg border border-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Pick a zone instead…</option>
                <option value="south">{ZONE_LABEL.south}</option>
                <option value="middle-belt">{ZONE_LABEL['middle-belt']}</option>
                <option value="north">{ZONE_LABEL.north}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Soil Type (optional)</label>
            <select
              value={soil}
              onChange={(e) => setSoil(e.target.value as Soil)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(Object.keys(SOIL_LABEL) as Soil[]).map((s) => (
                <option key={s} value={s}>
                  {SOIL_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rainfall / Irrigation Access</label>
            <select
              value={irrigation}
              onChange={(e) => setIrrigation(e.target.value as Irrigation)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="unknown">Not sure</option>
              <option value="yes">Yes — I have irrigation</option>
              <option value="no">No — rain-fed only</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
              <input type="checkbox" checked={useCurrentMonth} onChange={(e) => setUseCurrentMonth(e.target.checked)} />
              Use current month for seasonal guidance
            </label>
            {!useCurrentMonth && (
              <select
                value={plantingMonth}
                onChange={(e) => setPlantingMonth(Number(e.target.value))}
                className="w-full sm:w-48 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget / Input Level</label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value as Budget)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low — subsistence, minimal inputs</option>
              <option value="medium">Medium — average smallholder</option>
              <option value="high">High — improved seed, fertilizer, irrigation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as Goal)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="food">Food / Sustenance</option>
              <option value="commercial">Commercial / Profit</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            <ul className="list-disc list-inside space-y-0.5">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleCalculate}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            Plan My Land
          </button>
          <button
            onClick={handleReset}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {calculated && zone && (
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
            <p className="text-sm text-gray-700">
              For <span className="font-medium">{landSizeHa.toFixed(2)} hectares</span> in the{' '}
              <span className="font-medium">{ZONE_LABEL[zone as Zone]}</span> zone
              {state ? ` (${state})` : ''}, the top matches are:{' '}
              <span className="font-medium">{scored.slice(0, 3).map((s) => s.crop.label).join(', ')}</span>.
            </p>
          </div>

          {/* Recommended crops */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Recommended Crops</h3>
            <div className="space-y-3">
              {scored.map(({ key, crop, score, seasonMatch, soilMatch, irrigationWarning }) => {
                const zp = crop.zones[zone as Zone]
                const suitabilityLabel = score >= 4.5 ? 'High' : score >= 3 ? 'Medium' : 'Low'
                const plantCount = landSizeHa * crop.standPerHa
                return (
                  <div key={key} className="rounded-xl bg-white border border-indigo-100 p-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-gray-900">
                        {crop.icon} {crop.label}
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          suitabilityLabel === 'High'
                            ? 'bg-green-100 text-green-700'
                            : suitabilityLabel === 'Medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {suitabilityLabel} suitability
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      Planting window: {zp.plantingText}
                      {crop.harvestMonthsAfterPlanting
                        ? ` · Harvest ≈ ${crop.harvestMonthsAfterPlanting} months after planting`
                        : ''}
                      {crop.perennialNote ? ` · ${crop.perennialNote}` : ''}
                    </p>
                    <p className="text-xs text-gray-600 mb-1">
                      Stand density: {formatCount(crop.standPerHa)} {crop.standUnit} → ≈{' '}
                      {formatCount(plantCount)} for your land size
                    </p>
                    <p className="text-xs text-gray-600 mb-1">
                      Estimated yield: {crop.yieldRange.low}–{crop.yieldRange.high} t/ha
                    </p>
                    <p className="text-xs text-gray-600 mb-1">{crop.marketNote}</p>
                    <p className="text-xs text-gray-500 mb-1">Risks: {crop.risks}</p>
                    <p className="text-xs text-gray-500">
                      {soilMatch && 'Matches your soil type. '}
                      {seasonMatch && 'Good timing for your selected month. '}
                      {irrigationWarning && (
                        <span className="text-amber-600">Needs irrigation in this zone — rain-fed only is risky. </span>
                      )}
                    </p>
                  </div>
                )
              })}
              {scored.length === 0 && (
                <p className="text-sm text-gray-600">
                  No strong matches found for this zone with the current filters — try loosening the soil or season
                  constraints, or double-check your state selection.
                </p>
              )}
            </div>
          </div>

          {/* Scale & planning guidance */}
          {topPicks.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Scale & Planning Guidance</h3>
              <div className="rounded-xl bg-white border border-indigo-100 p-4 space-y-3 text-xs text-gray-600">
                {topPicks.map(({ key, crop }) => (
                  <p key={key}>
                    <span className="font-medium text-gray-800">{crop.label}:</span> {crop.intercrop} Rough input cost at your{' '}
                    {budget} budget level: {formatNgn(crop.inputCostNgnPerHa[budget] * landSizeHa)}
                    {rateStatus !== 'loading' && (
                      <> (≈ {formatUsd((crop.inputCostNgnPerHa[budget] * landSizeHa) / rateNgn)})</>
                    )}
                    .
                  </p>
                ))}
                <p className="pt-2 border-t border-indigo-50">
                  <span className="font-medium text-gray-800">Rotation & diversification:</span> Avoid planting the same crop
                  on the same plot every season — rotate cereals with a legume (cowpea, groundnut, soybean) to help restore
                  soil nitrogen, and consider splitting land between a food-security crop and a commercial crop to spread risk.
                </p>
                {rateStatus === 'fallback' && (
                  <p className="text-gray-400">Live exchange rate unavailable — USD figures use a fallback estimate of ₦{DEFAULT_NGN_FALLBACK}/USD.</p>
                )}
              </div>
            </div>
          )}

          {/* Seasonal calendar */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Seasonal Calendar</h3>
            <p className="text-xs text-gray-600 bg-white border border-indigo-100 rounded-xl p-4">
              {zone === 'south' &&
                'The South typically sees bimodal rainfall, allowing two cropping windows most years (roughly March–May and August–September), plus year-round options where irrigation is available.'}
              {zone === 'middle-belt' &&
                'The Middle Belt has a single main rainy season, typically April–October, with planting usually concentrated between April and June.'}
              {zone === 'north' &&
                'The North has a shorter single rainy season, usually June–September, with planting concentrated in June–July. Dry-season farming is only viable with irrigation (e.g. river/fadama schemes).'}
              {' '}Selected month: <span className="font-medium">{MONTH_NAMES[effectiveMonth - 1]}</span>.
            </p>
          </div>

          {/* Legal & practical notes */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Legal & Practical Notes</h3>
            <div className="text-xs text-gray-600 bg-white border border-indigo-100 rounded-xl p-4 space-y-2">
              <p>
                Under the Land Use Act 1978, all land in a state is vested in the Governor. Farming on any land requires a
                valid Right of Occupancy — statutory for urban land, customary for most rural/agricultural land granted
                through the Local Government. A single customary holding generally cannot exceed 500 hectares for agricultural
                purposes without the Governor&apos;s consent.
              </p>
              <p>
                For commercial-scale farming, you may need CAC registration (a Business Name at minimum, or a Limited
                company for larger operations), FMARD registration to access many subsidy or grant schemes, relevant local
                permits, and an Environmental Impact Assessment for land development projects above roughly 500 hectares.
              </p>
              <p>
                If targeting organic or export standards, factor in buffer zones from conventional farms and any required
                conversion period before certification.
              </p>
              <p className="font-medium text-gray-700">
                This is general guidance based on public information, not legal advice. Confirm land documentation and
                approvals with your Local Government, State Ministry of Lands, or a qualified lawyer before committing funds.
              </p>
            </div>
          </div>

          {/* Additional value */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Next Steps</h3>
            <div className="text-xs text-gray-600 bg-white border border-indigo-100 rounded-xl p-4">
              <ul className="list-disc list-inside space-y-1">
                <li>Get a basic soil test done before committing to a crop, especially for tree crops like cocoa or oil palm.</li>
                <li>Source seeds or planting material from NASC-approved (National Agricultural Seeds Council) suppliers to avoid counterfeit seed.</li>
                <li>Confirm your Right of Occupancy or other land documentation before investing in tree crops or irrigation infrastructure.</li>
                <li>If farming commercially, register a Business Name with CAC and check FMARD programs for input subsidies or grants relevant to your crop.</li>
                <li>Contact your State Agricultural Development Programme (ADP) or NAERLS extension office for a farm visit and site-specific advice.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        Estimates and recommendations are general planning guidance based on public agro-ecological zone data, not a
        site-specific agronomic or legal assessment. Actual crop performance depends on your exact soil, microclimate,
        water access, and farming practices, and land use is subject to the Land Use Act 1978 and state/local government
        requirements. Consult your State Agricultural Development Programme (ADP), NAERLS, FMARD, or a qualified
        professional before committing land, labor, or capital to a farming plan.
      </p>
    </div>
  )
}
