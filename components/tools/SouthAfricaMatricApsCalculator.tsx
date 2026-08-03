'use client';

import { useMemo, useState } from 'react';

/**
 * South Africa Matric APS Calculator
 * Pure client component. No SEO responsibility, no registry imports.
 *
 * Converts NSC (matric) percentages into the standard Admission Point
 * Score (APS) used by most South African universities (UP, UJ, NWU,
 * UKZN, and others) for admission screening: best 6 subjects (excluding
 * Life Orientation by default), each converted to a 1-7 point scale on
 * the public, standardised DBE achievement-level table, summed to a
 * maximum of 42.
 */

type Subject = {
  id: string;
  name: string;
  percent: number | '';
  isLO: boolean;
};

const ACHIEVEMENT_LEVELS: { min: number; max: number; points: number; label: string }[] = [
  { min: 80, max: 100, points: 7, label: 'Outstanding' },
  { min: 70, max: 79, points: 6, label: 'Meritorious' },
  { min: 60, max: 69, points: 5, label: 'Substantial' },
  { min: 50, max: 59, points: 4, label: 'Adequate' },
  { min: 40, max: 49, points: 3, label: 'Moderate' },
  { min: 30, max: 39, points: 2, label: 'Elementary' },
  { min: 0, max: 29, points: 1, label: 'Not Achieved' },
];

function percentToPoints(percent: number): number {
  const level = ACHIEVEMENT_LEVELS.find((l) => percent >= l.min && percent <= l.max);
  return level ? level.points : 1;
}

function percentToLabel(percent: number): string {
  const level = ACHIEVEMENT_LEVELS.find((l) => percent >= l.min && percent <= l.max);
  return level ? level.label : 'Not Achieved';
}

const COMMON_SUBJECTS = [
  'Home Language (English)',
  'First Additional Language',
  'Mathematics',
  'Mathematical Literacy',
  'Life Orientation',
  'Physical Sciences',
  'Life Sciences',
  'Accounting',
  'Business Studies',
  'Economics',
  'Geography',
  'History',
  'Information Technology',
  'Consumer Studies',
  'Agricultural Sciences',
  'Tourism',
  'Visual Arts',
];

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `subj-${idCounter}-${Date.now()}`;
}

function defaultSubjects(): Subject[] {
  return [
    { id: nextId(), name: 'Home Language (English)', percent: 65, isLO: false },
    { id: nextId(), name: 'First Additional Language', percent: 60, isLO: false },
    { id: nextId(), name: 'Mathematics', percent: 55, isLO: false },
    { id: nextId(), name: 'Life Orientation', percent: 70, isLO: true },
    { id: nextId(), name: 'Physical Sciences', percent: 58, isLO: false },
    { id: nextId(), name: 'Life Sciences', percent: 62, isLO: false },
    { id: nextId(), name: 'Geography', percent: 50, isLO: false },
  ];
}

const UNIVERSITY_NOTES: { name: string; note: string }[] = [
  { name: 'UP / UJ / NWU / UKZN', note: 'Use the standard 42-point APS (best 6 subjects, excl. Life Orientation) shown by this calculator.' },
  { name: 'University of Cape Town (UCT)', note: 'Uses its own Faculty Points Score (FPS), not the standard APS — a different weighted scale, up to roughly 600 depending on faculty. Check UCT\u2019s admissions page directly.' },
  { name: 'Wits', note: 'Often calculates a 7-subject total that can include Life Orientation with a capped bonus contribution, plus subject-specific requirements — check the exact faculty rules.' },
  { name: 'Stellenbosch', note: 'Primarily uses actual subject percentages against minimum requirements rather than a summed APS/points score for many programmes.' },
];

const WHAT_CAN_I_STUDY: { field: string; range: string }[] = [
  { field: 'Medicine (MBChB)', range: '38–42+' },
  { field: 'Engineering', range: '32–40+' },
  { field: 'BCom (Commerce)', range: '28–35+' },
  { field: 'General BA / BSc', range: '26–33+' },
];

export default function SouthAfricaMatricApsCalculator(_props: { locale: string }) {
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects());
  const [excludeLO, setExcludeLO] = useState(true);
  const [showUniNotes, setShowUniNotes] = useState(false);

  function updateSubject(id: string, patch: Partial<Subject>) {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addSubject() {
    if (subjects.length >= 11) return;
    setSubjects((prev) => [...prev, { id: nextId(), name: 'Other', percent: '', isLO: false }]);
  }

  function removeSubject(id: string) {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }

  function clearAll() {
    setSubjects(defaultSubjects());
  }

  const scored = useMemo(
    () =>
      subjects
        .filter((s) => s.percent !== '' && !(excludeLO && s.isLO))
        .map((s) => ({ ...s, percent: Number(s.percent), points: percentToPoints(Number(s.percent)) })),
    [subjects, excludeLO]
  );

  const best6 = useMemo(() => {
    const sorted = [...scored].sort((a, b) => b.points - a.points);
    return sorted.slice(0, 6);
  }, [scored]);

  const aps = best6.reduce((sum, s) => sum + s.points, 0);

  const homeLanguage = subjects.find((s) => s.name === 'Home Language (English)');
  const homeLanguagePercent = homeLanguage && homeLanguage.percent !== '' ? Number(homeLanguage.percent) : 0;

  const subjectsAt50 = subjects.filter((s) => s.percent !== '' && !s.isLO && Number(s.percent) >= 50).length;
  const subjectsAt40 = subjects.filter((s) => s.percent !== '' && !s.isLO && Number(s.percent) >= 40).length;
  const subjectsAt30 = subjects.filter((s) => s.percent !== '' && !s.isLO && Number(s.percent) >= 30).length;
  const passedSubjects = subjects.filter((s) => s.percent !== '' && Number(s.percent) >= 30).length;

  const meetsBachelor = homeLanguagePercent >= 40 && subjectsAt50 >= 4 && subjectsAt30 >= 6 && passedSubjects >= 6;
  const meetsDiploma = !meetsBachelor && homeLanguagePercent >= 40 && subjectsAt40 >= 4 && subjectsAt30 >= 6;
  const meetsHigherCert = !meetsBachelor && !meetsDiploma && homeLanguagePercent >= 40 && subjectsAt40 >= 2 && subjectsAt30 >= 5;

  function copySummary() {
    const lines = [
      `Matric APS: ${aps}/42`,
      ...best6.map((s) => `${s.name}: ${s.percent}% (${s.points} pts)`),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
  }

  function pointsColor(points: number) {
    if (points >= 6) return 'text-green-700 bg-green-50';
    if (points >= 4) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Matric APS Calculator</h2>
        <p className="mt-1 text-sm text-gray-600">
          Convert your NSC (matric) subject percentages into an Admission Point Score (APS) out of 42, using
          the standard best-6-subjects method most South African universities screen with.
        </p>

        <label className="mt-3 flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={excludeLO}
            onChange={(e) => setExcludeLO(e.target.checked)}
            className="rounded border-gray-300"
          />
          Exclude Life Orientation from APS (standard for most universities)
        </label>
      </div>

      {/* Subject inputs */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Your subjects &amp; percentages</h3>
        <div className="space-y-2">
          {subjects.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2">
              <select
                value={s.name}
                onChange={(e) => updateSubject(s.id, { name: e.target.value, isLO: e.target.value === 'Life Orientation' })}
                className="flex-1 min-w-[11rem] rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                {COMMON_SUBJECTS.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="Other">Other</option>
              </select>

              <input
                type="number"
                min={0}
                max={100}
                value={s.percent}
                onChange={(e) => updateSubject(s.id, { percent: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="%"
                className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              />

              {s.percent !== '' && (
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${pointsColor(percentToPoints(Number(s.percent)))}`}>
                  {percentToPoints(Number(s.percent))} pts &middot; {percentToLabel(Number(s.percent))}
                </span>
              )}

              {s.isLO && <span className="text-xs font-medium text-indigo-600">LO</span>}

              <button
                type="button"
                onClick={() => removeSubject(s.id)}
                className="ml-auto text-xs text-gray-400 hover:text-red-600"
                aria-label={`Remove ${s.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addSubject}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Add Subject
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Reset to Example
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl bg-indigo-50 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Your APS</h3>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Best 6 subjects{excludeLO ? ' (excl. LO)' : ''}</span>
            <span className="font-bold text-2xl text-indigo-700">{aps}/42</span>
          </div>
          <div className="h-2 rounded-full bg-white overflow-hidden">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, (aps / 42) * 100)}%` }} />
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {best6.map((s) => (
              <li key={s.id} className={`rounded-md px-2 py-1 text-xs font-medium ${pointsColor(s.points)}`}>
                {s.name}: {s.percent}% ({s.points})
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-white p-3 text-sm">
          <p className="font-medium text-gray-800 mb-1">Estimated qualification band</p>
          {meetsBachelor && <p className="text-green-700 font-medium">Meets the general NSC Bachelor&rsquo;s (Degree) pass requirements.</p>}
          {meetsDiploma && <p className="text-blue-700 font-medium">Meets the general NSC Diploma pass requirements.</p>}
          {meetsHigherCert && <p className="text-yellow-700 font-medium">Meets the general NSC Higher Certificate pass requirements.</p>}
          {!meetsBachelor && !meetsDiploma && !meetsHigherCert && (
            <p className="text-red-700 font-medium">Does not yet appear to meet the minimum NSC pass requirements based on the figures entered.</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Based on general, publicly published NSC minimum requirements (Home Language 40%+, and a set number of
            subjects at 50%/40%/30%+). Always confirm your actual result against your official NSC statement of
            results and Umalusi rules.
          </p>
        </div>

        <button
          type="button"
          onClick={copySummary}
          className="mt-4 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
        >
          Copy Summary
        </button>
      </div>

      {/* What can I study */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">What can I study? (typical APS ranges)</h3>
        <table className="w-full text-sm">
          <tbody>
            {WHAT_CAN_I_STUDY.map((row) => (
              <tr key={row.field} className="border-t border-gray-100">
                <td className="py-1.5 text-gray-700">{row.field}</td>
                <td className="py-1.5 text-right font-medium text-gray-900">{row.range}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-2">
          Indicative ranges only — always check the specific faculty prospectus, since exact cut-offs vary by
          university and by year.
        </p>
      </div>

      {/* University-specific notes */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <button
          type="button"
          onClick={() => setShowUniNotes((v) => !v)}
          className="text-sm font-semibold text-indigo-600"
        >
          {showUniNotes ? 'Hide' : 'Show'} how popular universities calculate this differently
        </button>
        {showUniNotes && (
          <div className="mt-3 space-y-2">
            {UNIVERSITY_NOTES.map((u) => (
              <div key={u.name} className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-800">{u.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{u.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        This is an unofficial estimation tool based on the standard, publicly published NSC achievement-level
        scale and the common best-6-subjects APS method. Actual admission requirements, subject-specific minimums
        (e.g. Mathematics Level 5+ for some faculties), and calculation methods vary by university and faculty —
        always verify with the specific university prospectus and your official NSC results. Not affiliated with
        the Department of Basic Education, Umalusi, or any South African university.
      </p>
    </div>
  );
}
