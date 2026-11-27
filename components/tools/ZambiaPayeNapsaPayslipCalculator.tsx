'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Zambia PAYE, NAPSA and NHIMA payslip calculator (2026).
 * Bands: ZRA monthly bands (K5,100 / K7,100 / K9,200 at 0 / 20 / 30 / 37%).
 * NAPSA: 5% of gross, earnings ceiling K37,236/month (max K1,861.80), from 1 Jan 2026.
 * NHIMA: 1% of basic salary, no cap.
 */

const BANDS = [
  { upTo: 5100, rate: 0 },
  { upTo: 7100, rate: 0.2 },
  { upTo: 9200, rate: 0.3 },
  { upTo: Infinity, rate: 0.37 },
];
const NAPSA_RATE = 0.05;
const NAPSA_CEILING = 37236;
const NHIMA_RATE = 0.01;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function paye(taxable: number) {
  let rem = Math.max(0, taxable), lower = 0, tax = 0;
  const rows: { band: string; amount: number; rate: number; tax: number }[] = [];
  for (const b of BANDS) {
    if (rem <= 0) break;
    const inBand = Math.min(rem, b.upTo - lower);
    if (inBand > 0) {
      rows.push({
        band: b.upTo === Infinity ? `Above K${lower.toLocaleString()}` : `K${lower.toLocaleString()} – K${b.upTo.toLocaleString()}`,
        amount: inBand, rate: b.rate, tax: inBand * b.rate,
      });
      tax += inBand * b.rate;
    }
    rem -= inBand; lower = b.upTo;
  }
  return { tax, rows };
}

export default function ZambiaPayeNapsaPayslipCalculator({ locale }: { locale: string }) {
  void locale;
  const now = new Date();
  const [gross, setGross] = useState('10000');
  const [basic, setBasic] = useState('');
  const [month, setMonth] = useState(String(now.getMonth()));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [napsaDeductible, setNapsaDeductible] = useState(false);

  const r = useMemo(() => {
    const g = toNum(gross);
    const b = basic.trim() === '' ? g : Math.min(toNum(basic), g);
    const napsa = Math.min(g, NAPSA_CEILING) * NAPSA_RATE;
    const nhima = b * NHIMA_RATE;
    const taxable = napsaDeductible ? Math.max(0, g - napsa) : g;
    const p = paye(taxable);
    const net = g - p.tax - napsa - nhima;
    return { g, napsa, nhima, taxable, p, net, employerNapsa: napsa, employerNhima: nhima };
  }, [gross, basic, napsaDeductible]);

  const k = (n: number) => fmt(n, 'K', 2);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="zm-gross" label="Gross monthly pay (K)" value={gross} onChange={setGross} step="100" />
          <Field id="zm-basic" label="Basic salary (K), optional" value={basic} onChange={setBasic} step="100"
            hint="NHIMA is 1% of basic. Leave blank to use gross." />
          <Select id="zm-month" label="Payslip month" value={month} onChange={setMonth}
            options={MONTHS.map((m, i) => ({ value: String(i), label: m }))} />
          <Field id="zm-year" label="Year" value={year} onChange={setYear} step="1" min="2020" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={napsaDeductible} onChange={(e) => setNapsaDeductible(e.target.checked)} />
          Treat NAPSA as deductible before PAYE (off by default)
        </label>
      </Card>

      <Card title={`Payslip: ${MONTHS[Number(month)]} ${year}`}>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Net pay" value={k(r.net)} tone="good" />
          <Stat label="PAYE" value={k(r.p.tax)} />
          <Stat label="NAPSA (employee 5%)" value={k(r.napsa)} />
          <Stat label="NHIMA (employee 1%)" value={k(r.nhima)} />
        </div>
        <table className="w-full text-sm text-left">
          <tbody>
            <tr className="border-b"><td className="py-2">Gross pay</td><td className="py-2 text-right">{k(r.g)}</td></tr>
            <tr className="border-b"><td className="py-2">PAYE</td><td className="py-2 text-right">-{k(r.p.tax)}</td></tr>
            <tr className="border-b"><td className="py-2">NAPSA</td><td className="py-2 text-right">-{k(r.napsa)}</td></tr>
            <tr className="border-b"><td className="py-2">NHIMA</td><td className="py-2 text-right">-{k(r.nhima)}</td></tr>
            <tr><td className="py-2 font-semibold">Net pay</td><td className="py-2 text-right font-semibold">{k(r.net)}</td></tr>
          </tbody>
        </table>
        <p className="text-sm text-gray-600">
          Employer also pays NAPSA {k(r.employerNapsa)} and NHIMA {k(r.employerNhima)} on top of gross pay.
        </p>
      </Card>

      <Card title="How PAYE is worked out">
        <table className="w-full text-sm text-left">
          <thead><tr className="text-gray-500 border-b"><th className="py-2">Band</th><th className="py-2">Amount</th><th className="py-2">Rate</th><th className="py-2 text-right">Tax</th></tr></thead>
          <tbody>
            {r.p.rows.map((x) => (
              <tr key={x.band} className="border-b border-gray-100">
                <td className="py-2">{x.band}</td><td className="py-2">{k(x.amount)}</td>
                <td className="py-2">{(x.rate * 100).toFixed(0)}%</td><td className="py-2 text-right">{k(x.tax)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>
          Based on the 2026 ZRA monthly bands (0% to K5,100, 20% to K7,100, 30% to K9,200, 37% above), NAPSA at 5% up to a
          K37,236 monthly earnings ceiling, and NHIMA at 1% of basic pay. Rates change with the budget, and the 2027 budget
          proposals are not yet law. Estimates only. Follow your payroll provider and ZRA for official figures.
        </Note>
      </Card>
    </div>
  );
}
