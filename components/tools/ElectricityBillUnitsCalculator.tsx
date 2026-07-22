'use client';

import { useMemo, useState } from 'react';

interface ElectricityBillUnitsCalculatorProps {
  locale: string;
}

type Band = 'A' | 'B' | 'C' | 'D' | 'E';
type Mode = 'billFromUnits' | 'unitsFromAmount';

interface DiscoRates {
  name: string;
  slug: string;
  bands: Record<Band, number>;
  fixedCharge: number; // typical residential monthly fixed/service charge estimate, Naira
}

// Indicative rates only — last verified June 2026 against public NERC/MYTO Service-Based
// Tariff (SBT) reporting. Band A varies slightly by DisCo because it is cost-reflective;
// Bands B–E are heavily subsidised and largely uniform nationwide under the MYTO order.
// These MUST be reviewed quarterly — see disclaimer rendered in the UI below.
const DISCOS: DiscoRates[] = [
  { name: 'Abuja Electricity (AEDC)', slug: 'aedc', bands: { A: 225.0, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Benin Electricity (BEDC)', slug: 'bedc', bands: { A: 225.0, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Eko Electricity (EKEDC)', slug: 'ekedc', bands: { A: 209.5, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Enugu Electricity (EEDC)', slug: 'eedc', bands: { A: 225.0, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Ibadan Electricity (IBEDC)', slug: 'ibedc', bands: { A: 225.0, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Ikeja Electric (IKEDC)', slug: 'ikedc', bands: { A: 206.8, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Jos Electricity (JED)', slug: 'jed', bands: { A: 225.0, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Kaduna Electricity (KAEDCO)', slug: 'kaedco', bands: { A: 225.0, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Kano Electricity (KEDCO)', slug: 'kedco', bands: { A: 225.0, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Port Harcourt Electricity (PHED)', slug: 'phed', bands: { A: 225.0, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Yola Electricity (YEDC)', slug: 'yedc', bands: { A: 225.0, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
  { name: 'Aba Power (APLE)', slug: 'aple', bands: { A: 209.5, B: 66.0, C: 50.0, D: 50.0, E: 48.0 }, fixedCharge: 750 },
];

const BAND_INFO: Record<Band, string> = {
  A: '20+ hours of supply per day (cost-reflective, highest rate)',
  B: '16–20 hours of supply per day',
  C: '12–16 hours of supply per day',
  D: '8–12 hours of supply per day',
  E: 'Under 8 hours of supply per day (most subsidised, lowest rate)',
};

const VAT_RATE = 0.075;

function formatNaira(value: number): string {
  if (!isFinite(value)) return '₦0.00';
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ElectricityBillUnitsCalculator({ locale }: ElectricityBillUnitsCalculatorProps) {
  const [discoSlug, setDiscoSlug] = useState(DISCOS[0].slug);
  const [band, setBand] = useState<Band>('A');
  const [mode, setMode] = useState<Mode>('unitsFromAmount');
  const [includeFixedCharge, setIncludeFixedCharge] = useState(false);
  const [units, setUnits] = useState('100');
  const [amount, setAmount] = useState('10000');
  const [dailyUsage, setDailyUsage] = useState('10');

  const disco = useMemo(() => DISCOS.find((d) => d.slug === discoSlug) ?? DISCOS[0], [discoSlug]);
  const rate = disco.bands[band];

  const result = useMemo(() => {
    if (mode === 'billFromUnits') {
      const unitsNum = Math.max(0, parseFloat(units) || 0);
      const energyCharge = unitsNum * rate;
      const fixed = includeFixedCharge ? disco.fixedCharge : 0;
      const subtotal = energyCharge + fixed;
      const vat = subtotal * VAT_RATE;
      const total = subtotal + vat;
      return { energyCharge, fixed, subtotal, vat, total, unitsNum };
    }

    const amountNum = Math.max(0, parseFloat(amount) || 0);
    const energyValueInclusive = amountNum / (1 + VAT_RATE); // back out 7.5% VAT
    const unitsGross = amountNum / rate; // simple "gross" estimate, ignores VAT split
    const unitsEffective = energyValueInclusive / rate; // VAT-adjusted "effective" units
    const daily = Math.max(0.1, parseFloat(dailyUsage) || 0.1);
    const daysLastingGross = unitsGross / daily;
    const daysLastingEffective = unitsEffective / daily;
    return { unitsGross, unitsEffective, energyValueInclusive, daysLastingGross, daysLastingEffective, amountNum };
  }, [mode, units, amount, rate, includeFixedCharge, disco.fixedCharge, dailyUsage]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Mode switcher */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode('unitsFromAmount')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === 'unitsFromAmount' ? 'bg-white shadow text-indigo-700' : 'text-gray-500'
          }`}
        >
          Amount → Units (prepaid)
        </button>
        <button
          type="button"
          onClick={() => setMode('billFromUnits')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            mode === 'billFromUnits' ? 'bg-white shadow text-indigo-700' : 'text-gray-500'
          }`}
        >
          Units → Bill (postpaid)
        </button>
      </div>

      {/* Inputs card */}
      <div className="rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distribution company (DisCo)</label>
            <select
              value={discoSlug}
              onChange={(e) => setDiscoSlug(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {DISCOS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tariff band</label>
            <select
              value={band}
              onChange={(e) => setBand(e.target.value as Band)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {(Object.keys(BAND_INFO) as Band[]).map((b) => (
                <option key={b} value={b}>
                  Band {b} — {formatNaira(disco.bands[b])}/kWh
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{BAND_INFO[band]}</p>
          </div>
        </div>

        {mode === 'billFromUnits' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Units consumed (kWh)</label>
            <input
              type="number"
              min={0}
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={includeFixedCharge}
                onChange={(e) => setIncludeFixedCharge(e.target.checked)}
              />
              Include typical fixed/service charge ({formatNaira(disco.fixedCharge)})
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount to buy (₦)</label>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Average daily usage (kWh/day)</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={dailyUsage}
                onChange={(e) => setDailyUsage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Typical households use 5–20 kWh/day.</p>
            </div>
          </div>
        )}
      </div>

      {/* Results panel */}
      <div className="rounded-xl bg-indigo-50 p-5 space-y-3">
        {mode === 'billFromUnits' ? (
          <>
            <p className="text-sm text-gray-600">Estimated total bill</p>
            <p className="text-3xl font-bold text-indigo-800">{formatNaira((result as any).total)}</p>
            <div className="text-sm text-gray-700 space-y-1 pt-2">
              <p>
                Energy charge: {(result as any).unitsNum.toLocaleString('en-NG')} kWh × {formatNaira(rate)} ={' '}
                {formatNaira((result as any).energyCharge)}
              </p>
              {includeFixedCharge && <p>Fixed/service charge: {formatNaira((result as any).fixed)}</p>}
              <p>Subtotal: {formatNaira((result as any).subtotal)}</p>
              <p>VAT (7.5%): {formatNaira((result as any).vat)}</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">Estimated units</p>
            <p className="text-3xl font-bold text-indigo-800">
              {(result as any).unitsEffective.toLocaleString('en-NG', { maximumFractionDigits: 2 })} kWh
            </p>
            <div className="text-sm text-gray-700 space-y-1 pt-2">
              <p>
                Gross estimate (no VAT split): {(result as any).unitsGross.toLocaleString('en-NG', { maximumFractionDigits: 2 })} kWh
              </p>
              <p>Energy value after backing out 7.5% VAT: {formatNaira((result as any).energyValueInclusive)}</p>
              <p>
                Should last about {(result as any).daysLastingEffective.toLocaleString('en-NG', { maximumFractionDigits: 1 })} day(s)
                at your stated daily usage.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Band reference table */}
      <div className="rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">DisCo tariff table (₦/kWh, before VAT)</h3>
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-2">DisCo</th>
              <th className="py-2 pr-2">Band A</th>
              <th className="py-2 pr-2">Band B</th>
              <th className="py-2 pr-2">Band C</th>
              <th className="py-2 pr-2">Band D</th>
              <th className="py-2 pr-2">Band E</th>
            </tr>
          </thead>
          <tbody>
            {DISCOS.map((d) => (
              <tr key={d.slug} className="border-b border-gray-100">
                <td className="py-2 pr-2 text-gray-700">{d.name}</td>
                <td className="py-2 pr-2">{d.bands.A.toFixed(2)}</td>
                <td className="py-2 pr-2">{d.bands.B.toFixed(2)}</td>
                <td className="py-2 pr-2">{d.bands.C.toFixed(2)}</td>
                <td className="py-2 pr-2">{d.bands.D.toFixed(2)}</td>
                <td className="py-2 pr-2">{d.bands.E.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        Rates shown are indicative, based on publicly reported NERC Multi-Year Tariff Order (MYTO) / Service-Based
        Tariff (SBT) figures last checked June 2026. Tariffs are reviewed periodically and can change without
        notice, and some DisCos apply small Band A variations. Confirm the exact rate on your own bill, meter
        receipt, or DisCo portal before making financial decisions — this tool does not connect to any live
        billing system and cannot reflect debt recovery, arrears, or estate/community-meter adjustments.
      </p>
    </div>
  );
}
