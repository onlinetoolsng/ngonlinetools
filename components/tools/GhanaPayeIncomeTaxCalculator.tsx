'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Ghana Revenue Authority — effective 1 January 2024 ────────────────────
// Under the Income Tax (Amendment) (No. 2) Act, 2023 (Act 1111), still the
// current published bands as of 2026. Bands are progressive: each slice of
// income is taxed only at its own rate, not the whole amount at the top
// rate reached. "Width" below is the size of each slice (GRA publishes
// these as "First 490", "Next 110", etc.), not a cumulative ceiling.
// Non-residents pay a flat 25% on chargeable income with no bands at all.
const MONTHLY_BANDS = [
  { width: 490, rate: 0 },
  { width: 110, rate: 0.05 },
  { width: 130, rate: 0.10 },
  { width: 3_166.67, rate: 0.175 },
  { width: 16_000, rate: 0.25 },
  { width: 30_520, rate: 0.30 },
  { width: Infinity, rate: 0.35 },
]

const ANNUAL_BANDS = [
  { width: 5_880, rate: 0 },
  { width: 1_320, rate: 0.05 },
  { width: 1_560, rate: 0.10 },
  { width: 38_000, rate: 0.175 },
  { width: 192_000, rate: 0.25 },
  { width: 366_240, rate: 0.30 },
  { width: Infinity, rate: 0.35 },
]

const NON_RESIDENT_RATE = 0.25
const SSNIT_EMPLOYEE_RATE = 0.055
const SSNIT_CEILING_MONTHLY = 69_000
const SSNIT_CEILING_ANNUAL = 69_000 * 12

const RELIEFS_ANNUAL = {
  marriage: 1_200,
  childEducationPerChild: 600,
  childEducationMaxChildren: 3,
  oldAge: 1_500,
  agedDependantPerPerson: 1_000,
  agedDependantMax: 2,
  trainingMax: 2_000,
}

type Period = 'monthly' | 'annual'
type BandResult = { width: number; rate: number; taxOnSlice: number }

function calculatePaye(chargeable: number, resident: boolean, period: Period): { tax: number; breakdown: BandResult[] } {
  if (chargeable <= 0) return { tax: 0, breakdown: [] }
  if (!resident) return { tax: chargeable * NON_RESIDENT_RATE, breakdown: [{ width: chargeable, rate: NON_RESIDENT_RATE, taxOnSlice: chargeable * NON_RESIDENT_RATE }] }

  const bands = period === 'monthly' ? MONTHLY_BANDS : ANNUAL_BANDS
  let remaining = chargeable
  let tax = 0
  const breakdown: BandResult[] = []
  for (const b of bands) {
    if (remaining <= 0) break
    const slice = Math.min(remaining, b.width)
    const sliceTax = Math.round(slice * b.rate * 100) / 100
    tax += sliceTax
    if (slice > 0) breakdown.push({ width: slice, rate: b.rate, taxOnSlice: sliceTax })
    remaining -= slice
  }
  return { tax: Math.round(tax * 100) / 100, breakdown }
}

function formatGHS(value: number) {
  if (!Number.isFinite(value)) return 'GHS 0'
  return `GHS ${Math.max(0, value).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function GhanaPayeIncomeTaxCalculator(_props: { locale: string }) {
  const [period, setPeriod] = useState<Period>('monthly')
  const [resident, setResident] = useState(true)
  const [basicInput, setBasicInput] = useState('5000')
  const [allowancesInput, setAllowancesInput] = useState('0')
  const [overridePension, setOverridePension] = useState(false)
  const [pensionOverrideInput, setPensionOverrideInput] = useState('0')

  const [showDeductions, setShowDeductions] = useState(false)
  const [mortgageInput, setMortgageInput] = useState('0')
  const [tier3Input, setTier3Input] = useState('0')
  const [donationsInput, setDonationsInput] = useState('0')

  const [showReliefs, setShowReliefs] = useState(false)
  const [claimMarriage, setClaimMarriage] = useState(false)
  const [childCount, setChildCount] = useState(0)
  const [claimOldAge, setClaimOldAge] = useState(false)
  const [agedDependants, setAgedDependants] = useState(0)
  const [disabilityPct, setDisabilityPct] = useState(false)
  const [trainingInput, setTrainingInput] = useState('0')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [bonusInput, setBonusInput] = useState('0')
  const [overtimeInput, setOvertimeInput] = useState('0')
  const [isJuniorStaff, setIsJuniorStaff] = useState(false)

  const result = useMemo(() => {
    const basic = Math.max(0, parseFloat(basicInput) || 0)
    const allowances = Math.max(0, parseFloat(allowancesInput) || 0)
    const gross = basic + allowances

    const ssnitCeiling = period === 'monthly' ? SSNIT_CEILING_MONTHLY : SSNIT_CEILING_ANNUAL
    const autoPension = Math.min(basic, ssnitCeiling) * SSNIT_EMPLOYEE_RATE
    const pension = overridePension ? Math.max(0, parseFloat(pensionOverrideInput) || 0) : autoPension

    const mortgage = Math.max(0, parseFloat(mortgageInput) || 0)
    const tier3 = Math.max(0, parseFloat(tier3Input) || 0)
    const donations = Math.max(0, parseFloat(donationsInput) || 0)

    // Bonus: first 15% of annual basic taxed flat at 5%; excess joins ordinary income.
    const annualBasic = period === 'monthly' ? basic * 12 : basic
    const bonus = Math.max(0, parseFloat(bonusInput) || 0)
    const bonusThreshold = annualBasic * 0.15
    const bonusAtFlat = Math.min(bonus, bonusThreshold)
    const bonusExcess = Math.max(0, bonus - bonusThreshold)
    const bonusFlatTax = bonusAtFlat * 0.05

    // Overtime: junior staff only, qualifying annual income <= GHS 18,000.
    const overtime = Math.max(0, parseFloat(overtimeInput) || 0)
    const qualifiesForOvertimeRate = isJuniorStaff && annualBasic <= 18_000
    let overtimeFlatTax = 0
    let overtimeOrdinary = 0
    if (qualifiesForOvertimeRate) {
      const monthlyBasic = period === 'monthly' ? basic : basic / 12
      const overtimeThreshold = monthlyBasic * 0.5
      const overtimeAtLow = resident ? Math.min(overtime, overtimeThreshold) : 0
      const overtimeAtHigh = resident ? Math.max(0, overtime - overtimeThreshold) : overtime
      overtimeFlatTax = resident ? overtimeAtLow * 0.05 + overtimeAtHigh * 0.10 : overtime * 0.20
    } else {
      overtimeOrdinary = overtime
    }

    const chargeable = Math.max(0, gross + bonusExcess + overtimeOrdinary - pension - mortgage - tier3 - donations)
    const { tax: bandsTax, breakdown } = calculatePaye(chargeable, resident, period)

    // Personal reliefs — annual amounts, prorated for monthly mode.
    const proRate = period === 'monthly' ? 1 / 12 : 1
    let reliefsTotal = 0
    if (claimMarriage) reliefsTotal += RELIEFS_ANNUAL.marriage * proRate
    if (childCount > 0) reliefsTotal += RELIEFS_ANNUAL.childEducationPerChild * Math.min(childCount, RELIEFS_ANNUAL.childEducationMaxChildren) * proRate
    if (claimOldAge) reliefsTotal += RELIEFS_ANNUAL.oldAge * proRate
    if (agedDependants > 0) reliefsTotal += RELIEFS_ANNUAL.agedDependantPerPerson * Math.min(agedDependants, RELIEFS_ANNUAL.agedDependantMax) * proRate
    if (disabilityPct) reliefsTotal += chargeable * 0.25
    const training = Math.max(0, parseFloat(trainingInput) || 0)
    if (training > 0) reliefsTotal += Math.min(training, RELIEFS_ANNUAL.trainingMax * proRate)

    const paye = Math.max(0, bandsTax + bonusFlatTax + overtimeFlatTax - reliefsTotal)
    const netPay = gross + bonus + overtime - pension - tier3 - paye
    const effectiveRate = gross > 0 ? (paye / gross) * 100 : 0
    const employerCost = gross + Math.min(basic, ssnitCeiling) * 0.13

    return {
      gross, pension, chargeable, breakdown, reliefsTotal, paye, netPay, effectiveRate, employerCost,
      annualGross: period === 'monthly' ? gross * 12 : gross,
      annualNet: period === 'monthly' ? netPay * 12 : netPay,
    }
  }, [
    basicInput, allowancesInput, period, resident, overridePension, pensionOverrideInput,
    mortgageInput, tier3Input, donationsInput, claimMarriage, childCount, claimOldAge,
    agedDependants, disabilityPct, trainingInput, bonusInput, overtimeInput, isJuniorStaff,
  ])

  const copyResult = () => {
    navigator.clipboard.writeText(
      `Gross: ${formatGHS(result.gross)} | SSNIT: ${formatGHS(result.pension)} | PAYE: ${formatGHS(result.paye)} | Net pay: ${formatGHS(result.netPay)} (${result.effectiveRate.toFixed(1)}% effective rate)`
    )
  }

  return (
    <div className="space-y-6">
      {/* Period + residency */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
          {(['monthly', 'annual'] as Period[]).map(p => (
            <button key={p} type="button" onClick={() => setPeriod(p)} className={`flex-1 px-3 py-2.5 font-semibold capitalize transition-colors ${period === p ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
          {[true, false].map(r => (
            <button key={String(r)} type="button" onClick={() => setResident(r)} className={`flex-1 px-3 py-2.5 font-semibold transition-colors ${resident === r ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>
              {r ? 'Resident' : 'Non-resident'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Basic salary ({period})</label>
        <input type="text" inputMode="decimal" value={formatNumberInput(basicInput)} onChange={e => setBasicInput(cleanNumberInput(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Allowances & taxable benefits</label>
        <input type="text" inputMode="decimal" value={formatNumberInput(allowancesInput)} onChange={e => setAllowancesInput(cleanNumberInput(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition" />
      </div>

      {resident && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <input type="checkbox" checked={overridePension} onChange={e => setOverridePension(e.target.checked)} className="accent-indigo-700" />
            Override auto-calculated SSNIT (5.5% of basic, capped)
          </label>
          {overridePension && (
            <input type="text" inputMode="decimal" value={formatNumberInput(pensionOverrideInput)} onChange={e => setPensionOverrideInput(cleanNumberInput(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400" />
          )}
        </div>
      )}

      {/* Optional deductions */}
      <div>
        <button type="button" onClick={() => setShowDeductions(v => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
          {showDeductions ? 'Hide' : 'Show'} optional deductions (mortgage interest, Tier-3, donations)
        </button>
        {showDeductions && (
          <div className="mt-3 grid grid-cols-3 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mortgage interest</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(mortgageInput)} onChange={e => setMortgageInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tier-3 / provident</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(tier3Input)} onChange={e => setTier3Input(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Qualifying donations</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(donationsInput)} onChange={e => setDonationsInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
            </div>
          </div>
        )}
      </div>

      {/* Personal reliefs */}
      {resident && (
        <div>
          <button type="button" onClick={() => setShowReliefs(v => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
            {showReliefs ? 'Hide' : 'Show'} personal reliefs
          </button>
          {showReliefs && (
            <div className="mt-3 space-y-2.5 bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={claimMarriage} onChange={e => setClaimMarriage(e.target.checked)} className="accent-indigo-700" /> Marriage/responsibility relief (GHS 1,200/yr)</label>
              <div className="flex items-center gap-2">
                <span className="flex-1">Children in education (max 3, GHS 600/yr each)</span>
                <input type="number" min={0} max={3} value={childCount} onChange={e => setChildCount(Math.max(0, parseInt(e.target.value) || 0))} className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={claimOldAge} onChange={e => setClaimOldAge(e.target.checked)} className="accent-indigo-700" /> Old age relief, 60+ (GHS 1,500/yr)</label>
              <div className="flex items-center gap-2">
                <span className="flex-1">Aged dependants, 60+ (max 2, GHS 1,000/yr each)</span>
                <input type="number" min={0} max={2} value={agedDependants} onChange={e => setAgedDependants(Math.max(0, parseInt(e.target.value) || 0))} className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={disabilityPct} onChange={e => setDisabilityPct(e.target.checked)} className="accent-indigo-700" /> Disability relief (25% of chargeable income)</label>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Training/education cost (up to GHS 2,000/yr)</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(trainingInput)} onChange={e => setTrainingInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
              </div>
              <p className="text-[11px] text-gray-400">These model your potential relief — actual claims require the relevant GRA form.</p>
            </div>
          )}
        </div>
      )}

      {/* Advanced: bonus/overtime */}
      <div>
        <button type="button" onClick={() => setShowAdvanced(v => !v)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
          {showAdvanced ? 'Hide' : 'Show'} advanced (bonus, overtime)
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bonus amount</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(bonusInput)} onChange={e => setBonusInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
              <p className="text-[11px] text-gray-400 mt-1">First 15% of annual basic salary is taxed flat at 5%; anything above that joins ordinary income at graduated rates.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Overtime amount</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(overtimeInput)} onChange={e => setOvertimeInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900" />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={isJuniorStaff} onChange={e => setIsJuniorStaff(e.target.checked)} className="accent-indigo-700" />
              Junior staff (qualifying annual income ≤ GHS 18,000)
            </label>
            <p className="text-[11px] text-gray-400">Only junior staff earning at or below this threshold qualify for the special overtime rates (5%/10% resident, 20% non-resident). Otherwise overtime is taxed as ordinary income.</p>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">Gross employment income</dt><dd className="font-medium text-gray-800">{formatGHS(result.gross)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Employee SSNIT/pension</dt><dd className="font-medium text-gray-800">{formatGHS(result.pension)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Chargeable income</dt><dd className="font-medium text-gray-800">{formatGHS(result.chargeable)}</dd></div>
          {result.reliefsTotal > 0 && <div className="flex justify-between"><dt className="text-gray-500">Personal reliefs applied</dt><dd className="font-medium text-gray-800">{formatGHS(result.reliefsTotal)}</dd></div>}
          <div className="flex justify-between border-t border-indigo-100 pt-2"><dt className="text-gray-700 font-medium">PAYE</dt><dd className="font-semibold text-gray-800">{formatGHS(result.paye)}</dd></div>
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Net take-home {period === 'monthly' ? 'pay' : 'income'}</dt>
            <dd className="font-semibold text-indigo-700 text-lg">{formatGHS(result.netPay)}</dd>
          </div>
          <div className="flex justify-between"><dt className="text-gray-500">Effective tax rate</dt><dd className="font-medium text-gray-800">{result.effectiveRate.toFixed(1)}%</dd></div>
          {period === 'monthly' && (
            <>
              <div className="flex justify-between border-t border-indigo-100 pt-2"><dt className="text-gray-500">Annual gross</dt><dd className="font-medium text-gray-800">{formatGHS(result.annualGross)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Annual net</dt><dd className="font-medium text-gray-800">{formatGHS(result.annualNet)}</dd></div>
            </>
          )}
          <div className="flex justify-between"><dt className="text-gray-500">Employer cost (incl. 13% employer SSNIT)</dt><dd className="font-medium text-gray-800">{formatGHS(result.employerCost)}</dd></div>
        </dl>

        {result.breakdown.length > 0 && (
          <div className="bg-white rounded-xl border border-indigo-100 p-3 text-xs text-gray-600">
            <p className="font-semibold text-gray-700 mb-1.5">PAYE by band</p>
            <div className="space-y-1">
              {result.breakdown.map((b, i) => (
                <div key={i} className="flex justify-between">
                  <span>{formatGHS(b.width)} at {(b.rate * 100).toFixed(1)}%</span>
                  <span>{formatGHS(b.taxOnSlice)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">Good to know</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Bands are progressive — each slice of income is taxed only at its own rate, not your whole income at the top rate you reach.</li>
          <li>Non-residents pay a flat 25% on chargeable income, with no bands.</li>
          <li>SSNIT employee contribution is 5.5% of basic salary, capped at GHS 69,000 monthly insurable earnings, and is deductible before PAYE.</li>
          <li>Personal reliefs reduce tax payable, not chargeable income — actual claims require the relevant GRA form.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          Uses the tax bands effective 1 January 2024 under the Income Tax (Amendment) (No. 2) Act, 2023 (Act 1111), as published by the Ghana Revenue Authority — still current as of 2026. For estimation only; confirm with your payslip or a tax practitioner.
        </p>
      </div>
    </div>
  )
}
