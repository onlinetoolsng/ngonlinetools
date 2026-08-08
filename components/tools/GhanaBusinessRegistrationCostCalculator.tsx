'use client'

import { useEffect, useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

/**
 * components/tools/GhanaBusinessRegistrationCostCalculator.tsx
 *
 * ─── Data source ────────────────────────────────────────────────────────────
 * Office of the Registrar of Companies (ORC) Ghana, "FINAL-FEES-AND-CHARGES-
 * 2026.pdf", effective 2 February 2026. Fees are hard-coded statutory
 * constants — ORC revises them periodically, so this component notes the
 * effective date and points to orc.gov.gh to confirm.
 *
 * GIPC minimum-capital/registration requirements for foreign participation
 * are deliberately NOT calculated here — only flagged with a note — since
 * they're a separate regime from ORC's own fee schedule.
 */

type BusinessType =
  | 'sole-proprietorship'
  | 'partnership'
  | 'company-limited-by-shares'
  | 'company-limited-by-guarantee'
  | 'external-company'

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  'sole-proprietorship': 'Sole Proprietorship / Business Name',
  'partnership': 'Partnership',
  'company-limited-by-shares': 'Company Limited by Shares (private limited)',
  'company-limited-by-guarantee': 'Company Limited by Guarantee',
  'external-company': 'External Company (foreign branch)',
}

// GH₵ base registration fees, and VIP/Prestige expedited add-ons.
const BASE_FEE_GHS: Record<Exclude<BusinessType, 'external-company'>, number> = {
  'sole-proprietorship': 130,
  'partnership': 270,
  'company-limited-by-shares': 585,
  'company-limited-by-guarantee': 490,
}

const VIP_FEE_GHS: Record<Exclude<BusinessType, 'external-company'>, number> = {
  'sole-proprietorship': 520,
  'partnership': 0, // no published VIP tier for partnerships
  'company-limited-by-shares': 1_300,
  'company-limited-by-guarantee': 1_300,
}

const NAME_SEARCH_GHS = 30
const CTC_GHS = 30
const CAPITAL_DUTY_RATE = 0.01
const DEFAULT_STATED_CAPITAL = 500

const EXTERNAL_COMPANY_USD = {
  base: 1_400,
  ctc: 30,
  vip: 2_000,
}

const RENEWAL_FEES = [
  { label: 'Business Name — annual renewal', amount: 70 },
  { label: 'Partnership — annual renewal', amount: 100 },
  { label: 'Company — Annual Returns filing', amount: 175 },
]

function formatGHS(value: number): string {
  if (!Number.isFinite(value)) return 'GH₵0'
  return `GH₵${Math.max(0, Math.round(value)).toLocaleString('en-GH')}`
}

function formatUSD(value: number): string {
  if (!Number.isFinite(value)) return '$0'
  return `$${Math.max(0, value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function GhanaBusinessRegistrationCostCalculator(_props: { locale: string }) {
  const [businessType, setBusinessType] = useState<BusinessType>('company-limited-by-shares')
  const [capitalInput, setCapitalInput] = useState(String(DEFAULT_STATED_CAPITAL))
  const [includeNameSearch, setIncludeNameSearch] = useState(true)
  const [includeCTC, setIncludeCTC] = useState(true)
  const [includeVIP, setIncludeVIP] = useState(false)
  const [hasForeignParticipation, setHasForeignParticipation] = useState(false)
  const [showUSD, setShowUSD] = useState(false)

  const [ghsPerUsd, setGhsPerUsd] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data?.rates?.GHS) setGhsPerUsd(data.rates.GHS)
      })
      .catch(() => {
        // Silent fallback — USD figures simply won't render if the fetch fails.
      })
    return () => { cancelled = true }
  }, [])

  const result = useMemo(() => {
    const isExternal = businessType === 'external-company'
    const isShares = businessType === 'company-limited-by-shares'
    const statedCapital = Math.max(0, parseFloat(capitalInput) || 0)
    const nameSearch = includeNameSearch ? NAME_SEARCH_GHS : 0
    const ctc = includeCTC ? CTC_GHS : 0

    if (isExternal) {
      const rate = ghsPerUsd ?? 0
      const baseUsd = EXTERNAL_COMPANY_USD.base
      const ctcUsd = includeCTC ? EXTERNAL_COMPANY_USD.ctc : 0
      const vipUsd = includeVIP ? EXTERNAL_COMPANY_USD.vip : 0
      const totalUsd = baseUsd + ctcUsd + vipUsd
      const totalGhs = rate > 0 ? totalUsd * rate : null
      return {
        isExternal: true, isShares: false,
        base: baseUsd, capitalDuty: 0, nameSearch: ctcUsd > 0 ? EXTERNAL_COMPANY_USD.ctc : 0,
        ctc: ctcUsd, vip: vipUsd, statedCapital: 0,
        totalGhs, totalUsd, hasVipOption: true,
      }
    }

    const base = BASE_FEE_GHS[businessType]
    const capitalDuty = isShares ? statedCapital * CAPITAL_DUTY_RATE : 0
    const vipFee = VIP_FEE_GHS[businessType]
    const vip = includeVIP ? vipFee : 0
    const hasVipOption = vipFee > 0
    const totalGhs = base + capitalDuty + nameSearch + ctc + vip
    const totalUsd = ghsPerUsd && ghsPerUsd > 0 ? totalGhs / ghsPerUsd : null

    return {
      isExternal: false, isShares,
      base, capitalDuty, nameSearch, ctc, vip, statedCapital,
      totalGhs, totalUsd, hasVipOption,
    }
  }, [businessType, capitalInput, includeNameSearch, includeCTC, includeVIP, ghsPerUsd])

  const copyResult = () => {
    const total = result.totalGhs !== null ? formatGHS(result.totalGhs) : `${formatUSD(result.totalUsd ?? 0)} (cedi equiv. — rate unavailable)`
    navigator.clipboard.writeText(
      `${BUSINESS_TYPE_LABELS[businessType]} — estimated ORC registration cost: ${total}`
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business type</label>
        <select
          value={businessType}
          onChange={e => setBusinessType(e.target.value as BusinessType)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition bg-white"
        >
          {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).map(key => (
            <option key={key} value={key}>{BUSINESS_TYPE_LABELS[key]}</option>
          ))}
        </select>
      </div>

      {result.isShares && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stated / authorised capital (GH₵)</label>
          <input
            type="text" inputMode="decimal"
            value={formatNumberInput(capitalInput)}
            onChange={e => setCapitalInput(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
          <p className="text-[11px] text-gray-400 mt-1">Minimum stated capital for a 100% Ghanaian-owned company limited by shares is commonly GH₵500. Capital duty (stamp duty) applies at 1% of stated capital, with no cap.</p>
        </div>
      )}

      <div className="space-y-2.5">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input type="checkbox" checked={includeNameSearch} onChange={e => setIncludeNameSearch(e.target.checked)} className="accent-indigo-700" />
          Include name search ({formatGHS(NAME_SEARCH_GHS)})
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input type="checkbox" checked={includeCTC} onChange={e => setIncludeCTC(e.target.checked)} className="accent-indigo-700" />
          Include Certified True Copy ({formatGHS(CTC_GHS)})
        </label>
        {result.hasVipOption && (
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={includeVIP} onChange={e => setIncludeVIP(e.target.checked)} className="accent-indigo-700" />
            VIP / Prestige expedited service
          </label>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ownership</label>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
          <button type="button" onClick={() => setHasForeignParticipation(false)} className={`flex-1 px-3 py-2.5 font-semibold transition-colors ${!hasForeignParticipation ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>
            100% Ghanaian-owned
          </button>
          <button type="button" onClick={() => setHasForeignParticipation(true)} className={`flex-1 px-3 py-2.5 font-semibold transition-colors ${hasForeignParticipation ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>
            Has foreign participation
          </button>
        </div>
        {hasForeignParticipation && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3 mt-2">
            Foreign participation triggers separate GIPC (Ghana Investment Promotion Centre) minimum-capital requirements and registration fees, on top of the ORC cost below. This calculator only covers ORC fees — budget for GIPC registration separately.
          </p>
        )}
      </div>

      {ghsPerUsd && (
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <input type="checkbox" checked={showUSD} onChange={e => setShowUSD(e.target.checked)} className="accent-indigo-700" />
          Show USD equivalent
        </label>
      )}

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <dl className="space-y-2 text-sm">
          {result.isExternal ? (
            <>
              <div className="flex justify-between"><dt className="text-gray-500">Registration (cedi equivalent of US$1,400)</dt><dd className="font-medium text-gray-800">{formatUSD(result.base)}</dd></div>
              {result.ctc > 0 && <div className="flex justify-between"><dt className="text-gray-500">CTC (cedi equiv. of US$30)</dt><dd className="font-medium text-gray-800">{formatUSD(result.ctc)}</dd></div>}
              {result.vip > 0 && <div className="flex justify-between"><dt className="text-gray-500">VIP (cedi equiv. of US$2,000)</dt><dd className="font-medium text-gray-800">{formatUSD(result.vip)}</dd></div>}
            </>
          ) : (
            <>
              <div className="flex justify-between"><dt className="text-gray-500">Registration fee</dt><dd className="font-medium text-gray-800">{formatGHS(result.base)}</dd></div>
              {result.isShares && <div className="flex justify-between"><dt className="text-gray-500">Capital duty (1% of {formatGHS(result.statedCapital)})</dt><dd className="font-medium text-gray-800">{formatGHS(result.capitalDuty)}</dd></div>}
              {result.nameSearch > 0 && <div className="flex justify-between"><dt className="text-gray-500">Name search</dt><dd className="font-medium text-gray-800">{formatGHS(result.nameSearch)}</dd></div>}
              {result.ctc > 0 && <div className="flex justify-between"><dt className="text-gray-500">Certified True Copy</dt><dd className="font-medium text-gray-800">{formatGHS(result.ctc)}</dd></div>}
              {result.vip > 0 && <div className="flex justify-between"><dt className="text-gray-500">VIP / Prestige</dt><dd className="font-medium text-gray-800">{formatGHS(result.vip)}</dd></div>}
            </>
          )}

          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Total estimated ORC cost</dt>
            <dd className="font-semibold text-indigo-700 text-lg">
              {result.isExternal
                ? (result.totalGhs !== null ? formatGHS(result.totalGhs) : `${formatUSD(result.totalUsd ?? 0)} (cedi rate unavailable)`)
                : formatGHS(result.totalGhs ?? 0)}
            </dd>
          </div>
          {showUSD && result.totalUsd !== null && !result.isExternal && (
            <div className="flex justify-between"><dt className="text-gray-500">≈ USD equivalent</dt><dd className="font-medium text-gray-800">{formatUSD(result.totalUsd)}</dd></div>
          )}
        </dl>
        <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Base ORC fees by entity type</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-500"><span>Sole Proprietorship / Business Name</span><span>{formatGHS(BASE_FEE_GHS['sole-proprietorship'])}</span></div>
          <div className="flex justify-between text-gray-500"><span>Partnership</span><span>{formatGHS(BASE_FEE_GHS['partnership'])}</span></div>
          <div className="flex justify-between text-gray-500"><span>Company Limited by Shares</span><span>{formatGHS(BASE_FEE_GHS['company-limited-by-shares'])}</span></div>
          <div className="flex justify-between text-gray-500"><span>Company Limited by Guarantee</span><span>{formatGHS(BASE_FEE_GHS['company-limited-by-guarantee'])}</span></div>
          <div className="flex justify-between text-gray-500"><span>External Company</span><span>{formatUSD(EXTERNAL_COMPANY_USD.base)} equiv.</span></div>
        </div>
      </div>

      {/* Renewal fees */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">After year one: renewals &amp; annual returns</h3>
        <div className="space-y-1.5 text-sm">
          {RENEWAL_FEES.map(r => (
            <div key={r.label} className="flex justify-between text-gray-500"><span>{r.label}</span><span>{formatGHS(r.amount)}</span></div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Good to know</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Standard processing is typically 3–10 working days; VIP/Prestige service is usually 2–4 days.</li>
          <li>Does not include: legal drafting, filing agent fees, GRA TIN (this is free and required, but not an ORC fee), local assembly operating permits, GIPC fees for foreign-owned businesses, or renewals/annual returns after year one.</li>
          <li>A Company Limited by Shares registration bundles the Constitution, Form 3, and beneficial-ownership (BO) profile into the base fee.</li>
          <li>Capital duty (stamp duty) on stated capital is 1% with no upper cap in the published fee schedule.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          Uses official Office of the Registrar of Companies (ORC) fees effective 2 February 2026. Fees are set by ORC and subject to change — always confirm current fees at orc.gov.gh before paying. This is an estimate of official government fees only, not legal advice.
        </p>
      </div>
    </div>
  )
}
