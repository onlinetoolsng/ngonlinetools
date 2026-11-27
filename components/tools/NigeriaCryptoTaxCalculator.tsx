'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';
import { ngPayeOnAnnual, ngMarginalRate } from '@/lib/calculators/ngPaye';

/**
 * Crypto and digital asset tax estimate for individuals (Nigeria Tax Act 2025).
 * Digital asset gains are taxable; for individuals they are taxed at the
 * progressive personal income tax rates. Losses on digital assets can only
 * offset gains from similar transactions.
 */

type Trade = { id: string; name: string; proceeds: string; cost: string; fees: string };

export default function NigeriaCryptoTaxCalculator({ locale }: { locale: string }) {
  void locale;
  const [trades, setTrades] = useState<Trade[]>([
    { id: '1', name: 'Bitcoin sale', proceeds: '8000000', cost: '5000000', fees: '40000' },
    { id: '2', name: 'Token sale', proceeds: '1500000', cost: '2000000', fees: '15000' },
  ]);
  const [other, setOther] = useState('6000000');

  const r = useMemo(() => {
    const rows = trades.map((t) => ({ ...t, gain: toNum(t.proceeds) - toNum(t.cost) - toNum(t.fees) }));
    const net = rows.reduce((s, x) => s + x.gain, 0);
    const taxable = Math.max(0, net); // losses cannot offset other income
    const base = ngPayeOnAnnual(toNum(other));
    const withGain = ngPayeOnAnnual(toNum(other) + taxable);
    const tax = withGain - base;
    return { rows, net, taxable, tax, eff: taxable > 0 ? (tax / taxable) * 100 : 0, marginal: ngMarginalRate(toNum(other) + taxable), after: net - tax };
  }, [trades, other]);

  const upd = (id: string, p: Partial<Trade>) => setTrades(trades.map((t) => (t.id === id ? { ...t, ...p } : t)));
  const cell = 'rounded-lg border border-gray-300 px-2 py-1 w-full';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card title="Your disposals this year (sales, swaps, spending)">
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-gray-500">
          <span className="col-span-3">Description</span><span className="col-span-3">Sale value (₦)</span><span className="col-span-3">Cost (₦)</span><span className="col-span-2">Fees (₦)</span>
        </div>
        {trades.map((t) => (
          <div key={t.id} className="grid grid-cols-12 gap-2 items-center">
            <input aria-label="Description" className={`${cell} col-span-12 sm:col-span-3`} value={t.name} onChange={(e) => upd(t.id, { name: e.target.value })} />
            <input aria-label="Sale value" type="number" min="0" className={`${cell} col-span-4 sm:col-span-3`} value={t.proceeds} onChange={(e) => upd(t.id, { proceeds: e.target.value })} />
            <input aria-label="Cost" type="number" min="0" className={`${cell} col-span-4 sm:col-span-3`} value={t.cost} onChange={(e) => upd(t.id, { cost: e.target.value })} />
            <input aria-label="Fees" type="number" min="0" className={`${cell} col-span-4 sm:col-span-2`} value={t.fees} onChange={(e) => upd(t.id, { fees: e.target.value })} />
            <button type="button" onClick={() => setTrades(trades.filter((x) => x.id !== t.id))} className="col-span-12 sm:col-span-1 text-sm text-red-600 text-left">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setTrades([...trades, { id: String(Date.now()), name: 'New disposal', proceeds: '', cost: '', fees: '' }])}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Add disposal</button>
        <Field id="cx-o" label="Your other taxable income for the year (₦)" value={other} onChange={setOther} step="100000" hint="Salary and other income after reliefs" />
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Net digital asset gain" value={fmt(r.net)} tone={r.net >= 0 ? 'good' : 'bad'} />
          <Stat label="Estimated extra tax" value={fmt(r.tax)} tone="bad" />
          <Stat label="Effective rate on the gain" value={`${r.eff.toFixed(1)}%`} />
          <Stat label="Gain after tax" value={fmt(r.after)} />
        </div>
        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li>A net loss gives no tax and cannot reduce tax on other income. It can only offset gains from similar transactions.</li>
          <li>Your top rate after adding the gain is {(r.marginal * 100).toFixed(0)}%.</li>
        </ul>
        <Note>
          Under the Nigeria Tax Act 2025 (effective 1 January 2026), profits from digital asset transactions are taxable, and for individuals capital gains are taxed at
          the progressive personal income tax rates (up to 25%). Companies are taxed differently. Rules on how to value trades and which gains are exempt can be technical,
          so treat this as an estimate and ask a tax adviser before filing.
        </Note>
      </Card>
    </div>
  );
}
