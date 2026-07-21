'use client';

import { useMemo, useState } from 'react';

/**
 * WAEC / NECO Grade Calculator
 * Pure client component. No SEO responsibility, no registry imports.
 * Receives { locale } as its only prop per site convention (locale is
 * accepted but this tool only ships English copy — Nigeria-only, no
 * Arabic content per site spec).
 */

type Grade = 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';

type Subject = {
  id: string;
  name: string;
  grade: Grade;
  sitting: 1 | 2;
};

type CourseCategory =
  | 'medicine-law-engineering'
  | 'sciences'
  | 'arts'
  | 'business'
  | 'education';

const GRADE_POINTS: Record<Grade, number> = {
  A1: 6,
  B2: 5,
  B3: 4,
  C4: 3,
  C5: 2,
  C6: 1,
  D7: 0,
  E8: 0,
  F9: 0,
};

const GRADE_RANGES: Record<Grade, string> = {
  A1: '75–100% · Excellent',
  B2: '70–74% · Very Good',
  B3: '65–69% · Good',
  C4: '60–64% · Credit',
  C5: '55–59% · Credit',
  C6: '50–54% · Credit',
  D7: '45–49% · Pass',
  E8: '40–44% · Pass',
  F9: '0–39% · Fail',
};

const GRADE_OPTIONS = Object.keys(GRADE_POINTS) as Grade[];

const COMMON_SUBJECTS = [
  'English Language',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Literature in English',
  'Government',
  'Geography',
  'Accounting',
  'Commerce',
  'Agricultural Science',
];

const COURSE_CATEGORIES: { value: CourseCategory; label: string; relevant: string[]; note: string }[] = [
  {
    value: 'medicine-law-engineering',
    label: 'Medicine / Law / Engineering',
    relevant: ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
    note: 'Most Medicine and Engineering departments expect at least B3 in core science subjects, not just a C6 credit.',
  },
  {
    value: 'sciences',
    label: 'Sciences',
    relevant: ['English Language', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
    note: 'Science courses generally require credits in Mathematics and at least two relevant science subjects.',
  },
  {
    value: 'arts',
    label: 'Arts',
    relevant: ['English Language', 'Literature in English', 'Government', 'Geography'],
    note: 'Arts courses usually prioritise English Language and Literature over Mathematics-heavy subjects.',
  },
  {
    value: 'business',
    label: 'Business / Commercial',
    relevant: ['English Language', 'Mathematics', 'Economics', 'Accounting', 'Commerce'],
    note: 'Business-related courses typically require credits in Mathematics, Economics, and English Language.',
  },
  {
    value: 'education',
    label: 'Education',
    relevant: ['English Language', 'Mathematics'],
    note: 'Education courses generally require a credit pass relevant to the teaching subject combination chosen.',
  },
];

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `subj-${idCounter}-${Date.now()}`;
}

function defaultSubjects(): Subject[] {
  return [
    { id: nextId(), name: 'English Language', grade: 'C6', sitting: 1 },
    { id: nextId(), name: 'Mathematics', grade: 'C6', sitting: 1 },
  ];
}

const EXAMPLE_SETS: Record<'Science' | 'Arts' | 'Commercial', { name: string; grade: Grade }[]> = {
  Science: [
    { name: 'English Language', grade: 'B3' },
    { name: 'Mathematics', grade: 'B2' },
    { name: 'Physics', grade: 'A1' },
    { name: 'Chemistry', grade: 'B3' },
    { name: 'Biology', grade: 'C4' },
    { name: 'Agricultural Science', grade: 'C5' },
  ],
  Arts: [
    { name: 'English Language', grade: 'B2' },
    { name: 'Mathematics', grade: 'C6' },
    { name: 'Literature in English', grade: 'A1' },
    { name: 'Government', grade: 'B3' },
    { name: 'Geography', grade: 'C4' },
  ],
  Commercial: [
    { name: 'English Language', grade: 'B3' },
    { name: 'Mathematics', grade: 'B2' },
    { name: 'Economics', grade: 'A1' },
    { name: 'Accounting', grade: 'B3' },
    { name: 'Commerce', grade: 'C4' },
  ],
};

export default function WaecNecoGradeCalculator({ locale }: { locale: string }) {
  const [examBody, setExamBody] = useState<'WAEC' | 'NECO'>('WAEC');
  const [combinedSitting, setCombinedSitting] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>(defaultSubjects());
  const [category, setCategory] = useState<CourseCategory>('sciences');
  const [showAggregate, setShowAggregate] = useState(false);
  const [jambScore, setJambScore] = useState<number | ''>('');
  const [postUtme, setPostUtme] = useState<number | ''>('');

  const activeCategory = COURSE_CATEGORIES.find((c) => c.value === category)!;

  function updateSubject(id: string, patch: Partial<Subject>) {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addSubject() {
    if (subjects.length >= 15) return;
    setSubjects((prev) => [...prev, { id: nextId(), name: 'Other', grade: 'C6', sitting: 1 }]);
  }

  function removeSubject(id: string) {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }

  function clearAll() {
    setSubjects(defaultSubjects());
  }

  function autoFillExample(set: keyof typeof EXAMPLE_SETS) {
    setSubjects(EXAMPLE_SETS[set].map((s) => ({ id: nextId(), name: s.name, grade: s.grade, sitting: 1 })));
  }

  const sittingsUsed = useMemo(() => new Set(subjects.map((s) => s.sitting)).size, [subjects]);

  const credits = useMemo(
    () => subjects.filter((s) => GRADE_POINTS[s.grade] >= 1),
    [subjects]
  );

  const englishCredit = subjects.some((s) => s.name === 'English Language' && GRADE_POINTS[s.grade] >= 1);
  const mathCredit = subjects.some((s) => s.name === 'Mathematics' && GRADE_POINTS[s.grade] >= 1);

  const best5 = useMemo(() => {
    const relevantSet = new Set(activeCategory.relevant);
    const scored = subjects
      .map((s) => ({ ...s, points: GRADE_POINTS[s.grade], relevant: relevantSet.has(s.name) }))
      .filter((s) => s.points >= 1);
    scored.sort((a, b) => {
      if (a.relevant !== b.relevant) return a.relevant ? -1 : 1;
      return b.points - a.points;
    });
    return scored.slice(0, 5);
  }, [subjects, activeCategory]);

  const best5Sum = best5.reduce((sum, s) => sum + s.points, 0);
  const best5Percent = Math.round((best5Sum / 30) * 100);

  const eligible = credits.length >= 5 && englishCredit && mathCredit && sittingsUsed <= 2;

  const aggregate = useMemo(() => {
    if (jambScore === '' ) return null;
    const jamb = Number(jambScore);
    const post = postUtme === '' ? null : Number(postUtme);
    const oLevelScaled = (best5Sum / 30) * 20;
    if (post !== null) {
      const jambWeighted = (jamb / 400) * 50;
      const postWeighted = (post / 100) * 30;
      return Math.round(jambWeighted + postWeighted + oLevelScaled);
    }
    const jambSimple = jamb / 8;
    return Math.round(jambSimple + best5Sum);
  }, [jambScore, postUtme, best5Sum]);

  function gradeColor(grade: Grade) {
    const p = GRADE_POINTS[grade];
    if (p >= 4) return 'text-green-700 bg-green-50';
    if (p >= 1) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  }

  function copySummary() {
    const lines = [
      `${examBody} Grade Summary`,
      ...subjects.map((s) => `${s.name}: ${s.grade}`),
      `Credits: ${credits.length}/${subjects.length}`,
      `Best 5 points: ${best5Sum}/30`,
      `Eligible for admission screening: ${eligible ? 'Yes' : 'No'}`,
    ];
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
    }
  }

  return (
    <div className="space-y-6">
      {/* Exam body + sitting toggle */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['WAEC', 'NECO'] as const).map((body) => (
              <button
                key={body}
                type="button"
                onClick={() => setExamBody(body)}
                className={`px-4 py-2 text-sm font-medium ${
                  examBody === body ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {body}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={combinedSitting}
              onChange={(e) => setCombinedSitting(e.target.checked)}
              className="rounded border-gray-300"
            />
            Combined result (two sittings)
          </label>
        </div>
        {combinedSitting && (
          <p className="mt-2 text-sm text-amber-700">
            Some universities cap or deduct points for combined results from two sittings. Confirm this with your
            target institution's admission policy before relying on this estimate.
          </p>
        )}
      </div>

      {/* Course category */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Course category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CourseCategory)}
          className="w-full sm:w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {COURSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-500">{activeCategory.note}</p>
      </div>

      {/* Subjects table */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Subjects &amp; grades</h3>
          <span className="text-xs text-gray-400">{subjects.length}/15</span>
        </div>

        <div className="space-y-2">
          {subjects.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-2">
              <select
                value={s.name}
                onChange={(e) => updateSubject(s.id, { name: e.target.value })}
                className="flex-1 min-w-[10rem] rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                {COMMON_SUBJECTS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>

              <select
                value={s.grade}
                onChange={(e) => updateSubject(s.id, { grade: e.target.value as Grade })}
                title={GRADE_RANGES[s.grade]}
                className={`rounded-md border border-gray-300 px-2 py-1.5 text-sm font-semibold ${gradeColor(s.grade)}`}
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g} title={GRADE_RANGES[g]}>
                    {g}
                  </option>
                ))}
              </select>

              {combinedSitting && (
                <select
                  value={s.sitting}
                  onChange={(e) => updateSubject(s.id, { sitting: Number(e.target.value) as 1 | 2 })}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value={1}>1st sitting</option>
                  <option value={2}>2nd sitting</option>
                </select>
              )}

              {(s.name === 'English Language' || s.name === 'Mathematics') && (
                <span className="text-xs font-medium text-indigo-600">Required</span>
              )}

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
            Clear All
          </button>
          <div className="flex gap-1">
            {(Object.keys(EXAMPLE_SETS) as (keyof typeof EXAMPLE_SETS)[]).map((set) => (
              <button
                key={set}
                type="button"
                onClick={() => autoFillExample(set)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Fill {set} Example
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results panel */}
      <div className="rounded-xl bg-indigo-50 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Grade Summary</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Subjects</p>
            <p className="text-lg font-bold text-gray-800">{subjects.length}</p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Credits (A1–C6)</p>
            <p className="text-lg font-bold text-gray-800">{credits.length}</p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">English</p>
            <p className={`text-lg font-bold ${englishCredit ? 'text-green-600' : 'text-red-600'}`}>
              {englishCredit ? 'Credit' : 'No credit'}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Mathematics</p>
            <p className={`text-lg font-bold ${mathCredit ? 'text-green-600' : 'text-red-600'}`}>
              {mathCredit ? 'Credit' : 'No credit'}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Best 5 points (university screening scale)</span>
            <span className="font-semibold text-gray-800">{best5Sum}/30 ({best5Percent}%)</span>
          </div>
          <div className="h-2 rounded-full bg-white overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${Math.min(100, best5Percent)}%` }}
            />
          </div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {best5.map((s) => (
              <li key={s.id} className={`rounded-md px-2 py-1 text-xs font-medium ${gradeColor(s.grade)}`}>
                {s.name}: {s.grade} ({s.points})
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`rounded-lg p-3 text-sm font-medium ${
            eligible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {eligible
            ? 'Meets the general 5-credit minimum (including English & Mathematics) commonly screened for admission.'
            : 'Does not yet meet the general 5-credit minimum, or is missing a required credit in English or Mathematics.'}
        </div>

        {sittingsUsed > 2 && (
          <p className="mt-2 text-sm text-red-700">
            Results spanning more than two sittings are generally not accepted for direct entry or UTME admission
            screening by most Nigerian universities.
          </p>
        )}

        <button
          type="button"
          onClick={copySummary}
          className="mt-4 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
        >
          Copy Summary
        </button>
      </div>

      {/* Aggregate estimator */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <button
          type="button"
          onClick={() => setShowAggregate((v) => !v)}
          className="text-sm font-semibold text-indigo-600"
        >
          {showAggregate ? 'Hide' : 'Show'} JAMB Aggregate Estimator
        </button>

        {showAggregate && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">JAMB UTME score (0–400)</label>
                <input
                  type="number"
                  min={0}
                  max={400}
                  value={jambScore}
                  onChange={(e) => setJambScore(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Post-UTME score (optional, 0–100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={postUtme}
                  onChange={(e) => setPostUtme(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>

            {aggregate !== null && (
              <div className="rounded-lg bg-indigo-50 p-3">
                <p className="text-sm text-gray-600">Estimated aggregate</p>
                <p className="text-2xl font-bold text-indigo-700">{aggregate}/100</p>
                <p className="text-xs text-gray-500 mt-1">
                  Formula used: {postUtme === '' ? 'JAMB ÷ 8 + O\u2019Level best-5 points' : 'JAMB (50%) + Post-UTME (30%) + O\u2019Level scaled (20%)'}.
                  Competitive courses typically see aggregates in the general 65–80+ range, but exact cut-offs are set
                  by each university and JAMB each admission cycle.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        This is an unofficial estimation tool based on general publicly available WAEC, NECO, and JAMB admission
        guidelines. Requirements vary by university, faculty, and admission year. Always verify with JAMB, your
        target institution, and the official WAEC or NECO result checker. Not affiliated with WAEC, NECO, JAMB, or
        any Nigerian university. Figures shown are approximations and carry no guarantee of accuracy.
      </p>
    </div>
  );
}
