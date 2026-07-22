'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Nigeria-specific benchmarks (comment-maintained, not live-scraped) ────
// Residential construction cost per sqm has moved sharply since 2023 as
// cement, reinforcement steel, and imported finishes tracked naira
// depreciation. Ranges below reflect multiple 2026 market-rate guides for
// Lagos, Abuja, Port Harcourt, Ibadan and Enugu, cross-checked against
// each other — actual quotes still vary widely by contractor, so treat
// these as a starting range, not a quote. Refresh periodically.
type Tier = 'economy' | 'standard' | 'luxury'

const LOCATIONS = {
  lagos: {
    label: 'Lagos',
    rates: { economy: [130000, 190000], standard: [200000, 300000], luxury: [320000, 480000] } as Record<Tier, [number, number]>,
  },
  abuja: {
    label: 'Abuja',
    rates: { economy: [120000, 175000], standard: [180000, 270000], luxury: [290000, 430000] } as Record<Tier, [number, number]>,
  },
  'port-harcourt': {
    label: 'Port Harcourt',
    rates: { economy: [110000, 160000], standard: [165000, 250000], luxury: [260000, 390000] } as Record<Tier, [number, number]>,
  },
  ibadan: {
    label: 'Ibadan',
    rates: { economy: [90000, 135000], standard: [140000, 210000], luxury: [220000, 330000] } as Record<Tier, [number, number]>,
  },
  enugu: {
    label: 'Enugu',
    rates: { economy: [85000, 125000], standard: [130000, 195000], luxury: [205000, 310000] } as Record<Tier, [number, number]>,
  },
  other: {
    label: 'Other Nigerian City/Town',
    rates: { economy: [80000, 120000], standard: [120000, 180000], luxury: [190000, 290000] } as Record<Tier, [number, number]>,
  },
}
type LocationKey = keyof typeof LOCATIONS

// Lagos sub-areas: soil conditions in reclaimed/waterfront areas (Lekki,
// Victoria Island, Ikoyi, Banana Island) often require raft or pile
// foundations instead of ordinary strip/pad foundations, raising cost.
const LAGOS_AREAS = {
  mainland: { label: 'Mainland (Ikeja, Yaba, Surulere, etc.)', multiplier: 1.0, foundation: 'Strip/pad foundation (typical firm soil)' },
  'island-lekki': { label: 'Island / Lekki / VI / Ikoyi', multiplier: 1.15, foundation: 'Raft or pile foundation often required (soft/reclaimed soil)' },
  outskirts: { label: 'Ajah, Sangotedo & outskirts', multiplier: 0.95, foundation: 'Strip/pad foundation, occasional raft in low-lying plots' },
}
type LagosAreaKey = keyof typeof LAGOS_AREAS

const BUILDING_PRESETS = [
  { label: '2-Bedroom Bungalow', sqm: 90, floors: 1 },
  { label: '3-Bedroom Bungalow', sqm: 130, floors: 1 },
  { label: '4-Bedroom Duplex', sqm: 220, floors: 2 },
  { label: '5-Bedroom Duplex', sqm: 320, floors: 2 },
  { label: 'Block of Flats (6 units)', sqm: 450, floors: 3 },
]

// Rough component breakdown of the base build cost — standard Nigerian QS
// rule-of-thumb allocations, not project-specific.
const COMPONENT_SHARES = {
  foundation: 0.13,
  superstructure: 0.28,
  roofing: 0.10,
  finishes: 0.29,
  plumbingElectrical: 0.20,
}
const COMPONENT_LABELS: Record<keyof typeof COMPONENT_SHARES, string> = {
  foundation: 'Foundation & Substructure',
  superstructure: 'Superstructure (walls, columns, beams)',
  roofing: 'Roofing',
  finishes: 'Finishes (tiles, paint, doors, windows)',
  plumbingElectrical: 'Plumbing & Electrical',
}
const PIE_COLORS = ['#4338ca', '#6366f1', '#f59e0b', '#059669', '#0891b2']

function formatNaira(value: number) {
  return `₦${Math.round(Math.max(0, value)).toLocaleString('en-NG')}`
}

function timelineEstimate(sqm: number, floors: number) {
  if (floors >= 3 || sqm >= 300) return '14–24 months'
  if (sqm >= 150) return '10–15 months'
  if (sqm >= 90) return '8–12 months'
  return '6–9 months'
}

export function NigeriaConstructionCostEstimator(_props: { locale: string }) {
  const [floorArea, setFloorArea] = useState<string>('130')
  const [floors, setFloors] = useState<string>('1')
  const [location, setLocation] = useState<LocationKey>('lagos')
  const [lagosArea, setLagosArea] = useState<LagosAreaKey>('mainland')
  const [tier, setTier] = useState<Tier>('standard')

  const [includeFence, setIncludeFence] = useState(false)
  const [fenceAmount, setFenceAmount] = useState<string>('2500000')
  const [includeExternalWorks, setIncludeExternalWorks] = useState(false)
  const [externalWorksAmount, setExternalWorksAmount] = useState<string>('1200000')
  const [includeGenerator, setIncludeGenerator] = useState(false)
  const [generatorAmount, setGeneratorAmount] = useState<string>('450000')
  const [includeBorehole, setIncludeBorehole] = useState(false)
  const [boreholeAmount, setBoreholeAmount] = useState<string>('1800000')

  const [contingencyPct, setContingencyPct] = useState<string>('12')
  const [professionalFeesPct, setProfessionalFeesPct] = useState<string>('7')
  const [copied, setCopied] = useState(false)

  const calc = useMemo(() => {
    const sqm = Math.min(2000, Math.max(20, parseFloat(floorArea) || 0))
    const numFloors = Math.min(6, Math.max(1, parseInt(floors, 10) || 1))
    const [rateLow, rateHigh] = LOCATIONS[location].rates[tier]

    const areaMultiplier = location === 'lagos' ? LAGOS_AREAS[lagosArea].multiplier : 1
    const floorsMultiplier = 1 + (numFloors - 1) * 0.08

    const combinedMultiplier = areaMultiplier * floorsMultiplier
    const perSqmLow = rateLow * combinedMultiplier
    const perSqmHigh = rateHigh * combinedMultiplier
    const perSqmMid = (perSqmLow + perSqmHigh) / 2

    const baseLow = sqm * perSqmLow
    const baseHigh = sqm * perSqmHigh
    const baseMid = sqm * perSqmMid

    const extras =
      (includeFence ? Math.max(0, parseFloat(fenceAmount) || 0) : 0) +
      (includeExternalWorks ? Math.max(0, parseFloat(externalWorksAmount) || 0) : 0) +
      (includeGenerator ? Math.max(0, parseFloat(generatorAmount) || 0) : 0) +
      (includeBorehole ? Math.max(0, parseFloat(boreholeAmount) || 0) : 0)

    const contingency = Math.max(0, parseFloat(contingencyPct) || 0) / 100
    const profFees = Math.max(0, parseFloat(professionalFeesPct) || 0) / 100

    const subtotalLow = baseLow + extras
    const subtotalMid = baseMid + extras
    const subtotalHigh = baseHigh + extras

    const totalLow = subtotalLow * (1 + contingency + profFees)
    const totalMid = subtotalMid * (1 + contingency + profFees)
    const totalHigh = subtotalHigh * (1 + contingency + profFees)

    const pieData = (Object.keys(COMPONENT_SHARES) as (keyof typeof COMPONENT_SHARES)[]).map(key => ({
      name: COMPONENT_LABELS[key],
      value: baseMid * COMPONENT_SHARES[key],
    }))

    // Very rough illustrative BoQ quantities — a registered QS's Bill of
    // Quantities from actual drawings is the only reliable version of this.
    const cementBags = Math.round(sqm * 5.2 * numFloors ** 0.3)
    const blocks9inch = Math.round(sqm * 42 * numFloors ** 0.4)
    const reinforcementTons = +(sqm * 0.035 * numFloors ** 0.3).toFixed(1)

    return {
      sqm,
      numFloors,
      perSqmMid,
      baseMid,
      extras,
      contingencyAmount: subtotalMid * contingency,
      profFeesAmount: subtotalMid * profFees,
      totalLow,
      totalMid,
      totalHigh,
      pieData,
      cementBags,
      blocks9inch,
      reinforcementTons,
      timeline: timelineEstimate(sqm, numFloors),
    }
  }, [
    floorArea,
    floors,
    location,
    lagosArea,
    tier,
    includeFence,
    fenceAmount,
    includeExternalWorks,
    externalWorksAmount,
    includeGenerator,
    generatorAmount,
    includeBorehole,
    boreholeAmount,
    contingencyPct,
    professionalFeesPct,
  ])

  const applyPreset = (preset: (typeof BUILDING_PRESETS)[number]) => {
    setFloorArea(String(preset.sqm))
    setFloors(String(preset.floors))
  }

  const reset = () => {
    setFloorArea('130')
    setFloors('1')
    setLocation('lagos')
    setLagosArea('mainland')
    setTier('standard')
    setIncludeFence(false)
    setFenceAmount('2500000')
    setIncludeExternalWorks(false)
    setExternalWorksAmount('1200000')
    setIncludeGenerator(false)
    setGeneratorAmount('450000')
    setIncludeBorehole(false)
    setBoreholeAmount('1800000')
    setContingencyPct('12')
    setProfessionalFeesPct('7')
  }

  const copyResult = () => {
    const text = `${calc.sqm}sqm, ${calc.numFloors} floor(s), ${LOCATIONS[location].label}, ${tier} finish — Estimated total: ${formatNaira(calc.totalLow)} to ${formatNaira(calc.totalHigh)} (mid ${formatNaira(calc.totalMid)}), ~${formatNaira(calc.perSqmMid)}/sqm. Excludes land. Educational estimate only, not a quote.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {BUILDING_PRESETS.map(p => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p)}
            className="px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Core inputs */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Floor Area (sqm)</label>
          <input
            type="text"
            inputMode="decimal"
            value={floorArea}
            onChange={e => setFloorArea(e.target.value.replace(/[^\d.]/g, ''))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="130"
          />
          <p className="text-xs text-gray-400 mt-1">A typical 3-bedroom bungalow is roughly 100–150 sqm.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Floors</label>
          <select
            value={floors}
            onChange={e => setFloors(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition bg-white"
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'floor (bungalow)' : 'floors'}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
          <select
            value={location}
            onChange={e => setLocation(e.target.value as LocationKey)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition bg-white"
          >
            {(Object.keys(LOCATIONS) as LocationKey[]).map(key => (
              <option key={key} value={key}>{LOCATIONS[key].label}</option>
            ))}
          </select>
        </div>

        {location === 'lagos' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lagos Area</label>
            <select
              value={lagosArea}
              onChange={e => setLagosArea(e.target.value as LagosAreaKey)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition bg-white"
            >
              {(Object.keys(LAGOS_AREAS) as LagosAreaKey[]).map(key => (
                <option key={key} value={key}>{LAGOS_AREAS[key].label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {location === 'lagos' && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-200">
          Suggested foundation type for this area: <span className="font-medium text-gray-700">{LAGOS_AREAS[lagosArea].foundation}</span>.
          A site-specific soil test is the only way to confirm what your plot actually needs.
        </p>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Quality Tier</label>
        <div className="grid grid-cols-3 gap-2">
          {(['economy', 'standard', 'luxury'] as Tier[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`py-2.5 rounded-xl text-sm font-semibold capitalize border transition-colors ${
                tier === t
                  ? 'bg-indigo-700 text-white border-indigo-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Extras */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-700">Optional Extras</p>
        {[
          { checked: includeFence, setChecked: setIncludeFence, amount: fenceAmount, setAmount: setFenceAmount, label: 'Perimeter fence & gate' },
          { checked: includeExternalWorks, setChecked: setIncludeExternalWorks, amount: externalWorksAmount, setAmount: setExternalWorksAmount, label: 'External works / compound paving' },
          { checked: includeGenerator, setChecked: setIncludeGenerator, amount: generatorAmount, setAmount: setGeneratorAmount, label: 'Generator house & wiring provision' },
          { checked: includeBorehole, setChecked: setIncludeBorehole, amount: boreholeAmount, setAmount: setBoreholeAmount, label: 'Borehole & water treatment' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={e => item.setChecked(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600">{item.label}</span>
            </label>
            {item.checked && (
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(item.amount)}
                onChange={e => item.setAmount(cleanNumberInput(e.target.value))}
                className="w-32 rounded-lg border border-gray-200 px-2 py-1.5 text-sm font-medium text-gray-900 text-right focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              />
            )}
          </div>
        ))}
      </div>

      {/* Contingency & fees */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Contingency (%)</label>
          <input
            type="text"
            inputMode="decimal"
            value={contingencyPct}
            onChange={e => setContingencyPct(e.target.value.replace(/[^\d.]/g, ''))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
          <p className="text-xs text-gray-400 mt-1">Typical range: 10–15%+</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Professional Fees (%)</label>
          <input
            type="text"
            inputMode="decimal"
            value={professionalFeesPct}
            onChange={e => setProfessionalFeesPct(e.target.value.replace(/[^\d.]/g, ''))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
          <p className="text-xs text-gray-400 mt-1">QS, architect, engineer — typical 5–8%</p>
        </div>
      </div>

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-4">
        <div>
          <p className="text-xs text-indigo-600 mb-1">Estimated Total Construction Cost</p>
          <p className="text-2xl sm:text-3xl font-black text-indigo-900">
            {formatNaira(calc.totalLow)} – {formatNaira(calc.totalHigh)}
          </p>
          <p className="text-sm text-indigo-700 mt-1">Mid-range estimate: {formatNaira(calc.totalMid)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm border-t border-indigo-200 pt-3">
          <div>
            <span className="text-indigo-600 text-xs">Per sqm (mid)</span>
            <p className="font-semibold text-indigo-900">{formatNaira(calc.perSqmMid)}</p>
          </div>
          <div>
            <span className="text-indigo-600 text-xs">Estimated Timeline</span>
            <p className="font-semibold text-indigo-900">{calc.timeline}</p>
          </div>
        </div>

        <div className="space-y-1.5 text-sm border-t border-indigo-200 pt-3">
          <div className="flex justify-between">
            <span className="text-indigo-900">Base Build Cost</span>
            <span className="font-medium text-indigo-900">{formatNaira(calc.baseMid)}</span>
          </div>
          {calc.extras > 0 && (
            <div className="flex justify-between">
              <span className="text-indigo-900">Optional Extras</span>
              <span className="font-medium text-indigo-900">{formatNaira(calc.extras)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-indigo-900">Contingency</span>
            <span className="font-medium text-indigo-900">{formatNaira(calc.contingencyAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-indigo-900">Professional Fees</span>
            <span className="font-medium text-indigo-900">{formatNaira(calc.profFeesAmount)}</span>
          </div>
        </div>
      </div>

      {/* Breakdown chart */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={calc.pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={54}>
                {calc.pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: unknown) => formatNaira(Number(v ?? 0))} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-sm text-gray-700 space-y-1 flex-1 min-w-[200px]">
          <p className="font-medium text-gray-900 mb-1.5">Base cost breakdown</p>
          {calc.pieData.map((d, i) => (
            <p key={d.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              {d.name}: {formatNaira(d.value)}
            </p>
          ))}
        </div>
      </div>

      {/* Illustrative BoQ */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2">Rough Bill-of-Quantities Estimate (illustrative)</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-gray-500 text-xs">Cement (bags)</div>
            <div className="font-bold text-gray-900">~{calc.cementBags.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">9" Blocks</div>
            <div className="font-bold text-gray-900">~{calc.blocks9inch.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Reinforcement (tons)</div>
            <div className="font-bold text-gray-900">~{calc.reinforcementTons}</div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Rule-of-thumb quantities for illustration only — a registered Quantity Surveyor's Bill of
          Quantities from actual structural drawings is the only reliable version of this.
        </p>
      </div>

      {/* Next steps */}
      <div className="border border-amber-200 bg-amber-50 rounded-2xl p-5">
        <p className="text-sm font-semibold text-amber-900 mb-2">Next Steps Before You Build</p>
        <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
          <li>Obtain a building permit from your state planning authority (e.g. LASPPPA/LASBCA in Lagos) before any work starts — unpermitted construction risks a stop-work order, fines, or demolition.</li>
          <li>Commission a site-specific soil test to confirm the foundation type your plot actually needs.</li>
          <li>Engage a registered Quantity Surveyor (NIQS/QSRBN) for a proper Bill of Quantities.</li>
          <li>Use a COREN-registered engineer and ARCON-registered architect for structural and design work.</li>
          <li>Budget separately for land, which is excluded from every figure above.</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={copyResult}
          className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl transition-colors"
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

      <p className="text-xs text-gray-400 leading-relaxed">
        For informational/educational/planning purposes only. Not professional advice. This estimate
        excludes land, professional fees beyond the percentage entered above, and further inflation in
        material prices, and can vary significantly from actual contractor quotes based on design,
        soil conditions, and material choices. Consult licensed professionals — a registered QS, a
        COREN-registered engineer, and an ARCON-registered architect — and obtain all necessary permits
        before construction begins.
      </p>
    </div>
  )
}
