'use client'

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// ─── PURE CLIENT COMPONENT — no SEO, no schema, no registry imports. ───────
// Parent page (app/[locale]/tools/[category]/[tool]/page.tsx) owns SEO.
//
// SSEG (Small-Scale Embedded Generation) registration under NRS 097-2-1 /
// SANS 10142-1 is required for any grid-tied or hybrid system that can
// export to the grid. Whether export is actually paid for, or even
// permitted, is set by each municipality, not national law — Cape Town has
// a real cash buyback, several other metros restrict or don't yet pay for
// export. Tariffs, yields and buyback rates below are editable manual
// defaults (not a live feed); update periodically as NERSA/municipal
// tariffs change each July.
const MUNICIPALITY_DATA: Record<string, { label: string; tariff: number; buyback: number; yieldKwhPerKwp: number; exportNote: string }> = {
  eskom: { label: 'Eskom Direct', tariff: 2.71, buyback: 0, yieldKwhPerKwp: 1750, exportNote: 'Eskom direct customers generally cannot export/sell excess power back.' },
  capeTown: { label: 'Cape Town', tariff: 2.95, buyback: 1.35, yieldKwhPerKwp: 1800, exportNote: 'Cape Town offers a real cash buyback for registered SSEG export.' },
  joburg: { label: 'Johannesburg (City Power)', tariff: 2.85, buyback: 0, yieldKwhPerKwp: 1750, exportNote: 'City Power SSEG export approval can be slow; treat export income as unlikely for now.' },
  tshwane: { label: 'Tshwane (Pretoria)', tariff: 2.8, buyback: 0, yieldKwhPerKwp: 1800, exportNote: 'Tshwane restricts reverse feed — plan for self-consumption only, not export income.' },
  ethekwini: { label: 'eThekwini (Durban)', tariff: 2.75, buyback: 0.6, yieldKwhPerKwp: 1700, exportNote: 'eThekwini pays a modest rate for registered SSEG export.' },
  ekurhuleni: { label: 'Ekurhuleni', tariff: 2.8, buyback: 0, yieldKwhPerKwp: 1750, exportNote: 'Confirm current SSEG export terms with Ekurhuleni directly.' },
  other: { label: 'Other Municipality', tariff: 2.85, buyback: 0, yieldKwhPerKwp: 1750, exportNote: 'Export terms vary by municipality — confirm with yours before assuming buyback income.' },
}

const SYSTEM_SIZE_PRESETS = [3, 5, 8, 10]
const PERFORMANCE_RATIO = 0.8 // typical real-world system derating (shading, inverter loss, soiling, temperature)
const COMPANY_TAX_RATE = 0.27 // for the illustrative Section 12B estimate only

type SystemType = 'grid-tied' | 'hybrid'

function formatRand(value: number): string {
  if (!Number.isFinite(value)) return 'R0'
  return 'R' + Math.round(Math.max(0, value)).toLocaleString('en-ZA')
}

function formatYears(years: number): string {
  if (!Number.isFinite(years) || years <= 0) return 'N/A (no savings at current inputs)'
  const y = Math.floor(years)
  const months = Math.round((years - y) * 12)
  if (y === 0) return `${months} month${months === 1 ? '' : 's'}`
  return `${y} year${y === 1 ? '' : 's'}${months > 0 ? ` ${months} mo` : ''}`
}

export default function SouthAfricaSolarPaybackCalculator(_props: { locale: string }) {
  const [municipality, setMunicipality] = useState<keyof typeof MUNICIPALITY_DATA>('eskom')
  const [systemType, setSystemType] = useState<SystemType>('grid-tied')
  const [systemSizeKwp, setSystemSizeKwp] = useState<number>(5)
  const [customSize, setCustomSize] = useState(false)
  const [selfConsumptionPct, setSelfConsumptionPct] = useState<number>(75)
  const [costPerKwp, setCostPerKwp] = useState<number>(20000)
  const [tariffEscalationPct, setTariffEscalationPct] = useState<number>(9)
  const [projectionYears, setProjectionYears] = useState<10 | 20>(10)
  const [section12B, setSection12B] = useState(false)

  const location = MUNICIPALITY_DATA[municipality]

  function handleSystemTypeChange(next: SystemType) {
    setSystemType(next)
    setCostPerKwp(next === 'hybrid' ? 28000 : 20000)
    setSelfConsumptionPct(next === 'hybrid' ? 90 : 75)
  }

  const calc = useMemo(() => {
    const annualGeneration = systemSizeKwp * location.yieldKwhPerKwp * PERFORMANCE_RATIO
    const monthlyGeneration = annualGeneration / 12
    const selfConsumptionFraction = selfConsumptionPct / 100
    const selfConsumedKwh = monthlyGeneration * selfConsumptionFraction
    const exportedKwh = monthlyGeneration - selfConsumedKwh

    const monthlySavings = selfConsumedKwh * location.tariff + exportedKwh * location.buyback
    const annualSavingsYear1 = monthlySavings * 12

    const systemCost = systemSizeKwp * costPerKwp
    // Section 12B: 100% first-year deduction reduces the after-tax cost of
    // the system for a qualifying business by the company tax rate — a
    // simplified illustration, not a tax calculation.
    const netCost = section12B ? systemCost * (1 - COMPANY_TAX_RATE) : systemCost

    const simplePaybackYears = annualSavingsYear1 > 0 ? netCost / annualSavingsYear1 : Infinity

    // Escalated payback: accumulate savings year by year with tariff escalation
    // until cumulative savings clears the net cost.
    let cumulative = 0
    let escalatedPaybackYears = Infinity
    const chartData: { year: string; cumulativeSavings: number; systemCost: number }[] = []
    for (let year = 1; year <= projectionYears; year++) {
      const yearSavings = annualSavingsYear1 * Math.pow(1 + tariffEscalationPct / 100, year - 1)
      const prevCumulative = cumulative
      cumulative += yearSavings
      if (escalatedPaybackYears === Infinity && cumulative >= netCost && yearSavings > 0) {
        const fraction = (netCost - prevCumulative) / yearSavings
        escalatedPaybackYears = year - 1 + fraction
      }
      chartData.push({ year: `Yr ${year}`, cumulativeSavings: Math.round(cumulative), systemCost: Math.round(netCost) })
    }

    const netRoi20 = cumulative - netCost

    return {
      annualGeneration, monthlyGeneration, selfConsumedKwh, exportedKwh,
      monthlySavings, annualSavingsYear1, systemCost, netCost,
      simplePaybackYears, escalatedPaybackYears, chartData, netRoi20,
    }
  }, [systemSizeKwp, location, selfConsumptionPct, costPerKwp, tariffEscalationPct, projectionYears, section12B])

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Solar Payback Calculator (South Africa)</h2>
        <p className="mt-1 text-sm text-gray-600">
          Estimate your solar system&rsquo;s payback period and long-term savings against your municipality&rsquo;s
          tariff and buyback rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INPUTS */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Your setup</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location / municipality</label>
            <select
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value as keyof typeof MUNICIPALITY_DATA)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {Object.entries(MUNICIPALITY_DATA).map(([key, data]) => (
                <option key={key} value={key}>{data.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{location.exportNote}</p>
          </div>

          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => handleSystemTypeChange('grid-tied')}
              className={`flex-1 px-3 py-2 font-medium transition-colors ${systemType === 'grid-tied' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              Grid-Tied
            </button>
            <button
              type="button"
              onClick={() => handleSystemTypeChange('hybrid')}
              className={`flex-1 px-3 py-2 font-medium transition-colors ${systemType === 'hybrid' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
            >
              Hybrid + Battery
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">System size</label>
              <button type="button" onClick={() => setCustomSize(c => !c)} className="text-xs text-indigo-600 font-medium">
                {customSize ? 'Use presets' : 'Enter custom kWp'}
              </button>
            </div>
            {customSize ? (
              <input
                type="number"
                min={1}
                max={100}
                step={0.5}
                value={systemSizeKwp}
                onChange={(e) => setSystemSizeKwp(Number(e.target.value) || 1)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            ) : (
              <div className="flex gap-2 flex-wrap">
                {SYSTEM_SIZE_PRESETS.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSystemSizeKwp(size)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      systemSizeKwp === size ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {size} kWp
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Self-consumption: {selfConsumptionPct}%
            </label>
            <input
              type="range"
              min={40}
              max={100}
              step={5}
              value={selfConsumptionPct}
              onChange={(e) => setSelfConsumptionPct(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-1">Higher with a battery — you use more of what you generate instead of exporting it.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System cost (R/kWp installed)</label>
            <input
              type="number"
              min={5000}
              value={costPerKwp}
              onChange={(e) => setCostPerKwp(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Total system cost: {formatRand(systemSizeKwp * costPerKwp)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tariff escalation: {tariffEscalationPct}%/yr
            </label>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={tariffEscalationPct}
              onChange={(e) => setTariffEscalationPct(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={section12B} onChange={(e) => setSection12B(e.target.checked)} className="rounded border-gray-300" />
            Business — apply Section 12B 100% first-year deduction (illustrative)
          </label>
        </div>

        {/* RESULTS */}
        <div className="rounded-xl border border-gray-200 bg-indigo-50 p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Results</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Est. generation / year</p>
              <p className="text-lg font-semibold text-gray-900">{Math.round(calc.annualGeneration).toLocaleString('en-ZA')} kWh</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">System cost{section12B ? ' (after 12B)' : ''}</p>
              <p className="text-lg font-semibold text-gray-900">{formatRand(calc.netCost)}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Savings / month (Yr 1)</p>
              <p className="text-lg font-semibold text-green-700">{formatRand(calc.monthlySavings)}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Savings / year (Yr 1)</p>
              <p className="text-lg font-semibold text-green-700">{formatRand(calc.annualSavingsYear1)}</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Payback period</p>
            <p className="text-2xl font-bold text-indigo-700">{formatYears(calc.escalatedPaybackYears)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Simple payback (no escalation): {formatYears(calc.simplePaybackYears)}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Cumulative savings vs. system cost</p>
              <select
                value={projectionYears}
                onChange={(e) => setProjectionYears(Number(e.target.value) as 10 | 20)}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
              >
                <option value={10}>10 years</option>
                <option value={20}>20 years</option>
              </select>
            </div>
            <div className="rounded-lg bg-white p-2" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calc.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={Math.floor(projectionYears / 10)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: unknown) => formatRand(Number(value ?? 0))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="systemCost" name="System cost" fill="#f97316" />
                  <Bar dataKey="cumulativeSavings" name="Cumulative savings" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Net position after {projectionYears} years: <span className={calc.netRoi20 >= 0 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>{formatRand(Math.abs(calc.netRoi20))} {calc.netRoi20 >= 0 ? 'ahead' : 'behind'}</span>
          </p>

          <p className="text-xs text-gray-400">
            Estimates only. Actual results depend on a site survey, installer quotes, exact tariff, shading, roof
            orientation, and your municipality&rsquo;s SSEG approval. Not financial advice — consult a qualified
            installer and your municipality before committing.
          </p>
        </div>
      </div>
    </div>
  )
}
