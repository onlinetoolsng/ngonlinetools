'use client'

import { useState } from 'react'
import {
  GRADE_OPTIONS,
  GRADE_POINTS,
  COMMON_SUBJECTS,
  calculateKCSEMean,
  type SubjectEntry,
} from '@/lib/data/kcseGrading'

// ─── Context ────────────────────────────────────────────────────────────
// KNEC has used this mean-grade rule for KCSE candidates from 2023
// onward, confirmed again in the 2025 results cycle: Mathematics is
// always mandatory, the best language (the higher of English, Kiswahili,
// or Kenyan Sign Language if taken) is next, and the best 5 of the
// candidate's remaining subjects fill out the 7 that count. This tool
// follows that regular-candidate KNEC rule only — it does not compute
// KUCCPS cluster points, which use a separate weighted 4-subject formula
// on top of the mean grade for specific course eligibility, and it
// doesn't guarantee placement into any course.

let idCounter = 0
function nextId() {
  idCounter += 1
  return `subj-${idCounter}`
}

function makeEmptyRow(): SubjectEntry {
  return { id: nextId(), name: '', grade: 'B' }
}

const SAMPLE_SUBJECTS: SubjectEntry[] = [
  { id: 'sample-1', name: 'Mathematics', grade: 'B-' },
  { id: 'sample-2', name: 'English', grade: 'B+' },
  { id: 'sample-3', name: 'Kiswahili', grade: 'B' },
  { id: 'sample-4', name: 'Biology', grade: 'A-' },
  { id: 'sample-5', name: 'Chemistry', grade: 'B+' },
  { id: 'sample-6', name: 'Physics', grade: 'B' },
  { id: 'sample-7', name: 'Geography', grade: 'B-' },
  { id: 'sample-8', name: 'Business Studies', grade: 'C+' },
]

export function KCSEMeanGradeCalculator(_props: { locale: string }) {
  const [subjects, setSubjects] = useState<SubjectEntry[]>([
    makeEmptyRow(), makeEmptyRow(), makeEmptyRow(), makeEmptyRow(),
    makeEmptyRow(), makeEmptyRow(), makeEmptyRow(),
  ])

  const result = calculateKCSEMean(subjects)
  const selectedIds = new Set(result.selected.map(s => s.id))

  const updateSubject = (id: string, patch: Partial<SubjectEntry>) => {
    setSubjects(rows => rows.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }

  const addSubject = () => setSubjects(rows => [...rows, makeEmptyRow()])
  const removeSubject = (id: string) => setSubjects(rows => rows.filter(r => r.id !== id))
  const loadSample = () => setSubjects(SAMPLE_SUBJECTS.map(s => ({ ...s, id: nextId() })))
  const reset = () => setSubjects([makeEmptyRow(), makeEmptyRow(), makeEmptyRow(), makeEmptyRow(), makeEmptyRow(), makeEmptyRow(), makeEmptyRow()])

  const copyResult = () => {
    const lines = result.selected.map(s => `${s.name}: ${s.grade} (${GRADE_POINTS[s.grade]})`).join(', ')
    navigator.clipboard.writeText(`KCSE Mean Grade — Selected 7: ${lines} | Total: ${result.totalPoints}/84 | Mean: ${result.mean.toFixed(2)} | Mean Grade: ${result.meanGrade}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button type="button" onClick={loadSample} className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
          Load sample
        </button>
        <button type="button" onClick={reset} className="text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
          Reset
        </button>
      </div>

      {/* Subject rows */}
      <div className="space-y-2">
        {subjects.map(row => {
          const isSelected = selectedIds.has(row.id)
          return (
            <div key={row.id} className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${isSelected ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
              <input
                type="text"
                list="kcse-subject-options"
                value={row.name}
                onChange={e => updateSubject(row.id, { name: e.target.value })}
                placeholder="Subject name"
                className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400"
              />
              <select
                value={row.grade}
                onChange={e => updateSubject(row.id, { grade: e.target.value })}
                className="rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400"
              >
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>{g} ({GRADE_POINTS[g]})</option>
                ))}
              </select>
              <button type="button" onClick={() => removeSubject(row.id)} className="text-gray-400 hover:text-red-600 text-sm px-1" aria-label="Remove subject">
                ✕
              </button>
            </div>
          )
        })}
        <datalist id="kcse-subject-options">
          {COMMON_SUBJECTS.map(s => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>

      <button type="button" onClick={addSubject} className="w-full border border-dashed border-gray-300 text-gray-500 text-sm font-medium py-2.5 rounded-xl hover:border-indigo-300 hover:text-indigo-700 transition-colors">
        + Add subject
      </button>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="space-y-1.5">
          {result.warnings.map((w, i) => (
            <p key={i} className="text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-700 border border-amber-100">{w}</p>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Selected 7 subjects</p>
        {result.selected.length > 0 ? (
          <ul className="text-sm text-gray-700 space-y-1">
            {result.selected.map(s => (
              <li key={s.id} className="flex justify-between">
                <span>{s.name}</span>
                <span className="font-medium">{s.grade} ({GRADE_POINTS[s.grade]})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">Enter your subjects and grades above.</p>
        )}
        <dl className="space-y-2 text-sm border-t border-indigo-100 pt-3">
          <div className="flex justify-between">
            <dt className="text-gray-500">Total points</dt>
            <dd className="font-medium text-gray-800">{result.totalPoints} / 84</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Mean score</dt>
            <dd className="font-medium text-gray-800">{result.selected.length > 0 ? result.mean.toFixed(2) : '—'}</dd>
          </div>
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Mean Grade</dt>
            <dd className="font-bold text-indigo-700 text-2xl">{result.meanGrade}</dd>
          </div>
        </dl>
        {result.meanGrade !== '—' && (
          <p className="text-xs text-gray-500">
            {GRADE_POINTS[result.meanGrade] >= 7
              ? 'C+ and above is generally the minimum mean grade considered for public university degree placement via KUCCPS — specific courses may require higher, and use weighted cluster points on top of this mean grade.'
              : 'Below C+, options generally shift toward diploma and certificate-level courses, though this varies by institution — check KUCCPS for what your mean grade qualifies you for.'}
          </p>
        )}
        <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">How this is calculated</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Mathematics always counts, if present in your subject list.</li>
          <li>Your best language grade counts next — the highest of English, Kiswahili, or Kenyan Sign Language.</li>
          <li>Your best 5 remaining subjects (by grade) fill out the 7 that count toward your mean.</li>
          <li>This tool computes the regular-candidate KNEC mean grade only — it does not calculate KUCCPS cluster points, which use a separate weighted 4-subject formula for specific course eligibility.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          For guidance only — always confirm your official mean grade on your KNEC result slip, and check KUCCPS directly for course-specific eligibility and cluster points.
        </p>
      </div>
    </div>
  )
}
