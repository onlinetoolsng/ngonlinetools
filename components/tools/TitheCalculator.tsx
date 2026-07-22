'use client';

import { useMemo, useState } from 'react';

type IncomeType = 'salary' | 'business' | 'other' | 'mixed' | 'oneTime';
type Frequency = 'monthly' | 'annually' | 'oneTime';

interface Deductions {
  paye: number; // percent
  pension: number; // percent
  other: number; // percent
}

const formatNaira = (value: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

// Rough Nigerian PAYE approximation (2026 bands). This is NOT a substitute
// for a proper PAYE calculation and is only used to estimate a "net" tithe base.
function estimatePaye(annualIncome: number): number {
  if (annualIncome <= 0) return 0;
  const bands = [
    { upTo: 800_000, rate: 0 },
    { upTo: 3_000_000, rate: 0.15 },
    { upTo: 12_000_000, rate: 0.18 },
    { upTo: 25_000_000, rate: 0.21 },
    { upTo: 50_000_000, rate: 0.23 },
    { upTo: Infinity, rate: 0.25 },
  ];
  let remaining = annualIncome;
  let lastCap = 0;
  let tax = 0;
  for (const band of bands) {
    const taxableInBand = Math.max(0, Math.min(remaining, band.upTo - lastCap));
    tax += taxableInBand * band.rate;
    remaining -= taxableInBand;
    lastCap = band.upTo;
    if (remaining <= 0) break;
  }
  return tax;
}

interface TitheCalculatorProps {
  locale: string;
}

export function TitheCalculator({ locale }: TitheCalculatorProps) {
  const [incomeType, setIncomeType] = useState<IncomeType>('salary');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [grossIncome, setGrossIncome] = useState<string>('');
  const [extras, setExtras] = useState<string[]>(['']);
  const [isNet, setIsNet] = useState(false);
  const [deductions, setDeductions] = useState<Deductions>({ paye: 0, pension: 8, other: 0 });
  const [error, setError] = useState<string | null>(null);

  const parsedGross = Number(grossIncome.replace(/,/g, '')) || 0;
  const parsedExtras = extras.map((e) => Number(e.replace(/,/g, '')) || 0);

  const totalIncome = useMemo(
    () => parsedGross + parsedExtras.reduce((sum, v) => sum + v, 0),
    [parsedGross, parsedExtras]
  );

  const annualIncome = frequency === 'monthly' ? totalIncome * 12 : totalIncome;

  const deductionAmount = useMemo(() => {
    if (!isNet) return 0;
    const payeAmount =
      deductions.paye > 0 ? annualIncome * (deductions.paye / 100) : estimatePaye(annualIncome);
    const pensionAmount = annualIncome * (deductions.pension / 100);
    const otherAmount = annualIncome * (deductions.other / 100);
    return payeAmount + pensionAmount + otherAmount;
  }, [isNet, deductions, annualIncome]);

  const titheBaseAnnual = Math.max(0, annualIncome - deductionAmount);
  const titheAnnual = titheBaseAnnual * 0.1;
  const titheMonthly = titheAnnual / 12;
  const remainingAnnual = Math.max(0, annualIncome - titheAnnual);

  const handleGrossChange = (value: string) => {
    setError(null);
    if (value !== '' && Number.isNaN(Number(value.replace(/,/g, '')))) {
      setError('Please enter a valid number.');
      return;
    }
    setGrossIncome(value);
  };

  const handleExtraChange = (index: number, value: string) => {
    const next = [...extras];
    next[index] = value;
    setExtras(next);
  };

  const addExtra = () => {
    if (extras.length < 3) setExtras([...extras, '']);
  };

  const reset = () => {
    setGrossIncome('');
    setExtras(['']);
    setIsNet(false);
    setDeductions({ paye: 0, pension: 8, other: 0 });
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <p className="text-sm text-gray-400">
        For educational and religious-planning purposes only. This tool does not
        provide financial, legal, or tax advice, and tithing is entirely voluntary.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Income type
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            value={incomeType}
            onChange={(e) => setIncomeType(e.target.value as IncomeType)}
          >
            <option value="salary">Salary</option>
            <option value="business">Business profit</option>
            <option value="other">Other income</option>
            <option value="mixed">Mixed income</option>
            <option value="oneTime">Assets / one-time</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (NGN)
            </label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="e.g. 500,000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={grossIncome}
              onChange={(e) => handleGrossChange(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
            >
              <option value="monthly">Monthly</option>
              <option value="annually">Annually</option>
              <option value="oneTime">One-time</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional income streams (optional)
          </label>
          <div className="space-y-2">
            {extras.map((value, i) => (
              <input
                key={i}
                type="text"
                inputMode="decimal"
                placeholder="e.g. side hustle, rental income"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={value}
                onChange={(e) => handleExtraChange(i, e.target.value)}
              />
            ))}
          </div>
          {extras.length < 3 && (
            <button
              type="button"
              onClick={addExtra}
              className="mt-2 text-sm text-indigo-600 hover:underline"
            >
              + Add another income stream
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Calculate on net income</p>
            <p className="text-xs text-gray-400">
              Deducts estimated PAYE, pension, and other items first
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isNet}
            onClick={() => setIsNet(!isNet)}
            className={`w-11 h-6 rounded-full transition-colors ${
              isNet ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                isNet ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {isNet && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                PAYE % (blank = auto-estimate)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                value={deductions.paye || ''}
                onChange={(e) =>
                  setDeductions({ ...deductions, paye: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pension %</label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                value={deductions.pension}
                onChange={(e) =>
                  setDeductions({ ...deductions, pension: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Other %</label>
              <input
                type="number"
                min={0}
                max={100}
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                value={deductions.other}
                onChange={(e) =>
                  setDeductions({ ...deductions, other: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-indigo-50 p-6 space-y-3">
        <p className="text-sm text-indigo-700 font-medium">Your tithe (10%)</p>
        <p className="text-3xl font-bold text-indigo-900">
          {formatNaira(frequency === 'oneTime' ? titheAnnual : titheMonthly)}
          <span className="text-base font-normal text-indigo-700">
            {frequency === 'oneTime' ? ' one-time' : ' / month'}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
          <div>
            <p className="text-indigo-700">Annual tithe</p>
            <p className="font-semibold text-indigo-900">{formatNaira(titheAnnual)}</p>
          </div>
          <div>
            <p className="text-indigo-700">Remaining after tithe (annual)</p>
            <p className="font-semibold text-indigo-900">{formatNaira(remainingAnnual)}</p>
          </div>
        </div>
        <p className="text-xs text-indigo-600 pt-2">
          10% of {formatNaira(titheBaseAnnual)} ({isNet ? 'net' : 'gross'} annual base) ={' '}
          {formatNaira(titheAnnual)}
        </p>
      </div>

      <details className="rounded-xl border border-gray-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">
          Gross vs net — which should I use?
        </summary>
        <p className="mt-2 text-sm text-gray-600">
          Many Nigerian Christians tithe on gross income, before any deductions.
          Others tithe on net (take-home) pay, reasoning that PAYE and pension
          contributions are not truly "theirs" to give from. There is no single
          rule — this is a matter of personal conviction, not law.
        </p>
      </details>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={reset}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Reset
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Tithing is a voluntary religious practice. No Nigerian law requires an
        individual to pay tithe or sets a calculation method — this tool applies
        the traditional 10% figure as a convenience only. For guidance specific to
        your faith or finances, speak with your pastor, imam, or a licensed
        financial adviser. (Locale: {locale})
      </p>
    </div>
  );
}
