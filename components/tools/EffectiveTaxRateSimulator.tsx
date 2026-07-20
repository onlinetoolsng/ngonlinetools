'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Nigeria Tax Act 2025 (NTA), effective 1 January 2026 ──────────────────
// IMPORTANT LEGAL DISTINCTION this tool is built around: only an
// INCORPORATED company (a Ltd registered with the Corporate Affairs
// Commission under CAMA) pays Company Income Tax (CIT). A sole
// proprietorship or "business name" registration is not a separate legal
// person -- its profit is still taxed as the individual's personal income
// under the same PAYE/PIT bands as an employee. Simply registering a
// business name does NOT move you into the CIT regime; only incorporating
// a limited company does. This is the actual decision this tool compares.
const PAYE_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
]

const SMALL_COMPANY_TURNOVER_CAP = 100_000_000
const SMALL_COMPANY_ASSET_CAP = 250_000_000
const CIT_RATE = 0.30
const DEVELOPMENT_LEVY_RATE = 0.04
const DEFAULT_PENSION_RATE = 0.08

function calculateProgressiveTax(taxableIncome: number) {
  let remaining = taxableIncome
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

export function EffectiveTaxRateSimulator(_props: { locale: string }) {
  const [grossAmount, setGrossAmount] = useState<string>('10000000')
  const [pensionRate, setPensionRate] = useState(DEFAULT_PENSION_RATE)
  const [fixedAssets, setFixedAssets] = useState<string>('0')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const gross = Math.max(0, parseFloat(grossAmount) || 0)
    const assets = Math.max(0, parseFloat(fixedAssets) || 0)

    // ── Employee scenario: gross treated as salary, PAYE bands after pension
    const pension = gross * pensionRate
    const employeeTaxable = Math.max(0, gross - pension)
    const employeeTax = calculateProgressiveTax(employeeTaxable)
    const employeeNet = gross - pension - employeeTax
    const employeeETR = gross > 0 ? (employeeTax / gross) * 100 : 0

    // ── Sole proprietor / business name scenario: NOT a separate legal
    // person, so profit is taxed as personal income under the same PAYE
    // bands, not CIT. Shown for comparison to make the point explicit.
    const soleProfTax = calculateProgressiveTax(gross)
    const soleProfNet = gross - soleProfTax
    const soleProfETR = gross > 0 ? (soleProfTax / gross) * 100 : 0

    // ── Incorporated company scenario: gross treated as assessable profit,
    // CIT applies only if incorporated under CAMA.
    const isSmallCompany = gross <= SMALL_COMPANY_TURNOVER_CAP && assets <= SMALL_COMPANY_ASSET_CAP
    const cit = isSmallCompany ? 0 : gross * CIT_RATE
    const developmentLevy = isSmallCompany ? 0 : gross * DEVELOPMENT_LEVY_RATE
    const companyTax = cit + developmentLevy
    const companyNet = gross - companyTax
    const companyETR = gross > 0 ? (companyTax / gross) * 100 : 0

    return {
      gross,
      employee: { tax: employeeTax, net: employeeNet, etr: employeeETR, pension },
      soleProp: { tax: soleProfTax, net: soleProfNet, etr: soleProfETR },
      company: { tax: companyTax, net: companyNet, etr: companyETR, isSmallCompany, cit, developmentLevy },
    }
  }, [grossAmount, pensionRate, fixedAssets])

  const reset = () => {
    setGrossAmount('10000000')
    setPensionRate(DEFAULT_PENSION_RATE)
    setFixedAssets('0')
  }

  const copyResult = () => {
    const text = `At ${formatNaira(result.gross)}: Employee ETR ${result.employee.etr.toFixed(1)}% | Sole Proprietor ETR ${result.soleProp.etr.toFixed(1)}% | Incorporated Company ETR ${result.company.etr.toFixed(1)}%`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scenarios = [
    { key: 'employee', label: 'Employee (PAYE)', data: result.employee, note: 'Gross treated as salary, taxed via PAYE after 8% pension.' },
    { key: 'soleProp', label: 'Sole Proprietor / Business Name', data: result.soleProp, note: 'Not a separate legal person — taxed as personal income, same PAYE bands as an employee.' },
    { key: 'company', label: 'Incorporated Company (Ltd)', data: result.company, note: result.company.isSmallCompany ? 'Small company (≤₦100M turnover, ≤₦250M assets) — fully exempt from CIT.' : '30% CIT + 4% Development Levy on profit.' },
  ]

  const bestETR = Math.min(result.employee.etr, result.soleProp.etr, result.company.etr)

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Annual Amount (₦) <span className="text-gray-500 font-normal">— salary if employed, or assessable profit if self-employed/incorporated</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(grossAmount)}
          onChange={e => setGrossAmount(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pension Rate (Employee, %)</label>
          <input
            type="number"
            step="0.1"
            min={0}
            value={(pensionRate * 100).toFixed(1)}
            onChange={e => setPensionRate(Math.max(0, (parseFloat(e.target.value) || 0) / 100))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Company Fixed Assets (₦) <span className="text-gray-500 font-normal">— for small company test</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(fixedAssets)}
            onChange={e => setFixedAssets(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        </div>
      </div>

      {/* Comparison cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {scenarios.map(s => (
          <div
            key={s.key}
            className={`rounded-2xl p-5 border ${s.data.etr === bestETR ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-gray-900 text-sm">{s.label}</span>
              {s.data.etr === bestETR && (
                <span className="text-[9px] font-bold uppercase tracking-wide bg-indigo-700 text-white px-1.5 py-0.5 rounded-full">
                  Lowest ETR
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-gray-900 mb-1">{s.data.etr.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mb-3">effective tax rate</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span className="font-medium text-gray-900">{formatNaira(s.data.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Net</span>
                <span className="font-medium text-gray-900">{formatNaira(s.data.net)}</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-3 leading-snug">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={copyResult}
          className="flex-1 py-3.5 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold rounded-xl transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy Comparison'}
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
        For illustration only, based on the Nigeria Tax Act 2025 (effective 1 January 2026) at
        federal level — not financial or legal advice. Only an incorporated Limited company
        (registered with the Corporate Affairs Commission under CAMA) is taxed under Company
        Income Tax; a sole proprietorship or business name registration remains under the same
        PAYE/personal income tax bands as an employee. The decision to incorporate involves more
        than tax alone — compliance costs, annual filing obligations, and limited liability
        protection all matter too. Consult a licensed accountant before restructuring how you're
        paid or registered.
      </p>
    </div>
  )
}
