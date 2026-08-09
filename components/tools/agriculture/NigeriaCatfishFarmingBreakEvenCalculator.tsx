'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * components/tools/agriculture/NigeriaCatfishFarmingBreakEvenCalculator.tsx
 *
 * ─── Context ────────────────────────────────────────────────────────────
 * Direct parity with PoultryFarmStartupCalculator.tsx: same section layout
 * (scale → costs → revenue → results → cost pie → sensitivity table →
 * assumptions → disclaimer), same naira formatting convention, same plain
 * <input type="number"> style. Covers private Clarias gariepinus (catfish)
 * grow-out — there's no special national statutory formula governing
 * break-even here, this is a pure economic planning calculator built on
 * 2025–2026 farmer-reported market ranges, not a compliance tool. Larger
 * commercial operations may need CAC registration, EIA, and Federal
 * Department of Fisheries & Aquaculture / state licensing.
 */

interface CalculatorProps {
  locale: string;
}

type FeedMode = 'auto' | 'manual';
type Scale = 'small' | 'standard' | 'medium';

const PIE_COLORS = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#0f766e', '#134e4a'];

const PRESETS: Record<Scale, { stocked: number; setup: number; labour: number; water: number; meds: number; transport: number; misc: number }> = {
  small:    { stocked: 500,  setup: 90_000,  labour: 35_000, water: 22_000, meds: 15_000, transport: 12_000, misc: 12_000 },
  standard: { stocked: 1000, setup: 160_000, labour: 60_000, water: 40_000, meds: 25_000, transport: 20_000, misc: 20_000 },
  medium:   { stocked: 3000, setup: 420_000, labour: 150_000, water: 100_000, meds: 65_000, transport: 50_000, misc: 55_000 },
};

function formatNaira(n: number) {
  if (!isFinite(n)) return '₦0';
  return `₦${Math.round(n).toLocaleString('en-NG')}`;
}

function formatKg(n: number) {
  if (!isFinite(n)) return '0 kg';
  return `${n.toLocaleString('en-NG', { maximumFractionDigits: 1 })} kg`;
}

export default function NigeriaCatfishFarmingBreakEvenCalculator({ locale: _locale }: CalculatorProps) {
  // --- Production scale ---
  const [stockedCount, setStockedCount] = useState(1000);
  const [survivalPct, setSurvivalPct] = useState(85);
  const [avgHarvestWeightKg, setAvgHarvestWeightKg] = useState(1.0);
  const [cycleMonths, setCycleMonths] = useState(6);
  const [cyclesPerYear, setCyclesPerYear] = useState(1.5);

  // --- Costs ---
  const [costPerFingerling, setCostPerFingerling] = useState(60);
  const [feedMode, setFeedMode] = useState<FeedMode>('auto');
  const [fcr, setFcr] = useState(1.3);
  const [pricePerKgFeed, setPricePerKgFeed] = useState(1900);
  const [manualFeedCost, setManualFeedCost] = useState(1_800_000);
  const [setupCost, setSetupCost] = useState(160_000);
  const [labourCost, setLabourCost] = useState(60_000);
  const [waterPowerFuel, setWaterPowerFuel] = useState(40_000);
  const [medsCost, setMedsCost] = useState(25_000);
  const [transportMarketing, setTransportMarketing] = useState(20_000);
  const [miscContingency, setMiscContingency] = useState(20_000);

  // --- Revenue ---
  const [pricePerKg, setPricePerKg] = useState(3000);
  const [sellsProcessed, setSellsProcessed] = useState(false);
  const [pctProcessed, setPctProcessed] = useState(20);
  const [processedPremiumPerKg, setProcessedPremiumPerKg] = useState(500);

  function applyPreset(scale: Scale) {
    const p = PRESETS[scale];
    setStockedCount(p.stocked);
    setSetupCost(p.setup);
    setLabourCost(p.labour);
    setWaterPowerFuel(p.water);
    setMedsCost(p.meds);
    setTransportMarketing(p.transport);
    setMiscContingency(p.misc);
  }

  function resetDefaults() {
    applyPreset('standard');
    setSurvivalPct(85);
    setAvgHarvestWeightKg(1.0);
    setCycleMonths(6);
    setCyclesPerYear(1.5);
    setCostPerFingerling(60);
    setFeedMode('auto');
    setFcr(1.3);
    setPricePerKgFeed(1900);
    setManualFeedCost(1_800_000);
    setPricePerKg(3000);
    setSellsProcessed(false);
    setPctProcessed(20);
    setProcessedPremiumPerKg(500);
  }

  const results = useMemo(() => {
    const harvestedFish = Math.max(stockedCount * (survivalPct / 100), 0.0001);
    const totalHarvestWeightKg = harvestedFish * avgHarvestWeightKg;

    const feedKgTotal = fcr * totalHarvestWeightKg;
    const feedCostAuto = feedKgTotal * pricePerKgFeed;
    const feedCost = feedMode === 'auto' ? feedCostAuto : manualFeedCost;

    const fingerlingsCost = stockedCount * costPerFingerling;
    const opex = fingerlingsCost + feedCost + labourCost + waterPowerFuel + medsCost + transportMarketing + miscContingency;
    const totalCost = opex + setupCost;

    const blendedPricePerKg = sellsProcessed
      ? pricePerKg + (pctProcessed / 100) * processedPremiumPerKg
      : pricePerKg;

    const grossRevenue = totalHarvestWeightKg * blendedPricePerKg;
    const netProfit = grossRevenue - totalCost;
    const marginPct = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const roiPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    const costPerKg = totalHarvestWeightKg > 0 ? totalCost / totalHarvestWeightKg : 0;
    const breakEvenPricePerKg = costPerKg;
    const breakEvenFishCount =
      blendedPricePerKg > 0 && avgHarvestWeightKg > 0
        ? totalCost / (blendedPricePerKg * avgHarvestWeightKg)
        : 0;

    const annualRevenue = grossRevenue * cyclesPerYear;
    const annualCost = opex * cyclesPerYear + setupCost; // setup treated as once-off across the year
    const annualProfit = annualRevenue - annualCost;

    const pieData = [
      { name: 'Fingerlings', value: fingerlingsCost },
      { name: 'Feed', value: feedCost },
      { name: 'Pond/tank setup', value: setupCost },
      { name: 'Labour', value: labourCost },
      { name: 'Water/power/fuel', value: waterPowerFuel },
      { name: 'Meds/water quality', value: medsCost },
      { name: 'Transport/marketing', value: transportMarketing },
      { name: 'Misc/contingency', value: miscContingency },
    ].filter((d) => d.value > 0);

    function sensitivityRun(feedMultiplier: number, priceMultiplier: number) {
      const fc = feedMode === 'auto' ? feedCostAuto * feedMultiplier : manualFeedCost * feedMultiplier;
      const opex2 = fingerlingsCost + fc + labourCost + waterPowerFuel + medsCost + transportMarketing + miscContingency;
      const tc = opex2 + setupCost;
      const rev = totalHarvestWeightKg * blendedPricePerKg * priceMultiplier;
      return rev - tc;
    }

    const sensitivity = [
      { label: 'Base case', netProfit },
      { label: 'Feed price +20%', netProfit: sensitivityRun(1.2, 1) },
      { label: 'Feed price -20%', netProfit: sensitivityRun(0.8, 1) },
      { label: 'Selling price +10%', netProfit: sensitivityRun(1, 1.1) },
      { label: 'Selling price -10%', netProfit: sensitivityRun(1, 0.9) },
    ];

    return {
      harvestedFish,
      totalHarvestWeightKg,
      feedKgTotal,
      feedCost,
      fingerlingsCost,
      opex,
      totalCost,
      blendedPricePerKg,
      grossRevenue,
      netProfit,
      marginPct,
      roiPct,
      costPerKg,
      breakEvenPricePerKg,
      breakEvenFishCount,
      annualRevenue,
      annualCost,
      annualProfit,
      pieData,
      sensitivity,
    };
  }, [
    stockedCount, survivalPct, avgHarvestWeightKg, fcr, pricePerKgFeed, feedMode, manualFeedCost,
    costPerFingerling, setupCost, labourCost, waterPowerFuel, medsCost, transportMarketing, miscContingency,
    pricePerKg, sellsProcessed, pctProcessed, processedPremiumPerKg, cyclesPerYear,
  ]);

  return (
    <div className="space-y-6">
      {/* Quick presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => applyPreset('small')} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Small (500 fish)
          </button>
          <button type="button" onClick={() => applyPreset('standard')} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
            Standard (1,000 fish)
          </button>
          <button type="button" onClick={() => applyPreset('medium')} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
            Medium (3,000 fish)
          </button>
        </div>
        <button type="button" onClick={resetDefaults} className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200">
          Reset to Nigeria averages
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Production scale */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Production Scale</h3>
          <div className="space-y-3">
            <label className="block text-sm text-gray-700">
              Number of fingerlings/juveniles stocked
              <input type="range" min={100} max={10000} step={50} value={stockedCount} onChange={(e) => setStockedCount(Number(e.target.value))} className="mt-1 w-full" />
              <input type="number" value={stockedCount} onChange={(e) => setStockedCount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>
            <label className="block text-sm text-gray-700">
              Expected survival rate (%)
              <input type="number" value={survivalPct} onChange={(e) => setSurvivalPct(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>
            <label className="block text-sm text-gray-700">
              Average harvest weight per fish (kg)
              <input type="number" step="0.05" value={avgHarvestWeightKg} onChange={(e) => setAvgHarvestWeightKg(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm text-gray-700">
                Cycle length (months)
                <input type="number" value={cycleMonths} onChange={(e) => setCycleMonths(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
              </label>
              <label className="block text-sm text-gray-700">
                Cycles per year (for annual view)
                <input type="number" step="0.1" value={cyclesPerYear} onChange={(e) => setCyclesPerYear(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
              </label>
            </div>
          </div>
        </section>

        {/* Costs */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">Costs</h3>
          <div className="space-y-3">
            <label className="block text-sm text-gray-700">
              Cost per fingerling/juvenile (₦)
              <input type="number" value={costPerFingerling} onChange={(e) => setCostPerFingerling(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>

            {/* Feed — most prominent cost input */}
            <div className="rounded-lg border-2 border-teal-100 bg-teal-50/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-teal-900">Feed (usually 60–70% of cost)</span>
                <div className="flex rounded-md bg-white text-xs">
                  <button type="button" onClick={() => setFeedMode('auto')} className={`rounded-l-md px-2 py-1 font-medium ${feedMode === 'auto' ? 'bg-teal-600 text-white' : 'text-gray-600'}`}>FCR-based</button>
                  <button type="button" onClick={() => setFeedMode('manual')} className={`rounded-r-md px-2 py-1 font-medium ${feedMode === 'manual' ? 'bg-teal-600 text-white' : 'text-gray-600'}`}>Enter total</button>
                </div>
              </div>
              {feedMode === 'auto' ? (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs text-gray-700">
                    FCR (feed conversion ratio)
                    <input type="number" step="0.05" value={fcr} onChange={(e) => setFcr(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                  </label>
                  <label className="block text-xs text-gray-700">
                    Price per kg of feed (₦)
                    <input type="number" value={pricePerKgFeed} onChange={(e) => setPricePerKgFeed(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                  </label>
                </div>
              ) : (
                <label className="block text-xs text-gray-700">
                  Total feed cost for the cycle (₦)
                  <input type="number" value={manualFeedCost} onChange={(e) => setManualFeedCost(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                </label>
              )}
            </div>

            <label className="block text-sm text-gray-700">
              Pond/tank setup for this cycle (₦)
              <input type="number" value={setupCost} onChange={(e) => setSetupCost(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>
            <label className="block text-sm text-gray-700">
              Labour for the cycle (₦)
              <input type="number" value={labourCost} onChange={(e) => setLabourCost(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>
            <label className="block text-sm text-gray-700">
              Water / pumping / electricity / fuel (₦)
              <input type="number" value={waterPowerFuel} onChange={(e) => setWaterPowerFuel(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>
            <label className="block text-sm text-gray-700">
              Medications / treatments / water quality (₦)
              <input type="number" value={medsCost} onChange={(e) => setMedsCost(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>
            <label className="block text-sm text-gray-700">
              Transport / marketing / harvesting (₦)
              <input type="number" value={transportMarketing} onChange={(e) => setTransportMarketing(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>
            <label className="block text-sm text-gray-700">
              Miscellaneous / contingency (₦)
              <input type="number" value={miscContingency} onChange={(e) => setMiscContingency(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>
          </div>
        </section>
      </div>

      {/* Revenue */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Revenue Assumptions</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block text-sm text-gray-700">
            Expected selling price per kg, farm-gate (₦)
            <input type="number" value={pricePerKg} onChange={(e) => setPricePerKg(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
          </label>
          <label className="mt-1 flex items-center gap-2 text-sm text-gray-700 md:mt-6">
            <input type="checkbox" checked={sellsProcessed} onChange={(e) => setSellsProcessed(e.target.checked)} />
            Some fish sold processed/smoked at a premium
          </label>
          {sellsProcessed && (
            <div className="grid grid-cols-2 gap-2 md:col-span-1">
              <label className="block text-sm text-gray-700">
                % sold processed
                <input type="number" value={pctProcessed} onChange={(e) => setPctProcessed(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
              </label>
              <label className="block text-sm text-gray-700">
                Premium per kg (₦)
                <input type="number" value={processedPremiumPerKg} onChange={(e) => setProcessedPremiumPerKg(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
              </label>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="rounded-xl bg-teal-50 p-5">
        <h3 className="mb-4 text-base font-semibold text-teal-900">Your results</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Net Profit/Loss (this cycle)</p>
            <p className={`mt-1 text-xl font-bold ${results.netProfit >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
              {formatNaira(results.netProfit)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Break-even selling price/kg</p>
            <p className="mt-1 text-xl font-bold text-teal-700">{formatNaira(results.breakEvenPricePerKg)}</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Cost of production per kg</p>
            <p className="mt-1 text-xl font-bold text-teal-700">{formatNaira(results.costPerKg)}</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">ROI</p>
            <p className={`mt-1 text-xl font-bold ${results.roiPct >= 0 ? 'text-teal-700' : 'text-red-600'}`}>{results.roiPct.toFixed(1)}%</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Profit margin</p>
            <p className={`mt-1 text-xl font-bold ${results.marginPct >= 0 ? 'text-teal-700' : 'text-red-600'}`}>{results.marginPct.toFixed(1)}%</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Total investment (this cycle)</p>
            <p className="mt-1 text-xl font-bold text-teal-700">{formatNaira(results.totalCost)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Fish harvested</p>
            <p className="mt-1 text-lg font-semibold text-gray-800">{Math.round(results.harvestedFish).toLocaleString('en-NG')}</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Total harvest weight</p>
            <p className="mt-1 text-lg font-semibold text-gray-800">{formatKg(results.totalHarvestWeightKg)}</p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Total feed used</p>
            <p className="mt-1 text-lg font-semibold text-gray-800">{formatKg(results.feedKgTotal)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-white p-4">
          <p className="mb-1 text-sm font-semibold text-teal-900">Break-even analysis</p>
          <p className="text-sm text-gray-600">
            At your entered selling price of {formatNaira(results.blendedPricePerKg)}/kg, you need to sell at least{' '}
            <span className="font-semibold text-gray-900">{Math.ceil(results.breakEvenFishCount).toLocaleString('en-NG')} fish</span>{' '}
            (about {formatKg(results.breakEvenFishCount * avgHarvestWeightKg)}) to cover your total cost of {formatNaira(results.totalCost)}.
            Below {formatNaira(results.breakEvenPricePerKg)}/kg, this cycle runs at a loss regardless of volume.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-teal-900">Cost breakdown</p>
            <div className="h-56 rounded-lg bg-white p-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={results.pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={75}>
                    {results.pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatNaira(Number(v ?? 0))} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-teal-900">Annual projection (× {cyclesPerYear} cycles/year)</p>
            <div className="space-y-2 rounded-lg bg-white p-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Annual revenue</span><span className="font-medium text-gray-800">{formatNaira(results.annualRevenue)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Annual cost</span><span className="font-medium text-gray-800">{formatNaira(results.annualCost)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-700 font-medium">Annual profit</span><span className={`font-semibold ${results.annualProfit >= 0 ? 'text-teal-700' : 'text-red-600'}`}>{formatNaira(results.annualProfit)}</span></div>
              <p className="pt-1 text-[11px] text-gray-400">Assumes recurring costs repeat each cycle and setup cost is a one-time expense for the year — adjust cycles per year to match how many grow-outs your pond/tank realistically supports.</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold text-teal-900">Sensitivity: what moves your profit</p>
          <div className="overflow-x-auto rounded-lg bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="px-3 py-2">Scenario</th>
                  <th className="px-3 py-2">Net profit (₦)</th>
                </tr>
              </thead>
              <tbody>
                {results.sensitivity.map((row) => (
                  <tr key={row.label} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2 text-gray-700">{row.label}</td>
                    <td className={`px-3 py-2 font-medium ${row.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatNaira(row.netProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <details className="mt-5 rounded-lg bg-white p-3 text-xs text-gray-600">
          <summary className="cursor-pointer font-semibold text-teal-900">Nigeria averages used (2025–2026 market guidance)</summary>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Fingerlings/juveniles: typically ₦40–₦100 each, with quality stock around ₦50–₦80 — common across fish farming clusters like Lagos, Ibadan and Ogun State.</li>
            <li>Feed: a 15kg bag of mid-range floating feed commonly runs ₦22,000–₦36,000; feed is usually 60–70%+ of total operating cost for catfish in Nigeria.</li>
            <li>FCR (feed conversion ratio): 1.2–1.5 is typical with quality floating feed; sinking or local feed and poorer management push this higher.</li>
            <li>Survival: 80–90% is realistic for a well-managed pond or tank; 85% is a reasonable planning default.</li>
            <li>Farm-gate selling price: roughly ₦2,500–₦3,500/kg, with Lagos and Abuja averaging around ₦3,000/kg in early 2026 — prices vary by season, size and buyer type (market women vs restaurants).</li>
            <li>Cycle length: 5–6 months is typical to reach table size (about 1–1.2kg); well-run operations can manage roughly two cycles a year.</li>
          </ul>
        </details>
      </section>

      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-400">
        Figures are planning estimates based on typical Nigerian catfish (Clarias gariepinus) grow-out — for fish farming in Lagos, fish farming in Ibadan, and catfish farms across Nigeria generally. Update the inputs with your own supplier and buyer quotes, since prices move with FX rates and inflation. Feed is usually 60–70% of total cost, and survival rate plus FCR are the two biggest drivers of profitability. This tool is not financial, veterinary, or legal advice.
      </p>
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-400">
        Small-to-medium private catfish ponds and tanks are common and largely unregulated beyond general business registration. Larger or more intensive commercial operations may need Corporate Affairs Commission (CAC) registration, environmental (EIA) clearance, and aquaculture licensing through the Federal Department of Fisheries &amp; Aquaculture or your state ministry of agriculture — confirm current requirements before scaling up.
      </p>
    </div>
  );
}
