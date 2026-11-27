'use client';

import { useMemo, useState } from 'react';
import { Card, Note, toNum, fmt } from './shared/ui';

/**
 * Data plan cost-per-GB comparer. Plans are entered by the user from the
 * network's current price list. The example rows are placeholders only.
 */

type Plan = { id: string; name: string; price: string; size: string; unit: 'GB' | 'MB' | 'TB'; days: string };
const toGb = (v: number, u: Plan['unit']) => (u === 'MB' ? v / 1024 : u === 'TB' ? v * 1024 : v);

export default function NigeriaDataPlanCostPerGbComparer({ locale }: { locale: string }) {
  void locale;
  const [plans, setPlans] = useState<Plan[]>([
    { id: '1', name: 'Plan A (example)', price: '1000', size: '1.5', unit: 'GB', days: '30' },
    { id: '2', name: 'Plan B (example)', price: '3500', size: '10', unit: 'GB', days: '30' },
    { id: '3', name: 'Plan C (example)', price: '10000', size: '40', unit: 'GB', days: '30' },
  ]);
  const [need, setNeed] = useState('20');

  const rows = useMemo(() => {
    const list = plans.map((p) => {
      const gb = toGb(toNum(p.size), p.unit);
      const price = toNum(p.price);
      return { ...p, gb, perGb: gb > 0 ? price / gb : null, perDay: toNum(p.days) > 0 ? price / toNum(p.days) : null, price };
    });
    const valid = list.filter((x) => x.perGb !== null);
    const best = valid.length ? valid.reduce((a, b) => ((a.perGb as number) <= (b.perGb as number) ? a : b)) : null;
    const n = toNum(need);
    const plan = best && n > 0 ? { count: Math.ceil(n / best.gb), cost: Math.ceil(n / best.gb) * best.price } : null;
    return { list, best, plan };
  }, [plans, need]);

  const upd = (id: string, patch: Partial<Plan>) => setPlans(plans.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const cell = 'rounded-lg border border-gray-300 px-2 py-1 w-full';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card title="Enter the plans you are comparing">
        <p className="text-xs text-gray-500">The example rows are placeholders. Type the price, size and validity from your network&apos;s current price list.</p>
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="grid grid-cols-12 gap-2 items-center">
              <input aria-label="Plan name" className={`${cell} col-span-12 sm:col-span-3`} value={p.name} onChange={(e) => upd(p.id, { name: e.target.value })} />
              <input aria-label="Price in naira" type="number" min="0" className={`${cell} col-span-4 sm:col-span-2`} value={p.price} onChange={(e) => upd(p.id, { price: e.target.value })} placeholder="₦" />
              <input aria-label="Data size" type="number" min="0" step="0.1" className={`${cell} col-span-4 sm:col-span-2`} value={p.size} onChange={(e) => upd(p.id, { size: e.target.value })} />
              <select aria-label="Unit" className={`${cell} col-span-4 sm:col-span-2`} value={p.unit} onChange={(e) => upd(p.id, { unit: e.target.value as Plan['unit'] })}>
                <option>MB</option><option>GB</option><option>TB</option>
              </select>
              <input aria-label="Validity in days" type="number" min="0" className={`${cell} col-span-6 sm:col-span-2`} value={p.days} onChange={(e) => upd(p.id, { days: e.target.value })} placeholder="days" />
              <button type="button" onClick={() => setPlans(plans.filter((x) => x.id !== p.id))} className="col-span-6 sm:col-span-1 text-sm text-red-600">Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setPlans([...plans, { id: String(Date.now()), name: 'New plan', price: '', size: '', unit: 'GB', days: '30' }])}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Add plan</button>
      </Card>

      <Card title="Cost per GB">
        <table className="w-full text-sm text-left">
          <thead><tr className="text-gray-500 border-b"><th className="py-2">Plan</th><th className="py-2 text-right">₦ per GB</th><th className="py-2 text-right">₦ per day</th></tr></thead>
          <tbody>
            {[...rows.list].sort((a, b) => (a.perGb ?? Infinity) - (b.perGb ?? Infinity)).map((x) => (
              <tr key={x.id} className={`border-b border-gray-100 ${rows.best?.id === x.id ? 'bg-green-50' : ''}`}>
                <td className="py-2">{x.name}{rows.best?.id === x.id ? ' (cheapest per GB)' : ''}</td>
                <td className="py-2 text-right">{x.perGb === null ? '-' : fmt(x.perGb, '₦', 2)}</td>
                <td className="py-2 text-right">{x.perDay === null ? '-' : fmt(x.perDay, '₦', 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="dp-need" className="block text-sm font-medium text-gray-700 mb-1">Data I need this month (GB)</label>
            <input id="dp-need" type="number" min="0" value={need} onChange={(e) => setNeed(e.target.value)} className={cell} />
          </div>
          {rows.plan && rows.best && (
            <p className="text-sm text-gray-700">Using {rows.best.name}: {rows.plan.count} plan{rows.plan.count > 1 ? 's' : ''} costs <strong>{fmt(rows.plan.cost)}</strong>.</p>
          )}
        </div>
        <Note>Cost per GB ignores speed, night-time bonuses and validity differences beyond the cost per day shown. Prices change, so use your network&apos;s latest list.</Note>
      </Card>
    </div>
  );
}
