'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Electricity band checker (Nigeria).
 * Minimum daily supply per band follows NERC's service-based tariff:
 * A 20h, B 16h, C 12h, D 8h, E 4h. Naira rates differ by DisCo, so they are
 * editable; the defaults are indicative only (Band A national reference
 * 209.50, Bands B to E vary by DisCo).
 */

type Band = 'A' | 'B' | 'C' | 'D' | 'E';
const BANDS: { band: Band; hours: number }[] = [
  { band: 'A', hours: 20 },
  { band: 'B', hours: 16 },
  { band: 'C', hours: 12 },
  { band: 'D', hours: 8 },
  { band: 'E', hours: 4 },
];
const DEFAULT_RATES: Record<Band, string> = { A: '209.5', B: '63', C: '50', D: '43', E: '40' };

function bandForHours(h: number): Band | null {
  const hit = BANDS.find((b) => h >= b.hours);
  return hit ? hit.band : null;
}

export default function NigeriaDiscoTariffBandLookup({ locale }: { locale: string }) {
  void locale;
  const [hours, setHours] = useState('14');
  const [current, setCurrent] = useState<Band>('A');
  const [kwh, setKwh] = useState('150');
  const [rates, setRates] = useState<Record<Band, string>>(DEFAULT_RATES);

  const r = useMemo(() => {
    const h = Math.min(24, toNum(hours));
    const entitled = bandForHours(h);
    const k = toNum(kwh);
    const cost = (b: Band) => k * toNum(rates[b]);
    const curCost = cost(current);
    const rank = (b: Band) => BANDS.findIndex((x) => x.band === b);
    const overBanded = entitled !== null && rank(current) < rank(entitled);
    const entCost = entitled ? cost(entitled) : curCost;
    return { h, entitled, curCost, entCost, overBanded, saving: overBanded ? (curCost - entCost) * 1.075 : 0 };
  }, [hours, current, kwh, rates]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card title="Your supply and band">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field id="eb-hours" label="Average hours of supply per day" value={hours} onChange={setHours} step="0.5" hint="Over a typical month" />
          <Select id="eb-band" label="Band you are charged" value={current} onChange={(v) => setCurrent(v as Band)}
            options={BANDS.map((b) => ({ value: b.band, label: `Band ${b.band}` }))} hint="Shown on your DisCo app or feeder notice" />
          <Field id="eb-kwh" label="Monthly use (kWh)" value={kwh} onChange={setKwh} step="10" />
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          {r.entitled === null ? (
            <p>Under 4 hours of supply a day is below the minimum for any band. Raise it with your DisCo.</p>
          ) : (
            <p>
              {r.h} hours a day meets <strong>Band {r.entitled}</strong> or better.
              {r.overBanded
                ? ` You are being charged Band ${current}, which promises more hours than you receive.`
                : ' Your charged band is consistent with your supply.'}
            </p>
          )}
        </div>
        {r.overBanded && (
          <div className="grid grid-cols-2 gap-4">
            <Stat label={`Monthly cost at Band ${current} (before VAT)`} value={fmt(r.curCost)} />
            <Stat label={`At Band ${r.entitled}`} value={fmt(r.entCost)} tone="good" />
            <Stat label="Possible saving a month (with 7.5% VAT)" value={fmt(r.saving)} tone="good" />
          </div>
        )}
      </Card>

      <Card title="Band guide and rates (₦ per kWh before VAT)">
        <table className="w-full text-sm text-left">
          <thead><tr className="text-gray-500 border-b"><th className="py-2">Band</th><th className="py-2">Minimum supply</th><th className="py-2 text-right">Rate (edit to your DisCo)</th></tr></thead>
          <tbody>
            {BANDS.map((b) => (
              <tr key={b.band} className="border-b border-gray-100">
                <td className="py-2 font-medium">Band {b.band}</td>
                <td className="py-2">{b.hours} hours a day</td>
                <td className="py-2 text-right">
                  <input aria-label={`Band ${b.band} rate`} type="number" min="0" step="0.01" value={rates[b.band]}
                    onChange={(e) => setRates({ ...rates, [b.band]: e.target.value })}
                    className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-right" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>
          Minimum hours follow NERC's service-based tariff. Band A is about ₦209.50 per kWh nationally; Bands B to E are frozen at each
          DisCo's own rates, so they differ between DisCos. The defaults here are indicative. Check your DisCo's tariff notice or your vending
          receipt, and raise band disputes with your DisCo or the NERC office in your state.
        </Note>
      </Card>
    </div>
  );
}
