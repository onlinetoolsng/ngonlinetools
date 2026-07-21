'use client'

import { useEffect, useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Season = 'major' | 'minor' | 'irrigated'
type ManagementLevel = 'low' | 'average' | 'improved'
type LandUnit = 'ha' | 'acre'

interface CropData {
  label: string
  nationalAvg: number // tons per hectare
  byState?: Record<string, number>
  byZone?: Record<string, number>
  typicalRange: { low: number; high: number } // t/ha bounds, nationally
  samplePriceNgnPerTon: number
  tips: string
}

// ---------------------------------------------------------------------------
// Reference data
// Baseline yields are indicative national/state averages compiled from
// public sources (NBS/APS agricultural surveys, USDA FAS PSD reports, FAO
// country statistics, NAERLS extension bulletins). These are educational
// estimates only and should be refreshed as new annual reports are released.
// ---------------------------------------------------------------------------

const ZONES = [
  'North Central',
  'North East',
  'North West',
  'South East',
  'South South',
  'South West',
] as const

type Zone = (typeof ZONES)[number]

const STATE_ZONES: Record<string, Zone> = {
  Benue: 'North Central',
  Kogi: 'North Central',
  Kwara: 'North Central',
  Nasarawa: 'North Central',
  Niger: 'North Central',
  Plateau: 'North Central',
  FCT: 'North Central',
  Adamawa: 'North East',
  Bauchi: 'North East',
  Borno: 'North East',
  Gombe: 'North East',
  Taraba: 'North East',
  Yobe: 'North East',
  Kaduna: 'North West',
  Katsina: 'North West',
  Kano: 'North West',
  Jigawa: 'North West',
  Kebbi: 'North West',
  Sokoto: 'North West',
  Zamfara: 'North West',
  Abia: 'South East',
  Anambra: 'South East',
  Ebonyi: 'South East',
  Enugu: 'South East',
  Imo: 'South East',
  'Akwa Ibom': 'South South',
  Bayelsa: 'South South',
  'Cross River': 'South South',
  Delta: 'South South',
  Edo: 'South South',
  Rivers: 'South South',
  Ekiti: 'South West',
  Lagos: 'South West',
  Ogun: 'South West',
  Ondo: 'South West',
  Osun: 'South West',
  Oyo: 'South West',
}

const STATES = Object.keys(STATE_ZONES).sort()

const CROP_DATA: Record<string, CropData> = {
  maize: {
    label: 'Maize / Corn',
    nationalAvg: 1.8,
    byState: { Kaduna: 2.5, Benue: 2.6, Katsina: 2.1, Niger: 2.3, Kano: 2.0 },
    byZone: { 'North West': 2.2, 'North Central': 2.3, 'South West': 1.6, 'South East': 1.4, 'South South': 1.3, 'North East': 1.7 },
    typicalRange: { low: 1.0, high: 3.5 },
    samplePriceNgnPerTon: 450000,
    tips: 'Rainfall timing and fertilizer (especially nitrogen) at planting are the biggest swing factors in the north; in the south, soil fertility and disease pressure matter more.',
  },
  cassava: {
    label: 'Cassava',
    nationalAvg: 10,
    byState: { Kogi: 14, Benue: 13, Ogun: 12, Anambra: 11 },
    byZone: { 'South West': 12, 'South East': 11, 'South South': 10, 'North Central': 11, 'North West': 6, 'North East': 6 },
    typicalRange: { low: 6, high: 25 },
    samplePriceNgnPerTon: 90000,
    tips: 'Cassava tolerates poor soil well, but improved (high-yield) varieties and later harvest timing significantly raise tonnage per hectare.',
  },
  rice: {
    label: 'Rice (Paddy)',
    nationalAvg: 2.2,
    byState: { Kebbi: 3.2, Ebonyi: 2.8, Kano: 2.6, Niger: 2.4 },
    byZone: { 'North West': 2.8, 'South East': 2.6, 'North Central': 2.3, 'North East': 2.0, 'South West': 1.9, 'South South': 1.8 },
    typicalRange: { low: 1.2, high: 5.0 },
    samplePriceNgnPerTon: 600000,
    tips: 'Irrigated and lowland/swamp rice yields are far higher than rain-fed upland rice — water control is the single biggest driver here.',
  },
  yam: {
    label: 'Yam',
    nationalAvg: 11,
    byState: { Benue: 14, Taraba: 13, Niger: 12 },
    byZone: { 'North Central': 13, 'South East': 11, 'South West': 9, 'South South': 9, 'North West': 7, 'North East': 8 },
    typicalRange: { low: 6, high: 20 },
    samplePriceNgnPerTon: 250000,
    tips: 'Yam is labor- and mound-quality dependent; seed yam (sett) quality and staking practice matter more than fertilizer for most farmers.',
  },
  sorghum: {
    label: 'Sorghum / Guinea Corn',
    nationalAvg: 1.3,
    byState: { Kano: 1.6, Jigawa: 1.5, Bauchi: 1.4 },
    byZone: { 'North West': 1.5, 'North East': 1.4, 'North Central': 1.2, 'South West': 0.9, 'South East': 0.8, 'South South': 0.8 },
    typicalRange: { low: 0.7, high: 2.5 },
    samplePriceNgnPerTon: 380000,
    tips: 'A drought-tolerant staple of the far north; yield responds well to improved hybrid seed even with modest rainfall.',
  },
  millet: {
    label: 'Millet',
    nationalAvg: 1.1,
    byState: { Sokoto: 1.3, Katsina: 1.2, Kebbi: 1.2 },
    byZone: { 'North West': 1.2, 'North East': 1.1, 'North Central': 1.0 },
    typicalRange: { low: 0.5, high: 2.0 },
    samplePriceNgnPerTon: 350000,
    tips: 'Grown mainly in the drier far north; among the most drought-resilient cereals but responds strongly to even light fertilizer use.',
  },
  groundnut: {
    label: 'Groundnut / Peanut',
    nationalAvg: 1.4,
    byState: { Kano: 1.8, Jigawa: 1.6, Katsina: 1.5 },
    byZone: { 'North West': 1.7, 'North East': 1.3, 'North Central': 1.2 },
    typicalRange: { low: 0.8, high: 2.6 },
    samplePriceNgnPerTon: 500000,
    tips: 'Rosette disease and late rains are the main yield risks; certified disease-free seed makes a large difference.',
  },
  soybean: {
    label: 'Soybean',
    nationalAvg: 1.2,
    byState: { Benue: 1.6, Kaduna: 1.4, Niger: 1.3 },
    byZone: { 'North Central': 1.5, 'North West': 1.3, 'North East': 1.0 },
    typicalRange: { low: 0.6, high: 2.3 },
    samplePriceNgnPerTon: 420000,
    tips: 'Benue and the Middle Belt dominate production; inoculant use and timely weeding are the top low-cost yield boosters.',
  },
  cowpea: {
    label: 'Cowpea / Beans',
    nationalAvg: 1.1,
    byState: { Kano: 1.4, Bauchi: 1.3, Sokoto: 1.2 },
    byZone: { 'North West': 1.3, 'North East': 1.2, 'North Central': 1.0 },
    typicalRange: { low: 0.5, high: 2.2 },
    samplePriceNgnPerTon: 650000,
    tips: 'Pod-sucking insects and Striga weed are the leading yield-limiting factors; timely insecticide application protects most of the crop.',
  },
  'oil-palm': {
    label: 'Oil Palm (FFB)',
    nationalAvg: 6,
    byState: { Edo: 9, 'Akwa Ibom': 8, 'Cross River': 8 },
    byZone: { 'South South': 8, 'South West': 6, 'South East': 6 },
    typicalRange: { low: 3, high: 15 },
    samplePriceNgnPerTon: 130000,
    tips: 'Yield (fresh fruit bunches) depends heavily on palm age and variety — tenera hybrids outyield wild dura palms substantially.',
  },
  cocoa: {
    label: 'Cocoa',
    nationalAvg: 0.4,
    byState: { Ondo: 0.5, Osun: 0.45, 'Cross River': 0.4 },
    byZone: { 'South West': 0.45, 'South South': 0.4, 'South East': 0.35 },
    typicalRange: { low: 0.2, high: 0.9 },
    samplePriceNgnPerTon: 3200000,
    tips: 'Tree age, black pod disease control, and shade management are the dominant factors behind Nigeria\u2019s wide cocoa yield gap.',
  },
}

const SEASON_FACTOR: Record<Season, number> = {
  major: 1.0,
  minor: 0.6,
  irrigated: 1.2,
}

const MANAGEMENT_MULTIPLIER: Record<ManagementLevel, number> = {
  low: 0.7,
  average: 1.0,
  improved: 1.3,
}

const HA_PER_ACRE = 1 / 2.471

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTons(value: number): string {
  return `${value.toFixed(value < 10 ? 2 : 1)} t`
}

function formatKg(value: number): string {
  return new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(value * 1000) + ' kg'
}

function formatNgn(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)
}

interface EstimateResult {
  baseYieldPerHa: number
  baseSource: 'state' | 'zone' | 'national'
  adjustedYieldPerHa: number
  expectedTons: number
  lowTons: number
  highTons: number
  revenueNgn: number
}

function calculateYield(params: {
  crop: CropData
  state: string
  landSizeHa: number
  season: Season
  management: ManagementLevel
  userAdjustmentPercent: number
}): EstimateResult {
  const { crop, state, landSizeHa, season, management, userAdjustmentPercent } = params

  let baseYieldPerHa = crop.nationalAvg
  let baseSource: EstimateResult['baseSource'] = 'national'

  if (state && crop.byState && crop.byState[state] !== undefined) {
    baseYieldPerHa = crop.byState[state]
    baseSource = 'state'
  } else if (state && STATE_ZONES[state] && crop.byZone && crop.byZone[STATE_ZONES[state]] !== undefined) {
    baseYieldPerHa = crop.byZone[STATE_ZONES[state]]
    baseSource = 'zone'
  }

  const seasonFactor = SEASON_FACTOR[season]
  const managementFactor = MANAGEMENT_MULTIPLIER[management]
  const adjustmentFactor = 1 + userAdjustmentPercent / 100

  const adjustedYieldPerHa = Math.max(0, baseYieldPerHa * seasonFactor * managementFactor * adjustmentFactor)
  const expectedTons = adjustedYieldPerHa * landSizeHa

  const lowFactor = crop.typicalRange.low / crop.nationalAvg
  const highFactor = crop.typicalRange.high / crop.nationalAvg
  const lowTons = expectedTons * lowFactor
  const highTons = expectedTons * highFactor

  const revenueNgn = expectedTons * crop.samplePriceNgnPerTon

  return { baseYieldPerHa, baseSource, adjustedYieldPerHa, expectedTons, lowTons, highTons, revenueNgn }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NigeriaCropYieldEstimator({ locale }: { locale: string }) {
  const [cropKey, setCropKey] = useState<string>('maize')
  const [otherCropYield, setOtherCropYield] = useState<string>('')
  const [landSize, setLandSize] = useState<string>('1')
  const [landUnit, setLandUnit] = useState<LandUnit>('ha')
  const [state, setState] = useState<string>('')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [season, setSeason] = useState<Season>('major')
  const [management, setManagement] = useState<ManagementLevel>('average')
  const [userAdjustmentPercent, setUserAdjustmentPercent] = useState<string>('0')
  const [weatherNote, setWeatherNote] = useState('')

  const [errors, setErrors] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const isOther = cropKey === 'other'
  const crop = isOther ? null : CROP_DATA[cropKey]

  const landSizeHa = useMemo(() => {
    const value = Number(landSize) || 0
    return landUnit === 'acre' ? value * HA_PER_ACRE : value
  }, [landSize, landUnit])

  const zoneForState = state ? STATE_ZONES[state] : undefined

  const result: EstimateResult | null = useMemo(() => {
    if (errors.length > 0) return null
    const adj = Number(userAdjustmentPercent) || 0

    if (isOther) {
      const manualYield = Number(otherCropYield) || 0
      if (manualYield <= 0 || landSizeHa <= 0) return null
      const seasonFactor = SEASON_FACTOR[season]
      const managementFactor = MANAGEMENT_MULTIPLIER[management]
      const adjustedYieldPerHa = Math.max(0, manualYield * seasonFactor * managementFactor * (1 + adj / 100))
      const expectedTons = adjustedYieldPerHa * landSizeHa
      return {
        baseYieldPerHa: manualYield,
        baseSource: 'national',
        adjustedYieldPerHa,
        expectedTons,
        lowTons: expectedTons * 0.7,
        highTons: expectedTons * 1.3,
        revenueNgn: 0,
      }
    }

    if (!crop || landSizeHa <= 0) return null

    return calculateYield({
      crop,
      state,
      landSizeHa,
      season,
      management,
      userAdjustmentPercent: adj,
    })
  }, [crop, isOther, otherCropYield, state, landSizeHa, season, management, userAdjustmentPercent, errors])

  useEffect(() => {
    const issues: string[] = []
    if (!cropKey) issues.push('Select a crop.')
    if (isOther && (!otherCropYield || Number(otherCropYield) <= 0)) {
      issues.push('Enter an estimated yield (t/ha) for your "Other" crop.')
    }
    if (!landSize || Number(landSize) <= 0) issues.push('Enter a land size greater than 0.')
    setErrors(issues)
  }, [cropKey, isOther, otherCropYield, landSize])

  function handleReset() {
    setCropKey('maize')
    setOtherCropYield('')
    setLandSize('1')
    setLandUnit('ha')
    setState('')
    setShowAdvanced(false)
    setSeason('major')
    setManagement('average')
    setUserAdjustmentPercent('0')
    setWeatherNote('')
    setCopied(false)
  }

  function handleCopySummary() {
    if (!result) return
    const cropLabel = isOther ? 'Other crop (manual yield)' : crop?.label ?? cropKey
    const lines = [
      'Nigeria Crop Yield Estimate',
      `Crop: ${cropLabel}`,
      `Land size: ${landSize} ${landUnit === 'ha' ? 'hectare(s)' : 'acre(s)'} (${landSizeHa.toFixed(2)} ha)`,
      state ? `State: ${state} (${zoneForState ?? 'zone n/a'})` : 'State: not specified — using national average',
      `Season: ${season} | Management: ${management}${Number(userAdjustmentPercent) ? ` | Adjustment: ${userAdjustmentPercent}%` : ''}`,
      `Per-hectare yield (adjusted): ${formatTons(result.adjustedYieldPerHa)}/ha`,
      `Expected harvest: ${formatTons(result.expectedTons)} (range ${formatTons(result.lowTons)}\u2013${formatTons(result.highTons)})`,
      result.revenueNgn > 0 ? `Rough revenue estimate: ${formatNgn(result.revenueNgn)} (sample price only — actual prices fluctuate)` : '',
      weatherNote ? `Notes: ${weatherNote}` : '',
      'Estimate only — not a substitute for professional agronomic advice. Consult NAERLS, your state ADP, or FMARD for site-specific guidance.',
    ].filter(Boolean)
    navigator.clipboard?.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maxRange = result ? Math.max(result.highTons, 0.0001) : 1
  const nationalPerHa = crop?.nationalAvg ?? 0
  const comparisonToNational = crop && result ? (result.adjustedYieldPerHa / nationalPerHa - 1) * 100 : 0

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Top disclaimer */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
        Educational estimation tool based on public historical averages (NBS/APS, USDA FAS, FAO, NAERLS). Not official advice — actual
        yields vary with weather, farming practices, pests, soil, and inputs. For site-specific guidance, consult your state
        Agricultural Development Programme (ADP), NAERLS, or FMARD.
      </div>

      {/* Input card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Farm Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crop Type</label>
            <select
              value={cropKey}
              onChange={(e) => setCropKey(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(CROP_DATA).map(([key, data]) => (
                <option key={key} value={key}>
                  {data.label}
                </option>
              ))}
              <option value="other">Other (enter yield manually)</option>
            </select>
          </div>

          {isOther && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Yield (t/ha)</label>
              <input
                type="number"
                value={otherCropYield}
                onChange={(e) => setOtherCropYield(e.target.value)}
                placeholder="e.g. 2.0"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

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
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farming State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">National average (no state selected)</option>
              {ZONES.map((zone) => (
                <optgroup key={zone} label={zone}>
                  {STATES.filter((s) => STATE_ZONES[s] === zone).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Select your specific state for better accuracy; national averages are used as fallback.</p>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          {showAdvanced ? '\u2212 Hide advanced options' : '+ Refine estimate (season, management, notes)'}
        </button>

        {showAdvanced && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as Season)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="major">Major / Wet season</option>
                <option value="minor">Minor / Dry season</option>
                <option value="irrigated">Irrigated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Management Level</label>
              <select
                value={management}
                onChange={(e) => setManagement(e.target.value as ManagementLevel)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low / Subsistence</option>
                <option value="average">Average</option>
                <option value="improved">Improved / High input</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manual Adjustment (%)</label>
              <input
                type="number"
                value={userAdjustmentPercent}
                onChange={(e) => setUserAdjustmentPercent(e.target.value)}
                placeholder="e.g. 10 for +10%, -15 for -15%"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">Optional fine-tune for fertilizer use, irrigation access, or known local conditions.</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Weather / Field Notes (optional)</label>
              <textarea
                value={weatherNote}
                onChange={(e) => setWeatherNote(e.target.value)}
                rows={2}
                placeholder="e.g. Late rains this season, pest outbreak reported nearby"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

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
            onClick={handleReset}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Reset
          </button>
          {result && (
            <button
              onClick={handleCopySummary}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estimated Harvest</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl bg-white border border-indigo-100 p-4">
              <p className="text-xs text-gray-500 mb-1">Expected Harvest</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatTons(result.lowTons)} \u2013 {formatTons(result.highTons)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Most likely: {formatTons(result.expectedTons)} ({formatKg(result.expectedTons)})</p>
            </div>
            <div className="rounded-xl bg-white border border-indigo-100 p-4">
              <p className="text-xs text-gray-500 mb-1">Per Hectare Yield (adjusted)</p>
              <p className="text-2xl font-semibold text-gray-900">{formatTons(result.adjustedYieldPerHa)}/ha</p>
              {!isOther && crop && (
                <p className="text-xs text-gray-400 mt-1">
                  {comparisonToNational >= 0 ? '+' : ''}
                  {comparisonToNational.toFixed(0)}% vs. national average ({formatTons(nationalPerHa)}/ha)
                </p>
              )}
            </div>
          </div>

          {/* Simple range bar visual */}
          <div className="mb-5">
            <p className="text-xs text-gray-500 mb-2">Yield range visual</p>
            <div className="relative h-6 rounded-full bg-white border border-indigo-100 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-indigo-200"
                style={{ width: `${Math.min(100, (result.highTons / maxRange) * 100)}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-indigo-500"
                style={{ width: `${Math.min(100, (result.expectedTons / maxRange) * 100)}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-indigo-700"
                style={{ width: `${Math.min(100, (result.lowTons / maxRange) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Low: {formatTons(result.lowTons)}</span>
              <span>Expected: {formatTons(result.expectedTons)}</span>
              <span>High: {formatTons(result.highTons)}</span>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-indigo-100">
                  <th className="py-2 pr-2">Item</th>
                  <th className="py-2 pr-2">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-indigo-50">
                  <td className="py-2 pr-2 font-medium text-gray-800">Base yield ({result.baseSource === 'state' ? 'state avg.' : result.baseSource === 'zone' ? 'zonal avg.' : 'national avg.'})</td>
                  <td className="py-2 pr-2 text-gray-800">{formatTons(result.baseYieldPerHa)}/ha</td>
                </tr>
                <tr className="border-b border-indigo-50">
                  <td className="py-2 pr-2 font-medium text-gray-800">Season factor</td>
                  <td className="py-2 pr-2 text-gray-800">{SEASON_FACTOR[season]}x ({season})</td>
                </tr>
                <tr className="border-b border-indigo-50">
                  <td className="py-2 pr-2 font-medium text-gray-800">Management factor</td>
                  <td className="py-2 pr-2 text-gray-800">{MANAGEMENT_MULTIPLIER[management]}x ({management})</td>
                </tr>
                {Number(userAdjustmentPercent) !== 0 && (
                  <tr className="border-b border-indigo-50">
                    <td className="py-2 pr-2 font-medium text-gray-800">Manual adjustment</td>
                    <td className="py-2 pr-2 text-gray-800">{userAdjustmentPercent}%</td>
                  </tr>
                )}
                <tr className="border-b border-indigo-50">
                  <td className="py-2 pr-2 font-medium text-gray-800">Land size</td>
                  <td className="py-2 pr-2 text-gray-800">{landSizeHa.toFixed(2)} ha</td>
                </tr>
                <tr>
                  <td className="py-2 pr-2 font-semibold text-gray-900">Projected production</td>
                  <td className="py-2 pr-2 font-semibold text-gray-900">{formatTons(result.expectedTons)} ({formatKg(result.expectedTons)})</td>
                </tr>
              </tbody>
            </table>
          </div>

          {result.revenueNgn > 0 && (
            <div className="rounded-xl bg-white border border-indigo-100 p-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">Rough Revenue Estimate</p>
              <p className="text-lg font-semibold text-gray-900">{formatNgn(result.revenueNgn)}</p>
              <p className="text-xs text-gray-400 mt-1">Based on a sample market price only — actual farm-gate prices fluctuate by season, location, and buyer.</p>
            </div>
          )}

          {!isOther && crop && (
            <div className="rounded-xl bg-white border border-indigo-100 p-4 text-xs text-gray-600">
              <span className="font-medium text-gray-800">Factors affecting {crop.label.toLowerCase()} yield: </span>
              {crop.tips}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        Estimates only. Real yields depend on rainfall and weather, soil quality, seed variety, pest and disease pressure, and
        farming practices, and can vary significantly from the figures shown here. Baseline data is drawn from public sources
        including NBS/APS agricultural surveys, USDA FAS, FAO, and NAERLS extension bulletins, and is not official or
        site-specific advice. For guidance tailored to your farm, consult your state Agricultural Development Programme (ADP),
        NAERLS, or the Federal Ministry of Agriculture and Rural Development (FMARD).
      </p>
    </div>
  )
}
