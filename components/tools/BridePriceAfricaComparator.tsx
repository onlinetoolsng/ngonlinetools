'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Bride price terms across Africa and a budget converter.
 * The term guide is descriptive. No typical amounts are asserted. Exchange
 * rates come from open.er-api.com (the same free source other tools use) and
 * fall back to manual entry if the request fails.
 */

const TERMS = [
  { term: 'Lobola (or lobolo)', where: 'South Africa, Zimbabwe, Lesotho, Eswatini and other Southern African communities', note: 'Traditionally paid in cattle, now often in cash or a mix. Negotiated between the two families.' },
  { term: 'Ruracio', where: 'Kikuyu communities in Kenya', note: 'Often called dowry in Kenyan English. Paid by the groom\'s family and agreed in stages.' },
  { term: 'Mahari', where: 'Swahili-speaking communities in Tanzania and coastal Kenya', note: 'The word is also used for the Islamic mahr paid to the bride.' },
  { term: 'Bride price or bridewealth', where: 'Many communities across West, East and Central Africa', note: 'A general term for payments and gifts from the groom\'s family to the bride\'s family.' },
  { term: 'Dowry', where: 'South Asia and parts of Europe historically', note: 'Normally goods or money given by the bride\'s family to the couple. In Africa the word is often used loosely for bride price.' },
];

const CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR', 'TZS', 'UGX', 'USD'] as const;
type Cur = (typeof CURRENCIES)[number];

export default function BridePriceAfricaComparator({ locale }: { locale: string }) {
  void locale;
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [failed, setFailed] = useState(false);
  const [from, setFrom] = useState<Cur>('ZAR');
  const [cattle, setCattle] = useState('11');
  const [cattlePrice, setCattlePrice] = useState('15000');
  const [cash, setCash] = useState('0');
  const [manual, setManual] = useState<Record<string, string>>({});

  useEffect(() => {
    const ctl = new AbortController();
    fetch('https://open.er-api.com/v6/latest/USD', { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => (d?.rates ? setRates(d.rates) : setFailed(true)))
      .catch((e) => { if (e?.name !== 'AbortError') setFailed(true); });
    return () => ctl.abort();
  }, []);

  const total = toNum(cattle) * toNum(cattlePrice) + toNum(cash);

  const converted = useMemo(() => {
    const rate = (c: Cur) => (rates ? rates[c] : toNum(manual[c] ?? '', 0));
    const rf = rate(from);
    return CURRENCIES.map((c) => {
      const rt = rate(c);
      return { c, value: rf > 0 && rt > 0 ? (total / rf) * rt : null };
    });
  }, [rates, manual, from, total]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card title="What the terms mean">
        <div className="space-y-3">
          {TERMS.map((t) => (
            <div key={t.term} className="text-sm text-gray-700">
              <p className="font-semibold text-gray-900">{t.term}</p>
              <p>{t.where}</p>
              <p className="text-gray-600">{t.note}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Compare a budget across currencies">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="bpa-cur" label="Currency you are pricing in" value={from} onChange={(v) => setFrom(v as Cur)}
            options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
          <Field id="bpa-cattle" label="Number of cattle" value={cattle} onChange={setCattle} />
          <Field id="bpa-price" label={`Price per cow (${from})`} value={cattlePrice} onChange={setCattlePrice} step="500" hint="Enter a local quote" />
          <Field id="bpa-cash" label={`Cash and gifts (${from})`} value={cash} onChange={setCash} step="500" />
        </div>
        <Stat label={`Total in ${from}`} value={fmt(total, '', 0)} tone="good" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {converted.filter((x) => x.c !== from).map((x) => (
            <div key={x.c} className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="text-gray-500">{x.c}</p>
              <p className="font-semibold text-gray-900">{x.value === null ? 'n/a' : fmt(x.value, '', 0)}</p>
            </div>
          ))}
        </div>
        {failed && (
          <div className="space-y-2">
            <p className="text-sm text-amber-700">Live rates did not load. Enter how many units of each currency equal 1 USD.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CURRENCIES.map((c) => (
                <Field key={c} id={`bpa-r-${c}`} label={`${c} per 1 USD`} value={manual[c] ?? (c === 'USD' ? '1' : '')}
                  onChange={(v) => setManual({ ...manual, [c]: v })} step="0.01" />
              ))}
            </div>
          </div>
        )}
        <Note>Rates are mid-market and exclude transfer fees. Bride price is a family agreement and no amount here is a norm or a recommendation.</Note>
      </Card>
    </div>
  );
}
