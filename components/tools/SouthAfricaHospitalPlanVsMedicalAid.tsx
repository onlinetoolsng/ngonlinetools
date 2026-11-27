'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Hospital plan vs medical aid comparer (South Africa).
 * You enter the premiums and benefits from the quotes you have. The tool adds
 * premiums to the out-of-pocket costs you expect and compares the totals.
 * No premium or benefit is pre-filled as a market figure.
 */

const R = (n: number) => fmt(n, 'R');

type Plan = { premium: string; dayToDayLimit: string; coPay: string; hospitalCoverPct: string; hospitalCap: string };

export default function SouthAfricaHospitalPlanVsMedicalAid({ locale }: { locale: string }) {
  void locale;
  // Scenario
  const [gpVisits, setGpVisits] = useState('4');
  const [gpCost, setGpCost] = useState('600');
  const [meds, setMeds] = useState('250');
  const [admits, setAdmits] = useState('0.3');
  const [admitCost, setAdmitCost] = useState('60000');
  const [mtc, setMtc] = useState('0');
  // Plans
  const [a, setA] = useState<Plan>({ premium: '900', dayToDayLimit: '0', coPay: '0', hospitalCoverPct: '100', hospitalCap: '50000' });
  const [b, setB] = useState<Plan>({ premium: '2800', dayToDayLimit: '3000', coPay: '2000', hospitalCoverPct: '100', hospitalCap: '1000000' });

  const calc = (p: Plan, isScheme: boolean) => {
    const premiums = toNum(p.premium) * 12 - (isScheme ? toNum(mtc) * 12 : 0);
    const dayToDay = toNum(gpVisits) * toNum(gpCost) + toNum(meds) * 12;
    const dayOop = Math.max(0, dayToDay - toNum(p.dayToDayLimit));
    const cost = toNum(admitCost);
    const covered = Math.min(cost * (toNum(p.hospitalCoverPct) / 100), toNum(p.hospitalCap));
    const oneAdmitOop = Math.max(0, cost - covered) + toNum(p.coPay);
    const expectedHosp = toNum(admits) * oneAdmitOop;
    return { premiums: Math.max(0, premiums), dayOop, oneAdmitOop, expectedHosp, expected: Math.max(0, premiums) + dayOop + expectedHosp, bad: Math.max(0, premiums) + dayOop + oneAdmitOop };
  };

  const A = useMemo(() => calc(a, false), [a, gpVisits, gpCost, meds, admits, admitCost, mtc]); // eslint-disable-line react-hooks/exhaustive-deps
  const B = useMemo(() => calc(b, true), [b, gpVisits, gpCost, meds, admits, admitCost, mtc]); // eslint-disable-line react-hooks/exhaustive-deps
  const cheaper = A.expected === B.expected ? null : A.expected < B.expected ? 'Hospital plan' : 'Medical aid';

  const planFields = (label: string, p: Plan, set: (p: Plan) => void, id: string) => (
    <Card title={label}>
      <div className="grid grid-cols-2 gap-3">
        <Field id={`${id}-p`} label="Monthly premium (R)" value={p.premium} onChange={(v) => set({ ...p, premium: v })} step="50" />
        <Field id={`${id}-d`} label="Yearly day-to-day benefit (R)" value={p.dayToDayLimit} onChange={(v) => set({ ...p, dayToDayLimit: v })} step="100" />
        <Field id={`${id}-c`} label="Co-payment per admission (R)" value={p.coPay} onChange={(v) => set({ ...p, coPay: v })} step="100" />
        <Field id={`${id}-h`} label="Hospital bill covered (%)" value={p.hospitalCoverPct} onChange={(v) => set({ ...p, hospitalCoverPct: v })} step="5" />
        <Field id={`${id}-x`} label="Most it pays per admission (R)" value={p.hospitalCap} onChange={(v) => set({ ...p, hospitalCap: v })} step="1000" />
      </div>
    </Card>
  );

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <Card title="Your expected year">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field id="hp-gp" label="GP visits a year" value={gpVisits} onChange={setGpVisits} />
          <Field id="hp-gpc" label="Cost per visit (R)" value={gpCost} onChange={setGpCost} step="50" />
          <Field id="hp-med" label="Medicine per month (R)" value={meds} onChange={setMeds} step="50" />
          <Field id="hp-ad" label="Hospital stays a year (e.g. 0.3)" value={admits} onChange={setAdmits} step="0.1" />
          <Field id="hp-adc" label="Cost of one stay (R)" value={admitCost} onChange={setAdmitCost} step="1000" />
          <Field id="hp-mtc" label="Medical tax credit per month (R), medical aid only" value={mtc} onChange={setMtc} step="10" />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {planFields('Hospital plan (insurance)', a, setA, 'a')}
        {planFields('Medical aid (scheme)', b, setB, 'b')}
      </div>

      <Card title="Comparison for the year">
        <table className="w-full text-sm text-left">
          <thead><tr className="text-gray-500 border-b"><th className="py-2"></th><th className="py-2 text-right">Hospital plan</th><th className="py-2 text-right">Medical aid</th></tr></thead>
          <tbody>
            <tr className="border-b"><td className="py-2">Premiums (after any tax credit)</td><td className="py-2 text-right">{R(A.premiums)}</td><td className="py-2 text-right">{R(B.premiums)}</td></tr>
            <tr className="border-b"><td className="py-2">Day-to-day paid by you</td><td className="py-2 text-right">{R(A.dayOop)}</td><td className="py-2 text-right">{R(B.dayOop)}</td></tr>
            <tr className="border-b"><td className="py-2">Hospital cost to you if one stay happens</td><td className="py-2 text-right">{R(A.oneAdmitOop)}</td><td className="py-2 text-right">{R(B.oneAdmitOop)}</td></tr>
            <tr className="border-b"><td className="py-2 font-medium">Expected total for the year</td><td className="py-2 text-right font-medium">{R(A.expected)}</td><td className="py-2 text-right font-medium">{R(B.expected)}</td></tr>
            <tr><td className="py-2 font-medium">Total in a year with one stay</td><td className="py-2 text-right font-medium">{R(A.bad)}</td><td className="py-2 text-right font-medium">{R(B.bad)}</td></tr>
          </tbody>
        </table>
        {cheaper && <Stat label="Lower expected cost" value={cheaper} tone="good" />}
        <Note>
          Medical schemes are regulated under the Medical Schemes Act and must cover the prescribed minimum benefits. Hospital plans are
          insurance products and are not medical schemes, so they do not carry that guarantee. Check waiting periods, exclusions, network rules
          and gap-cover terms in the policy. All figures here are inputs from your quotes, not market data. Not financial advice.
        </Note>
      </Card>
    </div>
  );
}
