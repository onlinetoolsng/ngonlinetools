// lib/data/kcseGrading.ts
//
// KNEC KCSE grading reference data, for the 2023-onward system (confirmed
// current in the 2025 results cycle): a candidate's mean grade is based
// on Mathematics (always mandatory), their best language (the higher of
// English, Kiswahili, or Kenyan Sign Language if taken), and their best
// 5 remaining subjects from whatever else they sat. This is the regular
// KNEC mean-grade rule only — it does not compute KUCCPS cluster points,
// which use a separate weighted 4-subject formula on top of the mean
// grade for specific course eligibility.

export const GRADE_POINTS: Record<string, number> = {
  A: 12,
  'A-': 11,
  'B+': 10,
  B: 9,
  'B-': 8,
  'C+': 7,
  C: 6,
  'C-': 5,
  'D+': 4,
  D: 3,
  'D-': 2,
  E: 1,
}

export const GRADE_OPTIONS = Object.keys(GRADE_POINTS)

export const COMMON_SUBJECTS = [
  'English',
  'Kiswahili',
  'Kenyan Sign Language',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'History and Government',
  'Geography',
  'Christian Religious Education (CRE)',
  'Islamic Religious Education (IRE)',
  'Hindu Religious Education (HRE)',
  'Agriculture',
  'Business Studies',
  'Computer Studies',
  'Home Science',
  'Art and Design',
  'French',
  'German',
  'Music',
  'Building Construction',
  'Woodwork',
  'Metalwork',
  'Electricity',
  'Aviation Technology',
]

const LANGUAGE_SUBJECTS = new Set(['English', 'Kiswahili', 'Kenyan Sign Language'])

export interface SubjectEntry {
  id: string
  name: string
  grade: string
}

export interface KCSEResult {
  selected: SubjectEntry[]
  mathIncluded: boolean
  bestLanguage: SubjectEntry | null
  totalPoints: number
  mean: number
  meanGrade: string
  insufficientSubjects: boolean
  warnings: string[]
}

// Maps a mean score (total / 7) to a mean grade using standard KNEC bands.
export function meanScoreToGrade(mean: number): string {
  if (mean >= 11.5) return 'A'
  if (mean >= 10.5) return 'A-'
  if (mean >= 9.5) return 'B+'
  if (mean >= 8.5) return 'B'
  if (mean >= 7.5) return 'B-'
  if (mean >= 6.5) return 'C+'
  if (mean >= 5.5) return 'C'
  if (mean >= 4.5) return 'C-'
  if (mean >= 3.5) return 'D+'
  if (mean >= 2.5) return 'D'
  if (mean >= 1.5) return 'D-'
  return 'E'
}

export function calculateKCSEMean(subjects: SubjectEntry[]): KCSEResult {
  const warnings: string[] = []
  const valid = subjects.filter(s => s.name.trim() && GRADE_POINTS[s.grade] !== undefined)

  const math = valid.find(s => s.name.trim().toLowerCase() === 'mathematics') ?? null
  if (!math) warnings.push('Mathematics is mandatory and was not found in your subject list.')

  const languages = valid.filter(s => LANGUAGE_SUBJECTS.has(s.name.trim()))
  const bestLanguage = languages.length
    ? languages.reduce((best, cur) => (GRADE_POINTS[cur.grade] > GRADE_POINTS[best.grade] ? cur : best))
    : null
  if (!bestLanguage) warnings.push('No language subject (English, Kiswahili, or KSL) found — one is required.')

  const usedIds = new Set<string>()
  if (math) usedIds.add(math.id)
  if (bestLanguage) usedIds.add(bestLanguage.id)

  const remaining = valid
    .filter(s => !usedIds.has(s.id))
    .sort((a, b) => GRADE_POINTS[b.grade] - GRADE_POINTS[a.grade])

  const duplicateNames = new Set<string>()
  const seen = new Set<string>()
  for (const s of valid) {
    const key = s.name.trim().toLowerCase()
    if (seen.has(key)) duplicateNames.add(s.name.trim())
    seen.add(key)
  }
  if (duplicateNames.size > 0) {
    warnings.push(`Duplicate subject(s) entered: ${Array.from(duplicateNames).join(', ')}. Only the first entry of each is used.`)
  }

  const bestFive = remaining.slice(0, 5)
  const selected = [math, bestLanguage, ...bestFive].filter((s): s is SubjectEntry => s !== null)

  const insufficientSubjects = selected.length < 7
  if (insufficientSubjects) {
    warnings.push(`Only ${selected.length} valid subject${selected.length !== 1 ? 's' : ''} selected — a full mean grade needs Mathematics, a language, and 5 other subjects (7 total).`)
  }

  const totalPoints = selected.reduce((sum, s) => sum + GRADE_POINTS[s.grade], 0)
  const mean = selected.length > 0 ? totalPoints / selected.length : 0
  const meanGrade = selected.length === 7 ? meanScoreToGrade(mean) : '—'

  return {
    selected,
    mathIncluded: !!math,
    bestLanguage,
    totalPoints,
    mean,
    meanGrade,
    insufficientSubjects,
    warnings,
  }
}
