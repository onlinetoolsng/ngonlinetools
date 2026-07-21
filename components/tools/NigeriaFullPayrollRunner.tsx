'use client'

import { useMemo, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Statutory rates & references (kept in one config object so a future rate
// change is a one-place edit):
//
// PAYE bands — Nigeria Tax Act, 2025 (signed into law June 2025, effective
// 1 January 2026), administered by the Nigeria Revenue Service (NRS,
// formerly FIRS). First ₦800,000 of annual chargeable income is tax-free;
// remaining income is taxed in progressive slices from 15% to 25%. The old
// Consolidated Relief Allowance (CRA) is gone — replaced by a rent relief
// of 20% of annual rent paid, capped at ₦500,000.
//
// Pension — Pension Reform Act, 2014, administered by the National Pension
// Commission (PenCom). Minimum statutory contribution is 8% employee + 10%
// employer = 18% of "pensionable emoluments" (basic + housing + transport
// only — other allowances are excluded from the pension base).
//
// NHF — National Housing Fund Act, 1992 (as amended), administered by the
// Federal Mortgage Bank of Nigeria (FMBN). 2.5% of basic salary only.
// Mandatory for public-sector employees; voluntary (opt-in) for private
// sector employees earning above the statutory minimum wage.
//
// NSITF — Employees' Compensation Act, 2010, administered by the Nigeria
// Social Insurance Trust Fund (NSITF). 1% of total monthly emoluments,
// employer-only, not deducted from staff pay.
//
// ITF — Industrial Training Fund Act (as amended 2011), administered by
// the Industrial Training Fund. 1% of annual payroll, employer-only,
// applies to employers with 5+ employees OR ₦50 million+ annual turnover.
// ---------------------------------------------------------------------------

const RATES = {
  pensionEmployeeRate: 0.08,
  pensionEmployerRate: 0.10,
  nhfRate: 0.025,
  nsitfRate: 0.01,
  itfRate: 0.01,
  rentReliefRate: 0.20,
  rentReliefCap: 500_000,
}

// Cumulative slice widths (not upper bounds) so the loop below just eats
// through `remaining` band by band. Order matters.
const PAYE_BANDS: { width: number; rate: number }[] = [
  { width: 800_000, rate: 0 },
  { width: 2_200_000, rate: 0.15 }, // covers up to ₦3,000,000
  { width: 9_000_000, rate: 0.18 }, // covers up to ₦12,000,000
  { width: 13_000_000, rate: 0.21 }, // covers up to ₦25,000,000
  { width: 25_000_000, rate: 0.23 }, // covers up to ₦50,000,000
  { width: Infinity, rate: 0.25 },
]

function calcAnnualPaye(taxableIncome: number): number {
  let remaining = Math.max(0, taxableIncome)
  let tax = 0
  for (const band of PAYE_BANDS) {
    if (remaining <= 0) break
    const amountInBand = Math.min(remaining, band.width)
    tax += amountInBand * band.rate
    remaining -= amountInBand
  }
  return tax
}

interface Employee {
  id: string
  name: string
  basic: number
  housing: number
  transport: number
  other: number
  nhfOptIn: boolean
  annualRentPaid: number
  employerCoversFullPension: boolean
}

function newEmployee(): Employee {
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    name: '',
    basic: 0,
    housing: 0,
    transport: 0,
    other: 0,
    nhfOptIn: false,
    annualRentPaid: 0,
    employerCoversFullPension: false,
  }
}

function toNaira(value: number) {
  return `\u20a6${Math.round(value).toLocaleString('en-NG')}`
}

function safeNumber(value: string) {
  const parsed = parseFloat(value)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return parsed
}

interface EmployeeResult {
  employee: Employee
  grossMonthly: number
  pensionBase: number
  employeePensionMonthly: number
  employerPensionMonthly: number
  nhfMonthly: number
  annualGross: number
  rentReliefAnnual: number
  taxableIncomeAnnual: number
  annualPaye: number
  monthlyPaye: number
  netMonthly: number
  nsitfMonthly: number
  effectiveTaxRate: number
}

function computeEmployee(emp: Employee): EmployeeResult {
  const grossMonthly = emp.basic + emp.housing + emp.transport + emp.other
  const pensionBase = emp.basic + emp.housing + emp.transport

  const totalPensionMonthly = pensionBase * (RATES.pensionEmployeeRate + RATES.pensionEmployerRate)
  const employeePensionMonthly = emp.employerCoversFullPension ? 0 : pensionBase * RATES.pensionEmployeeRate
  const employerPensionMonthly = emp.employerCoversFullPension
    ? totalPensionMonthly
    : pensionBase * RATES.pensionEmployerRate

  const nhfMonthly = emp.nhfOptIn ? emp.basic * RATES.nhfRate : 0

  const annualGross = grossMonthly * 12
  const annualEmployeePension = employeePensionMonthly * 12
  const annualNhf = nhfMonthly * 12
  const rentReliefAnnual = emp.annualRentPaid > 0
    ? Math.min(emp.annualRentPaid * RATES.rentReliefRate, RATES.rentReliefCap)
    : 0

  const taxableIncomeAnnual = Math.max(0, annualGross - annualEmployeePension - annualNhf - rentReliefAnnual)
  const annualPaye = calcAnnualPaye(taxableIncomeAnnual)
  const monthlyPaye = annualPaye / 12

  const netMonthly = grossMonthly - employeePensionMonthly - nhfMonthly - monthlyPaye
  const nsitfMonthly = grossMonthly * RATES.nsitfRate
  const effectiveTaxRate = annualGross > 0 ? (annualPaye / annualGross) * 100 : 0

  return {
    employee: emp,
    grossMonthly,
    pensionBase,
    employeePensionMonthly,
    employerPensionMonthly,
    nhfMonthly,
    annualGross,
    rentReliefAnnual,
    taxableIncomeAnnual,
    annualPaye,
    monthlyPaye,
    netMonthly,
    nsitfMonthly,
    effectiveTaxRate,
  }
}

function defaultPayPeriod() {
  return new Date().toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
}

const CSV_HEADERS = ['Name', 'Basic', 'Housing', 'Transport', 'OtherAllowances', 'NHFOptIn', 'AnnualRentPaid']

interface NigeriaFullPayrollRunnerProps {
  locale: string
}

export default function NigeriaFullPayrollRunner({ locale }: NigeriaFullPayrollRunnerProps) {
  const [employees, setEmployees] = useState<Employee[]>([newEmployee()])
  const [view, setView] = useState<'monthly' | 'annual'>('monthly')
  const [itfApplies, setItfApplies] = useState(false)
  const [payPeriod, setPayPeriod] = useState(defaultPayPeriod())
  const [csvError, setCsvError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => employees.map(computeEmployee), [employees])

  const totals = useMemo(() => {
    const totalGrossMonthly = results.reduce((s, r) => s + r.grossMonthly, 0)
    const totalEmployeePensionMonthly = results.reduce((s, r) => s + r.employeePensionMonthly, 0)
    const totalEmployerPensionMonthly = results.reduce((s, r) => s + r.employerPensionMonthly, 0)
    const totalNhfMonthly = results.reduce((s, r) => s + r.nhfMonthly, 0)
    const totalPayeMonthly = results.reduce((s, r) => s + r.monthlyPaye, 0)
    const totalNetMonthly = results.reduce((s, r) => s + r.netMonthly, 0)
    const totalNsitfMonthly = totalGrossMonthly * RATES.nsitfRate
    const totalItfAnnual = itfApplies ? totalGrossMonthly * 12 * RATES.itfRate : 0

    const totalEmployerCostMonthly =
      totalGrossMonthly + totalEmployerPensionMonthly + totalNsitfMonthly + totalItfAnnual / 12

    return {
      totalGrossMonthly,
      totalEmployeePensionMonthly,
      totalEmployerPensionMonthly,
      totalNhfMonthly,
      totalPayeMonthly,
      totalNetMonthly,
      totalNsitfMonthly,
      totalItfAnnual,
      totalEmployerCostMonthly,
    }
  }, [results, itfApplies])

  const mult = view === 'annual' ? 12 : 1

  function updateEmployee(id: string, patch: Partial<Employee>) {
    setEmployees(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)))
  }

  function addEmployee() {
    setEmployees(prev => [...prev, newEmployee()])
  }

  function duplicateEmployee(id: string) {
    setEmployees(prev => {
      const src = prev.find(e => e.id === id)
      if (!src) return prev
      const copy: Employee = { ...src, id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`, name: `${src.name} (copy)` }
      const idx = prev.findIndex(e => e.id === id)
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
    })
  }

  function removeEmployee(id: string) {
    setEmployees(prev => (prev.length > 1 ? prev.filter(e => e.id !== id) : prev))
  }

  function clearAll() {
    setEmployees([newEmployee()])
  }

  // --- CSV export (current inputs, round-trips with import below) ---
  function downloadCsvTemplate() {
    const rows = employees.map(e => [
      e.name.replace(/,/g, ' '),
      e.basic,
      e.housing,
      e.transport,
      e.other,
      e.nhfOptIn ? 'yes' : 'no',
      e.annualRentPaid,
    ])
    const csv = [CSV_HEADERS, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'employees.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- CSV export (full payroll run, with computed figures) ---
  function downloadPayrollCsv() {
    const headers = [
      'Name', 'GrossMonthly', 'EmployeePension', 'NHF', 'PAYE', 'NetPay',
      'EmployerPension', 'NSITF',
    ]
    const rows = results.map(r => [
      r.employee.name.replace(/,/g, ' '),
      Math.round(r.grossMonthly),
      Math.round(r.employeePensionMonthly),
      Math.round(r.nhfMonthly),
      Math.round(r.monthlyPaye),
      Math.round(r.netMonthly),
      Math.round(r.employerPensionMonthly),
      Math.round(r.nsitfMonthly),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-${payPeriod.replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- CSV import — simple parser: no quoted-comma support, matches the template above ---
  function handleCsvUpload(file: File) {
    setCsvError(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
        if (lines.length < 2) throw new Error('empty')
        const dataLines = lines.slice(1) // skip header row
        const imported: Employee[] = dataLines.map(line => {
          const cols = line.split(',').map(c => c.trim())
          const [name, basic, housing, transport, other, nhf, rent] = cols
          return {
            id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
            name: name || 'Unnamed',
            basic: safeNumber(basic),
            housing: safeNumber(housing),
            transport: safeNumber(transport),
            other: safeNumber(other),
            nhfOptIn: /^(yes|true|1)$/i.test(nhf || ''),
            annualRentPaid: safeNumber(rent),
            employerCoversFullPension: false,
          }
        })
        if (imported.length === 0) throw new Error('empty')
        setEmployees(imported)
      } catch {
        setCsvError('Could not read that file. Use the "Download CSV template" button first, fill it in, then re-upload — plain comma-separated values, no commas inside a name.')
      }
    }
    reader.readAsText(file)
  }

  // --- Payslip PDF — one page per employee, falls back to a formatted print if jsPDF isn't installed ---
  async function downloadPayslips(single?: EmployeeResult) {
    const list = single ? [single] : results
    try {
      // @ts-expect-error optional dependency, add via `npm i jspdf` for native PDF download
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
      list.forEach((r, idx) => {
        if (idx > 0) pdf.addPage()
        let y = 56
        pdf.setFontSize(16)
        pdf.text('PAYSLIP', 40, y)
        pdf.setFontSize(10)
        y += 20
        pdf.text(`Pay period: ${payPeriod}`, 40, y)
        y += 28
        pdf.setFontSize(12)
        pdf.text(r.employee.name || 'Unnamed employee', 40, y)
        y += 24
        pdf.setFontSize(10)
        const line = (label: string, value: string) => {
          pdf.text(label, 40, y)
          pdf.text(value, 320, y, { align: 'right' })
          y += 18
        }
        pdf.text('Earnings', 40, y); y += 18
        line('Basic salary', toNaira(r.employee.basic))
        line('Housing allowance', toNaira(r.employee.housing))
        line('Transport allowance', toNaira(r.employee.transport))
        line('Other allowances', toNaira(r.employee.other))
        line('Gross monthly pay', toNaira(r.grossMonthly))
        y += 10
        pdf.text('Deductions', 40, y); y += 18
        line('Employee pension (8%)', toNaira(r.employeePensionMonthly))
        line('NHF (2.5% of basic)', r.employee.nhfOptIn ? toNaira(r.nhfMonthly) : 'Not opted in')
        line('PAYE tax', toNaira(r.monthlyPaye))
        y += 10
        pdf.setFontSize(11)
        line('NET PAY', toNaira(r.netMonthly))
        y += 16
        pdf.setFontSize(9)
        pdf.text('Employer contributions (for information, not deducted from pay)', 40, y); y += 16
        pdf.setFontSize(9)
        line('Employer pension (10%)', toNaira(r.employerPensionMonthly))
        line('NSITF (1% of gross)', toNaira(r.nsitfMonthly))
        y += 20
        pdf.setFontSize(8)
        pdf.text('For illustrative purposes based on the Nigeria Tax Act 2025, Pension Reform Act 2014, and NHF Act', 40, y)
        y += 12
        pdf.text('1992. Confirm figures with FIRS/NRS, PenCom, and FMBN for your specific case. Not tax or legal advice.', 40, y)
      })
      pdf.save(single ? `payslip-${single.employee.name || 'employee'}.pdf` : `payslips-${payPeriod.replace(/\s+/g, '-')}.pdf`)
    } catch {
      window.print()
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Pay period + view toggle */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pay period</label>
            <input
              type="text"
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
              className="w-48 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-gray-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => setView('monthly')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${view === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setView('annual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${view === 'annual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
              Annual
            </button>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <input
            id="itf-applies"
            type="checkbox"
            checked={itfApplies}
            onChange={(e) => setItfApplies(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600"
          />
          <label htmlFor="itf-applies" className="text-sm text-gray-700">
            My company is liable for the Industrial Training Fund (ITF) levy — 5 or more employees, or ₦50 million+
            annual turnover (1% of annual payroll, employer-only)
          </label>
        </div>
      </div>

      {/* Employee input table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Employees</h2>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleCsvUpload(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Upload CSV
            </button>
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Download CSV template
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear all
            </button>
          </div>
        </div>

        {csvError && <p className="text-xs text-red-500">{csvError}</p>}

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full border-collapse min-w-[820px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 px-2 text-right">Basic (₦)</th>
                <th className="py-2 px-2 text-right">Housing (₦)</th>
                <th className="py-2 px-2 text-right">Transport (₦)</th>
                <th className="py-2 px-2 text-right">Other (₦)</th>
                <th className="py-2 px-2 text-center">NHF</th>
                <th className="py-2 px-2 text-right">Rent/yr (₦)</th>
                <th className="py-2 pl-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={emp.name}
                      onChange={(e) => updateEmployee(emp.id, { name: e.target.value })}
                      placeholder="Employee name"
                      className="w-36 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number" min={0}
                      value={emp.basic || ''}
                      onChange={(e) => updateEmployee(emp.id, { basic: safeNumber(e.target.value) })}
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number" min={0}
                      value={emp.housing || ''}
                      onChange={(e) => updateEmployee(emp.id, { housing: safeNumber(e.target.value) })}
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number" min={0}
                      value={emp.transport || ''}
                      onChange={(e) => updateEmployee(emp.id, { transport: safeNumber(e.target.value) })}
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number" min={0}
                      value={emp.other || ''}
                      onChange={(e) => updateEmployee(emp.id, { other: safeNumber(e.target.value) })}
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={emp.nhfOptIn}
                      onChange={(e) => updateEmployee(emp.id, { nhfOptIn: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number" min={0}
                      value={emp.annualRentPaid || ''}
                      onChange={(e) => updateEmployee(emp.id, { annualRentPaid: safeNumber(e.target.value) })}
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="py-2 pl-2">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => duplicateEmployee(emp.id)} className="text-xs text-indigo-600 hover:underline">Copy</button>
                      <span className="text-gray-300">·</span>
                      <button type="button" onClick={() => removeEmployee(emp.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addEmployee}
          className="rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          + Add employee
        </button>

        <p className="text-xs text-gray-400">
          Housing and transport allowance form part of pensionable pay. "Other" allowances (meal, utility, bonus, etc.)
          count toward gross pay but not the pension or NHF base, per the Pension Reform Act 2014.
        </p>
      </div>

      {/* Summary dashboard */}
      <div className="rounded-2xl bg-indigo-50 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Payroll summary — {view === 'monthly' ? 'monthly' : 'annual'} ({payPeriod})
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs text-gray-500">Total gross payroll</p>
            <p className="text-lg font-bold text-gray-900">{toNaira(totals.totalGrossMonthly * mult)}</p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs text-gray-500">Total deductions (pension + NHF + PAYE)</p>
            <p className="text-lg font-bold text-gray-900">
              {toNaira((totals.totalEmployeePensionMonthly + totals.totalNhfMonthly + totals.totalPayeMonthly) * mult)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs text-gray-500">Total net pay</p>
            <p className="text-lg font-bold text-gray-900">{toNaira(totals.totalNetMonthly * mult)}</p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <p className="text-xs text-gray-500">Total employer cost</p>
            <p className="text-lg font-bold text-gray-900">
              {toNaira(view === 'annual' ? totals.totalEmployerCostMonthly * 12 : totals.totalEmployerCostMonthly)}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 text-sm text-gray-700 space-y-1">
          <p className="font-semibold text-gray-900 mb-1">Employer contributions breakdown</p>
          <div className="flex justify-between"><span>Employer pension (10% of pensionable pay)</span><span>{toNaira(totals.totalEmployerPensionMonthly * mult)}</span></div>
          <div className="flex justify-between"><span>NSITF (1% of gross payroll)</span><span>{toNaira(totals.totalNsitfMonthly * mult)}</span></div>
          {itfApplies && (
            <div className="flex justify-between"><span>ITF levy (1% of annual payroll)</span><span>{toNaira(totals.totalItfAnnual)}</span></div>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 text-sm text-gray-700 space-y-1.5">
          <p className="font-semibold text-gray-900 mb-1">Compliance checklist</p>
          <p>• Remit PAYE deducted this period to the Nigeria Revenue Service by the 10th of the following month.</p>
          <p>• Remit employee + employer pension contributions to each employee&apos;s PFA within 7 working days of paying salaries — Pension Reform Act 2014.</p>
          <p>• Remit NHF contributions to the Federal Mortgage Bank of Nigeria — NHF Act 1992.</p>
          <p>• Remit NSITF contributions as prescribed under the Employees&apos; Compensation Act 2010.</p>
          {itfApplies && <p>• Remit the ITF levy annually, on or before 1 April of the following year.</p>}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadPayrollCsv}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Download payroll CSV
          </button>
          <button
            type="button"
            onClick={() => downloadPayslips()}
            className="rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Download all payslips (PDF)
          </button>
        </div>
      </div>

      {/* Per-employee results */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Per-employee breakdown</h2>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500">
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 px-2 text-right">Gross</th>
                <th className="py-2 px-2 text-right">Pension (8%)</th>
                <th className="py-2 px-2 text-right">NHF</th>
                <th className="py-2 px-2 text-right">PAYE</th>
                <th className="py-2 px-2 text-right">Net pay</th>
                <th className="py-2 px-2 text-right">Eff. tax rate</th>
                <th className="py-2 pl-2 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.employee.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2 font-medium text-gray-900">{r.employee.name || 'Unnamed'}</td>
                  <td className="py-2 px-2 text-right">{toNaira(r.grossMonthly * mult)}</td>
                  <td className="py-2 px-2 text-right">{toNaira(r.employeePensionMonthly * mult)}</td>
                  <td className="py-2 px-2 text-right">{r.employee.nhfOptIn ? toNaira(r.nhfMonthly * mult) : '—'}</td>
                  <td className="py-2 px-2 text-right">{toNaira(r.monthlyPaye * mult)}</td>
                  <td className="py-2 px-2 text-right font-semibold text-gray-900">{toNaira(r.netMonthly * mult)}</td>
                  <td className="py-2 px-2 text-right text-gray-500">{r.effectiveTaxRate.toFixed(1)}%</td>
                  <td className="py-2 pl-2 text-right">
                    <button type="button" onClick={() => downloadPayslips(r)} className="text-xs text-indigo-600 hover:underline">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {results.some(r => r.grossMonthly > 0 && r.grossMonthly < 70_000) && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            One or more employees are below the ₦70,000/month national minimum wage. Confirm this is correct — minimum
            wage earners are generally exempt from PAYE, and some allowance structures may need review.
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Estimates only, based on the Nigeria Tax Act 2025 (effective 1 January 2026), the Pension Reform Act 2014, the
        NHF Act 1992, the Employees&apos; Compensation Act 2010, and the Industrial Training Fund Act. Rates and
        thresholds can change — confirm your specific obligations with the Nigeria Revenue Service, PenCom, FMBN, NSITF,
        or a licensed payroll/tax professional before remitting. Not tax or legal advice.
      </p>
    </div>
  )
}
