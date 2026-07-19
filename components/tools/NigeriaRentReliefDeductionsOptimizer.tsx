'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ─── Nigeria Tax Act 2025, Section 30(2)(a) — eligible personal deductions ──
// (i) NHF, (ii) NHIS, (iii) pension (employee 8% portion only), (iv) interest
// on owner-occupied housing loans, (v) life insurance/annuity premiums,
// (vi) rent relief — 20% of annual rent paid, capped at ₦500,000, whichever
// is lower. PAYE bands per the same Act, effective 1 January 2026.
const PAYE_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]

const RENT_RELIEF_RATE = 0.2
const RENT_RELIEF_CAP = 500_000
const DEFAULT_PENSION_RATE = 0.08
const DEFAULT_NHF_RATE = 0.025

type EmploymentType = 'employee' | 'selfEmployed'
type Receipt = { id: string; description: string; amount: number }

function calculatePAYE(chargeableIncome: number): number {
  let remaining = chargeableIncome
  let lowerBound = 0
  let tax = 0
  for (const band of PAYE_BANDS) {
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

let receiptIdCounter = 0

export function NigeriaRentReliefDeductionsOptimizer(_props: { locale: string }) {
  const [grossIncome, setGrossIncome] = useState('6000000')
  const [employmentType, setEmploymentType] = useState<EmploymentType>('employee')
  const [isTenant, setIsTenant] = useState(true)
  const [annualRent, setAnnualRent] = useState('1200000')
  const [isJoint, setIsJoint] = useState(false)
  const [jointSharePct, setJointSharePct] = useState('50')
  const [includePension, setIncludePension] = useState(true)
  const [includeNHF, setIncludeNHF] = useState(false)
  const [nhis, setNhis] = useState('0')
  const [lifeInsurance, setLifeInsurance] = useState('0')
  const [mortgageInterest, setMortgageInterest] = useState('0')
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [receiptDesc, setReceiptDesc] = useState('')
  const [receiptAmount, setReceiptAmount] = useState('')
  const [copied, setCopied] = useState(false)

  const receiptsTotal = receipts.reduce((sum, r) => sum + r.amount, 0)
  const enteredRent = Math.max(0, parseFloat(annualRent) || 0)
  const rentDiscrepancy = receipts.length > 0 ? Math.abs(receiptsTotal - enteredRent) : 0

  const addReceipt = () => {
    const amt = parseFloat(receiptAmount) || 0
    if (amt <= 0) return
    setReceipts(rs => [...rs, { id: String(receiptIdCounter++), description: receiptDesc || 'Rent payment', amount: amt }])
    setReceiptDesc('')
    setReceiptAmount('')
  }

  const removeReceipt = (id: string) => setReceipts(rs => rs.filter(r => r.id !== id))
  const useReceiptsTotal = () => setAnnualRent(String(receiptsTotal))

  const result = useMemo(() => {
    const gross = Math.max(0, parseFloat(grossIncome) || 0)
    const sharePct = isJoint ? Math.min(100, Math.max(0, parseFloat(jointSharePct) || 0)) / 100 : 1
    const claimableRent = isTenant ? enteredRent * sharePct : 0
    const rentRelief = Math.min(claimableRent * RENT_RELIEF_RATE, RENT_RELIEF_CAP)

    const pension = includePension ? gross * DEFAULT_PENSION_RATE : 0
    const nhf = includeNHF ? gross * DEFAULT_NHF_RATE : 0
    const nhisNum = Math.max(0, parseFloat(nhis) || 0)
    const lifeInsuranceNum = Math.max(0, parseFloat(lifeInsurance) || 0)
    const mortgageInterestNum = Math.max(0, parseFloat(mortgageInterest) || 0)

    const otherDeductions = pension + nhf + nhisNum + lifeInsuranceNum + mortgageInterestNum
    const totalDeductions = otherDeductions + rentRelief

    const chargeableBefore = Math.max(0, gross)
    const chargeableAfter = Math.max(0, gross - totalDeductions)

    const taxBefore = calculatePAYE(chargeableBefore)
    const taxAfter = calculatePAYE(chargeableAfter)
    const savings = taxBefore - taxAfter

    return {
      gross, claimableRent, rentRelief, pension, nhf, nhisNum, lifeInsuranceNum,
      mortgageInterestNum, otherDeductions, totalDeductions,
      chargeableBefore, chargeableAfter, taxBefore, taxAfter, savings,
    }
  }, [grossIncome, isTenant, enteredRent, isJoint, jointSharePct, includePension, includeNHF, nhis, lifeInsurance, mortgageInterest])

  const chartData = [
    { name: 'Tax before relief', value: Math.round(result.taxBefore), fill: '#c7d2fe' },
    { name: 'Tax after relief', value: Math.round(result.taxAfter), fill: '#4338ca' },
  ]

  const copySummary = () => {
    const text = `Gross: ${formatNaira(result.gross)} | Rent relief: ${formatNaira(result.rentRelief)} | Other deductions: ${formatNaira(result.otherDeductions)} | Tax before: ${formatNaira(result.taxBefore)} | Tax after: ${formatNaira(result.taxAfter)} | Savings: ${formatNaira(result.savings)}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
        For estimation and tracking only. Claims require accurate declaration and documentary
        evidence — consult your employer's HR, State Internal Revenue Service, or a licensed tax
        professional before filing.
      </p>

      {/* Income + employment */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Annual Gross Income (₦)</label>
          <input
            type="text" inputMode="decimal"
            value={formatNumberInput(grossIncome)} onChange={e => setGrossIncome(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employment type</label>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button type="button" onClick={() => setEmploymentType('employee')} className={`flex-1 px-3 py-3 text-sm font-medium ${employmentType === 'employee' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Employee</button>
            <button type="button" onClick={() => setEmploymentType('selfEmployed')} className={`flex-1 px-3 py-3 text-sm font-medium ${employmentType === 'selfEmployed' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}>Self-Employed</button>
          </div>
        </div>
      </div>

      {/* Tenant status + rent */}
      <label className="flex items-center gap-2.5 cursor-pointer w-fit">
        <input type="checkbox" checked={isTenant} onChange={e => setIsTenant(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <span className="text-sm font-semibold text-gray-700">I am a tenant (rent relief is only available to tenants, not homeowners)</span>
      </label>

      {isTenant && (
        <div className="space-y-4 border border-gray-100 rounded-xl p-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Annual Rent Paid (₦)</label>
            <input
              type="text" inputMode="decimal"
              value={formatNumberInput(annualRent)} onChange={e => setAnnualRent(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer w-fit">
            <input type="checkbox" checked={isJoint} onChange={e => setIsJoint(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-gray-600">This is a joint tenancy — I only pay part of the rent</span>
          </label>
          {isJoint && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your share of the rent (%)</label>
              <input
                type="number" min={0} max={100}
                value={jointSharePct} onChange={e => setJointSharePct(e.target.value)}
                className="w-full max-w-[140px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Rent relief applies only to the portion of rent you personally pay.</p>
            </div>
          )}

          {/* Receipt tracker */}
          <details className="group">
            <summary className="text-sm font-medium text-indigo-700 hover:text-indigo-800 cursor-pointer list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
              Track rent payments (optional — helps you check your declared rent against what you actually paid)
            </summary>
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text" placeholder="e.g. January rent"
                  value={receiptDesc} onChange={e => setReceiptDesc(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <input
                  type="text" inputMode="decimal" placeholder="Amount (₦)"
                  value={formatNumberInput(receiptAmount)} onChange={e => setReceiptAmount(cleanNumberInput(e.target.value))}
                  className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
                <button type="button" onClick={addReceipt} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">
                  Add
                </button>
              </div>
              {receipts.length > 0 && (
                <div className="space-y-1.5">
                  {receipts.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-700">{r.description}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{formatNaira(r.amount)}</span>
                        <button type="button" onClick={() => removeReceipt(r.id)} className="text-gray-400 hover:text-red-600 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">Receipts total: {formatNaira(receiptsTotal)}</span>
                    <button type="button" onClick={useReceiptsTotal} className="text-xs font-medium text-indigo-700 hover:text-indigo-800">
                      Use this as my rent →
                    </button>
                  </div>
                  {rentDiscrepancy > 0 && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                      Your declared rent ({formatNaira(enteredRent)}) differs from your tracked receipts ({formatNaira(receiptsTotal)}) by {formatNaira(rentDiscrepancy)}. Keep this consistent with what you can actually document.
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400">
                Tracked here for your own reference only — nothing is uploaded or stored beyond this browser session. Keep your tenancy agreement and payment proof (bank transfer records, receipts) for actual filing.
              </p>
            </div>
          </details>
        </div>
      )}

      {/* Other deductions */}
      <details className="group" open>
        <summary className="text-sm font-medium text-indigo-700 hover:text-indigo-800 cursor-pointer list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
          Other eligible deductions (NTA s.30(2)(a))
        </summary>
        <div className="mt-3 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={includePension} onChange={e => setIncludePension(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-700">Pension (8% of gross, employee portion only)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={includeNHF} onChange={e => setIncludeNHF(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-gray-700">NHF (2.5% of basic salary — approximated as gross here)</span>
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">NHIS contributions (₦/yr)</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(nhis)} onChange={e => setNhis(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Life insurance premium (₦/yr)</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(lifeInsurance)} onChange={e => setLifeInsurance(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mortgage interest, owner-occupied (₦/yr)</label>
              <input type="text" inputMode="decimal" value={formatNumberInput(mortgageInterest)} onChange={e => setMortgageInterest(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      </details>

      {/* Results */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">Rent Relief</span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.rentRelief)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">Other Deductions</span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.otherDeductions)}</span>
          </div>
          <div className="flex justify-between border-t border-indigo-200 pt-2.5">
            <span className="font-bold text-indigo-900">Total Deductions</span>
            <span className="font-bold text-indigo-900">{formatNaira(result.totalDeductions)}</span>
          </div>
        </div>
        <div className="bg-green-50 rounded-2xl p-6 border border-green-100 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-green-900">Tax Without These Deductions</span>
            <span className="font-semibold text-green-900">{formatNaira(result.taxBefore)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-900">Tax With Deductions Applied</span>
            <span className="font-semibold text-green-900">{formatNaira(result.taxAfter)}</span>
          </div>
          <div className="flex justify-between border-t border-green-200 pt-2.5">
            <span className="font-bold text-green-900">Estimated Savings</span>
            <span className="text-xl font-black text-green-900">{formatNaira(result.savings)}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {result.savings > 0 && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: unknown) => formatNaira(Number(value ?? 0))} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tips */}
      <div className="border border-gray-100 rounded-xl p-4 space-y-1.5">
        <p className="text-xs font-semibold text-gray-600 mb-1">Next steps</p>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          {employmentType === 'employee' ? (
            <li>Submit your tenancy agreement and rent payment proof to your employer's HR/payroll team so rent relief is applied to your monthly PAYE.</li>
          ) : (
            <li>File your annual self-assessment return directly with the Nigeria Revenue Service or your State Internal Revenue Service, declaring these deductions with supporting evidence.</li>
          )}
          <li>Keep your tenancy agreement and bank transfer proof — tax authorities can request evidence and deny claims without it.</li>
          <li>Annual returns are typically due by 31 March following the year of assessment — confirm the exact deadline for your situation.</li>
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
        Based on Section 30(2)(a) of the Nigeria Tax Act 2025, effective 1 January 2026. Pension and
        NHF are, strictly, calculated on Basic + Housing + Transport allowances, not full gross pay —
        this tool uses gross as a standard approximation. This is an estimate for planning and
        tracking purposes only, not a filing service or tax advice — accuracy depends on your inputs,
        and all claims require documentary evidence and are subject to verification by the tax
        authority.
      </p>
    </div>
  )
}
