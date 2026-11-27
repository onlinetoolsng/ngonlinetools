'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';
import { ngPayeOnAnnual } from '@/lib/calculators/ngPaye';

/**
 * National Housing Fund (NHF) contribution calculator.
 * NHF is 2.5% of monthly basic salary under the National Housing Fund Act.
 * NHF contributions reduce taxable income (as the PAYE calculator on this site treats them).
 */

const RATE = 0.025;

export default function NigeriaNhfContributionCalculator({ locale }: { locale: string }) {
  void locale;
  const [basic, setBasic] = useState('250000');
  const [gross, setGross] = useState('600000');
  const [years, setYears] = useState('10');

  const r = useMemo(() => {
    const monthly = toNum(basic) * RATE;
    const yearly = monthly * 12;
    const annualGross = toNum(gross) * 12;
    const pension = toNum(basic) * 12 * 0.08; // simplified: 8% of basic
    const without = ngPayeOnAnnual(Math.max(0, annualGross - pension));
    const withNhf = ngPayeOnAnnual(Math.max(0, annualGross - pension - yearly));
    return { monthly, yearly, total: yearly * Math.max(0, Math.floor(toNum(years))), taxSaved: without - withNhf };
  }, [basic, gross, years]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field id="nhf-b" label="Monthly basic salary (₦)" value={basic} onChange={setBasic} step="5000" />
          <Field id="nhf-g" label="Monthly gross pay (₦)" value={gross} onChange={setGross} step="10000" hint="For the tax estimate" />
          <Field id="nhf-y" label="Years of contribution" value={years} onChange={setYears} />
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="NHF per month (2.5% of basic)" value={fmt(r.monthly)} tone="good" />
          <Stat label="NHF per year" value={fmt(r.yearly)} />
          <Stat label={`Contributed over ${toNum(years)} years`} value={fmt(r.total)} />
          <Stat label="PAYE saved per year" value={fmt(r.taxSaved)} />
        </div>
        <Note>
          NHF is 2.5% of monthly basic salary. The tax estimate uses the Nigeria Tax Act 2025 bands, with 8% pension on basic salary only, and treats NHF as a deduction from taxable
          income. Contributions are held by the Federal Mortgage Bank of Nigeria and are refundable under its rules, and contributors can apply for NHF mortgages. Check the
          current conditions with the FMBN. Estimates only.
        </Note>
      </Card>
    </div>
  );
}
