'use client';

import { useEffect, useMemo, useState } from 'react';
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput';

/**
 * SouthAfricaPregnancyDueDateCalculator
 *
 * Pure client-side calculator. No SEO responsibility, no schema markup,
 * no registry imports — the parent server component (page.tsx) owns all of that.
 *
 * Estimation method (Naegele's Rule: LMP + 280 days) matches South African
 * National Department of Health maternity guidelines and standard obstetric
 * practice used by Mediclinic, Marie Stopes SA and similar providers. Adds
 * SA-specific value the generic version doesn't need: an ovulation/fertile
 * window for the input cycle, explicit trimester date ranges, and a BCEA
 * maternity-leave planning tie-in (South Africa's Basic Conditions of
 * Employment Act, not Nigerian labour law).
 */

type Trimester = 1 | 2 | 3;
type Mode = 'lmp' | 'conception';

interface WeekInfo {
  week: number;
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
  const aMid = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((aMid.getTime() - bMid.getTime()) / MS_PER_DAY);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatRand(value: number) {
  if (!Number.isFinite(value)) return 'R0';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(Math.max(0, value));
}

// Compact week-by-week milestone data (generic, evidence-based, non-diagnostic).
const WEEK_TIMELINE: WeekInfo[] = [
  { week: 4, title: 'Implantation', note: 'The fertilised egg implants in the uterine lining; a home pregnancy test can usually detect the pregnancy around now.' },
  { week: 6, title: 'Heartbeat begins', note: 'The neural tube and early heart structures are forming; a heartbeat may be visible on an early ultrasound.' },
  { week: 8, title: 'Organ formation', note: 'Major organs are starting to develop. Morning sickness and fatigue are common in this window.' },
  { week: 12, title: 'NT scan window opens (11–13+6 weeks)', note: 'The nuchal translucency (NT) scan window runs 11 weeks to 13 weeks 6 days — book this with your provider if you want first-trimester screening.' },
  { week: 16, title: 'Growth spurt', note: 'The skeleton is hardening and the placenta is fully functional.' },
  { week: 20, title: 'Anatomy scan window (18–22 weeks)', note: 'The mid-pregnancy anatomy scan is typically booked in the 18–22 week window. Many women also feel the baby move for the first time around now.' },
  { week: 24, title: 'Viability milestone', note: 'The baby reaches a stage where survival outside the womb becomes possible with intensive neonatal care, though risks remain high.' },
  { week: 28, title: 'Third trimester begins', note: 'Eyes can open and close. Iron and folate needs increase — keep up antenatal supplementation.' },
  { week: 32, title: 'Rapid weight gain', note: 'Bones finish hardening except the skull, which stays soft for delivery.' },
  { week: 36, title: 'Maternity leave often starts around now', note: 'BCEA maternity leave can begin up to 4 weeks before your due date — many women start leave in this window.' },
  { week: 38, title: 'Full term approaches', note: 'Lungs continue maturing. Labour could start any time from here.' },
  { week: 40, title: 'Estimated due date', note: 'Only around 5 in 100 babies arrive exactly on the estimated due date — anywhere from 37 to 42 weeks is considered normal.' },
];

export default function SouthAfricaPregnancyDueDateCalculator(_props: { locale: string }) {
  const [mode, setMode] = useState<Mode>('lmp');
  const [lmpInput, setLmpInput] = useState('');
  const [conceptionInput, setConceptionInput] = useState('');
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [irregularCycles, setIrregularCycles] = useState(false);
  const [monthlySalary, setMonthlySalary] = useState('');
  const [today, setToday] = useState<Date>(new Date());

  // Keep "today" fresh if the tab is left open across midnight.
  useEffect(() => {
    const id = setInterval(() => setToday(new Date()), 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const lmpDate = useMemo(() => {
    if (mode === 'conception') {
      const c = parseDateInput(conceptionInput);
      return c ? addDays(c, -14) : null;
    }
    return parseDateInput(lmpInput);
  }, [mode, lmpInput, conceptionInput]);

  const salary = parseFloat(monthlySalary) || 0;

  const error = useMemo(() => {
    if (!lmpDate) return null;
    if (lmpDate.getTime() > today.getTime()) {
      return mode === 'conception'
        ? 'Your conception date can\u2019t be in the future. Please check the date.'
        : 'The first day of your last period can\u2019t be in the future. Please check the date.';
    }
    return null;
  }, [lmpDate, today, mode]);

  const results = useMemo(() => {
    if (!lmpDate || error) return null;

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

    // Ovulation / fertile window for this cycle.
    const ovulationDay = addDays(lmpDate, cycleLength - 14);
    const fertileStart = addDays(ovulationDay, -5);
    const fertileEnd = addDays(ovulationDay, 1);

    // Trimester date ranges.
    const t1Start = lmpDate;
    const t1End = addDays(lmpDate, 12 * 7);
    const t2Start = t1End;
    const t2End = addDays(lmpDate, 28 * 7);
    const t3Start = t2End;
    const t3End = edd;

    const currentTrimester: Trimester = gaWeeks <= 12 ? 1 : gaWeeks <= 27 ? 2 : 3;

    // BCEA maternity leave (South Africa): can start up to 4 weeks before EDD;
    // 4 consecutive months total; 6 weeks mandatory post-birth unless certified fit.
    const leaveWindowStart = addDays(edd, -28);
    const leaveEnd = addDays(edd, 121); // ~4 consecutive months from EDD as a planning estimate
    const postBirthMandatoryEnd = addDays(edd, 42);

    // Illustrative UIF estimate only — actual benefit follows a sliding scale
    // and maximum threshold set by the UIF, not a flat 66%.
    const illustrativeUifMonthly = salary > 0 ? salary * 0.66 : null;

    return {
      edd, conceptionEstimate, gaWeeks, gaRemainderDays, gaDays, daysToEdd, isPostTerm, progressPercent,
      ovulationDay, fertileStart, fertileEnd,
      t1Start, t1End, t2Start, t2End, t3Start, t3End, currentTrimester,
      leaveWindowStart, leaveEnd, postBirthMandatoryEnd, illustrativeUifMonthly,
    };
  }, [lmpDate, cycleLength, today, salary, error]);

  const handleReset = () => {
    setMode('lmp');
    setLmpInput('');
    setConceptionInput('');
    setCycleLength(28);
    setIrregularCycles(false);
    setMonthlySalary('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Pregnancy Due Date &amp; Ovulation Calculator (South Africa)
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Estimate your due date, fertile window and trimester dates using your last menstrual period (LMP)
          or conception date, based on Naegele&rsquo;s Rule.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setMode('lmp')}
          className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${mode === 'lmp' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
        >
          From Last Period
        </button>
        <button
          type="button"
          onClick={() => setMode('conception')}
          className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${mode === 'conception' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
        >
          From Conception Date
        </button>
      </div>

      {/* Inputs */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        {mode === 'lmp' ? (
          <>
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
                min={21}
                max={35}
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value) || 28)}
                className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <span className="ml-2 text-xs text-gray-500">Default: 28 days</span>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={irregularCycles}
                onChange={(e) => setIrregularCycles(e.target.checked)}
                className="rounded border-gray-300"
              />
              My cycles are irregular
            </label>
            {irregularCycles && (
              <p className="text-xs text-amber-600">
                With irregular cycles, LMP-based dating is less reliable — an ultrasound dating scan
                (ideally in the first trimester) will give a much more accurate due date than this estimate.
              </p>
            )}
          </>
        ) : (
          <div>
            <label htmlFor="conception-date" className="block text-sm font-medium text-gray-700">
              Estimated conception date
            </label>
            <input
              id="conception-date"
              type="date"
              value={conceptionInput}
              onChange={(e) => setConceptionInput(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <p className="mt-1 text-xs text-gray-500">Due date = conception date + 266 days.</p>
          </div>
        )}

        <div>
          <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
            Average monthly remuneration (optional — for an illustrative UIF estimate)
          </label>
          <input
            id="salary"
            type="text"
            inputMode="decimal"
            value={formatNumberInput(monthlySalary)}
            onChange={(e) => setMonthlySalary(cleanNumberInput(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            placeholder="e.g. 18,000"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
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
              <p className="text-xs uppercase tracking-wide text-indigo-700">Pregnant today</p>
              <p className="text-lg font-semibold text-gray-900">
                {results.gaWeeks} weeks, {results.gaRemainderDays} day{results.gaRemainderDays === 1 ? '' : 's'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-700">Estimated conception date</p>
              <p className="text-sm text-gray-900">{formatDateShort(results.conceptionEstimate)}</p>
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

          {mode === 'lmp' && (
            <div className="rounded-lg bg-white p-3 border border-indigo-100">
              <p className="text-xs font-medium text-gray-700 mb-1">Fertile window for this cycle</p>
              <p className="text-sm text-gray-900">
                {formatDateShort(results.fertileStart)} – {formatDateShort(results.fertileEnd)}
                <span className="text-xs text-gray-500 ml-1">(ovulation ~{formatDateShort(results.ovulationDay)})</span>
              </p>
            </div>
          )}

          <div className="rounded-lg bg-white p-3 border border-indigo-100 space-y-1.5">
            <p className="text-xs font-medium text-gray-700 mb-1">Trimester dates</p>
            <p className="text-sm text-gray-900">1st: {formatDateShort(results.t1Start)} – {formatDateShort(results.t1End)}</p>
            <p className="text-sm text-gray-900">2nd: {formatDateShort(results.t2Start)} – {formatDateShort(results.t2End)}</p>
            <p className="text-sm text-gray-900">3rd: {formatDateShort(results.t3Start)} – {formatDateShort(results.t3End)}</p>
          </div>

          {results.isPostTerm && (
            <p className="text-sm font-medium text-red-700">
              You&rsquo;re past 42 weeks by this estimate. Please see a doctor or midwife promptly —
              pregnancies beyond 42 weeks need closer monitoring.
            </p>
          )}
        </div>
      )}

      {/* Maternity leave (BCEA) planner */}
      {results && !error && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-2">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Maternity leave planner (BCEA)</h3>
          <p className="text-sm text-gray-700">
            Earliest leave can start: <span className="font-medium">{formatDateShort(results.leaveWindowStart)}</span> (4 weeks before your EDD)
          </p>
          <p className="text-sm text-gray-700">
            No work required until at least: <span className="font-medium">{formatDateShort(results.postBirthMandatoryEnd)}</span> (6 weeks after birth, unless certified fit to return earlier)
          </p>
          <p className="text-sm text-gray-700">
            Full 4-month leave period ends around: <span className="font-medium">{formatDateShort(results.leaveEnd)}</span> (~121 days from your EDD, if leave starts on your due date)
          </p>
          {results.illustrativeUifMonthly !== null && (
            <p className="text-xs text-gray-500 pt-1">
              Illustrative UIF estimate: roughly {formatRand(results.illustrativeUifMonthly)}/month (≈66% of the remuneration you entered).
              Your actual UIF maternity benefit follows the UIF&rsquo;s own sliding scale and maximum threshold, not a flat 66% —
              apply via labour.gov.za or your nearest Department of Employment and Labour office for your exact benefit.
            </p>
          )}
          <p className="text-xs text-gray-400 pt-1">
            Under the Basic Conditions of Employment Act (BCEA), maternity leave is 4 consecutive months, and may start any
            time from 4 weeks before the expected date of birth (or earlier if a medical practitioner or midwife certifies
            it&rsquo;s necessary for the employee&rsquo;s health or the unborn child&rsquo;s health). An employee may not work for 6 weeks
            after the birth unless certified fit to do so.
          </p>
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
                  className={`rounded-lg p-3 border ${isCurrent ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    Week {w.week} — {w.title}
                    {isCurrent && <span className="ml-2 text-xs font-normal text-indigo-600">(around now)</span>}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{w.note}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-700 mb-1">South African antenatal care reminders</p>
            <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5">
              <li>Book your first antenatal visit as early as possible at your clinic, midwife obstetric unit (MOU), or private provider.</li>
              <li>Discuss the NT scan (11–13+6 weeks) and anatomy scan (18–22 weeks) timing with your provider.</li>
              <li>Take iron and folic acid supplements as advised.</li>
              <li>Plan your BCEA maternity leave dates with your employer well ahead of your leave window.</li>
              <li>Seek care immediately for danger signs: severe headache, blurred vision, heavy bleeding, reduced fetal movement, or severe abdominal pain.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center px-2">
        This tool gives an educational estimate only and is not a substitute for professional medical
        care or an ultrasound dating scan, especially with irregular cycles. It is not a diagnostic
        device. Confirm your due date and the Termination of Pregnancy Act gestational-age windows that
        may apply with a qualified South African healthcare provider. Only about 5% of babies are born
        exactly on their estimated due date — most arrive between 37 and 42 weeks.
      </p>
    </div>
  );
}
