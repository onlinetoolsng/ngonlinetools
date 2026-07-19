'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
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

type TabKey = 'personal' | 'contributions' | 'goals' | 'results'

interface YearRow {
  year: number
  age: number
  pensionable: number
  rsaContribution: number
  voluntaryContribution: number
  balance: number
  realBalance: number
  nhfBalance: number
}

interface Props {
  locale: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_EMPLOYEE_RATE = 8
const MIN_EMPLOYER_RATE = 10
const EMPLOYER_ONLY_RATE = 20
const NHF_RATE = 0.025
const NHF_MIN_MONTHS_FOR_LOAN = 6
const NHF_MAX_LOAN = 50_000_000
const NHF_LOAN_RATE = 6

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

interface ProjectionInputs {
  currentAge: number
  retirementAge: number
  pensionableMonthly: number
  currentRSABalance: number
  employeeRate: number
  employerRate: number
  nhfEnabled: boolean
  basicSalary: number
  voluntaryMonthly: number
  returnRate: number
  inflationRate: number
  salaryGrowthRate: number
}

function projectRSA(inputs: ProjectionInputs): YearRow[] {
  const {
    currentAge,
    retirementAge,
    pensionableMonthly,
    currentRSABalance,
    employeeRate,
    employerRate,
    nhfEnabled,
    basicSalary,
    voluntaryMonthly,
    returnRate,
    inflationRate,
    salaryGrowthRate,
  } = inputs

  const yearsToRetirement = Math.max(0, retirementAge - currentAge)
  const rows: YearRow[] = []
  let balance = currentRSABalance
  let nhfBalance = 0
  const totalRate = (employeeRate + employerRate) / 100

  for (let year = 1; year <= yearsToRetirement; year++) {
    const growthFactor = Math.pow(1 + salaryGrowthRate / 100, year - 1)
    const yearPensionable = pensionableMonthly * growthFactor
    const yearBasic = basicSalary * growthFactor

    const annualRSAContribution = yearPensionable * totalRate * 12
    const annualVoluntary = voluntaryMonthly * 12
    const annualNHF = nhfEnabled ? yearBasic * NHF_RATE * 12 : 0

    balance = balance * (1 + returnRate / 100) + annualRSAContribution + annualVoluntary
    nhfBalance += annualNHF // NHF is a savings pool, not invested like the RSA

    rows.push({
      year,
      age: currentAge + year,
      pensionable: yearPensionable,
      rsaContribution: annualRSAContribution,
      voluntaryContribution: annualVoluntary,
      balance,
      realBalance: balance / Math.pow(1 + inflationRate / 100, year),
      nhfBalance,
    })
  }

  return rows
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NigeriaRetirementPlanner({ locale }: Props) {
  void locale // reserved for future translations; site is English/Nigeria-only today

  const [tab, setTab] = useState<TabKey>('personal')

  // Personal & income
  const [currentAge, setCurrentAge] = useState(30)
  const [retirementAge, setRetirementAge] = useState(60)
  const [basicSalary, setBasicSalary] = useState(300_000)
  const [housingAllowance, setHousingAllowance] = useState(50_000)
  const [transportAllowance, setTransportAllowance] = useState(30_000)
  const [currentRSABalance, setCurrentRSABalance] = useState(0)

  // Contributions
  const [employerBearsAll, setEmployerBearsAll] = useState(false)
  const [employeeRate, setEmployeeRate] = useState(MIN_EMPLOYEE_RATE)
  const [employerRate, setEmployerRate] = useState(MIN_EMPLOYER_RATE)
  const [nhfEnabled, setNhfEnabled] = useState(false)
  const [voluntaryMonthly, setVoluntaryMonthly] = useState(0)
  const [salaryGrowthEnabled, setSalaryGrowthEnabled] = useState(false)
  const [salaryGrowthRate, setSalaryGrowthRate] = useState(10)

  // Assumptions & retirement goals
  const [returnRate, setReturnRate] = useState(10)
  const [inflationRate, setInflationRate] = useState(17)
  const [postRetirementYears, setPostRetirementYears] = useState(20)
  const [lumpSumPercent, setLumpSumPercent] = useState(25)
  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState(0)

  const pensionableMonthly = basicSalary + housingAllowance + transportAllowance

  const effectiveEmployeeRate = employerBearsAll ? 0 : Math.max(MIN_EMPLOYEE_RATE, employeeRate)
  const effectiveEmployerRate = employerBearsAll
    ? EMPLOYER_ONLY_RATE
    : Math.max(MIN_EMPLOYER_RATE, employerRate)

  const ageWarning = retirementAge <= currentAge
  const pensionableWarning = pensionableMonthly <= 0
  const earlyAccessNote = retirementAge < 50

  const rows = useMemo(
    () =>
      projectRSA({
        currentAge,
        retirementAge,
        pensionableMonthly,
        currentRSABalance,
        employeeRate: effectiveEmployeeRate,
        employerRate: effectiveEmployerRate,
        nhfEnabled,
        basicSalary,
        voluntaryMonthly,
        returnRate,
        inflationRate,
        salaryGrowthRate: salaryGrowthEnabled ? salaryGrowthRate : 0,
      }),
    [
      currentAge,
      retirementAge,
      pensionableMonthly,
      currentRSABalance,
      effectiveEmployeeRate,
      effectiveEmployerRate,
      nhfEnabled,
      basicSalary,
      voluntaryMonthly,
      returnRate,
      inflationRate,
      salaryGrowthEnabled,
      salaryGrowthRate,
    ]
  )

  const finalRow = rows[rows.length - 1]
  const balanceAtRetirement = finalRow?.balance ?? currentRSABalance
  const realBalanceAtRetirement = finalRow?.realBalance ?? currentRSABalance
  const nhfBalanceAtRetirement = finalRow?.nhfBalance ?? 0
  const totalRSAContributions = rows.reduce((sum, r) => sum + r.rsaContribution + r.voluntaryContribution, 0)
  const totalGrowth = balanceAtRetirement - currentRSABalance - totalRSAContributions

  const finalMonthlySalary = finalRow ? finalRow.pensionable : pensionableMonthly

  const lumpSum = balanceAtRetirement * (clamp(lumpSumPercent, 25, 50) / 100)
  const remainingForPension = balanceAtRetirement - lumpSum
  const monthlyPensionEstimate = remainingForPension / Math.max(1, postRetirementYears * 12)
  const replacementRatio = finalMonthlySalary > 0 ? (monthlyPensionEstimate / finalMonthlySalary) * 100 : 0
  const shortfall = desiredMonthlyIncome > 0 ? desiredMonthlyIncome - monthlyPensionEstimate : null

  const nhfMonthsContributed = nhfEnabled ? Math.max(0, retirementAge - currentAge) * 12 : 0
  const nhfLoanEligible = nhfMonthsContributed >= NHF_MIN_MONTHS_FOR_LOAN

  // Scenario comparison
  const scenarios = useMemo(() => {
    const build = (returnShift: number, inflationShift: number) => {
      const simRows = projectRSA({
        currentAge,
        retirementAge,
        pensionableMonthly,
        currentRSABalance,
        employeeRate: effectiveEmployeeRate,
        employerRate: effectiveEmployerRate,
        nhfEnabled,
        basicSalary,
        voluntaryMonthly,
        returnRate: Math.max(0, returnRate + returnShift),
        inflationRate: Math.max(0, inflationRate + inflationShift),
        salaryGrowthRate: salaryGrowthEnabled ? salaryGrowthRate : 0,
      })
      return simRows[simRows.length - 1]?.balance ?? currentRSABalance
    }
    return {
      conservative: build(-2, 3),
      base: balanceAtRetirement,
      optimistic: build(2, -2),
    }
  }, [
    currentAge,
    retirementAge,
    pensionableMonthly,
    currentRSABalance,
    effectiveEmployeeRate,
    effectiveEmployerRate,
    nhfEnabled,
    basicSalary,
    voluntaryMonthly,
    returnRate,
    inflationRate,
    salaryGrowthEnabled,
    salaryGrowthRate,
    balanceAtRetirement,
  ])

  const chartData = rows.map((r) => ({
    year: `Age ${r.age}`,
    Balance: Math.round(r.balance),
    'Real value': Math.round(r.realBalance),
  }))

  function downloadSummary() {
    if (typeof window === 'undefined') return
    const lines = [
      'Nigeria Retirement Planner — Summary',
      '',
      `Current age: ${currentAge}`,
      `Retirement age: ${retirementAge}`,
      `Pensionable emoluments (monthly): ${formatNaira(pensionableMonthly)}`,
      `Employee contribution rate: ${effectiveEmployeeRate}%`,
      `Employer contribution rate: ${effectiveEmployerRate}%`,
      `NHF included: ${nhfEnabled ? 'Yes' : 'No'}`,
      `Voluntary monthly contribution: ${formatNaira(voluntaryMonthly)}`,
      `Expected annual return: ${returnRate}%`,
      `Assumed annual inflation: ${inflationRate}%`,
      '',
      `Projected RSA balance at retirement (nominal): ${formatNaira(balanceAtRetirement)}`,
      `Projected RSA balance at retirement (today's naira): ${formatNaira(realBalanceAtRetirement)}`,
      `Lump sum at retirement (${lumpSumPercent}%): ${formatNaira(lumpSum)}`,
      `Estimated monthly pension (programmed withdrawal): ${formatNaira(monthlyPensionEstimate)}`,
      `Replacement ratio vs final pensionable income: ${replacementRatio.toFixed(1)}%`,
      nhfEnabled ? `NHF accumulated (not invested, separate from RSA): ${formatNaira(nhfBalanceAtRetirement)}` : '',
      '',
      'This is an illustrative projection, not a benefit statement from your PFA or PenCom. Actual pension calculations use PenCom-approved mortality and annuity tables. Consult your Pension Fund Administrator for official figures.',
    ].filter(Boolean)

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'retirement-planner-summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'personal', label: 'Personal & income' },
    { key: 'contributions', label: 'Contributions' },
    { key: 'goals', label: 'Retirement goals' },
    { key: 'results', label: 'Results' },
  ]

  return (
    <div className="w-full space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Validation warnings */}
      {(ageWarning || pensionableWarning) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          {ageWarning && <p>Retirement age must be greater than current age to project anything useful.</p>}
          {pensionableWarning && (
            <p>Enter a basic salary (and housing/transport allowance if applicable) to calculate pensionable emoluments.</p>
          )}
        </div>
      )}

      {/* Personal & income tab */}
      {tab === 'personal' && (
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-gray-200 p-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Current age</span>
            <input
              type="number"
              min={16}
              max={70}
              value={currentAge}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentAge(clamp(Number(e.target.value), 16, 70))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Desired retirement age
              <span className="ml-1 font-normal text-gray-400">(RSA access from 50)</span>
            </span>
            <input
              type="number"
              min={45}
              max={70}
              value={retirementAge}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRetirementAge(clamp(Number(e.target.value), 45, 70))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Monthly basic salary (₦)</span>
            <input
              type="number"
              min={0}
              value={basicSalary}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setBasicSalary(clamp(Number(e.target.value), 0, 100_000_000))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Monthly housing allowance (₦)</span>
            <input
              type="number"
              min={0}
              value={housingAllowance}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setHousingAllowance(clamp(Number(e.target.value), 0, 100_000_000))
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Monthly transport allowance (₦)</span>
            <input
              type="number"
              min={0}
              value={transportAllowance}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTransportAllowance(clamp(Number(e.target.value), 0, 100_000_000))
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Current RSA balance (₦, optional)</span>
            <input
              type="number"
              min={0}
              value={currentRSABalance}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setCurrentRSABalance(clamp(Number(e.target.value), 0, 1_000_000_000))
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <div className="rounded-xl bg-gray-50 p-3 sm:col-span-2">
            <p className="text-xs text-gray-500">
              Pensionable emoluments (Basic + Housing + Transport) — the legal base under PRA 2014
            </p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(pensionableMonthly)}</p>
          </div>
        </div>
      )}

      {/* Contributions tab */}
      {tab === 'contributions' && (
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-gray-200 p-5 sm:grid-cols-2">
          <div className="flex items-center gap-3 sm:col-span-2">
            <input
              id="employer-bears-all"
              type="checkbox"
              checked={employerBearsAll}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmployerBearsAll(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            <label htmlFor="employer-bears-all" className="text-sm text-gray-700">
              Employer bears the full contribution (20% minimum, employee pays 0%)
            </label>
          </div>

          {!employerBearsAll && (
            <>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Employee contribution rate: {effectiveEmployeeRate}%
                  <span className="ml-1 font-normal text-gray-400">(min 8%)</span>
                </span>
                <input
                  type="range"
                  min={8}
                  max={20}
                  step={0.5}
                  value={employeeRate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmployeeRate(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">
                  Employer contribution rate: {effectiveEmployerRate}%
                  <span className="ml-1 font-normal text-gray-400">(min 10%)</span>
                </span>
                <input
                  type="range"
                  min={10}
                  max={20}
                  step={0.5}
                  value={employerRate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmployerRate(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </label>
            </>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Voluntary additional monthly contribution (₦)</span>
            <input
              type="number"
              min={0}
              value={voluntaryMonthly}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setVoluntaryMonthly(clamp(Number(e.target.value), 0, 100_000_000))
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <div className="flex items-center gap-3">
            <input
              id="nhf-toggle"
              type="checkbox"
              checked={nhfEnabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNhfEnabled(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            <label htmlFor="nhf-toggle" className="text-sm text-gray-700">
              Include National Housing Fund (2.5% of basic salary)
            </label>
          </div>

          {nhfEnabled && (
            <p className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500 sm:col-span-2">
              NHF contributions are voluntary for private-sector employees and mandatory for public-sector
              employees and the self-employed earning the national minimum wage or above. NHF is tracked
              separately from your RSA — it isn&apos;t invested the same way, and after {NHF_MIN_MONTHS_FOR_LOAN}{' '}
              months of contributions you become eligible to apply for an NHF mortgage loan, currently up to{' '}
              {formatNaira(NHF_MAX_LOAN)} at a fixed {NHF_LOAN_RATE}% interest rate through the Federal Mortgage
              Bank of Nigeria.
            </p>
          )}

          <div className="flex items-center gap-3">
            <input
              id="salary-growth-toggle"
              type="checkbox"
              checked={salaryGrowthEnabled}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSalaryGrowthEnabled(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
            <label htmlFor="salary-growth-toggle" className="text-sm text-gray-700">
              Assume annual salary growth
            </label>
          </div>

          {salaryGrowthEnabled && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Salary growth rate: {salaryGrowthRate.toFixed(1)}% per year
              </span>
              <input
                type="range"
                min={0}
                max={25}
                step={0.5}
                value={salaryGrowthRate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSalaryGrowthRate(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </label>
          )}
        </div>
      )}

      {/* Retirement goals tab */}
      {tab === 'goals' && (
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-gray-200 p-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Expected annual investment return: {returnRate.toFixed(1)}%
            </span>
            <input
              type="range"
              min={5}
              max={15}
              step={0.5}
              value={returnRate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setReturnRate(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Assumed annual inflation: {inflationRate.toFixed(1)}%
            </span>
            <input
              type="range"
              min={5}
              max={30}
              step={0.5}
              value={inflationRate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setInflationRate(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Post-retirement years (life expectancy horizon): {postRetirementYears}
            </span>
            <input
              type="range"
              min={10}
              max={30}
              value={postRetirementYears}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPostRetirementYears(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Lump sum at retirement: {lumpSumPercent}%
              <span className="ml-1 font-normal text-gray-400">(25–50% typical)</span>
            </span>
            <input
              type="range"
              min={25}
              max={50}
              value={lumpSumPercent}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLumpSumPercent(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Desired monthly retirement income (₦, optional, in today&apos;s naira)
            </span>
            <input
              type="number"
              min={0}
              value={desiredMonthlyIncome}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDesiredMonthlyIncome(clamp(Number(e.target.value), 0, 100_000_000))
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </label>
        </div>
      )}

      {/* Results tab */}
      {tab === 'results' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-indigo-50 p-5">
            <p className="text-sm font-medium text-indigo-900">
              Projected RSA balance at retirement (age {retirementAge})
            </p>
            <p className="mt-1 text-3xl font-semibold text-indigo-900">{formatNaira(balanceAtRetirement)}</p>
            <p className="mt-1 text-sm text-indigo-700">
              In today&apos;s money (real value): {formatNaira(realBalanceAtRetirement)}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs text-gray-500">Lump sum ({lumpSumPercent}%)</p>
                <p className="text-base font-semibold text-gray-900">{formatNaira(lumpSum)}</p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs text-gray-500">Estimated monthly pension (programmed withdrawal)</p>
                <p className="text-base font-semibold text-gray-900">{formatNaira(monthlyPensionEstimate)}</p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs text-gray-500">Replacement ratio vs final pensionable income</p>
                <p className="text-base font-semibold text-gray-900">{replacementRatio.toFixed(1)}%</p>
              </div>
              <div className="rounded-xl bg-white p-3">
                <p className="text-xs text-gray-500">Total contributed vs growth</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatNaira(totalRSAContributions)} contributed, {formatNaira(Math.max(0, totalGrowth))} growth
                </p>
              </div>
            </div>

            {shortfall !== null && (
              <p className="mt-3 text-sm text-indigo-800">
                {shortfall > 0
                  ? `This falls short of your desired ${formatNaira(desiredMonthlyIncome)}/month by ${formatNaira(shortfall)}. Consider increasing your voluntary contribution or extending your working years.`
                  : `This meets or exceeds your desired ${formatNaira(desiredMonthlyIncome)}/month target.`}
              </p>
            )}

            {nhfEnabled && (
              <p className="mt-3 text-sm text-indigo-800">
                NHF accumulated (separate from your RSA, not compounded as an investment): {formatNaira(nhfBalanceAtRetirement)}.{' '}
                {nhfLoanEligible
                  ? `You'd be eligible to apply for an NHF mortgage loan (up to ${formatNaira(NHF_MAX_LOAN)} at ${NHF_LOAN_RATE}%).`
                  : `You'd need at least ${NHF_MIN_MONTHS_FOR_LOAN} months of contributions to become loan-eligible.`}
              </p>
            )}
          </div>

          {/* Scenario comparison */}
          <div className="rounded-2xl border border-gray-200 p-5">
            <p className="mb-3 text-sm font-medium text-gray-700">Scenario comparison</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Conservative (lower return, higher inflation)</p>
                <p className="text-base font-semibold text-gray-900">{formatNaira(scenarios.conservative)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Base case</p>
                <p className="text-base font-semibold text-gray-900">{formatNaira(scenarios.base)}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Optimistic (higher return, lower inflation)</p>
                <p className="text-base font-semibold text-gray-900">{formatNaira(scenarios.optimistic)}</p>
              </div>
            </div>
          </div>

          {/* Chart */}
          {rows.length > 1 && (
            <div className="rounded-2xl border border-gray-200 p-5">
              <p className="mb-3 text-sm font-medium text-gray-700">RSA balance growth to retirement</p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v: number) => `₦${(v / 1_000_000).toFixed(0)}M`}
                      width={60}
                    />
                    <Tooltip formatter={(value: unknown) => formatNaira(Number(value ?? 0))} />
                    <Line type="monotone" dataKey="Balance" stroke="#4f46e5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Real value" stroke="#a5b4fc" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Year-by-year table */}
          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 p-5">
              <p className="mb-3 text-sm font-medium text-gray-700">Year-by-year breakdown</p>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-4 font-medium">Age</th>
                    <th className="py-2 pr-4 font-medium">Pensionable (monthly)</th>
                    <th className="py-2 pr-4 font-medium">RSA contribution (year)</th>
                    <th className="py-2 font-medium">RSA balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.year} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-gray-900">{row.age}</td>
                      <td className="py-2 pr-4 text-gray-700">{formatNaira(row.pensionable)}</td>
                      <td className="py-2 pr-4 text-gray-700">
                        {formatNaira(row.rsaContribution + row.voluntaryContribution)}
                      </td>
                      <td className="py-2 font-medium text-gray-900">{formatNaira(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={downloadSummary}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Download summary (.txt)
            </button>
          </div>
        </div>
      )}

      {/* Self-employed note */}
      <div className="rounded-2xl border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-900">Self-employed or informal sector?</p>
        <p className="mt-1 text-sm text-gray-600">
          You're not required to join the mandatory scheme, but you can open a Micro Pension Plan with any
          licensed Pension Fund Administrator and contribute voluntarily, and you can also contribute to the NHF
          voluntarily. Use the voluntary contribution field above to model this.
        </p>
      </div>

      {/* Disclaimer */}
      <p className="text-sm text-gray-400">
        This tool provides illustrative calculations for planning purposes. It is not financial, investment, or
        retirement advice. Figures are based on the Pension Reform Act (PRA) 2014 minimum contribution structure
        (8% employee / 10% employer, or 20% where the employer bears the full contribution) applied to pensionable
        emoluments (basic salary + housing allowance + transport allowance). NHF contributions, where enabled, are
        2.5% of basic salary and are voluntary for private-sector employees and mandatory for public-sector
        employees and the self-employed earning the national minimum wage or above. Monthly pension estimates use
        a simplified straight-line programmed-withdrawal calculation; real Pension Fund Administrators apply
        PenCom-approved mortality and annuity tables that account for age, gender, and other factors, so your
        actual benefit statement will differ. Projections are not guarantees — actual returns, inflation, and
        regulatory rates will vary. Consult your Pension Fund Administrator or PenCom directly for official
        figures before making retirement decisions.
      </p>
    </div>
  )
}
