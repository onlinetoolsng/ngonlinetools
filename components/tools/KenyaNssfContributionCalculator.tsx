'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Kenya NSSF contribution calculator (NSSF Act 2013, Year 4 from 1 Feb 2026).
 * Tier I: 6% of pensionable earnings up to the Lower Earnings Limit.
 * Tier II: 6% of earnings above the LEL up to the Upper Earnings Limit.
 * Employer matches the employee contribution.
 */

const YEARS = [
  { label: 'Year 1 (Feb 2023)', lel: 6000, uel: 18000 },
  { label: 'Year 2 (Feb 2024)', lel: 7000, uel: 36000 },
  { label: 'Year 3 (Feb 2025)', lel: 8000, uel: 72000 },
  { label: 'Year 4 (Feb 2026)', lel: 9000, uel: 108000 },
];
const RATE = 0.06;
const kes = (n: number) => fmt(n, 'KES ', 0);

export default function KenyaNssfContributionCalculator({ locale }: { locale: string }) {
  void locale;
  const [gross, setGross] = useState('80000');
  const [yearIdx, setYearIdx] = useState(3);
  const y = YEARS[yearIdx];

  const r = useMemo(() => {
    const g = toNum(gross);
    const tier1 = Math.min(g, y.lel) * RATE;
    const tier2 = Math.max(0, Math.min(g, y.uel) - y.lel) * RATE;
    const emp = tier1 + tier2;
    return { tier1, tier2, emp, total: emp * 2, max: (y.lel + (y.uel - y.lel)) * RATE };
  }, [gross, y]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="ns-g" label="Monthly gross pay (KES)" value={gross} onChange={setGross} step="1000" />
          <div>
            <label htmlFor="ns-y" className="block text-sm font-medium text-gray-700 mb-1">Rate year</label>
            <select id="ns-y" value={yearIdx} onChange={(e) => setYearIdx(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2">
              {YEARS.map((x, i) => <option key={x.label} value={i}>{x.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Your NSSF (employee)" value={kes(r.emp)} tone="good" />
          <Stat label="Employer pays" value={kes(r.emp)} />
          <Stat label="Tier I (you)" value={kes(r.tier1)} />
          <Stat label="Tier II (you)" value={kes(r.tier2)} />
        </div>
        <p className="text-sm text-gray-600">Total going to NSSF for you each month: {kes(r.total)}. The most an employee pays at these limits is {kes(r.max)}.</p>
      </Card>
      <Card title="NSSF limits by year">
        <table className="w-full text-sm text-left">
          <thead><tr className="text-gray-500 border-b"><th className="py-2">Year</th><th className="py-2 text-right">Lower limit</th><th className="py-2 text-right">Upper limit</th><th className="py-2 text-right">Max employee</th></tr></thead>
          <tbody>{YEARS.map((x) => (<tr key={x.label} className="border-b border-gray-100"><td className="py-2">{x.label}</td><td className="py-2 text-right">{x.lel.toLocaleString()}</td><td className="py-2 text-right">{x.uel.toLocaleString()}</td><td className="py-2 text-right">{(x.uel * RATE).toLocaleString()}</td></tr>))}</tbody>
        </table>
        <Note>Rates are 6% for the employee and 6% for the employer. Tier II can be contracted out to an approved private scheme, but at least the Tier I amount still goes to NSSF. Check NSSF notices for any later change.</Note>
      </Card>
    </div>
  );
}
