'use client';

import { useMemo, useState } from 'react';

/**
 * Degree Class & CGPA Meaning Checker (Nigeria)
 * Pure client component, receives { locale } only. English only.
 * Enter a CGPA to see the degree class, the distance to the next class,
 * and (optionally) the average needed over remaining credits to reach a target.
 */

type Scale = '5.0' | '4.0';

type ClassBand = { min: number; max: number; label: string; short: string; color: string };

// Standard Nigerian university classification on the 5.0 scale.
const BANDS_5: ClassBand[] = [
  { min: 4.5, max: 5.0, label: 'First Class Honours', short: 'First Class', color: 'bg-green-100 text-green-800' },
  { min: 3.5, max: 4.49, label: 'Second Class Honours (Upper Division)', short: '2:1', color: 'bg-emerald-100 text-emerald-800' },
  { min: 2.4, max: 3.49, label: 'Second Class Honours (Lower Division)', short: '2:2', color: 'bg-yellow-100 text-yellow-800' },
  { min: 1.5, max: 2.39, label: 'Third Class Honours', short: 'Third Class', color: 'bg-orange-100 text-orange-800' },
  { min: 1.0, max: 1.49, label: 'Pass', short: 'Pass', color: 'bg-amber-100 text-amber-800' },
  { min: 0, max: 0.99, label: 'Below pass mark', short: 'Fail', color: 'bg-red-100 text-red-800' },
];

// 4.0-scale institutions vary. Boundaries below are the 5.0 bands scaled by 0.8
// and are only a guide; the school handbook is the authority.
const BANDS_4: ClassBand[] = BANDS_5.map((b) => ({
  ...b,
  min: Math.round(b.min * 0.8 * 100) / 100,
  max: Math.round(b.max * 0.8 * 100) / 100,
}));

function bandsFor(scale: Scale) {
  return scale === '5.0' ? BANDS_5 : BANDS_4;
}

function classify(cgpa: number, scale: Scale): { band: ClassBand; next: ClassBand | null } {
  const bands = bandsFor(scale);
  const idx = bands.findIndex((b) => cgpa >= b.min);
  const i = idx === -1 ? bands.length - 1 : idx;
  return { band: bands[i], next: i > 0 ? bands[i - 1] : null };
}

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default function NigeriaCgpaDegreeClassChecker({ locale }: { locale: string }) {
  void locale;
  const [scale, setScale] = useState<Scale>('5.0');
  const [cgpaInput, setCgpaInput] = useState('3.44');
  const [earned, setEarned] = useState('');
  const [remaining, setRemaining] = useState('');
  const [targetIdx, setTargetIdx] = useState(0);

  const max = scale === '5.0' ? 5 : 4;
  const bands = bandsFor(scale);
  const cgpa = num(cgpaInput);
  const invalid = cgpaInput.trim() !== '' && (cgpa > max || Number.isNaN(parseFloat(cgpaInput)));

  const result = useMemo(() => {
    if (cgpaInput.trim() === '' || invalid) return null;
    const { band, next } = classify(cgpa, scale);
    return { band, next, gap: next ? Math.max(0, next.min - cgpa) : 0 };
  }, [cgpa, cgpaInput, invalid, scale]);

  const planner = useMemo(() => {
    const e = num(earned);
    const r = num(remaining);
    if (e <= 0 || r <= 0 || invalid || cgpaInput.trim() === '') return null;
    const target = bands.filter((b) => b.min > 0)[targetIdx] ?? bands[0];
    const required = (target.min * (e + r) - cgpa * e) / r;
    return { target, required, possible: required <= max + 1e-9, already: cgpa >= target.min };
  }, [earned, remaining, cgpa, cgpaInput, invalid, bands, targetIdx, max]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cgpa-scale" className="block text-sm font-medium text-gray-700 mb-1">
              Grading scale
            </label>
            <select
              id="cgpa-scale"
              value={scale}
              onChange={(e) => setScale(e.target.value as Scale)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="5.0">5.0 scale (most Nigerian universities)</option>
              <option value="4.0">4.0 scale (some institutions, approximate)</option>
            </select>
          </div>
          <div>
            <label htmlFor="cgpa-value" className="block text-sm font-medium text-gray-700 mb-1">
              Your CGPA
            </label>
            <input
              id="cgpa-value"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max={max}
              value={cgpaInput}
              onChange={(e) => setCgpaInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        {invalid && <p className="text-sm text-red-600">CGPA must be between 0 and {max.toFixed(1)} on this scale.</p>}

        {result && (
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${result.band.color}`}>
              {result.band.label}
            </span>
            <p className="text-sm text-gray-700">
              A CGPA of <strong>{cgpa.toFixed(2)}</strong> on the {scale} scale is a <strong>{result.band.short}</strong>.
            </p>
            {result.next ? (
              <p className="text-sm text-gray-600">
                You need <strong>{result.gap.toFixed(2)}</strong> more CGPA points to reach {result.next.short} (
                {result.next.min.toFixed(2)}).
              </p>
            ) : (
              <p className="text-sm text-gray-600">This is the highest class.</p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">What average do I need to reach a target class?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="cgpa-earned" className="block text-sm font-medium text-gray-700 mb-1">
              Credit units completed
            </label>
            <input
              id="cgpa-earned"
              type="number"
              min="0"
              value={earned}
              onChange={(e) => setEarned(e.target.value)}
              placeholder="e.g. 96"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="cgpa-remaining" className="block text-sm font-medium text-gray-700 mb-1">
              Credit units remaining
            </label>
            <input
              id="cgpa-remaining"
              type="number"
              min="0"
              value={remaining}
              onChange={(e) => setRemaining(e.target.value)}
              placeholder="e.g. 60"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="cgpa-target" className="block text-sm font-medium text-gray-700 mb-1">
              Target class
            </label>
            <select
              id="cgpa-target"
              value={targetIdx}
              onChange={(e) => setTargetIdx(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {bands
                .filter((b) => b.min > 0)
                .map((b, i) => (
                  <option key={b.short} value={i}>
                    {b.short} ({b.min.toFixed(2)}+)
                  </option>
                ))}
            </select>
          </div>
        </div>
        {planner && (
          <p className="text-sm text-gray-700">
            {planner.already
              ? `You are already at or above ${planner.target.short}. Keep your average above ${planner.required <= 0 ? '0.00' : planner.required.toFixed(2)} on the remaining units to stay there.`
              : planner.possible
                ? `You need an average of ${planner.required.toFixed(2)} on your remaining units to finish with ${planner.target.short}.`
                : `${planner.target.short} is no longer reachable: it would need ${planner.required.toFixed(2)}, above the ${max.toFixed(1)} maximum.`}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Classification table ({scale} scale)</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-gray-500 border-b">
              <th className="py-2 pr-2">Class</th>
              <th className="py-2">CGPA range</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((b) => (
              <tr key={b.short} className="border-b border-gray-100">
                <td className="py-2 pr-2">{b.label}</td>
                <td className="py-2">
                  {b.min.toFixed(2)} – {b.max.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-3">
          The 5.0 bands are the standard Nigerian university classification. Institutions on a 4.0 scale set their own
          boundaries, so check your school handbook.
        </p>
      </div>
    </div>
  );
}
