'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// -----------------------------------------------------------------------
// PURE CLIENT COMPONENT — no SEO, no schema, no registry imports.
// Parent page (app/[locale]/tools/[category]/[tool]/page.tsx) owns SEO.
// -----------------------------------------------------------------------

type GenType = 'petrol' | 'diesel';

interface GenPreset {
  kva: number;
  label: string;
  // approximate L/hr at ~75% load, from published genset spec sheets
  // and Nigerian market averages — treat as estimates, not manufacturer figures
  baseRateAt75PctLoad: number;
  // rough mid-market solar+lithium hybrid replacement cost for equivalent output
  solarEquivalentCost: number;
}

const PETROL_PRESETS: GenPreset[] = [
  { kva: 2.5, label: '2.5 kVA (small home)', baseRateAt75PctLoad: 1.0, solarEquivalentCost: 2200000 },
  { kva: 3.5, label: '3.5 kVA', baseRateAt75PctLoad: 1.4, solarEquivalentCost: 3000000 },
  { kva: 5, label: '5 kVA (typical 3-bed home)', baseRateAt75PctLoad: 1.8, solarEquivalentCost: 4200000 },
  { kva: 7.5, label: '7.5 kVA', baseRateAt75PctLoad: 2.5, solarEquivalentCost: 6200000 },
  { kva: 10, label: '10 kVA (large home / small office)', baseRateAt75PctLoad: 3.2, solarEquivalentCost: 8200000 },
];

const DIESEL_PRESETS: GenPreset[] = [
  { kva: 2.5, label: '2.5 kVA', baseRateAt75PctLoad: 0.7, solarEquivalentCost: 2200000 },
  { kva: 3.5, label: '3.5 kVA', baseRateAt75PctLoad: 0.9, solarEquivalentCost: 3000000 },
  { kva: 5, label: '5 kVA', baseRateAt75PctLoad: 1.2, solarEquivalentCost: 4200000 },
  { kva: 7.5, label: '7.5 kVA (small business)', baseRateAt75PctLoad: 1.7, solarEquivalentCost: 6200000 },
  { kva: 10, label: '10 kVA (office / shop)', baseRateAt75PctLoad: 2.1, solarEquivalentCost: 8200000 },
];

// Hardcoded fallback fuel prices. There is no free, keyless, reliably-structured
// API for Nigerian pump prices (checked: GlobalPetrolPrices and oilpriceapi are
// paid/key-gated; crowdsourced trackers have no stable JSON endpoint). These are
// editable defaults, not a live feed — update this block periodically.
const FUEL_PRICE_DEFAULTS = {
  petrol: 1250, // ₦/L, pump average, updated manually
  diesel: 1200, // ₦/L, pump average, updated manually
  lastUpdated: '2026-07-01',
};

const PRESET_SCENARIOS = [
  { label: 'Typical 3-bed Lagos home (5kVA petrol, 8hrs/day)', genType: 'petrol' as GenType, kva: 5, hours: 8 },
  { label: 'Small business (7.5kVA diesel, 10hrs/day)', genType: 'diesel' as GenType, kva: 7.5, hours: 10 },
  { label: 'Small shop (2.5kVA petrol, 6hrs/day)', genType: 'petrol' as GenType, kva: 2.5, hours: 6 },
];

function formatNaira(value: number): string {
  return '₦' + Math.round(value).toLocaleString('en-NG');
}

export default function GeneratorSolarPaybackCalculator({ locale }: { locale: string }) {
  const [genType, setGenType] = useState<GenType>('petrol');
  const [kva, setKva] = useState<number>(5);
  const [dailyHours, setDailyHours] = useState<number>(8);
  const [loadPct, setLoadPct] = useState<number>(75);
  const [fuelPrice, setFuelPrice] = useState<number>(FUEL_PRICE_DEFAULTS.petrol);
  const [monthlyMaintenance, setMonthlyMaintenance] = useState<number>(12000);
  const [solarCost, setSolarCost] = useState<number>(4200000);
  const [offsetPct, setOffsetPct] = useState<number>(70);
  const [solarLifespanYears, setSolarLifespanYears] = useState<number>(20);
  const [fuelEscalationPct, setFuelEscalationPct] = useState<number>(15);
  const [projectionYears, setProjectionYears] = useState<number>(10);

  const presets = genType === 'petrol' ? PETROL_PRESETS : DIESEL_PRESETS;
  const activePreset = presets.find((p) => p.kva === kva) ?? presets[2];

  function applyScenario(scenario: (typeof PRESET_SCENARIOS)[number]) {
    setGenType(scenario.genType);
    setKva(scenario.kva);
    setDailyHours(scenario.hours);
    setFuelPrice(FUEL_PRICE_DEFAULTS[scenario.genType]);
    const preset = (scenario.genType === 'petrol' ? PETROL_PRESETS : DIESEL_PRESETS).find(
      (p) => p.kva === scenario.kva
    );
    if (preset) setSolarCost(preset.solarEquivalentCost);
  }

  function handleGenTypeChange(next: GenType) {
    setGenType(next);
    setFuelPrice(FUEL_PRICE_DEFAULTS[next]);
    const preset = (next === 'petrol' ? PETROL_PRESETS : DIESEL_PRESETS).find((p) => p.kva === kva);
    if (preset) setSolarCost(preset.solarEquivalentCost);
  }

  function handleKvaChange(nextKva: number) {
    setKva(nextKva);
    const preset = presets.find((p) => p.kva === nextKva);
    if (preset) setSolarCost(preset.solarEquivalentCost);
  }

  const calc = useMemo(() => {
    // Gensets don't burn fuel proportionally to zero at low load — use a
    // partial-load correction factor: 50% factor floor at low load, scaling to
    // 100% of the rated 75%-load figure by full load.
    const loadFactor = 0.5 + 0.5 * (loadPct / 100);
    const hourlyRate = activePreset.baseRateAt75PctLoad * loadFactor;

    const dailyLitres = hourlyRate * dailyHours;
    const monthlyLitres = dailyLitres * 30;
    const monthlyFuelCost = monthlyLitres * fuelPrice;
    const monthlyGeneratorCost = monthlyFuelCost + monthlyMaintenance;
    const annualGeneratorCost = monthlyGeneratorCost * 12;

    // Portion of generator running cost the solar system offsets
    const offsetFraction = offsetPct / 100;
    const monthlySavings = monthlyGeneratorCost * offsetFraction;
    const annualSavings = monthlySavings * 12;
    const residualMonthlyGeneratorCost = monthlyGeneratorCost - monthlySavings;

    const paybackMonths = annualSavings > 0 ? (solarCost / annualSavings) * 12 : Infinity;

    // Sensitivity: fuel price ±20%
    const bestCaseSavings = annualSavings * 1.2;
    const worstCaseSavings = annualSavings * 0.8;
    const bestCasePaybackMonths = bestCaseSavings > 0 ? (solarCost / bestCaseSavings) * 12 : Infinity;
    const worstCasePaybackMonths = worstCaseSavings > 0 ? (solarCost / worstCaseSavings) * 12 : Infinity;

    // Multi-year cumulative cost comparison, with fuel escalation and one
    // battery replacement assumed at year 10 (rough midpoint of the typical
    // 8-12 year lithium replacement window)
    const chartData: { year: string; generatorCost: number; solarCost: number }[] = [];
    let cumulativeGenerator = 0;
    let cumulativeSolarPath = solarCost;
    for (let year = 1; year <= projectionYears; year++) {
      const escalatedAnnualFuel =
        monthlyFuelCost * 12 * Math.pow(1 + fuelEscalationPct / 100, year - 1);
      const yearGeneratorCost = escalatedAnnualFuel + monthlyMaintenance * 12;
      cumulativeGenerator += yearGeneratorCost;

      const yearResidualCost =
        yearGeneratorCost * (1 - offsetFraction) + monthlyMaintenance * 12 * 0; // maintenance already inside yearGeneratorCost
      cumulativeSolarPath += yearResidualCost;
      if (year === 10 && solarLifespanYears > 10) {
        cumulativeSolarPath += solarCost * 0.35; // rough battery replacement share of system cost
      }

      chartData.push({
        year: `Yr ${year}`,
        generatorCost: Math.round(cumulativeGenerator),
        solarCost: Math.round(cumulativeSolarPath),
      });
    }

    return {
      hourlyRate,
      monthlyLitres,
      monthlyFuelCost,
      monthlyGeneratorCost,
      annualGeneratorCost,
      monthlySavings,
      annualSavings,
      residualMonthlyGeneratorCost,
      paybackMonths,
      bestCasePaybackMonths,
      worstCasePaybackMonths,
      chartData,
    };
  }, [
    activePreset,
    dailyHours,
    loadPct,
    fuelPrice,
    monthlyMaintenance,
    solarCost,
    offsetPct,
    projectionYears,
    fuelEscalationPct,
    solarLifespanYears,
  ]);

  function formatPayback(months: number): string {
    if (!isFinite(months)) return 'N/A (no savings at current inputs)';
    const years = Math.floor(months / 12);
    const remMonths = Math.round(months % 12);
    if (years === 0) return `${remMonths} month${remMonths === 1 ? '' : 's'}`;
    return `${years} yr${years === 1 ? '' : 's'} ${remMonths} mo`;
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        For informational and educational purposes only. Actual costs vary with usage patterns,
        maintenance quality, fuel prices, equipment quality, and installation. This tool is not
        financial advice — consult a licensed solar installer and compare multiple quotes before
        investing.
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Quick presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_SCENARIOS.map((scenario) => (
            <button
              key={scenario.label}
              type="button"
              onClick={() => applyScenario(scenario)}
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-100"
            >
              {scenario.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INPUTS */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Your generator</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generator type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleGenTypeChange('petrol')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  genType === 'petrol'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                Petrol
              </button>
              <button
                type="button"
                onClick={() => handleGenTypeChange('diesel')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  genType === 'diesel'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                Diesel
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generator size</label>
            <select
              value={kva}
              onChange={(e) => handleKvaChange(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {presets.map((p) => (
                <option key={p.kva} value={p.kva}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily runtime: {dailyHours} hrs
            </label>
            <input
              type="range"
              min={1}
              max={24}
              step={1}
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full"
              aria-label="Daily generator runtime in hours"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typical load: {loadPct}%
            </label>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={loadPct}
              onChange={(e) => setLoadPct(Number(e.target.value))}
              className="w-full"
              aria-label="Typical generator load percentage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fuel price (₦/litre)
            </label>
            <input
              type="number"
              min={0}
              value={fuelPrice}
              onChange={(e) => setFuelPrice(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              aria-label="Fuel price per litre in naira"
            />
            <p className="text-xs text-gray-400 mt-1">
              Default reflects pump prices around {formatNaira(FUEL_PRICE_DEFAULTS.petrol)}–
              {formatNaira(FUEL_PRICE_DEFAULTS.diesel)}/L as of {FUEL_PRICE_DEFAULTS.lastUpdated}.
              Edit to match your local price.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly maintenance (₦)
            </label>
            <input
              type="number"
              min={0}
              value={monthlyMaintenance}
              onChange={(e) => setMonthlyMaintenance(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              aria-label="Monthly generator maintenance cost in naira"
            />
          </div>

          <h2 className="text-base font-semibold text-gray-900 pt-2">Solar assumptions</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solar system cost (₦)
            </label>
            <input
              type="number"
              min={0}
              value={solarCost}
              onChange={(e) => setSolarCost(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              aria-label="Solar system upfront cost in naira"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Generator runtime replaced by solar: {offsetPct}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={offsetPct}
              onChange={(e) => setOffsetPct(Number(e.target.value))}
              className="w-full"
              aria-label="Percentage of generator use offset by solar"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Panel lifespan (yrs)
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={solarLifespanYears}
                onChange={(e) => setSolarLifespanYears(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel price rise/yr (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={fuelEscalationPct}
                onChange={(e) => setFuelEscalationPct(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Lithium battery packs typically need replacing every 8–12 years; the projection
            below assumes one replacement around year 10 if your projection window is long enough.
          </p>
        </div>

        {/* RESULTS */}
        <div className="rounded-xl border border-gray-200 bg-indigo-50 p-5 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Results</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Generator cost / month</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNaira(calc.monthlyGeneratorCost)}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Generator cost / year</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatNaira(calc.annualGeneratorCost)}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Estimated savings / month</p>
              <p className="text-lg font-semibold text-green-700">
                {formatNaira(calc.monthlySavings)}
              </p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Estimated savings / year</p>
              <p className="text-lg font-semibold text-green-700">
                {formatNaira(calc.annualSavings)}
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Payback period</p>
            <p className="text-2xl font-bold text-indigo-700">{formatPayback(calc.paybackMonths)}</p>
            <p className="text-xs text-gray-500 mt-1">
              Range at ±20% fuel price: {formatPayback(calc.bestCasePaybackMonths)} best case,{' '}
              {formatPayback(calc.worstCasePaybackMonths)} worst case.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                Cumulative cost over {projectionYears} years
              </p>
              <select
                value={projectionYears}
                onChange={(e) => setProjectionYears(Number(e.target.value))}
                className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                aria-label="Projection window in years"
              >
                <option value={5}>5 years</option>
                <option value={10}>10 years</option>
              </select>
            </div>
            <div className="rounded-lg bg-white p-2" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calc.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip formatter={(value: unknown) => formatNaira(Number(value ?? 0))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="generatorCost" name="Generator (cumulative)" fill="#f97316" />
                  <Bar dataKey="solarCost" name="Solar path (cumulative)" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Estimates only. Actuals vary with usage, maintenance, fuel prices, system quality, and
            installation. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
