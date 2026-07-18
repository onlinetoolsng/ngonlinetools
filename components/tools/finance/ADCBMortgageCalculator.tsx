'use client'

import { useState, useEffect, useCallback } from 'react'

type Props = { locale: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const NATIONALITY_OPTIONS = [
  { value: 'national', label: 'UAE National' },
  { value: 'expat',    label: 'Expat Resident' },
  { value: 'nonres',   label: 'Non-Resident' },
]

const EMPLOYMENT_OPTIONS = [
  { value: 'salaried', label: 'Salaried' },
  { value: 'self',     label: 'Self-Employed' },
]

const PROPERTY_TYPE_OPTIONS = [
  { value: 'ready',    label: 'Ready Property' },
  { value: 'offplan',  label: 'Off-Plan' },
]

const PROPERTY_ORDER_OPTIONS = [
  { value: 'first',      label: 'First Property' },
  { value: 'additional', label: 'Additional Property' },
]

const FINANCE_TYPE_OPTIONS = [
  { value: 'conventional', label: 'Conventional (Interest)' },
  { value: 'islamic',       label: 'Islamic (Profit Rate)' },
]

// LTV rules per CBUAE C 31/2013 as followed by ADCB
function getMaxLTV(
  nationality: string,
  propertyType: string,
  propertyOrder: string,
  propertyValue: number,
): number {
  if (propertyType === 'offplan') return 50
  if (nationality === 'nonres')   return 50

  const isNational  = nationality === 'national'
  const isFirst     = propertyOrder === 'first'
  const highValue   = propertyValue > 5_000_000

  if (isNational && isFirst  && !highValue) return 85
  if (isNational && isFirst  &&  highValue) return 70
  if (isNational && !isFirst && !highValue) return 65
  if (isNational && !isFirst &&  highValue) return 65
  // expat
  if (isFirst  && !highValue) return 80
  if (isFirst  &&  highValue) return 65
  return 60
}

function calcEMI(principal: number, annualRate: number, months: number): number {
  if (annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function fmtAED(n: number, decimals = 0): string {
  return `AED ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Inputs {
  propertyValue: string
  downPaymentPct: string
  annualRate: string
  tenorYears: string
  nationality: string
  employment: string
  grossIncome: string
  existingDebts: string
  propertyType: string
  propertyOrder: string
  financeType: string
}

interface CalcResult {
  loanAmount: number
  downPayment: number
  downPaymentPct: number
  maxLTV: number
  ltvActual: number
  ltvOk: boolean
  emi: number
  totalRepayment: number
  totalInterest: number
  dbr: number
  dbrOk: boolean
  dbrStress: number
  dbrStressOk: boolean
  emiStress: number
  maxLoanByIncome: number
  annualRate: number
  tenorYears: number
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
      {hint && <span className="font-normal text-gray-500 ml-1 text-xs">{hint}</span>}
    </label>
  )
}

function InputAED({
  value, onChange, placeholder = '0',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 pointer-events-none">AED</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
      />
    </div>
  )
}

function SelectField({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Row({
  label, value, highlight = false, negative = false, muted = false, bold = false,
}: { label: string; value: string; highlight?: boolean; negative?: boolean; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className={`text-sm ${muted ? 'text-gray-500' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? 'font-bold' : 'font-semibold'} ${
        highlight ? 'text-blue-700' : negative ? 'text-red-500' : muted ? 'text-gray-500' : 'text-gray-900'
      }`}>{value}</span>
    </div>
  )
}

function DBRBadge({ dbr, label }: { dbr: number; label: string }) {
  const ok      = dbr <= 50
  const warning = dbr > 40 && dbr <= 50
  const color   = dbr > 50 ? 'bg-red-100 text-red-700 border-red-200'
                : warning   ? 'bg-amber-100 text-amber-700 border-amber-200'
                :             'bg-emerald-100 text-emerald-700 border-emerald-200'
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 border ${color}`}>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-sm font-black tabular-nums">{fmtPct(dbr)}</span>
    </div>
  )
}

// Yearly amortization table rows
function buildYearlySchedule(principal: number, annualRate: number, tenorYears: number) {
  const r   = annualRate / 100 / 12
  const n   = tenorYears * 12
  const emi = calcEMI(principal, annualRate, n)
  const rows: { year: number; openBal: number; paid: number; interest: number; principal: number; closeBal: number }[] = []
  let balance = principal
  for (let yr = 1; yr <= tenorYears; yr++) {
    const open = balance
    let yearInt = 0, yearPrin = 0
    for (let m = 0; m < 12; m++) {
      if (balance <= 0) break
      const intPart  = balance * r
      const prinPart = Math.min(emi - intPart, balance)
      yearInt  += intPart
      yearPrin += prinPart
      balance  -= prinPart
    }
    rows.push({
      year: yr,
      openBal: open,
      paid: (yearInt + yearPrin),
      interest: yearInt,
      principal: yearPrin,
      closeBal: Math.max(0, balance),
    })
    if (balance <= 0) break
  }
  return rows
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ADCBMortgageCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [inputs, setInputs] = useState<Inputs>({
    propertyValue:  '2000000',
    downPaymentPct: '20',
    annualRate:     '4.49',
    tenorYears:     '25',
    nationality:    'expat',
    employment:     'salaried',
    grossIncome:    '30000',
    existingDebts:  '0',
    propertyType:   'ready',
    propertyOrder:  'first',
    financeType:    'conventional',
  })

  const [result, setResult]       = useState<CalcResult | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'affordability'>('basic')

  function update(field: keyof Inputs, val: string) {
    setInputs(prev => ({ ...prev, [field]: val }))
  }

  const calculate = useCallback(() => {
    const propVal  = parseFloat(inputs.propertyValue)  || 0
    const dpPct    = parseFloat(inputs.downPaymentPct) || 0
    const rate     = parseFloat(inputs.annualRate)     || 0
    const tenor    = parseInt(inputs.tenorYears)       || 25
    const income   = parseFloat(inputs.grossIncome)    || 0
    const debts    = parseFloat(inputs.existingDebts)  || 0

    if (!propVal || !rate || !tenor) { setResult(null); return }

    const maxLTV     = getMaxLTV(inputs.nationality, inputs.propertyType, inputs.propertyOrder, propVal)
    const dpAmount   = propVal * (dpPct / 100)
    const loanAmount = propVal - dpAmount
    const ltvActual  = (loanAmount / propVal) * 100
    const ltvOk      = ltvActual <= maxLTV

    const months      = tenor * 12
    const emi         = calcEMI(loanAmount, rate, months)
    const totalRepay  = emi * months
    const totalInt    = totalRepay - loanAmount

    // DBR
    const dbr         = income > 0 ? ((debts + emi) / income) * 100 : 0
    const dbrOk       = dbr <= 50

    // Stress test at +3%
    const stressRate  = rate + 3
    const emiStress   = calcEMI(loanAmount, stressRate, months)
    const dbrStress   = income > 0 ? ((debts + emiStress) / income) * 100 : 0
    const dbrStressOk = dbrStress <= 50

    // Max loan by income (50% DBR - existing debts)
    const maxEMIByIncome   = income * 0.5 - debts
    const maxLoanByIncome  = maxEMIByIncome > 0
      ? maxEMIByIncome * (Math.pow(1 + rate / 100 / 12, months) - 1) / ((rate / 100 / 12) * Math.pow(1 + rate / 100 / 12, months))
      : 0

    setResult({
      loanAmount, downPayment: dpAmount, downPaymentPct: dpPct,
      maxLTV, ltvActual, ltvOk,
      emi, totalRepayment: totalRepay, totalInterest: totalInt,
      dbr, dbrOk, dbrStress, dbrStressOk, emiStress,
      maxLoanByIncome,
      annualRate: rate, tenorYears: tenor,
    })
  }, [inputs])

  // Live recalculate
  useEffect(() => { calculate() }, [calculate])

  const scheduleRows = result
    ? buildYearlySchedule(result.loanAmount, result.annualRate, result.tenorYears)
    : []

  const maxLTVForProfile = getMaxLTV(
    inputs.nationality, inputs.propertyType, inputs.propertyOrder,
    parseFloat(inputs.propertyValue) || 0,
  )
  const minDPPct = 100 - maxLTVForProfile

  return (
    <div className="space-y-6">

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(['basic', 'affordability'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'basic' ? 'Calculator' : 'Affordability & DBR'}
          </button>
        ))}
      </div>

      {/* ── Inputs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Property Value */}
        <div className="sm:col-span-2">
          <Label hint="Ready / Off-Plan property in UAE">Property Value (AED)</Label>
          <InputAED value={inputs.propertyValue} onChange={v => update('propertyValue', v)} placeholder="e.g. 2,000,000" />
        </div>

        {/* Nationality / Residency */}
        <div>
          <Label>Nationality / Residency</Label>
          <SelectField value={inputs.nationality} onChange={v => update('nationality', v)} options={NATIONALITY_OPTIONS} />
        </div>

        {/* Property Type */}
        <div>
          <Label>Property Type</Label>
          <SelectField value={inputs.propertyType} onChange={v => update('propertyType', v)} options={PROPERTY_TYPE_OPTIONS} />
        </div>

        {/* First or Additional */}
        <div>
          <Label>Property Order</Label>
          <SelectField value={inputs.propertyOrder} onChange={v => update('propertyOrder', v)} options={PROPERTY_ORDER_OPTIONS} />
        </div>

        {/* Finance Type */}
        <div>
          <Label>Finance Type</Label>
          <SelectField value={inputs.financeType} onChange={v => update('financeType', v)} options={FINANCE_TYPE_OPTIONS} />
        </div>

        {/* Down Payment % */}
        <div>
          <Label hint={`Min ${minDPPct}% for your profile`}>
            Down Payment (%)
          </Label>
          <div className="relative">
            <input
              type="number"
              min={minDPPct}
              max={99}
              step={1}
              value={inputs.downPaymentPct}
              onChange={e => update('downPaymentPct', e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">%</span>
          </div>
          {parseFloat(inputs.downPaymentPct) < minDPPct && (
            <p className="text-xs text-red-600 mt-1">
              Min down payment is {minDPPct}% ({fmtAED((parseFloat(inputs.propertyValue) || 0) * minDPPct / 100)}) for your profile.
            </p>
          )}
        </div>

        {/* Rate */}
        <div>
          <Label hint={inputs.financeType === 'islamic' ? 'Profit rate p.a.' : 'Interest rate p.a.'}>
            Annual Rate (%)
          </Label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={15}
              step={0.01}
              value={inputs.annualRate}
              onChange={e => update('annualRate', e.target.value)}
              className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">ADCB indicative from ~3.99% p.a. (subject to approval & EIBOR)</p>
        </div>

        {/* Tenor */}
        <div>
          <Label hint={inputs.nationality === 'nonres' ? 'Max 15 yrs for non-residents' : 'Max 25 years'}>
            Loan Tenor (Years)
          </Label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={inputs.nationality === 'nonres' ? 15 : 25}
              value={inputs.tenorYears}
              onChange={e => update('tenorYears', e.target.value)}
              className="w-full pl-4 pr-14 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">yrs</span>
          </div>
        </div>

        {/* ── Affordability tab inputs ── */}
        {activeTab === 'affordability' && (
          <>
            <div>
              <Label hint="For DBR calculation">Gross Monthly Income (AED)</Label>
              <InputAED value={inputs.grossIncome} onChange={v => update('grossIncome', v)} placeholder="e.g. 30,000" />
            </div>
            <div>
              <Label hint="Existing loan EMIs + 5% of card limits">Existing Monthly Debts (AED)</Label>
              <InputAED value={inputs.existingDebts} onChange={v => update('existingDebts', v)} placeholder="0" />
            </div>
            <div>
              <Label>Employment Type</Label>
              <SelectField value={inputs.employment} onChange={v => update('employment', v)} options={EMPLOYMENT_OPTIONS} />
            </div>
          </>
        )}
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-5 border border-gray-100">

          {/* LTV warning */}
          {!result.ltvOk && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-red-700">Down payment too low</p>
              <p className="text-xs text-red-600 mt-0.5">
                Your profile allows max {result.maxLTV}% LTV. Increase down payment to at least {fmtAED((parseFloat(inputs.propertyValue) || 0) * (100 - result.maxLTV) / 100)}.
              </p>
            </div>
          )}

          {/* Hero EMI */}
          <div className="bg-blue-700 rounded-xl p-5 text-white">
            <div className="text-sm opacity-75 mb-1">
              {inputs.financeType === 'islamic' ? 'Monthly Instalment (Profit Rate)' : 'Monthly EMI'}
            </div>
            <div className="text-3xl font-black tabular-nums">{fmtAED(result.emi, 0)}</div>
            <div className="text-xs opacity-60 mt-1">
              {result.tenorYears} years · {fmtPct(result.annualRate)} p.a. · Loan {fmtAED(result.loanAmount)}
            </div>
          </div>

          {/* Core breakdown */}
          <div className="divide-y divide-gray-100">
            <Row label="Property Value"       value={fmtAED(parseFloat(inputs.propertyValue) || 0)} />
            <Row label={`Down Payment (${fmtPct(result.downPaymentPct)})`} value={fmtAED(result.downPayment)} />
            <Row label={`Loan Amount (LTV ${fmtPct(result.ltvActual)})`}   value={fmtAED(result.loanAmount)} highlight />
            <Row label="Max LTV for Profile"  value={fmtPct(result.maxLTV)} muted />
            <Row label="Total Interest Paid"  value={fmtAED(result.totalInterest)} />
            <Row label="Total Repayment"      value={fmtAED(result.totalRepayment)} bold />
          </div>

          {/* Affordability / DBR */}
          {activeTab === 'affordability' && parseFloat(inputs.grossIncome) > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Debt Burden Ratio (DBR)</p>
              <DBRBadge dbr={result.dbr}       label="DBR at current rate" />
              <DBRBadge dbr={result.dbrStress} label={`DBR stress-tested (+3% → ${fmtPct(result.annualRate + 3)})`} />

              {!result.dbrOk && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  DBR exceeds 50% — you may not qualify. Reduce loan amount, increase tenor, or reduce existing debts.
                </p>
              )}
              {result.dbrOk && !result.dbrStressOk && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  DBR passes today but fails the stress test. ADCB may apply a higher rate buffer in their assessment.
                </p>
              )}

              <div className="divide-y divide-gray-100">
                <Row label="Stress-Test EMI"      value={fmtAED(result.emiStress, 0)} />
                <Row label="Max Loan by Income"   value={fmtAED(Math.min(result.maxLoanByIncome, (parseFloat(inputs.propertyValue) || 0) * result.maxLTV / 100))} highlight />
              </div>
            </div>
          )}

          {/* Amortization toggle */}
          <div className="pt-2 border-t border-gray-200">
            <button
              onClick={() => setShowSchedule(s => !s)}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              {showSchedule ? '▲ Hide' : '▼ Show'} Yearly Amortization Schedule
            </button>

            {showSchedule && (
              <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      {['Year', 'Opening Balance', 'Annual Payment', 'Principal', 'Interest', 'Closing Balance'].map(h => (
                        <th key={h} className="px-3 py-2 text-right font-semibold first:text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {scheduleRows.map(row => (
                      <tr key={row.year} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-semibold text-gray-700">{row.year}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtAED(row.openBal)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtAED(row.paid)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-blue-700">{fmtAED(row.principal)}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-500">{fmtAED(row.interest)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmtAED(row.closeBal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Next steps */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-800">Next Steps with ADCB</p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Passport / Emirates ID copy</li>
              <li>Salary certificate or employment letter</li>
              <li>6-month bank statements</li>
              <li>Property title deed or SPA / NOC</li>
              <li>Property valuation report (ADCB-approved valuator)</li>
            </ul>
            <a
              href="https://www.adcb.com/en/personal/loans/home-loans/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg px-4 py-2 transition-colors"
            >
              Apply / Enquire at ADCB →
            </a>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-500">Disclaimer:</strong> This tool is independent and not affiliated with, endorsed by, or sponsored by ADCB. It is for illustrative and educational purposes only. Results are not a quote, pre-approval, or commitment by ADCB. Actual rates, LTV, eligibility, and terms are subject to ADCB credit assessment, AECB check, property valuation, UAE Central Bank regulations, and individual T&Cs. Rates shown are indicative and subject to change. Islamic finance profit rates follow Murabaha/Ijara structures; consult ADCB for exact terms. Non-residents and self-employed applicants may face additional conditions. Always verify directly with ADCB.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
