'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Uganda PAYE and NSSF calculator for resident individuals.
 * Bands from 1 July 2026 (Income Tax (Amendment) Act 2026), monthly:
 *   0 to 335,000 nil; 335,000 to 410,000 20%; 410,000 to 485,000 25%;
 *   485,000 to 10,000,000 30%; above 10,000,000 40%.
 * Previous bands (shown for comparison): 235,000 / 335,000 at 10%, 335,000 / 410,000 at 20%,
 * 410,000 to 10,000,000 at 30%, above 10,000,000 at 40%.
 * NSSF: employee 5% and employer 10% of gross pay. NSSF does not reduce PAYE.
 */

type Band = { upTo: number; rate: number };
const NEW_BANDS: Band[] = [
  { upTo: 335_000, rate: 0 }, { upTo: 410_000, rate: 0.2 }, { upTo: 485_000, rate: 0.25 }, { upTo: 10_000_000, rate: 0.3 }, { upTo: Infinity, rate: 0.4 },
];
const OLD_BANDS: Band[] = [
  { upTo: 235_000, rate: 0 }, { upTo: 335_000, rate: 0.1 }, { upTo: 410_000, rate: 0.2 }, { upTo: 10_000_000, rate: 0.3 }, { upTo: Infinity, rate: 0.4 },
];

function tax(bands: Band[], income: number) {
  let lower = 0, t = 0;
  const rows: { band: string; amount: number; rate: number; tax: number }[] = [];
  for (const b of bands) {
    if (income <= lower) break;
    const amt = Math.min(income, b.upTo) - lower;
    if (amt > 0 && b.rate > 0) rows.push({ band: b.upTo === Infinity ? `Above ${lower.toLocaleString()}` : `${lower.toLocaleString()} to ${b.upTo.toLocaleString()}`, amount: amt, rate: b.rate, tax: amt * b.rate });
    t += amt * b.rate;
    lower = b.upTo;
  }
  return { total: t, rows };
}

export default function UgandaPayeNssfCalculator({ locale }: { locale: string }) {
  void locale;
  const [gross, setGross] = useState('2000000');
  const [lst, setLst] = useState('0');
  const [nssf, setNssf] = useState(true);

  const r = useMemo(() => {
    const g = toNum(gross);
    const n = tax(NEW_BANDS, g);
    const o = tax(OLD_BANDS, g);
    const employeeNssf = nssf ? g * 0.05 : 0;
    const lstMonthly = toNum(lst) / 12;
    return { n, o, employeeNssf, employerNssf: nssf ? g * 0.1 : 0, lstMonthly, net: g - n.total - employeeNssf - lstMonthly, saving: o.total - n.total };
  }, [gross, lst, nssf]);

  const u = (x: number) => fmt(x, 'UGX ', 0);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="ug-g" label="Monthly gross pay (UGX)" value={gross} onChange={setGross} step="50000" />
          <Field id="ug-l" label="Local service tax per year (UGX), optional" value={lst} onChange={setLst} step="5000" hint="Set by your local council" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={nssf} onChange={(e) => setNssf(e.target.checked)} /> Include NSSF (5% employee, 10% employer)</label>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Net pay" value={u(r.net)} tone="good" />
          <Stat label="PAYE" value={u(r.n.total)} />
          <Stat label="NSSF (employee 5%)" value={u(r.employeeNssf)} />
          <Stat label="Employer NSSF (10%)" value={u(r.employerNssf)} />
        </div>
        <p className="text-sm text-gray-600">Compared with the rates before 1 July 2026, you pay {u(Math.max(0, r.saving))} {r.saving >= 0 ? 'less' : 'more'} PAYE a month.</p>
      </Card>
      <Card title="How PAYE is worked out (resident, monthly)">
        <table className="w-full text-sm text-left">
          <thead><tr className="text-gray-500 border-b"><th className="py-2">Band (UGX)</th><th className="py-2 text-right">Amount</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Tax</th></tr></thead>
          <tbody>
            {r.n.rows.length === 0 && <tr><td className="py-2" colSpan={4}>Nothing is taxed: pay up to UGX 335,000 a month is exempt.</td></tr>}
            {r.n.rows.map((x) => (<tr key={x.band} className="border-b border-gray-100"><td className="py-2">{x.band}</td><td className="py-2 text-right">{x.amount.toLocaleString()}</td><td className="py-2 text-right">{(x.rate * 100).toFixed(0)}%</td><td className="py-2 text-right">{Math.round(x.tax).toLocaleString()}</td></tr>))}
          </tbody>
        </table>
        <Note>
          Rates for resident individuals effective 1 July 2026: nil up to UGX 335,000, 20% to 410,000, 25% to 485,000, 30% to 10,000,000 and 40% above. NSSF is 5% of gross pay from the employee and 10% from the employer, and does not reduce PAYE.
          Non-residents are taxed on different bands. Estimates only: check the URA for the latest rules.
        </Note>
      </Card>
    </div>
  );
}
