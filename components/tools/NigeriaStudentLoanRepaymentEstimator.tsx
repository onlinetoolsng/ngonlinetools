'use client';

import { useState, useEffect, useMemo } from 'react';

interface Props {
  locale: string;
}

type IncomeMode = 'employed' | 'self';
type StartMode = 'onSchedule' | 'immediate' | 'delayed';

interface ScheduleRow {
  label: string;
  incomeAssumption: number;
  standardDeduction: number;
  extraPayment: number;
  totalPaid: number;
  remainingBalance: number;
  isGrace: boolean;
  isUnemployedGap: boolean;
}

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export default function NigeriaStudentLoanRepaymentEstimator({ locale }: Props) {
  const [totalLoan, setTotalLoan] = useState<string>('500000');
  const [graduationDate, setGraduationDate] = useState<string>('');
  const [nyscDate, setNyscDate] = useState<string>('');
  const [incomeMode, setIncomeMode] = useState<IncomeMode>('employed');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('150000');
  const [extraPayment, setExtraPayment] = useState<string>('0');
  const [startMode, setStartMode] = useState<StartMode>('onSchedule');
  const [delayedMonths, setDelayedMonths] = useState<string>('6');
  const [incomeGrowth, setIncomeGrowth] = useState<string>('0');
  const [showUsd, setShowUsd] = useState(false);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [rateError, setRateError] = useState(false);
  const [yearlyView, setYearlyView] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!nyscDate && graduationDate) {
      const g = new Date(graduationDate);
      if (!isNaN(g.getTime())) {
        const d = addMonths(g, 12);
        setNyscDate(d.toISOString().slice(0, 10));
      }
    }
  }, [graduationDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    fetch('https://open.er-api.com/v6/latest/NGN')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const rate = data?.rates?.USD;
        if (typeof rate === 'number') {
          setUsdRate(rate);
        } else {
          setRateError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setRateError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const convert = (ngn: number) => {
    if (showUsd && usdRate) return usd.format(ngn * usdRate);
    return naira.format(ngn);
  };

  const result = useMemo(() => {
    const principal = parseFloat(totalLoan) || 0;
    const income = parseFloat(monthlyIncome) || 0;
    const extra = parseFloat(extraPayment) || 0;
    const growth = (parseFloat(incomeGrowth) || 0) / 100;
    const delay = parseInt(delayedMonths, 10) || 0;

    const errs: string[] = [];
    if (principal <= 0) errs.push('Total loan amount must be greater than zero.');
    if (income < 0) errs.push('Monthly income cannot be negative.');
    setErrors(errs);
    if (errs.length || !graduationDate || !nyscDate) {
      return { rows: [] as ScheduleRow[], payoffMonths: 0, totalRepaid: 0, monthlyDeduction: 0 };
    }

    const nysc = new Date(nyscDate);
    let repaymentStart = addMonths(nysc, 24);
    if (startMode === 'immediate') repaymentStart = nysc;
    if (startMode === 'delayed') repaymentStart = addMonths(addMonths(nysc, 24), delay);

    const today = new Date();
    const graceMonthsFromToday = Math.max(0, monthsBetween(today, repaymentStart));

    const rows: ScheduleRow[] = [];
    let balance = principal;
    let currentIncome = income;
    let monthCounter = 0;
    const maxMonths = 600;
    const cursor = new Date(today);

    for (let i = 0; i < graceMonthsFromToday && i < 24 + delay + 24; i++) {
      const label = addMonths(cursor, i).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
      rows.push({
        label,
        incomeAssumption: 0,
        standardDeduction: 0,
        extraPayment: 0,
        totalPaid: 0,
        remainingBalance: balance,
        isGrace: startMode !== 'delayed',
        isUnemployedGap: startMode === 'delayed',
      });
    }

    let monthIndex = graceMonthsFromToday;
    while (balance > 0 && monthCounter < maxMonths) {
      if (monthCounter > 0 && monthCounter % 12 === 0) {
        currentIncome = currentIncome * (1 + growth);
      }
      const standardDeduction = Math.max(0, currentIncome * 0.1);
      let totalPaid = standardDeduction + extra;
      if (totalPaid > balance) totalPaid = balance;
      balance = Math.max(0, balance - totalPaid);

      const label = addMonths(cursor, monthIndex).toLocaleDateString('en-NG', {
        month: 'short',
        year: 'numeric',
      });
      rows.push({
        label,
        incomeAssumption: currentIncome,
        standardDeduction: Math.min(standardDeduction, totalPaid),
        extraPayment: Math.max(0, totalPaid - standardDeduction),
        totalPaid,
        remainingBalance: balance,
        isGrace: false,
        isUnemployedGap: false,
      });

      monthCounter++;
      monthIndex++;
    }

    const totalRepaid = rows.reduce((s, r) => s + r.totalPaid, 0);
    return {
      rows,
      payoffMonths: monthCounter,
      totalRepaid,
      monthlyDeduction: income * 0.1 + extra,
    };
  }, [totalLoan, graduationDate, nyscDate, incomeMode, monthlyIncome, extraPayment, startMode, delayedMonths, incomeGrowth]);

  const displayRows = useMemo(() => {
    const capped = result.rows.slice(0, 120);
    if (!yearlyView) return capped;
    const byYear = new Map<string, ScheduleRow>();
    capped.forEach((r) => {
      const year = r.label.split(' ')[1];
      const existing = byYear.get(year);
      if (!existing) {
        byYear.set(year, { ...r, label: year });
      } else {
        existing.standardDeduction += r.standardDeduction;
        existing.extraPayment += r.extraPayment;
        existing.totalPaid += r.totalPaid;
        existing.remainingBalance = r.remainingBalance;
      }
    });
    return Array.from(byYear.values());
  }, [result.rows, yearlyView]);

  const chartPoints = useMemo(() => {
    const rows = result.rows.slice(0, 120);
    if (rows.length === 0) return '';
    const max = rows[0].remainingBalance || 1;
    const w = 600;
    const h = 160;
    return rows
      .map((r, i) => {
        const x = (i / Math.max(1, rows.length - 1)) * w;
        const y = h - (r.remainingBalance / max) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [result.rows]);

  const years = Math.floor(result.payoffMonths / 12);
  const months = result.payoffMonths % 12;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Loan Amount (₦)
            </label>
            <input
              type="number"
              min={0}
              value={totalLoan}
              onChange={(e) => setTotalLoan(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Graduation Date
            </label>
            <input
              type="date"
              value={graduationDate}
              onChange={(e) => setGraduationDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NYSC Completion Date
            </label>
            <input
              type="date"
              value={nyscDate}
              onChange={(e) => setNyscDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Income Type</label>
            <select
              value={incomeMode}
              onChange={(e) => setIncomeMode(e.target.value as IncomeMode)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="employed">Employed (Salary)</option>
              <option value="self">Self-Employed (Monthly Profit)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {incomeMode === 'employed' ? 'Monthly Salary (₦)' : 'Monthly Profit (₦)'}
            </label>
            <input
              type="number"
              min={0}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extra Monthly Payment (₦)
            </label>
            <input
              type="number"
              min={0}
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Income Growth (%)
            </label>
            <input
              type="number"
              value={incomeGrowth}
              onChange={(e) => setIncomeGrowth(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Repayment Simulation From
            </label>
            <select
              value={startMode}
              onChange={(e) => setStartMode(e.target.value as StartMode)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="onSchedule">On Schedule (2 yrs post-NYSC)</option>
              <option value="immediate">Immediately</option>
              <option value="delayed">Delayed (unemployed scenario)</option>
            </select>
          </div>

          {startMode === 'delayed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delay Beyond Schedule (months)
              </label>
              <input
                type="number"
                min={0}
                value={delayedMonths}
                onChange={(e) => setDelayedMonths(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={showUsd} onChange={(e) => setShowUsd(e.target.checked)} />
            Show in USD {rateError && '(rate unavailable, showing NGN)'}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={yearlyView} onChange={(e) => setYearlyView(e.target.checked)} />
            Yearly summary view
          </label>
        </div>

        {errors.length > 0 && (
          <div className="rounded-lg bg-red-50 text-red-600 text-sm p-3">
            {errors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-indigo-50 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500">Total Principal</div>
            <div className="text-lg font-semibold text-gray-900">
              {convert(parseFloat(totalLoan) || 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Interest Rate</div>
            <div className="text-lg font-semibold text-gray-900">0%</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Est. Monthly Deduction</div>
            <div className="text-lg font-semibold text-gray-900">
              {convert(result.monthlyDeduction)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Projected Payoff Time</div>
            <div className="text-lg font-semibold text-gray-900">
              {result.payoffMonths > 0 ? `${years}y ${months}m` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Total Repaid</div>
            <div className="text-lg font-semibold text-gray-900">
              {convert(result.totalRepaid)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Remaining Balance</div>
            <div className="text-lg font-semibold text-gray-900">
              {convert(result.rows.length ? result.rows[result.rows.length - 1].remainingBalance : 0)}
            </div>
          </div>
        </div>
      </div>

      {chartPoints && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-sm font-medium text-gray-700 mb-2">Balance Over Time</div>
          <svg viewBox="0 0 600 160" className="w-full h-40">
            <polyline points={chartPoints} fill="none" stroke="#4f46e5" strokeWidth="2" />
          </svg>
        </div>
      )}

      {displayRows.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-3">Period</th>
                <th className="py-2 pr-3">Income Assumption</th>
                <th className="py-2 pr-3">Standard 10%</th>
                <th className="py-2 pr-3">Extra</th>
                <th className="py-2 pr-3">Total Paid</th>
                <th className="py-2 pr-3">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-2 pr-3">{r.label}</td>
                  <td className="py-2 pr-3">
                    {r.isUnemployedGap ? 'No deduction — affidavit required' : convert(r.incomeAssumption)}
                  </td>
                  <td className="py-2 pr-3">{convert(r.standardDeduction)}</td>
                  <td className="py-2 pr-3">{convert(r.extraPayment)}</td>
                  <td className="py-2 pr-3">{convert(r.totalPaid)}</td>
                  <td className="py-2 pr-3">{convert(r.remainingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-400 pt-2">
        For estimation only. Assumes 0% interest, a 2-year post-NYSC grace period, and a flat 10% deduction
        of income as set out in the Student Loans (Access to Higher Education) Act and NELFUND guidelines.
        Actual repayment terms are determined by the NELFUND portal and applicable law — consult official
        sources before making financial decisions. USD figures are indicative only, converted at the exchange
        rate available at page load.
      </p>
    </div>
  );
}
