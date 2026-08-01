'use client'

import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import {
  calculateCollectorSusu,
  calculateRoscaPot,
  calculateFlatRateLoan,
  calculateReducingLoan,
  compareSavingsGrowth,
} from '@/lib/calculators/ghanaSusu'

/**
 * components/tools/GhanaSusuCalculator.tsx
 *
 * ─── Context ────────────────────────────────────────────────────────────
 * Susu is a traditional informal savings and credit system in Ghana. The
 * collector model (a "Susu man/woman" collecting daily contributions over
 * a ~31-day cycle, minus a one-day fee) and rotating/group Susu (ROSCAs)
 * are both community-trust arrangements, not formally contracted products,
 * and fall under light-touch regulation or the Bank of Ghana's newer
 * Last-Mile Providers framework where formalised. Susu-linked loans from
 * credit unions/microfinance are a separate, more formal product. None of
 * this is guaranteed by any deposit insurance the way a bank account is.
 * All figures here are educational planning illustrations, not a quote
 * from any specific collector, group, or lender.
 */

type Mode = 'collector' | 'rosca' | 'loan' | 'compare'
type LoanModel = 'flat' | 'reducing'

function formatGHS(value: number): string {
  if (!Number.isFinite(value)) return 'GHS 0.00'
  return `GHS ${Math.max(0, value).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function GhanaSusuCalculator() {
  const [mode, setMode] = useState<Mode>('collector')

  // Collector mode
  const [dailyAmount, setDailyAmount] = useState(20)
  const [cycleDays, setCycleDays] = useState(31)
  const [feeMode, setFeeMode] = useState<'oneDay' | 'percent'>('oneDay')
  const [feePct, setFeePct] = useState(3.23)

  // ROSCA mode
  const [roscaContribution, setRoscaContribution] = useState(100)
  const [roscaMembers, setRoscaMembers] = useState(10)
  const [roscaFrequency, setRoscaFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly')

  // Loan mode
  const [loanPrincipal, setLoanPrincipal] = useState(2000)
  const [loanModel, setLoanModel] = useState<LoanModel>('flat')
  const [flatRatePct, setFlatRatePct] = useState(10)
  const [monthlyRatePct, setMonthlyRatePct] = useState(2)
  const [loanMonths, setLoanMonths] = useState(6)

  // Comparison mode
  const [compareContribution, setCompareContribution] = useState(100)
  const [compareMonths, setCompareMonths] = useState(12)
  const [compareSusuFee, setCompareSusuFee] = useState(3.23)
  const [compareInterestRate, setCompareInterestRate] = useState(6)

  const collectorResult = useMemo(
    () => calculateCollectorSusu(dailyAmount, cycleDays, feeMode, feePct),
    [dailyAmount, cycleDays, feeMode, feePct]
  )

  const roscaResult = useMemo(
    () => calculateRoscaPot(roscaContribution, roscaMembers),
    [roscaContribution, roscaMembers]
  )

  const loanResult = useMemo(
    () =>
      loanModel === 'flat'
        ? calculateFlatRateLoan(loanPrincipal, flatRatePct, loanMonths)
        : calculateReducingLoan(loanPrincipal, monthlyRatePct, loanMonths),
    [loanModel, loanPrincipal, flatRatePct, monthlyRatePct, loanMonths]
  )

  const comparisonData = useMemo(
    () => compareSavingsGrowth(compareContribution, compareMonths, compareSusuFee, compareInterestRate),
    [compareContribution, compareMonths, compareSusuFee, compareInterestRate]
  )
  const finalComparison = comparisonData[comparisonData.length - 1]

  const tabs: { key: Mode; label: string }[] = [
    { key: 'collector', label: 'Collector Susu' },
    { key: 'rosca', label: 'Group / ROSCA' },
    { key: 'loan', label: 'Susu Loan' },
    { key: 'compare', label: 'Comparison' },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Mode tabs */}
      <div className="rounded-xl bg-white border border-gray-200 p-1 flex gap-1 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            aria-pressed={mode === tab.key}
            className={`flex-1 min-w-[45%] sm:min-w-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${mode === tab.key ? 'bg-green-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Collector mode */}
      {mode === 'collector' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily contribution (GHS)</label>
              <input
                type="number"
                min={1}
                value={dailyAmount}
                onChange={e => setDailyAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cycle length (days)</label>
              <input
                type="number"
                min={1}
                max={62}
                value={cycleDays}
                onChange={e => setCycleDays(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <p className="text-xs text-gray-400 mt-1">31 working days is the traditional cycle length.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Collector&apos;s fee</label>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setFeeMode('oneDay')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${feeMode === 'oneDay' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                One day&apos;s contribution (traditional)
              </button>
              <button
                type="button"
                onClick={() => setFeeMode('percent')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${feeMode === 'percent' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                Custom %
              </button>
            </div>
            {feeMode === 'percent' && (
              <input
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={feePct}
                onChange={e => setFeePct(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            )}
          </div>

          <div className="rounded-xl bg-green-50 p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-green-700">Total collected</span><span className="font-semibold text-green-900">{formatGHS(collectorResult.totalCollected)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-green-700">Collector&apos;s fee</span><span className="font-semibold text-green-900">−{formatGHS(collectorResult.fee)}</span></div>
            <div className="flex justify-between text-base border-t border-green-100 pt-2"><span className="font-medium text-green-800">Net payout</span><span className="font-bold text-green-900">{formatGHS(collectorResult.netPayout)}</span></div>
            <p className="text-xs text-green-700/70">Effective fee: {collectorResult.effectiveFeePct.toFixed(2)}% of total contributions.</p>
          </div>
        </div>
      )}

      {/* ROSCA mode */}
      {mode === 'rosca' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contribution per member (GHS)</label>
              <input type="number" min={1} value={roscaContribution} onChange={e => setRoscaContribution(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of members</label>
              <input type="number" min={2} max={60} value={roscaMembers} onChange={e => setRoscaMembers(parseInt(e.target.value, 10) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <select value={roscaFrequency} onChange={e => setRoscaFrequency(e.target.value as typeof roscaFrequency)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-green-50 p-4">
            <p className="text-sm text-green-700">Pot per round</p>
            <p className="text-xl font-bold text-green-900">{formatGHS(roscaResult.potPerRound)}</p>
            <p className="text-xs text-green-700/70 mt-1">{roscaResult.totalRounds} rounds to complete one full cycle ({roscaFrequency}).</p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Rotation schedule</p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Position</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Contributed by then</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Pot received</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Net at receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {roscaResult.positions.map(p => (
                    <tr key={p.position} className="border-t border-gray-100">
                      <td className="px-3 py-1.5">{p.position}</td>
                      <td className="px-3 py-1.5 text-right">{formatGHS(p.totalContributedByThen)}</td>
                      <td className="px-3 py-1.5 text-right">{formatGHS(p.potReceived)}</td>
                      <td className={`px-3 py-1.5 text-right font-medium ${p.netAtReceipt >= 0 ? 'text-green-700' : 'text-amber-700'}`}>
                        {p.netAtReceipt >= 0 ? '+' : ''}{formatGHS(p.netAtReceipt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2">Earlier positions receive an interest-free advance on their own future contributions; later positions effectively save toward the same pot.</p>
          </div>
        </div>
      )}

      {/* Loan mode */}
      {mode === 'loan' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan/savings principal (GHS)</label>
            <input type="number" min={1} value={loanPrincipal} onChange={e => setLoanPrincipal(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setLoanModel('flat')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${loanModel === 'flat' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300'}`}>Flat rate</button>
            <button type="button" onClick={() => setLoanModel('reducing')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${loanModel === 'reducing' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300'}`}>Monthly reducing balance</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {loanModel === 'flat' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flat interest rate (%)</label>
                <input type="number" min={0} max={50} step={0.1} value={flatRatePct} onChange={e => setFlatRatePct(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly rate (%)</label>
                <input type="number" min={0} max={20} step={0.1} value={monthlyRatePct} onChange={e => setMonthlyRatePct(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term (months)</label>
              <input type="number" min={1} max={60} value={loanMonths} onChange={e => setLoanMonths(parseInt(e.target.value, 10) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
          </div>

          <div className="rounded-xl bg-green-50 p-4 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-green-700">Monthly payment</span><span className="font-semibold text-green-900">{formatGHS(loanResult.monthlyPayment)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-green-700">Total interest</span><span className="font-semibold text-green-900">{formatGHS(loanResult.totalInterest)}</span></div>
            <div className="flex justify-between text-base border-t border-green-100 pt-2"><span className="font-medium text-green-800">Total repayment</span><span className="font-bold text-green-900">{formatGHS(loanResult.totalRepayment)}</span></div>
          </div>
        </div>
      )}

      {/* Comparison mode */}
      {mode === 'compare' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly contribution (GHS)</label>
              <input type="number" min={1} value={compareContribution} onChange={e => setCompareContribution(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
              <input type="number" min={1} max={60} value={compareMonths} onChange={e => setCompareMonths(parseInt(e.target.value, 10) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Traditional Susu fee (%)</label>
              <input type="number" min={0} max={20} step={0.1} value={compareSusuFee} onChange={e => setCompareSusuFee(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alternative annual interest rate (%)</label>
              <input type="number" min={0} max={30} step={0.1} value={compareInterestRate} onChange={e => setCompareInterestRate(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
          </div>

          {finalComparison && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-xs text-green-700">Traditional Susu (after fee)</p>
                <p className="text-lg font-bold text-green-900">{formatGHS(finalComparison.traditionalSusu)}</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-blue-700">Interest-bearing alternative</p>
                <p className="text-lg font-bold text-blue-900">{formatGHS(finalComparison.interestBearing)}</p>
              </div>
            </div>
          )}

          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={v => `GHS ${Number(v).toLocaleString('en-GH')}`} />
                <Tooltip formatter={(v: unknown) => formatGHS(Number(v ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="traditionalSusu" name="Traditional Susu" stroke="#047857" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="interestBearing" name="Interest-bearing" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400">
            Discipline is the traditional Susu&apos;s real value — regular collection encourages saving that many
            people otherwise wouldn&apos;t. An interest-bearing alternative grows the balance itself, but only if you
            actually keep contributing without the collector&apos;s routine to enforce it.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Illustrative planning estimates based on commonly cited Ghanaian Susu norms (31-day collector cycles,
        ~1-day/3.2% fee, flat or reducing-balance loan structures) — not a quote from any specific collector,
        group, or lender. Real Susu arrangements rely on trust and community norms and vary by group and
        provider. For a formal Susu loan, confirm exact rates with a licensed credit union, microfinance
        institution, or Susu company. Not financial advice.
      </p>
    </div>
  )
}
