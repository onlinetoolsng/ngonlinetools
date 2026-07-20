'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Regulatory context (informational only — this is not legal advice) ───
// CAMA 2020 (Companies and Allied Matters Act), Section 425 (companies) and
// Section 692(3)-(4) (strike-off power). Fee/penalty figures below are the
// CAC's published schedule as of the 2026 filing season — source-checked
// against multiple compliance-firm summaries (EBC Consults, SmartSMS
// Solutions, cacannualreturns.com) rather than the CAC portal directly,
// since the portal has no public machine-readable fee API. CAC updates
// fees periodically — always confirm the live figure at icrp.cac.gov.ng
// before paying.
//
// Filing fee (per year): ₦10,000 — private/public companies. ₦5,000 —
// business names and (by convention, unconfirmed on the current fee
// schedule) incorporated trustees.
// Late penalty (per year of default): ₦5,000 — "small company" under CAMA
// s.394 (turnover ≤ ₦120,000,000, net assets ≤ ₦60,000,000, directors hold
// ≥51% equity, no foreign member). ₦10,000 — any other private/public
// company. Plus ₦1,000 per year for each director/officer. A separate
// daily penalty (up to ₦1,000/day) exists under the Companies Regulations
// 2021 but is currently suspended by the CAC.
// Note: CAMA's "small company" test (₦120m turnover / ₦60m net assets) is
// a DIFFERENT definition from the Nigeria Tax Act 2025 "small company" tax
// exemption (₦100m turnover / ₦250m fixed assets) used elsewhere on this
// site — the two thresholds are not interchangeable.
// Strike-off: CAC may strike a company off the register after 10
// consecutive years of default (CAMA s.692(3)-(4)). As of July 2026 the
// CAC is actively running strike-off notices for long-term defaulters
// ("Batch 6").

type EntityType = 'business-name' | 'private-company' | 'public-company' | 'clg' | 'incorporated-trustees'

interface EntityConfig {
  label: string
  baseFee: number
  deadlineText: string
  gracePeriodMonths: number
  hasDirectorPenalty: boolean
  feeConfidence: 'confirmed' | 'estimated'
}

const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  'business-name': {
    label: 'Business Name (Sole Proprietorship / Partnership)',
    baseFee: 5_000,
    deadlineText: 'Annually, on or before 30 June',
    gracePeriodMonths: 12,
    hasDirectorPenalty: false,
    feeConfidence: 'confirmed',
  },
  'private-company': {
    label: 'Private Company Limited by Shares',
    baseFee: 10_000,
    deadlineText: 'Within 42 days of your AGM — in practice, by 30 June for a 31 December year-end',
    gracePeriodMonths: 18,
    hasDirectorPenalty: true,
    feeConfidence: 'confirmed',
  },
  'public-company': {
    label: 'Public Company Limited by Shares',
    baseFee: 10_000,
    deadlineText: 'Within 42 days of your AGM',
    gracePeriodMonths: 18,
    hasDirectorPenalty: true,
    feeConfidence: 'estimated',
  },
  'clg': {
    label: 'Company Limited by Guarantee',
    baseFee: 10_000,
    deadlineText: 'Within 42 days of your AGM — in practice, by 30 June for a 31 December year-end',
    gracePeriodMonths: 18,
    hasDirectorPenalty: true,
    feeConfidence: 'estimated',
  },
  'incorporated-trustees': {
    label: 'Incorporated Trustees (NGO / Association)',
    baseFee: 5_000,
    deadlineText: 'Annually, generally within the 30 June – 31 December window',
    gracePeriodMonths: 12,
    hasDirectorPenalty: false,
    feeConfidence: 'estimated',
  },
}

const SMALL_COMPANY_PENALTY_PER_YEAR = 5_000
const OTHER_COMPANY_PENALTY_PER_YEAR = 10_000
const BUSINESS_NAME_PENALTY_PER_YEAR = 5_000
const DIRECTOR_PENALTY_PER_YEAR = 1_000
const STRIKE_OFF_YEARS = 10

const CURRENT_YEAR = new Date().getFullYear()

function formatNaira(value: number) {
  return `₦${Math.round(Math.max(0, value)).toLocaleString('en-NG')}`
}

function num(value: string) {
  const n = parseFloat(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export function CACAnnualReturnsComplianceChecker(_props: { locale: string }) {
  const [entityType, setEntityType] = useState<EntityType>('private-company')
  const [incorporationYear, setIncorporationYear] = useState(String(CURRENT_YEAR - 3))
  const [isSmallCompany, setIsSmallCompany] = useState(true)
  const [directorCount, setDirectorCount] = useState('2')
  const [yearsOverdue, setYearsOverdue] = useState('0')
  const [showWhatIsThis, setShowWhatIsThis] = useState(false)
  const [copied, setCopied] = useState(false)

  const config = ENTITY_CONFIG[entityType]

  const result = useMemo(() => {
    const incYear = num(incorporationYear) || CURRENT_YEAR
    const companyAgeYears = Math.max(0, CURRENT_YEAR - incYear)
    const withinGracePeriod = companyAgeYears * 12 < config.gracePeriodMonths

    const overdueInput = Math.round(num(yearsOverdue))
    // Can't be overdue for more years than the entity has existed.
    const effectiveOverdue = withinGracePeriod ? 0 : Math.min(overdueInput, companyAgeYears)

    const directors = Math.max(0, Math.round(num(directorCount)))

    const penaltyPerYear =
      entityType === 'business-name' || entityType === 'incorporated-trustees'
        ? BUSINESS_NAME_PENALTY_PER_YEAR
        : isSmallCompany
          ? SMALL_COMPANY_PENALTY_PER_YEAR
          : OTHER_COMPANY_PENALTY_PER_YEAR

    // Base fee owed: one year's filing if up to date, or one fee per
    // overdue year (the returns that still need to be filed) if behind.
    const yearsOfFeesOwed = effectiveOverdue > 0 ? effectiveOverdue : 1
    const totalBaseFees = config.baseFee * yearsOfFeesOwed

    const totalLatePenalties = effectiveOverdue > 0 ? penaltyPerYear * effectiveOverdue : 0
    const totalDirectorPenalties =
      config.hasDirectorPenalty && effectiveOverdue > 0
        ? DIRECTOR_PENALTY_PER_YEAR * directors * effectiveOverdue
        : 0

    const totalEstimate = totalBaseFees + totalLatePenalties + totalDirectorPenalties

    let status: 'active' | 'needs-filing' | 'high-risk'
    let statusLabel: string
    if (withinGracePeriod || effectiveOverdue === 0) {
      status = 'active'
      statusLabel = 'Likely Active'
    } else if (effectiveOverdue >= STRIKE_OFF_YEARS) {
      status = 'high-risk'
      statusLabel = 'High Risk of Strike-Off'
    } else {
      status = 'needs-filing'
      statusLabel = 'Needs Filing'
    }

    return {
      withinGracePeriod,
      effectiveOverdue,
      totalBaseFees,
      totalLatePenalties,
      totalDirectorPenalties,
      totalEstimate,
      status,
      statusLabel,
      yearsUntilStrikeOffRisk: Math.max(0, STRIKE_OFF_YEARS - effectiveOverdue),
    }
  }, [entityType, incorporationYear, isSmallCompany, directorCount, yearsOverdue, config])

  const reset = () => {
    setEntityType('private-company')
    setIncorporationYear(String(CURRENT_YEAR - 3))
    setIsSmallCompany(true)
    setDirectorCount('2')
    setYearsOverdue('0')
  }

  const copyResult = () => {
    const text = `${config.label} — Status: ${result.statusLabel}. Estimated total to become compliant: ${formatNaira(result.totalEstimate)} (${result.effectiveOverdue} year(s) overdue).`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Disclaimer banner — always visible */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Not legal advice.</strong> This tool uses publicly available general information about CAC
          requirements under CAMA 2020. Fees and rules change. Always verify your company&apos;s actual status
          and current fees on the official CAC portal before paying or filing.
        </p>
      </div>

      {/* Entity type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Entity Type</label>
        <select
          value={entityType}
          onChange={e => setEntityType(e.target.value as EntityType)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        >
          {(Object.entries(ENTITY_CONFIG) as [EntityType, EntityConfig][]).map(([value, cfg]) => (
            <option key={value} value={value}>{cfg.label}</option>
          ))}
        </select>
        {config.feeConfidence === 'estimated' && (
          <p className="mt-1.5 text-xs text-gray-500">
            Fee figures for this entity type are less consistently published than for business names and
            private companies — treat the estimate below as a starting point and confirm on the CAC portal.
          </p>
        )}
      </div>

      {/* Incorporation year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year of Incorporation / Registration</label>
          <input
            type="number"
            min={1970}
            max={CURRENT_YEAR}
            value={incorporationYear}
            onChange={e => setIncorporationYear(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Years of Annual Returns Overdue</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatNumberInput(yearsOverdue)}
            onChange={e => setYearsOverdue(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="0"
          />
        </div>
      </div>

      {/* Company-specific inputs */}
      {(entityType === 'private-company' || entityType === 'public-company' || entityType === 'clg') && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Directors / Officers</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatNumberInput(directorCount)}
              onChange={e => setDirectorCount(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder="2"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Late penalties add ₦1,000 per year for each director/officer, on top of the company penalty.
            </p>
          </div>

          {entityType === 'private-company' && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSmallCompany}
                onChange={e => setIsSmallCompany(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                This qualifies as a <strong>&quot;small company&quot;</strong> under CAMA s.394 — turnover ≤ ₦120,000,000,
                net assets ≤ ₦60,000,000, directors hold at least 51% of shares between them, and no foreign
                member. (This is a different test from the tax-code &quot;small company&quot; exemption used elsewhere.)
              </span>
            </label>
          )}
        </div>
      )}

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-4">
        {result.withinGracePeriod ? (
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 rounded-lg px-3 py-2 text-sm font-semibold">
            ✓ Likely within grace period
          </div>
        ) : (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
            result.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
            result.status === 'needs-filing' ? 'bg-amber-100 text-amber-800' :
            'bg-red-100 text-red-800'
          }`}>
            {result.status === 'active' ? '✓' : result.status === 'needs-filing' ? 'ℹ' : '⚠'} {result.statusLabel}
          </div>
        )}

        <div className="text-sm text-indigo-900">
          <span className="font-semibold">Filing window:</span> {config.deadlineText}
        </div>

        {result.withinGracePeriod ? (
          <p className="text-sm text-indigo-800">
            Companies typically get {config.gracePeriodMonths} months from incorporation before their first
            annual return is due, so based on the registration year entered, there may be nothing owed yet.
            Confirm your exact first-return date on the CAC portal.
          </p>
        ) : (
          <>
            <div className="border-t border-indigo-200 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-indigo-800">
                <span>Filing fees ({result.effectiveOverdue > 0 ? `${result.effectiveOverdue} year(s)` : 'this year'})</span>
                <span>{formatNaira(result.totalBaseFees)}</span>
              </div>
              {result.totalLatePenalties > 0 && (
                <div className="flex justify-between text-sm text-indigo-800">
                  <span>Late penalties</span>
                  <span>{formatNaira(result.totalLatePenalties)}</span>
                </div>
              )}
              {result.totalDirectorPenalties > 0 && (
                <div className="flex justify-between text-sm text-indigo-800">
                  <span>Director/officer penalties</span>
                  <span>{formatNaira(result.totalDirectorPenalties)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-indigo-200 pt-3">
              <span className="font-bold text-indigo-900">Estimated Total to Become Compliant</span>
              <span className="text-2xl font-black text-indigo-900">{formatNaira(result.totalEstimate)}</span>
            </div>
          </>
        )}

        {result.status === 'high-risk' && (
          <p className="text-xs bg-red-50 text-red-800 rounded-lg px-3 py-2">
            10+ consecutive years of non-filing is grounds for the CAC to strike a company off the register
            (CAMA s.692(3)-(4)) — restoration afterward requires a court order. The CAC has been actively
            running strike-off notices for long-term defaulters. Check your status on the official portal
            without delay.
          </p>
        )}
        {result.status === 'needs-filing' && result.yearsUntilStrikeOffRisk <= 10 && (
          <p className="text-xs text-indigo-700">
            At {result.effectiveOverdue} year(s) overdue, this entity is not yet at strike-off risk (that
            threshold is 10 consecutive years), but penalties compound every year you wait.
          </p>
        )}
      </div>

      {/* Verify on official portal */}
      <a
        href="https://publicsearch.cac.gov.ng/"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center py-3.5 border-2 border-indigo-700 text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl transition-colors"
      >
        Verify Official Status on CAC Portal ↗
      </a>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={copyResult}
          className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy Result'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors"
        >
          Reset
        </button>
      </div>

      {/* What you'll need — checklist */}
      <div className="border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">What you&apos;ll typically need to file</p>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
          <li>Company/business registration details (RC or BN number)</li>
          <li>Updated register of directors, shareholders, or partners</li>
          <li>Financial statements (required for companies; simplified for small companies and business names)</li>
          <li>Persons with Significant Control (beneficial ownership) information, if not already on file</li>
          <li>Payment of the filing fee and any accrued penalties via the CAC portal</li>
        </ul>
      </div>

      {/* Educational accordion */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowWhatIsThis(v => !v)}
          className="w-full flex justify-between items-center px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          What are annual returns, and why do they matter?
          <span>{showWhatIsThis ? '−' : '+'}</span>
        </button>
        {showWhatIsThis && (
          <div className="px-4 pb-4 text-sm text-gray-600 space-y-2">
            <p>
              An annual return is a yearly statement filed with the Corporate Affairs Commission confirming
              that your business is still active and that its core records — directors, shareholders,
              registered address, share capital — are up to date. It is separate from, and in addition to,
              your tax returns filed with the Nigeria Revenue Service (FIRS/NRS).
            </p>
            <p>
              Falling behind affects more than your CAC file: banks, investors, and larger business partners
              routinely check CAC status before signing contracts or opening accounts, and an inactive or
              struck-off status can quietly block deals long before it becomes an emergency.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
