'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Regulatory context (informational only — this is not legal advice) ───
// Source: CAC's official downloadable fee schedule (cac.gov.ng/api/download-
// fees), supplied directly by the site owner — this supersedes the earlier
// version of this file, which relied on third-party compliance-firm guides
// that turned out to disagree with the official schedule on several line
// items (in some cases by 2-4x). CAMA 2020, Part B/E/F.
//
// Name reservation: ₦500 standard, ₦5,000 for restricted words/Ltd/Gte
// suffixes — applies across all entity types.
// Business Name: ₦10,000 registration + CTC.
// Company Limited by Guarantee: ₦20,000 flat (includes CTC of first
// incorporation documents).
// Private/Public Company Limited by Shares — tiered by issued share
// capital, identical for "Small Company" and "Private other than small":
//   ≤ ₦1,000,000: ₦10,000 (Small/Private) / ₦20,000 (Public)
//   > ₦1,000,000 up to ₦500,000,000: ₦5,000 per ₦1,000,000 or part thereof
//     (Small/Private) / ₦10,000 per ₦1,000,000 (Public)
//   > ₦500,000,000: ₦7,500 per ₦1,000,000 or part thereof (Small/Private) /
//     ₦15,000 per ₦1,000,000 (Public)
// Incorporated Trustees: ₦5,000 name reservation + ₦35,000 registration/CTC.
// FIRS stamp duty (0.75% of share capital) and the Remita/portal transaction
// fee are NOT CAC fees and do not appear on this schedule — kept here as
// separately-labeled estimates. A CAC "AI service charge" reported by some
// 2026 news coverage also does not appear on this official schedule, so it
// is not included in the total, only mentioned as a footnote.

type StructureType = 'business-name' | 'private-company' | 'clg' | 'incorporated-trustees'

interface StructureConfig {
  label: string
  shortLabel: string
  hasShareCapital: boolean
  nameReservationFee: number
  restrictedNameReservationFee: number
  baseRegistrationFee: number
  timelineText: string
  liability: string
  bestFor: string
  requirements: string[]
}

const REMITA_PORTAL_FEE = 161
const STAMP_DUTY_RATE = 0.0075

/** Tiered CAC registration fee for private companies, per the official schedule. */
function privateCompanyRegistrationFee(shareCapital: number): number {
  if (shareCapital <= 1_000_000) return 10_000
  if (shareCapital <= 500_000_000) {
    return Math.ceil(shareCapital / 1_000_000) * 5_000
  }
  return Math.ceil(shareCapital / 1_000_000) * 7_500
}

const STRUCTURE_CONFIG: Record<StructureType, StructureConfig> = {
  'business-name': {
    label: 'Business Name (Sole Proprietorship / Partnership)',
    shortLabel: 'Business Name',
    hasShareCapital: false,
    nameReservationFee: 500,
    restrictedNameReservationFee: 5_000,
    baseRegistrationFee: 10_000,
    timelineText: '1–7 working days (often same-day to 72 hours online)',
    liability: 'Unlimited — you are personally liable for business debts',
    bestFor: 'Sole traders, freelancers, and small local businesses wanting the fastest, cheapest start',
    requirements: [
      'Valid ID (NIN, BVN, or international passport)',
      'Proposed business name (1–2 backup options)',
      'Business/registered address in Nigeria',
      'Nature of business description',
    ],
  },
  'private-company': {
    label: 'Private Company Limited by Shares',
    shortLabel: 'Private Ltd',
    hasShareCapital: true,
    nameReservationFee: 500,
    restrictedNameReservationFee: 5_000,
    baseRegistrationFee: 10_000, // overridden by privateCompanyRegistrationFee()
    timelineText: '3–14 working days',
    liability: 'Limited — shareholders only risk the amount they invested in shares',
    bestFor: 'Businesses planning to scale, raise investment, or bring on multiple shareholders',
    requirements: [
      'Memorandum & Articles of Association',
      'Director and shareholder details (min. 1 of each — can be the same person)',
      'Share capital and shareholding allocation',
      'Registered office address in Nigeria (not a P.O. Box)',
      'Persons with Significant Control (PSC) disclosure — mandatory at incorporation since 2026',
    ],
  },
  'clg': {
    label: 'Company Limited by Guarantee',
    shortLabel: 'Company Ltd. by Guarantee',
    hasShareCapital: false,
    nameReservationFee: 5_000,
    restrictedNameReservationFee: 5_000,
    baseRegistrationFee: 20_000,
    timelineText: 'Several weeks — requires Attorney General of the Federation approval before incorporation (typically adds 30–90 days on top of normal processing)',
    liability: 'Limited — no share capital; members\u2019 liability is capped by their guarantee amount',
    bestFor: 'Non-profits, professional bodies, and think tanks needing corporate legal status without shareholders',
    requirements: [
      'Memorandum & Articles of Association (no share capital clause)',
      'Details of at least 2 guarantors/members',
      'Attorney General of the Federation approval (separate step, before CAC filing)',
      'Registered office address in Nigeria',
    ],
  },
  'incorporated-trustees': {
    label: 'Incorporated Trustees (NGO / Association)',
    shortLabel: 'Incorporated Trustees',
    hasShareCapital: false,
    nameReservationFee: 5_000,
    restrictedNameReservationFee: 5_000,
    baseRegistrationFee: 35_000,
    timelineText: '6–8 weeks — includes a mandatory 28-day newspaper publication and public objection period',
    liability: 'N/A — non-profit structure, no shareholders or share capital',
    bestFor: 'NGOs, churches, mosques, foundations, and community or alumni associations',
    requirements: [
      'Constitution/rules of the association',
      'Details of at least 2 trustees',
      'Two newspaper publications of the proposed registration',
      'Registered office address in Nigeria',
    ],
  },
}

const FEE_LOOKUP: { id: string; label: string; fee: string }[] = [
  { id: 'name-standard', label: 'Name reservation (standard)', fee: '₦500' },
  { id: 'name-restricted', label: 'Name reservation (restricted word/suffix)', fee: '₦5,000' },
  { id: 'annual-returns-bn', label: 'Annual returns — Business Name (per filing)', fee: '₦3,000' },
  { id: 'annual-returns-co', label: 'Annual returns — Small/Private Company (per filing)', fee: '₦5,000' },
  { id: 'annual-returns-public', label: 'Annual returns — Public Company (per filing)', fee: '₦10,000' },
  { id: 'ctc', label: 'Certified True Copy of documents/extract', fee: '₦5,000 each' },
  { id: 'striking-off-bn', label: 'Voluntary striking-off (business name)', fee: '₦10,000' },
  { id: 'striking-off-small', label: 'Voluntary striking-off (small company)', fee: '₦25,000' },
  { id: 'striking-off-other', label: 'Voluntary striking-off (private, other than small / Ltd-Gte)', fee: '₦50,000' },
  { id: 'striking-off-public', label: 'Voluntary striking-off (public company)', fee: '₦100,000' },
  { id: 'relisting-small', label: 'Relisting (small company)', fee: '₦25,000' },
  { id: 'relisting-other', label: 'Relisting (private, other than small / Ltd-Gte)', fee: '₦50,000' },
  { id: 'relisting-public', label: 'Relisting (public company)', fee: '₦100,000' },
  { id: 'due-diligence', label: 'Due diligence search (self-service)', fee: '₦50,000' },
  { id: 'director-address', label: 'Restriction of director\u2019s residential address', fee: '₦25,000 (₦50,000 for public companies)' },
  { id: 'change-of-name-bn', label: 'Change of name (business name)', fee: '₦10,000' },
  { id: 'change-of-name-co', label: 'Change of name (private company / Ltd-Gte)', fee: '₦20,000 (₦10,000 for small companies)' },
]

function formatNaira(value: number) {
  return `₦${Math.round(Math.max(0, value)).toLocaleString('en-NG')}`
}

function num(value: string) {
  const n = parseFloat(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function NigeriaCACRegistrationCalculator(_props: { locale: string }) {
  const [structure, setStructure] = useState<StructureType>('business-name')
  const [shareCapital, setShareCapital] = useState('1000000')
  const [restrictedName, setRestrictedName] = useState(false)
  const [lookupId, setLookupId] = useState(FEE_LOOKUP[0].id)
  const [copied, setCopied] = useState(false)

  const config = STRUCTURE_CONFIG[structure]

  const result = useMemo(() => {
    const capital = config.hasShareCapital ? Math.max(num(shareCapital), 1_000_000) : 0

    const nameReservationFee = restrictedName
      ? config.restrictedNameReservationFee
      : config.nameReservationFee

    const registrationFee = config.hasShareCapital
      ? privateCompanyRegistrationFee(capital)
      : config.baseRegistrationFee

    const stampDuty = config.hasShareCapital ? capital * STAMP_DUTY_RATE : 0

    const total = nameReservationFee + registrationFee + stampDuty + REMITA_PORTAL_FEE

    return { capital, nameReservationFee, registrationFee, stampDuty, total }
  }, [structure, shareCapital, restrictedName, config])

  const copySummary = () => {
    const text = `${config.label} — Estimated CAC registration cost: ${formatNaira(result.total)} (name reservation ${formatNaira(result.nameReservationFee)} + registration ${formatNaira(result.registrationFee)}${result.stampDuty > 0 ? ` + stamp duty ${formatNaira(result.stampDuty)}` : ''} + portal fee ${formatNaira(REMITA_PORTAL_FEE)}). Estimate only — verify on the CAC portal.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lookupItem = FEE_LOOKUP.find(f => f.id === lookupId) ?? FEE_LOOKUP[0]

  return (
    <div className="space-y-6">
      {/* Disclaimer banner — always visible */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Estimate only, not official pricing.</strong> Figures are based on the CAC&apos;s
          published fee schedule, but rates and processes can change. Confirm the exact, current fee on
          the official CAC portal (pre.cac.gov.ng) before paying anything. A separate CAC &quot;AI service
          charge&quot; has been reported in the news but does not appear on the current fee schedule, so it
          is not included in the total below — budget a small buffer for it just in case.
        </p>
      </div>

      {/* Structure selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Structure</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.entries(STRUCTURE_CONFIG) as [StructureType, StructureConfig][]).map(([value, cfg]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStructure(value)}
              className={`text-left py-3 px-4 rounded-xl text-sm font-medium border transition ${
                structure === value
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cfg.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Share capital (private company only) */}
      {config.hasShareCapital && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Share Capital</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatNumberInput(shareCapital)}
            onChange={e => setShareCapital(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="1,000,000"
          />
          <div className="flex gap-2 mt-2">
            {[100_000, 1_000_000, 5_000_000, 10_000_000].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setShareCapital(String(preset))}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                {formatNaira(preset)}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-gray-500">
            Minimum issued share capital for a private company is ₦100,000 under CAMA 2020, but ₦1,000,000
            is the practical minimum most startups use. Fees below ₦1,000,000 are calculated at the same
            base tier as ₦1,000,000.
          </p>
        </div>
      )}

      {/* Restricted name toggle */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={restrictedName}
          onChange={e => setRestrictedName(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-700">
          My proposed name uses a restricted word or suffix (e.g. &quot;Nigeria&quot;, &quot;Federal&quot;, &quot;Group&quot;) —
          restricted names cost ₦5,000 to reserve instead of the standard fee.
        </span>
      </label>

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <div className="flex justify-between text-sm text-indigo-900">
          <span>Name reservation</span>
          <span className="font-semibold">{formatNaira(result.nameReservationFee)}</span>
        </div>
        <div className="flex justify-between text-sm text-indigo-900">
          <span>Registration fee{config.hasShareCapital ? ` (${formatNaira(result.capital)} share capital)` : ''}</span>
          <span className="font-semibold">{formatNaira(result.registrationFee)}</span>
        </div>
        {result.stampDuty > 0 && (
          <div className="flex justify-between text-sm text-indigo-900">
            <span>FIRS stamp duty (0.75% of share capital)</span>
            <span className="font-semibold">{formatNaira(result.stampDuty)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-indigo-900">
          <span>Remita/portal transaction fee (est.)</span>
          <span className="font-semibold">{formatNaira(REMITA_PORTAL_FEE)}</span>
        </div>
        <div className="flex justify-between border-t border-indigo-200 pt-3">
          <span className="font-bold text-indigo-900">Estimated Total (official CAC fee schedule + stamp duty)</span>
          <span className="text-2xl font-black text-indigo-900">{formatNaira(result.total)}</span>
        </div>
        <p className="text-xs text-indigo-700">
          Excludes agent/professional fees, which typically add ₦15,000–₦220,000 depending on complexity
          and whether you DIY or use a lawyer/accredited agent.
        </p>
      </div>

      {/* Timeline */}
      <div className="border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Typical Timeline</p>
        <p className="text-sm text-gray-600">{config.timelineText}</p>
      </div>

      {/* Requirements */}
      <div className="border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">What You&apos;ll Need</p>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
          {config.requirements.map(req => <li key={req}>{req}</li>)}
        </ul>
      </div>

      {/* Comparison table */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <p className="text-sm font-semibold text-gray-700 px-4 pt-4 pb-2">Business Name vs. Private Ltd — Quick Comparison</p>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2.5 text-gray-500 w-1/3">Liability</td>
              <td className="px-4 py-2.5 text-gray-700">{STRUCTURE_CONFIG['business-name'].liability}</td>
            </tr>
            <tr className="border-t border-gray-100 bg-gray-50">
              <td className="px-4 py-2.5 text-gray-500">Liability</td>
              <td className="px-4 py-2.5 text-gray-700">{STRUCTURE_CONFIG['private-company'].liability}</td>
            </tr>
            <tr className="border-t border-gray-100">
              <td className="px-4 py-2.5 text-gray-500">Best for</td>
              <td className="px-4 py-2.5 text-gray-700">{STRUCTURE_CONFIG['business-name'].bestFor}</td>
            </tr>
            <tr className="border-t border-gray-100 bg-gray-50">
              <td className="px-4 py-2.5 text-gray-500">Best for</td>
              <td className="px-4 py-2.5 text-gray-700">{STRUCTURE_CONFIG['private-company'].bestFor}</td>
            </tr>
          </tbody>
        </table>
        <p className="px-4 pb-4 pt-2 text-xs text-gray-500">
          Other structures — Limited Liability Partnership and Limited Partnership — sit between these two:
          they offer shared management like a partnership with some limited-liability protection, but are
          registered less frequently and have less standardized public fee data. Speak to a chartered
          secretary if either fits your situation.
        </p>
      </div>

      {/* Fee lookup */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Look Up a Post-Registration Fee</label>
        <select
          value={lookupId}
          onChange={e => setLookupId(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        >
          {FEE_LOOKUP.map(f => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
        <div className="mt-2 flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
          <span className="text-sm text-gray-700">{lookupItem.label}</span>
          <span className="text-sm font-bold text-gray-900">{lookupItem.fee}</span>
        </div>
      </div>

      {/* Step-by-step guide */}
      <div className="border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Step-by-Step: Registering on the CAC Portal</p>
        <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside">
          <li>Search and reserve your business name (held for 60 days once approved)</li>
          <li>Complete the relevant registration form online with entity, director/shareholder, and address details</li>
          <li>Upload required documents (clear scans, under the portal&apos;s file size limit)</li>
          <li>Pay the applicable fees via card, bank transfer, or Remita</li>
          <li>Download your certificate and Certified True Copy once approved</li>
        </ol>
        <p className="mt-2 text-xs text-gray-500">
          Common causes of delay: blurry or black-and-white ID scans, name too similar to an existing
          registration, and incomplete director/shareholder details.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={copySummary}
          className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy Summary'}
        </button>
        <a
          href="https://pre.cac.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3.5 border-2 border-indigo-700 text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl transition-colors flex items-center justify-center"
        >
          Register on CAC Portal ↗
        </a>
      </div>
    </div>
  )
}
