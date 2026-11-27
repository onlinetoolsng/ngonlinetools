'use client';

import { useMemo, useState } from 'react';
import { Card, Stat, Note, toNum, fmt } from './shared/ui';
import { ngPayeOnAnnual } from '@/lib/calculators/ngPaye';

/**
 * Multi-state PAYE remittance allocator for employers.
 * Computes monthly PAYE per employee (Nigeria Tax Act 2025 bands, 8% pension)
 * and totals it by the state each employee is resident in.
 */

const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

type Emp = { id: string; name: string; gross: string; pensionable: string; state: string };

export default function NigeriaMultiStatePayeAllocator({ locale }: { locale: string }) {
  void locale;
  const [emps, setEmps] = useState<Emp[]>([
    { id: '1', name: 'Employee 1', gross: '500000', pensionable: '350000', state: 'Lagos' },
    { id: '2', name: 'Employee 2', gross: '800000', pensionable: '560000', state: 'Ogun' },
    { id: '3', name: 'Employee 3', gross: '350000', pensionable: '245000', state: 'FCT' },
  ]);

  const r = useMemo(() => {
    const rows = emps.map((e) => {
      const annualGross = toNum(e.gross) * 12;
      const pension = toNum(e.pensionable) * 12 * 0.08;
      const paye = ngPayeOnAnnual(Math.max(0, annualGross - pension)) / 12;
      return { ...e, paye };
    });
    const byState: Record<string, { paye: number; n: number }> = {};
    rows.forEach((x) => { byState[x.state] = { paye: (byState[x.state]?.paye ?? 0) + x.paye, n: (byState[x.state]?.n ?? 0) + 1 }; });
    return { rows, byState, total: rows.reduce((s, x) => s + x.paye, 0) };
  }, [emps]);

  const upd = (id: string, patch: Partial<Emp>) => setEmps(emps.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const cell = 'rounded-lg border border-gray-300 px-2 py-1 w-full';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card title="Employees (monthly figures)">
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-gray-500">
          <span className="col-span-3">Name</span><span className="col-span-3">Gross pay (₦)</span><span className="col-span-3">Pensionable pay (₦)</span><span className="col-span-2">State of residence</span>
        </div>
        {emps.map((e) => (
          <div key={e.id} className="grid grid-cols-12 gap-2 items-center">
            <input aria-label="Name" className={`${cell} col-span-12 sm:col-span-3`} value={e.name} onChange={(ev) => upd(e.id, { name: ev.target.value })} />
            <input aria-label="Gross pay" type="number" min="0" className={`${cell} col-span-6 sm:col-span-3`} value={e.gross} onChange={(ev) => upd(e.id, { gross: ev.target.value })} />
            <input aria-label="Pensionable pay" type="number" min="0" className={`${cell} col-span-6 sm:col-span-3`} value={e.pensionable} onChange={(ev) => upd(e.id, { pensionable: ev.target.value })} />
            <select aria-label="State" className={`${cell} col-span-8 sm:col-span-2`} value={e.state} onChange={(ev) => upd(e.id, { state: ev.target.value })}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button type="button" onClick={() => setEmps(emps.filter((x) => x.id !== e.id))} className="col-span-4 sm:col-span-1 text-sm text-red-600">Remove</button>
          </div>
        ))}
        <button type="button" onClick={() => setEmps([...emps, { id: String(Date.now()), name: `Employee ${emps.length + 1}`, gross: '', pensionable: '', state: 'Lagos' }])}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm">Add employee</button>
      </Card>

      <Card title="PAYE by state">
        <Stat label="Total monthly PAYE" value={fmt(r.total)} tone="good" />
        <table className="w-full text-sm text-left">
          <thead><tr className="text-gray-500 border-b"><th className="py-2">State</th><th className="py-2 text-right">Employees</th><th className="py-2 text-right">PAYE to remit</th></tr></thead>
          <tbody>
            {Object.entries(r.byState).sort((a, b) => b[1].paye - a[1].paye).map(([s, v]) => (
              <tr key={s} className="border-b border-gray-100"><td className="py-2">{s === 'FCT' ? 'FCT (Abuja)' : s}</td><td className="py-2 text-right">{v.n}</td><td className="py-2 text-right">{fmt(v.paye)}</td></tr>
            ))}
          </tbody>
        </table>
        <table className="w-full text-sm text-left">
          <thead><tr className="text-gray-500 border-b"><th className="py-2">Employee</th><th className="py-2">State</th><th className="py-2 text-right">PAYE</th></tr></thead>
          <tbody>{r.rows.map((x) => (<tr key={x.id} className="border-b border-gray-100"><td className="py-2">{x.name}</td><td className="py-2">{x.state}</td><td className="py-2 text-right">{fmt(x.paye)}</td></tr>))}</tbody>
        </table>
        <Note>
          PAYE is generally remitted to the tax authority of the state where the employee is resident, not where the office is. Confirm each employee&apos;s
          state of residence and the current rules with the relevant state internal revenue service. Uses Nigeria Tax Act 2025 bands with 8% employee pension and no other reliefs. Estimates only.
        </Note>
      </Card>
    </div>
  );
}
