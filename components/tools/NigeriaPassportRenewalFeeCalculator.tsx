'use client';

import { useMemo, useState } from 'react';

/**
 * Nigeria Passport Fee & Timeline Calculator
 * Pure client component, receives { locale } only. English only.
 * Fees and processing times: Nigeria Immigration Service Service Level
 * Agreement (revised April 2026). Fees are listed exclusive of bank charges.
 */

type Where = 'nigeria' | 'abroad';
type Booklet = '32' | '64';
type Kind = 'fresh' | 'renewal' | 'change';

const FEES: Record<Where, Record<Booklet, number>> = {
  nigeria: { '32': 100000, '64': 200000 },
  abroad: { '32': 150, '64': 230 },
};
const BOOKLET: Record<Booklet, { label: string; years: number }> = {
  '32': { label: '32 pages, 5-year validity', years: 5 },
  '64': { label: '64 pages, 10-year validity', years: 10 },
};
const CORRECTION_NGN = 30000;
// Days after successful enrolment (SLA, April 2026)
const DAYS: Record<Kind, number> = { fresh: 42, renewal: 21, change: 42 };
const KIND_LABEL: Record<Kind, string> = {
  fresh: 'Fresh application',
  renewal: 'Renewal / re-issue',
  change: 'Change of data / correction',
};

function fmt(n: number, where: Where) {
  return where === 'nigeria' ? `₦${n.toLocaleString('en-NG')}` : `$${n.toLocaleString('en-US')}`;
}

function addDays(iso: string, days: number): Date | null {
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return d;
}

export default function NigeriaPassportRenewalFeeCalculator({ locale }: { locale: string }) {
  void locale;
  const [where, setWhere] = useState<Where>('nigeria');
  const [booklet, setBooklet] = useState<Booklet>('32');
  const [kind, setKind] = useState<Kind>('renewal');
  const [bankCharge, setBankCharge] = useState('');
  const [enrolDate, setEnrolDate] = useState('');

  const r = useMemo(() => {
    const base = FEES[where][booklet];
    const admin = kind === 'change' && where === 'nigeria' ? CORRECTION_NGN : 0;
    const bank = Math.max(0, parseFloat(bankCharge) || 0);
    const total = base + admin + bank;
    const perYear = base / BOOKLET[booklet].years;
    const other: Booklet = booklet === '32' ? '64' : '32';
    const otherPerYear = FEES[where][other] / BOOKLET[other].years;
    const ready = enrolDate ? addDays(enrolDate, DAYS[kind]) : null;
    return { base, admin, bank, total, perYear, otherPerYear, other, ready };
  }, [where, booklet, kind, bankCharge, enrolDate]);

  const sel = 'w-full rounded-lg border border-gray-300 px-3 py-2';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="pp-where" className={lbl}>Where are you applying?</label>
            <select id="pp-where" value={where} onChange={(e) => setWhere(e.target.value as Where)} className={sel}>
              <option value="nigeria">In Nigeria (₦)</option>
              <option value="abroad">Abroad / diaspora ($)</option>
            </select>
          </div>
          <div>
            <label htmlFor="pp-booklet" className={lbl}>Booklet</label>
            <select id="pp-booklet" value={booklet} onChange={(e) => setBooklet(e.target.value as Booklet)} className={sel}>
              {(Object.keys(BOOKLET) as Booklet[]).map((b) => (
                <option key={b} value={b}>{BOOKLET[b].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pp-kind" className={lbl}>Application type</label>
            <select id="pp-kind" value={kind} onChange={(e) => setKind(e.target.value as Kind)} className={sel}>
              {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pp-bank" className={lbl}>Bank / payment charges, optional ({where === 'nigeria' ? '₦' : '$'})</label>
            <input id="pp-bank" type="number" min="0" inputMode="decimal" value={bankCharge}
              onChange={(e) => setBankCharge(e.target.value)} placeholder="NIS fees exclude bank charges" className={sel} />
          </div>
          <div>
            <label htmlFor="pp-date" className={lbl}>Biometric enrolment date, optional</label>
            <input id="pp-date" type="date" value={enrolDate} onChange={(e) => setEnrolDate(e.target.value)} className={sel} />
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 p-4 space-y-2">
          <p className="text-sm text-gray-600">{KIND_LABEL[kind]} · {BOOKLET[booklet].label}</p>
          <p className="text-3xl font-bold text-gray-900">{fmt(r.total, where)}</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Passport fee: {fmt(r.base, where)}</li>
            {r.admin > 0 && <li>Data correction administrative charge: {fmt(r.admin, where)}</li>}
            {r.bank > 0 && <li>Bank / payment charges: {fmt(r.bank, where)}</li>}
          </ul>
          <p className="text-sm text-gray-700">
            Processing: about <strong>{DAYS[kind]} days</strong> after successful enrolment
            {r.ready && (
              <>
                {' '}→ expected around{' '}
                <strong>{r.ready.toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </>
            )}
            .
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">5-year or 10-year passport?</h3>
        <p className="text-sm text-gray-700">
          The {BOOKLET[booklet].label} costs <strong>{fmt(Math.round(r.perYear * 100) / 100, where)}</strong> per year of
          validity. The {BOOKLET[r.other].label} works out to{' '}
          <strong>{fmt(Math.round(r.otherPerYear * 100) / 100, where)}</strong> per year.
        </p>
        <p className="text-xs text-gray-400">
          Fees and processing times follow the Nigeria Immigration Service Service Level Agreement (revised April 2026)
          and can change. Confirm on the official passport portal before paying. Fees do not include bank charges.
        </p>
      </div>
    </div>
  );
}
