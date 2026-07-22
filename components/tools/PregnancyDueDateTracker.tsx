'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * PregnancyDueDateTracker
 *
 * Pure client-side calculator. No SEO responsibility, no schema markup,
 * no registry imports — the parent server component (page.tsx) owns all of that.
 *
 * Receives only { locale } per the site's tool-component contract. The site is
 * Nigeria-only, English-only (no Arabic content, no country variants), so
 * `locale` is accepted for prop-shape consistency with every other tool
 * component but is not branched on for content.
 */

type Trimester = 1 | 2 | 3;

interface WeekInfo {
  week: number;
  trimester: Trimester;
  title: string;
  note: string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function diffInDays(a: Date, b: Date): number {
  // whole days between two dates, ignoring time-of-day drift
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((aMid.getTime() - bMid.getTime()) / MS_PER_DAY);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

// Compact week-by-week milestone data (generic, evidence-based, non-diagnostic).
const WEEK_TIMELINE: WeekInfo[] = [
  { week: 4, trimester: 1, title: 'Implantation', note: 'The fertilised egg implants in the uterine lining; a home pregnancy test can usually detect the pregnancy around now.' },
  { week: 6, trimester: 1, title: 'Heartbeat begins', note: 'The neural tube and early heart structures are forming; a heartbeat may be visible on an early ultrasound.' },
  { week: 8, trimester: 1, title: 'Organ formation', note: 'Major organs are starting to develop. Morning sickness and fatigue are common in this window.' },
  { week: 10, trimester: 1, title: 'Fetal stage begins', note: 'The embryo is now referred to as a fetus. Facial features continue to take shape.' },
  { week: 12, trimester: 1, title: 'End of first trimester', note: 'Miscarriage risk drops significantly after this point. A dating or nuchal scan is often done around now.' },
  { week: 16, trimester: 2, title: 'Growth spurt', note: 'The skeleton is hardening and the placenta is fully functional.' },
  { week: 20, trimester: 2, title: 'Anomaly scan / quickening', note: 'Many women feel the baby move for the first time. The mid-pregnancy anomaly scan is typically booked around now.' },
  { week: 24, trimester: 2, title: 'Viability milestone', note: 'The baby reaches a stage where survival outside the womb becomes possible with intensive neonatal care, though risks remain high.' },
  { week: 28, trimester: 3, title: 'Third trimester begins', note: 'Eyes can open and close. Iron and folic acid needs increase — keep up antenatal supplementation.' },
  { week: 32, trimester: 3, title: 'Rapid weight gain', note: 'Bones finish hardening except the skull, which stays soft for delivery.' },
  { week: 36, trimester: 3, title: 'Considered early term soon', note: 'The baby is likely head-down in preparation for birth. Weekly antenatal visits often start now.' },
  { week: 38, trimester: 3, title: 'Full term approaches', note: 'Lungs continue maturing. Labour could start any time from here.' },
  { week: 40, trimester: 3, title: 'Estimated due date', note: 'Only around 5 in 100 babies arrive exactly on the estimated due date — anywhere from 37 to 42 weeks is considered normal.' },
];

function trimesterOf(week: number): Trimester {
  if (week <= 12) return 1;
  if (week <= 26) return 2;
  return 3;
}

export default function PregnancyDueDateTracker({ locale }: { locale: string }) {
  const [lmpInput, setLmpInput] = useState('');
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [today, setToday] = useState<Date>(new Date());

  // Keep "today" fresh if the tab is left open across midnight.
  useEffect(() => {
    const id = setInterval(() => setToday(new Date()), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const lmpDate = useMemo(() => parseDateInput(lmpInput), [lmpInput]);

  const results = useMemo(() => {
    setError(null);
    setWarning(null);

    if (!lmpDate) return null;

    if (lmpDate.getTime() > today.getTime()) {
      setError('The first day of your last period can\u2019t be in the future. Please check the date.');
      return null;
    }

    if (cycleLength < 21 || cycleLength > 35) {
      setWarning('Cycle lengths are usually between 21 and 35 days. The estimate below still uses the number you entered, but double-check it.');
    }

    // Naegele's Rule: LMP + 280 days, adjusted for a cycle that isn't 28 days.
    const cycleAdjustment = cycleLength - 28;
    const edd = addDays(lmpDate, 280 + cycleAdjustment);
    const conceptionEstimate = addDays(lmpDate, 14 + cycleAdjustment);

    const gaDays = diffInDays(today, lmpDate);
    const gaWeeks = Math.floor(gaDays / 7);
    const gaRemainderDays = gaDays % 7;

    const daysToEdd = diffInDays(edd, today);
    const isPostTerm = gaWeeks > 42;
    const progressPercent = Math.min(100, Math.max(0, (gaDays / 280) * 100));

    const currentWeekInfo = trimesterOf(gaWeeks);

    return {
      edd,
      conceptionEstimate,
      gaWeeks,
      gaRemainderDays,
      gaDays,
      daysToEdd,
      isPostTerm,
      progressPercent,
      currentTrimester: currentWeekInfo,
    };
  }, [lmpDate, cycleLength, today]);

  const handleReset = () => {
    setLmpInput('');
    setCycleLength(28);
    setError(null);
    setWarning(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Pregnancy Due Date &amp; Gestational Age Tracker
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Estimate your due date and track your pregnancy week by week using your last
          menstrual period (LMP), based on Naegele&rsquo;s Rule.
        </p>
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label htmlFor="lmp-date" className="block text-sm font-medium text-gray-700">
            First day of your last menstrual period (LMP)
          </label>
          <input
            id="lmp-date"
            type="date"
            value={lmpInput}
            onChange={(e) => setLmpInput(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            aria-describedby="lmp-help"
          />
          <p id="lmp-help" className="mt-1 text-xs text-gray-500">
            Not sure of the exact date? An ultrasound dating scan gives a more accurate estimate,
            especially for irregular cycles.
          </p>
        </div>

        <div>
          <label htmlFor="cycle-length" className="block text-sm font-medium text-gray-700">
            Average menstrual cycle length (days)
          </label>
          <input
            id="cycle-length"
            type="number"
            min={15}
            max={45}
            value={cycleLength}
            onChange={(e) => setCycleLength(Number(e.target.value) || 28)}
            className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <span className="ml-2 text-xs text-gray-500">Default: 28 days</span>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {!error && warning && (
          <p role="status" className="text-sm text-amber-600">
            {warning}
          </p>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Reset
        </button>
      </div>

      {/* Results */}
      {results && !error && (
        <div className="rounded-xl bg-indigo-50 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-700">Estimated due date</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(results.edd)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-700">Gestational age today</p>
              <p className="text-lg font-semibold text-gray-900">
                {results.gaWeeks} weeks, {results.gaRemainderDays} day
                {results.gaRemainderDays === 1 ? '' : 's'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-700">Estimated conception date</p>
              <p className="text-sm text-gray-900">{formatDate(results.conceptionEstimate)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-700">Current trimester</p>
              <p className="text-sm text-gray-900">
                {results.currentTrimester === 1 ? 'First' : results.currentTrimester === 2 ? 'Second' : 'Third'} trimester
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-800 mb-1">
              {results.daysToEdd >= 0
                ? `${results.daysToEdd} day${results.daysToEdd === 1 ? '' : 's'} to your estimated due date`
                : `${Math.abs(results.daysToEdd)} day${Math.abs(results.daysToEdd) === 1 ? '' : 's'} past your estimated due date`}
            </p>
            <div className="w-full h-3 rounded-full bg-indigo-100 overflow-hidden">
              <div
                className="h-full bg-indigo-500"
                style={{ width: `${results.progressPercent.toFixed(1)}%` }}
                role="progressbar"
                aria-valuenow={Math.round(results.progressPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {results.isPostTerm && (
            <p className="text-sm font-medium text-red-700">
              You&rsquo;re past 42 weeks by this estimate. Please see a doctor or midwife promptly —
              pregnancies beyond 42 weeks need closer monitoring.
            </p>
          )}
        </div>
      )}

      {/* Weekly timeline */}
      {results && !error && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Week-by-week timeline</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {WEEK_TIMELINE.map((w) => {
              const isCurrent = results.gaWeeks >= w.week && results.gaWeeks < w.week + 4;
              return (
                <div
                  key={w.week}
                  className={`rounded-lg p-3 border ${
                    isCurrent ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    Week {w.week} — {w.title}
                    {isCurrent && (
                      <span className="ml-2 text-xs font-normal text-indigo-600">(around now)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{w.note}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Nigerian antenatal care (ANC) reminders</p>
            <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5">
              <li>Register for antenatal care as early as possible and keep to your scheduled visits.</li>
              <li>Take iron and folic acid supplements as advised at your ANC clinic.</li>
              <li>Sleep under a long-lasting insecticidal net (LLIN) and complete intermittent preventive
                treatment for malaria in pregnancy (IPTp) as scheduled.</li>
              <li>Keep your tetanus toxoid vaccination up to date.</li>
              <li>Seek care immediately for danger signs: severe headache, blurred vision, heavy bleeding,
                reduced fetal movement, or severe abdominal pain.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center px-2">
        This tool gives an educational estimate only and is not a substitute for professional medical
        care. It is not a NAFDAC-regulated diagnostic device. Confirm your due date with an ultrasound
        scan and a qualified Nigerian healthcare provider at your antenatal clinic. Only about 5% of
        babies are born exactly on their estimated due date — most arrive between 37 and 42 weeks.
      </p>
    </div>
  );
}
