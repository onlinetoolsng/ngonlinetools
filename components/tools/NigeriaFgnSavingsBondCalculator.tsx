'use client';

import { useMemo, useState } from 'react';

/**
 * FGN Savings Bond Calculator (Nigeria)
 * Pure client component, receives { locale } only. English only.
 * Coupons are paid quarterly, principal is repaid at maturity (bullet).
 * The DMO sets new rates every month: update LATEST_OFFER when it does.
 */

const LATEST_OFFER = {
  label: 'November 2026 offer (DMO)',
  twoYear: 13.25,
  threeYear: 14.25,
};
const UNIT = 1000;
const MIN_INVEST = 5000;

type Tenor = 2 | 3;

const naira = (n: number) => `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
const num = (v: string, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
};

function addMonths(iso: string, months: number): Date | null {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0); // clamp to month end
  return d;
}

export default function NigeriaFgnSavingsBondCalculator({ locale }: { locale: string }) {
  void locale;
  const [amount, setAmount] = useState('1000000');
  const [tenor, setTenor] = useState<Tenor>(3);
  const [rate, setRate] = useState(String(LATEST_OFFER.threeYear));
  const [tax, setTax] = useState('0');
  const [settle, setSettle] = useState('');

  const r = useMemo(() => {
    const raw = num(amount);
    const units = Math.floor(raw / UNIT);
    const principal = units * UNIT;
    const valid = principal >= MIN_INVEST;
    const annual = num(rate) / 100;
    const taxRate = Math.min(100, num(tax)) / 100;
    const grossQ = (principal * annual) / 4;
    const netQ = grossQ * (1 - taxRate);
    const n = tenor * 4;
    const totalInterest = netQ * n;
    const effective = Math.pow(1 + annual / 4, 4) - 1;
    const rows = Array.from({ length: n }, (_, i) => {
      const d = settle ? addMonths(settle, 3 * (i + 1)) : null;
      return { i: i + 1, date: d, coupon: netQ };
    });
    return { principal, valid, grossQ, netQ, n, totalInterest, effective, rows, units, rounded: raw !== principal };
  }, [amount, tenor, rate, tax, settle]);

  const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';

  const pickTenor = (t: Tenor) => {
    setTenor(t);
    setRate(String(t === 2 ? LATEST_OFFER.twoYear : LATEST_OFFER.threeYear));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fgn-amt" className={lbl}>Amount to invest (₦)</label>
            <input id="fgn-amt" type="number" inputMode="decimal" min="0" step="1000" value={amount}
              onChange={(e) => setAmount(e.target.value)} className={inp} />
          </div>
          <div>
            <label htmlFor="fgn-tenor" className={lbl}>Tenor</label>
            <select id="fgn-tenor" value={tenor} onChange={(e) => pickTenor(Number(e.target.value) as Tenor)} className={inp}>
              <option value={2}>2 years ({LATEST_OFFER.twoYear}%)</option>
              <option value={3}>3 years ({LATEST_OFFER.threeYear}%)</option>
            </select>
          </div>
          <div>
            <label htmlFor="fgn-rate" className={lbl}>Coupon rate per year (%)</label>
            <input id="fgn-rate" type="number" inputMode="decimal" min="0" step="0.001" value={rate}
              onChange={(e) => setRate(e.target.value)} className={inp} />
            <p className="text-xs text-gray-400 mt-1">Prefilled from the {LATEST_OFFER.label}. Rates change monthly.</p>
          </div>
          <div>
            <label htmlFor="fgn-tax" className={lbl}>Tax on interest (%), optional</label>
            <input id="fgn-tax" type="number" inputMode="decimal" min="0" max="100" value={tax}
              onChange={(e) => setTax(e.target.value)} className={inp} />
          </div>
          <div>
            <label htmlFor="fgn-settle" className={lbl}>Settlement date, optional</label>
            <input id="fgn-settle" type="date" value={settle} onChange={(e) => setSettle(e.target.value)} className={inp} />
          </div>
        </div>

        {!r.valid && <p className="text-sm text-red-600">The minimum investment is {naira(MIN_INVEST)}, in units of {naira(UNIT)}.</p>}
        {r.valid && r.rounded && (
          <p className="text-xs text-gray-500">Rounded down to {r.units.toLocaleString('en-NG')} units ({naira(r.principal)}).</p>
        )}

        {r.valid && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Each quarterly payment</p>
              <p className="text-xl font-bold text-gray-900">{naira(r.netQ)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Total interest ({r.n} payments)</p>
              <p className="text-xl font-bold text-green-700">{naira(r.totalInterest)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Monthly equivalent</p>
              <p className="text-xl font-bold text-gray-900">{naira(r.netQ / 3)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-500">Principal back at maturity</p>
              <p className="text-xl font-bold text-gray-900">{naira(r.principal)}</p>
            </div>
          </div>
        )}
      </div>

      {r.valid && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Payment schedule</h3>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-gray-500 border-b"><th className="py-2">#</th><th className="py-2">Date</th><th className="py-2">Coupon</th></tr>
            </thead>
            <tbody>
              {r.rows.map((row) => (
                <tr key={row.i} className="border-b border-gray-100">
                  <td className="py-2">{row.i}</td>
                  <td className="py-2">
                    {row.date
                      ? row.date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                      : `Quarter ${row.i}`}
                  </td>
                  <td className="py-2">{naira(row.coupon)}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 font-medium" colSpan={2}>At maturity: principal returned</td>
                <td className="py-2 font-medium">{naira(r.principal)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3">
            If coupons were reinvested every quarter at the same rate, the effective yield would be about{' '}
            {(r.effective * 100).toFixed(2)}% a year. The bond itself pays coupons out and does not reinvest them.
            Estimates only: the DMO circular for each offer is the authority, including payment dates and tax treatment.
          </p>
        </div>
      )}
    </div>
  );
}
