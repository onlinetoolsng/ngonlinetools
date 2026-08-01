'use client'

import { useMemo, useState } from 'react'

/**
 * components/tools/GhanaBeceAggregateCalculator.tsx
 *
 * Pure client-side calculator. No SEO responsibility, no schema, no
 * registry imports — the parent server component (page.tsx) owns that.
 *
 * ─── Context ────────────────────────────────────────────────────────────
 * WAEC Ghana grades the BECE on a 9-point scale (1 = best, 9 = lowest),
 * norm-referenced so exact percentage boundaries can shift slightly year
 * to year. Final subject grade blends 70% external exam with 30%
 * school-based continuous assessment. Aggregate = sum of the 4 core
 * subjects (English, Mathematics, Integrated Science, Social Studies)
 * plus the best 2 elective grades — lower aggregate is better (perfect
 * = 6, worst = 54). A grade 9 in English or Mathematics typically blocks
 * SHS placement regardless of the rest of the aggregate.
 */

type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

const GRADE_OPTIONS: Grade[] = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const GRADE_BANDS: Record<Grade, string> = {
  1: '90–100% · Highest',
  2: '80–89% · Higher',
  3: '70–79% · High',
  4: '60–69% · High Average',
  5: '50–59% · Average',
  6: '45–49% · Low Average',
  7: '40–44% · Low',
  8: '35–39% · Lower',
  9: '0–34% · Lowest / Fail',
}

const CORE_SUBJECTS = ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies'] as const

const ELECTIVE_OPTIONS = [
  'Religious & Moral Education (RME)',
  'Information & Communication Technology (ICT)',
  'French',
  'Ghanaian Language',
  'Career Technology / BDT',
  'Creative Arts & Design',
  'Physical Education',
  'Home Economics',
]

interface SubjectEntry {
  id: string
  name: string
  grade: Grade
}

let idCounter = 0
function nextId() {
  idCounter += 1
  return `bece-${idCounter}-${Date.now()}`
}

function defaultElectives(): SubjectEntry[] {
  return [
    { id: nextId(), name: ELECTIVE_OPTIONS[0], grade: 3 },
    { id: nextId(), name: ELECTIVE_OPTIONS[1], grade: 4 },
  ]
}

function gradeColor(grade: Grade): string {
  if (grade <= 3) return 'text-green-700 bg-green-50'
  if (grade <= 6) return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

function interpretAggregate(agg: number): string {
  if (agg <= 12) return 'Excellent — highly competitive for Category A schools nationwide.'
  if (agg <= 20) return 'Strong performance — competitive for most Category A/B schools.'
  if (agg <= 30) return 'Good performance — should be competitive for Category B/C schools.'
  if (agg <= 42) return 'Fair performance — likely places in Category C/D schools depending on choices.'
  return 'Below average — consider a broader spread of school choices, including Category D.'
}

// Raw score → indicative grade bands (norm-referenced boundaries shift
// slightly year to year — this uses the commonly cited standard bands).
function scoreToGrade(score: number): Grade {
  if (score >= 90) return 1
  if (score >= 80) return 2
  if (score >= 70) return 3
  if (score >= 60) return 4
  if (score >= 50) return 5
  if (score >= 45) return 6
  if (score >= 40) return 7
  if (score >= 35) return 8
  return 9
}

export default function GhanaBeceAggregateCalculator() {
  const [coreGrades, setCoreGrades] = useState<Record<string, Grade>>(
    Object.fromEntries(CORE_SUBJECTS.map(s => [s, 4 as Grade]))
  )
  const [electives, setElectives] = useState<SubjectEntry[]>(defaultElectives())
  const [showRawScore, setShowRawScore] = useState(false)
  const [rawScoreSubject, setRawScoreSubject] = useState<string>(CORE_SUBJECTS[0])
  const [rawScore, setRawScore] = useState('75')

  function updateElective(id: string, patch: Partial<SubjectEntry>) {
    setElectives(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)))
  }

  function addElective() {
    if (electives.length >= 6) return
    const used = new Set(electives.map(e => e.name))
    const nextOption = ELECTIVE_OPTIONS.find(o => !used.has(o)) ?? ELECTIVE_OPTIONS[0]
    setElectives(prev => [...prev, { id: nextId(), name: nextOption, grade: 5 }])
  }

  function removeElective(id: string) {
    setElectives(prev => prev.filter(e => e.id !== id))
  }

  const bestTwoElectives = useMemo(() => {
    return [...electives].sort((a, b) => a.grade - b.grade).slice(0, 2)
  }, [electives])

  const coreSum = CORE_SUBJECTS.reduce((sum, s) => sum + coreGrades[s], 0)
  const electivesSum = bestTwoElectives.reduce((sum, e) => sum + e.grade, 0)
  const aggregate = coreSum + electivesSum
  const hasEnoughElectives = electives.length >= 2

  const englishGrade9 = coreGrades['English Language'] === 9
  const mathGrade9 = coreGrades['Mathematics'] === 9

  const rawScoreGrade = scoreToGrade(parseFloat(rawScore) || 0)

  function copySummary() {
    const coreText = CORE_SUBJECTS.map(s => `${s}: ${coreGrades[s]}`).join(', ')
    const electiveText = bestTwoElectives.map(e => `${e.name}: ${e.grade}`).join(', ')
    const text = `BECE aggregate: ${aggregate} (Cores — ${coreText} | Best 2 electives — ${electiveText})`
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      <p className="text-sm text-gray-500">
        Select your grade (1–9) for each core subject and your electives. Aggregate uses the 4 core subjects plus
        your best 2 elective grades — a lower aggregate is better (perfect = 6, worst = 54).
      </p>

      {/* Core subjects */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Core Subjects (required)</h3>
        <div className="space-y-2">
          {CORE_SUBJECTS.map(subject => (
            <div key={subject} className="flex items-center gap-2 text-sm">
              <span className="flex-1 text-gray-700">{subject}</span>
              <select
                value={coreGrades[subject]}
                onChange={e => setCoreGrades(g => ({ ...g, [subject]: Number(e.target.value) as Grade }))}
                title={GRADE_BANDS[coreGrades[subject]]}
                className={`rounded-md border border-gray-300 px-2 py-1.5 text-sm font-semibold ${gradeColor(coreGrades[subject])}`}
              >
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Electives */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Electives / Optionals (best 2 count)</h3>
        <div className="space-y-2">
          {electives.map(e => (
            <div key={e.id} className="flex items-center gap-2 text-sm">
              <select
                value={e.name}
                onChange={ev => updateElective(e.id, { name: ev.target.value })}
                className="flex-1 min-w-[9rem] rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              >
                {ELECTIVE_OPTIONS.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <select
                value={e.grade}
                onChange={ev => updateElective(e.id, { grade: Number(ev.target.value) as Grade })}
                title={GRADE_BANDS[e.grade]}
                className={`rounded-md border border-gray-300 px-2 py-1.5 text-sm font-semibold ${gradeColor(e.grade)}`}
              >
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {bestTwoElectives.some(b => b.id === e.id) && (
                <span className="text-[11px] font-medium text-green-600">Counted</span>
              )}
              <button type="button" onClick={() => removeElective(e.id)} className="text-xs text-gray-400 hover:text-red-600" aria-label={`Remove ${e.name}`}>
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addElective}
          disabled={electives.length >= 6}
          className="mt-3 rounded-lg bg-green-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-40"
        >
          Add Elective
        </button>
        {!hasEnoughElectives && (
          <p className="mt-2 text-xs text-amber-600">Add at least 2 electives to calculate a complete aggregate.</p>
        )}
      </div>

      {/* Results */}
      <div className="rounded-xl bg-green-50 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Aggregate Summary</h3>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Core subjects total</p>
            <p className="text-lg font-bold text-gray-800">{coreSum}</p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-gray-500">Best 2 electives total</p>
            <p className="text-lg font-bold text-gray-800">{hasEnoughElectives ? electivesSum : '—'}</p>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 text-center mb-3">
          <p className="text-xs text-gray-500">Aggregate (lower is better)</p>
          <p className="text-3xl font-bold text-green-800">{hasEnoughElectives ? aggregate : '—'}</p>
          <p className="text-xs text-gray-400 mt-1">Range: 6 (perfect) – 54 (worst)</p>
        </div>

        {hasEnoughElectives && (
          <div className={`rounded-lg p-3 text-sm font-medium ${aggregate <= 30 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            {interpretAggregate(aggregate)}
          </div>
        )}

        {(englishGrade9 || mathGrade9) && (
          <p className="mt-2 text-sm text-red-700 font-medium">
            Warning: a grade 9 in {englishGrade9 && mathGrade9 ? 'English Language and Mathematics' : englishGrade9 ? 'English Language' : 'Mathematics'} typically prevents SHS placement, regardless of your aggregate.
          </p>
        )}

        <ul className="mt-3 flex flex-wrap gap-2">
          {bestTwoElectives.map(e => (
            <li key={e.id} className={`rounded-md px-2 py-1 text-xs font-medium ${gradeColor(e.grade)}`}>
              {e.name}: {e.grade} (counted)
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={copySummary}
          className="mt-4 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100"
        >
          Copy Summary
        </button>
      </div>

      {/* Raw score → grade helper */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <button type="button" onClick={() => setShowRawScore(v => !v)} className="text-sm font-semibold text-green-700">
          {showRawScore ? 'Hide' : 'Show'} Raw Score → Grade Converter
        </button>
        {showRawScore && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Subject</label>
                <select value={rawScoreSubject} onChange={e => setRawScoreSubject(e.target.value)} className="w-56 rounded-md border border-gray-300 px-2 py-1.5 text-sm">
                  {[...CORE_SUBJECTS, ...ELECTIVE_OPTIONS].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Combined score (0–100, 70% exam + 30% CA)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rawScore}
                  onChange={e => setRawScore(e.target.value)}
                  className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-sm text-gray-600">Indicative grade for {rawScoreSubject}</p>
              <p className="text-2xl font-bold text-green-700">Grade {rawScoreGrade}</p>
              <p className="text-xs text-gray-500 mt-1">{GRADE_BANDS[rawScoreGrade]}. Exact boundaries shift slightly year to year since WAEC grading is norm-referenced.</p>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        This is an unofficial estimation tool based on general publicly available WAEC BECE grading guidelines.
        Final grades blend 70% external exam with 30% school-based continuous assessment, and exact grade
        boundaries are norm-referenced, so they can shift slightly year to year. Always verify with your official
        WAEC result slip and your school. Not affiliated with WAEC or the Ghana Education Service. Figures shown
        are approximations and carry no guarantee of accuracy for SHS placement decisions.
      </p>
    </div>
  )
}
