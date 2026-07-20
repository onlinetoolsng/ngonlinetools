'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Regulatory context (informational only — this is not legal advice) ───
// CAMA 2020, Part B/E/F. Fee figures below are the CAC's fee schedule as
// most consistently reported across 2026 compliance-firm sources
// (FastCAC, EBC Consults) — the CAC's own machine-readable fee page
// (cac.gov.ng/api/download-fees) could not be fetched directly to verify
// against (bot-blocked). IMPORTANT: publicly available secondary sources
// disagree substantially on these figures — some cite ₦10,000 for a
// private company's base registration, others ₦40,000, a 4x spread —
// most likely reflecting genuine multiple fee revisions (May 2025 gazette,
// August 2025 revision, April 2026 "AI service charge") that different
// sites have updated to different degrees. Treat every figure here as a
// planning estimate, not a quote, and confirm on the CAC portal
// (pre.cac.gov.ng) immediately before paying.
//
// Business Name: ₦1,000 name reservation (₦5,000 if restricted/suffixed)
// + ₦20,000 registration = ₦21,000.
// Private Company Limited by Shares (≤₦1,000,000 share capital): ₦1,000
// name reservation + ₦40,000 registration + 0.75% FIRS stamp duty on
// share capital (₦7,500 at ₦1M) = ₦48,500. Each additional ₦1,000,000 of
// share capital adds ~₦10,000 CAC fee + 0.75% stamp duty.
// Company Limited by Guarantee: no share capital/stamp duty; CAC filing
// fee estimated at ₦40,000. Requires Attorney General of the Federation
// approval before incorporation — adds real time, not modeled as a fee.
// Incorporated Trustees (NGO): ₦5,000 name reservation + ₦40,000
// registration = ₦45,000, excluding mandatory newspaper publication
// (~₦20,000–₦30,000, not a CAC fee) and the 28-day objection period.
// AI Service Charge (CAC, effective 1 April 2026): +₦200 on name
// reservation, +₦500 on registration, applied here across all structures
// — CAC's announcement specifically named business names; applying it
// elsewhere is this tool's extrapolation, not a confirmed figure.
// Post-registration fee lookup figures are the CAC's own August 2025
// service-fee revision as reported directly by Punch Newspapers.

type StructureType = 'business-name' | 'private-company' | 'clg' | 'incorporated-trustees'

interface StructureConfig {
  label: string
  shortLabel: string
  hasShareCapital: boolean
  nameReservationFee: number
  restrictedNameReservationFee: number
  baseRegistrationFee: number
  perAdditionalMillionFee: number
  timelineText: string
  liability: string
  bestFor: string
  requirements: string[]
  feeConfidence: 'higher' | 'lower'
}

const AI_SERVICE_CHARGE_RESERVATION = 200
const AI_SERVICE_CHARGE_REGISTRATION = 500
const REMITA_PORTAL_FEE = 161
const STAMP_DUTY_RATE = 0.0075

const STRUCTURE_CONFIG: Record<StructureType, StructureConfig> = {
  'business-name': {
    label: 'Business Name (Sole Proprietorship / Partnership)',
    shortLabel: 'Business Name',
    hasShareCapital: false,
    nameReservationFee: 1_000,
    restrictedNameReservationFee: 5_000,
    baseRegistrationFee: 20_000,
    perAdditionalMillionFee: 0,
    timelineText: '1–7 working days (often same-day to 72 hours online)',
    liability: 'Unlimited — you are personally liable for business debts',
    bestFor: 'Sole traders, freelancers, and small local businesses wanting the fastest, cheapest start',
    requirements: [
      'Valid ID (NIN, BVN, or international passport)',
      'Proposed business name (1–2 backup options)',
      'Business/registered address in Nigeria',
      'Nature of business description',
    ],
    feeConfidence: 'higher',
  },
  'private-company': {
    label: 'Private Company Limited by Shares',
    shortLabel: 'Private Ltd',
    hasShareCapital: true,
    nameReservationFee: 1_000,
    restrictedNameReservationFee: 5_000,
    baseRegistrationFee: 40_000,
    perAdditionalMillionFee: 10_000,
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
    feeConfidence: 'higher',
  },
  'clg': {
    label: 'Company Limited by Guarantee',
    shortLabel: 'Company Ltd. by Guarantee',
    hasShareCapital: false,
    nameReservationFee: 5_000,
    restrictedNameReservationFee: 5_000,
    baseRegistrationFee: 40_000,
    perAdditionalMillionFee: 0,
    timelineText: 'Several weeks — requires Attorney General of the Federation approval before incorporation (typically adds 30–90 days on top of normal processing)',
    liability: 'Limited — no share capital; members\u2019 liability is capped by their guarantee amount',
    bestFor: 'Non-profits, professional bodies, and think tanks needing corporate legal status without shareholders',
    requirements: [
      'Memorandum & Articles of Association (no share capital clause)',
      'Details of at least 2 guarantors/members',
      'Attorney General of the Federation approval (separate step, before CAC filing)',
      'Registered office address in Nigeria',
    ],
    feeConfidence: 'lower',
  },
  'incorporated-trustees': {
    label: 'Incorporated Trustees (NGO / Association)',
    shortLabel: 'Incorporated Trustees',
    hasShareCapital: false,
    nameReservationFee: 5_000,
    restrictedNameReservationFee: 5_000,
    baseRegistrationFee: 40_000,
    perAdditionalMillionFee: 0,
    timelineText: '6–8 weeks — includes a mandatory 28-day newspaper publication and public objection period',
    liability: 'N/A — non-profit structure, no shareholders or share capital',
    bestFor: 'NGOs, churches, mosques, foundations, and community or alumni associations',
    requirements: [
      'Constitution/rules of the association',
      'Details of at least 2 trustees',
      'Two newspaper publications of the proposed registration',
      'Registered office address in Nigeria',
    ],
    feeConfidence: 'lower',
  },
}

const FEE_LOOKUP: { id: string; label: string; fee: string }[] = [
  { id: 'name-standard', label: 'Name reservation (standard)', fee: '₦1,000' },
  { id: 'name-restricted', label: 'Name reservation (restricted word/suffix)', fee: '₦5,000' },
  { id: 'annual-returns-bn', label: 'Annual returns — Business Name (per year)', fee: '₦5,000' },
  { id: 'annual-returns-co', label: 'Annual returns — Private Company (per year)', fee: '₦10,000' },
  { id: 'ctc', label: 'Certified True Copy of documents/extract', fee: '₦5,000 each' },
  { id: 'striking-off-small', label: 'Voluntary striking-off (small company)', fee: '₦50,000' },
  { id: 'striking-off-public', label: 'Voluntary striking-off (public company)', fee: '₦100,000' },
  { id: 'relisting-ltd', label: 'Relisting (LTD/GTE)', fee: '₦50,000' },
  { id: 'relisting-public', label: 'Relisting (public company)', fee: '₦100,000' },
  { id: 'due-diligence', label: 'Due diligence search (self-service)', fee: '₦50,000' },
  { id: 'director-address', label: 'Restriction of director\u2019s residential address', fee: '₦25,000' },
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

    let registrationFee = config.baseRegistrationFee
    let stampDuty = 0
    if (config.hasShareCapital) {
      const extraMillions = Math.max(0, Math.ceil((capital - 1_000_000) / 1_000_000))
      registrationFee += extraMillions * config.perAdditionalMillionFee
      stampDuty = capital * STAMP_DUTY_RATE
    }

    const aiServiceCharge = AI_SERVICE_CHARGE_RESERVATION + AI_SERVICE_CHARGE_REGISTRATION
    const total = nameReservationFee + registrationFee + stampDuty + aiServiceCharge + REMITA_PORTAL_FEE

    return { capital, nameReservationFee, registrationFee, stampDuty, aiServiceCharge, total }
  }, [structure, shareCapital, restrictedName, config])

  const copySummary = () => {
    const text = `${config.label} — Estimated CAC registration cost: ${formatNaira(result.total)} (name reservation ${formatNaira(result.nameReservationFee)} + registration ${formatNaira(result.registrationFee)}${result.stampDuty > 0 ? ` + stamp duty ${formatNaira(result.stampDuty)}` : ''} + AI service charge ${formatNaira(result.aiServiceCharge)} + portal fee ${formatNaira(REMITA_PORTAL_FEE)}). Estimate only — verify on the CAC portal.`
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
          <strong>Estimate only, not official pricing.</strong> Publicly available fee data for CAC
          registration varies significantly across sources at the time of writing. Confirm the exact,
          current fee on the official CAC portal (pre.cac.gov.ng) before paying anything.
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
        {config.feeConfidence === 'lower' && (
          <p className="mt-1.5 text-xs text-gray-500">
            Fee figures for this structure are less consistently published than for business names and
            private companies — treat this estimate as a rough starting point only.
          </p>
        )}
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
          <span>AI service charge (CAC, since Apr 2026)</span>
          <span className="font-semibold">{formatNaira(result.aiServiceCharge)}</span>
        </div>
        <div className="flex justify-between text-sm text-indigo-900">
          <span>Remita/portal transaction fee (est.)</span>
          <span className="font-semibold">{formatNaira(REMITA_PORTAL_FEE)}</span>
        </div>
        <div className="flex justify-between border-t border-indigo-200 pt-3">
          <span className="font-bold text-indigo-900">Estimated Total (official fees only)</span>
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
