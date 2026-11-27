'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Fuel price to litres calculator (petrol, diesel, cooking gas by kg).
 * Pure arithmetic. The price per unit is entered by the user because pump
 * prices change often and differ by station and state.
 */

type Mode = 'naira-to-litres' | 'litres-to-naira' | 'tank';
const FUELS = [
  { value: 'petrol', label: 'Petrol (PMS), per litre', unit: 'litres' },
  { value: 'diesel', label: 'Diesel (AGO), per litre', unit: 'litres' },
  { value: 'gas', label: 'Cooking gas (LPG), per kg', unit: 'kg' },
];

export default function FuelPriceLitresCalculator({ locale }: { locale: string }) {
  void locale;
  const [mode, setMode] = useState<Mode>('naira-to-litres');
  const [fuel, setFuel] = useState('petrol');
  const [price, setPrice] = useState('900');
  const [amount, setAmount] = useState('10000');
  const [litres, setLitres] = useState('20');
  const [tank, setTank] = useState('45');
  const [level, setLevel] = useState('20');

  const unit = FUELS.find((f) => f.value === fuel)?.unit ?? 'litres';
  const p = toNum(price);

  const r = useMemo(() => {
    if (p <= 0) return null;
    if (mode === 'naira-to-litres') return { main: toNum(amount) / p, mainLabel: `${unit} you get`, sub: `for ${fmt(toNum(amount))} at ${fmt(p)} per ${unit === 'kg' ? 'kg' : 'litre'}` };
    if (mode === 'litres-to-naira') return { main: toNum(litres) * p, mainLabel: 'Cost', sub: `${toNum(litres)} ${unit} at ${fmt(p)}`, money: true };
    const need = Math.max(0, toNum(tank) - (toNum(tank) * toNum(level)) / 100);
    return { main: need * p, mainLabel: 'Cost to fill', sub: `${need.toFixed(1)} ${unit} needed`, money: true };
  }, [mode, p, amount, litres, tank, level, unit]);

  const presets = useMemo(() => [1000, 2000, 5000, 10000, 20000, 50000].map((a) => ({ a, l: p > 0 ? a / p : 0 })), [p]);
  const litrePresets = useMemo(() => [5, 10, 20, 25, 30, 50].map((l) => ({ l, a: l * p })), [p]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="fl-mode" label="What do you want to find?" value={mode} onChange={(v) => setMode(v as Mode)}
            options={[
              { value: 'naira-to-litres', label: 'Litres for my money' },
              { value: 'litres-to-naira', label: 'Cost of a number of litres' },
              { value: 'tank', label: 'Cost to fill my tank' },
            ]} />
          <Select id="fl-fuel" label="Fuel" value={fuel} onChange={setFuel} options={FUELS.map((f) => ({ value: f.value, label: f.label }))} />
          <Field id="fl-price" label={`Price per ${unit === 'kg' ? 'kg' : 'litre'} (₦)`} value={price} onChange={setPrice} step="5"
            hint="Enter today's price at your station. 900 is only an example." />
          {mode === 'naira-to-litres' && <Field id="fl-amt" label="Amount (₦)" value={amount} onChange={setAmount} step="500" />}
          {mode === 'litres-to-naira' && <Field id="fl-lit" label={`Amount (${unit})`} value={litres} onChange={setLitres} step="1" />}
          {mode === 'tank' && (
            <>
              <Field id="fl-tank" label="Tank size (litres)" value={tank} onChange={setTank} />
              <Field id="fl-level" label="Tank level now (%)" value={level} onChange={setLevel} />
            </>
          )}
        </div>
        {r && (
          <div className="grid grid-cols-1">
            <Stat label={r.mainLabel} value={r.money ? fmt(r.main) : r.main.toFixed(2)} tone="good" />
            <p className="text-sm text-gray-600 mt-2">{r.sub}</p>
          </div>
        )}
      </Card>

      {p > 0 && (
        <Card title={`Quick table at ${fmt(p)} per ${unit === 'kg' ? 'kg' : 'litre'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <table className="w-full text-sm text-left">
              <thead><tr className="text-gray-500 border-b"><th className="py-2">Money</th><th className="py-2 text-right">{unit}</th></tr></thead>
              <tbody>{presets.map((x) => (<tr key={x.a} className="border-b border-gray-100"><td className="py-2">{fmt(x.a)}</td><td className="py-2 text-right">{x.l.toFixed(2)}</td></tr>))}</tbody>
            </table>
            <table className="w-full text-sm text-left">
              <thead><tr className="text-gray-500 border-b"><th className="py-2">{unit}</th><th className="py-2 text-right">Cost</th></tr></thead>
              <tbody>{litrePresets.map((x) => (<tr key={x.l} className="border-b border-gray-100"><td className="py-2">{x.l}</td><td className="py-2 text-right">{fmt(x.a)}</td></tr>))}</tbody>
            </table>
          </div>
          <Note>Fuel prices change often and differ by station and state. Enter the price you actually pay.</Note>
        </Card>
      )}
    </div>
  );
}
