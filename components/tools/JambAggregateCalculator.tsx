'use client';

import { useMemo, useState } from 'react';

/**
 * JAMB Aggregate Score & Admission Chance Calculator
 * Pure client-side tool component. No SEO, no schema, no registry imports.
 * Receives only { locale } — page.tsx / registry / metadata are handled elsewhere.
 */

type Props = {
  locale: string;
};

type UniversityFormula = {
  label: string;
  jambWeight: number; // points out of 100 that JAMB contributes
  postUTMEWeight: number; // points out of 100 that Post-UTME contributes
  olevelWeight: number; // points out of 100 that O'Level contributes
  postUTMEMax: number; // the raw max score of the university's Post-UTME/screening
  hasPostUTME: boolean;
};

const UNIVERSITIES: Record<string, UniversityFormula> = {
  generic: {
    label: 'Generic / Standard (50% JAMB + 50% Post-UTME)',
    jambWeight: 50,
    postUTMEWeight: 50,
    olevelWeight: 0,
    postUTMEMax: 100,
    hasPostUTME: true,
  },
  UNILAG: {
    label: 'University of Lagos (UNILAG)',
    jambWeight: 50,
    postUTMEWeight: 50,
    olevelWeight: 0,
    postUTMEMax: 100,
    hasPostUTME: true,
  },
  UI: {
    label: 'University of Ibadan (UI)',
    jambWeight: 50,
    postUTMEWeight: 50,
    olevelWeight: 0,
    postUTMEMax: 50,
    hasPostUTME: true,
  },
  OAU: {
    label: 'Obafemi Awolowo University (OAU)',
    jambWeight: 50,
    postUTMEWeight: 40,
    olevelWeight: 10,
    postUTMEMax: 40,
    hasPostUTME: true,
  },
  UNN: {
    label: 'University of Nigeria, Nsukka (UNN)',
    jambWeight: 40,
    postUTMEWeight: 50,
    olevelWeight: 10,
    postUTMEMax: 100,
    hasPostUTME: true,
  },
  UNIBEN: {
    label: 'University of Benin (UNIBEN)',
    jambWeight: 50,
    postUTMEWeight: 50,
    olevelWeight: 0,
    postUTMEMax: 100,
    hasPostUTME: true,
  },
  LASU: {
    label: 'Lagos State University (LASU)',
    jambWeight: 50,
    postUTMEWeight: 50,
    olevelWeight: 0,
    postUTMEMax: 100,
    hasPostUTME: true,
  },
  ABU: {
    label: 'Ahmadu Bello University (ABU)',
    jambWeight: 60,
    postUTMEWeight: 40,
    olevelWeight: 0,
    postUTMEMax: 100,
    hasPostUTME: true,
  },
  UNILORIN: {
    label: 'University of Ilorin (UNILORIN)',
    jambWeight: 30,
    postUTMEWeight: 70,
    olevelWeight: 0,
    postUTMEMax: 100,
    hasPostUTME: true,
  },
  UNIPORT: {
    label: 'University of Port Harcourt (UNIPORT)',
    jambWeight: 50,
    postUTMEWeight: 50,
    olevelWeight: 0,
    postUTMEMax: 100,
    hasPostUTME: true,
  },
};

type Course = {
  label: string;
  cutoff: number; // approximate historical aggregate cut-off, out of 100
  requiredSubjects: string[]; // subjects that must be among the best 5
};

const COURSES: Record<string, Course> = {
  medicine: {
    label: 'Medicine & Surgery',
    cutoff: 75,
    requiredSubjects: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics'],
  },
  law: {
    label: 'Law',
    cutoff: 70,
    requiredSubjects: ['English Language', 'Mathematics', 'Literature-in-English'],
  },
  engineering: {
    label: 'Engineering (all branches)',
    cutoff: 62,
    requiredSubjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry'],
  },
  computer_science: {
    label: 'Computer Science',
    cutoff: 60,
    requiredSubjects: ['English Language', 'Mathematics', 'Physics'],
  },
  accounting: {
    label: 'Accounting',
    cutoff: 55,
    requiredSubjects: ['English Language', 'Mathematics', 'Economics'],
  },
  economics: {
    label: 'Economics',
    cutoff: 52,
    requiredSubjects: ['English Language', 'Mathematics', 'Economics'],
  },
  nursing: {
    label: 'Nursing Science',
    cutoff: 65,
    requiredSubjects: ['English Language', 'Mathematics', 'Biology', 'Chemistry'],
  },
  mass_communication: {
    label: 'Mass Communication',
    cutoff: 55,
    requiredSubjects: ['English Language', 'Literature-in-English'],
  },
  arts_humanities: {
    label: 'Arts & Humanities (general)',
    cutoff: 48,
    requiredSubjects: ['English Language'],
  },
};

const GRADE_POINTS: Record<string, number> = {
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

const GRADE_OPTIONS = Object.keys(GRADE_POINTS);
const MAX_OLEVEL_POINTS = 30; // best 5 subjects, 6 points max each

const SUBJECT_OPTIONS = [
  'English Language',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'Economics',
  'Literature-in-English',
  'Government',
  'Geography',
  'Commerce',
  'Financial Accounting',
  'Agricultural Science',
];

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export default function JambAggregateCalculator({ locale }: Props) {
  const [universityKey, setUniversityKey] = useState('generic');
  const [courseKey, setCourseKey] = useState('computer_science');
  const [jambScore, setJambScore] = useState<number>(250);
  const [postUtmeScore, setPostUtmeScore] = useState<number>(0);
  const [sittings, setSittings] = useState<'one' | 'two'>('one');
  const [subjects, setSubjects] = useState(
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      subject: SUBJECT_OPTIONS[i] ?? SUBJECT_OPTIONS[0],
      grade: 'B3',
    }))
  );

  const university = UNIVERSITIES[universityKey];
  const course = COURSES[courseKey];

  function updateSubject(id: number, field: 'subject' | 'grade', value: string) {
    setSubjects((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  const olevelRaw = useMemo(
    () => subjects.reduce((sum, row) => sum + (GRADE_POINTS[row.grade] ?? 0), 0),
    [subjects]
  );

  const eligibility = useMemo(() => {
    const chosen = new Set(subjects.map((row) => row.subject));
    const missing = course.requiredSubjects.filter((req) => !chosen.has(req));
    const hasEnglish = chosen.has('English Language');
    return {
      missing,
      hasEnglish,
      isEligible: missing.length === 0 && hasEnglish,
    };
  }, [subjects, course]);

  const breakdown = useMemo(() => {
    const jambContribution = (clampNumber(jambScore, 0, 400) / 400) * university.jambWeight;

    const postUtmeContribution = university.hasPostUTME
      ? (clampNumber(postUtmeScore, 0, university.postUTMEMax) / university.postUTMEMax) *
        university.postUTMEWeight
      : 0;

    let olevelContribution =
      university.olevelWeight > 0 ? (olevelRaw / MAX_OLEVEL_POINTS) * university.olevelWeight : 0;

    // Small, transparent bonus for candidates who sat once (common practice at some schools).
    const sittingBonus = sittings === 'one' && university.olevelWeight > 0 ? 1 : 0;
    olevelContribution = Math.min(olevelContribution + sittingBonus, university.olevelWeight);

    const total = jambContribution + postUtmeContribution + olevelContribution;

    return {
      jambContribution,
      postUtmeContribution,
      olevelContribution,
      total: Math.round(total * 100) / 100,
    };
  }, [jambScore, postUtmeScore, olevelRaw, sittings, university]);

  const chance = useMemo(() => {
    const diff = breakdown.total - course.cutoff;
    if (diff >= 5) return { label: 'High chance', color: 'text-green-700', emoji: '🟢' };
    if (diff >= -3) return { label: 'Moderate chance', color: 'text-amber-700', emoji: '🟡' };
    return { label: 'Low chance', color: 'text-red-700', emoji: '🔴' };
  }, [breakdown.total, course.cutoff]);

  function handleReset() {
    setUniversityKey('generic');
    setCourseKey('computer_science');
    setJambScore(250);
    setPostUtmeScore(0);
    setSittings('one');
    setSubjects(
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        subject: SUBJECT_OPTIONS[i] ?? SUBJECT_OPTIONS[0],
        grade: 'B3',
      }))
    );
  }

  async function handleShare() {
    const summary = `JAMB Aggregate Estimate\nUniversity: ${university.label}\nCourse: ${course.label}\nAggregate: ${breakdown.total.toFixed(2)} / 100\nEstimated chance: ${chance.label}`;
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      // clipboard API unavailable — silently ignore, UI already shows the summary
    }
  }

  return (
    <div className="w-full space-y-6" data-locale={locale}>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">1. Choose university &amp; course</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">University</span>
            <select
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={universityKey}
              onChange={(e) => setUniversityKey(e.target.value)}
            >
              {Object.entries(UNIVERSITIES).map(([key, uni]) => (
                <option key={key} value={key}>
                  {uni.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Course / Department</span>
            <select
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={courseKey}
              onChange={(e) => setCourseKey(e.target.value)}
            >
              {Object.entries(COURSES).map(([key, c]) => (
                <option key={key} value={key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">2. Enter your scores</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">JAMB UTME score (0–400)</span>
            <input
              type="number"
              min={0}
              max={400}
              value={jambScore}
              onChange={(e) => setJambScore(clampNumber(Number(e.target.value), 0, 400))}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="mt-1 block text-xs text-gray-500">
              Contributes {breakdown.jambContribution.toFixed(2)} / {university.jambWeight} points
            </span>
          </label>

          {university.hasPostUTME && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Post-UTME / screening score (0–{university.postUTMEMax})
              </span>
              <input
                type="number"
                min={0}
                max={university.postUTMEMax}
                value={postUtmeScore}
                onChange={(e) =>
                  setPostUtmeScore(clampNumber(Number(e.target.value), 0, university.postUTMEMax))
                }
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="mt-1 block text-xs text-gray-500">
                Contributes {breakdown.postUtmeContribution.toFixed(2)} / {university.postUTMEWeight} points
              </span>
            </label>
          )}
        </div>

        <div className="mt-4">
          <span className="mb-1 block text-sm font-medium text-gray-700">O'Level sittings</span>
          <div className="flex gap-4 text-sm text-gray-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={sittings === 'one'}
                onChange={() => setSittings('one')}
              />
              One sitting
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                checked={sittings === 'two'}
                onChange={() => setSittings('two')}
              />
              Two sittings
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">3. O'Level results (best 5 subjects)</h2>
        <div className="space-y-3">
          {subjects.map((row) => (
            <div key={row.id} className="grid grid-cols-2 gap-3">
              <select
                className="rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={row.subject}
                onChange={(e) => updateSubject(row.id, 'subject', e.target.value)}
              >
                {SUBJECT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={row.grade}
                onChange={(e) => updateSubject(row.id, 'grade', e.target.value)}
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        {!eligibility.isEligible && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {!eligibility.hasEnglish && 'English Language is required. '}
            {eligibility.missing.length > 0 &&
              `This course typically requires: ${eligibility.missing.join(', ')}.`}
          </p>
        )}
      </div>

      <div className="rounded-xl bg-indigo-50 p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Your result</h2>
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-indigo-700">{breakdown.total.toFixed(2)}</span>
          <span className="text-sm text-gray-600">/ 100 aggregate</span>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700">JAMB UTME</span>
            <span className="font-medium text-gray-900">
              {breakdown.jambContribution.toFixed(2)} / {university.jambWeight}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white">
            <div
              className="h-2 rounded-full bg-indigo-500"
              style={{
                width: `${university.jambWeight ? (breakdown.jambContribution / university.jambWeight) * 100 : 0}%`,
              }}
            />
          </div>

          {university.hasPostUTME && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Post-UTME</span>
                <span className="font-medium text-gray-900">
                  {breakdown.postUtmeContribution.toFixed(2)} / {university.postUTMEWeight}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{
                    width: `${
                      university.postUTMEWeight
                        ? (breakdown.postUtmeContribution / university.postUTMEWeight) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </>
          )}

          {university.olevelWeight > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">O'Level</span>
                <span className="font-medium text-gray-900">
                  {breakdown.olevelContribution.toFixed(2)} / {university.olevelWeight}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-indigo-500"
                  style={{
                    width: `${(breakdown.olevelContribution / university.olevelWeight) * 100}%`,
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg bg-white p-4">
          <p className={`font-semibold ${chance.color}`}>
            {chance.emoji} {chance.label} for {course.label} at {university.label}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Typical aggregate cut-off for this course: around {course.cutoff} / 100. Estimates only —
            final admission depends on JAMB CAPS, quotas, catchment area, and the university's official
            list.
          </p>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleShare}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Copy result summary
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        This calculator gives an estimate only, based on publicly reported admission formulas and
        historical cut-off ranges. Universities update their guidelines yearly — always confirm the
        exact formula in the institution's current admission brochure and treat the admission chance
        shown here as a guide, not a guarantee. This tool is not affiliated with JAMB or any university.
      </p>
    </div>
  );
}
