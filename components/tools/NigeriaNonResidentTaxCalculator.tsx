'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';
import { ngPayeOnAnnual } from '@/lib/calculators/ngPaye';

/**
 * Nigerian tax residency check and indicative tax (Nigeria Tax Act 2025).
 * A person is resident if domiciled in Nigeria, or has a permanent home,
 * significant economic or family ties, or spends 183 days or more in Nigeria
 * in a 12-month period. Residents are taxed on worldwide income; non-residents
 * on Nigerian-source income. Indicative tax uses the 2026 personal bands.
 */

export default function NigeriaNonResidentTaxCalculator({ locale }: { locale: string }) {
  void locale;
  const [days, setDays] = useState('90');
  const [home, setHome] = useState(false);
  const [domicile, setDomicile] = useState(false);
  const [ties, setTies] = useState(false);
  const [ngIncome, setNgIncome] = useState('8000000');
  const [foreignIncome, setForeignIncome] = useState('12000000');

  const r = useMemo(() => {
    const d = toNum(days);
    const reasons: string[] = [];
    if (d >= 183) reasons.push('You spent 183 days or more in Nigeria');
    if (domicile) reasons.push('You are domiciled in Nigeria');
    if (home) reasons.push('You keep a permanent home in Nigeria');
    if (ties) reasons.push('You have significant economic or immediate family ties to Nigeria');
    const resident = reasons.length > 0;
    const ng = toNum(ngIncome);
    const fo = toNum(foreignIncome);
    const base = resident ? ng + fo : ng;
    return { resident, reasons, base, tax: ngPayeOnAnnual(base), taxIfNon: ngPayeOnAnnual(ng), taxIfRes: ngPayeOnAnnual(ng + fo) };
  }, [days, home, domicile, ties, ngIncome, foreignIncome]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card title="Residency test">
        <Field id="nr-d" label="Days in Nigeria in the last 12 months" value={days} onChange={setDays} />
        {[['nr-dom', 'I am domiciled in Nigeria', domicile, setDomicile], ['nr-home', 'I keep a permanent home in Nigeria', home, setHome], ['nr-ties', 'I have significant economic or immediate family ties to Nigeria', ties, setTies]].map(([id, label, val, set]) => (
          <label key={id as string} className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={val as boolean} onChange={(e) => (set as (v: boolean) => void)(e.target.checked)} /> {label as string}
          </label>
        ))}
        <div className={`rounded-lg p-4 text-sm ${r.resident ? 'bg-amber-50 text-amber-900' : 'bg-green-50 text-green-900'}`}>
          <p className="font-semibold">{r.resident ? 'You are likely a Nigerian tax resident.' : 'You are likely a non-resident.'}</p>
          {r.reasons.map((x) => <p key={x}>{x}</p>)}
        </div>
      </Card>
      <Card title="Indicative annual tax (₦)">
        <div className="grid grid-cols-2 gap-4">
          <Field id="nr-ng" label="Nigerian-source income" value={ngIncome} onChange={setNgIncome} step="100000" />
          <Field id="nr-fo" label="Foreign income" value={foreignIncome} onChange={setForeignIncome} step="100000" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Income taxed" value={fmt(r.base)} />
          <Stat label="Indicative tax" value={fmt(r.tax)} tone="bad" />
          <Stat label="If non-resident" value={fmt(r.taxIfNon)} />
          <Stat label="If resident (worldwide income)" value={fmt(r.taxIfRes)} />
        </div>
        <Note>
          The Nigeria Tax Act 2025 taxes residents on worldwide income and non-residents on Nigerian-source income. This tool applies the 2026 personal tax
          bands with no reliefs, credits or tax treaty effects, and the residency rules have more detail than shown. Treat it as a first indication and ask a
          tax adviser.
        </Note>
      </Card>
    </div>
  );
}
