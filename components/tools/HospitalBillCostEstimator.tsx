'use client';

import { useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CostRange {
  min: number;
  max: number;
  note?: string;
}

interface ProcedureCost {
  id: string;
  name: string;
  category: 'Consultations' | 'Diagnostics' | 'Maternity' | 'Surgeries' | 'Others';
  public: CostRange;
  private: CostRange;
  /** Typical nights of admission already baked into the range above, if any */
  includedAdmissionDays?: number;
  nhiaNote?: string;
  lastUpdated: string;
}

type StateKey =
  | 'all'
  | 'lagos'
  | 'abuja'
  | 'kano'
  | 'rivers'
  | 'enugu'
  | 'ogun'
  | 'kaduna'
  | 'oyo'
  | 'delta';

const STATE_LABELS: Record<StateKey, string> = {
  all: 'All Nigeria (national average)',
  lagos: 'Lagos',
  abuja: 'Abuja (FCT)',
  kano: 'Kano',
  rivers: 'Rivers',
  enugu: 'Enugu',
  ogun: 'Ogun',
  kaduna: 'Kaduna',
  oyo: 'Oyo',
  delta: 'Delta',
};

// Rough cost-of-care multipliers relative to the national average. These are
// directional only (see disclaimer) — Lagos/Abuja run higher, some northern
// states run lower, reflecting differences in facility overheads and demand.
const STATE_MULTIPLIERS: Record<StateKey, number> = {
  all: 1,
  lagos: 1.3,
  abuja: 1.25,
  rivers: 1.15,
  enugu: 1.05,
  ogun: 1.05,
  oyo: 1,
  delta: 1.1,
  kaduna: 0.9,
  kano: 0.85,
};

// Approximate per-night bed fee used to add extra admission days beyond what
// is already included in a procedure's base range.
const BED_FEE_PER_NIGHT = { public: 10000, private: 35000 };

const costsData: ProcedureCost[] = [
  // --- Consultations ---
  {
    id: 'gp-consultation',
    name: 'General practitioner (GP) consultation',
    category: 'Consultations',
    public: { min: 1000, max: 3000 },
    private: { min: 5000, max: 15000 },
    lastUpdated: '2026-06',
  },
  {
    id: 'specialist-consultation',
    name: 'Specialist consultation (e.g. gynaecologist, surgeon)',
    category: 'Consultations',
    public: { min: 3000, max: 8000 },
    private: { min: 10000, max: 30000 },
    lastUpdated: '2026-06',
  },
  // --- Diagnostics ---
  {
    id: 'xray',
    name: 'X-ray (single view)',
    category: 'Diagnostics',
    public: { min: 3000, max: 8000 },
    private: { min: 8000, max: 20000 },
    lastUpdated: '2026-06',
  },
  {
    id: 'ultrasound',
    name: 'Abdominal / pelvic ultrasound scan',
    category: 'Diagnostics',
    public: { min: 5000, max: 12000 },
    private: { min: 10000, max: 25000 },
    lastUpdated: '2026-06',
  },
  {
    id: 'ct-scan',
    name: 'CT scan',
    category: 'Diagnostics',
    public: { min: 30000, max: 60000 },
    private: { min: 60000, max: 150000 },
    lastUpdated: '2026-06',
  },
  {
    id: 'fbc',
    name: 'Full blood count (FBC)',
    category: 'Diagnostics',
    public: { min: 2000, max: 5000 },
    private: { min: 4000, max: 10000 },
    lastUpdated: '2026-06',
  },
  {
    id: 'lft',
    name: 'Liver function test (LFT)',
    category: 'Diagnostics',
    public: { min: 5000, max: 10000 },
    private: { min: 8000, max: 18000 },
    lastUpdated: '2026-06',
  },
  // --- Maternity ---
  {
    id: 'normal-delivery',
    name: 'Normal (vaginal) delivery',
    category: 'Maternity',
    public: { min: 30000, max: 80000, note: 'Some states run antenatal/delivery subsidy schemes' },
    private: { min: 150000, max: 400000 },
    includedAdmissionDays: 1,
    nhiaNote: 'Partly covered under NHIA maternal care package for enrollees',
    lastUpdated: '2026-06',
  },
  {
    id: 'c-section',
    name: 'Caesarean section (C-section)',
    category: 'Maternity',
    public: { min: 100000, max: 350000 },
    private: { min: 400000, max: 1200000 },
    includedAdmissionDays: 3,
    nhiaNote: 'Emergency C-section is a listed NHIA-covered procedure for enrolled beneficiaries',
    lastUpdated: '2026-06',
  },
  // --- Surgeries ---
  {
    id: 'appendectomy',
    name: 'Appendectomy (appendix removal)',
    category: 'Surgeries',
    public: { min: 150000, max: 400000 },
    private: { min: 500000, max: 1200000 },
    includedAdmissionDays: 3,
    lastUpdated: '2026-06',
  },
  {
    id: 'hernia-repair',
    name: 'Hernia repair surgery',
    category: 'Surgeries',
    public: { min: 120000, max: 350000 },
    private: { min: 400000, max: 900000 },
    includedAdmissionDays: 2,
    lastUpdated: '2026-06',
  },
  // --- Others ---
  {
    id: 'dialysis-session',
    name: 'Dialysis (per session)',
    category: 'Others',
    public: { min: 15000, max: 25000 },
    private: { min: 30000, max: 60000 },
    lastUpdated: '2026-06',
  },
  {
    id: 'basic-admission',
    name: 'Basic ward admission (per day, no procedure)',
    category: 'Others',
    public: { min: 5000, max: 15000 },
    private: { min: 20000, max: 50000 },
    lastUpdated: '2026-06',
  },
];

const CATEGORY_ORDER: ProcedureCost['category'][] = [
  'Consultations',
  'Diagnostics',
  'Maternity',
  'Surgeries',
  'Others',
];

function formatNaira(n: number): string {
  return '₦' + Math.round(n).toLocaleString('en-NG');
}

interface Props {
  locale: string;
}

export function HospitalBillCostEstimator({ locale }: Props) {
  const [state, setState] = useState<StateKey>('all');
  const [procedureId, setProcedureId] = useState<string>(costsData[0].id);
  const [facility, setFacility] = useState<'public' | 'private'>('public');
  const [extraDays, setExtraDays] = useState<number>(0);
  const [showUsd, setShowUsd] = useState(false);
  const [rate, setRate] = useState<number | null>(null);
  const [rateError, setRateError] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const procedure = useMemo(
    () => costsData.find((p) => p.id === procedureId) ?? costsData[0],
    [procedureId]
  );

  const multiplier = STATE_MULTIPLIERS[state];
  const base = procedure[facility];
  const bedFee = BED_FEE_PER_NIGHT[facility];

  const adjustedMin = base.min * multiplier + extraDays * bedFee;
  const adjustedMax = base.max * multiplier + extraDays * bedFee;

  async function handleToggleUsd() {
    if (showUsd) {
      setShowUsd(false);
      return;
    }
    setShowUsd(true);
    if (rate !== null || rateLoading) return;
    setRateLoading(true);
    setRateError(false);
    try {
      const res = await fetch('https://api.frankfurter.dev/v2/latest?base=NGN&symbols=USD');
      if (!res.ok) throw new Error('primary rate source failed');
      const data = await res.json();
      const usdRate = data?.rates?.USD;
      if (!usdRate) throw new Error('missing rate');
      setRate(usdRate);
    } catch {
      try {
        const res2 = await fetch('https://open.er-api.com/v6/latest/NGN');
        if (!res2.ok) throw new Error('backup rate source failed');
        const data2 = await res2.json();
        const usdRate2 = data2?.rates?.USD;
        if (!usdRate2) throw new Error('missing rate');
        setRate(usdRate2);
      } catch {
        setRateError(true);
        setRate(null);
      }
    } finally {
      setRateLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={state}
            onChange={(e) => setState(e.target.value as StateKey)}
          >
            {(Object.keys(STATE_LABELS) as StateKey[]).map((key) => (
              <option key={key} value={key}>
                {STATE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={procedureId}
            onChange={(e) => setProcedureId(e.target.value)}
          >
            {CATEGORY_ORDER.map((cat) => (
              <optgroup key={cat} label={cat}>
                {costsData
                  .filter((p) => p.category === cat)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700 mb-1">Facility type</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFacility('public')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                facility === 'public'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Public / Teaching hospital
            </button>
            <button
              type="button"
              onClick={() => setFacility('private')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                facility === 'private'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Private hospital
            </button>
          </div>
        </div>

        {procedure.includedAdmissionDays !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extra admission days beyond the typical {procedure.includedAdmissionDays}-day stay
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={extraDays}
              onChange={(e) => setExtraDays(Math.max(0, Number(e.target.value) || 0))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleToggleUsd}
          className="text-sm font-medium text-indigo-600 underline"
        >
          {showUsd ? 'Hide USD estimate' : 'Show USD estimate'}
        </button>
      </div>

      <div className="rounded-xl bg-indigo-50 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-indigo-900">
          Estimated cost — {procedure.name}
        </h3>
        <p className="text-2xl font-bold text-indigo-900">
          {formatNaira(adjustedMin)} – {formatNaira(adjustedMax)}
        </p>

        {showUsd && (
          <p className="text-sm text-indigo-800">
            {rateLoading && 'Fetching live exchange rate…'}
            {!rateLoading && rate !== null &&
              `≈ $${(adjustedMin * rate).toFixed(0)} – $${(adjustedMax * rate).toFixed(0)} at today's rate`}
            {!rateLoading && rateError &&
              'Live USD rate unavailable right now — showing NGN only. Please try again later.'}
          </p>
        )}

        <p className="text-xs text-indigo-800">
          Facility: {facility === 'public' ? 'Public / teaching hospital' : 'Private hospital'} ·
          State: {STATE_LABELS[state]}
          {extraDays > 0 && ` · +${extraDays} extra admission day(s)`}
        </p>

        {procedure.nhiaNote && (
          <p className="text-xs text-indigo-800">NHIA note: {procedure.nhiaNote}</p>
        )}
        {(procedure[facility].note) && (
          <p className="text-xs text-indigo-800">{procedure[facility].note}</p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          className="text-sm font-medium text-gray-800"
        >
          {showWhy ? '− Why is there a range?' : '+ Why is there a range?'}
        </button>
        {showWhy && (
          <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Individual hospitals set their own prices — there is no single national price list for most procedures.</li>
            <li>Complications, extra tests, or longer stays increase the final bill.</li>
            <li>Costs generally run higher in Lagos and Abuja than in other states.</li>
            <li>Inflation and exchange-rate movements affect drug and consumable costs over time.</li>
            <li>Some patients qualify for NHIA-tariffed rates that are lower than posted private rates.</li>
          </ul>
        )}
      </div>

      <div className="text-center">
        <a
          href={`mailto:onlinetoolsng@gmail.com?subject=Outdated%20hospital%20cost%20data&body=Procedure:%20${encodeURIComponent(
            procedure.name
          )}%0AState:%20${encodeURIComponent(STATE_LABELS[state])}%0AWhat%20I%20saw%20instead:%20`}
          className="text-xs text-gray-500 underline"
        >
          Report outdated pricing for this procedure
        </a>
      </div>

      <p className="text-xs text-gray-400 text-center max-w-xl mx-auto">
        These are rough, non-binding estimates for planning purposes only, built from publicly
        available price lists, NHIA tariff references, and hospital-reported ranges last checked
        in June 2026. They are not a quote, not medical advice, and not affiliated with any
        hospital or the NHIA. Always request a written estimate from the specific facility before
        treatment.
      </p>
    </div>
  );
}
