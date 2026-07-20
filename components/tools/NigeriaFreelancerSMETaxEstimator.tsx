'use client'

import { useEffect, useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Nigeria Tax Act 2025 (NTA), effective 1 January 2026 ──────────────────
// PIT bands (freelancers/sole proprietors — taxed as individuals regardless
// of business name registration; only an incorporated company pays CIT).
const PIT_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]

// CIT: two-tier system under the NTA — 0% for qualifying small companies,
// flat 30% otherwise (matches this site's CIT calculator; the Act allows a
// future presidential order to cut this to 25%, but that hasn't happened).
const CIT_RATE = 0.30
const DEVELOPMENT_LEVY_RATE = 0.04
const SMALL_COMPANY_TURNOVER_CAP = 100_000_000
const SMALL_COMPANY_ASSET_CAP = 250_000_000

// VAT — flat 7.5%. Registration required above ₦50m turnover (raised from
// ₦25m). Small businesses (≤₦100m turnover, <₦250m fixed assets) are exempt
// from charging VAT even if registered — matches this site's VAT calculator.
const VAT_RATE = 0.075
const VAT_REGISTRATION_THRESHOLD = 50_000_000

const RENT_RELIEF_RATE = 0.2
const RENT_RELIEF_CAP = 500_000
const FALLBACK_USD_NGN = 1600

type UserType = 'freelancer' | 'company'

function calculatePIT(chargeableIncome: number): number {
  let remaining = chargeableIncome
  let lowerBound = 0
  let tax = 0
  for (const band of PIT_BANDS) {
    if (remaining <= 0) break
    const bandSize = band.upTo - lowerBound
    const amountInBand = Math.min(remaining, bandSize)
    tax += amountInBand * band.rate
    remaining -= amountInBand
    lowerBound = band.upTo
  }
  return tax
}

function formatNaira(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`
}

const EXPENSE_EXAMPLES = [
  'Internet & data', 'Equipment & software', 'Home office portion of rent/utilities',
  'Transport for business purposes', 'Professional/bank fees', 'Marketing & tools subscriptions',
]

export function NigeriaFreelancerSMETaxEstimator(_props: { locale: string }) {
  const [userType, setUserType] = useState<UserType>('freelancer')
  const [turnover, setTurnover] = useState('8000000')
  const [expenses, setExpenses] = useState('2000000')
  const [fixedAssets, setFixedAssets] = useState('0')
  const [isProfessionalServices, setIsProfessionalServices] = useState(false)
  const [pensionContribution, setPensionContribution] = useState('0')
  const [rentPaid, setRentPaid] = useState('0')
  const [inputVat, setInputVat] = useState('0')
  const [location, setLocation] = useState<'lagos' | 'other'>('other')
  const [hasForeignIncome, setHasForeignIncome] = useState(false)
  const [foreignIncomeUSD, setForeignIncomeUSD] = useState('0')
  const [usdNgn, setUsdNgn] = useState(FALLBACK_USD_NGN)
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'fallback'>('loading')
  const [copied, setCopied] = useState(false)

  // Live USD/NGN rate, no API key required — same source used elsewhere on this site.
  useEffect(() => {
    let cancelled = false
    async function fetchRate() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        if (!res.ok) throw new Error('bad response')
        const data = await res.json()
        const ngn = data?.rates?.NGN
        if (!cancelled && typeof ngn === 'number' && ngn > 0) {
          setUsdNgn(ngn)
          setRateStatus('live')
        } else {
          throw new Error('missing NGN rate')
        }
      } catch {
        if (!cancelled) {
          setUsdNgn(FALLBACK_USD_NGN)
          setRateStatus('fallback')
        }
      }
    }
    fetchRate()
    return () => { cancelled = true }
  }, [])

  const result = useMemo(() => {
    const grossTurnover = Math.max(0, parseFloat(turnover) || 0)
    const businessExpenses = Math.max(0, parseFloat(expenses) || 0)
    const assets = Math.max(0, parseFloat(fixedAssets) || 0)
    const pension = Math.max(0, parseFloat(pensionContribution) || 0)
    const rent = Math.max(0, parseFloat(rentPaid) || 0)
    const inputVatAmount = Math.max(0, parseFloat(inputVat) || 0)
    const foreignIncomeNGN = hasForeignIncome ? (Math.max(0, parseFloat(foreignIncomeUSD) || 0)) * usdNgn : 0

    const profit = Math.max(0, grossTurnover - businessExpenses)
    const totalTurnoverIncludingForeign = grossTurnover + foreignIncomeNGN

    const isSmallCompany = totalTurnoverIncludingForeign <= SMALL_COMPANY_TURNOVER_CAP && assets < SMALL_COMPANY_ASSET_CAP && !(userType === 'company' && isProfessionalServices)
    const mustRegisterForVAT = totalTurnoverIncludingForeign > VAT_REGISTRATION_THRESHOLD
    const exemptFromChargingVAT = isSmallCompany

    let primaryTax = 0
    let developmentLevy = 0
    let chargeableIncome = 0

    if (userType === 'freelancer') {
      const rentRelief = Math.min(rent * RENT_RELIEF_RATE, RENT_RELIEF_CAP)
      chargeableIncome = Math.max(0, profit + foreignIncomeNGN - pension - rentRelief)
      primaryTax = calculatePIT(chargeableIncome)
    } else {
      chargeableIncome = profit + foreignIncomeNGN
      if (!isSmallCompany) {
        primaryTax = chargeableIncome * CIT_RATE
        developmentLevy = chargeableIncome * DEVELOPMENT_LEVY_RATE
      }
    }

    const vatCollectible = !exemptFromChargingVAT && mustRegisterForVAT ? totalTurnoverIncludingForeign * VAT_RATE : 0
    const netVatPayable = Math.max(0, vatCollectible - inputVatAmount)

    const totalLiability = primaryTax + developmentLevy + netVatPayable
    const effectiveRate = grossTurnover > 0 ? (totalLiability / grossTurnover) * 100 : 0

    return {
      grossTurnover, businessExpenses, profit, foreignIncomeNGN, isSmallCompany,
      mustRegisterForVAT, exemptFromChargingVAT, chargeableIncome, primaryTax,
      developmentLevy, vatCollectible, netVatPayable, totalLiability, effectiveRate,
      rentRelief: userType === 'freelancer' ? Math.min(rent * RENT_RELIEF_RATE, RENT_RELIEF_CAP) : 0,
    }
  }, [userType, turnover, expenses, fixedAssets, isProfessionalServices, pensionContribution, rentPaid, inputVat, hasForeignIncome, foreignIncomeUSD, usdNgn])

  const tips = useMemo(() => {
    const list: string[] = []
    if (result.businessExpenses === 0) {
      list.push('You haven\u2019t entered any business expenses — track everything wholly and exclusively for your business (data, equipment, home office portion, transport) to reduce your taxable profit.')
    }
    if (userType === 'freelancer' && parseFloat(pensionContribution) === 0) {
      list.push('Voluntary pension contributions are deductible from your chargeable income — worth considering if you\u2019re not already contributing.')
    }
    if (userType === 'freelancer' && parseFloat(rentPaid) === 0) {
      list.push('If you pay rent, declaring it gets you rent relief (20% of rent, capped at ₦500,000) against your chargeable income.')
    }
    if (userType === 'freelancer' && result.profit > 40_000_000) {
      list.push('At this profit level, incorporating as a company could be worth comparing — switch the toggle above to see the company-mode numbers side by side.')
    }
    if (userType === 'company' && result.isSmallCompany) {
      list.push('You qualify as a small company (turnover ≤ ₦100m, fixed assets < ₦250m) — you\u2019re exempt from CIT, the Development Levy, and charging VAT. Formal CAC registration is what unlocks this if you haven\u2019t incorporated yet.');
    }
    if (result.mustRegisterForVAT && !result.exemptFromChargingVAT) {
      list.push('Your turnover is above the ₦50m VAT registration threshold — you should be charging 7.5% VAT on taxable supplies and remitting the net amount (after input VAT credit) to the Nigeria Revenue Service.')
    }
    list.push('Keep records and get a Tax Identification Number if you don\u2019t already have one — required for filing either way.')
    list.push('Annual returns are typically due by 31 March following the year of assessment.')
    return list
  }, [result, userType, pensionContribution, rentPaid])

  const copySummary = () => {
    const text = `${userType === 'freelancer' ? 'PIT' : 'CIT'}: ${formatNaira(result.primaryTax)} | Dev Levy: ${formatNaira(result.developmentLevy)} | Net VAT: ${formatNaira(result.netVatPayable)} | Total: ${formatNaira(result.totalLiability)} | Effective rate: ${result.effectiveRate.toFixed(1)}%`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
        Educational estimation tool based on publicly available 2026 Nigeria Tax Act (NTA) rules.
        Not legal or tax advice — consult a professional or the Nigeria Revenue Service / your
        State IRS. Laws can change; figures here are approximate.
      </p>

      {/* User type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">You are a...</label>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          <button type="button" onClick={() => setUserType('freelancer')} className={`flex-1 px-3 py-3 text-sm font-medium ${userType === 'freelancer' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>
            Freelancer / Sole Proprietor
          </button>
          <button type="button" onClick={() => setUserType('company')} className={`flex-1 px-3 py-3 text-sm font-medium ${userType === 'company' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>
            Registered Company (Ltd)
          </button>
        </div>
        {userType === 'freelancer' && (
          <p className="text-xs text-gray-500 mt-1.5">
            Registering a business name alone doesn't change this — you're only in the CIT regime once you incorporate a limited company with the CAC.
          </p>
        )}
      </div>

      {/* Turnover + expenses */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Annual Gross Turnover (₦)</label>
          <input
            type="text" inputMode="decimal"
            value={formatNumberInput(turnover)} onChange={e => setTurnover(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estimated Business Expenses (₦)</label>
          <input
            type="text" inputMode="decimal"
            value={formatNumberInput(expenses)} onChange={e => setExpenses(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EXPENSE_EXAMPLES.map(e => (
          <span key={e} className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">{e}</span>
        ))}
      </div>

      {userType === 'company' && (
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Total Fixed Assets (₦)</label>
            <input
              type="text" inputMode="decimal"
              value={formatNumberInput(fixedAssets)} onChange={e => setFixedAssets(cleanNumberInput(e.target.value))}
              className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Used to check small company CIT exemption eligibility.</p>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer w-fit">
            <input type="checkbox" checked={isProfessionalServices} onChange={e => setIsProfessionalServices(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-600">Professional services firm (legal, accounting, engineering, consulting, etc.)</span>
          </label>
          {isProfessionalServices && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              Professional services firms don't qualify for the small company 0% CIT rate regardless of turnover or assets.
            </p>
          )}
        </div>
      )}

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden max-w-xs">
          <button type="button" onClick={() => setLocation('lagos')} className={`flex-1 px-3 py-2.5 text-sm font-medium ${location === 'lagos' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Lagos</button>
          <button type="button" onClick={() => setLocation('other')} className={`flex-1 px-3 py-2.5 text-sm font-medium ${location === 'other' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Other State</button>
        </div>
        {location === 'lagos' && (
          <p className="text-xs text-gray-500 mt-1.5">
            PIT, CIT, and VAT are federal — the Lagos State Internal Revenue Service (LIRS) administers your PIT filing, but the rates and bands here are the same nationwide.
          </p>
        )}
      </div>

      {/* Foreign income */}
      <label className="flex items-center gap-2.5 cursor-pointer w-fit">
        <input type="checkbox" checked={hasForeignIncome} onChange={e => setHasForeignIncome(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <span className="text-sm text-gray-600">I also have foreign income (e.g. USD client payments)</span>
      </label>
      {hasForeignIncome && (
        <div className="border border-gray-100 rounded-xl p-4 space-y-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Foreign income (USD)</label>
          <input
            type="text" inputMode="decimal"
            value={formatNumberInput(foreignIncomeUSD)} onChange={e => setForeignIncomeUSD(cleanNumberInput(e.target.value))}
            className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-500">
            Converted at {rateStatus === 'loading' ? 'a live rate (loading…)' : formatNaira(usdNgn)} / $1
            {rateStatus === 'fallback' && ' (fallback rate — live rate unavailable right now)'}. Nigerian residents are generally taxed on worldwide income.
          </p>
        </div>
      )}

      {/* Advanced: reliefs + input VAT */}
      <details className="group">
        <summary className="text-sm font-medium text-indigo-700 hover:text-indigo-800 cursor-pointer list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
          Advanced: reliefs &amp; input VAT
        </summary>
        <div className="mt-3 grid sm:grid-cols-3 gap-3">
          {userType === 'freelancer' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pension contribution (₦/yr)</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(pensionContribution)} onChange={e => setPensionContribution(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Annual rent paid (₦)</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(rentPaid)} onChange={e => setRentPaid(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Input VAT paid on purchases (₦)</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(inputVat)} onChange={e => setInputVat(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
        </div>
      </details>

      {/* Results */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">Taxable Profit</span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.profit)}</span>
          </div>
          {userType === 'freelancer' && result.rentRelief > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">Rent Relief</span>
              <span className="font-semibold text-indigo-900">− {formatNaira(result.rentRelief)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">Chargeable Income</span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.chargeableIncome)}</span>
          </div>
          <div className="flex justify-between border-t border-indigo-200 pt-2.5">
            <span className="font-bold text-indigo-900">{userType === 'freelancer' ? 'PIT' : 'CIT'}</span>
            <span className="font-bold text-indigo-900">
              {result.isSmallCompany && userType === 'company' ? 'Exempt (₦0)' : formatNaira(result.primaryTax)}
            </span>
          </div>
          {userType === 'company' && result.developmentLevy > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">Development Levy (4%)</span>
              <span className="font-semibold text-indigo-900">{formatNaira(result.developmentLevy)}</span>
            </div>
          )}
        </div>

        <div className="bg-cyan-50 rounded-2xl p-6 border border-cyan-100 space-y-2.5">
          <div className="text-xs font-semibold text-cyan-900 mb-1">VAT</div>
          {result.exemptFromChargingVAT ? (
            <p className="text-sm text-cyan-900">Exempt from charging VAT (qualifies as a small business).</p>
          ) : !result.mustRegisterForVAT ? (
            <p className="text-sm text-cyan-900">Turnover is below the ₦50,000,000 VAT registration threshold — registration is optional.</p>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-cyan-900">VAT Collectible (7.5%)</span>
                <span className="font-semibold text-cyan-900">{formatNaira(result.vatCollectible)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cyan-900">Less Input VAT</span>
                <span className="font-semibold text-cyan-900">− {formatNaira(parseFloat(inputVat) || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-cyan-200 pt-2.5">
                <span className="font-bold text-cyan-900">Net VAT Payable</span>
                <span className="font-bold text-cyan-900">{formatNaira(result.netVatPayable)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-green-50 rounded-2xl p-6 border border-green-100 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-green-900">Total Estimated Tax Burden</div>
          <div className="text-xs text-green-600">Effective rate: {result.effectiveRate.toFixed(1)}% of turnover</div>
        </div>
        <div className="text-2xl font-black text-green-900">{formatNaira(result.totalLiability)}</div>
      </div>

      {/* Tips */}
      <div className="border border-gray-100 rounded-xl p-4 space-y-1.5">
        <p className="text-xs font-semibold text-gray-600 mb-1">Optimization tips</p>
        <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside">
          {tips.map((tip, i) => <li key={i}>{tip}</li>)}
        </ul>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={copySummary} className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl transition-colors">
          {copied ? '✓ Copied!' : 'Copy Summary'}
        </button>
        <button type="button" onClick={() => window.print()} className="px-6 py-3.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors">
          Print
        </button>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Based on the Nigeria Tax Act 2025, effective 1 January 2026: PIT bands (0% to 25%),
        CIT (0% for small companies with turnover ≤ ₦100,000,000 and fixed assets under
        ₦250,000,000, otherwise a flat 30% plus 4% Development Levy), and VAT (7.5%, registration
        required above ₦50,000,000 turnover). This is an educational estimate, not a filing
        service or tax advice — verify your specific situation with the Nigeria Revenue Service,
        your State Internal Revenue Service, or a licensed tax professional. Last updated for 2026
        NTA rules.
      </p>
    </div>
  )
}
