'use client';

import { useEffect, useMemo, useState } from 'react';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Programme = 'abp' | 'nirsal' | 'custom';
type Frequency = 'monthly' | 'quarterly' | 'seasonal' | 'bullet';

interface ScheduleRow {
  period: number;
  label: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface CalculationResult {
  schedule: ScheduleRow[];
  totalInterest: number;
  totalRepayment: number;
  periodicPayment: number;
  monthlyEquivalent: number;
}

const PROGRAMME_DEFAULTS: Record<Programme, { label: string; rate: number; note: string }> = {
  abp: {
    label: "Anchor Borrowers' Programme (ABP)",
    rate: 9,
    note: 'ABP is typically priced at 9% per annum, all-inclusive, under CBN guidelines.',
  },
  nirsal: {
    label: 'NIRSAL / General Agric Loan',
    rate: 9,
    note: 'NIRSAL-guaranteed facilities are usually priced between 9% and single-digit ranges depending on the Participating Financial Institution (PFI).',
  },
  custom: {
    label: 'Custom rate',
    rate: 15,
    note: 'Enter the rate quoted by your bank or PFI.',
  },
};

const PRINCIPAL_PRESETS = [100_000, 500_000, 1_000_000, 5_000_000, 10_000_000];
const TENURE_PRESETS = [6, 9, 12, 18, 24, 36];
const COMMODITIES = [
  'Rice',
  'Maize',
  'Cassava',
  'Cotton',
  'Soybean',
  'Wheat',
  'Tomato',
  'Poultry',
  'Other',
];

function formatNaira(value: number): string {
  if (!isFinite(value)) return '₦0';
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// -----------------------------------------------------------------------------
// Core calculation — flat/simple-interest methodology
//
// ABP pricing is quoted as a single all-in annual rate rather than a
// compounding reducing-balance rate, so this calculator spreads interest
// evenly across the tenure (flat-rate style) rather than amortizing on a
// reducing balance. This matches how the all-in rate is generally
// communicated to smallholder borrowers, but a PFI may apply a different
// internal methodology — always confirm the actual repayment plan with
// your bank.
// -----------------------------------------------------------------------------

function calculateAmortization(
  principal: number,
  annualRatePct: number,
  months: number,
  frequency: Frequency,
  gracePeriodMonths: number
): CalculationResult {
  const safeMonths = Math.max(1, months);
  const safeGrace = Math.min(Math.max(0, gracePeriodMonths), safeMonths - 1);
  const repayableMonths = safeMonths - safeGrace;

  const totalInterest = round2(principal * (annualRatePct / 100) * (safeMonths / 12));
  const totalRepayment = round2(principal + totalInterest);

  let periodMonths: number; // months per repayment period
  let periodLabelPrefix: string;

  switch (frequency) {
    case 'monthly':
      periodMonths = 1;
      periodLabelPrefix = 'Month';
      break;
    case 'quarterly':
      periodMonths = 3;
      periodLabelPrefix = 'Quarter';
      break;
    case 'seasonal':
      periodMonths = 6;
      periodLabelPrefix = 'Season';
      break;
    case 'bullet':
    default:
      periodMonths = repayableMonths;
      periodLabelPrefix = 'Final payment';
      break;
  }

  const periodCount = Math.max(1, Math.round(repayableMonths / periodMonths));
  const principalPerPeriod = round2(principal / periodCount);
  const interestPerPeriod = round2(totalInterest / periodCount);
  const paymentPerPeriod = round2(principalPerPeriod + interestPerPeriod);

  const schedule: ScheduleRow[] = [];
  let balance = principal;

  for (let i = 1; i <= periodCount; i++) {
    const isLast = i === periodCount;
    const principalPortion = isLast ? round2(balance) : principalPerPeriod;
    const interestPortion = isLast
      ? round2(totalInterest - interestPerPeriod * (periodCount - 1))
      : interestPerPeriod;
    balance = round2(balance - principalPortion);

    schedule.push({
      period: i,
      label:
        frequency === 'bullet'
          ? `${periodLabelPrefix} (month ${safeGrace + periodMonths})`
          : `${periodLabelPrefix} ${i}${safeGrace ? ` (after ${safeGrace}mo grace)` : ''}`,
      payment: round2(principalPortion + interestPortion),
      principal: principalPortion,
      interest: interestPortion,
      balance: Math.max(0, balance),
    });
  }

  const monthlyEquivalent = round2(totalRepayment / safeMonths);

  return {
    schedule,
    totalInterest,
    totalRepayment,
    periodicPayment: paymentPerPeriod,
    monthlyEquivalent,
  };
}

function downloadCsv(schedule: ScheduleRow[], filename: string) {
  const header = 'Period,Payment (NGN),Principal (NGN),Interest (NGN),Balance (NGN)\n';
  const rows = schedule
    .map((r) => `${r.label},${r.payment},${r.principal},${r.interest},${r.balance}`)
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function NigeriaFarmLoanRepaymentCalculator({ locale }: { locale: string }) {
  const [programme, setProgramme] = useState<Programme>('abp');
  const [principal, setPrincipal] = useState<number>(500_000);
  const [rate, setRate] = useState<number>(PROGRAMME_DEFAULTS.abp.rate);
  const [months, setMonths] = useState<number>(9);
  const [frequency, setFrequency] = useState<Frequency>('bullet');
  const [gracePeriod, setGracePeriod] = useState<number>(0);
  const [farmSize, setFarmSize] = useState<string>('');
  const [commodity, setCommodity] = useState<string>('Rice');
  const [showFullSchedule, setShowFullSchedule] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (programme !== 'custom') {
      setRate(PROGRAMME_DEFAULTS[programme].rate);
    }
  }, [programme]);

  useEffect(() => {
    if (principal <= 0) {
      setError('Enter a loan amount greater than zero.');
    } else if (principal > 100_000_000) {
      setError('Amounts above ₦100,000,000 are uncommon for smallholder ABP/NIRSAL facilities — double-check this figure.');
    } else if (rate < 0 || rate > 60) {
      setError('Enter a realistic interest rate (0–60%).');
    } else {
      setError('');
    }
  }, [principal, rate]);

  const result: CalculationResult = useMemo(
    () => calculateAmortization(principal || 0, rate || 0, months, frequency, gracePeriod),
    [principal, rate, months, frequency, gracePeriod]
  );

  const principalShare = result.totalRepayment > 0 ? (principal / result.totalRepayment) * 100 : 0;
  const interestShare = 100 - principalShare;

  const visibleSchedule = showFullSchedule ? result.schedule : result.schedule.slice(0, 12);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" lang={locale}>
      {/* Programme selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Loan Programme</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(Object.keys(PROGRAMME_DEFAULTS) as Programme[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setProgramme(key)}
              aria-pressed={programme === key}
              className={`rounded-xl px-3 py-2 text-sm font-medium border transition ${
                programme === key
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {PROGRAMME_DEFAULTS[key].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">{PROGRAMME_DEFAULTS[programme].note}</p>
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
        <div>
          <label htmlFor="principal" className="block text-sm font-medium text-gray-700 mb-1">
            Principal Loan Amount (₦)
          </label>
          <input
            id="principal"
            type="number"
            min={0}
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            aria-describedby="principal-presets"
          />
          <div id="principal-presets" className="flex flex-wrap gap-2 mt-2">
            {PRINCIPAL_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrincipal(p)}
                className="text-xs rounded-full border border-gray-300 px-3 py-1 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
              >
                {formatNaira(p)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
              Interest Rate (% p.a., all-in)
            </label>
            <input
              id="rate"
              type="number"
              step={0.1}
              min={0}
              max={60}
              value={rate}
              disabled={programme !== 'custom'}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="grace" className="block text-sm font-medium text-gray-700 mb-1">
              Grace Period (months)
            </label>
            <input
              id="grace"
              type="number"
              min={0}
              max={6}
              value={gracePeriod}
              onChange={(e) => setGracePeriod(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="tenure" className="block text-sm font-medium text-gray-700 mb-1">
            Loan Tenure: {months} months
          </label>
          <input
            id="tenure"
            type="range"
            min={3}
            max={36}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {TENURE_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`text-xs rounded-full border px-3 py-1 ${
                  months === m
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                    : 'border-gray-300 text-gray-600 hover:border-indigo-400'
                }`}
              >
                {m}mo
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
            Repayment Frequency
          </label>
          <select
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="bullet">Bullet (lump sum at harvest)</option>
            <option value="seasonal">Seasonal</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="farmSize" className="block text-sm font-medium text-gray-700 mb-1">
              Farm Size (hectares) — optional
            </label>
            <input
              id="farmSize"
              type="number"
              min={0}
              value={farmSize}
              onChange={(e) => setFarmSize(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="e.g. 2.5"
            />
          </div>
          <div>
            <label htmlFor="commodity" className="block text-sm font-medium text-gray-700 mb-1">
              Commodity — optional
            </label>
            <select
              id="commodity"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {COMMODITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      <div className="rounded-xl bg-indigo-50 p-5 space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Repayment Summary</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Loan Amount</p>
            <p className="font-semibold text-gray-900">{formatNaira(principal)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Rate</p>
            <p className="font-semibold text-gray-900">{rate}% p.a.</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tenure</p>
            <p className="font-semibold text-gray-900">{months} months</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {frequency === 'bullet' ? 'Final Payment' : 'Payment per Period'}
            </p>
            <p className="font-semibold text-gray-900">{formatNaira(result.periodicPayment)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Interest</p>
            <p className="font-semibold text-gray-900">{formatNaira(result.totalInterest)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Repayment</p>
            <p className="font-semibold text-gray-900">{formatNaira(result.totalRepayment)}</p>
          </div>
        </div>

        {/* Principal vs interest bar */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Principal vs Interest</p>
          <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden flex">
            <div
              className="h-full bg-indigo-600"
              style={{ width: `${principalShare}%` }}
              aria-label={`Principal ${principalShare.toFixed(0)}%`}
            />
            <div
              className="h-full bg-amber-400"
              style={{ width: `${interestShare}%` }}
              aria-label={`Interest ${interestShare.toFixed(0)}%`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Principal {principalShare.toFixed(0)}%</span>
            <span>Interest {interestShare.toFixed(0)}%</span>
          </div>
        </div>

        <div className="space-y-1 text-sm text-gray-700">
          <p>
            At {rate}% p.a., this loan costs {formatNaira(result.totalInterest)} in interest over{' '}
            {months} months.
          </p>
          <p>
            Budget roughly {formatNaira(result.monthlyEquivalent)} per month from farm income to
            cover this facility comfortably.
          </p>
          {commodity && frequency === 'bullet' && (
            <p>
              A bullet repayment structure is common for {commodity.toLowerCase()} financing,
              since repayment is expected from harvest sale proceeds rather than monthly income.
            </p>
          )}
        </div>

        {/* Schedule table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-800">Repayment Schedule</h3>
            <button
              type="button"
              onClick={() => downloadCsv(result.schedule, 'farm-loan-repayment-schedule.csv')}
              className="text-xs rounded-full border border-indigo-300 px-3 py-1 text-indigo-700 hover:bg-indigo-100"
            >
              Download CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-indigo-100 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-indigo-100 text-gray-700">
                  <th className="px-3 py-2 text-left">Period</th>
                  <th className="px-3 py-2 text-right">Payment</th>
                  <th className="px-3 py-2 text-right">Principal</th>
                  <th className="px-3 py-2 text-right">Interest</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {visibleSchedule.map((row) => (
                  <tr key={row.period} className="border-t border-gray-100">
                    <td className="px-3 py-2">{row.label}</td>
                    <td className="px-3 py-2 text-right">{formatNaira(row.payment)}</td>
                    <td className="px-3 py-2 text-right">{formatNaira(row.principal)}</td>
                    <td className="px-3 py-2 text-right">{formatNaira(row.interest)}</td>
                    <td className="px-3 py-2 text-right">{formatNaira(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.schedule.length > 12 && (
            <button
              type="button"
              onClick={() => setShowFullSchedule((s) => !s)}
              className="text-xs text-indigo-600 mt-2 underline"
            >
              {showFullSchedule ? 'Show fewer periods' : 'Show full schedule'}
            </button>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center">
        Estimates only, based on a simplified flat-rate (all-in) methodology and publicly stated
        CBN ABP/NIRSAL rate conventions. This is not a loan offer, approval, or financial/legal
        advice — actual eligibility, fees, and repayment terms are set by your Participating
        Financial Institution (PFI), the Central Bank of Nigeria (CBN), and NIRSAL, and may
        differ from this estimate. Please verify current rates and terms directly with your bank
        before making financial decisions.
      </p>
    </div>
  );
}
