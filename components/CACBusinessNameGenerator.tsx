'use client'

import { useMemo, useState } from 'react'

type BusinessType = 'business-name' | 'company' | 'incorporated-trustee'
type NatureOfBusiness =
  | 'retail'
  | 'ict'
  | 'services'
  | 'agriculture'
  | 'logistics'
  | 'fashion'
  | 'food'
  | 'consulting'
  | 'construction'
  | 'other'

type FlagLevel = 'clean' | 'caution' | 'prohibited'

interface GeneratedName {
  id: string
  name: string
  flagLevel: FlagLevel
  flagReasons: string[]
  rationale: string
  simulated?: {
    available: boolean
    checkedAt: number
  }
}

const SUFFIXES = [
  'Ventures',
  'Enterprises',
  'Solutions',
  'Hub',
  'Concepts',
  'Nigeria',
  'Africa',
  'Global',
  'Plus',
  'Elite',
  'Smart',
  'Pro',
  '& Co',
  'Resources',
  'Konsult',
  'Networks',
]

const LOCATION_TAGS = ['Lagos', 'Abuja', 'Naija', 'Nigeria', 'Africa']

const COMPANY_SUFFIX_BY_TYPE: Record<BusinessType, string[]> = {
  'business-name': ['Ventures', 'Enterprises', 'Concepts', 'Global', 'Solutions'],
  company: ['Ltd', 'Limited', 'Nigeria Ltd'],
  'incorporated-trustee': ['Foundation', 'Initiative', 'Trust', 'Assembly'],
}

const NATURE_OPTIONS: { value: NatureOfBusiness; label: string }[] = [
  { value: 'retail', label: 'Retail / Trading' },
  { value: 'ict', label: 'ICT / Tech' },
  { value: 'services', label: 'General Services' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'logistics', label: 'Logistics / Haulage' },
  { value: 'fashion', label: 'Fashion / Apparel' },
  { value: 'food', label: 'Food / Catering' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'construction', label: 'Construction / Real Estate' },
  { value: 'other', label: 'Other' },
]

// Restricted words — CAMA 2020 / CAC guidelines require consent from CAC or a
// sector regulator before these can appear in a registered name. Not exhaustive —
// re-check the current CAC guidelines periodically.
const RESTRICTED_WORDS = [
  'federal',
  'national',
  'regional',
  'state',
  'government',
  'municipal',
  'chartered',
  'cooperative',
  'group',
  'holding',
  'holdings',
  'bank',
  'insurance',
  'finance',
  'financial',
  'trust',
  'building society',
  'university',
  'polytechnic',
  'assurance',
]

// Prohibited/blocked patterns under CAMA 2020 s.852 — identical/deceptively similar
// names, misleading names, or names implying government/chamber of commerce backing
// (outside LTD/GTE entities).
const PROHIBITED_PATTERNS = ['chamber of commerce', 'central bank', 'cbn', 'efcc', 'ndlea', 'nnpc']

// A small hardcoded list of well-known Nigerian brand names to flag as
// "likely deceptively similar" — not a substitute for the official CAC search.
const HIGH_PROFILE_NAMES = [
  'dangote',
  'gtbank',
  'gtco',
  'access bank',
  'zenith',
  'mtn',
  'globacom',
  'glo',
  'jumia',
  'flutterwave',
  'paystack',
  'bua',
]

function titleCase(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

function sanitize(input: string): string {
  return input.replace(/[^a-zA-Z0-9&\s-]/g, '').trim()
}

// Simple seeded PRNG (mulberry32) so "simulated" availability is repeatable
// for the same name within a session, rather than re-randomizing on every render.
function seededRandom(seed: number): number {
  let t = (seed += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

function evaluateName(name: string): { flagLevel: FlagLevel; reasons: string[] } {
  const lower = name.toLowerCase()
  const reasons: string[] = []
  let level: FlagLevel = 'clean'

  for (const pattern of PROHIBITED_PATTERNS) {
    if (lower.includes(pattern)) {
      reasons.push(`Contains "${pattern}" — likely prohibited or requires special regulatory clearance.`)
      level = 'prohibited'
    }
  }

  for (const brand of HIGH_PROFILE_NAMES) {
    if (lower.includes(brand)) {
      reasons.push(`Resembles an existing well-known registered name ("${brand}") — high rejection risk for similarity.`)
      level = 'prohibited'
    }
  }

  if (level !== 'prohibited') {
    for (const word of RESTRICTED_WORDS) {
      if (lower.includes(word)) {
        reasons.push(`Contains restricted word "${word}" — needs CAC consent or sector-regulator approval.`)
        if (level === 'clean') level = 'caution'
      }
    }
  }

  const wordsOnly = name.replace(/[^a-zA-Z\s]/g, '').trim()
  if (wordsOnly.length > 0 && wordsOnly.split(/\s+/).length <= 1) {
    reasons.push('Single generic word — CAC often rejects names that are too short or non-distinctive.')
    if (level === 'clean') level = 'caution'
  }

  return { flagLevel: level, reasons }
}

function buildRationale(keyword: string, suffix: string, nature?: NatureOfBusiness): string {
  const natureLabel = NATURE_OPTIONS.find((n) => n.value === nature)?.label
  if (natureLabel && natureLabel !== 'Other') {
    return `Descriptive ("${keyword}") + "${suffix}" signals ${natureLabel.toLowerCase()} activity — helps with recall and CAC's descriptiveness expectations.`
  }
  return `Combines "${keyword}" with "${suffix}" for a distinctive, locally-recognisable name.`
}

function generateNames(
  keywords: string[],
  businessType: BusinessType,
  nature: NatureOfBusiness | undefined,
  seedSalt: number
): GeneratedName[] {
  const cleanKeywords = keywords.map((k) => titleCase(sanitize(k))).filter(Boolean)
  if (cleanKeywords.length === 0) return []

  const suffixPool = [...COMPANY_SUFFIX_BY_TYPE[businessType], ...SUFFIXES]
  const combos = new Set<string>()
  const results: GeneratedName[] = []

  let attempt = 0
  while (combos.size < 16 && attempt < 200) {
    attempt++
    const k1 = cleanKeywords[Math.floor(seededRandom(seedSalt + attempt) * cleanKeywords.length)]
    const useTwo = cleanKeywords.length > 1 && seededRandom(seedSalt + attempt * 7) > 0.5
    const k2 = useTwo
      ? cleanKeywords[Math.floor(seededRandom(seedSalt + attempt * 13) * cleanKeywords.length)]
      : undefined
    const useLocation = seededRandom(seedSalt + attempt * 3) > 0.7
    const location = useLocation
      ? LOCATION_TAGS[Math.floor(seededRandom(seedSalt + attempt * 5) * LOCATION_TAGS.length)]
      : undefined
    const suffix = suffixPool[Math.floor(seededRandom(seedSalt + attempt * 11) * suffixPool.length)]

    const parts = [k1, k2, location, suffix].filter(Boolean) as string[]
    const candidate = parts.join(' ')
    if (candidate === k1) continue
    if (combos.has(candidate)) continue
    combos.add(candidate)

    const { flagLevel, reasons } = evaluateName(candidate)
    results.push({
      id: `${candidate}-${attempt}`,
      name: candidate,
      flagLevel,
      flagReasons: reasons,
      rationale: buildRationale(k1, suffix, nature),
    })
  }

  return results
}

const FLAG_STYLES: Record<FlagLevel, string> = {
  clean: 'bg-green-50 text-green-700 border-green-200',
  caution: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  prohibited: 'bg-red-50 text-red-700 border-red-200',
}

const FLAG_LABELS: Record<FlagLevel, string> = {
  clean: 'Clean',
  caution: 'Restricted / Caution',
  prohibited: 'Likely Prohibited',
}

type Tab = 'generator' | 'guidelines' | 'process' | 'tips'

export default function CACBusinessNameGenerator({ locale }: { locale: string }) {
  const [keywordInput, setKeywordInput] = useState('')
  const [businessType, setBusinessType] = useState<BusinessType>('business-name')
  const [nature, setNature] = useState<NatureOfBusiness>('services')
  const [names, setNames] = useState<GeneratedName[]>([])
  const [seedSalt, setSeedSalt] = useState(1)
  const [tab, setTab] = useState<Tab>('generator')
  const [copiedAll, setCopiedAll] = useState(false)

  const keywords = useMemo(
    () =>
      keywordInput
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 3),
    [keywordInput]
  )

  function handleGenerate() {
    const results = generateNames(keywords, businessType, nature, seedSalt)
    setNames(results)
    setSeedSalt((s) => s + 1)
  }

  function handleGenerateMore() {
    setSeedSalt((s) => s + 100)
    const results = generateNames(keywords, businessType, nature, seedSalt + 100)
    setNames(results)
  }

  function handleSimulate(id: string) {
    setNames((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n
        const roll = seededRandom(hashString(n.name))
        return {
          ...n,
          simulated: {
            available: roll < 0.7, // ~60-80% "available" band, seeded per name
            checkedAt: Date.now(),
          },
        }
      })
    )
  }

  function handleCopy(name: string) {
    navigator.clipboard?.writeText(name)
  }

  function handleCopyAll() {
    const text = names.map((n) => n.name).join('\n')
    navigator.clipboard?.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }

  function handleDownloadCsv() {
    const rows = ['Name,Flag,Reasons', ...names.map((n) => `"${n.name}","${FLAG_LABELS[n.flagLevel]}","${n.flagReasons.join(' | ').replace(/"/g, "'")}"`)]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cac-name-suggestions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Prominent disclaimer — always visible */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Disclaimer:</strong> This is a simulation/generator for educational purposes only.
        Final availability and approval are determined solely by the Corporate Affairs Commission
        (CAC) on their official portal. Use at your own risk. Always confirm on the official CAC
        public search before proceeding.
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            { id: 'generator', label: 'Generator' },
            { id: 'guidelines', label: 'Guidelines' },
            { id: 'process', label: 'Real Process' },
            { id: 'tips', label: 'Name Tips' },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              tab === t.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'generator' && (
        <div className="space-y-6">
          {/* Input section */}
          <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Keywords (1–3, comma-separated)
              </label>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="e.g. Tech, Lagos, Foods"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business type</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="business-name">Business Name</option>
                  <option value="company">Company</option>
                  <option value="incorporated-trustee">Incorporated Trustee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nature of business (optional)
                </label>
                <select
                  value={nature}
                  onChange={(e) => setNature(e.target.value as NatureOfBusiness)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {NATURE_OPTIONS.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={keywords.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Generate Names
            </button>
          </div>

          {/* Results */}
          {names.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  {names.length} suggestions
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyAll}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    {copiedAll ? 'Copied!' : 'Copy all'}
                  </button>
                  <button
                    onClick={handleDownloadCsv}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={handleGenerateMore}
                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                  >
                    Generate more
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {names.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{n.name}</span>
                      <span
                        className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${FLAG_STYLES[n.flagLevel]}`}
                      >
                        {FLAG_LABELS[n.flagLevel]}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">{n.rationale}</p>

                    {n.flagReasons.length > 0 && (
                      <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
                        {n.flagReasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}

                    <div className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900">
                      {n.simulated ? (
                        <span>
                          {n.simulated.available ? 'Likely Available (Simulation)' : 'Likely Taken (Simulation)'}
                          {' — '}
                          <a
                            href={`https://search.cac.gov.ng/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Check Officially →
                          </a>
                        </span>
                      ) : (
                        <span className="text-indigo-700/70">Not yet checked</span>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleCopy(n.name)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleSimulate(n.id)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
                      >
                        Simulate Availability
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 pt-2">
                Approximation notice: availability results shown here are randomly simulated for
                demonstration and are not connected to CAC's live database. They do not reflect real
                registration status.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'guidelines' && (
        <div className="rounded-2xl border border-gray-200 p-5 space-y-4 text-sm text-gray-700">
          <h3 className="font-semibold text-gray-900">CAMA 2020 name rules (summary)</h3>
          <p>
            Under the Companies and Allied Matters Act 2020 (CAMA 2020), primarily Section 852, the
            Corporate Affairs Commission (CAC) will refuse a name that is identical or deceptively
            similar to an existing registered entity, that implies government or Chamber of Commerce
            backing (outside LTD/GTE entities), that is offensive or misleading as to activity,
            nationality, race, or religion, or that is otherwise contrary to public policy.
          </p>

          <div>
            <h4 className="font-medium text-gray-900 mb-1">Restricted words (need consent/approval)</h4>
            <p className="text-gray-500">
              {RESTRICTED_WORDS.map((w) => titleCase(w)).join(', ')} — and similar words implying scale,
              government affiliation, or a regulated sector (banking, insurance, finance).
            </p>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-1">Common rejection reasons</h4>
            <ul className="list-disc list-inside text-gray-500 space-y-1">
              <li>Exact, phonetic, or visual similarity to an already-registered name</li>
              <li>Name is too generic or a single common word (e.g. "Trading")</li>
              <li>Use of a restricted word without the required regulator consent</li>
              <li>Name misleads as to the nature or scale of the business</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'process' && (
        <div className="rounded-2xl border border-gray-200 p-5 space-y-4 text-sm text-gray-700">
          <h3 className="font-semibold text-gray-900">Real CAC registration flow</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Name search:</strong> Search the proposed name on the official CAC public search
              or the CRP/CAP portal to check availability.
            </li>
            <li>
              <strong>Reservation:</strong> Pay the applicable fee and submit for reservation. Historic
              fees have ranged roughly ₦500–₦1,000 — confirm the current amount on the official CAC
              site before paying anything.
            </li>
            <li>
              <strong>Approval code:</strong> Once approved, CAC issues an availability/reservation
              code. Reservations are typically valid for 60 days from approval.
            </li>
            <li>
              <strong>Registration:</strong> Complete the registration application (business name,
              company, or incorporated trustee form) with required documents before the reservation
              lapses.
            </li>
          </ol>
          <p className="text-gray-500">
            Do this only on the official CAC portals: pre.cac.gov.ng or icrp.cac.gov.ng. This tool does
            not submit anything to CAC on your behalf.
          </p>
        </div>
      )}

      {tab === 'tips' && (
        <div className="rounded-2xl border border-gray-200 p-5 space-y-3 text-sm text-gray-700">
          <h3 className="font-semibold text-gray-900">Name tips for Nigeria</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li>Favour distinctive, descriptive names over single generic words</li>
            <li>Pair a keyword with a locally recognisable qualifier (Ventures, Enterprises, Global)</li>
            <li>Avoid restricted words unless you have the relevant regulator's consent lined up</li>
            <li>Check matching domain and social handle availability separately, before you commit</li>
            <li>Always confirm on the official CAC public search — this generator is a starting point, not a verdict</li>
          </ul>
        </div>
      )}
    </div>
  )
}
