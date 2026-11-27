'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Currency converter with a transfer-cost estimate. Rates come from
 * open.er-api.com (mid-market, updated about daily) with a manual fallback.
 */

const CURRENCIES = ['USD', 'NGN', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR', 'CAD', 'AED', 'CNY', 'XOF'];

export default function UsdNgnCurrencyConverter({ locale }: { locale: string }) {
  void locale;
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [updated, setUpdated] = useState('');
  const [failed, setFailed] = useState(false);
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('NGN');
  const [amount, setAmount] = useState('100');
  const [manual, setManual] = useState('');
  const [feePct, setFeePct] = useState('0');
  const [spreadPct, setSpreadPct] = useState('0');

  useEffect(() => {
    const ctl = new AbortController();
    fetch('https://open.er-api.com/v6/latest/USD', { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates) { setRates(d.rates); setUpdated(d.time_last_update_utc ?? ''); } else setFailed(true);
      })
      .catch((e) => { if (e?.name !== 'AbortError') setFailed(true); });
    return () => ctl.abort();
  }, []);

  const r = useMemo(() => {
    let rate = 0;
    if (rates && rates[from] && rates[to]) rate = rates[to] / rates[from];
    else if (toNum(manual) > 0) rate = toNum(manual);
    const gross = toNum(amount) * rate;
    const fee = toNum(amount) * (toNum(feePct) / 100);
    const net = (toNum(amount) - fee) * rate * (1 - toNum(spreadPct) / 100);
    return { rate, gross, net, lost: gross - net };
  }, [rates, from, to, amount, manual, feePct, spreadPct]);

  const opts = CURRENCIES.map((c) => ({ value: c, label: c }));

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field id="cc-amt" label="Amount" value={amount} onChange={setAmount} step="10" />
          <Select id="cc-from" label="From" value={from} onChange={setFrom} options={opts} />
          <Select id="cc-to" label="To" value={to} onChange={setTo} options={opts} />
        </div>
        <button type="button" onClick={() => { setFrom(to); setTo(from); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Swap</button>
        {failed && !rates && (
          <Field id="cc-man" label={`Rate: 1 ${from} = how many ${to}?`} value={manual} onChange={setManual} step="0.01" hint="Live rates did not load. Enter a rate manually." />
        )}
        {r.rate > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label={`${amount || 0} ${from} equals`} value={`${fmt(r.gross, '', 2)} ${to}`} tone="good" />
            <Stat label="Rate" value={`1 ${from} = ${r.rate.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${to}`} />
          </div>
        )}
        {updated && <p className="text-xs text-gray-400">Rates last updated {updated}.</p>}
      </Card>

      <Card title="Cost of sending money (optional)">
        <div className="grid grid-cols-2 gap-4">
          <Field id="cc-fee" label="Transfer fee (% of amount)" value={feePct} onChange={setFeePct} step="0.1" />
          <Field id="cc-spr" label="Provider's exchange-rate margin (%)" value={spreadPct} onChange={setSpreadPct} step="0.1" />
        </div>
        {r.rate > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Recipient gets" value={`${fmt(r.net, '', 2)} ${to}`} tone="good" />
            <Stat label="Lost to fees and margin" value={`${fmt(r.lost, '', 2)} ${to}`} tone="bad" />
          </div>
        )}
        <Note>Rates are mid-market and for information. Banks, bureaux de change and transfer apps use their own rates, so the rate you get can differ, particularly on parallel or street markets.</Note>
      </Card>
    </div>
  );
}
