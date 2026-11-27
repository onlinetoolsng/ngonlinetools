'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Savings challenge calculator: fixed daily or weekly saving, or the
 * 52-week increasing challenge. No returns are assumed: plain totals.
 */

type Mode = 'daily' | 'weekly' | 'weeks52' | 'target';

export default function SavingsChallengeCalculator({ locale }: { locale: string }) {
  void locale;
  const [mode, setMode] = useState<Mode>('daily');
  const [amount, setAmount] = useState('1000');
  const [period, setPeriod] = useState('365');
  const [start, setStart] = useState('1000');
  const [step, setStep] = useState('1000');
  const [target, setTarget] = useState('500000');
  const [days, setDays] = useState('365');

  const r = useMemo(() => {
    if (mode === 'daily') { const d = Math.floor(toNum(period)); return { total: toNum(amount) * d, label: `${fmt(toNum(amount))} a day for ${d} days`, perWeek: toNum(amount) * 7 }; }
    if (mode === 'weekly') { const w = Math.floor(toNum(period)); return { total: toNum(amount) * w, label: `${fmt(toNum(amount))} a week for ${w} weeks`, perWeek: toNum(amount) }; }
    if (mode === 'weeks52') {
      const s = toNum(start), inc = toNum(step);
      const total = Array.from({ length: 52 }, (_, i) => s + i * inc).reduce((a, b) => a + b, 0);
      return { total, label: `Start at ${fmt(s)} and add ${fmt(inc)} each week for 52 weeks (last week ${fmt(s + 51 * inc)})`, perWeek: total / 52 };
    }
    const d = Math.max(1, Math.floor(toNum(days)));
    return { total: toNum(target), label: `To reach ${fmt(toNum(target))} in ${d} days`, perDay: toNum(target) / d, perWeek: (toNum(target) / d) * 7, perMonth: (toNum(target) / d) * 30 };
  }, [mode, amount, period, start, step, target, days]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <Select id="sc-mode" label="Challenge" value={mode} onChange={(v) => setMode(v as Mode)}
          options={[
            { value: 'daily', label: 'Save the same amount every day' },
            { value: 'weekly', label: 'Save the same amount every week' },
            { value: 'weeks52', label: '52-week challenge (increase each week)' },
            { value: 'target', label: 'How much per day to reach a target?' },
          ]} />
        {(mode === 'daily' || mode === 'weekly') && (
          <div className="grid grid-cols-2 gap-4">
            <Field id="sc-amt" label={`Amount each ${mode === 'daily' ? 'day' : 'week'} (₦)`} value={amount} onChange={setAmount} step="100" />
            <Field id="sc-per" label={mode === 'daily' ? 'Number of days' : 'Number of weeks'} value={period} onChange={setPeriod} />
          </div>
        )}
        {mode === 'weeks52' && (
          <div className="grid grid-cols-2 gap-4">
            <Field id="sc-start" label="Week 1 amount (₦)" value={start} onChange={setStart} step="100" />
            <Field id="sc-step" label="Increase each week (₦)" value={step} onChange={setStep} step="100" />
          </div>
        )}
        {mode === 'target' && (
          <div className="grid grid-cols-2 gap-4">
            <Field id="sc-target" label="Target (₦)" value={target} onChange={setTarget} step="10000" />
            <Field id="sc-days" label="Days to reach it" value={days} onChange={setDays} />
          </div>
        )}
      </Card>
      <Card>
        {mode === 'target' ? (
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Per day" value={fmt(r.perDay ?? 0)} tone="good" />
            <Stat label="Per week" value={fmt(r.perWeek ?? 0)} />
            <Stat label="Per month (30 days)" value={fmt(r.perMonth ?? 0)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="You will have saved" value={fmt(r.total)} tone="good" />
            <Stat label="Average per week" value={fmt(r.perWeek)} />
          </div>
        )}
        <p className="text-sm text-gray-600">{r.label}</p>
        <Note>This is plain addition with no interest. Savings kept in an interest-bearing account or investment would earn more.</Note>
      </Card>
    </div>
  );
}
