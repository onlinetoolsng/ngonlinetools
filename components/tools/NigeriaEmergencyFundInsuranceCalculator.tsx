'use client'

import { useMemo, useState } from 'react'

type Props = {
  locale: string
}

type EmploymentType = 'stable-salaried' | 'private-sector' | 'self-employed' | 'irregular'
type AgeGroup = '18-35' | '36-50' | '50+'

interface Expenses {
  rent: number
  food: number
  transport: number
  utilities: number
  healthcare: number
  schoolFeesFamily: number
  other: number
}

const EMPTY_EXPENSES: Expenses = {
  rent: 0,
  food: 0,
  transport: 0,
  utilities: 0,
  healthcare: 0,
  schoolFeesFamily: 0,
  other: 0,
}

const EXPENSE_FIELDS: { key: keyof Expenses; label: string; hint?: string }[] = [
  { key: 'rent', label: 'Rent / housing (monthly equivalent)' },
  { key: 'food', label: 'Food & groceries' },
  { key: 'transport', label: 'Transport (fuel, danfo/bus, ride-hailing)' },
  { key: 'utilities', label: 'Utilities', hint: 'Power, generator fuel, water, data — often underestimated in Nigeria' },
  { key: 'healthcare', label: 'Healthcare / minor medication' },
  { key: 'schoolFeesFamily', label: 'School fees & family support (dependents)' },
  { key: 'other', label: 'Other essentials' },
]

function formatNaira(value: number) {
  if (!isFinite(value)) return '—'
  return '₦' + Math.round(Math.max(0, value)).toLocaleString('en-NG')
}

function getMonthsMultiplier(employment: EmploymentType, dependents: number) {
  if (employment === 'stable-salaried' && dependents <= 2) return 3
  if (employment === 'self-employed' || employment === 'irregular') {
    if (dependents >= 5) return 12
    if (dependents >= 3) return 9
    return 6
  }
  // private sector, or stable-salaried with 3+ dependents
  if (dependents >= 5) return 6
  return dependents >= 3 ? 5 : 4
}

function getLifeMultiplier(dependents: number, ageGroup: AgeGroup) {
  let multiplier = 5 + Math.min(dependents, 5) // 5 to 10
  if (ageGroup === '18-35') multiplier *= 1
  if (ageGroup === '36-50') multiplier *= 0.85
  if (ageGroup === '50+') multiplier *= 0.7
  return Math.max(3, Math.round(multiplier * 10) / 10)
}

// Months to reach a savings target with a fixed monthly deposit and monthly rate.
function monthsToTarget(target: number, monthlyDeposit: number, annualRatePct: number) {
  if (target <= 0) return 0
  if (monthlyDeposit <= 0) return Infinity
  const r = annualRatePct / 100 / 12
  if (r === 0) return target / monthlyDeposit
  const ratio = 1 + (target * r) / monthlyDeposit
  if (ratio <= 0) return Infinity
  return Math.log(ratio) / Math.log(1 + r)
}

export default function NigeriaEmergencyFundInsuranceCalculator({ locale }: Props) {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)
  const [expenses, setExpenses] = useState<Expenses>(EMPTY_EXPENSES)
  const [dependents, setDependents] = useState<number>(0)
  const [employment, setEmployment] = useState<EmploymentType>('stable-salaried')
  const [location, setLocation] = useState<'nigeria-wide' | 'lagos'>('nigeria-wide')
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('18-35')
  const [bufferPct, setBufferPct] = useState<number>(10)
  const [existingInsurance, setExistingInsurance] = useState<Set<string>>(new Set(['none']))
  const [currentSavings, setCurrentSavings] = useState<number>(0)
  const [savingsRatePct, setSavingsRatePct] = useState<number>(15)
  const [annualReturnPct, setAnnualReturnPct] = useState<number>(12)
  const [copyStatus, setCopyStatus] = useState<string>('')

  function updateExpense(key: keyof Expenses, value: number) {
    setExpenses((prev) => ({ ...prev, [key]: value }))
  }

  function toggleInsurance(option: string) {
    setExistingInsurance((prev) => {
      const next = new Set(prev)
      if (option === 'none') return new Set(['none'])
      next.delete('none')
      if (next.has(option)) {
        next.delete(option)
      } else {
        next.add(option)
      }
      return next.size === 0 ? new Set(['none']) : next
    })
  }

  const totals = useMemo(() => {
    const totalMonthlyExpenses = Object.values(expenses).reduce((s, v) => s + (Number(v) || 0), 0)
    const adjustedMonthlyExpenses = totalMonthlyExpenses * (1 + bufferPct / 100)
    const recommendedMonths = getMonthsMultiplier(employment, dependents)

    const fund3mo = adjustedMonthlyExpenses * 3
    const fund6mo = adjustedMonthlyExpenses * 6
    const fundRecommended = adjustedMonthlyExpenses * recommendedMonths

    const monthlySavings =
      monthlyIncome > 0 ? monthlyIncome * (savingsRatePct / 100) : 0
    const remaining = Math.max(0, fundRecommended - currentSavings)
    const monthsToGoal = monthlySavings > 0 ? monthsToTarget(remaining, monthlySavings, annualReturnPct) : Infinity

    const progressPct = fundRecommended > 0
      ? Math.min(100, Math.round((currentSavings / fundRecommended) * 100))
      : 0

    const annualIncome = monthlyIncome * 12
    const lifeMultiplier = getLifeMultiplier(dependents, ageGroup)
    const lifeCoverEstimate = annualIncome > 0 ? annualIncome * lifeMultiplier : 0

    const healthRiskEstimate = expenses.healthcare * 12 * 1.5 + dependents * 40000

    return {
      totalMonthlyExpenses,
      adjustedMonthlyExpenses,
      recommendedMonths,
      fund3mo,
      fund6mo,
      fundRecommended,
      monthlySavings,
      monthsToGoal,
      progressPct,
      lifeCoverEstimate,
      healthRiskEstimate,
    }
  }, [expenses, bufferPct, employment, dependents, monthlyIncome, savingsRatePct, currentSavings, annualReturnPct, ageGroup])

  const expensesExceedIncome = monthlyIncome > 0 && totals.totalMonthlyExpenses > monthlyIncome
  const highRiskProfile = employment === 'self-employed' || employment === 'irregular' || dependents >= 5

  function summaryText() {
    const lines = [
      'Nigeria Emergency Fund & Insurance Summary',
      `Monthly essential expenses: ${formatNaira(totals.totalMonthlyExpenses)}`,
      `Recommended emergency fund (${totals.recommendedMonths} months, buffer included): ${formatNaira(totals.fundRecommended)}`,
      `3-month fund: ${formatNaira(totals.fund3mo)} | 6-month fund: ${formatNaira(totals.fund6mo)}`,
      currentSavings > 0 ? `Current savings: ${formatNaira(currentSavings)} (${totals.progressPct}% of target)` : '',
      monthlyIncome > 0
        ? `Saving ${formatNaira(totals.monthlySavings)}/month, target reached in ~${isFinite(totals.monthsToGoal) ? Math.ceil(totals.monthsToGoal) + ' months' : 'N/A — increase savings rate'}`
        : '',
      monthlyIncome > 0 ? `Estimated life insurance need: ${formatNaira(totals.lifeCoverEstimate)}` : '',
      `Estimated annual out-of-pocket health risk: ${formatNaira(totals.healthRiskEstimate)}`,
    ].filter(Boolean)
    return lines.join('\n')
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText())
      setCopyStatus('Copied!')
    } catch {
      setCopyStatus('Could not copy — select and copy manually.')
    }
    setTimeout(() => setCopyStatus(''), 2500)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Results panel */}
      <div className="bg-indigo-50 rounded-2xl p-6">
        <div className="text-sm font-medium text-indigo-700 mb-2">
          Recommended emergency fund target
        </div>
        <div className="text-4xl font-bold text-indigo-900">
          {formatNaira(totals.fundRecommended)}
        </div>
        <div className="text-sm text-indigo-500 mt-1">
          Based on {totals.recommendedMonths} months of essential expenses, buffer included
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="rounded-xl bg-white p-4">
            <div className="text-xs text-gray-500">3-month fund</div>
            <div className="text-xl font-semibold text-gray-800">{formatNaira(totals.fund3mo)}</div>
          </div>
          <div className="rounded-xl bg-white p-4">
            <div className="text-xs text-gray-500">6-month fund</div>
            <div className="text-xl font-semibold text-gray-800">{formatNaira(totals.fund6mo)}</div>
          </div>
        </div>

        {currentSavings > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-indigo-700 mb-1">
              <span>Progress toward target</span>
              <span>{totals.progressPct}%</span>
            </div>
            <div className="w-full bg-white rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-3 rounded-full transition-all"
                style={{ width: `${totals.progressPct}%` }}
              />
            </div>
          </div>
        )}

        {monthlyIncome > 0 && (
          <div className="rounded-xl bg-white p-4 mt-4">
            <div className="text-xs text-gray-500">
              Saving {formatNaira(totals.monthlySavings)}/month at {savingsRatePct}% of income
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {isFinite(totals.monthsToGoal)
                ? `Reach your target in about ${Math.ceil(totals.monthsToGoal)} months`
                : 'Increase your savings rate to reach this target'}
            </div>
          </div>
        )}
      </div>

      {expensesExceedIncome && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          Your monthly essential expenses are higher than your monthly income. Focus on trimming
          non-essential spending first — an emergency fund target is hard to hit while expenses
          outpace income.
        </div>
      )}

      {highRiskProfile && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          Because your income is self-employed/irregular or you have several dependents, this
          calculator has automatically pushed your recommended months higher than the standard
          3-month minimum to reflect the added uncertainty.
        </div>
      )}

      {/* Income & profile */}
      <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Your Income & Profile</h2>
        <div>
          <label className="text-sm text-gray-600">Monthly income (₦) — optional, for context</label>
          <input
            type="number"
            value={monthlyIncome || ''}
            onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 350000"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Number of dependents</label>
            <input
              type="number"
              min={0}
              value={dependents}
              onChange={(e) => setDependents(Math.max(0, parseInt(e.target.value) || 0))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Age group</label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="18-35">18–35</option>
              <option value="36-50">36–50</option>
              <option value="50+">50+</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Employment / income stability</label>
            <select
              value={employment}
              onChange={(e) => setEmployment(e.target.value as EmploymentType)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="stable-salaried">Stable salaried (govt/multinational)</option>
              <option value="private-sector">Private sector</option>
              <option value="self-employed">Self-employed / freelancer</option>
              <option value="irregular">Irregular / commission-based</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as 'nigeria-wide' | 'lagos')}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="nigeria-wide">Nigeria-wide</option>
              <option value="lagos">Lagos</option>
            </select>
          </div>
        </div>
        {location === 'lagos' && (
          <p className="text-xs text-gray-400">
            Lagos costs tend to run higher than the national average — make sure your rent,
            transport, and utilities figures below reflect your actual Lagos spending rather than
            a national estimate.
          </p>
        )}
      </div>

      {/* Expenses */}
      <div className="rounded-2xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Monthly Essential Expenses</h2>
        <p className="text-xs text-gray-400">
          Use real essentials only — exclude lifestyle spending. In Nigeria, remember to include
          generator fuel and ongoing family obligations.
        </p>
        {EXPENSE_FIELDS.map((field) => (
          <div key={field.key} className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-sm text-gray-600">{field.label}</label>
              {field.hint && <div className="text-xs text-gray-400">{field.hint}</div>}
            </div>
            <input
              type="number"
              value={expenses[field.key] || ''}
              onChange={(e) => updateExpense(field.key, parseFloat(e.target.value) || 0)}
              placeholder="₦0"
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-sm font-medium text-gray-700">Total monthly essentials</span>
          <span className="text-sm font-semibold text-gray-800">
            {formatNaira(totals.totalMonthlyExpenses)}
          </span>
        </div>
        <div>
          <label className="text-sm text-gray-600">Inflation / uncertainty buffer</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={20}
              value={bufferPct}
              onChange={(e) => setBufferPct(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-10">{bufferPct}%</span>
          </div>
        </div>
      </div>

      {/* Savings plan */}
      <div className="rounded-2xl border border-gray-200 p-5 space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Savings Plan</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Current emergency savings (₦)</label>
            <input
              type="number"
              value={currentSavings || ''}
              onChange={(e) => setCurrentSavings(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">% of income to save monthly</label>
            <input
              type="number"
              min={0}
              max={100}
              value={savingsRatePct}
              onChange={(e) => setSavingsRatePct(parseFloat(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600">
            Assumed annual return on savings (e.g. high-yield savings app)
          </label>
          <input
            type="number"
            min={0}
            max={30}
            value={annualReturnPct}
            onChange={(e) => setAnnualReturnPct(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">
            Purely a projection based on the rate you enter — not a live or guaranteed rate. Keep
            emergency savings in an accessible, low-risk account rather than chasing yield.
          </p>
        </div>
      </div>

      {/* Insurance */}
      <div className="rounded-2xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Insurance Needs Estimate</h2>
        <div>
          <label className="text-sm text-gray-600 mb-2 block">Existing insurance cover</label>
          <div className="flex flex-wrap gap-3">
            {['none', 'health', 'life', 'property', 'motor', 'others'].map((opt) => (
              <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={existingInsurance.has(opt)}
                  onChange={() => toggleInsurance(opt)}
                />
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-indigo-50 p-4">
          <div className="text-xs text-gray-500">Estimated life insurance need</div>
          <div className="text-lg font-semibold text-gray-800">
            {monthlyIncome > 0 ? formatNaira(totals.lifeCoverEstimate) : 'Add your monthly income above to estimate this'}
          </div>
          {existingInsurance.has('life') && (
            <p className="text-xs text-gray-500 mt-1">
              You indicated you already have life cover — compare your existing sum assured
              against this estimate to check for gaps.
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            If you're salaried, your employer is required to maintain Group Life cover for you of
            at least 3× your annual total emoluments under the Pension Reform Act — check whether
            that alone meets this estimate before buying a separate policy.
          </p>
        </div>

        <div className="rounded-xl bg-indigo-50 p-4">
          <div className="text-xs text-gray-500">Estimated annual out-of-pocket health risk</div>
          <div className="text-lg font-semibold text-gray-800">
            {formatNaira(totals.healthRiskEstimate)}
          </div>
          {existingInsurance.has('health') && (
            <p className="text-xs text-gray-500 mt-1">
              You indicated you have health cover already — check it against this figure for gaps
              in dependents' coverage or out-of-network costs.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
          Property and motor reminder: certain categories of property (public buildings, buildings
          under construction) and third-party motor cover are compulsory insurance classes in
          Nigeria under insurance regulation administered by NAICOM. If you own a vehicle or a
          qualifying property and haven't ticked those boxes above, it's worth confirming your
          cover status with a licensed insurer.
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={copySummary}
          className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
          type="button"
        >
          Copy Summary
        </button>
        {copyStatus && <span className="text-sm text-gray-500">{copyStatus}</span>}
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        Educational estimate only — not financial, insurance, or tax advice, and not an insurance
        quote. Insurance figures are rough needs estimates based on the details you entered; get an
        actual quote and policy terms from a NAICOM-licensed insurer before buying cover, and note
        that most policies will ask for your NIN and BVN as part of onboarding. Build your
        emergency fund gradually — starting with one month and scaling up to your recommended
        target is a reasonable approach if the full amount feels out of reach today.
      </p>
    </div>
  )
}
