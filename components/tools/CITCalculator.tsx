'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Nigeria Tax Act 2025 (effective 1 January 2026) ───────────────────────
// Small company: turnover ≤ ₦100,000,000 AND fixed assets ≤ ₦250,000,000
//   → fully exempt from CIT, CGT, and the Development Levy.
// Standard/large company: CIT flat 30% of assessable profit.
// Development Levy: 4% of assessable profit, replaces the old TET (3%),
//   IT Levy, NASENI Levy, and Police Trust Fund Levy combined into one
//   charge. Small companies are exempt from it.
// (A separate 15% minimum effective tax rate applies only to very large
// multinational groups above defined international thresholds — this
// calculator is built for ordinary Nigerian companies, not that regime.)
const SMALL_COMPANY_TURNOVER_CAP = 100_000_000
const SMALL_COMPANY_ASSET_CAP = 250_000_000
const CIT_RATE = 0.30
const DEVELOPMENT_LEVY_RATE = 0.04

function formatNaira(value: number) {
  return `₦${Math.round(value).toLocaleString('en-NG')}`
}

export function CITCalculator(_props: { locale: string }) {
  const [turnover, setTurnover] = useState<string>('')
  const [fixedAssets, setFixedAssets] = useState<string>('')
  const [assessableProfit, setAssessableProfit] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    const turnoverNum = Math.max(0, parseFloat(turnover) || 0)
    const assetsNum = Math.max(0, parseFloat(fixedAssets) || 0)
    const profitNum = parseFloat(assessableProfit) || 0

    if (!turnover) return null

    const isSmallCompany =
      turnoverNum <= SMALL_COMPANY_TURNOVER_CAP && assetsNum <= SMALL_COMPANY_ASSET_CAP

    const taxableProfit = Math.max(0, profitNum)

    const cit = isSmallCompany ? 0 : taxableProfit * CIT_RATE
    const developmentLevy = isSmallCompany ? 0 : taxableProfit * DEVELOPMENT_LEVY_RATE
    const totalTax = cit + developmentLevy
    const effectiveRate = taxableProfit > 0 ? (totalTax / taxableProfit) * 100 : 0

    return { isSmallCompany, taxableProfit, cit, developmentLevy, totalTax, effectiveRate }
  }, [turnover, fixedAssets, assessableProfit])

  const reset = () => {
    setTurnover('')
    setFixedAssets('')
    setAssessableProfit('')
  }

  const copyResult = () => {
    if (!result) return
    const text = result.isSmallCompany
      ? 'Small company — exempt from CIT, CGT, and Development Levy under the Nigeria Tax Act 2025'
      : `CIT (30%): ${formatNaira(result.cit)} | Development Levy (4%): ${formatNaira(result.developmentLevy)} | Total: ${formatNaira(result.totalTax)}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Annual Turnover (₦)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(turnover)}
            onChange={e => setTurnover(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Total Fixed Assets (₦)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(fixedAssets)}
            onChange={e => setFixedAssets(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Assessable Profit (₦) <span className="text-gray-500 font-normal">— profit before CIT/levy, after allowable deductions</span>
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(assessableProfit)}
          onChange={e => setAssessableProfit(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="0"
        />
      </div>

      {/* Results */}
      {result ? (
        result.isSmallCompany ? (
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✓</span>
              <span className="font-bold text-indigo-900">Small Company — Fully Exempt</span>
            </div>
            <p className="text-sm text-indigo-900 leading-relaxed">
              With turnover of {formatNaira(parseFloat(turnover) || 0)} and fixed assets under the
              ₦250,000,000 cap, this company qualifies as a "small company" under the Nigeria Tax
              Act 2025 and owes ₦0 in Company Income Tax, Capital Gains Tax, or the Development
              Levy. An annual return must still be filed with the Nigeria Revenue Service.
            </p>
          </div>
        ) : (
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">Company Income Tax (30%)</span>
              <span className="font-semibold text-indigo-900">{formatNaira(result.cit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-indigo-900">Development Levy (4%)</span>
              <span className="font-semibold text-indigo-900">{formatNaira(result.developmentLevy)}</span>
            </div>
            <div className="flex justify-between border-t border-indigo-200 pt-3">
              <span className="font-bold text-indigo-900">Total Tax Due</span>
              <div className="text-right">
                <div className="text-2xl font-black text-indigo-900">{formatNaira(result.totalTax)}</div>
                <div className="text-xs text-indigo-500">{result.effectiveRate.toFixed(1)}% effective rate</div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">Enter turnover, fixed assets, and profit to calculate</p>
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
        Under the Nigeria Tax Act 2025 (effective 1 January 2026), a "small company" is one with
        annual turnover of ₦100,000,000 or less AND total fixed assets of ₦250,000,000 or less —
        fully exempt from CIT, CGT, and the Development Levy. All other companies pay a flat 30%
        CIT plus a 4% Development Levy on assessable profit. This calculator is for guidance only
        and doesn't constitute tax advice — consult a licensed accountant for your specific filing.
      </p>
    </div>
  )
}
