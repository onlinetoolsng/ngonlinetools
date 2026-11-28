'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Maternity leave and pay calculator (Kenya, Nigeria, Ghana).
 * Kenya: Employment Act 2007 s.29, 3 months (90 calendar days) full pay.
 * Nigeria: Labour Act s.54, 12 weeks, at least 50% pay (federal civil service 16 weeks full pay).
 * Ghana: Labour Act 2003 s.57, 12 weeks full pay, plus 2 weeks for caesarean, abnormal birth or twins or more.
 */

type Country = 'kenya' | 'nigeria' | 'ghana';
const RULES: Record<Country, { label: string; cur: string; days: number; pay: number; startBefore: number; note: string }> = {
  kenya: { label: 'Kenya', cur: 'KES ', days: 90, pay: 100, startBefore: 14, note: 'Three months (90 calendar days) with full pay. Give your employer at least 7 days\' written notice, or as soon as is reasonable.' },
  nigeria: { label: 'Nigeria', cur: '₦', days: 84, pay: 50, startBefore: 42, note: '12 weeks with at least 50% pay under the Labour Act: six weeks before and at least six weeks after delivery. Some employers and the federal civil service (16 weeks, full pay) give more.' },
  ghana: { label: 'Ghana', cur: 'GH₵', days: 84, pay: 100, startBefore: 0, note: '12 weeks with full pay, extended by two weeks for a caesarean, an abnormal birth or twins or more.' },
};

function addDays(iso: string, n: number): Date | null {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + n);
  return d;
}
const toIso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const show = (d: Date | null) => (d ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }) : '-');

export default function MaternityLeavePayCalculator({ locale }: { locale: string }) {
  void locale;
  const [country, setCountry] = useState<Country>('kenya');
  const [due, setDue] = useState('');
  const [start, setStart] = useState('');
  const [salary, setSalary] = useState('100000');
  const [extra, setExtra] = useState(false);
  const [payPct, setPayPct] = useState('');
  const rule = RULES[country];

  const startDate = start || (due ? toIso(addDays(due, -rule.startBefore) as Date) : '');

  const r = useMemo(() => {
    const days = rule.days + (country === 'ghana' && extra ? 14 : 0);
    const s = startDate ? addDays(startDate, 0) : null;
    const end = startDate ? addDays(startDate, days - 1) : null;
    const back = startDate ? addDays(startDate, days) : null;
    const pct = payPct.trim() === '' ? rule.pay : Math.min(100, toNum(payPct, rule.pay));
    const months = days / (365 / 12);
    const total = toNum(salary) * months * (pct / 100);
    const full = toNum(salary) * months;
    return { days, s, end, back, pct, total, full, shortfall: full - total };
  }, [rule, country, extra, startDate, payPct, salary]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="ml-c" label="Country" value={country} onChange={(v) => { setCountry(v as Country); setStart(''); setPayPct(''); }}
            options={Object.entries(RULES).map(([k, v]) => ({ value: k, label: v.label }))} />
          <Field id="ml-sal" label={`Monthly salary (${rule.cur.trim()})`} value={salary} onChange={setSalary} step="1000" />
          <div>
            <label htmlFor="ml-due" className="block text-sm font-medium text-gray-700 mb-1">Expected due date</label>
            <input id="ml-due" type="date" value={due} onChange={(e) => { setDue(e.target.value); setStart(''); }} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="ml-start" className="block text-sm font-medium text-gray-700 mb-1">Leave starts</label>
            <input id="ml-start" type="date" value={startDate} onChange={(e) => setStart(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            <p className="text-xs text-gray-400 mt-1">Filled in from your due date. Change it if your leave starts on another day.</p>
          </div>
          <Field id="ml-pay" label="Your employer's maternity pay (% of salary)" value={payPct} onChange={setPayPct} placeholder={`${rule.pay} by law`} />
        </div>
        {country === 'ghana' && (
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={extra} onChange={(e) => setExtra(e.target.checked)} /> Caesarean, abnormal birth or twins or more (+2 weeks)
          </label>
        )}
        <p className="text-sm text-gray-600">{rule.note}</p>
      </Card>

      {startDate && (
        <Card title="Your leave">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Length" value={`${r.days} days (${(r.days / 7).toFixed(0)} weeks)`} />
            <Stat label="Pay during leave" value={`${r.pct}% of salary`} />
          </div>
          <table className="w-full text-sm text-left">
            <tbody>
              <tr className="border-b"><td className="py-2">Leave starts</td><td className="py-2 text-right">{show(r.s)}</td></tr>
              <tr className="border-b"><td className="py-2">Last day of leave</td><td className="py-2 text-right">{show(r.end)}</td></tr>
              <tr><td className="py-2 font-medium">Back at work on</td><td className="py-2 text-right font-medium">{show(r.back)}</td></tr>
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Maternity pay for the period" value={fmt(r.total, rule.cur)} tone="good" />
            <Stat label="Short of full salary" value={fmt(r.shortfall, rule.cur)} tone={r.shortfall > 0 ? 'bad' : 'good'} />
          </div>
          <Note>Leave is counted in calendar days, so it includes weekends and public holidays. Contracts, collective agreements and state or civil-service rules can give more than the legal minimum. Ghana&apos;s proposed move to 14 weeks is not yet law. Estimates only.</Note>
        </Card>
      )}
    </div>
  );
}
