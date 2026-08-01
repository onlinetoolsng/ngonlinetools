'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Context ────────────────────────────────────────────────────────────
// Pure unit conversion — no legal compliance issue in the maths itself.
// Kenyan title deeds officially record land size in hectares (the metric
// system used by surveyors and government under the Land Registration
// Act 2012), while acres and fractional acres are common in everyday
// marketing and conversation, a holdover from the imperial/colonial
// system. "Plot" sizes like 50x100 are informal but standardised in
// real estate — a 50x100ft plot is commonly marketed as "an eighth of an
// acre," though it's actually a little smaller than a true 1/8 acre.
// This tool is for estimation only — the title deed and a licensed
// surveyor are the authoritative source, and any actual subdivision
// requires county approval.

const SQM_PER_ACRE = 4_046.8564224
const SQM_PER_HECTARE = 10_000
const FT_TO_M = 0.3048

type Unit = 'acres' | 'hectares' | 'sqm' | 'sqft'

const UNIT_LABELS: Record<Unit, string> = {
  acres: 'Acres',
  hectares: 'Hectares',
  sqm: 'Square metres (m²)',
  sqft: 'Square feet (ft²)',
}

function toSqm(value: number, unit: Unit): number {
  switch (unit) {
    case 'acres': return value * SQM_PER_ACRE
    case 'hectares': return value * SQM_PER_HECTARE
    case 'sqm': return value
    case 'sqft': return value * FT_TO_M * FT_TO_M
  }
}

function fromSqm(sqm: number, unit: Unit): number {
  switch (unit) {
    case 'acres': return sqm / SQM_PER_ACRE
    case 'hectares': return sqm / SQM_PER_HECTARE
    case 'sqm': return sqm
    case 'sqft': return sqm / (FT_TO_M * FT_TO_M)
  }
}

function fmt(value: number, decimals = 4) {
  if (!Number.isFinite(value)) return '0'
  return value.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

const PLOT_PRESETS = [
  { label: '40 × 80 ft', widthFt: 40, lengthFt: 80, note: 'Common smaller urban plot' },
  { label: '50 × 100 ft', widthFt: 50, lengthFt: 100, note: 'Standard residential plot, often marketed as "1/8 acre" (a true 1/8 acre is slightly larger)' },
  { label: '100 × 100 ft', widthFt: 100, lengthFt: 100, note: 'Often marketed as "1/4 acre"' },
]

type Mode = 'convert' | 'plot' | 'subdivide'

export function KenyaLandSizeConverter(_props: { locale: string }) {
  const [mode, setMode] = useState<Mode>('convert')

  // Direct converter
  const [convertValue, setConvertValue] = useState('1')
  const [convertUnit, setConvertUnit] = useState<Unit>('acres')
  const convertSqm = toSqm(parseFloat(convertValue) || 0, convertUnit)

  // Plot dimensions
  const [widthInput, setWidthInput] = useState('50')
  const [lengthInput, setLengthInput] = useState('100')
  const [dimUnit, setDimUnit] = useState<'ft' | 'm'>('ft')
  const widthVal = parseFloat(widthInput) || 0
  const lengthVal = parseFloat(lengthInput) || 0
  const plotSqm = dimUnit === 'ft' ? widthVal * FT_TO_M * (lengthVal * FT_TO_M) : widthVal * lengthVal

  // Subdivision estimator
  const [totalLandValue, setTotalLandValue] = useState('1')
  const [totalLandUnit, setTotalLandUnit] = useState<Unit>('acres')
  const [subPlotWidth, setSubPlotWidth] = useState('50')
  const [subPlotLength, setSubPlotLength] = useState('100')
  const totalLandSqm = toSqm(parseFloat(totalLandValue) || 0, totalLandUnit)
  const subPlotSqm = (parseFloat(subPlotWidth) || 0) * FT_TO_M * ((parseFloat(subPlotLength) || 0) * FT_TO_M)
  const rawPlotCount = subPlotSqm > 0 ? totalLandSqm / subPlotSqm : 0
  const usableEstimate = Math.floor(rawPlotCount * 0.8) // rough allowance for roads/access — usable area is typically lower than raw division

  const activeSqm = mode === 'convert' ? convertSqm : mode === 'plot' ? plotSqm : 0

  const results = useMemo(() => {
    if (mode === 'subdivide') return null
    return {
      acres: fromSqm(activeSqm, 'acres'),
      hectares: fromSqm(activeSqm, 'hectares'),
      sqm: activeSqm,
      sqft: fromSqm(activeSqm, 'sqft'),
    }
  }, [activeSqm, mode])

  const copyResult = () => {
    if (mode === 'subdivide') {
      navigator.clipboard.writeText(`${fmt(totalLandSqm / SQM_PER_ACRE, 3)} acres ÷ ${subPlotWidth}×${subPlotLength}ft plots ≈ ${Math.floor(rawPlotCount)} raw plots (≈${usableEstimate} usable after roads/access)`)
      return
    }
    if (!results) return
    navigator.clipboard.writeText(`${fmt(results.acres, 4)} acres = ${fmt(results.hectares, 4)} Ha = ${fmt(results.sqm, 1)} m² = ${fmt(results.sqft, 0)} ft²`)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 text-xs font-semibold">
        {([
          ['convert', 'Direct Converter'],
          ['plot', 'Plot Dimensions'],
          ['subdivide', 'Subdivision Estimator'],
        ] as [Mode, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`flex-1 px-2 py-2.5 rounded-lg border transition-colors ${mode === key ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-gray-500 border-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'convert' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Value</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(convertValue)}
                onChange={e => setConvertValue(cleanNumberInput(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit</label>
              <select value={convertUnit} onChange={e => setConvertUnit(e.target.value as Unit)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900">
                {(Object.keys(UNIT_LABELS) as Unit[]).map(u => (
                  <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {mode === 'plot' && (
        <div className="space-y-3">
          <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm w-fit">
            {(['ft', 'm'] as const).map(u => (
              <button key={u} type="button" onClick={() => setDimUnit(u)} className={`px-4 py-2 font-semibold ${dimUnit === u ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>
                {u === 'ft' ? 'Feet' : 'Metres'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Width ({dimUnit})</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(widthInput)} onChange={e => setWidthInput(cleanNumberInput(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Length ({dimUnit})</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(lengthInput)} onChange={e => setLengthInput(cleanNumberInput(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLOT_PRESETS.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => { setDimUnit('ft'); setWidthInput(String(p.widthFt)); setLengthInput(String(p.lengthFt)) }}
                className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
          {PLOT_PRESETS.find(p => dimUnit === 'ft' && p.widthFt === widthVal && p.lengthFt === lengthVal) && (
            <p className="text-xs text-gray-400">{PLOT_PRESETS.find(p => p.widthFt === widthVal && p.lengthFt === lengthVal)?.note}</p>
          )}
        </div>
      )}

      {mode === 'subdivide' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total land</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(totalLandValue)} onChange={e => setTotalLandValue(cleanNumberInput(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit</label>
              <select value={totalLandUnit} onChange={e => setTotalLandUnit(e.target.value as Unit)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900">
                {(Object.keys(UNIT_LABELS) as Unit[]).map(u => (
                  <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-700">Divide into plots of (ft):</p>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" inputMode="decimal" value={formatNumberInput(subPlotWidth)} onChange={e => setSubPlotWidth(cleanNumberInput(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900" placeholder="Width" />
            <input type="text" inputMode="decimal" value={formatNumberInput(subPlotLength)} onChange={e => setSubPlotLength(cleanNumberInput(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900" placeholder="Length" />
          </div>

          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Raw division (no roads/access deducted)</span>
              <span className="font-medium text-gray-800">{Math.floor(rawPlotCount)} plots</span>
            </div>
            <div className="flex justify-between border-t border-indigo-100 pt-2">
              <span className="text-gray-700 font-medium">Estimated usable plots (≈20% for roads/access)</span>
              <span className="font-bold text-indigo-700 text-lg">{usableEstimate} plots</span>
            </div>
            <p className="text-[11px] text-gray-400 pt-1">The usable estimate assumes roughly 20% of the land goes to roads, access, and setbacks — actual usable count depends heavily on the plot&apos;s shape, access requirements, and county planning rules. This is a rough planning estimate, not a subdivision plan.</p>
            <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
          </div>
        </div>
      )}

      {results && (
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-xl p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs">Acres</p>
              <p className="font-semibold text-gray-900">{fmt(results.acres, 4)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs">Hectares <span className="text-gray-400">(title deed)</span></p>
              <p className="font-semibold text-gray-900">{fmt(results.hectares, 4)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs">Square metres</p>
              <p className="font-semibold text-gray-900">{fmt(results.sqm, 1)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-100">
              <p className="text-gray-500 text-xs">Square feet</p>
              <p className="font-semibold text-gray-900">{fmt(results.sqft, 0)}</p>
            </div>
          </div>
          <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Good to know</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Title deeds officially record land size in hectares — treat that figure, not a marketing label like &quot;1/8 acre,&quot; as the authoritative size.</li>
          <li>A 50×100ft plot (≈464.5 m², ≈0.0465 Ha) is commonly marketed as &quot;1/8 acre,&quot; but a true 1/8 acre is slightly larger, at about 506 m².</li>
          <li>1 acre = 4,046.86 m² = 43,560 ft² ≈ 0.404686 hectares. 1 hectare = 10,000 m² ≈ 2.47105 acres.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          For estimation only. Always verify actual size against the official title deed and a licensed surveyor. Any real subdivision requires county government approval.
        </p>
      </div>
    </div>
  )
}
