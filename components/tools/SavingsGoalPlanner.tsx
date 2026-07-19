'use client'

import { useMemo, useState, useEffect, type ChangeEvent } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Compounding = 'monthly' | 'quarterly' | 'annually' | 'daily'
type Mode = 'project' | 'requiredMonthly' | 'timeToGoal'

interface YearRow {
  year: number
  contribution: number
  cumulativeContribution: number
  interest: number
  balance: number
  realBalance: number
}

interface Props {
  locale: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMPOUNDING_PERIODS: Record<Compounding, number> = {
  monthly: 12,
  quarterly: 4,
  annually: 1,
  daily: 365,
}

const WHT_RATE = 0.1

const GOAL_PRESETS = [
  { label: 'Rent goal (Lagos)', goal: 2_000_000, initial: 200_000, monthly: 100_000, years: 2 },
  { label: 'Emergency fund', goal: 1_000_000, initial: 0, monthly: 50_000, years: 2 },
  { label: 'Retirement top-up', goal: 50_000_000, initial: 500_000, monthly: 100_000, years: 20 },
]

const RATE_PRESETS = [
  { label: 'SafeLock-style (13–18%)', rate: 15 },
  { label: 'Flexible savings (10–15%)', rate: 12 },
  { label: 'Bank fixed deposit (7–12%)', rate: 9 },
]

const NAIRA = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

function formatNaira(value: number): string {
  if (!isFinite(value)) return '—'
  return NAIRA.format(Math.round(value))
}

function clamp(value: number, min: number, max: number): number {
  if (isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

// ---------------------------------------------------------------------------
// Core math
// ---------------------------------------------------------------------------

/** Effective monthly rate given an annual nominal rate and a compounding frequency. */
function monthlyRateFor(annualRatePct: number, compounding: Compounding): number {
  const periodsPerYear = COMPOUNDING_PERIODS[compounding]
  const periodicRate = annualRatePct / 100 / periodsPerYear
  return Math.pow(1 + periodicRate, periodsPerYear / 12) - 1
}

/** Simulates month-by-month growth, applying WHT to interest at source each period if enabled. */
function simulate(
  initial: number,
  monthlyContribution: number,
  monthlyRate: number,
  totalMonths: number,
  whtEnabled: boolean,
  inflationRateAnnual: number
): YearRow[] {
  const rows: YearRow[] = []
  let balance = initial
  let cumulativeContribution = initial
  let cumulativeInterest = 0

  const months = Math.max(1, Math.round(totalMonths))
  const years = Math.ceil(months / 12)

  for (let year = 1; year <= years; year++) {
    let yearContribution = 0
    let yearInterest = 0
    const monthsThisYear = Math.min(12, months - (year - 1) * 12)

    for (let m = 0; m < monthsThisYear; m++) {
      const interestThisMonth = balance * monthlyRate
      const netInterest = whtEnabled ? interestThisMonth * (1 - WHT_RATE) : interestThisMonth
      balance += netInterest
      yearInterest += netInterest
      balance += monthlyContribution
      yearContribution += monthlyContribution
    }

    cumulativeContribution += yearContribution
    cumulativeInterest += yearInterest

    rows.push({
      year,
      contribution: yearContribution,
      cumulativeContribution,
      interest: cumulativeInterest,
      balance,
      realBalance: balance / Math.pow(1 + inflationRateAnnual / 100, year),
    })
  }

  return rows
}

/** Reverse-solves the monthly contribution needed to hit a goal in n months. */
function requiredMonthlyContribution(
  goal: number,
  initial: number,
  monthlyRate: number,
  totalMonths: number
): number {
  const n = Math.max(1, Math.round(totalMonths))
  if (monthlyRate === 0) {
    return (goal - initial) / n
  }
  const growth = Math.pow(1 + monthlyRate, n)
  const futureValueOfInitial = initial * growth
  const annuityFactor = (growth - 1) / monthlyRate
  return (goal - futureValueOfInitial) / annuityFactor
}

/** Reverse-solves the number of months needed to reach a goal. Returns null if unreachable. */
function monthsToReachGoal(
  goal: number,
  initial: number,
  monthlyContribution: number,
  monthlyRate: number
): number | null {
  if (goal <= initial) return 0
  if (monthlyRate === 0) {
    if (monthlyContribution <= 0) return null
    return (goal - initial) / monthlyContribution
  }
  const numerator = goal * monthlyRate + monthlyContribution
  const denominator = initial * monthlyRate + monthlyContribution
  if (denominator <= 0 || numerator <= 0) return null
  const n = Math.log(numerator / denominator) / Math.log(1 + monthlyRate)
  return n > 0 ? n : 0
}

function monthsToYearsMonths(totalMonths: number): string {
  if (!isFinite(totalMonths)) return '—'
  const months = Math.max(0, Math.round(totalMonths))
  const years = Math.floor(months / 12)
  const rem = months % 12
  const parts: string[] = []
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`)
  if (rem > 0 || years === 0) parts.push(`${rem} month${rem === 1 ? '' : 's'}`)
  return parts.join(', ')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SavingsGoalPlanner({ locale }: Props) {
  void locale // reserved for future translations; site is English/Nigeria-only today

  const [mode, setMode] = useState<Mode>('project')

  const [goal, setGoal] = useState(5_000_000)
  const [initial, setInitial] = useState(200_000)
  const [monthly, setMonthly] = useState(50_000)
  const [annualRate, setAnnualRate] = useState(15)
  const [compounding, setCompounding] = useState<Compounding>('monthly')
  const [years, setYears] = useState(3)
  const [extraMonths, setExtraMonths] = useState(0)
  const [whtEnabled, setWhtEnabled] = useState(true)
  const [inflationEnabled, setInflationEnabled] = useState(false)
  const [inflationRate, setInflationRate] = useState(15.9)

  const [usdRate, setUsdRate] = useState<number | null>(null)
  const [usdRateError, setUsdRateError] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load a reference USD/NGN rate on mount (informational only, never used in the math above).
  useEffect(() => {
    let cancelled = false
    fetch('https://api.frankfurter.dev/v2/latest?from=USD&to=NGN')
      .then((res) => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then((data) => {
        if (!cancelled && data?.rates?.NGN) {
          setUsdRate(data.rates.NGN)
        } else if (!cancelled) {
          setUsdRateError(true)
        }
      })
      .catch(() => {
        if (!cancelled) setUsdRateError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Optional deep-link restore from query params.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const num = (key: string) => {
      const v = params.get(key)
      return v !== null && !isNaN(Number(v)) ? Number(v) : null
    }
    const g = num('goal')
    const i = num('initial')
    const m = num('monthly')
    const r = num('rate')
    const y = num('years')
    const em = num('extraMonths')
    const comp = params.get('compounding') as Compounding | null
    const wht = params.get('wht')
    const infl = params.get('inflation')
    const inflRate = num('inflationRate')
    const modeParam = params.get('mode') as Mode | null

    if (g !== null) setGoal(g)
    if (i !== null) setInitial(i)
    if (m !== null) setMonthly(m)
    if (r !== null) setAnnualRate(r)
    if (y !== null) setYears(y)
    if (em !== null) setExtraMonths(em)
    if (comp && COMPOUNDING_PERIODS[comp]) setCompounding(comp)
    if (wht !== null) setWhtEnabled(wht === '1')
    if (infl !== null) setInflationEnabled(infl === '1')
    if (inflRate !== null) setInflationRate(inflRate)
    if (modeParam === 'project' || modeParam === 'requiredMonthly' || modeParam === 'timeToGoal') {
      setMode(modeParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const monthlyRate = useMemo(() => monthlyRateFor(annualRate, compounding), [annualRate, compounding])
  const effectiveMonthlyRate = whtEnabled ? monthlyRate * (1 - WHT_RATE) : monthlyRate
  const totalMonths = years * 12 + extraMonths

  // Derived: the "actual" monthly contribution and horizon used to build the chart/table,
  // depending on which quantity this mode is solving for.
  interface Derived {
    effectiveMonthly: number
    effectiveMonths: number
    pmtRaw?: number
    monthsRaw?: number | null
  }

  const derived = useMemo<Derived>(() => {
    if (mode === 'requiredMonthly') {
      const pmt = requiredMonthlyContribution(goal, initial, effectiveMonthlyRate, totalMonths)
      return { effectiveMonthly: Math.max(0, pmt), effectiveMonths: totalMonths, pmtRaw: pmt }
    }
    if (mode === 'timeToGoal') {
      const n = monthsToReachGoal(goal, initial, monthly, effectiveMonthlyRate)
      const capped = n === null ? null : Math.min(n, 360)
      return { effectiveMonthly: monthly, effectiveMonths: capped ?? totalMonths, monthsRaw: n }
    }
    return { effectiveMonthly: monthly, effectiveMonths: totalMonths }
  }, [mode, goal, initial, monthly, effectiveMonthlyRate, totalMonths])

  const rows = useMemo(
    () =>
      simulate(
        initial,
        derived.effectiveMonthly,
        effectiveMonthlyRate,
        derived.effectiveMonths,
        false, // WHT already folded into effectiveMonthlyRate
        inflationEnabled ? inflationRate : 0
      ),
    [initial, derived.effectiveMonthly, effectiveMonthlyRate, derived.effectiveMonths, inflationEnabled, inflationRate]
  )

  const finalRow = rows[rows.length - 1]
  const finalBalance = finalRow?.balance ?? initial
  const finalReal = finalRow?.realBalance ?? initial
  const totalContributed = finalRow?.cumulativeContribution ?? initial
  const totalInterest = finalRow?.interest ?? 0

  // Scenario comparison: same inputs, rate shifted ±3 points.
  const scenarios = useMemo(() => {
    const build = (rateShift: number) => {
      const r = monthlyRateFor(Math.max(0, annualRate + rateShift), compounding)
      const eff = whtEnabled ? r * (1 - WHT_RATE) : r
      const simRows = simulate(initial, derived.effectiveMonthly, eff, derived.effectiveMonths, false, 0)
      return simRows[simRows.length - 1]?.balance ?? initial
    }
    return {
      conservative: build(-3),
      base: finalBalance,
      optimistic: build(3),
    }
  }, [annualRate, compounding, whtEnabled, initial, derived.effectiveMonthly, derived.effectiveMonths, finalBalance])

  const chartData = rows.map((r) => ({
    year: `Y${r.year}`,
    Balance: Math.round(r.balance),
    ...(inflationEnabled ? { 'Real value': Math.round(r.realBalance) } : {}),
  }))

  function applyGoalPreset(preset: (typeof GOAL_PRESETS)[number]) {
    setGoal(preset.goal)
    setInitial(preset.initial)
    setMonthly(preset.monthly)
    setYears(preset.years)
    setExtraMonths(0)
  }

  function copyShareLink() {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams({
      goal: String(goal),
      initial: String(initial),
      monthly: String(monthly),
      rate: String(annualRate),
      years: String(years),
      extraMonths: String(extraMonths),
      compounding,
      wht: whtEnabled ? '1' : '0',
      inflation: inflationEnabled ? '1' : '0',
      inflationRate: String(inflationRate),
      mode,
    })
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        /* clipboard not available — silently ignore */
      })
  }

  return (
    <div className="w-full space-y-6">
      {/* Mode tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: 'project', label: 'How much will I have?' },
            { key: 'requiredMonthly', label: 'How much should I save monthly?' },
            { key: 'timeToGoal', label: 'How long will it take?' },
          ] as { key: Mode; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              mode === tab.key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goal presets */}
      <div className="rounded-2xl border border-gray-200 p-4">
        <p className="mb-3 text-sm font-medium text-gray-700">Quick presets</p>
        <div className="flex flex-wrap gap-2">
          {GOAL_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyGoalPreset(preset)}
              className="rounded-xl bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-gray-200 p-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Goal amount (₦)</span>
          <input
            type="number"
            min={0}
            value={goal}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setGoal(clamp(Number(e.target.value), 0, 10_000_000_000))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            aria-label="Goal amount in naira"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Current savings (₦)</span>
          <input
            type="number"
            min={0}
            value={initial}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setInitial(clamp(Number(e.target.value), 0, 10_000_000_000))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            aria-label="Current savings in naira"
          />
        </label>

        {mode !== 'requiredMonthly' && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Monthly contribution (₦)</span>
            <input
              type="number"
              min={0}
              value={monthly}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setMonthly(clamp(Number(e.target.value), 0, 100_000_000))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              aria-label="Monthly contribution in naira"
            />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">
            Annual interest rate: {annualRate.toFixed(1)}%
          </span>
          <input
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={annualRate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAnnualRate(Number(e.target.value))}
            className="w-full accent-indigo-600"
            aria-label="Annual interest rate percent"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {RATE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setAnnualRate(p.rate)}
                className="rounded-xl bg-gray-100 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-200"
              >
                {p.label}
              </button>
            ))}
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Compounding frequency</span>
          <select
            value={compounding}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setCompounding(e.target.value as Compounding)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            aria-label="Compounding frequency"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
            <option value="daily">Daily</option>
          </select>
        </label>

        {mode !== 'timeToGoal' && (
          <div className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Time period</span>
            <div className="flex gap-3">
              <label className="flex-1">
                <span className="mb-1 block text-xs text-gray-500">Years</span>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={years}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setYears(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                  aria-label="Years"
                />
                <span className="text-sm text-gray-700">{years} yr</span>
              </label>
              <label className="flex-1">
                <span className="mb-1 block text-xs text-gray-500">Extra months</span>
                <input
                  type="range"
                  min={0}
                  max={11}
                  value={extraMonths}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setExtraMonths(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                  aria-label="Extra months"
                />
                <span className="text-sm text-gray-700">{extraMonths} mo</span>
              </label>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            id="wht-toggle"
            type="checkbox"
            checked={whtEnabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setWhtEnabled(e.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
          <label htmlFor="wht-toggle" className="text-sm text-gray-700">
            Show net of 10% withholding tax on interest
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              id="inflation-toggle"
              type="checkbox"
              checked={inflationEnabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setInflationEnabled(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            <label htmlFor="inflation-toggle" className="text-sm text-gray-700">
              Show inflation-adjusted (real) value
            </label>
          </div>
          {inflationEnabled && (
            <label className="block pl-7">
              <span className="mb-1 block text-xs text-gray-500">
                Assumed annual inflation: {inflationRate.toFixed(1)}%
              </span>
              <input
                type="range"
                min={0}
                max={40}
                step={0.5}
                value={inflationRate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setInflationRate(Number(e.target.value))}
                className="w-full accent-indigo-600"
                aria-label="Inflation rate percent"
              />
            </label>
          )}
        </div>
      </div>

      {/* Results panel */}
      <div className="rounded-2xl bg-indigo-50 p-5">
        {mode === 'project' && (
          <>
            <p className="text-sm font-medium text-indigo-900">
              Projected amount after {monthsToYearsMonths(totalMonths)}
            </p>
            <p className="mt-1 text-3xl font-semibold text-indigo-900">{formatNaira(finalBalance)}</p>
            {inflationEnabled && (
              <p className="mt-1 text-sm text-indigo-700">
                In today&apos;s money (real value): {formatNaira(finalReal)}
              </p>
            )}
            <p className="mt-2 text-sm text-indigo-800">
              {finalBalance >= goal
                ? `That clears your ${formatNaira(goal)} goal.`
                : `That falls short of your ${formatNaira(goal)} goal by ${formatNaira(goal - finalBalance)}.`}
            </p>
          </>
        )}

        {mode === 'requiredMonthly' && (
          <>
            <p className="text-sm font-medium text-indigo-900">
              Monthly contribution needed to reach {formatNaira(goal)} in {monthsToYearsMonths(totalMonths)}
            </p>
            <p className="mt-1 text-3xl font-semibold text-indigo-900">
              {derived.pmtRaw !== undefined && derived.pmtRaw < 0
                ? formatNaira(0)
                : formatNaira(derived.effectiveMonthly)}
            </p>
            {derived.pmtRaw !== undefined && derived.pmtRaw < 0 && (
              <p className="mt-2 text-sm text-indigo-800">
                Your current savings alone are on track to clear this goal — no extra monthly contribution needed.
              </p>
            )}
          </>
        )}

        {mode === 'timeToGoal' && (
          <>
            <p className="text-sm font-medium text-indigo-900">Time to reach {formatNaira(goal)}</p>
            <p className="mt-1 text-3xl font-semibold text-indigo-900">
              {derived.monthsRaw == null
                ? 'Not reachable with these inputs'
                : monthsToYearsMonths(derived.monthsRaw)}
            </p>
            {derived.monthsRaw == null && (
              <p className="mt-2 text-sm text-indigo-800">
                With ₦0 current savings and ₦0 monthly contribution, this goal can&apos;t be projected. Add an
                initial amount or a monthly contribution above.
              </p>
            )}
          </>
        )}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-gray-500">Total contributed</p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(totalContributed)}</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-gray-500">
              Interest earned {whtEnabled ? '(net of WHT)' : '(gross)'}
            </p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(totalInterest)}</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-gray-500">Final balance</p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(finalBalance)}</p>
          </div>
        </div>
      </div>

      {/* Scenario comparison */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <p className="mb-3 text-sm font-medium text-gray-700">
          Scenario comparison (same inputs, rate shifted ±3 percentage points)
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Conservative ({Math.max(0, annualRate - 3).toFixed(1)}%)</p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(scenarios.conservative)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Base rate ({annualRate.toFixed(1)}%)</p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(scenarios.base)}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Optimistic ({(annualRate + 3).toFixed(1)}%)</p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(scenarios.optimistic)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {rows.length > 1 && (
        <div className="rounded-2xl border border-gray-200 p-5">
          <p className="mb-3 text-sm font-medium text-gray-700">Balance growth over time</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => `₦${(v / 1_000_000).toFixed(1)}M`}
                  width={60}
                />
                <Tooltip formatter={(value: unknown) => formatNaira(Number(value ?? 0))} />
                <Line type="monotone" dataKey="Balance" stroke="#4f46e5" strokeWidth={2} dot={false} />
                {inflationEnabled && (
                  <Line type="monotone" dataKey="Real value" stroke="#a5b4fc" strokeWidth={2} dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Year-by-year table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 p-5">
          <p className="mb-3 text-sm font-medium text-gray-700">Year-by-year breakdown</p>
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2 pr-4 font-medium">Year</th>
                <th className="py-2 pr-4 font-medium">Contributed (year)</th>
                <th className="py-2 pr-4 font-medium">Cumulative contributed</th>
                <th className="py-2 pr-4 font-medium">Cumulative interest</th>
                <th className="py-2 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 30).map((row) => (
                <tr key={row.year} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-900">{row.year}</td>
                  <td className="py-2 pr-4 text-gray-700">{formatNaira(row.contribution)}</td>
                  <td className="py-2 pr-4 text-gray-700">{formatNaira(row.cumulativeContribution)}</td>
                  <td className="py-2 pr-4 text-gray-700">{formatNaira(row.interest)}</td>
                  <td className="py-2 font-medium text-gray-900">{formatNaira(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Nigerian context panels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-900">Deposit protection</p>
          <p className="mt-1 text-sm text-gray-600">
            Deposits with licensed commercial banks, payment service banks, and mobile money accounts are covered
            by the NDIC up to ₦5,000,000 per depositor. Microfinance banks and primary mortgage banks are covered
            up to ₦2,000,000. This is a regulatory backstop, not a return guarantee.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-900">Fund managers and SEC oversight</p>
          <p className="mt-1 text-sm text-gray-600">
            Money market funds and other collective investment schemes are typically managed by SEC-registered fund
            managers, distinct from bank deposits. Read the fund fact sheet for its risk profile before comparing
            its yield to a bank product.
          </p>
        </div>
      </div>

      {/* USD/NGN reference */}
      <div className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-600">
        {usdRate ? (
          <p>Reference only: 1 USD ≈ {formatNaira(usdRate)} (source: Frankfurter). This has no effect on the naira figures above.</p>
        ) : usdRateError ? (
          <p>Live USD/NGN reference is unavailable right now — the figures above are naira-only and unaffected.</p>
        ) : (
          <p>Loading a reference USD/NGN rate…</p>
        )}
      </div>

      {/* Share */}
      <div>
        <button
          type="button"
          onClick={copyShareLink}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {copied ? 'Link copied' : 'Copy link to this scenario'}
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-sm text-gray-400">
        This tool provides illustrative calculations for planning purposes. It is not financial, investment, or tax
        advice. Actual returns vary, are not guaranteed, and depend on platform terms, market conditions, CBN
        policy, and other factors. Consult a licensed professional or verify current terms with your platform or
        the relevant regulator (CBN, SEC, DMO, NDIC) before acting. Past or typical rates do not predict future
        performance. Contributions are assumed to be made at the end of each month; interest and withholding tax
        (where enabled) are applied per compounding period.
      </p>
    </div>
  )
}
