'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Diyya (blood money) calculator. Classical measures, which scholars
 * differ on: 100 camels, or 1,000 dinars of gold (about 4,250 g), or
 * silver (10,000 dirhams in the Hanafi view, 12,000 in the majority view).
 * Prices are user inputs. This is a calculation aid, not a legal ruling.
 */

const BASES: Record<string, { label: string; unit: string }> = {
  camels: { label: '100 camels', unit: 'camels' },
  gold: { label: '1,000 dinars of gold (about 4,250 g)', unit: 'g gold' },
  silverMajority: { label: '12,000 dirhams of silver (about 35,700 g)', unit: 'g silver' },
  silverHanafi: { label: '10,000 dirhams of silver (about 30,618 g)', unit: 'g silver' },
};

export default function DiyyaAmountCalculator({ locale }: { locale: string }) {
  void locale;
  const [base, setBase] = useState('gold');
  const [camel, setCamel] = useState('1500000');
  const [gold, setGold] = useState('120000');
  const [silver, setSilver] = useState('1000');
  const [share, setShare] = useState('100');

  const r = useMemo(() => {
    const frac = Math.min(100, toNum(share)) / 100;
    const full: Record<string, number> = {
      camels: 100 * toNum(camel),
      gold: 4250 * toNum(gold),
      silverMajority: 35700 * toNum(silver),
      silverHanafi: 30618 * toNum(silver),
    };
    return { full: full[base], due: full[base] * frac, all: full };
  }, [base, camel, gold, silver, share]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="dy-b" label="Basis for the full diyya" value={base} onChange={setBase} options={Object.entries(BASES).map(([k, v]) => ({ value: k, label: v.label }))} />
          <Field id="dy-s" label="Share of the full diyya due (%)" value={share} onChange={setShare} step="5" hint="For example 50 where half the full amount applies" />
          <Field id="dy-c" label="Price of one camel (₦)" value={camel} onChange={setCamel} step="50000" />
          <Field id="dy-g" label="Gold price per gram (₦)" value={gold} onChange={setGold} step="1000" />
          <Field id="dy-sp" label="Silver price per gram (₦)" value={silver} onChange={setSilver} step="50" />
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Full diyya on this basis" value={fmt(r.full)} />
          <Stat label={`Amount due at ${toNum(share)}%`} value={fmt(r.due)} tone="good" />
        </div>
        <table className="w-full text-sm text-left">
          <thead><tr className="text-gray-500 border-b"><th className="py-2">Basis</th><th className="py-2 text-right">Full diyya</th></tr></thead>
          <tbody>{Object.entries(BASES).map(([k, v]) => (<tr key={k} className="border-b border-gray-100"><td className="py-2">{v.label}</td><td className="py-2 text-right">{fmt(r.all[k])}</td></tr>))}</tbody>
        </table>
        <Note>
          Diyya is a matter of Islamic law and, where applicable, the law of the state and the decision of a court. Schools of thought differ on the measures, on the share due for different cases, and
          on who pays and when. This tool only converts classical measures to naira at the prices you enter. It is not a ruling or legal advice, so consult a qualified scholar or lawyer.
        </Note>
      </Card>
    </div>
  );
}
