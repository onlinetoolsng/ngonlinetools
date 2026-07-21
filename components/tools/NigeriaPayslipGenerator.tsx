'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ---------------------------------------------------------------------------
// Statutory reference data — kept consistent with NigeriaPAYETaxCalculator.tsx
// and NigeriaFullPayrollRunner.tsx elsewhere in this codebase.
//
// PAYE bands — Nigeria Tax Act 2025 (signed June 2025, effective 1 January
// 2026), administered by the Nigeria Revenue Service (NRS, formerly FIRS).
// First ₦800,000 of annual chargeable income is tax-free; the old
// Consolidated Relief Allowance is gone, replaced by rent relief (20% of
// annual rent paid, capped at ₦500,000).
//
// Pension — Pension Reform Act 2014 (PenCom): 8% employee + 10% employer of
// "pensionable emoluments" (basic + housing + transport only).
//
// NHF — National Housing Fund Act 1992 (FMBN): 2.5% of basic salary only,
// mandatory for public sector, opt-in for private sector.
// ---------------------------------------------------------------------------

const PAYE_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]

const PENSION_EMPLOYEE_RATE = 0.08
const NHF_RATE = 0.025
const RENT_RELIEF_RATE = 0.2
const RENT_RELIEF_CAP = 500_000
const MINIMUM_WAGE_MONTHLY = 70_000 // National Minimum Wage (Amendment) Act 2024

const STORAGE_KEY = 'ngonlinetools:payslip-generator:draft'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function currentPayPeriod() {
  return new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
}

function toNaira(value: number) {
  return `\u20a6${Math.round(value).toLocaleString('en-NG')}`
}

function calculateAnnualPaye(chargeableAnnual: number) {
  let remaining = Math.max(0, chargeableAnnual)
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

interface EmployerDetails {
  businessName: string
  address: string
  phone: string
  email: string
  logoDataUrl: string | null
}

interface EmployeeDetails {
  name: string
  employeeId: string
  jobTitle: string
  department: string
}

const num = (v: string) => {
  const n = parseFloat(v)
  return Number.isNaN(n) || n < 0 ? 0 : n
}

export default function NigeriaPayslipGenerator({ locale }: { locale: string }) {
  const [employer, setEmployer] = useState<EmployerDetails>({
    businessName: '',
    address: '',
    phone: '',
    email: '',
    logoDataUrl: null,
  })

  const [employee, setEmployee] = useState<EmployeeDetails>({
    name: '',
    employeeId: '',
    jobTitle: '',
    department: '',
  })

  const [payPeriod, setPayPeriod] = useState(currentPayPeriod())
  const [payDate, setPayDate] = useState(todayIso())

  const [basic, setBasic] = useState('0')
  const [housing, setHousing] = useState('0')
  const [transport, setTransport] = useState('0')
  const [otherAllowances, setOtherAllowances] = useState('0')
  const [bonus, setBonus] = useState('0')

  const [nhfOptIn, setNhfOptIn] = useState(false)
  const [annualRentPaid, setAnnualRentPaid] = useState('0')
  const [otherDeductions, setOtherDeductions] = useState('0')
  const [otherDeductionsLabel, setOtherDeductionsLabel] = useState('Staff loan repayment')

  const [showYtd, setShowYtd] = useState(false)
  const [ytdGross, setYtdGross] = useState('0')
  const [ytdNet, setYtdNet] = useState('0')

  const [draftStatus, setDraftStatus] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // Load a saved draft once, client-side only.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft.employer) setEmployer(draft.employer)
      if (draft.employee) setEmployee(draft.employee)
      if (draft.payPeriod) setPayPeriod(draft.payPeriod)
      if (draft.payDate) setPayDate(draft.payDate)
      if (draft.basic) setBasic(draft.basic)
      if (draft.housing) setHousing(draft.housing)
      if (draft.transport) setTransport(draft.transport)
      if (draft.otherAllowances) setOtherAllowances(draft.otherAllowances)
      if (draft.bonus) setBonus(draft.bonus)
      if (typeof draft.nhfOptIn === 'boolean') setNhfOptIn(draft.nhfOptIn)
      if (draft.annualRentPaid) setAnnualRentPaid(draft.annualRentPaid)
      if (draft.otherDeductions) setOtherDeductions(draft.otherDeductions)
      if (draft.otherDeductionsLabel) setOtherDeductionsLabel(draft.otherDeductionsLabel)
      if (typeof draft.showYtd === 'boolean') setShowYtd(draft.showYtd)
      if (draft.ytdGross) setYtdGross(draft.ytdGross)
      if (draft.ytdNet) setYtdNet(draft.ytdNet)
    } catch {
      // Ignore a corrupted or missing draft.
    }
  }, [])

  function saveDraft() {
    try {
      const draft = {
        employer, employee, payPeriod, payDate, basic, housing, transport,
        otherAllowances, bonus, nhfOptIn, annualRentPaid, otherDeductions,
        otherDeductionsLabel, showYtd, ytdGross, ytdNet,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
      setDraftStatus('Draft saved on this device.')
    } catch {
      setDraftStatus('Could not save draft — your browser may be blocking local storage.')
    }
    setTimeout(() => setDraftStatus(null), 3000)
  }

  function clearDraft() {
    window.localStorage.removeItem(STORAGE_KEY)
    setDraftStatus('Saved draft cleared.')
    setTimeout(() => setDraftStatus(null), 3000)
  }

  function handleLogoUpload(file: File | null) {
    if (!file) {
      setEmployer((e) => ({ ...e, logoDataUrl: null }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => setEmployer((e) => ({ ...e, logoDataUrl: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const result = useMemo(() => {
    const basicN = num(basic)
    const housingN = num(housing)
    const transportN = num(transport)
    const otherN = num(otherAllowances)
    const bonusN = num(bonus)

    const grossMonthly = basicN + housingN + transportN + otherN + bonusN
    const pensionableBase = basicN + housingN + transportN

    const employeePensionMonthly = pensionableBase * PENSION_EMPLOYEE_RATE
    const nhfMonthly = nhfOptIn ? basicN * NHF_RATE : 0

    const annualRent = num(annualRentPaid)
    const rentReliefAnnual = Math.min(annualRent * RENT_RELIEF_RATE, RENT_RELIEF_CAP)

    const grossAnnual = grossMonthly * 12
    const chargeableAnnual = Math.max(
      0,
      grossAnnual - employeePensionMonthly * 12 - nhfMonthly * 12 - rentReliefAnnual
    )
    const payeAnnual = calculateAnnualPaye(chargeableAnnual)
    const payeMonthly = payeAnnual / 12

    const otherDeductionsN = num(otherDeductions)
    const totalDeductions = employeePensionMonthly + nhfMonthly + payeMonthly + otherDeductionsN
    const netMonthly = grossMonthly - totalDeductions

    const belowMinimumWage = basicN + housingN + transportN + otherN < MINIMUM_WAGE_MONTHLY

    return {
      grossMonthly,
      pensionableBase,
      employeePensionMonthly,
      nhfMonthly,
      payeMonthly,
      otherDeductionsN,
      totalDeductions,
      netMonthly,
      belowMinimumWage,
    }
  }, [basic, housing, transport, otherAllowances, bonus, nhfOptIn, annualRentPaid, otherDeductions])

  async function handleDownloadPdf() {
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        // @ts-expect-error optional dependency, add via `npm i jspdf html2canvas` for a native PDF download
        import('jspdf'),
        // @ts-expect-error optional dependency
        import('html2canvas'),
      ])
      if (!printRef.current) return
      const canvas = await html2canvas(printRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = (canvas.height * pageWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight)
      pdf.save(`Payslip_${employee.name || 'employee'}_${payPeriod}.pdf`.replace(/\s+/g, '_'))
    } catch {
      window.print()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {draftStatus && (
        <div className="rounded-xl bg-indigo-50 px-4 py-2 text-sm text-indigo-700">{draftStatus}</div>
      )}

      {/* Employer details */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Employer details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
            <input
              type="text"
              value={employer.businessName}
              onChange={(e) => setEmployer((v) => ({ ...v, businessName: e.target.value }))}
              placeholder="e.g. Acme Nigeria Ltd"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={employer.address}
              onChange={(e) => setEmployer((v) => ({ ...v, address: e.target.value }))}
              placeholder="e.g. 12 Adeola Odeku St, Victoria Island, Lagos"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="text"
              value={employer.phone}
              onChange={(e) => setEmployer((v) => ({ ...v, phone: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={employer.email}
              onChange={(e) => setEmployer((v) => ({ ...v, email: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company logo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Employee details */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Employee details</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              value={employee.name}
              onChange={(e) => setEmployee((v) => ({ ...v, name: e.target.value }))}
              placeholder="e.g. Chiamaka Okafor"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
            <input
              type="text"
              value={employee.employeeId}
              onChange={(e) => setEmployee((v) => ({ ...v, employeeId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
            <input
              type="text"
              value={employee.jobTitle}
              onChange={(e) => setEmployee((v) => ({ ...v, jobTitle: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={employee.department}
              onChange={(e) => setEmployee((v) => ({ ...v, department: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay period</label>
            <input
              type="text"
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
              placeholder="e.g. July 2026"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment date</label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Earnings */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Earnings</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Basic salary (monthly)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(basic)}
              onChange={(e) => setBasic(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Housing allowance</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(housing)}
              onChange={(e) => setHousing(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport allowance</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(transport)}
              onChange={(e) => setTransport(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other allowances (meal, utility, etc.)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(otherAllowances)}
              onChange={(e) => setOtherAllowances(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bonus / one-off payment</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(bonus)}
              onChange={(e) => setBonus(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>
        {result.belowMinimumWage && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Total pay is below the ₦{MINIMUM_WAGE_MONTHLY.toLocaleString('en-NG')}/month National Minimum Wage
            (Amendment) Act 2024 threshold. Confirm this employee is exempt (e.g. part-time or an establishment
            with fewer than 25 employees) before issuing this payslip.
          </p>
        )}
      </div>

      {/* Deductions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Deductions</h2>
        <p className="text-xs text-gray-500">
          Employee pension (8% of basic + housing + transport, Pension Reform Act 2014) and PAYE (Nigeria Tax Act
          2025) are calculated automatically.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 items-end">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={nhfOptIn} onChange={(e) => setNhfOptIn(e.target.checked)} />
            Opted into NHF (2.5% of basic salary)
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual rent paid (for rent relief)</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(annualRentPaid)}
              onChange={(e) => setAnnualRentPaid(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other deduction label</label>
            <input
              type="text"
              value={otherDeductionsLabel}
              onChange={(e) => setOtherDeductionsLabel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other deduction amount</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(otherDeductions)}
              onChange={(e) => setOtherDeductions(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={showYtd} onChange={(e) => setShowYtd(e.target.checked)} />
          Include year-to-date summary
        </label>
        {showYtd && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">YTD gross pay</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(ytdGross)}
                onChange={(e) => setYtdGross(cleanNumberInput(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">YTD net pay</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatNumberInput(ytdNet)}
                onChange={(e) => setYtdNet(cleanNumberInput(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
        )}
      </div>

      {/* Draft controls */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveDraft}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Save draft
        </button>
        <button
          type="button"
          onClick={clearDraft}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear saved draft
        </button>
      </div>

      {/* Payslip preview + download */}
      <div className="rounded-2xl bg-indigo-50 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Payslip preview</h2>

        <div ref={printRef} className="rounded-xl bg-white p-6 space-y-4 text-sm text-gray-800">
          <div className="flex items-start justify-between border-b border-gray-200 pb-3">
            <div>
              {employer.logoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={employer.logoDataUrl} alt="Company logo" className="h-12 mb-2 object-contain" />
              )}
              <p className="font-semibold text-gray-900">{employer.businessName || 'Your company name'}</p>
              <p>{employer.address}</p>
              <p>{employer.phone}</p>
              <p>{employer.email}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">PAYSLIP</p>
              <p>Pay period: {payPeriod}</p>
              <p>Payment date: {payDate}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 border-b border-gray-200 pb-3">
            <div>
              <p className="font-semibold text-gray-900">{employee.name || 'Employee name'}</p>
              <p>{employee.jobTitle}</p>
              <p>{employee.department}</p>
            </div>
            <div className="sm:text-right text-gray-500 text-xs">
              {employee.employeeId && <p>Employee ID: {employee.employeeId}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-gray-900 mb-1">Earnings</p>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Basic salary</span><span>{toNaira(num(basic))}</span></div>
                <div className="flex justify-between"><span>Housing allowance</span><span>{toNaira(num(housing))}</span></div>
                <div className="flex justify-between"><span>Transport allowance</span><span>{toNaira(num(transport))}</span></div>
                {num(otherAllowances) > 0 && (
                  <div className="flex justify-between"><span>Other allowances</span><span>{toNaira(num(otherAllowances))}</span></div>
                )}
                {num(bonus) > 0 && (
                  <div className="flex justify-between"><span>Bonus</span><span>{toNaira(num(bonus))}</span></div>
                )}
                <div className="flex justify-between font-semibold border-t border-gray-200 pt-1">
                  <span>Gross pay</span><span>{toNaira(result.grossMonthly)}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Deductions</p>
              <div className="space-y-1">
                <div className="flex justify-between"><span>Employee pension (8%)</span><span>{toNaira(result.employeePensionMonthly)}</span></div>
                <div className="flex justify-between">
                  <span>NHF (2.5% of basic)</span>
                  <span>{nhfOptIn ? toNaira(result.nhfMonthly) : 'Not opted in'}</span>
                </div>
                <div className="flex justify-between"><span>PAYE tax</span><span>{toNaira(result.payeMonthly)}</span></div>
                {result.otherDeductionsN > 0 && (
                  <div className="flex justify-between"><span>{otherDeductionsLabel || 'Other'}</span><span>{toNaira(result.otherDeductionsN)}</span></div>
                )}
                <div className="flex justify-between font-semibold border-t border-gray-200 pt-1">
                  <span>Total deductions</span><span>{toNaira(result.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center bg-indigo-50 rounded-lg px-4 py-3">
            <span className="font-bold text-gray-900">NET PAY</span>
            <span className="font-bold text-gray-900 text-lg">{toNaira(result.netMonthly)}</span>
          </div>

          {showYtd && (
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-gray-500 border-t border-gray-200 pt-3">
              <div className="flex justify-between"><span>Year-to-date gross</span><span>{toNaira(num(ytdGross))}</span></div>
              <div className="flex justify-between"><span>Year-to-date net</span><span>{toNaira(num(ytdNet))}</span></div>
            </div>
          )}

          <p className="text-xs text-gray-400 border-t border-gray-200 pt-3">
            This payslip is generated for illustrative and record-keeping purposes, based on the Nigeria Tax Act
            2025, Pension Reform Act 2014, and NHF Act 1992 as in force in 2026. It is not a substitute for full
            payroll compliance — confirm figures with a licensed tax or payroll professional.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          className="w-full sm:w-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Download PDF
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Estimates only — not tax or payroll advice. PAYE, pension, and NHF figures reflect the Nigeria Tax Act 2025,
        Pension Reform Act 2014, and NHF Act 1992 in force as of 2026, but your specific obligations depend on your
        employees&apos; individual circumstances. For payroll covering more than one employee at a time, see the
        Nigeria Payroll Calculator. Confirm figures with a tax professional before relying on them.
      </p>
    </div>
  )
}
