'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

type Mode = 'price-from-margin' | 'price-from-markup' | 'from-prices';

export default function ProfitMarginMarkupCalculator({ locale }: { locale: string }) {
  void locale;
  const [mode, setMode] = useState<Mode>('price-from-margin');
  const [cost, setCost] = useState('5000');
  const [margin, setMargin] = useState('25');
  const [markup, setMarkup] = useState('30');
  const [sell, setSell] = useState('6500');
  const [qty, setQty] = useState('1');

  const r = useMemo(() => {
    const c = toNum(cost);
    let price = 0;
    if (mode === 'price-from-margin') { const m = Math.min(99.99, toNum(margin)) / 100; price = c / (1 - m); }
    else if (mode === 'price-from-markup') price = c * (1 + toNum(markup) / 100);
    else price = toNum(sell);
    const profit = price - c;
    return { price, profit, marginPct: price > 0 ? (profit / price) * 100 : 0, markupPct: c > 0 ? (profit / c) * 100 : 0, q: Math.max(1, toNum(qty, 1)) };
  }, [mode, cost, margin, markup, sell, qty]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <Select id="pm-mode" label="What do you know?" value={mode} onChange={(v) => setMode(v as Mode)}
          options={[
            { value: 'price-from-margin', label: 'Cost and the profit margin I want' },
            { value: 'price-from-markup', label: 'Cost and the markup I want' },
            { value: 'from-prices', label: 'Cost and selling price' },
          ]} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field id="pm-cost" label="Cost per unit (₦)" value={cost} onChange={setCost} step="100" />
          {mode === 'price-from-margin' && <Field id="pm-margin" label="Margin (% of selling price)" value={margin} onChange={setMargin} />}
          {mode === 'price-from-markup' && <Field id="pm-markup" label="Markup (% of cost)" value={markup} onChange={setMarkup} />}
          {mode === 'from-prices' && <Field id="pm-sell" label="Selling price (₦)" value={sell} onChange={setSell} step="100" />}
          <Field id="pm-qty" label="Units" value={qty} onChange={setQty} />
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Selling price per unit" value={fmt(r.price, '₦', 2)} tone="good" />
          <Stat label="Profit per unit" value={fmt(r.profit, '₦', 2)} tone={r.profit >= 0 ? 'good' : 'bad'} />
          <Stat label="Profit margin" value={`${r.marginPct.toFixed(2)}%`} />
          <Stat label="Markup" value={`${r.markupPct.toFixed(2)}%`} />
          <Stat label={`Revenue for ${r.q} units`} value={fmt(r.price * r.q)} />
          <Stat label={`Profit for ${r.q} units`} value={fmt(r.profit * r.q)} />
        </div>
        <Note>Margin is profit as a share of the selling price. Markup is profit as a share of cost. A 25% margin equals a 33.3% markup. Figures exclude VAT, overheads and tax.</Note>
      </Card>
    </div>
  );
}
