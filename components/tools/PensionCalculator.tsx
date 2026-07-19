'use client'

import { useMemo, useState } from 'react'

// ─── Pension Reform Act 2014 (signed 1 July 2014), regulated by PenCom ─────
// Minimum combined contribution: 18% of monthly emolument
//   (8% employee + 10% employer). If the employer elects to bear the full
//   contribution alone, the minimum rises to 20%.
// "Monthly emolument" is defined by the Act as Basic + Housing + Transport
// allowances only — not full gross pay. Most employees don't know that
// exact split, so this calculator lets you enter it directly if you know
// it, or approximate using gross salary, same approach as the salary
// calculator, clearly flagged either way.
const EMPLOYEE_RATE = 0.08
const EMPLOYER_RATE = 0.10
const EMPLOYER_PAYS_ALL_RATE = 0.20

function formatNaira(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`
}

export function PensionCalculator(_props: { locale: string }) {
  const [emolument, setEmolument] = useState<string>('')
  const [employerPaysAll, setEmployerPaysAll] = useState(false)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const monthly = Math.max(0, parseFloat(emolument) || 0)
    if (!emolument) return null

    const employeeShare = employerPaysAll ? 0 : monthly * EMPLOYEE_RATE
    const employerShare = employerPaysAll ? monthly * EMPLOYER_PAYS_ALL_RATE : monthly * EMPLOYER_RATE
    const totalMonthly = employeeShare + employerShare
    const totalAnnual = totalMonthly * 12

    return { monthly, employeeShare, employerShare, totalMonthly, totalAnnual }
  }, [emolument, employerPaysAll])

  const reset = () => {
    setEmolument('')
    setEmployerPaysAll(false)
  }

  const copyResult = () => {
    if (!result) return
    const text = `Employee: ${formatNaira(result.employeeShare)} | Employer: ${formatNaira(result.employerShare)} | Total monthly RSA contribution: ${formatNaira(result.totalMonthly)}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Monthly Emolument (₦)
        </label>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={emolument}
          onChange={e => setEmolument(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="500000"
        />
        <p className="text-xs text-gray-500 mt-1">
          Defined by the Pension Reform Act 2014 as Basic + Housing + Transport allowances only.
          If you don't know that exact split, your full gross monthly salary is a commonly used
          approximation — check your payslip for the precise figure.
        </p>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={employerPaysAll}
          onChange={e => setEmployerPaysAll(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-sm text-gray-600">
          My employer bears the full contribution (20%, no deduction from my pay)
        </span>
      </label>

      {/* Results */}
      {result ? (
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">
              Employee Contribution {employerPaysAll ? '(0% — employer-paid)' : '(8%)'}
            </span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.employeeShare)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-indigo-900">
              Employer Contribution {employerPaysAll ? '(20%)' : '(10%)'}
            </span>
            <span className="font-semibold text-indigo-900">{formatNaira(result.employerShare)}</span>
          </div>
          <div className="flex justify-between border-t border-indigo-200 pt-3">
            <span className="font-bold text-indigo-900">Total Monthly RSA Contribution</span>
            <div className="text-right">
              <div className="text-2xl font-black text-indigo-900">{formatNaira(result.totalMonthly)}</div>
              <div className="text-xs text-indigo-500">{formatNaira(result.totalAnnual)} / year</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">Enter your monthly emolument to calculate</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={copyResult}
          disabled={!result}
          className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
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

      <p className="text-xs text-gray-500 leading-relaxed">
        Under the Pension Reform Act 2014, the minimum combined pension contribution is 18% of
        monthly emolument (8% employee, 10% employer), rising to 20% if the employer elects to
        bear the full contribution alone. Contributions are paid into your Retirement Savings
        Account (RSA) with a Pension Fund Administrator (PFA) licensed by the National Pension
        Commission (PenCom), and employers must remit within 7 days of paying salaries. This
        calculator is for guidance only — check your RSA statement or PFA for your exact figures.
      </p>
    </div>
  )
}
