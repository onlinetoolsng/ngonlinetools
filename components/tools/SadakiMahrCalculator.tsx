'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Sadaki / mahr calculator. The minimum mahr differs between schools of
 * thought, and some schools set none. The metal prices are user inputs.
 *  Hanafi: 10 dirhams of silver (about 30.618 g)
 *  Maliki: 3 dirhams of silver (about 8.925 g) or a quarter dinar of gold (about 1.0625 g)
 *  Shafi'i and Hanbali: no fixed minimum
 */

const SCHOOLS: Record<string, { label: string; silverG: number; goldG: number; note: string }> = {
  hanafi: { label: 'Hanafi', silverG: 30.618, goldG: 0, note: 'Minimum of 10 dirhams of silver (about 30.6 g).' },
  maliki: { label: 'Maliki', silverG: 8.925, goldG: 1.0625, note: 'Minimum of 3 dirhams of silver (about 8.9 g) or a quarter dinar of gold (about 1.06 g).' },
  shafii: { label: "Shafi'i", silverG: 0, goldG: 0, note: 'No fixed minimum. Mahr is whatever is agreed, and it must be of value.' },
  hanbali: { label: 'Hanbali', silverG: 0, goldG: 0, note: 'No fixed minimum. Mahr is whatever is agreed, and it must be of value.' },
};

export default function SadakiMahrCalculator({ locale }: { locale: string }) {
  void locale;
  const [school, setSchool] = useState('hanafi');
  const [silver, setSilver] = useState('1000');
  const [gold, setGold] = useState('120000');
  const [agreed, setAgreed] = useState('100000');
  const [prompt, setPrompt] = useState('50');
  const s = SCHOOLS[school];

  const r = useMemo(() => {
    const silverMin = s.silverG * toNum(silver);
    const goldMin = s.goldG * toNum(gold);
    const min = s.silverG && s.goldG ? Math.min(silverMin, goldMin) : silverMin || goldMin;
    const a = toNum(agreed);
    const promptAmt = a * (Math.min(100, toNum(prompt)) / 100);
    return { silverMin, goldMin, min, a, ok: min === 0 || a >= min, promptAmt, deferred: a - promptAmt };
  }, [s, silver, gold, agreed, prompt]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="sm-s" label="School of thought" value={school} onChange={setSchool} options={Object.entries(SCHOOLS).map(([k, v]) => ({ value: k, label: v.label }))} />
          <Field id="sm-a" label="Mahr you have agreed (₦)" value={agreed} onChange={setAgreed} step="10000" />
          <Field id="sm-sp" label="Silver price per gram (₦)" value={silver} onChange={setSilver} step="50" hint="Use today's market price" />
          <Field id="sm-gp" label="Gold price per gram (₦)" value={gold} onChange={setGold} step="1000" hint="Use today's market price" />
          <Field id="sm-p" label="Share paid at the wedding (%)" value={prompt} onChange={setPrompt} step="5" hint="The rest is deferred" />
        </div>
        <p className="text-sm text-gray-600">{s.note}</p>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Minimum mahr (this school)" value={r.min > 0 ? fmt(r.min) : 'No fixed minimum'} tone="good" />
          <Stat label="Your agreed mahr" value={fmt(r.a)} tone={r.ok ? 'good' : 'bad'} />
          <Stat label="Paid at the wedding" value={fmt(r.promptAmt)} />
          <Stat label="Deferred" value={fmt(r.deferred)} />
        </div>
        {!r.ok && <p className="text-sm text-red-700">The agreed amount is below the minimum for this school.</p>}
        <Note>
          Scholars differ on the minimum mahr and on how to convert silver and gold weights, and the figures here are common values, not a ruling. The mahr belongs to the bride. Ask a qualified scholar
          about your own situation. Enter current local metal prices, which change daily.
        </Note>
      </Card>
    </div>
  );
}
