'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Regulatory context (informational only — this is not legal advice) ───
// Source: CAC's official downloadable fee schedule (cac.gov.ng/api/download-
// fees), supplied directly by the site owner. This supersedes the earlier
// version of this file, which relied on third-party compliance-firm guides
// — several figures below changed materially as a result, most importantly
// the late-penalty structure, which turned out not to be a flat per-year
// amount at all. CAMA 2020 (Companies and Allied Matters Act), Section
// 692(3)-(4) (strike-off power).
//
// Annual returns filing fee (per filing/year): ₦3,000 — business names.
// ₦5,000 — small companies, private companies other than small, and
// companies limited by guarantee. ₦10,000 — public companies. ₦5,000 —
// incorporated trustees.
// Late penalty structure is TWO separate components, not a single per-year
// figure: a daily default penalty that accrues for every day in default,
// plus a flat one-off penalty. Per the official schedule:
//   Business names: ₦150/day + ₦5,000 one-off
//   Small company: ₦250/day + ₦5,000 one-off
//   Private company (other than small) / company limited by guarantee:
//     ₦500/day + ₦10,000 one-off
//   Incorporated trustees: ₦500/day + ₦10,000 one-off
//   Public company: ₦1,000/day + ₦25,000 one-off
// There is no per-director/officer penalty on the official schedule — an
// earlier version of this tool included one based on a secondary source
// that could not be verified against the primary schedule, and it has been
// removed rather than left in unconfirmed.
// Note: CAMA's "small company" test (turnover ≤ ₦120,000,000, net assets
// ≤ ₦60,000,000, directors hold ≥51% equity, no foreign member, per CAMA
// s.394) is a DIFFERENT definition from the Nigeria Tax Act 2025 "small
// company" tax exemption (₦100m turnover / ₦250m fixed assets) used
// elsewhere on this site — the two thresholds are not interchangeable.
// Strike-off: CAC may strike a company off the register after 10
// consecutive years of default (CAMA s.692(3)-(4)) — this is a statutory
// provision, not part of the fee schedule, so it isn't in the downloaded
// document above but remains separately confirmed. As of July 2026 the CAC
// has been actively running strike-off notices for long-term defaulters.

type EntityType = 'business-name' | 'private-company' | 'public-company' | 'clg' | 'incorporated-trustees'

interface EntityConfig {
  label: string
  baseFee: number
  dailyPenalty: number
  oneOffPenalty: number
  deadlineText: string
  gracePeriodMonths: number
}

const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  'business-name': {
    label: 'Business Name (Sole Proprietorship / Partnership)',
    baseFee: 3_000,
    dailyPenalty: 150,
    oneOffPenalty: 5_000,
    deadlineText: 'Annually, on or before 30 June',
    gracePeriodMonths: 12,
  },
  'private-company': {
    label: 'Private Company Limited by Shares',
    baseFee: 5_000,
    dailyPenalty: 500,
    oneOffPenalty: 10_000,
    deadlineText: 'Within 42 days of your AGM — in practice, by 30 June for a 31 December year-end',
    gracePeriodMonths: 18,
  },
  'public-company': {
    label: 'Public Company Limited by Shares',
    baseFee: 10_000,
    dailyPenalty: 1_000,
    oneOffPenalty: 25_000,
    deadlineText: 'Within 42 days of your AGM',
    gracePeriodMonths: 18,
  },
  'clg': {
    label: 'Company Limited by Guarantee',
    baseFee: 5_000,
    dailyPenalty: 500,
    oneOffPenalty: 10_000,
    deadlineText: 'Within 42 days of your AGM — in practice, by 30 June for a 31 December year-end',
    gracePeriodMonths: 18,
  },
  'incorporated-trustees': {
    label: 'Incorporated Trustees (NGO / Association)',
    baseFee: 5_000,
    dailyPenalty: 500,
    oneOffPenalty: 10_000,
    deadlineText: 'Annually, generally within the 30 June – 31 December window',
    gracePeriodMonths: 12,
  },
}

// A private company qualifying as "small" under CAMA s.394 pays a lower
// late penalty than one that doesn't. Registration/annual-return base fees
// are identical for small vs. non-small private companies, so this only
// affects the penalty calculation below.
const SMALL_COMPANY_DAILY_PENALTY = 250
const SMALL_COMPANY_ONE_OFF_PENALTY = 5_000

const STRIKE_OFF_YEARS = 10
const DAYS_PER_YEAR = 365

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

    // Small companies get a lower daily/one-off penalty than other private
    // companies — same underlying entity type, different tier.
    const useSmallCompanyRate = entityType === 'private-company' && isSmallCompany
    const dailyPenalty = useSmallCompanyRate ? SMALL_COMPANY_DAILY_PENALTY : config.dailyPenalty
    const oneOffPenalty = useSmallCompanyRate ? SMALL_COMPANY_ONE_OFF_PENALTY : config.oneOffPenalty

    // Base fee owed: one year's filing if up to date, or one fee per
    // overdue year (the returns that still need to be filed) if behind.
    const yearsOfFeesOwed = effectiveOverdue > 0 ? effectiveOverdue : 1
    const totalBaseFees = config.baseFee * yearsOfFeesOwed

    // Per the official schedule, the late penalty is a daily default
    // penalty (accrues for every day in default) PLUS a single flat
    // one-off penalty — not a per-year multiplier. Days are approximated
    // from years overdue since exact due dates aren't captured here.
    const daysOverdue = effectiveOverdue * DAYS_PER_YEAR
    const totalDailyPenalty = effectiveOverdue > 0 ? dailyPenalty * daysOverdue : 0
    const totalOneOffPenalty = effectiveOverdue > 0 ? oneOffPenalty : 0
    const totalLatePenalties = totalDailyPenalty + totalOneOffPenalty

    const totalEstimate = totalBaseFees + totalLatePenalties

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
      totalDailyPenalty,
      totalOneOffPenalty,
      totalLatePenalties,
      totalEstimate,
      status,
      statusLabel,
      yearsUntilStrikeOffRisk: Math.max(0, STRIKE_OFF_YEARS - effectiveOverdue),
    }
  }, [entityType, incorporationYear, isSmallCompany, yearsOverdue, config])

  const reset = () => {
    setEntityType('private-company')
    setIncorporationYear(String(CURRENT_YEAR - 3))
    setIsSmallCompany(true)
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

      {/* Small company checkbox (private companies only — affects penalty tier) */}
      {entityType === 'private-company' && (
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
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
              {result.totalDailyPenalty > 0 && (
                <div className="flex justify-between text-sm text-indigo-800">
                  <span>Daily default penalty (~{result.effectiveOverdue * 365} days)</span>
                  <span>{formatNaira(result.totalDailyPenalty)}</span>
                </div>
              )}
              {result.totalOneOffPenalty > 0 && (
                <div className="flex justify-between text-sm text-indigo-800">
                  <span>One-off default penalty</span>
                  <span>{formatNaira(result.totalOneOffPenalty)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-indigo-200 pt-3">
              <span className="font-bold text-indigo-900">Estimated Total to Become Compliant</span>
              <span className="text-2xl font-black text-indigo-900">{formatNaira(result.totalEstimate)}</span>
            </div>
            {result.totalDailyPenalty > 0 && (
              <p className="text-xs text-indigo-700">
                The daily penalty is on CAC&apos;s official fee schedule, but some compliance firms report
                inconsistent day-to-day enforcement of it in practice. The one-off penalty is more
                reliably charged. Treat the daily-penalty portion above as an upper-bound estimate.
              </p>
            )}
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
            threshold is 10 consecutive years), but the daily penalty means the total keeps growing every
            day you wait, not just every year.
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
