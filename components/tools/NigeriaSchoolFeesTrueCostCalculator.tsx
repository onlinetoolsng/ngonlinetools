'use client';

import { useMemo, useState } from 'react';

/**
 * Nigeria School Fees True Cost Calculator
 * Route: /[locale]/tools/education/nigeria-school-fees-true-cost-calculator
 *
 * Pure client component. No SEO/schema/registry logic here — that lives in
 * app/[locale]/tools/[category]/[tool]/page.tsx and lib/registry/tools.ts.
 *
 * Base tuition figures below are indicative 2025/2026 published-range
 * midpoints for planning purposes only, fully editable by the user. They
 * are NOT live data and should be updated in code periodically — see the
 * "Typical Range" notes inline. Public basic education (Nursery–SSS) is
 * intended to be tuition-free under the UBE Act 2004; the 0 defaults
 * reflect that, while hidden/levy costs are still modeled separately.
 */

type Level = 'nursery-primary' | 'jss' | 'sss' | 'tertiary';
type Category =
  | 'public'
  | 'low-cost-private'
  | 'mid-range-private'
  | 'high-end-private'
  | 'international';
type Location = 'lagos' | 'abuja' | 'other';
type Tab = 'inputs' | 'breakdown' | 'summary';

interface FeeItem {
  id: string;
  label: string;
  enabled: boolean;
  amount: number;
  frequency: 'once' | 'per-term' | 'annual';
  vatApplicable: boolean;
  custom?: boolean;
}

const LEVEL_LABELS: Record<Level, string> = {
  'nursery-primary': 'Nursery / Primary',
  jss: 'Junior Secondary (JSS)',
  sss: 'Senior Secondary (SSS)',
  tertiary: 'Basic Tertiary (Polytechnic/College)',
};

const CATEGORY_LABELS: Record<Category, string> = {
  public: 'Public / Government',
  'low-cost-private': 'Low-cost Private',
  'mid-range-private': 'Mid-range Private',
  'high-end-private': 'High-end Private',
  international: 'International',
};

// Indicative base tuition per term (NGN). Editable by the user; comment
// notes source basis for future updates.
const BASE_TUITION: Record<Category, Record<Level, number>> = {
  public: { 'nursery-primary': 0, jss: 0, sss: 0, tertiary: 150000 },
  'low-cost-private': { 'nursery-primary': 25000, jss: 30000, sss: 35000, tertiary: 180000 },
  'mid-range-private': { 'nursery-primary': 80000, jss: 90000, sss: 100000, tertiary: 250000 },
  'high-end-private': { 'nursery-primary': 250000, jss: 300000, sss: 350000, tertiary: 400000 },
  international: { 'nursery-primary': 600000, jss: 700000, sss: 800000, tertiary: 900000 },
};

const LOCATION_MULTIPLIER: Record<Location, number> = {
  lagos: 1.2,
  abuja: 1.15,
  other: 1.0,
};

const BOARDING_SURCHARGE_PER_TERM = 120000;
const VAT_RATE = 0.075;

function defaultFees(category: Category, level: Level): FeeItem[] {
  const isPublic = category === 'public';
  return [
    {
      id: 'development-levy',
      label: 'Development Levy / Infrastructure',
      enabled: !isPublic,
      amount: isPublic ? 5000 : category === 'high-end-private' || category === 'international' ? 100000 : 30000,
      frequency: 'annual',
      vatApplicable: false,
    },
    {
      id: 'uniforms',
      label: 'Uniforms / Sportswear',
      enabled: true,
      amount: 45000,
      frequency: 'annual',
      vatApplicable: true,
    },
    {
      id: 'books',
      label: 'Books / Textbooks / Learning Materials',
      enabled: true,
      amount: 20000,
      frequency: 'per-term',
      vatApplicable: false,
    },
    {
      id: 'pta-exam',
      label: 'PTA / Exam / Internal Fees',
      enabled: true,
      amount: 8000,
      frequency: 'per-term',
      vatApplicable: false,
    },
    {
      id: 'transport',
      label: 'Transport / School Bus',
      enabled: false,
      amount: 25000,
      frequency: 'per-term',
      vatApplicable: true,
    },
    {
      id: 'meals',
      label: 'Meals / Feeding (day students)',
      enabled: false,
      amount: 15000,
      frequency: 'per-term',
      vatApplicable: false,
    },
    {
      id: 'ict',
      label: 'ICT / Computer / Lab Fees',
      enabled: level !== 'nursery-primary',
      amount: 10000,
      frequency: 'annual',
      vatApplicable: false,
    },
    {
      id: 'extracurricular',
      label: 'Extracurriculars / Excursions',
      enabled: false,
      amount: 15000,
      frequency: 'annual',
      vatApplicable: true,
    },
    {
      id: 'admission',
      label: 'Admission / Registration (first term only)',
      enabled: true,
      amount: isPublic ? 2000 : 50000,
      frequency: 'once',
      vatApplicable: false,
    },
  ];
}

function formatNaira(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

export default function NigeriaSchoolFeesTrueCostCalculator({ locale }: { locale: string }) {
  const [tab, setTab] = useState<Tab>('inputs');
  const [level, setLevel] = useState<Level>('nursery-primary');
  const [category, setCategory] = useState<Category>('mid-range-private');
  const [location, setLocation] = useState<Location>('lagos');
  const [boarding, setBoarding] = useState(false);
  const [children, setChildren] = useState(1);
  const [baseTuition, setBaseTuition] = useState<number>(BASE_TUITION['mid-range-private']['nursery-primary']);
  const [termsPerYear, setTermsPerYear] = useState(3);
  const [fees, setFees] = useState<FeeItem[]>(() => defaultFees('mid-range-private', 'nursery-primary'));
  const [bufferPct, setBufferPct] = useState(15);
  const [applyVat, setApplyVat] = useState(false);

  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState(false);

  function applyPreset(nextCategory: Category, nextLevel: Level, nextLocation: Location) {
    const suggested = BASE_TUITION[nextCategory][nextLevel] * LOCATION_MULTIPLIER[nextLocation];
    setBaseTuition(Math.round(suggested));
    setFees(defaultFees(nextCategory, nextLevel));
  }

  function handleCategoryChange(next: Category) {
    setCategory(next);
    applyPreset(next, level, location);
  }
  function handleLevelChange(next: Level) {
    setLevel(next);
    applyPreset(category, next, location);
  }
  function handleLocationChange(next: Location) {
    setLocation(next);
    applyPreset(category, level, next);
  }

  function updateFee(id: string, patch: Partial<FeeItem>) {
    setFees((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function addCustomFee() {
    setFees((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        label: 'Other (medical, graduation, security, etc.)',
        enabled: true,
        amount: 10000,
        frequency: 'annual',
        vatApplicable: false,
        custom: true,
      },
    ]);
  }

  function removeCustomFee(id: string) {
    setFees((prev) => prev.filter((f) => f.id !== id));
  }

  async function fetchUsdRate() {
    setRateLoading(true);
    setRateError(false);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/NGN');
      if (!res.ok) throw new Error('rate fetch failed');
      const data = await res.json();
      const rate = data?.rates?.USD;
      if (typeof rate !== 'number') throw new Error('missing rate');
      setUsdRate(rate);
    } catch {
      setRateError(true);
      setUsdRate(null);
    } finally {
      setRateLoading(false);
    }
  }

  const results = useMemo(() => {
    const boardingExtraPerTerm = boarding ? BOARDING_SURCHARGE_PER_TERM : 0;
    const perTermTuition = baseTuition + boardingExtraPerTerm;

    let perTermRecurringExtras = 0;
    let annualExtras = 0;
    let oneTimeExtras = 0;
    let vatTotal = 0;

    for (const fee of fees) {
      if (!fee.enabled) continue;
      const vatOnItem = fee.vatApplicable && applyVat ? fee.amount * VAT_RATE : 0;
      vatTotal += vatOnItem;
      const amountWithVat = fee.amount + vatOnItem;

      if (fee.frequency === 'per-term') perTermRecurringExtras += amountWithVat;
      else if (fee.frequency === 'annual') annualExtras += amountWithVat;
      else oneTimeExtras += amountWithVat;
    }

    const recurringTermCost = perTermTuition + perTermRecurringExtras;
    const firstTermCost = recurringTermCost + oneTimeExtras + annualExtras / termsPerYear;
    const subsequentTermCost = recurringTermCost + annualExtras / termsPerYear;

    const annualBeforeBuffer =
      perTermTuition * termsPerYear + perTermRecurringExtras * termsPerYear + annualExtras + oneTimeExtras;
    const bufferAmount = annualBeforeBuffer * (bufferPct / 100);
    const annualTotal = annualBeforeBuffer + bufferAmount;

    const perChildAnnual = annualTotal;
    const householdAnnual = annualTotal * Math.max(1, children);
    const monthlyProvision = householdAnnual / 12;

    const advertisedAnnualTuition = perTermTuition * termsPerYear;
    const hiddenAmount = annualTotal - advertisedAnnualTuition;
    const hiddenPct = advertisedAnnualTuition > 0 ? (hiddenAmount / advertisedAnnualTuition) * 100 : 0;

    const tuitionShare = annualTotal > 0 ? (advertisedAnnualTuition / annualTotal) * 100 : 0;
    const extrasShare = annualTotal > 0 ? ((annualExtras + perTermRecurringExtras * termsPerYear + oneTimeExtras) / annualTotal) * 100 : 0;
    const bufferShare = annualTotal > 0 ? (bufferAmount / annualTotal) * 100 : 0;

    return {
      firstTermCost,
      subsequentTermCost,
      annualTotal,
      perChildAnnual,
      householdAnnual,
      monthlyProvision,
      advertisedAnnualTuition,
      hiddenAmount,
      hiddenPct,
      tuitionShare,
      extrasShare,
      bufferShare,
      bufferAmount,
      vatTotal,
    };
  }, [baseTuition, boarding, fees, applyVat, bufferPct, termsPerYear, children]);

  function copySummary() {
    const text = [
      `Nigeria School Fees True Cost — ${LEVEL_LABELS[level]}, ${CATEGORY_LABELS[category]}, ${location.toUpperCase()}`,
      `First term cash needed: ${formatNaira(results.firstTermCost)}`,
      `Recurring term cost: ${formatNaira(results.subsequentTermCost)}`,
      `Full annual total (per child): ${formatNaira(results.annualTotal)}`,
      `Household annual total (${children} child${children > 1 ? 'ren' : ''}): ${formatNaira(results.householdAnnual)}`,
      `Suggested monthly savings: ${formatNaira(results.monthlyProvision)}`,
      `This is ${results.hiddenPct.toFixed(0)}% higher than advertised tuition once extras are included.`,
    ].join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        {(['inputs', 'breakdown', 'summary'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize rounded-t-xl ${
              tab === t
                ? 'bg-indigo-50 text-indigo-700 border border-b-0 border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'inputs' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800">School details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">School level</label>
                <select
                  className="w-full rounded-lg border border-gray-300 p-2"
                  value={level}
                  onChange={(e) => handleLevelChange(e.target.value as Level)}
                >
                  {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">School category</label>
                <select
                  className="w-full rounded-lg border border-gray-300 p-2"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as Category)}
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Location</label>
                <select
                  className="w-full rounded-lg border border-gray-300 p-2"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value as Location)}
                >
                  <option value="lagos">Lagos</option>
                  <option value="abuja">Abuja</option>
                  <option value="other">Other / Port Harcourt / State capital</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Boarding or day</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setBoarding(false)}
                    className={`flex-1 p-2 text-sm ${!boarding ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-600'}`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setBoarding(true)}
                    className={`flex-1 p-2 text-sm ${boarding ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-600'}`}
                  >
                    Boarding
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Number of children</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border border-gray-300 p-2"
                  value={children}
                  onChange={(e) => setChildren(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Terms per year</label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  className="w-full rounded-lg border border-gray-300 p-2"
                  value={termsPerYear}
                  onChange={(e) => setTermsPerYear(Math.max(1, Number(e.target.value) || 3))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Base tuition per term (₦) — typical range prefilled, edit to match your school
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-gray-300 p-2"
                value={baseTuition}
                onChange={(e) => setBaseTuition(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Additional / hidden fees</h2>
              <button onClick={addCustomFee} className="text-sm text-indigo-600 hover:underline">
                + Add custom fee
              </button>
            </div>

            {fees.map((fee) => (
              <div key={fee.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <input
                  type="checkbox"
                  checked={fee.enabled}
                  onChange={(e) => updateFee(fee.id, { enabled: e.target.checked })}
                />
                {fee.custom ? (
                  <input
                    className="flex-1 text-sm rounded border border-gray-200 p-1"
                    value={fee.label}
                    onChange={(e) => updateFee(fee.id, { label: e.target.value })}
                  />
                ) : (
                  <span className="flex-1 text-sm text-gray-700">{fee.label}</span>
                )}
                <span className="text-xs text-gray-400 w-16">{fee.frequency.replace('-', ' ')}</span>
                <input
                  type="number"
                  min={0}
                  className="w-28 rounded border border-gray-300 p-1 text-sm"
                  value={fee.amount}
                  onChange={(e) => updateFee(fee.id, { amount: Math.max(0, Number(e.target.value) || 0) })}
                />
                {fee.custom && (
                  <button
                    onClick={() => removeCustomFee(fee.id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    remove
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" checked={applyVat} onChange={(e) => setApplyVat(e.target.checked)} />
              <span className="text-sm text-gray-600">
                Add 7.5% VAT on non-core items (uniforms, transport, excursions)
              </span>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Emergency buffer ({bufferPct}%)
              </label>
              <input
                type="range"
                min={0}
                max={30}
                value={bufferPct}
                onChange={(e) => setBufferPct(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'breakdown' && (
        <div className="rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Itemized breakdown (per child, per year)</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-700">Advertised tuition ({termsPerYear} terms)</td>
                <td className="py-2 text-right font-medium">{formatNaira(results.advertisedAnnualTuition)}</td>
              </tr>
              {fees
                .filter((f) => f.enabled)
                .map((fee) => {
                  const multiplier = fee.frequency === 'per-term' ? termsPerYear : 1;
                  const vat = fee.vatApplicable && applyVat ? fee.amount * VAT_RATE : 0;
                  const total = (fee.amount + vat) * multiplier;
                  return (
                    <tr key={fee.id} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">{fee.label}</td>
                      <td className="py-2 text-right">{formatNaira(total)}</td>
                    </tr>
                  );
                })}
              <tr className="border-b border-gray-100">
                <td className="py-2 text-gray-700">Emergency buffer ({bufferPct}%)</td>
                <td className="py-2 text-right">{formatNaira(results.bufferAmount)}</td>
              </tr>
              <tr>
                <td className="py-3 font-semibold text-gray-900">Annual total</td>
                <td className="py-3 text-right font-semibold text-gray-900">{formatNaira(results.annualTotal)}</td>
              </tr>
            </tbody>
          </table>

          <div className="space-y-2">
            <div className="text-sm text-gray-600">Tuition vs. hidden costs vs. buffer</div>
            <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
              <div className="bg-indigo-500" style={{ width: `${results.tuitionShare}%` }} />
              <div className="bg-indigo-300" style={{ width: `${results.extrasShare}%` }} />
              <div className="bg-indigo-100" style={{ width: `${results.bufferShare}%` }} />
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Tuition {results.tuitionShare.toFixed(0)}%</span>
              <span>Extras {results.extrasShare.toFixed(0)}%</span>
              <span>Buffer {results.bufferShare.toFixed(0)}%</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-indigo-50 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-indigo-500 uppercase tracking-wide">First term cash needed</div>
              <div className="text-2xl font-bold text-indigo-900">{formatNaira(results.firstTermCost)}</div>
            </div>
            <div>
              <div className="text-xs text-indigo-500 uppercase tracking-wide">Recurring term cost</div>
              <div className="text-2xl font-bold text-indigo-900">{formatNaira(results.subsequentTermCost)}</div>
            </div>
            <div>
              <div className="text-xs text-indigo-500 uppercase tracking-wide">Full annual total (per child)</div>
              <div className="text-2xl font-bold text-indigo-900">{formatNaira(results.annualTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-indigo-500 uppercase tracking-wide">Suggested monthly savings</div>
              <div className="text-2xl font-bold text-indigo-900">{formatNaira(results.monthlyProvision)}</div>
            </div>
          </div>

          {children > 1 && (
            <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
              Household total for {children} children: <strong>{formatNaira(results.householdAnnual)}</strong> per year.
            </div>
          )}

          <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
            This is <strong>{results.hiddenPct.toFixed(0)}%</strong> higher than the advertised tuition of{' '}
            {formatNaira(results.advertisedAnnualTuition)}, once hidden and additional fees are included.
          </div>

          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Optional USD estimate</h3>
              <button
                onClick={fetchUsdRate}
                disabled={rateLoading}
                className="text-sm text-indigo-600 hover:underline disabled:text-gray-400"
              >
                {rateLoading ? 'Fetching rate…' : 'Convert to USD'}
              </button>
            </div>
            {usdRate && (
              <div className="text-sm text-gray-700">
                ≈ ${(results.annualTotal * usdRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                at today's rate (1 NGN ≈ {usdRate.toFixed(6)} USD)
              </div>
            )}
            {rateError && (
              <div className="text-sm text-gray-400">
                Live rate unavailable right now. Try again shortly, or use your own reference rate.
              </div>
            )}
          </div>

          <button
            onClick={copySummary}
            className="w-full rounded-xl border border-indigo-200 bg-white p-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Copy summary
          </button>

          <details className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
            <summary className="cursor-pointer font-medium text-gray-800">Tips before you budget</summary>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Ask the school for a full written invoice covering all terms, not just the tuition quote.</li>
              <li>Public basic education (Nursery–SSS) is intended to be tuition-free; any tuition charged for
                that category should be confirmed with the state Universal Basic Education Board.</li>
              <li>Costs vary by school even within the same category — treat these figures as a starting point.</li>
              <li>Review and update your budget each session, since fees and levies typically rise with inflation.</li>
            </ul>
          </details>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Figures are indicative planning estimates based on typical published fee ranges for Nigerian schools and
        are not live data from any specific institution. Actual costs vary by school, session, and location —
        always confirm with the school's official fee schedule before budgeting. This tool provides general
        information only and is not financial, legal, or tax advice.
      </p>
    </div>
  );
}
