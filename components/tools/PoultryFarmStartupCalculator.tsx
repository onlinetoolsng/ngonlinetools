'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

type FarmType = 'layers' | 'broilers';

interface CalculatorProps {
  locale: string;
}

const PIE_COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

const COPY = {
  en: {
    farmBasics: 'Farm Basics',
    birdDetails: 'Bird Details',
    costs: 'Costs',
    revenue: 'Revenue Assumptions',
    farmType: 'Farm type',
    layers: 'Layers (eggs)',
    broilers: 'Broilers (meat)',
    docCount: 'Number of day-old chicks (DOC)',
    docPrice: 'DOC price per chick (₦)',
    mortality: 'Mortality rate (%)',
    period: 'Target period (weeks)',
    feedBagPrice: 'Feed price per 25kg bag (₦)',
    feedPerBird: 'Total feed per bird for the period (kg)',
    housing: 'Housing / pen (one-time, ₦)',
    workers: 'Number of workers',
    workerSalary: 'Salary per worker per month (₦)',
    vaccines: 'Vaccines & meds per bird (₦)',
    misc: 'Misc costs — utilities, transport (₦, total for the period)',
    eggsPerBird: 'Eggs per bird per day (after point-of-lay)',
    eggPrice: 'Price per egg (₦)',
    broilerPrice: 'Selling price per bird (₦)',
    resetDefaults: 'Reset to Nigeria averages',
    viewUsd: 'View in USD',
    summaryTitle: 'Your results',
    costPerBird: 'Cost per bird to',
    pointOfLay: 'point-of-lay',
    slaughter: 'slaughter',
    totalInvestment: 'Total investment needed',
    breakEvenTitle: 'Break-even',
    sellBirds: (n: string) => `Sell ${n} birds to break even`,
    sellEggs: (n: string) => `Or roughly ${n} eggs to break even`,
    assumptionsBox: 'Nigeria averages used',
    sensitivity: 'Sensitivity: what moves your cost per bird',
    disclaimer:
      "Figures are planning estimates only, built from typical 2026 Nigerian market ranges for day-old chicks, feed and labour. Actual prices vary by state, hatchery and season — always confirm current prices with your supplier before committing capital. This tool does not provide financial, veterinary or legal advice.",
    complianceNote:
      'For commercial operations in Nigeria, consider registering your business with the Corporate Affairs Commission (CAC). Source chicks from reputable hatcheries and follow guidance from a licensed veterinarian for vaccination and disease control.',
    costBreakdown: 'Cost breakdown',
    cumulative: 'Cumulative cost vs. revenue',
    week: 'Week',
    naira: 'Cost per bird (₦)',
    chicksCost: 'Chicks',
    feedCost: 'Feed',
    laborCost: 'Labour',
    fixedCost: 'Housing & fixed',
    vaccineCost: 'Vaccines/meds',
  },
} as const;

function formatNaira(n: number) {
  if (!isFinite(n)) return '₦0';
  return `₦${Math.round(n).toLocaleString('en-NG')}`;
}

export default function PoultryFarmStartupCalculator({ locale }: CalculatorProps) {
  const t = COPY.en;

  // --- Farm basics ---
  const [farmType, setFarmType] = useState<FarmType>('broilers');
  const [docCount, setDocCount] = useState(500);
  const [docPrice, setDocPrice] = useState(650); // ₦ per chick, broiler default
  const [mortality, setMortality] = useState(10); // %
  const [periodWeeks, setPeriodWeeks] = useState(7);

  // --- Feed ---
  const [feedBagPrice, setFeedBagPrice] = useState(20000); // ₦ per 25kg bag, 2026 mid-range
  const [feedPerBirdKg, setFeedPerBirdKg] = useState(3.6); // kg per bird to slaughter (broiler default)

  // --- Other costs ---
  const [housing, setHousing] = useState(350000);
  const [workers, setWorkers] = useState(1);
  const [workerSalary, setWorkerSalary] = useState(50000);
  const [vaccinesPerBird, setVaccinesPerBird] = useState(150);
  const [misc, setMisc] = useState(60000);

  // --- Revenue ---
  const [eggsPerBirdDay, setEggsPerBirdDay] = useState(0.75);
  const [eggPrice, setEggPrice] = useState(120);
  const [broilerPrice, setBroilerPrice] = useState(11500);

  // --- Currency ---
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [showUsd, setShowUsd] = useState(false);
  const [rateSourceFailed, setRateSourceFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchRate() {
      try {
        const res = await fetch(
          'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/ngn.json'
        );
        if (!res.ok) throw new Error('primary source failed');
        const data = await res.json();
        const usdPerNgn = data?.ngn?.usd;
        if (!cancelled && typeof usdPerNgn === 'number') {
          setUsdRate(usdPerNgn);
          return;
        }
        throw new Error('unexpected payload');
      } catch {
        try {
          const fallback = await fetch(
            'https://latest.currency-api.pages.dev/v1/currencies/ngn.json'
          );
          if (!fallback.ok) throw new Error('fallback failed');
          const data = await fallback.json();
          const usdPerNgn = data?.ngn?.usd;
          if (!cancelled && typeof usdPerNgn === 'number') {
            setUsdRate(usdPerNgn);
            return;
          }
          throw new Error('unexpected fallback payload');
        } catch {
          if (!cancelled) {
            setUsdRate(1 / 1600); // hardcoded fallback: ~₦1,600 = $1
            setRateSourceFailed(true);
          }
        }
      }
    }
    fetchRate();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetDefaults() {
    setFarmType('broilers');
    setDocCount(500);
    setDocPrice(650);
    setMortality(10);
    setPeriodWeeks(7);
    setFeedBagPrice(20000);
    setFeedPerBirdKg(3.6);
    setHousing(350000);
    setWorkers(1);
    setWorkerSalary(50000);
    setVaccinesPerBird(150);
    setMisc(60000);
    setEggsPerBirdDay(0.75);
    setEggPrice(120);
    setBroilerPrice(11500);
  }

  function applyFarmType(next: FarmType) {
    setFarmType(next);
    if (next === 'layers') {
      setPeriodWeeks(20);
      setDocPrice(1400);
      setFeedPerBirdKg(7.5);
      setMortality(7);
    } else {
      setPeriodWeeks(7);
      setDocPrice(650);
      setFeedPerBirdKg(3.6);
      setMortality(10);
    }
  }

  const results = useMemo(() => {
    const effectiveBirds = Math.max(docCount * (1 - mortality / 100), 0.0001);

    const chicksCost = docCount * docPrice;
    const feedKgTotal = feedPerBirdKg * effectiveBirds;
    const feedCost = (feedKgTotal / 25) * feedBagPrice;
    const months = periodWeeks / 4.345;
    const laborCost = workers * workerSalary * months;
    const vaccineCost = vaccinesPerBird * docCount;
    const fixedCost = housing + misc;

    const totalCost = chicksCost + feedCost + laborCost + vaccineCost + fixedCost;
    const costPerBird = totalCost / effectiveBirds;

    let birdsToBreakEven = 0;
    let eggsToBreakEven = 0;
    let revenuePerBird = 0;

    if (farmType === 'broilers') {
      revenuePerBird = broilerPrice;
      birdsToBreakEven = revenuePerBird > 0 ? totalCost / revenuePerBird : 0;
    } else {
      const eggsPerBirdTotal = eggsPerBirdDay * periodWeeks * 7;
      revenuePerBird = eggsPerBirdTotal * eggPrice;
      birdsToBreakEven = revenuePerBird > 0 ? totalCost / revenuePerBird : 0;
      eggsToBreakEven = eggPrice > 0 ? totalCost / eggPrice : 0;
    }

    const pieData = [
      { name: t.chicksCost, value: chicksCost },
      { name: t.feedCost, value: feedCost },
      { name: t.laborCost, value: laborCost },
      { name: t.fixedCost, value: fixedCost },
      { name: t.vaccineCost, value: vaccineCost },
    ].filter((d) => d.value > 0);

    const weeksArr = Array.from({ length: periodWeeks + 1 }, (_, w) => w);
    const cumulative = weeksArr.map((w) => {
      const fraction = w / periodWeeks;
      const cumCost =
        chicksCost + vaccineCost + housing * 0.6 + (feedCost + laborCost + misc) * fraction;
      const cumRevenue =
        farmType === 'broilers'
          ? w === periodWeeks
            ? revenuePerBird * effectiveBirds
            : 0
          : revenuePerBird * effectiveBirds * fraction;
      return { week: w, cost: Math.round(cumCost), revenue: Math.round(cumRevenue) };
    });

    function sensitivityRun(mortalityDelta: number, feedPriceMultiplier: number) {
      const m = Math.min(Math.max(mortality + mortalityDelta, 0), 90);
      const eb = Math.max(docCount * (1 - m / 100), 0.0001);
      const fc = (feedPerBirdKg * eb / 25) * (feedBagPrice * feedPriceMultiplier);
      const tc = chicksCost + fc + laborCost + vaccineCost + fixedCost;
      return tc / eb;
    }

    const sensitivity = [
      { label: 'Base case', costPerBird },
      { label: `Mortality +2%`, costPerBird: sensitivityRun(2, 1) },
      { label: `Mortality -2%`, costPerBird: sensitivityRun(-2, 1) },
      { label: 'Feed price +20%', costPerBird: sensitivityRun(0, 1.2) },
      { label: 'Feed price -20%', costPerBird: sensitivityRun(0, 0.8) },
    ];

    return {
      effectiveBirds,
      totalCost,
      costPerBird,
      birdsToBreakEven,
      eggsToBreakEven,
      pieData,
      cumulative,
      sensitivity,
    };
  }, [
    docCount,
    docPrice,
    mortality,
    periodWeeks,
    feedBagPrice,
    feedPerBirdKg,
    housing,
    workers,
    workerSalary,
    vaccinesPerBird,
    misc,
    farmType,
    eggsPerBirdDay,
    eggPrice,
    broilerPrice,
    t,
  ]);

  function displayAmount(nairaAmount: number) {
    if (showUsd && usdRate) {
      return `$${(nairaAmount * usdRate).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    }
    return formatNaira(nairaAmount);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => applyFarmType('broilers')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              farmType === 'broilers'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.broilers}
          </button>
          <button
            type="button"
            onClick={() => applyFarmType('layers')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              farmType === 'layers'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.layers}
          </button>
        </div>
        <div className="flex gap-2">
          {usdRate && (
            <button
              type="button"
              onClick={() => setShowUsd((v) => !v)}
              className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
            >
              {t.viewUsd} {showUsd ? '✓' : ''}
            </button>
          )}
          <button
            type="button"
            onClick={resetDefaults}
            className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            {t.resetDefaults}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">{t.farmBasics}</h3>
          <div className="space-y-3">
            <label className="block text-sm text-gray-700">
              {t.docCount}
              <input
                type="range"
                min={100}
                max={5000}
                step={50}
                value={docCount}
                onChange={(e) => setDocCount(Number(e.target.value))}
                className="mt-1 w-full"
              />
              <input
                type="number"
                value={docCount}
                onChange={(e) => setDocCount(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block text-sm text-gray-700">
              {t.docPrice}
              <input
                type="number"
                value={docPrice}
                onChange={(e) => setDocPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block text-sm text-gray-700">
              {t.mortality}
              <input
                type="number"
                value={mortality}
                onChange={(e) => setMortality(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block text-sm text-gray-700">
              {t.period}
              <input
                type="number"
                value={periodWeeks}
                onChange={(e) => setPeriodWeeks(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-900">{t.costs}</h3>
          <div className="space-y-3">
            <label className="block text-sm text-gray-700">
              {t.feedBagPrice}
              <input
                type="number"
                value={feedBagPrice}
                onChange={(e) => setFeedBagPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block text-sm text-gray-700">
              {t.feedPerBird}
              <input
                type="number"
                step="0.1"
                value={feedPerBirdKg}
                onChange={(e) => setFeedPerBirdKg(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block text-sm text-gray-700">
              {t.housing}
              <input
                type="number"
                value={housing}
                onChange={(e) => setHousing(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm text-gray-700">
                {t.workers}
                <input
                  type="number"
                  value={workers}
                  onChange={(e) => setWorkers(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="block text-sm text-gray-700">
                {t.workerSalary}
                <input
                  type="number"
                  value={workerSalary}
                  onChange={(e) => setWorkerSalary(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
              </label>
            </div>
            <label className="block text-sm text-gray-700">
              {t.vaccines}
              <input
                type="number"
                value={vaccinesPerBird}
                onChange={(e) => setVaccinesPerBird(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block text-sm text-gray-700">
              {t.misc}
              <input
                type="number"
                value={misc}
                onChange={(e) => setMisc(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">{t.revenue}</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {farmType === 'layers' ? (
            <>
              <label className="block text-sm text-gray-700">
                {t.eggsPerBird}
                <input
                  type="number"
                  step="0.05"
                  value={eggsPerBirdDay}
                  onChange={(e) => setEggsPerBirdDay(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
              </label>
              <label className="block text-sm text-gray-700">
                {t.eggPrice}
                <input
                  type="number"
                  value={eggPrice}
                  onChange={(e) => setEggPrice(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                />
              </label>
            </>
          ) : (
            <label className="block text-sm text-gray-700">
              {t.broilerPrice}
              <input
                type="number"
                value={broilerPrice}
                onChange={(e) => setBroilerPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </label>
          )}
        </div>
      </section>

      <section className="rounded-xl bg-indigo-50 p-5">
        <h3 className="mb-4 text-base font-semibold text-indigo-900">{t.summaryTitle}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">
              {t.costPerBird} {farmType === 'layers' ? t.pointOfLay : t.slaughter}
            </p>
            <p className="mt-1 text-xl font-bold text-indigo-700">
              {displayAmount(results.costPerBird)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">{t.totalInvestment}</p>
            <p className="mt-1 text-xl font-bold text-indigo-700">
              {displayAmount(results.totalCost)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">{t.breakEvenTitle}</p>
            <p className="mt-1 text-sm font-semibold text-indigo-700">
              {t.sellBirds(Math.ceil(results.birdsToBreakEven).toLocaleString('en-NG'))}
            </p>
            {farmType === 'layers' && (
              <p className="text-xs text-indigo-600">
                {t.sellEggs(Math.ceil(results.eggsToBreakEven).toLocaleString('en-NG'))}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-indigo-900">{t.costBreakdown}</p>
            <div className="h-56 rounded-lg bg-white p-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={results.pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={75}
                  >
                    {results.pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatNaira(v)} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-indigo-900">{t.cumulative}</p>
            <div className="h-56 rounded-lg bg-white p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.cumulative}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} label={{ value: t.week, position: 'insideBottom', fontSize: 10, dy: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => formatNaira(v)} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="cost" name="Cost" stroke="#4f46e5" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold text-indigo-900">{t.sensitivity}</p>
          <div className="overflow-x-auto rounded-lg bg-white">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="px-3 py-2">Scenario</th>
                  <th className="px-3 py-2">{t.naira}</th>
                </tr>
              </thead>
              <tbody>
                {results.sensitivity.map((row) => (
                  <tr key={row.label} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2 text-gray-700">{row.label}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {displayAmount(row.costPerBird)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <details className="mt-5 rounded-lg bg-white p-3 text-xs text-gray-600">
          <summary className="cursor-pointer font-semibold text-indigo-900">
            {t.assumptionsBox}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Day-old broiler chicks: roughly ₦500–₦700 per chick from major hatcheries in 2026; point-of-lay pullets run considerably higher, often ₦1,300–₦1,600.</li>
            <li>25kg bag of commercial feed: widely ranges ₦18,000–₦24,000 depending on brand, stage (starter/grower/finisher) and location — feed is typically the single largest cost driver.</li>
            <li>Mortality: commonly budgeted at 8–12% for broilers to slaughter and 5–8% for layers to point-of-lay, higher without good biosecurity.</li>
            <li>Live broiler selling price: approximately ₦10,000–₦15,000 per bird at 2026 market rates, though this swings with regional day-old chick supply.</li>
          </ul>
        </details>
      </section>

      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-400">{t.disclaimer}</p>
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-400">{t.complianceNote}</p>
      {rateSourceFailed && (
        <p className="text-xs text-gray-400">
          Live USD conversion is temporarily unavailable, so a fixed estimate (~₦1,600 = $1) is being used instead.
        </p>
      )}
    </div>
  );
}
