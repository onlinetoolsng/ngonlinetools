'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Appliance electricity cost calculator. kWh = watts x hours / 1000.
 * Wattages are typical and editable; tariff is the user's own.
 */

type Row = { id: string; name: string; watts: string; hours: string; qty: string };
const START: Row[] = [
  { id: 'a', name: 'LED bulb', watts: '9', hours: '6', qty: '6' },
  { id: 'b', name: 'Ceiling fan', watts: '75', hours: '8', qty: '2' },
  { id: 'c', name: 'Refrigerator', watts: '150', hours: '8', qty: '1' },
  { id: 'd', name: 'Television', watts: '100', hours: '5', qty: '1' },
  { id: 'e', name: 'Air conditioner (1 HP)', watts: '900', hours: '6', qty: '1' },
  { id: 'f', name: 'Electric iron', watts: '1000', hours: '0.5', qty: '1' },
];

export default function NigeriaApplianceElectricityCostCalculator({ locale }: { locale: string }) {
  void locale;
  const [rows, setRows] = useState<Row[]>(START);
  const [tariff, setTariff] = useState('63');
  const [vat, setVat] = useState(true);
  const [days, setDays] = useState('30');

  const r = useMemo(() => {
    const per = rows.map((x) => {
      const kwhDay = (toNum(x.watts) * toNum(x.hours) * toNum(x.qty, 1)) / 1000;
      return { ...x, kwhDay };
    });
    const kwhDay = per.reduce((s, x) => s + x.kwhDay, 0);
    const kwhMonth = kwhDay * toNum(days);
    const mult = vat ? 1.075 : 1;
    const cost = (k: number) => k * toNum(tariff) * mult;
    return { per, kwhDay, kwhMonth, costMonth: cost(kwhMonth), cost, mult };
  }, [rows, tariff, vat, days]);

  const upd = (id: string, patch: Partial<Row>) => setRows(rows.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const cell = 'rounded-lg border border-gray-300 px-2 py-1 w-full';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card title="Appliances">
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-gray-500">
          <span className="col-span-4">Appliance</span><span className="col-span-2">Watts</span><span className="col-span-2">Hours a day</span><span className="col-span-2">How many</span>
        </div>
        {rows.map((x) => (
          <div key={x.id} className="grid grid-cols-12 gap-2 items-center">
            <input aria-label="Appliance" className={`${cell} col-span-12 sm:col-span-4`} value={x.name} onChange={(e) => upd(x.id, { name: e.target.value })} />
            <input aria-label="Watts" type="number" min="0" className={`${cell} col-span-4 sm:col-span-2`} value={x.watts} onChange={(e) => upd(x.id, { watts: e.target.value })} />
            <input aria-label="Hours a day" type="number" min="0" step="0.5" className={`${cell} col-span-4 sm:col-span-2`} value={x.hours} onChange={(e) => upd(x.id, { hours: e.target.value })} />
            <input aria-label="Quantity" type="number" min="0" className={`${cell} col-span-4 sm:col-span-2`} value={x.qty} onChange={(e) => upd(x.id, { qty: e.target.value })} />
            <button type="button" onClick={() => setRows(rows.filter((y) => y.id !== x.id))} className="col-span-12 sm:col-span-2 text-sm text-red-600 text-left">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setRows([...rows, { id: String(Date.now()), name: 'New appliance', watts: '', hours: '', qty: '1' }])}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Add appliance</button>
        <p className="text-xs text-gray-500">Wattages are typical examples. Check the label on your own appliance.</p>
      </Card>
      <Card title="Tariff">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field id="ap-t" label="Your tariff (₦ per kWh)" value={tariff} onChange={setTariff} step="0.5" hint="From your vending receipt or DisCo notice" />
          <Field id="ap-d" label="Days in the month" value={days} onChange={setDays} />
          <label className="flex items-center gap-2 text-sm text-gray-700 mt-6"><input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} /> Add 7.5% VAT</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Energy per month" value={`${r.kwhMonth.toFixed(1)} kWh`} />
          <Stat label="Estimated monthly cost" value={fmt(r.costMonth)} tone="good" />
        </div>
        <table className="w-full text-sm text-left">
          <thead><tr className="text-gray-500 border-b"><th className="py-2">Appliance</th><th className="py-2 text-right">kWh / month</th><th className="py-2 text-right">Cost / month</th></tr></thead>
          <tbody>
            {r.per.map((x) => (
              <tr key={x.id} className="border-b border-gray-100">
                <td className="py-2">{x.name}</td><td className="py-2 text-right">{(x.kwhDay * toNum(days)).toFixed(1)}</td>
                <td className="py-2 text-right">{fmt(r.cost(x.kwhDay * toNum(days)))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>Energy = watts × hours ÷ 1,000. Compressor appliances such as fridges and air conditioners cycle on and off, so real use is often lower than rated power. Estimates only.</Note>
      </Card>
    </div>
  );
}
