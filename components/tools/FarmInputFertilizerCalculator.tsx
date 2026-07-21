'use client'

import { useMemo, useState } from 'react'

// ---------------------------------------------------------------------------
// Static agronomic reference data
// Typical Nigerian extension / ADP guideline ranges (IITA, FMARD Farm Input
// Support Services Department, state ADP recommendation sheets). These are
// starting points only — actual optimal rates vary by soil test, zone and
// season, so every figure below is editable in the UI. Update periodically
// against the latest Harmonized Fertiliser Recommendations for Nigeria.
// ---------------------------------------------------------------------------

type CropKey = 'maize' | 'rice' | 'cassava' | 'cowpea' | 'sorghum' | 'wheat'

interface CropProfile {
  label: string
  seedUnitLabel: string // e.g. "kg/ha" or "bundles/ha (100 cuttings)"
  seedRatePerHa: number
  basalType: string
  basalKgHa: number
  topdressType: string | null
  topdressKgHa: number
  topdressTiming: string
  herbicideLHa: number
  insecticideLHa: number
  fungicideLHa: number
  notes: string
}

const CROPS: Record<CropKey, CropProfile> = {
  maize: {
    label: 'Maize',
    seedUnitLabel: 'kg/ha',
    seedRatePerHa: 20,
    basalType: 'NPK 15:15:15',
    basalKgHa: 300,
    topdressType: 'Urea',
    topdressKgHa: 100,
    topdressTiming: '4–5 weeks after planting',
    herbicideLHa: 3,
    insecticideLHa: 1,
    fungicideLHa: 0,
    notes:
      'Apply the NPK basal dose within the first week after planting. Delaying the urea top-dress past week 5 sharply reduces grain yield.',
  },
  rice: {
    label: 'Rice',
    seedUnitLabel: 'kg/ha',
    seedRatePerHa: 60,
    basalType: 'NPK 15:15:15',
    basalKgHa: 400,
    topdressType: 'Urea',
    topdressKgHa: 100,
    topdressTiming: 'split at tillering and panicle initiation',
    herbicideLHa: 3,
    insecticideLHa: 1,
    fungicideLHa: 1,
    notes:
      'Transplanted rice needs roughly a third of this seed rate for the nursery bed. Split the urea top-dress into two applications for better nitrogen use.',
  },
  cassava: {
    label: 'Cassava',
    seedUnitLabel: 'bundles/ha (100 cuttings/bundle)',
    seedRatePerHa: 100,
    basalType: 'NPK 15:15:15',
    basalKgHa: 400,
    topdressType: null,
    topdressKgHa: 0,
    topdressTiming: 'not usually required',
    herbicideLHa: 2,
    insecticideLHa: 0,
    fungicideLHa: 0,
    notes:
      'Cassava tolerates poorer soils but still responds to NPK at planting. Late-season plantings with less rainfall can use a lower rate to avoid leaching loss.',
  },
  cowpea: {
    label: 'Cowpea',
    seedUnitLabel: 'kg/ha',
    seedRatePerHa: 25,
    basalType: 'NPK 15:15:15',
    basalKgHa: 150,
    topdressType: null,
    topdressKgHa: 0,
    topdressTiming: 'not usually required',
    herbicideLHa: 2,
    insecticideLHa: 2,
    fungicideLHa: 0,
    notes:
      'Cowpea fixes its own nitrogen, so keep basal nitrogen low — heavy N encourages leaf growth over pods. Insecticide timing around flowering matters most for pod borer control.',
  },
  sorghum: {
    label: 'Sorghum',
    seedUnitLabel: 'kg/ha',
    seedRatePerHa: 10,
    basalType: 'NPK 15:15:15',
    basalKgHa: 200,
    topdressType: 'Urea',
    topdressKgHa: 50,
    topdressTiming: '4–5 weeks after planting',
    herbicideLHa: 2,
    insecticideLHa: 1,
    fungicideLHa: 0,
    notes: 'Sorghum tolerates lower fertility than maize; do not over-apply nitrogen on marginal soils.',
  },
  wheat: {
    label: 'Wheat',
    seedUnitLabel: 'kg/ha',
    seedRatePerHa: 120,
    basalType: 'NPK 15:15:15',
    basalKgHa: 250,
    topdressType: 'Urea',
    topdressKgHa: 100,
    topdressTiming: '3–4 weeks after planting, at irrigation',
    herbicideLHa: 2,
    insecticideLHa: 0,
    fungicideLHa: 1,
    notes: 'Grown mainly under irrigation in the north. Time the urea top-dress to an irrigation cycle.',
  },
}

const ACRE_TO_HECTARE = 0.4047

function toNaira(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`
}

function safeNumber(value: string) {
  const parsed = parseFloat(value)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return parsed
}

interface FarmInputFertilizerCalculatorProps {
  locale: string
}

export default function FarmInputFertilizerCalculator({ locale }: FarmInputFertilizerCalculatorProps) {
  const [crop, setCrop] = useState<CropKey>('maize')
  const [unit, setUnit] = useState<'ha' | 'acre'>('ha')
  const [areaInput, setAreaInput] = useState<number>(2)

  const profile = CROPS[crop]

  const [seedRate, setSeedRate] = useState<number>(profile.seedRatePerHa)
  const [basalKgHa, setBasalKgHa] = useState<number>(profile.basalKgHa)
  const [topdressKgHa, setTopdressKgHa] = useState<number>(profile.topdressKgHa)
  const [herbicideLHa, setHerbicideLHa] = useState<number>(profile.herbicideLHa)
  const [insecticideLHa, setInsecticideLHa] = useState<number>(profile.insecticideLHa)
  const [fungicideLHa, setFungicideLHa] = useState<number>(profile.fungicideLHa)

  const [useInsecticide, setUseInsecticide] = useState<boolean>(profile.insecticideLHa > 0)
  const [useFungicide, setUseFungicide] = useState<boolean>(profile.fungicideLHa > 0)
  const [useOrganicManure, setUseOrganicManure] = useState<boolean>(false)
  const [manureTonnesHa, setManureTonnesHa] = useState<number>(2)
  const [manurePricePerTonne, setManurePricePerTonne] = useState<number>(15000)

  const [basalBagPrice, setBasalBagPrice] = useState<number>(45000)
  const [topdressBagPrice, setTopdressBagPrice] = useState<number>(42000)
  const [seedUnitPrice, setSeedUnitPrice] = useState<number>(profile.seedUnitLabel.startsWith('bundles') ? 500 : 800)
  const [herbicidePriceL, setHerbicidePriceL] = useState<number>(4500)
  const [insecticidePriceL, setInsecticidePriceL] = useState<number>(6000)
  const [fungicidePriceL, setFungicidePriceL] = useState<number>(6500)

  function selectCrop(key: CropKey) {
    const next = CROPS[key]
    setCrop(key)
    setSeedRate(next.seedRatePerHa)
    setBasalKgHa(next.basalKgHa)
    setTopdressKgHa(next.topdressKgHa)
    setHerbicideLHa(next.herbicideLHa)
    setInsecticideLHa(next.insecticideLHa)
    setFungicideLHa(next.fungicideLHa)
    setUseInsecticide(next.insecticideLHa > 0)
    setUseFungicide(next.fungicideLHa > 0)
    setSeedUnitPrice(next.seedUnitLabel.startsWith('bundles') ? 500 : 800)
  }

  function resetRatesToRecommended() {
    setSeedRate(profile.seedRatePerHa)
    setBasalKgHa(profile.basalKgHa)
    setTopdressKgHa(profile.topdressKgHa)
    setHerbicideLHa(profile.herbicideLHa)
    setInsecticideLHa(profile.insecticideLHa)
    setFungicideLHa(profile.fungicideLHa)
  }

  const farmSizeHa = useMemo(() => {
    const area = Math.max(0, areaInput)
    return unit === 'acre' ? area * ACRE_TO_HECTARE : area
  }, [areaInput, unit])

  const result = useMemo(() => {
    const basalKgTotal = basalKgHa * farmSizeHa
    const topdressKgTotal = topdressKgHa * farmSizeHa
    const basalBags = Math.ceil(basalKgTotal / 50)
    const topdressBags = Math.ceil(topdressKgTotal / 50)

    const seedTotal = seedRate * farmSizeHa
    const herbicideTotalL = herbicideLHa * farmSizeHa
    const insecticideTotalL = useInsecticide ? insecticideLHa * farmSizeHa : 0
    const fungicideTotalL = useFungicide ? fungicideLHa * farmSizeHa : 0
    const manureTotalT = useOrganicManure ? manureTonnesHa * farmSizeHa : 0

    const basalCost = basalBags * basalBagPrice
    const topdressCost = topdressBags * topdressBagPrice
    const seedCost = seedTotal * seedUnitPrice
    const herbicideCost = herbicideTotalL * herbicidePriceL
    const insecticideCost = insecticideTotalL * insecticidePriceL
    const fungicideCost = fungicideTotalL * fungicidePriceL
    const manureCost = manureTotalT * manurePricePerTonne

    const fertiliserCost = basalCost + topdressCost
    const agrochemCost = herbicideCost + insecticideCost + fungicideCost
    const grandTotal = fertiliserCost + seedCost + agrochemCost + manureCost

    return {
      basalBags,
      topdressBags,
      seedTotal,
      herbicideTotalL,
      insecticideTotalL,
      fungicideTotalL,
      manureTotalT,
      basalCost,
      topdressCost,
      seedCost,
      herbicideCost,
      insecticideCost,
      fungicideCost,
      manureCost,
      fertiliserCost,
      agrochemCost,
      grandTotal,
      perHectare: farmSizeHa > 0 ? grandTotal / farmSizeHa : 0,
    }
  }, [
    basalKgHa,
    topdressKgHa,
    farmSizeHa,
    seedRate,
    herbicideLHa,
    insecticideLHa,
    fungicideLHa,
    useInsecticide,
    useFungicide,
    useOrganicManure,
    manureTonnesHa,
    basalBagPrice,
    topdressBagPrice,
    seedUnitPrice,
    herbicidePriceL,
    insecticidePriceL,
    fungicidePriceL,
    manurePricePerTonne,
  ])

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Farm & crop selection */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Farm & crop details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(CROPS) as CropKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => selectCrop(key)}
                className={`rounded-xl px-3 py-2 text-sm font-medium border transition-colors ${
                  crop === key
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {CROPS[key].label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Farm size</label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={areaInput}
              onChange={(e) => setAreaInput(safeNumber(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
            <div className="flex rounded-xl border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setUnit('ha')}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  unit === 'ha' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
                Hectares
              </button>
              <button
                type="button"
                onClick={() => setUnit('acre')}
                className={`flex-1 px-3 py-2 text-sm font-medium ${
                  unit === 'acre' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                }`}
              >
                Acres
              </button>
            </div>
          </div>
        </div>

        {unit === 'acre' && (
          <p className="text-xs text-gray-500">≈ {farmSizeHa.toFixed(2)} hectares</p>
        )}
      </div>

      {/* Editable rates */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Input rates (per hectare)</h2>
          <button
            type="button"
            onClick={resetRatesToRecommended}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Reset to recommended
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seed / planting material ({profile.seedUnitLabel})
            </label>
            <input
              type="number"
              min={0}
              value={seedRate}
              onChange={(e) => setSeedRate(safeNumber(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {profile.basalType} basal (kg/ha)
            </label>
            <input
              type="number"
              min={0}
              value={basalKgHa}
              onChange={(e) => setBasalKgHa(safeNumber(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {profile.topdressType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {profile.topdressType} top-dress (kg/ha)
              </label>
              <input
                type="number"
                min={0}
                value={topdressKgHa}
                onChange={(e) => setTopdressKgHa(safeNumber(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Apply {profile.topdressTiming}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Herbicide (L/ha)</label>
            <input
              type="number"
              min={0}
              value={herbicideLHa}
              onChange={(e) => setHerbicideLHa(safeNumber(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <input
              id="use-insecticide"
              type="checkbox"
              checked={useInsecticide}
              onChange={(e) => setUseInsecticide(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <div className="flex-1">
              <label htmlFor="use-insecticide" className="block text-sm font-medium text-gray-700 mb-1">
                Insecticide (L/ha)
              </label>
              <input
                type="number"
                min={0}
                disabled={!useInsecticide}
                value={insecticideLHa}
                onChange={(e) => setInsecticideLHa(safeNumber(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <input
              id="use-fungicide"
              type="checkbox"
              checked={useFungicide}
              onChange={(e) => setUseFungicide(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <div className="flex-1">
              <label htmlFor="use-fungicide" className="block text-sm font-medium text-gray-700 mb-1">
                Fungicide (L/ha)
              </label>
              <input
                type="number"
                min={0}
                disabled={!useFungicide}
                value={fungicideLHa}
                onChange={(e) => setFungicideLHa(safeNumber(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-3 flex items-start gap-2">
          <input
            id="use-manure"
            type="checkbox"
            checked={useOrganicManure}
            onChange={(e) => setUseOrganicManure(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          <div className="flex-1 grid sm:grid-cols-2 gap-3">
            <label htmlFor="use-manure" className="text-sm font-medium text-gray-700 sm:col-span-2">
              Add organic manure supplement
            </label>
            {useOrganicManure && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tonnes per hectare</label>
                  <input
                    type="number"
                    min={0}
                    value={manureTonnesHa}
                    onChange={(e) => setManureTonnesHa(safeNumber(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Price per tonne (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={manurePricePerTonne}
                    onChange={(e) => setManurePricePerTonne(safeNumber(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500">{profile.notes}</p>
      </div>

      {/* Prices */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Current market prices</h2>
        <p className="text-sm text-gray-500">
          Prices vary by state and season — update these with what you're quoted locally before relying on the total.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {profile.basalType} (₦ per 50kg bag)
            </label>
            <input
              type="number"
              min={0}
              value={basalBagPrice}
              onChange={(e) => setBasalBagPrice(safeNumber(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {profile.topdressType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {profile.topdressType} (₦ per 50kg bag)
              </label>
              <input
                type="number"
                min={0}
                value={topdressBagPrice}
                onChange={(e) => setTopdressBagPrice(safeNumber(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seed price (₦ per {profile.seedUnitLabel.startsWith('bundles') ? 'bundle' : 'kg'})
            </label>
            <input
              type="number"
              min={0}
              value={seedUnitPrice}
              onChange={(e) => setSeedUnitPrice(safeNumber(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Herbicide (₦ per litre)</label>
            <input
              type="number"
              min={0}
              value={herbicidePriceL}
              onChange={(e) => setHerbicidePriceL(safeNumber(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {useInsecticide && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insecticide (₦ per litre)</label>
              <input
                type="number"
                min={0}
                value={insecticidePriceL}
                onChange={(e) => setInsecticidePriceL(safeNumber(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
          {useFungicide && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fungicide (₦ per litre)</label>
              <input
                type="number"
                min={0}
                value={fungicidePriceL}
                onChange={(e) => setFungicidePriceL(safeNumber(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl bg-indigo-50 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Cost breakdown</h2>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">
              {profile.basalType} basal — {result.basalBags} bag{result.basalBags === 1 ? '' : 's'}
            </span>
            <span className="font-medium text-gray-900">{toNaira(result.basalCost)}</span>
          </div>
          {profile.topdressType && (
            <div className="flex justify-between">
              <span className="text-gray-700">
                {profile.topdressType} top-dress — {result.topdressBags} bag{result.topdressBags === 1 ? '' : 's'}
              </span>
              <span className="font-medium text-gray-900">{toNaira(result.topdressCost)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-700">
              Seed / planting material — {result.seedTotal.toFixed(1)} {profile.seedUnitLabel.startsWith('bundles') ? 'bundles' : 'kg'}
            </span>
            <span className="font-medium text-gray-900">{toNaira(result.seedCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Herbicide — {result.herbicideTotalL.toFixed(1)} L</span>
            <span className="font-medium text-gray-900">{toNaira(result.herbicideCost)}</span>
          </div>
          {useInsecticide && (
            <div className="flex justify-between">
              <span className="text-gray-700">Insecticide — {result.insecticideTotalL.toFixed(1)} L</span>
              <span className="font-medium text-gray-900">{toNaira(result.insecticideCost)}</span>
            </div>
          )}
          {useFungicide && (
            <div className="flex justify-between">
              <span className="text-gray-700">Fungicide — {result.fungicideTotalL.toFixed(1)} L</span>
              <span className="font-medium text-gray-900">{toNaira(result.fungicideCost)}</span>
            </div>
          )}
          {useOrganicManure && (
            <div className="flex justify-between">
              <span className="text-gray-700">Organic manure — {result.manureTotalT.toFixed(1)} tonnes</span>
              <span className="font-medium text-gray-900">{toNaira(result.manureCost)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-indigo-200 pt-4 space-y-1">
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Total for {farmSizeHa.toFixed(2)} ha</span>
            <span>{toNaira(result.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Cost per hectare</span>
            <span>{toNaira(result.perHectare)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Print / save summary
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Estimates are based on general Nigerian extension guideline rates for {profile.label.toLowerCase()} and
        editable market prices you enter — they are not a substitute for a soil test or advice from your state
        Agricultural Development Programme (ADP) office. Use only fertilizers and agrochemicals registered under
        NAFDAC and avoid banned or restricted actives (e.g. unregistered atrazine formulations). Actual yields and
        costs depend on soil condition, rainfall, input quality and local prices, which change often.
      </p>
    </div>
  )
}
