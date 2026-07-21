'use client';

import { useMemo, useState } from 'react';

/**
 * University CGPA / GPA Tracker (Nigeria)
 * Pure client component. No SEO responsibility, no registry imports.
 * Receives { locale } as its only prop. English only — Nigeria-only
 * site spec excludes Arabic/country-variant content.
 * Registry path: components/tools/education/NigeriaCGPATracker.tsx
 */

type Scale = '5.0' | '4.0' | 'custom';
type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

interface Course {
  id: string;
  code: string;
  credits: number;
  grade: Grade;
  isRetake: boolean;
}

interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'E', 'F'];

const DEFAULT_POINTS: Record<Scale, Record<Grade, number>> = {
  '5.0': { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 },
  // Common Nigerian 4.0-scale institutions (many polytechnics / some private
  // universities) do not use a separate E band — D and E are folded together.
  '4.0': { A: 4, B: 3, C: 2, D: 1, E: 1, F: 0 },
  custom: { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 },
};

const GRADE_RANGE_LABEL: Record<Grade, string> = {
  A: '70–100%',
  B: '60–69%',
  C: '50–59%',
  D: '45–49%',
  E: '40–44%',
  F: '0–39%',
};

const CLASSIFICATIONS_5: { min: number; label: string; color: string }[] = [
  { min: 4.5, label: 'First Class', color: 'bg-green-100 text-green-800' },
  { min: 3.5, label: 'Second Class Upper', color: 'bg-emerald-100 text-emerald-800' },
  { min: 2.4, label: 'Second Class Lower', color: 'bg-yellow-100 text-yellow-800' },
  { min: 1.5, label: 'Third Class', color: 'bg-orange-100 text-orange-800' },
  { min: 1.0, label: 'Pass', color: 'bg-amber-100 text-amber-800' },
  { min: 0, label: 'Below 1.00 — Fail/Probation risk', color: 'bg-red-100 text-red-800' },
];

// Proportionally scaled (x0.8) for 4.0-scale institutions. Exact boundaries
// are institution-specific; verify with your school's handbook.
const CLASSIFICATIONS_4 = CLASSIFICATIONS_5.map((c) => ({ ...c, min: Math.round(c.min * 0.8 * 100) / 100 }));

let idCounter = 0;
function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

function newCourse(): Course {
  return { id: nextId('course'), code: '', credits: 3, grade: 'A', isRetake: false };
}

function newSemester(index: number): Semester {
  const year = Math.ceil(index / 2);
  const sem = index % 2 === 0 ? 2 : 1;
  return { id: nextId('sem'), name: `Year ${year} Semester ${sem}`, courses: [newCourse()] };
}

function calculateGPA(courses: Course[], points: Record<Grade, number>) {
  const credits = courses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
  const qualityPoints = courses.reduce((s, c) => s + (Number(c.credits) || 0) * points[c.grade], 0);
  return { gpa: credits > 0 ? qualityPoints / credits : 0, credits, qualityPoints };
}

function calculateCGPA(semesters: Semester[], points: Record<Grade, number>) {
  let totalCredits = 0;
  let totalQP = 0;
  for (const s of semesters) {
    const { credits, qualityPoints } = calculateGPA(s.courses, points);
    totalCredits += credits;
    totalQP += qualityPoints;
  }
  return { cgpa: totalCredits > 0 ? totalQP / totalCredits : 0, totalQP, totalCredits };
}

export default function NigeriaCGPATracker({ locale }: { locale: string }) {
  const [scale, setScale] = useState<Scale>('5.0');
  const [customPoints, setCustomPoints] = useState<Record<Grade, number>>({ ...DEFAULT_POINTS.custom });
  const points = scale === 'custom' ? customPoints : DEFAULT_POINTS[scale];
  const maxPoint = scale === '4.0' ? 4 : 5;

  const [university, setUniversity] = useState('');
  const [levelLabel, setLevelLabel] = useState('300 Level');
  const [targetCredits, setTargetCredits] = useState(144);

  const [semesters, setSemesters] = useState<Semester[]>([newSemester(1)]);
  const [bulkTarget, setBulkTarget] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState('');

  const [targetCGPA, setTargetCGPA] = useState<number | ''>('');
  const [remainingSemesters, setRemainingSemesters] = useState(2);
  const [creditsPerSemester, setCreditsPerSemester] = useState(21);

  const [profileName, setProfileName] = useState('');
  const [savedNames, setSavedNames] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(window.localStorage.getItem('cgpa-tracker:profiles') || '[]');
    } catch {
      return [];
    }
  });

  function updateSemesterCourses(semId: string, fn: (courses: Course[]) => Course[]) {
    setSemesters((prev) => prev.map((s) => (s.id === semId ? { ...s, courses: fn(s.courses) } : s)));
  }

  function addSemester() {
    setSemesters((prev) => [...prev, newSemester(prev.length + 1)]);
  }

  function removeSemester(id: string) {
    setSemesters((prev) => prev.filter((s) => s.id !== id));
  }

  function renameSemester(id: string, name: string) {
    setSemesters((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  }

  function addCourse(semId: string) {
    updateSemesterCourses(semId, (courses) => [...courses, newCourse()]);
  }

  function updateCourse(semId: string, courseId: string, patch: Partial<Course>) {
    updateSemesterCourses(semId, (courses) => courses.map((c) => (c.id === courseId ? { ...c, ...patch } : c)));
  }

  function removeCourse(semId: string, courseId: string) {
    updateSemesterCourses(semId, (courses) => courses.filter((c) => c.id !== courseId));
  }

  function applyBulk(semId: string) {
    const rows = bulkText
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);
    const parsed: Course[] = [];
    for (const row of rows) {
      const [code, creditsRaw, gradeRaw] = row.split(',').map((v) => v.trim());
      const grade = (gradeRaw || 'A').toUpperCase() as Grade;
      if (!GRADES.includes(grade)) continue;
      parsed.push({
        id: nextId('course'),
        code: code || 'Course',
        credits: Number(creditsRaw) || 3,
        grade,
        isRetake: false,
      });
    }
    if (parsed.length) {
      updateSemesterCourses(semId, (courses) => [...courses.filter((c) => c.code), ...parsed]);
    }
    setBulkTarget(null);
    setBulkText('');
  }

  const semesterResults = useMemo(
    () => semesters.map((s) => ({ id: s.id, ...calculateGPA(s.courses, points) })),
    [semesters, points]
  );

  const { cgpa, totalQP, totalCredits } = useMemo(() => calculateCGPA(semesters, points), [semesters, points]);

  const classificationTable = scale === '4.0' ? CLASSIFICATIONS_4 : CLASSIFICATIONS_5;
  const classification =
    scale === 'custom'
      ? null
      : classificationTable.find((c) => cgpa >= c.min) || classificationTable[classificationTable.length - 1];

  const progressPct = targetCredits > 0 ? Math.min(100, Math.round((totalCredits / targetCredits) * 100)) : 0;

  const requiredFutureGPA = useMemo(() => {
    if (targetCGPA === '' || remainingSemesters <= 0 || creditsPerSemester <= 0) return null;
    const remainingCredits = remainingSemesters * creditsPerSemester;
    const finalCredits = totalCredits + remainingCredits;
    const requiredQP = Number(targetCGPA) * finalCredits - totalQP;
    const requiredGPA = requiredQP / remainingCredits;
    return { requiredGPA, remainingCredits, finalCredits, achievable: requiredGPA <= maxPoint && requiredGPA >= 0 };
  }, [targetCGPA, remainingSemesters, creditsPerSemester, totalCredits, totalQP, maxPoint]);

  function applyScenario(target: number) {
    setTargetCGPA(target);
  }

  function saveSession() {
    if (!profileName.trim() || typeof window === 'undefined') return;
    const data = { scale, customPoints, university, levelLabel, targetCredits, semesters };
    window.localStorage.setItem(`cgpa-tracker:profile:${profileName.trim()}`, JSON.stringify(data));
    setSavedNames((prev) => {
      const next = prev.includes(profileName.trim()) ? prev : [...prev, profileName.trim()];
      window.localStorage.setItem('cgpa-tracker:profiles', JSON.stringify(next));
      return next;
    });
  }

  function loadSession(name: string) {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(`cgpa-tracker:profile:${name}`);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      setScale(data.scale ?? '5.0');
      setCustomPoints(data.customPoints ?? DEFAULT_POINTS.custom);
      setUniversity(data.university ?? '');
      setLevelLabel(data.levelLabel ?? '');
      setTargetCredits(data.targetCredits ?? 144);
      setSemesters(data.semesters ?? [newSemester(1)]);
      setProfileName(name);
    } catch {
      /* ignore malformed saved session */
    }
  }

  function deleteSession(name: string) {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(`cgpa-tracker:profile:${name}`);
    setSavedNames((prev) => {
      const next = prev.filter((n) => n !== name);
      window.localStorage.setItem('cgpa-tracker:profiles', JSON.stringify(next));
      return next;
    });
  }

  function copySummary() {
    const lines = [
      `CGPA Summary${university ? ' — ' + university : ''}`,
      `Scale: ${scale}`,
      `CGPA: ${cgpa.toFixed(2)} / ${maxPoint.toFixed(2)}`,
      classification ? `Classification: ${classification.label}` : '',
      `Total credits: ${totalCredits}`,
      `Total quality points: ${totalQP.toFixed(1)}`,
      ...semesters.map((s, i) => `${s.name}: GPA ${semesterResults[i].gpa.toFixed(2)}`),
    ].filter(Boolean);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
    }
  }

  return (
    <div className="space-y-6">
      {/* Scale selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Grading scale</label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: '5.0', label: 'Nigeria 5.0 (NUC Standard)' },
              { value: '4.0', label: '4.0 Scale' },
              { value: 'custom', label: 'Custom' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setScale(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                scale === opt.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {scale === 'custom' && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {GRADES.map((g) => (
              <div key={g}>
                <label className="block text-xs text-gray-500 mb-1">{g} points</label>
                <input
                  type="number"
                  step="0.1"
                  value={customPoints[g]}
                  onChange={(e) =>
                    setCustomPoints((prev) => ({ ...prev, [g]: Number(e.target.value) }))
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500">
          {scale === '5.0' && 'A=5.0 (70–100%), B=4.0 (60–69%), C=3.0 (50–59%), D=2.0 (45–49%), E=1.0 (40–44%), F=0 (0–39%).'}
          {scale === '4.0' && 'Common 4.0-scale mapping. Some institutions fold the D and E bands together — check your handbook for exact boundaries.'}
          {scale === 'custom' && 'Set your own grade-point values to match your institution\u2019s handbook.'}
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Student profile</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">University / Program</label>
            <input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="e.g. B.Sc Economics"
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Current level</label>
            <input
              value={levelLabel}
              onChange={(e) => setLevelLabel(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Total credits required to graduate</label>
            <input
              type="number"
              value={targetCredits}
              onChange={(e) => setTargetCredits(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Semesters */}
      <div className="space-y-4">
        {semesters.map((s, si) => (
          <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <input
                value={s.name}
                onChange={(e) => renameSemester(s.id, e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-800"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-indigo-600">GPA: {semesterResults[si].gpa.toFixed(2)}</span>
                {semesters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSemester(s.id)}
                    className="text-xs text-gray-400 hover:text-red-600"
                  >
                    Remove semester
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {s.courses.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-2">
                  <input
                    value={c.code}
                    onChange={(e) => updateCourse(s.id, c.id, { code: e.target.value })}
                    placeholder="Course code"
                    className="flex-1 min-w-[8rem] rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={c.credits}
                    onChange={(e) => updateCourse(s.id, c.id, { credits: Number(e.target.value) })}
                    className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    title="Credit units"
                  />
                  <select
                    value={c.grade}
                    title={GRADE_RANGE_LABEL[c.grade]}
                    onChange={(e) => updateCourse(s.id, c.id, { grade: e.target.value as Grade })}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm font-semibold"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g} ({points[g]})
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={c.isRetake}
                      onChange={(e) => updateCourse(s.id, c.id, { isRetake: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    Retake
                  </label>
                  <button
                    type="button"
                    onClick={() => removeCourse(s.id, c.id)}
                    className="ml-auto text-xs text-gray-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addCourse(s.id)}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Add Course
              </button>
              <button
                type="button"
                onClick={() => setBulkTarget(bulkTarget === s.id ? null : s.id)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Bulk Paste
              </button>
            </div>

            {bulkTarget === s.id && (
              <div className="mt-3">
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={'One course per line: Code,Credits,Grade\nEEE301,3,A\nMTH302,2,B'}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm h-24"
                />
                <button
                  type="button"
                  onClick={() => applyBulk(s.id)}
                  className="mt-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addSemester}
          className="rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 w-full"
        >
          + Add Semester
        </button>
      </div>

      {/* Results panel */}
      <div className="rounded-xl bg-indigo-50 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Results</h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">CGPA</p>
            <p className="text-2xl font-bold text-indigo-700">
              {cgpa.toFixed(2)} <span className="text-sm text-gray-400">/ {maxPoint.toFixed(1)}</span>
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Classification</p>
            {classification ? (
              <span className={`inline-block mt-1 rounded-md px-2 py-0.5 text-xs font-semibold ${classification.color}`}>
                {classification.label}
              </span>
            ) : (
              <p className="text-sm text-gray-500">Set by your institution</p>
            )}
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Credits earned</p>
            <p className="text-lg font-bold text-gray-800">{totalCredits}</p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Quality points</p>
            <p className="text-lg font-bold text-gray-800">{totalQP.toFixed(1)}</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Progress toward graduation credits</span>
            <span className="font-semibold text-gray-800">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white overflow-hidden">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {cgpa < 1.5 && totalCredits > 0 && (
          <div className={`rounded-lg p-3 text-sm font-medium mb-3 ${cgpa < 1.0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
            {cgpa < 1.0
              ? 'CGPA is below 1.00 — this typically triggers fail/withdrawal review at most institutions.'
              : 'CGPA is below 1.50 — this range is commonly flagged as probation risk. Check your institution\u2019s handbook.'}
          </div>
        )}

        {/* Trend */}
        {semesterResults.length > 1 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">GPA by semester</p>
            <div className="flex items-end gap-2 h-24 bg-white rounded-lg p-2">
              {semesterResults.map((r, i) => (
                <div key={r.id} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full rounded-t bg-indigo-500"
                    style={{ height: `${Math.max(4, (r.gpa / maxPoint) * 100)}%` }}
                    title={`${semesters[i].name}: ${r.gpa.toFixed(2)}`}
                  />
                  <span className="text-[10px] text-gray-400 mt-1">S{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copySummary}
            className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            Copy Summary
          </button>
          <button
            type="button"
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Projections */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Projection: what-if for remaining semesters</h3>

        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Target CGPA</label>
            <input
              type="number"
              step="0.01"
              max={maxPoint}
              value={targetCGPA}
              onChange={(e) => setTargetCGPA(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Remaining semesters</label>
            <input
              type="number"
              min={1}
              value={remainingSemesters}
              onChange={(e) => setRemainingSemesters(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Credits per remaining semester</label>
            <input
              type="number"
              min={1}
              value={creditsPerSemester}
              onChange={(e) => setCreditsPerSemester(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <button
            type="button"
            onClick={() => applyScenario(scale === '4.0' ? 3.6 : 4.5)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Scenario: First Class
          </button>
          <button
            type="button"
            onClick={() => applyScenario(scale === '4.0' ? 2.8 : 3.5)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Scenario: Second Class Upper
          </button>
          <button
            type="button"
            onClick={() => applyScenario(scale === '4.0' ? 0.8 : 1.0)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Scenario: Minimum to Graduate
          </button>
        </div>

        {requiredFutureGPA && (
          <div className={`rounded-lg p-3 text-sm ${requiredFutureGPA.achievable ? 'bg-indigo-50 text-indigo-800' : 'bg-red-100 text-red-800'}`}>
            {requiredFutureGPA.achievable ? (
              <>
                You need an average GPA of{' '}
                <span className="font-bold">{requiredFutureGPA.requiredGPA.toFixed(2)}</span> across your remaining{' '}
                {requiredFutureGPA.remainingCredits} credits to reach a {Number(targetCGPA).toFixed(2)} CGPA.
              </>
            ) : requiredFutureGPA.requiredGPA < 0 ? (
              `Your current CGPA already exceeds this target — it's achievable even with lower future grades.`
            ) : (
              `This target is not mathematically reachable on the ${maxPoint.toFixed(1)} scale with the remaining credits entered — try more remaining semesters or a lower target.`
            )}
          </div>
        )}
      </div>

      {/* Save / load */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Save session (stored on this device only)</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            placeholder="Profile name"
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={saveSession}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Save Session
          </button>
          {savedNames.length > 0 && (
            <select
              onChange={(e) => e.target.value && loadSession(e.target.value)}
              defaultValue=""
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="" disabled>
                Load saved…
              </option>
              {savedNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          )}
          {savedNames.length > 0 && (
            <button
              type="button"
              onClick={() => profileName && deleteSession(profileName)}
              className="text-xs text-gray-400 hover:text-red-600"
            >
              Delete current
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Based on NUC guidelines and common Nigerian university practices. Always verify with your institution's
        handbook, as minor variations exist (e.g., grade boundaries, weighting, retake policy). This is not
        official academic advice. Data entered here is stored only in this browser and is not sent to any server.
      </p>
    </div>
  );
}
