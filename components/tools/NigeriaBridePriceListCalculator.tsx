'use client';

import { useMemo, useState } from 'react';
import { Card, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Nigeria bride price list and budget builder.
 * Items are commonly requested in each tradition. No prices are asserted:
 * you type the quantity and the price you expect, then the tool totals it.
 * Lists differ by family, town and community.
 */

type Item = { id: string; name: string; qty: string; price: string };
const mk = (names: string[]): Item[] => names.map((n, i) => ({ id: `${n}-${i}`, name: n, qty: '1', price: '' }));

const LISTS: Record<string, { label: string; items: string[] }> = {
  igbo: {
    label: 'Igbo (Igba Nkwu)',
    items: [
      'Bride price (isi ego)',
      'Wine for the umunna (kinsmen)',
      'Kegs of palm wine',
      'Kola nuts and bitter kola',
      'Cartons of drinks (soft drinks, malt, beer)',
      'Hot drinks (schnapps or gin)',
      'Gifts for the bride\'s mother',
      'Gifts for the bride\'s father',
      'Money for the umuada (daughters of the family)',
      'Wrappers for the bride\'s mother and aunts',
      'Yam tubers',
      'Suitcase with clothes for the bride',
    ],
  },
  yoruba: {
    label: 'Yoruba (Engagement)',
    items: [
      'Bride price (owo ori iyawo)',
      'Holy Bible or Quran',
      'Engagement ring',
      'Bags of rice',
      'Tins of palm oil and groundnut oil',
      'Salt, sugar and honey',
      'Dried fish',
      'Kola nuts, bitter kola and alligator pepper',
      'Yam tubers',
      'Cartons of drinks',
      'Fabric (aso ebi) for the bride\'s family',
      'Suitcase with clothes, shoes and bag for the bride',
      'Gifts for the bride\'s parents',
      'Money for the engagement MC (alaga) and the bride\'s friends',
    ],
  },
  hausa: {
    label: 'Hausa (Islamic marriage)',
    items: [
      'Sadaki (mahr), paid to the bride',
      'Lefe items (clothes, shoes, perfume and bags for the bride)',
      'Kola nuts for elders',
      'Gifts for the bride\'s parents',
      'Cash gifts for relatives',
    ],
  },
  custom: { label: 'Start from a blank list', items: [] },
};

export default function NigeriaBridePriceListCalculator({ locale }: { locale: string }) {
  void locale;
  const [tradition, setTradition] = useState('igbo');
  const [items, setItems] = useState<Item[]>(mk(LISTS.igbo.items));
  const [newName, setNewName] = useState('');
  const [copied, setCopied] = useState(false);

  const total = useMemo(() => items.reduce((s, i) => s + toNum(i.qty) * toNum(i.price), 0), [items]);

  const pick = (t: string) => {
    setTradition(t);
    setItems(mk(LISTS[t].items));
  };
  const update = (id: string, patch: Partial<Item>) => setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const add = () => {
    if (!newName.trim()) return;
    setItems([...items, { id: `c-${Date.now()}`, name: newName.trim(), qty: '1', price: '' }]);
    setNewName('');
  };
  const copy = async () => {
    const lines = items.map((i) => `${i.name}: ${toNum(i.qty)} x ${fmt(toNum(i.price))} = ${fmt(toNum(i.qty) * toNum(i.price))}`);
    const text = `${LISTS[tradition].label} list\n${lines.join('\n')}\nTotal: ${fmt(total)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <Select id="bp-trad" label="Tradition" value={tradition} onChange={pick}
          options={Object.entries(LISTS).map(([k, v]) => ({ value: k, label: v.label }))} />
        <p className="text-xs text-gray-500">
          Lists differ by family, town and community. Treat this as a starting point and confirm the final list with the elders on both sides.
        </p>
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="grid grid-cols-12 gap-2 items-center">
              <p className="col-span-12 sm:col-span-6 text-sm text-gray-800">{i.name}</p>
              <input aria-label={`${i.name} quantity`} type="number" min="0" value={i.qty} onChange={(e) => update(i.id, { qty: e.target.value })}
                className="col-span-4 sm:col-span-2 rounded-lg border border-gray-300 px-2 py-1" />
              <input aria-label={`${i.name} unit price in naira`} type="number" min="0" placeholder="₦ each" value={i.price}
                onChange={(e) => update(i.id, { price: e.target.value })} className="col-span-5 sm:col-span-3 rounded-lg border border-gray-300 px-2 py-1" />
              <button type="button" aria-label={`Remove ${i.name}`} onClick={() => setItems(items.filter((x) => x.id !== i.id))}
                className="col-span-3 sm:col-span-1 text-sm text-red-600">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input aria-label="Add an item" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add an item"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2" />
          <button type="button" onClick={add} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white">Add</button>
        </div>
      </Card>

      <Card>
        <Stat label="Estimated total" value={fmt(total)} tone="good" />
        <button type="button" onClick={copy} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">
          {copied ? 'Copied' : 'Copy list and total'}
        </button>
        <Note>No prices are pre-filled. Enter what you expect to pay or have been asked for. Estimates only.</Note>
      </Card>
    </div>
  );
}
