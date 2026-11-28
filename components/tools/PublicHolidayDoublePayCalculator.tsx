'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Kenya overtime, rest day and public holiday pay calculator.
 * Regulation of Wages (General) Order, 1982 and Employment Act 2007:
 * weekday overtime 1.5x the hourly rate; work on a rest day or gazetted
 * public holiday at least 2x. Hourly rate = monthly pay / hours per month
 * (52 hours a week x 4 = 208 by default, editable).
 */

export default function PublicHolidayDoublePayCalculator({ locale }: { locale: string }) {
  void locale;
  const [monthly, setMonthly] = useState('30000');
  const [hoursPerMonth, setHoursPerMonth] = useState('208');
  const [otHours, setOtHours] = useState('10');
  const [restHours, setRestHours] = useState('0');
  const [holidayHours, setHolidayHours] = useState('8');
  const [otMult, setOtMult] = useState('1.5');
  const [holMult, setHolMult] = useState('2');

  const r = useMemo(() => {
    const hpm = Math.max(1, toNum(hoursPerMonth, 208));
    const hourly = toNum(monthly) / hpm;
    const ot = hourly * toNum(otMult) * toNum(otHours);
    const rest = hourly * toNum(holMult) * toNum(restHours);
    const hol = hourly * toNum(holMult) * toNum(holidayHours);
    return { hourly, ot, rest, hol, total: ot + rest + hol, holExtra: hol - hourly * toNum(holidayHours) };
  }, [monthly, hoursPerMonth, otHours, restHours, holidayHours, otMult, holMult]);

  const k = (n: number) => fmt(n, 'KES ', 0);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field id="hp-m" label="Monthly pay (KES)" value={monthly} onChange={setMonthly} step="1000" />
          <Field id="hp-h" label="Hours per month" value={hoursPerMonth} onChange={setHoursPerMonth} hint="52 hrs x 4 weeks = 208" />
          <Field id="hp-ot" label="Weekday overtime hours" value={otHours} onChange={setOtHours} step="0.5" />
          <Field id="hp-rest" label="Hours on a rest day" value={restHours} onChange={setRestHours} step="0.5" />
          <Field id="hp-hol" label="Hours on a public holiday" value={holidayHours} onChange={setHolidayHours} step="0.5" />
          <Field id="hp-om" label="Overtime multiplier" value={otMult} onChange={setOtMult} step="0.1" />
          <Field id="hp-hm" label="Rest day / holiday multiplier" value={holMult} onChange={setHolMult} step="0.1" />
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Normal hourly rate" value={k(r.hourly)} />
          <Stat label="Total extra pay" value={k(r.total)} tone="good" />
          <Stat label="Weekday overtime" value={k(r.ot)} />
          <Stat label="Public holiday work" value={k(r.hol)} />
          <Stat label="Rest day work" value={k(r.rest)} />
          <Stat label="Holiday pay above normal" value={k(r.holExtra)} />
        </div>
        <Note>
          Under the Regulation of Wages (General) Order and the Employment Act, overtime on normal working days is paid at 1.5 times the hourly rate, and work on a rest day or public
          holiday at twice the hourly rate. The Order covers certain employees, and contracts or collective agreements can give more. Your normal pay for a public holiday is paid regardless, so the extra shown is
          the premium above normal. Estimates only.
        </Note>
      </Card>
    </div>
  );
}
