'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CpiSeries = 'headline' | 'food'

interface Props {
  locale: string
}

interface MonthPoint {
  ym: string // 'YYYY-MM'
  headline: number // YoY % for that series at that month
  food: number
  /** true if this month's figure is directly published by NBS; false if linearly interpolated between known readings */
  isKnown: boolean
}

interface YearRow {
  year: number
  nominal: number
  real: number
}

// ---------------------------------------------------------------------------
// Historical data (hardcoded, update manually on major NBS releases)
// ---------------------------------------------------------------------------
//
// Two eras, deliberately not spliced into a single CPI index:
//
// 1) 2020–2024 (old base year, 2009 = 100): only annual AVERAGE headline
//    inflation is reproduced here (NBS/World Bank/FocusEconomics), applied
//    as a flat rate across each year and linearly interpolated between the
//    anchor points below. Sub-annual figures under the old base year are
//    not reproduced.
// 2) Jan 2025 onward (rebased, new base year 2024 = 100): actual NBS
//    year-on-year headline and food inflation readings, month by month
//    where published; gaps between published months are linearly
//    interpolated and flagged as such.
//
// We never divide raw CPI index points across the 2024 rebasing boundary
// (that would be mathematically invalid). Instead everything below is
// expressed as a YoY *rate*, and cumulative erosion is computed by
// compounding month-equivalent rates — a rate-based approach is valid
// across a rebasing, an index-point ratio is not.

const ANNUAL_ANCHORS: { ym: string; headline: number }[] = [
  { ym: '2020-01', headline: 13.25 },
  { ym: '2020-12', headline: 13.25 },
  { ym: '2021-12', headline: 17.0 },
  { ym: '2022-12', headline: 18.8 },
  { ym: '2023-12', headline: 24.7 },
  { ym: '2024-12', headline: 34.8 }, // last published reading under the old (2009) base year
]

// NBS headline YoY inflation, rebased series (2024 = 100). Sourced from NBS
// monthly CPI & Inflation reports (nigerianstat.gov.ng) and Trading Economics'
// NBS-sourced coverage. Update this object as new months are released.
const MONTHLY_HEADLINE_YOY: Record<string, number> = {
  '2025-01': 24.48,
  '2025-03': 27.4,
  '2025-04': 26.8,
  '2025-05': 26.1,
  '2025-06': 25.3,
  '2025-07': 24.9,
  '2025-08': 23.1,
  '2025-09': 21.0,
  '2025-10': 19.0,
  '2025-11': 17.33,
  '2025-12': 15.15,
  '2026-01': 15.1,
  '2026-02': 15.06,
  '2026-03': 15.38,
  '2026-04': 15.69,
  '2026-05': 15.93,
  '2026-06': 15.91,
}

// NBS food inflation (YoY), same rebased series. Sparser than headline —
// only months NBS has published a distinct food figure are listed; gaps
// are interpolated the same way as headline.
const MONTHLY_FOOD_YOY: Record<string, number> = {
  '2025-01': 26.08,
  '2025-11': 14.21,
  '2025-12': 10.84,
  '2026-01': 8.89,
  '2026-02': 12.12,
  '2026-04': 16.06,
  '2026-05': 16.96,
  '2026-06': 17.52,
}

const DATA_START = '2020-01'
const DATA_END = '2026-06' // "Last updated" — bump this and add rows above when NBS publishes a new month
const REBASE_MONTH = '2025-01'

function ymToIndex(ym: string): number {
  const [y, m] = ym.split('-').map(Number)
  return y * 12 + (m - 1)
}

function indexToYm(i: number): string {
  const y = Math.floor(i / 12)
  const m = (i % 12) + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

/** Builds a complete month-by-month table between DATA_START and DATA_END,
 *  linearly interpolating between whichever anchor/known points bracket
 *  each month, per series. */
function buildMonthlyTable(): MonthPoint[] {
  const startIdx = ymToIndex(DATA_START)
  const endIdx = ymToIndex(DATA_END)

  // Merge annual anchors (pre-rebase) with monthly NBS readings (post-rebase)
  // into one sorted list of known headline points.
  const knownHeadline: { idx: number; value: number }[] = [
    ...ANNUAL_ANCHORS.map((a) => ({ idx: ymToIndex(a.ym), value: a.headline })),
    ...Object.entries(MONTHLY_HEADLINE_YOY).map(([ym, v]) => ({ idx: ymToIndex(ym), value: v })),
  ].sort((a, b) => a.idx - b.idx)

  const knownFood: { idx: number; value: number }[] = Object.entries(MONTHLY_FOOD_YOY)
    .map(([ym, v]) => ({ idx: ymToIndex(ym), value: v }))
    .sort((a, b) => a.idx - b.idx)

  function interpolate(known: { idx: number; value: number }[], idx: number, fallback: number): { value: number; isKnown: boolean } {
    const exact = known.find((k) => k.idx === idx)
    if (exact) return { value: exact.value, isKnown: true }

    let before: { idx: number; value: number } | undefined
    let after: { idx: number; value: number } | undefined
    for (const k of known) {
      if (k.idx <= idx) before = k
      if (k.idx >= idx && !after) after = k
    }
    if (before && after && before.idx !== after.idx) {
      const t = (idx - before.idx) / (after.idx - before.idx)
      return { value: before.value + t * (after.value - before.value), isKnown: false }
    }
    if (before) return { value: before.value, isKnown: false }
    if (after) return { value: after.value, isKnown: false }
    return { value: fallback, isKnown: false }
  }

  const table: MonthPoint[] = []
  for (let idx = startIdx; idx <= endIdx; idx++) {
    const ym = indexToYm(idx)
    const h = interpolate(knownHeadline, idx, 15)
    // Food before the rebase isn't tracked separately here — fall back to headline.
    const f = idx < ymToIndex(REBASE_MONTH) ? { value: h.value, isKnown: false } : interpolate(knownFood, idx, h.value)
    table.push({ ym, headline: h.value, food: f.value, isKnown: h.isKnown })
  }
  return table
}

const MONTHLY_TABLE = buildMonthlyTable()
const MONTHLY_TABLE_BY_YM = new Map(MONTHLY_TABLE.map((m) => [m.ym, m]))

const AVAILABLE_MONTHS = MONTHLY_TABLE.map((m) => m.ym)

// Reference commodity prices for the "what does this buy today" panel.
// These are current snapshot prices, not a historical series — used only to
// translate a naira amount into concrete goods at today's prices.
const RICE_50KG_PRICE = 112_000 // NBS Selected Food Price Watch, local rice, Mar 2026 (national average; regional prices vary widely, roughly ₦53,000–₦150,000)
const PETROL_LITRE_PRICE = 1_596 // NBS PMS Price Watch, average retail pump price, May 2026 (varies by state/marketer)

const NAIRA = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

function formatNaira(value: number): string {
  if (!isFinite(value)) return '—'
  return NAIRA.format(Math.round(value))
}

function formatNumber(value: number, digits = 1): string {
  if (!isFinite(value)) return '—'
  return value.toLocaleString('en-NG', { maximumFractionDigits: digits })
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, 1))
  return date.toLocaleDateString('en-NG', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

// ---------------------------------------------------------------------------
// Core math
// ---------------------------------------------------------------------------

/** Cumulative price-level growth factor between two months (inclusive of start,
 *  exclusive of the first month's own rate — i.e. F=1 when start===end).
 *  Built by compounding each month's annualized YoY rate converted to an
 *  equivalent monthly rate: (1+annual/100)^(1/12). This lets us chain across
 *  the 2024 rebasing boundary safely, since we're compounding rates, never
 *  dividing raw index points from two different base years. */
function cumulativeFactor(startYm: string, endYm: string, series: CpiSeries): number {
  const startIdx = ymToIndex(startYm)
  const endIdx = ymToIndex(endYm)
  if (endIdx <= startIdx) return 1

  let factor = 1
  for (let idx = startIdx; idx < endIdx; idx++) {
    const ym = indexToYm(idx)
    const point = MONTHLY_TABLE_BY_YM.get(ym)
    const annualRate = point ? (series === 'headline' ? point.headline : point.food) : 15
    factor *= Math.pow(1 + annualRate / 100, 1 / 12)
  }
  return factor
}

function monthsBetween(startYm: string, endYm: string): number {
  return ymToIndex(endYm) - ymToIndex(startYm)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PERIOD_PRESETS: { label: string; start: string; end: string }[] = [
  { label: 'Since CPI rebasing (Jan 2025)', start: '2025-01', end: DATA_END },
  { label: 'Last 5 years', start: '2021-01', end: DATA_END },
  { label: 'Since fuel subsidy removal (2023)', start: '2023-06', end: DATA_END },
  { label: 'Since 2020', start: '2020-01', end: DATA_END },
]

export function NigeriaInflationImpactSimulator({ locale }: Props) {
  void locale // reserved for future translations; site is English/Nigeria-only today

  const [initialAmount, setInitialAmount] = useState(1_000_000)
  const [startYm, setStartYm] = useState('2021-01')
  const [endYm, setEndYm] = useState(DATA_END)
  const [nominalRate, setNominalRate] = useState(0)
  const [series, setSeries] = useState<CpiSeries>('headline')

  const startOptions = AVAILABLE_MONTHS.filter((ym) => ym < endYm)
  const endOptions = AVAILABLE_MONTHS.filter((ym) => ym > startYm)

  function handleAmount(e: ChangeEvent<HTMLInputElement>) {
    const v = Number(cleanNumberInput(e.target.value))
    setInitialAmount(isNaN(v) ? 0 : Math.max(0, v))
  }

  function applyPreset(preset: (typeof PERIOD_PRESETS)[number]) {
    setStartYm(preset.start)
    setEndYm(preset.end)
  }

  const months = monthsBetween(startYm, endYm)
  const years = months / 12

  // Cumulative price-level growth over the selected period, for the chosen series.
  const priceFactor = useMemo(() => cumulativeFactor(startYm, endYm, series), [startYm, endYm, series])
  const cumulativeInflationPct = (priceFactor - 1) * 100

  // Nominal amount at the end date, if it earned `nominalRate`% p.a. (compounded monthly).
  const monthlyNominalRate = Math.pow(1 + nominalRate / 100, 1 / 12) - 1
  const nominalFutureValue = initialAmount * Math.pow(1 + monthlyNominalRate, months)

  // That nominal amount's worth, expressed in start-date prices.
  const realValue = nominalFutureValue / priceFactor
  const erosion = initialAmount - realValue

  // Year-by-year rows for the chart/table, from start to end.
  const rows: YearRow[] = useMemo(() => {
    const out: YearRow[] = []
    const startIdx = ymToIndex(startYm)
    const endIdx = ymToIndex(endYm)
    for (let idx = startIdx; idx <= endIdx; idx += 12) {
      const ym = indexToYm(Math.min(idx, endIdx))
      const elapsedMonths = ymToIndex(ym) - startIdx
      const nominal = initialAmount * Math.pow(1 + monthlyNominalRate, elapsedMonths)
      const factor = cumulativeFactor(startYm, ym, series)
      out.push({ year: Number(ym.split('-')[0]), nominal, real: nominal / factor })
    }
    // Always include the exact end month as the final row.
    const lastYm = endYm
    const elapsedMonths = ymToIndex(lastYm) - startIdx
    const nominal = initialAmount * Math.pow(1 + monthlyNominalRate, elapsedMonths)
    const factor = cumulativeFactor(startYm, lastYm, series)
    const lastRow = { year: Number(lastYm.split('-')[0]), nominal, real: nominal / factor }
    if (out.length === 0 || out[out.length - 1].year !== lastRow.year) out.push(lastRow)
    else out[out.length - 1] = lastRow
    return out
  }, [startYm, endYm, initialAmount, monthlyNominalRate, series])

  const chartData = rows.map((r) => ({
    year: String(r.year),
    Nominal: Math.round(r.nominal),
    'Real (inflation-adjusted)': Math.round(r.real),
  }))

  // Scenario comparison: no growth vs. a typical bank savings rate vs. the user's own rate.
  const scenario = (ratePct: number) => {
    const mRate = Math.pow(1 + ratePct / 100, 1 / 12) - 1
    const fv = initialAmount * Math.pow(1 + mRate, months)
    return fv / priceFactor
  }

  // "What does this buy today" — uses the end-date real value in today's naira.
  const riceBags = nominalFutureValue / RICE_50KG_PRICE
  const petrolLitres = nominalFutureValue / PETROL_LITRE_PRICE
  const startRiceBags = initialAmount / RICE_50KG_PRICE
  const startPetrolLitres = initialAmount / PETROL_LITRE_PRICE

  const [tableQuery, setTableQuery] = useState('')
  const [tableAsc, setTableAsc] = useState(false)
  const [tableOpen, setTableOpen] = useState(false)

  const filteredTable = useMemo(() => {
    let list = MONTHLY_TABLE.filter((m) => m.ym.includes(tableQuery.trim()))
    list = tableAsc ? list : [...list].reverse()
    return list
  }, [tableQuery, tableAsc])

  return (
    <div className="space-y-6">
      {/* Last updated banner */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-2 text-xs text-gray-500">
        Historical data last updated: {monthLabel(DATA_END)} (NBS CPI &amp; Inflation Report). Check the{' '}
        <a
          href="https://nigerianstat.gov.ng/"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-indigo-700 underline"
        >
          NBS CPI portal
        </a>{' '}
        for the latest official release.
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PERIOD_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Initial amount (₦)</span>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(initialAmount ? String(initialAmount) : '')}
              onChange={handleAmount}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Optional annual nominal return/interest (%)</span>
            <input
              type="number"
              step="0.1"
              value={nominalRate}
              onChange={(e) => setNominalRate(isNaN(Number(e.target.value)) ? 0 : Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="mt-1 block text-xs text-gray-500">Leave at 0% to see pure inflation erosion of idle cash or a fixed income.</span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">From</span>
            <select
              value={startYm}
              onChange={(e) => setStartYm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {startOptions.map((ym) => (
                <option key={ym} value={ym}>
                  {monthLabel(ym)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">To</span>
            <select
              value={endYm}
              onChange={(e) => setEndYm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {endOptions.map((ym) => (
                <option key={ym} value={ym}>
                  {ym === DATA_END ? `${monthLabel(ym)} (latest)` : monthLabel(ym)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">CPI basis:</span>
          <div className="inline-flex rounded-xl border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => setSeries('headline')}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                series === 'headline' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Headline CPI
            </button>
            <button
              type="button"
              onClick={() => setSeries('food')}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                series === 'food' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Food CPI
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl bg-indigo-50 p-5">
        <p className="text-sm font-medium text-indigo-900">
          {formatNaira(initialAmount)} in {monthLabel(startYm)} is worth only
        </p>
        <p className="mt-1 text-3xl font-semibold text-indigo-900">{formatNaira(realValue)}</p>
        <p className="mt-1 text-sm text-indigo-700">in {monthLabel(startYm)} prices, by {monthLabel(endYm)}.</p>
        <p className="mt-2 text-sm text-indigo-800">
          That&apos;s a loss of {formatNaira(erosion)} in purchasing power ({formatNumber(cumulativeInflationPct)}% cumulative{' '}
          {series === 'food' ? 'food' : 'headline'} inflation over {formatNumber(years)} years)
          {nominalRate > 0 ? `, even after growing at ${formatNumber(nominalRate)}% p.a. nominal` : ' (no growth applied)'}.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-gray-500">Nominal amount by {monthLabel(endYm)}</p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(nominalFutureValue)}</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-gray-500">Cumulative inflation</p>
            <p className="text-base font-semibold text-gray-900">{formatNumber(cumulativeInflationPct)}%</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs text-gray-500">Real value (in {monthLabel(startYm)} naira)</p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(realValue)}</p>
          </div>
        </div>
      </div>

      {/* Scenario comparison */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <p className="mb-3 text-sm font-medium text-gray-700">
          Scenario comparison: real value by {monthLabel(endYm)} at different growth rates
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">No growth (0% p.a.)</p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(scenario(0))}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Typical bank savings (~15% p.a.)</p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(scenario(15))}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Your rate ({formatNumber(nominalRate)}% p.a.)</p>
            <p className="text-base font-semibold text-gray-900">{formatNaira(scenario(nominalRate))}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="rounded-2xl border border-gray-200 p-5">
          <p className="mb-3 text-sm font-medium text-gray-700">Nominal vs. inflation-adjusted value over time</p>
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Nominal" stroke="#4f46e5" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Real (inflation-adjusted)" stroke="#a5b4fc" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Year-by-year table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 p-5">
          <p className="mb-3 text-sm font-medium text-gray-700">Year-by-year breakdown</p>
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2 pr-4 font-medium">Year</th>
                <th className="py-2 pr-4 font-medium">Nominal value</th>
                <th className="py-2 font-medium">Real value (in {monthLabel(startYm)} naira)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.year}-${i}`} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-900">{row.year}</td>
                  <td className="py-2 pr-4 text-gray-700">{formatNaira(row.nominal)}</td>
                  <td className="py-2 font-medium text-gray-900">{formatNaira(row.real)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Equivalent goods example */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <p className="mb-3 text-sm font-medium text-gray-700">What this looks like in everyday goods</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">50kg bag of local rice (~{formatNaira(RICE_50KG_PRICE)}, NBS average, Mar 2026)</p>
            <p className="mt-1 text-sm text-gray-800">
              {formatNaira(initialAmount)} bought about <strong>{formatNumber(startRiceBags)} bags</strong> back in {monthLabel(startYm)}.
              By {monthLabel(endYm)}, that same nominal amount buys only about <strong>{formatNumber(riceBags)} bags</strong> at today&apos;s
              price.
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Petrol, per litre (~{formatNaira(PETROL_LITRE_PRICE)}, NBS PMS Price Watch average, May 2026)</p>
            <p className="mt-1 text-sm text-gray-800">
              {formatNaira(initialAmount)} bought about <strong>{formatNumber(startPetrolLitres, 0)} litres</strong> back in{' '}
              {monthLabel(startYm)}. By {monthLabel(endYm)}, that same nominal amount buys only about{' '}
              <strong>{formatNumber(petrolLitres, 0)} litres</strong> at today&apos;s price.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Rice and fuel prices vary widely by state and outlet, and each moves at its own pace, sometimes faster or slower than the
          general CPI. These are illustrative reference prices at today&apos;s levels, not a historical price series for {monthLabel(startYm)}.
        </p>
      </div>

      {/* Expandable historical CPI table */}
      <div className="rounded-2xl border border-gray-200 p-5">
        <button
          type="button"
          onClick={() => setTableOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-medium text-gray-700">Historical CPI &amp; inflation table ({monthLabel(DATA_START)}–{monthLabel(DATA_END)})</span>
          <span className="text-gray-500">{tableOpen ? '−' : '+'}</span>
        </button>

        {tableOpen && (
          <div className="mt-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search year, e.g. 2025"
                value={tableQuery}
                onChange={(e) => setTableQuery(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setTableAsc((v) => !v)}
                className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Sort: {tableAsc ? 'Oldest first' : 'Newest first'}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="py-2 pr-4 font-medium">Month</th>
                    <th className="py-2 pr-4 font-medium">Headline YoY</th>
                    <th className="py-2 pr-4 font-medium">Food YoY</th>
                    <th className="py-2 font-medium">Base year</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTable.map((m) => (
                    <tr key={m.ym} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-gray-900">{monthLabel(m.ym)}</td>
                      <td className="py-2 pr-4 text-gray-700">
                        {formatNumber(m.headline, 2)}%{!m.isKnown && <span className="text-gray-400"> (interpolated)</span>}
                      </td>
                      <td className="py-2 pr-4 text-gray-700">{formatNumber(m.food, 2)}%</td>
                      <td className="py-2 text-gray-500">{m.ym < REBASE_MONTH ? '2009 = 100' : '2024 = 100'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Methodology & rebasing note */}
      <div className="rounded-2xl border border-gray-200 p-4 text-sm text-gray-600 space-y-2">
        <p className="font-medium text-gray-900">Methodology</p>
        <p>
          Real value = nominal amount ÷ cumulative price-level growth factor, where the growth factor is built by compounding each
          month&apos;s year-on-year inflation rate (converted to a monthly-equivalent rate) across the selected period.
        </p>
        <p>
          The National Bureau of Statistics rebased Nigeria&apos;s CPI in 2025, moving the base year from 2009 to 2024 and updating
          the consumption basket. The rebasing is why the headline rate appears to drop sharply between December 2024 (34.8%, old
          base) and January 2025 (24.48%, new base) — that is a change in measurement methodology, not a one-month collapse in
          prices. Figures before January 2025 in this tool use annual average rates under the old base year; figures from January
          2025 onward are NBS&apos;s rebased monthly readings.
        </p>
      </div>

      {/* Disclaimer */}
      <p className="text-sm text-gray-400">
        This tool is for educational and illustrative purposes only. It is not financial, investment, or tax advice. Historical
        inflation figures are sourced from NBS CPI &amp; Inflation Reports and are hardcoded here; they are updated periodically and
        may not reflect the very latest release — verify current figures directly with the NBS. Some months are linearly
        interpolated between published readings where NBS has not released a distinct figure, and are marked accordingly in the
        table above. Past inflation does not predict future inflation, and this calculator does not account for taxes, fees, or
        changes in your personal spending basket.
      </p>
    </div>
  )
}
