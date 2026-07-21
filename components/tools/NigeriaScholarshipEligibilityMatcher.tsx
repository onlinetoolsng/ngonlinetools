'use client';

import { useMemo, useState } from 'react';

/**
 * Nigeria Scholarship & Bursary Eligibility Matcher
 * Pure client-side tool component. No SEO, no schema, no registry imports.
 * Receives only { locale } — page.tsx / registry / metadata are handled elsewhere.
 *
 * Scholarship/bursary data below is a static, manually maintained snapshot.
 * Update annually from education.gov.ng, state scholarship/bursary boards,
 * and each scheme's own portal — amounts, cut-off marks, and open windows
 * change every application cycle.
 */

type Props = {
  locale: string;
};

// ─── Reference data ─────────────────────────────────────────────────────────

const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
] as const;

type Level = 'undergrad' | 'hnd' | 'nce' | 'postgrad' | 'vocational';

const LEVELS: { value: Level; label: string }[] = [
  { value: 'undergrad', label: 'Undergraduate (University, 200L and above)' },
  { value: 'hnd', label: 'HND (Polytechnic)' },
  { value: 'nce', label: 'NCE (College of Education)' },
  { value: 'postgrad', label: 'Postgraduate (MSc / PhD)' },
  { value: 'vocational', label: 'Vocational / Technical' },
];

type FieldCat =
  | 'stem' | 'medicine' | 'education' | 'social-sciences'
  | 'agriculture' | 'engineering' | 'law' | 'arts-humanities' | 'other';

const FIELDS: { value: FieldCat; label: string }[] = [
  { value: 'stem', label: 'STEM (Science, Tech, Maths)' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'medicine', label: 'Medicine & Health Sciences' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'education', label: 'Education' },
  { value: 'law', label: 'Law' },
  { value: 'social-sciences', label: 'Social Sciences' },
  { value: 'arts-humanities', label: 'Arts & Humanities' },
  { value: 'other', label: 'Other' },
];

const INSTITUTION_TYPES = ['Federal public', 'State public', 'Private'] as const;
const INCOME_BRACKETS = ['Low income', 'Middle income', 'High income', 'Prefer not to say'] as const;

// ─── Scholarship dataset ────────────────────────────────────────────────────
// Hardcode ~20 major federal, state, and corporate schemes. states/fields left
// undefined = open to all. Comment: refresh figures each admission cycle.

type Scholarship = {
  id: string;
  name: string;
  provider: 'Federal' | 'State' | 'Other';
  levels: Level[];
  states?: string[]; // full names matching STATES; omit = nationwide
  fields?: FieldCat[]; // omit = open to any field
  minCGPA?: number; // normalized to 5.0 scale
  minOLevelCredits?: number;
  publicInstitutionOnly?: boolean;
  disabilityPriority?: boolean;
  otherReqs: string[];
  amount: string;
  link: string;
  notes: string;
};

const SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'fg-nsa',
    name: 'Federal Government National Merit Scholarship Award',
    provider: 'Federal',
    levels: ['undergrad'],
    minCGPA: 3.5,
    minOLevelCredits: 5,
    publicInstitutionOnly: true,
    otherReqs: ['Full-time student', 'Federal or state public institution', 'Nigerian citizen'],
    amount: '₦75,000–₦200,000 per session (varies by year)',
    link: 'https://education.gov.ng',
    notes: 'Administered by the Federal Scholarship Board (FSB) under the Federal Ministry of Education. Applications open annually via the FSB portal.',
  },
  {
    id: 'fg-postgrad',
    name: 'Federal Government Postgraduate Scholarship',
    provider: 'Federal',
    levels: ['postgrad'],
    minCGPA: 3.5,
    publicInstitutionOnly: true,
    otherReqs: ['Admission into a Nigerian federal university postgraduate programme'],
    amount: 'Tuition support + stipend (varies by year)',
    link: 'https://education.gov.ng',
    notes: 'Administered by the Federal Scholarship Board for MSc/PhD candidates in federal universities.',
  },
  {
    id: 'ptdf-local',
    name: 'PTDF Nigerian Universities Scholarship Scheme',
    provider: 'Federal',
    levels: ['undergrad'],
    fields: ['stem', 'engineering'],
    minCGPA: 3.5,
    publicInstitutionOnly: true,
    otherReqs: ['Oil & gas relevant STEM/engineering course', 'Federal public institution'],
    amount: 'Tuition + upkeep allowance',
    link: 'https://ptdf.gov.ng',
    notes: 'Petroleum Technology Development Fund. Priority to petroleum, geology, and core engineering disciplines.',
  },
  {
    id: 'ptdf-overseas',
    name: 'PTDF Overseas Postgraduate Scholarship',
    provider: 'Federal',
    levels: ['postgrad'],
    fields: ['stem', 'engineering'],
    minCGPA: 4.0,
    otherReqs: ['Admission or intent to apply to an approved overseas university', 'Oil & gas relevant discipline'],
    amount: 'Full tuition + living stipend abroad',
    link: 'https://ptdf.gov.ng',
    notes: 'Highly competitive; application windows are short and announced on the PTDF portal.',
  },
  {
    id: 'nddc-scholarship',
    name: 'NDDC Undergraduate & Postgraduate Scholarship',
    provider: 'Federal',
    levels: ['undergrad', 'postgrad'],
    states: ['Abia', 'Akwa Ibom', 'Bayelsa', 'Cross River', 'Delta', 'Edo', 'Imo', 'Ondo', 'Rivers'],
    minCGPA: 3.0,
    otherReqs: ['Indigene of a Niger Delta state (NDDC mandate states)'],
    amount: 'Varies by cycle',
    link: 'https://nddc.gov.ng',
    notes: 'Niger Delta Development Commission scheme, restricted to indigenes of its nine mandate states.',
  },
  {
    id: 'nnpc-nnss',
    name: 'NNPC/Total National Merit Scholarship Scheme',
    provider: 'Other',
    levels: ['undergrad'],
    fields: ['stem', 'engineering', 'medicine'],
    minCGPA: 3.0,
    minOLevelCredits: 5,
    otherReqs: ['JAMB score usually required', 'Science/engineering-related course preferred'],
    amount: '₦50,000–₦100,000 per session (varies by sponsor cycle)',
    link: 'https://nnpcgroup.com',
    notes: 'Corporate-sponsored merit award; advertised annually through national newspapers and the NNPC portal.',
  },
  {
    id: 'chevron-host',
    name: 'Chevron Nigeria Host Community Scholarship',
    provider: 'Other',
    levels: ['undergrad'],
    states: ['Delta', 'Ondo', 'Lagos'],
    otherReqs: ['Indigene of a Chevron host community'],
    amount: 'Varies by cycle',
    link: 'https://chevronnigeria.com',
    notes: 'Restricted to host communities where Chevron operates; check local government liaison offices for the current cycle.',
  },
  {
    id: 'shell-host',
    name: 'Shell/SPDC Host Communities Scholarship',
    provider: 'Other',
    levels: ['undergrad'],
    states: ['Rivers', 'Bayelsa', 'Delta', 'Imo', 'Abia', 'Akwa Ibom'],
    otherReqs: ['Indigene of an SPDC host community'],
    amount: 'Varies by cycle',
    link: 'https://shell.com.ng',
    notes: 'Restricted to communities in SPDC operational areas across the Niger Delta.',
  },
  {
    id: 'mtnf-scholarship',
    name: 'MTN Foundation Scholarship Scheme',
    provider: 'Other',
    levels: ['undergrad'],
    fields: ['stem', 'engineering'],
    minCGPA: 3.5,
    publicInstitutionOnly: true,
    otherReqs: ['STEM-related course', 'Federal or state public university'],
    amount: '₦75,000–₦150,000 per session',
    link: 'https://mtnonline.com/about-us/foundation',
    notes: 'Corporate foundation scheme, application announced annually via MTN Foundation channels.',
  },
  {
    id: 'lagos-bursary',
    name: 'Lagos State Bursary Award',
    provider: 'State',
    levels: ['undergrad', 'hnd', 'nce'],
    states: ['Lagos'],
    otherReqs: ['Lagos State indigene certificate (LGA of origin)', 'Full-time student in an accredited institution'],
    amount: '₦20,000–₦50,000 per session',
    link: 'https://lagosstate.gov.ng',
    notes: 'Applications typically processed through the Lagos State Scholarship Board and local government indigeneship verification.',
  },
  {
    id: 'delta-scholarship',
    name: 'Delta State Scholarship Board Award',
    provider: 'State',
    levels: ['undergrad', 'postgrad', 'hnd', 'nce'],
    states: ['Delta'],
    otherReqs: ['Delta State indigene', 'LGA of origin endorsement'],
    amount: 'Varies by level',
    link: 'https://deltastate.gov.ng',
    notes: 'One of the more consistently run state boards, with separate windows for undergraduate and postgraduate awards.',
  },
  {
    id: 'ekiti-bursary',
    name: 'Ekiti State Bursary & Scholarship',
    provider: 'State',
    levels: ['undergrad', 'hnd', 'nce'],
    states: ['Ekiti'],
    otherReqs: ['Ekiti State indigene certificate'],
    amount: 'Varies by session',
    link: 'https://ekitistate.gov.ng',
    notes: 'Administered by the Ekiti State Scholarship and Loans Board.',
  },
  {
    id: 'anambra-scholarship',
    name: 'Anambra State Scholarship Scheme',
    provider: 'State',
    levels: ['undergrad', 'postgrad'],
    states: ['Anambra'],
    minCGPA: 3.0,
    otherReqs: ['Anambra State indigene', 'Merit-based selection'],
    amount: 'Varies by session',
    link: 'https://anambrastate.gov.ng',
    notes: 'Merit-weighted; academic performance is checked more closely than in some other state schemes.',
  },
  {
    id: 'ogun-bursary',
    name: 'Ogun State Bursary Award',
    provider: 'State',
    levels: ['undergrad', 'hnd', 'nce'],
    states: ['Ogun'],
    otherReqs: ['Ogun State indigene certificate'],
    amount: 'Varies by session',
    link: 'https://ogunstate.gov.ng',
    notes: 'Administered by the Ogun State Scholarship Board; applications usually open once per session.',
  },
  {
    id: 'rivers-bursary',
    name: 'Rivers State Scholarship & Bursary',
    provider: 'State',
    levels: ['undergrad', 'postgrad', 'hnd'],
    states: ['Rivers'],
    otherReqs: ['Rivers State indigene certificate'],
    amount: 'Varies by session',
    link: 'https://riversstate.gov.ng',
    notes: 'Separate tracks for local and overseas postgraduate study in some cycles.',
  },
  {
    id: 'kano-bursary',
    name: 'Kano State Scholarship Board Award',
    provider: 'State',
    levels: ['undergrad', 'hnd', 'nce'],
    states: ['Kano'],
    otherReqs: ['Kano State indigene certificate'],
    amount: 'Varies by session',
    link: 'https://kanostate.gov.ng',
    notes: 'Administered by the Kano State Scholarship Board.',
  },
  {
    id: 'kaduna-bursary',
    name: 'Kaduna State Bursary Award',
    provider: 'State',
    levels: ['undergrad', 'hnd', 'nce'],
    states: ['Kaduna'],
    otherReqs: ['Kaduna State indigene certificate'],
    amount: 'Varies by session',
    link: 'https://kdsg.gov.ng',
    notes: 'Administered through the Kaduna State Scholarship Board.',
  },
  {
    id: 'enugu-bursary',
    name: 'Enugu State Scholarship & Bursary',
    provider: 'State',
    levels: ['undergrad', 'hnd', 'nce'],
    states: ['Enugu'],
    otherReqs: ['Enugu State indigene certificate'],
    amount: 'Varies by session',
    link: 'https://enugustate.gov.ng',
    notes: 'Administered by the Enugu State Scholarship Board.',
  },
  {
    id: 'akwa-ibom-bursary',
    name: 'Akwa Ibom State Scholarship Board Award',
    provider: 'State',
    levels: ['undergrad', 'postgrad', 'hnd'],
    states: ['Akwa Ibom'],
    otherReqs: ['Akwa Ibom State indigene certificate'],
    amount: 'Varies by session',
    link: 'https://akwaibomstate.gov.ng',
    notes: 'Has run both local and overseas postgraduate tracks in past cycles.',
  },
  {
    id: 'osun-bursary',
    name: 'Osun State Bursary Award',
    provider: 'State',
    levels: ['undergrad', 'hnd', 'nce'],
    states: ['Osun'],
    otherReqs: ['Osun State indigene certificate'],
    amount: 'Varies by session',
    link: 'https://osunstate.gov.ng',
    notes: 'Administered by the Osun State Scholarship and Bursary Board.',
  },
  {
    id: 'education-disability-grant',
    name: 'Federal Disability-Inclusive Education Grant',
    provider: 'Federal',
    levels: ['undergrad', 'hnd', 'nce', 'postgrad'],
    disabilityPriority: true,
    otherReqs: ['Certificate/evidence of disability', 'Enrolled in an accredited Nigerian institution'],
    amount: 'Varies by cycle',
    link: 'https://education.gov.ng',
    notes: 'Reflects the federal policy reserving a share of education support slots (around 5%) for students with disabilities; confirm current cycle details with the Federal Ministry of Education.',
  },
];

// ─── Matching profile ───────────────────────────────────────────────────────

type Profile = {
  state: string;
  level: Level | '';
  fields: FieldCat[];
  cgpa: string;
  cgpaScale: '5.0' | '4.0';
  oLevelCredits: string;
  jambScore: string;
  disability: boolean;
  institutionType: (typeof INSTITUTION_TYPES)[number] | '';
  income: (typeof INCOME_BRACKETS)[number] | '';
};

const EMPTY_PROFILE: Profile = {
  state: '',
  level: '',
  fields: [],
  cgpa: '',
  cgpaScale: '5.0',
  oLevelCredits: '',
  jambScore: '',
  disability: false,
  institutionType: '',
  income: '',
};

const EXAMPLE_PROFILES: { label: string; profile: Profile }[] = [
  {
    label: 'Lagos STEM undergrad, 4.2/5.0',
    profile: {
      ...EMPTY_PROFILE,
      state: 'Lagos',
      level: 'undergrad',
      fields: ['stem'],
      cgpa: '4.2',
      cgpaScale: '5.0',
      oLevelCredits: '7',
      jambScore: '280',
      institutionType: 'Federal public',
    },
  },
  {
    label: 'Delta engineering undergrad, low income',
    profile: {
      ...EMPTY_PROFILE,
      state: 'Delta',
      level: 'undergrad',
      fields: ['engineering'],
      cgpa: '3.6',
      cgpaScale: '5.0',
      oLevelCredits: '6',
      institutionType: 'Federal public',
      income: 'Low income',
    },
  },
  {
    label: 'Rivers postgraduate, education field',
    profile: {
      ...EMPTY_PROFILE,
      state: 'Rivers',
      level: 'postgrad',
      fields: ['education'],
      cgpa: '4.4',
      cgpaScale: '5.0',
      institutionType: 'Federal public',
    },
  },
];

function normalizeCGPA(cgpa: string, scale: '5.0' | '4.0'): number | null {
  const n = parseFloat(cgpa);
  if (Number.isNaN(n) || n < 0) return null;
  if (scale === '4.0') return (n / 4.0) * 5.0;
  return n;
}

type MatchResult = {
  scholarship: Scholarship;
  percent: number;
  category: 'High' | 'Possible' | 'Low';
  matched: string[];
  missing: string[];
};

function computeMatches(profile: Profile): MatchResult[] {
  const results: MatchResult[] = [];
  const normalizedCGPA = normalizeCGPA(profile.cgpa, profile.cgpaScale);
  const oLevel = profile.oLevelCredits ? parseInt(profile.oLevelCredits, 10) : null;

  for (const s of SCHOLARSHIPS) {
    // ── Hard filters: state and level are eligibility gates, not soft score ──
    if (s.states && s.states.length > 0 && profile.state) {
      if (!s.states.includes(profile.state)) continue;
    }
    if (profile.level && !s.levels.includes(profile.level)) continue;

    const matched: string[] = [];
    const missing: string[] = [];
    let criteriaCount = 0;
    let metCount = 0;

    // State (only counts as a criterion when the scheme is state-restricted)
    if (s.states && s.states.length > 0) {
      criteriaCount++;
      if (profile.state && s.states.includes(profile.state)) {
        metCount++;
        matched.push(`${profile.state} indigene requirement met`);
      } else if (!profile.state) {
        missing.push(`Requires indigeneship of: ${s.states.join(', ')}`);
      }
    }

    // Level
    criteriaCount++;
    if (profile.level && s.levels.includes(profile.level)) {
      metCount++;
      matched.push('Study level matches');
    } else if (!profile.level) {
      missing.push('Select your level of study to confirm eligibility');
    }

    // Field of study (soft — schemes with no field list are open to all)
    if (s.fields && s.fields.length > 0) {
      criteriaCount++;
      const overlap = profile.fields.some(f => s.fields!.includes(f));
      if (overlap) {
        metCount++;
        matched.push('Field of study matches priority list');
      } else if (profile.fields.length > 0) {
        missing.push(`Prioritizes: ${s.fields.map(f => FIELDS.find(x => x.value === f)?.label ?? f).join(', ')}`);
      }
    }

    // CGPA
    if (s.minCGPA) {
      criteriaCount++;
      if (normalizedCGPA !== null && normalizedCGPA >= s.minCGPA) {
        metCount++;
        matched.push(`CGPA meets ${s.minCGPA.toFixed(1)}/5.0 minimum`);
      } else if (normalizedCGPA !== null) {
        missing.push(`Needs ≥ ${s.minCGPA.toFixed(1)}/5.0 (yours: ${normalizedCGPA.toFixed(1)}/5.0)`);
      } else {
        missing.push(`Requires minimum CGPA of ${s.minCGPA.toFixed(1)}/5.0`);
      }
    }

    // O-Level credits
    if (s.minOLevelCredits) {
      criteriaCount++;
      if (oLevel !== null && oLevel >= s.minOLevelCredits) {
        metCount++;
        matched.push(`O-Level credits meet the ${s.minOLevelCredits}-credit minimum`);
      } else {
        missing.push(`Requires at least ${s.minOLevelCredits} O-Level credits (incl. English & Maths)`);
      }
    }

    // Public institution requirement
    if (s.publicInstitutionOnly) {
      criteriaCount++;
      if (profile.institutionType === 'Federal public' || profile.institutionType === 'State public') {
        metCount++;
        matched.push('Attends a public institution');
      } else if (profile.institutionType) {
        missing.push('Open to federal/state public institutions only');
      }
    }

    // Disability priority (bonus, does not penalize)
    if (s.disabilityPriority) {
      criteriaCount++;
      if (profile.disability) {
        metCount++;
        matched.push('Disability-inclusion priority applies to you');
      } else {
        missing.push('Priority slots reserved for students with disabilities');
      }
    }

    const percent = criteriaCount === 0 ? 100 : Math.round((metCount / criteriaCount) * 100);
    const category: MatchResult['category'] = percent >= 75 ? 'High' : percent >= 40 ? 'Possible' : 'Low';

    results.push({ scholarship: s, percent, category, matched, missing: missing.slice(0, 3) });
  }

  return results.sort((a, b) => b.percent - a.percent);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function NigeriaScholarshipEligibilityMatcher({ locale }: Props) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [showResults, setShowResults] = useState(false);
  const [copied, setCopied] = useState(false);

  const matches = useMemo(() => computeMatches(profile), [profile]);
  const highMatches = matches.filter(m => m.category === 'High');
  const possibleMatches = matches.filter(m => m.category === 'Possible');
  const lowMatches = matches.filter(m => m.category === 'Low');

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile(prev => ({ ...prev, [key]: value }));
    setShowResults(true);
  }

  function toggleField(field: FieldCat) {
    setProfile(prev => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field],
    }));
    setShowResults(true);
  }

  function loadExample(p: Profile) {
    setProfile(p);
    setShowResults(true);
  }

  function reset() {
    setProfile(EMPTY_PROFILE);
    setShowResults(false);
  }

  function copySummary() {
    const lines = matches
      .filter(m => m.category !== 'Low')
      .map(m => `${m.scholarship.name} (${m.percent}% match, ${m.category}) — ${m.scholarship.link}`);
    const text = lines.length > 0 ? lines.join('\n') : 'No strong matches found for the current profile.';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="w-full space-y-6" data-locale={locale}>

      {/* Example profiles */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROFILES.map(ex => (
          <button
            key={ex.label}
            type="button"
            onClick={() => loadExample(ex.profile)}
            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
          >
            {ex.label}
          </button>
        ))}
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Reset form
        </button>
      </div>

      {/* Section 1: Background */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">1. Your background</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">State of origin</span>
            <select
              value={profile.state}
              onChange={e => update('state', e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select state</option>
              {STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-gray-500">
              Most state bursaries require an LGA-of-origin indigene certificate — have yours ready.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Level of study</span>
            <select
              value={profile.level}
              onChange={e => update('level', e.target.value as Level)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select level</option>
              {LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <span className="mb-2 block text-sm font-medium text-gray-700">Field(s) of study</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FIELDS.map(f => (
              <label key={f.value} className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={profile.fields.includes(f.value)}
                  onChange={() => toggleField(f.value)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {f.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Academic profile */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">2. Academic profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Current / last CGPA</span>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min={0}
                value={profile.cgpa}
                onChange={e => update('cgpa', e.target.value)}
                placeholder="e.g. 4.20"
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={profile.cgpaScale}
                onChange={e => update('cgpaScale', e.target.value as '5.0' | '4.0')}
                className="rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="5.0">/ 5.0</option>
                <option value="4.0">/ 4.0</option>
              </select>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              O-Level credits (WAEC/NECO, incl. English & Maths)
            </span>
            <input
              type="number"
              min={0}
              max={9}
              value={profile.oLevelCredits}
              onChange={e => update('oLevelCredits', e.target.value)}
              placeholder="e.g. 7"
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>
        </div>

        <label className="mt-4 block sm:w-1/2">
          <span className="mb-1 block text-sm font-medium text-gray-700">JAMB score (optional, undergrad only)</span>
          <input
            type="number"
            min={0}
            max={400}
            value={profile.jambScore}
            onChange={e => update('jambScore', e.target.value)}
            placeholder="e.g. 280"
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </label>
      </div>

      {/* Section 3: Other details */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">3. Other details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Institution type</span>
            <select
              value={profile.institutionType}
              onChange={e => update('institutionType', e.target.value as Profile['institutionType'])}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Select institution type</option>
              {INSTITUTION_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Family income bracket (optional)</span>
            <select
              value={profile.income}
              onChange={e => update('income', e.target.value as Profile['income'])}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Prefer not to say</option>
              {INCOME_BRACKETS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={profile.disability}
            onChange={e => update('disability', e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          I have a disability (many schemes reserve priority slots)
        </label>
      </div>

      {/* Results */}
      {showResults && (
        <div className="rounded-xl bg-indigo-50 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Your matches</h2>
            <button
              type="button"
              onClick={copySummary}
              className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              {copied ? 'Copied ✓' : 'Copy summary'}
            </button>
          </div>

          <p className="mb-4 text-sm text-gray-700">
            <span className="font-semibold text-indigo-700">{highMatches.length}</span> high match{highMatches.length === 1 ? '' : 'es'},{' '}
            <span className="font-semibold text-indigo-700">{possibleMatches.length}</span> possible,{' '}
            <span className="font-semibold text-gray-500">{lowMatches.length}</span> low fit
            {' — '}out of {matches.length} schemes checked (Federal, State, and corporate-sponsored).
          </p>

          <div className="space-y-3">
            {[...highMatches, ...possibleMatches, ...lowMatches].map(m => (
              <div key={m.scholarship.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{m.scholarship.name}</h3>
                  <span
                    className={
                      'rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
                      (m.category === 'High'
                        ? 'bg-emerald-50 text-emerald-700'
                        : m.category === 'Possible'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-500')
                    }
                  >
                    {m.category} match · {m.percent}%
                  </span>
                </div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                  {m.scholarship.provider} · {m.scholarship.amount}
                </p>

                {m.matched.length > 0 && (
                  <ul className="mb-2 space-y-0.5 text-sm text-emerald-700">
                    {m.matched.map((r, i) => <li key={i}>✓ {r}</li>)}
                  </ul>
                )}
                {m.missing.length > 0 && (
                  <ul className="mb-2 space-y-0.5 text-sm text-amber-700">
                    {m.missing.map((r, i) => <li key={i}>△ {r}</li>)}
                  </ul>
                )}

                <p className="mb-2 text-sm text-gray-600">{m.scholarship.notes}</p>
                <a
                  href={m.scholarship.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-700 hover:underline"
                >
                  Visit official portal →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400">
        This tool is informational only and does not award, process, or guarantee any scholarship. Eligibility
        is determined solely by each scheme&apos;s official board. Requirements, cut-off marks, and amounts
        change every session — always verify current details on the official portal (Federal Ministry of
        Education: education.gov.ng; your State Scholarship Board; or the scheme&apos;s own site) and prepare
        genuine supporting documents such as your LGA indigene certificate, admission letter, and transcripts
        before applying.
      </p>
    </div>
  );
}
