'use client';

import { useMemo, useState } from 'react';

/**
 * South Africa Ovulation Calculator
 * Pure client component. No SEO responsibility, no registry imports.
 *
 * Implements the universal calendar method (LMP + cycle length; ovulation =
 * next period start minus luteal-phase length; fertile window = the 5 days
 * before ovulation plus ovulation day itself). This is the same method used
 * by South African fertility resources (Medfem, Huggies SA, Marie Stopes
 * SA, Fertility Solutions) and is not a country-specific medical formula —
 * there is no SA statute or clinical guideline that changes the math, only
 * the disclaimer language, which National DoH guidance treats this kind of
 * calendar tool as educational/self-help, not a medical device or a
 * reliable method of contraception.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function diffInDays(a: Date, b: Date): number {
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((aMid.getTime() - bMid.getTime()) / MS_PER_DAY);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateRange(start: Date, end: Date): string {
  if (isSameDay(start, end)) return formatDateShort(start);
  return `${start.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long' })} \u2013 ${formatDateShort(end)}`;
}

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

type CycleWindow = {
  periodStart: Date;
  nextPeriodStart: Date;
  ovulationDay: Date;
  fertileStart: Date;
  fertileEnd: Date;
  dueDateIfConceived: Date;
};

function buildCycle(periodStart: Date, cycleLength: number, lutealPhase: number): CycleWindow {
  const nextPeriodStart = addDays(periodStart, cycleLength);
  const ovulationDay = addDays(nextPeriodStart, -lutealPhase);
  const fertileStart = addDays(ovulationDay, -5);
  const fertileEnd = ovulationDay; // stricter 5+1 window: 5 days before ovulation, through ovulation day itself
  const dueDateIfConceived = addDays(ovulationDay, 266);
  return { periodStart, nextPeriodStart, ovulationDay, fertileStart, fertileEnd, dueDateIfConceived };
}

type DayCell = { date: Date | null };

function buildMonthGrid(year: number, month: number): DayCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: DayCell[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d) });
  while (cells.length % 7 !== 0) cells.push({ date: null });
  return cells;
}

type DayType = 'period' | 'fertile' | 'ovulation' | null;

function classifyDay(date: Date, cycles: CycleWindow[], periodLength: number): DayType {
  for (const c of cycles) {
    const periodEnd = addDays(c.periodStart, periodLength - 1);
    if (date >= c.periodStart && date <= periodEnd) return 'period';
    if (isSameDay(date, c.ovulationDay)) return 'ovulation';
    if (date >= c.fertileStart && date <= c.fertileEnd) return 'fertile';
  }
  return null;
}

const LEGEND = [
  { type: 'period' as const, color: 'bg-red-200', en: 'Period', ar: '\u0627\u0644\u062f\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064a\u0629' },
  { type: 'fertile' as const, color: 'bg-green-200', en: 'Fertile window', ar: '\u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062e\u0635\u0648\u0628\u0629' },
  { type: 'ovulation' as const, color: 'bg-indigo-500', en: 'Peak ovulation', ar: '\u0630\u0631\u0648\u0629 \u0627\u0644\u062a\u0628\u0648\u064a\u0636' },
  { type: 'today' as const, color: 'ring-2 ring-gray-900', en: 'Today', ar: '\u0627\u0644\u064a\u0648\u0645' },
];

export default function SouthAfricaOvulationCalculator({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const [lmpInput, setLmpInput] = useState('');
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodLength, setPeriodLength] = useState<number>(5);
  const [lutealPhase, setLutealPhase] = useState<number>(14);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [monthsToShow, setMonthsToShow] = useState<1 | 2 | 3>(2);
  const [today] = useState<Date>(new Date());

  const lmpDate = parseDateInput(lmpInput);
  const cycleOutOfCommonRange = cycleLength < 21 || cycleLength > 35;

  const error = useMemo(() => {
    if (!lmpDate) return null;
    if (lmpDate.getTime() > today.getTime()) {
      return isAr
        ? '\u0644\u0627 \u064a\u0645\u0643\u0646 \u0623\u0646 \u064a\u0643\u0648\u0646 \u062a\u0627\u0631\u064a\u062e \u0628\u062f\u0621 \u0622\u062e\u0631 \u062f\u0648\u0631\u0629 \u0634\u0647\u0631\u064a\u0629 \u0641\u064a \u0627\u0644\u0645\u0633\u062a\u0642\u0628\u0644.'
        : 'The first day of your last period can\u2019t be in the future. Please check the date.';
    }
    return null;
  }, [lmpDate, today, isAr]);

  const cycles = useMemo(() => {
    if (!lmpDate || error) return [];
    const cyclesElapsed = Math.max(0, Math.floor(diffInDays(today, lmpDate) / cycleLength));
    const currentCycleStart = addDays(lmpDate, cyclesElapsed * cycleLength);
    const result: CycleWindow[] = [];
    for (let i = 0; i < 3; i++) {
      result.push(buildCycle(addDays(currentCycleStart, i * cycleLength), cycleLength, lutealPhase));
    }
    return result;
  }, [lmpDate, cycleLength, lutealPhase, today, error]);

  const currentCycle = cycles[0] ?? null;

  const todayStatus = useMemo(() => {
    if (!currentCycle) return null;
    const periodEnd = addDays(currentCycle.periodStart, periodLength - 1);
    if (today >= currentCycle.periodStart && today <= periodEnd) return 'period';
    if (isSameDay(today, currentCycle.ovulationDay)) return 'ovulation';
    if (today >= currentCycle.fertileStart && today <= currentCycle.fertileEnd) return 'fertile';
    if (today > currentCycle.ovulationDay) return 'post-ovulation';
    return 'pre-fertile';
  }, [currentCycle, today, periodLength]);

  const statusLabel: Record<string, { en: string; ar: string }> = {
    period: { en: 'You\u2019re on your period today', ar: '\u0623\u0646\u062a \u0641\u064a \u0641\u062a\u0631\u0629 \u0627\u0644\u062f\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064a\u0629 \u0627\u0644\u064a\u0648\u0645' },
    fertile: { en: 'You\u2019re in your fertile window today', ar: '\u0623\u0646\u062a \u0641\u064a \u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062e\u0635\u0648\u0628\u0629 \u0627\u0644\u064a\u0648\u0645' },
    ovulation: { en: 'Today is your estimated peak ovulation day', ar: '\u0627\u0644\u064a\u0648\u0645 \u0647\u0648 \u064a\u0648\u0645 \u0630\u0631\u0648\u0629 \u0627\u0644\u062a\u0628\u0648\u064a\u0636 \u0627\u0644\u0645\u0642\u062f\u0631' },
    'post-ovulation': { en: 'You\u2019re past ovulation for this cycle', ar: '\u062a\u062c\u0627\u0648\u0632\u062a \u0627\u0644\u062a\u0628\u0648\u064a\u0636 \u0644\u0647\u0630\u0647 \u0627\u0644\u062f\u0648\u0631\u0629' },
    'pre-fertile': { en: 'You\u2019re before your fertile window this cycle', ar: '\u0623\u0646\u062a \u0642\u0628\u0644 \u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062e\u0635\u0648\u0628\u0629 \u0644\u0647\u0630\u0647 \u0627\u0644\u062f\u0648\u0631\u0629' },
  };

  const months = useMemo(() => {
    const list: { year: number; month: number }[] = [];
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let i = 0; i < monthsToShow; i++) {
      const m = new Date(start.getFullYear(), start.getMonth() + i, 1);
      list.push({ year: m.getFullYear(), month: m.getMonth() });
    }
    return list;
  }, [today, monthsToShow]);

  function copyResults() {
    if (!currentCycle) return;
    const lines = [
      `${isAr ? '\u0627\u0644\u062a\u0628\u0648\u064a\u0636 \u0627\u0644\u062a\u0627\u0644\u064a' : 'Next ovulation'}: ${formatDateShort(currentCycle.ovulationDay)}`,
      `${isAr ? '\u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062e\u0635\u0648\u0628\u0629' : 'Fertile window'}: ${formatDateRange(currentCycle.fertileStart, currentCycle.fertileEnd)}`,
      `${isAr ? '\u0627\u0644\u062f\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064a\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629' : 'Next period'}: ${formatDateShort(currentCycle.nextPeriodStart)}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          {isAr ? '\u062d\u0627\u0633\u0628\u0629 \u0627\u0644\u062a\u0628\u0648\u064a\u0636 (\u062c\u0646\u0648\u0628 \u0623\u0641\u0631\u064a\u0642\u064a\u0627)' : 'Ovulation Calculator (South Africa)'}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {isAr
            ? '\u0642\u062f\u0631 \u064a\u0648\u0645 \u0627\u0644\u062a\u0628\u0648\u064a\u0636 \u0648\u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062e\u0635\u0648\u0628\u0629 \u0627\u0644\u062e\u0627\u0635\u0629 \u0628\u0643 \u0628\u0646\u0627\u0621\u064b \u0639\u0644\u0649 \u0622\u062e\u0631 \u062f\u0648\u0631\u0629 \u0634\u0647\u0631\u064a\u0629 \u0648\u0637\u0648\u0644 \u062f\u0648\u0631\u062a\u0643.'
            : 'Estimate your ovulation day and fertile window from your last period and average cycle length.'}
        </p>
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label htmlFor="lmp" className="block text-sm font-medium text-gray-700">
            {isAr ? '\u0623\u0648\u0644 \u064a\u0648\u0645 \u0645\u0646 \u0622\u062e\u0631 \u062f\u0648\u0631\u0629 \u0634\u0647\u0631\u064a\u0629' : 'First day of your last menstrual period (LMP)'}
          </label>
          <input
            id="lmp"
            type="date"
            value={lmpInput}
            onChange={(e) => setLmpInput(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label htmlFor="cycle-length" className="block text-sm font-medium text-gray-700">
            {isAr ? '\u0645\u062a\u0648\u0633\u0637 \u0637\u0648\u0644 \u0627\u0644\u062f\u0648\u0631\u0629 (\u0628\u0627\u0644\u0623\u064a\u0627\u0645)' : 'Average cycle length (days)'}
          </label>
          <input
            id="cycle-length"
            type="number"
            min={21}
            max={45}
            value={cycleLength}
            onChange={(e) => setCycleLength(Number(e.target.value) || 28)}
            className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          {cycleOutOfCommonRange && (
            <p className="mt-1 text-xs text-amber-600">
              {isAr
                ? '\u0637\u0648\u0644 \u0627\u0644\u062f\u0648\u0631\u0629 \u062e\u0627\u0631\u062c \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0639\u062a\u0627\u062f (21-35 \u064a\u0648\u0645\u064b\u0627) \u2014 \u0642\u062f \u062a\u0643\u0648\u0646 \u0627\u0644\u0646\u062a\u0627\u0626\u062c \u0623\u0642\u0644 \u062f\u0642\u0629.'
                : 'Cycle length outside the usual 21\u201335 day range \u2014 results may be less accurate.'}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs font-medium text-indigo-600"
        >
          {showAdvanced ? (isAr ? '\u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a \u0627\u0644\u0645\u062a\u0642\u062f\u0645\u0629' : 'Hide advanced options') : (isAr ? '\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a \u0627\u0644\u0645\u062a\u0642\u062f\u0645\u0629' : 'Show advanced options')}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="period-length" className="block text-sm font-medium text-gray-700">
                {isAr ? '\u0637\u0648\u0644 \u0641\u062a\u0631\u0629 \u0627\u0644\u062f\u0648\u0631\u0629' : 'Period length (days)'}
              </label>
              <input
                id="period-length"
                type="number"
                min={2}
                max={10}
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value) || 5)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="luteal" className="block text-sm font-medium text-gray-700">
                {isAr ? '\u0637\u0648\u0644 \u0627\u0644\u0637\u0648\u0631 \u0627\u0644\u0623\u0635\u0641\u0631' : 'Luteal-phase length (days)'}
              </label>
              <input
                id="luteal"
                type="number"
                min={10}
                max={16}
                value={lutealPhase}
                onChange={(e) => setLutealPhase(Number(e.target.value) || 14)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {currentCycle && !error && (
        <div className="rounded-xl bg-indigo-50 p-6 space-y-4">
          {todayStatus && (
            <p className="text-sm font-medium text-indigo-800">{isAr ? statusLabel[todayStatus].ar : statusLabel[todayStatus].en}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-700">{isAr ? '\u0627\u0644\u062a\u0628\u0648\u064a\u0636 \u0627\u0644\u062a\u0627\u0644\u064a' : 'Next ovulation'}</p>
              <p className="text-lg font-semibold text-gray-900">{formatDateShort(currentCycle.ovulationDay)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-700">{isAr ? '\u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062e\u0635\u0648\u0628\u0629' : 'Fertile window'}</p>
              <p className="text-lg font-semibold text-gray-900">{formatDateRange(currentCycle.fertileStart, currentCycle.fertileEnd)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-700">{isAr ? '\u0627\u0644\u062f\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064a\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629' : 'Next period start'}</p>
              <p className="text-sm text-gray-900">{formatDateShort(currentCycle.nextPeriodStart)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-700">
                {isAr ? '\u0627\u0644\u0645\u0648\u0639\u062f \u0627\u0644\u0645\u062a\u0648\u0642\u0639 \u0625\u0630\u0627 \u062d\u0645\u0644\u062a \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0646\u0627\u0641\u0630\u0629' : 'Est. due date if you conceive this window'}
              </p>
              <p className="text-sm text-gray-900">{formatDateShort(currentCycle.dueDateIfConceived)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={copyResults}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            {isAr ? '\u0646\u0633\u062e \u0627\u0644\u0646\u062a\u0627\u0626\u062c' : 'Copy results'}
          </button>
        </div>
      )}

      {/* Calendar */}
      {cycles.length > 0 && !error && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">
              {isAr ? '\u0627\u0644\u062a\u0642\u0648\u064a\u0645' : 'Calendar'}
            </h3>
            <select
              value={monthsToShow}
              onChange={(e) => setMonthsToShow(Number(e.target.value) as 1 | 2 | 3)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
            >
              <option value={1}>1 {isAr ? '\u0634\u0647\u0631' : 'month'}</option>
              <option value={2}>2 {isAr ? '\u0623\u0634\u0647\u0631' : 'months'}</option>
              <option value={3}>3 {isAr ? '\u0623\u0634\u0647\u0631' : 'months'}</option>
            </select>
          </div>

          <div className="space-y-6">
            {months.map(({ year, month }) => (
              <div key={`${year}-${month}`}>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {new Date(year, month, 1).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                </p>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 mb-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {buildMonthGrid(year, month).map((cell, i) => {
                    if (!cell.date) return <div key={i} />;
                    const type = classifyDay(cell.date, cycles, periodLength);
                    const isToday = isSameDay(cell.date, today);
                    const bg = type === 'period' ? 'bg-red-200' : type === 'ovulation' ? 'bg-indigo-500 text-white' : type === 'fertile' ? 'bg-green-200' : 'bg-gray-50';
                    return (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center rounded text-xs ${bg} ${isToday ? 'ring-2 ring-gray-900' : ''}`}
                      >
                        {cell.date.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {LEGEND.map((l) => (
              <div key={l.type} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={`w-3 h-3 rounded ${l.color}`} />
                {isAr ? l.ar : l.en}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Method explanation */}
      {currentCycle && !error && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            {isAr ? '\u0627\u0644\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0629' : 'How this is calculated'}
          </h3>
          <p className="text-xs text-gray-600">
            {isAr
              ? '\u0646\u0636\u064a\u0641 \u0637\u0648\u0644 \u062f\u0648\u0631\u062a\u0643 \u0625\u0644\u0649 \u0623\u0648\u0644 \u064a\u0648\u0645 \u0645\u0646 \u0622\u062e\u0631 \u062f\u0648\u0631\u0629 \u0634\u0647\u0631\u064a\u0629 \u0644\u062a\u062d\u062f\u064a\u062f \u0628\u062f\u0627\u064a\u0629 \u062f\u0648\u0631\u062a\u0643 \u0627\u0644\u062a\u0627\u0644\u064a\u0629. \u064a\u0648\u0645 \u0627\u0644\u062a\u0628\u0648\u064a\u0636 \u0647\u0648 14 \u064a\u0648\u0645\u064b\u0627 \u0642\u0628\u0644 \u062a\u0644\u0643 \u0627\u0644\u0628\u062f\u0627\u064a\u0629. \u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062e\u0635\u0648\u0628\u0629 \u0647\u064a \u0627\u0644\u0623\u064a\u0627\u0645 \u0627\u0644\u062e\u0645\u0633\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629 \u0644\u0644\u062a\u0628\u0648\u064a\u0636 \u0628\u0627\u0644\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u064a\u0648\u0645 \u0627\u0644\u062a\u0628\u0648\u064a\u0636 \u0646\u0641\u0633\u0647.'
              : 'We add your average cycle length to the first day of your last period to estimate your next period. Ovulation is placed 14 days before that (the standard luteal-phase length). Your fertile window is the 5 days before ovulation, plus ovulation day itself.'}
          </p>
        </div>
      )}

      {/* Disclaimer — must be visible without scrolling on mobile */}
      <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
        <p className="text-xs text-amber-800 leading-relaxed">
          {isAr
            ? '\u0647\u0630\u0627 \u062a\u0642\u062f\u064a\u0631 \u062a\u0639\u0644\u064a\u0645\u064a \u0641\u0642\u0637 \u0648\u0644\u064a\u0633 \u0646\u0635\u064a\u062d\u0629 \u0637\u0628\u064a\u0629. \u0644\u064a\u0633\u062a \u0637\u0631\u064a\u0642\u0629 \u0645\u0648\u062b\u0648\u0642\u0629 \u0644\u0645\u0646\u0639 \u0627\u0644\u062d\u0645\u0644. \u062a\u062e\u062a\u0644\u0641 \u0627\u0644\u062f\u0648\u0631\u0627\u062a \u0627\u0644\u0641\u0631\u062f\u064a\u0629. \u0625\u0630\u0627 \u0643\u0646\u062a \u062a\u062d\u0627\u0648\u0644\u064a\u0646 \u0627\u0644\u062d\u0645\u0644\u060c \u0623\u0648 \u0644\u062f\u064a\u0643 \u062f\u0648\u0631\u0627\u062a \u063a\u064a\u0631 \u0645\u0646\u062a\u0638\u0645\u0629\u060c \u0623\u0648 \u0623\u064a \u0645\u062e\u0627\u0648\u0641 \u0635\u062d\u064a\u0629\u060c \u064a\u0631\u062c\u0649 \u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0637\u0628\u064a\u0628 \u0623\u0648 \u0623\u062e\u0635\u0627\u0626\u064a \u0623\u0645\u0631\u0627\u0636 \u0646\u0633\u0627\u0621 \u0623\u0648 \u0639\u064a\u0627\u062f\u0629 \u062e\u0635\u0648\u0628\u0629 \u0641\u064a \u062c\u0646\u0648\u0628 \u0623\u0641\u0631\u064a\u0642\u064a\u0627. \u064a\u0639\u062a\u0645\u062f \u0639\u0644\u0649 \u0627\u0644\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062a\u0642\u0648\u064a\u0645\u064a\u0629 \u0627\u0644\u0642\u064a\u0627\u0633\u064a\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u0629 \u0641\u064a \u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u062e\u0635\u0648\u0628\u0629 \u0627\u0644\u062c\u0646\u0648\u0628 \u0623\u0641\u0631\u064a\u0642\u064a\u0629.'
            : 'This is an educational estimate only and is not medical advice. It is not a reliable method of contraception. Individual cycles vary. If you are trying to conceive, have irregular periods, or have any health concerns, please consult a doctor, gynaecologist or fertility clinic in South Africa. Based on the standard calendar method used by South African fertility resources.'}
        </p>
      </div>
    </div>
  );
}
