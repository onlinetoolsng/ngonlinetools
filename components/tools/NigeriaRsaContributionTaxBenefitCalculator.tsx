'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';
import { ngPayeOnAnnual, ngMarginalRate } from '@/lib/calculators/ngPaye';

/**
 * RSA Contribution & Tax Benefit Calculator (Nigeria)
 * Pension Reform Act 2014: minimum 8% employee + 10% employer of monthly
 * emoluments (basic + housing + transport). Employee contributions are
 * deductible before PAYE (Nigeria Tax Act 2025 bands in lib/calculators/ngPaye).
 */

const EMPLOYEE_MIN = 8;
const EMPLOYER_MIN = 10;

export default function NigeriaRsaContributionTaxBenefitCalculator({ locale }: { locale: string }) {
  void locale;
  const [basic, setBasic] = useState('250000');
  const [housing, setHousing] = useState('100000');
  const [transport, setTransport] = useState('75000');
  const [otherGross, setOtherGross] = useState('75000');
  const [empRate, setEmpRate] = useState(String(EMPLOYEE_MIN));
  const [erRate, setErRate] = useState(String(EMPLOYER_MIN));
  const [voluntary, setVoluntary] = useState('0');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [years, setYears] = useState('25');
  const [growth, setGrowth] = useState('12');
  const [raise, setRaise] = useState('8');

  const r = useMemo(() => {
    const em = toNum(basic) + toNum(housing) + toNum(transport);
    const grossMonthly = em + toNum(otherGross);
    const ee = em * (Math.max(EMPLOYEE_MIN, toNum(empRate)) / 100);
    const er = em * (Math.max(EMPLOYER_MIN, toNum(erRate)) / 100);
    const vol = toNum(voluntary);
    const annualGross = grossMonthly * 12;
    const annualEe = (ee + vol) * 12;
    const taxNoPension = ngPayeOnAnnual(annualGross);
    const taxWithPension = ngPayeOnAnnual(Math.max(0, annualGross - annualEe));
    const saved = taxNoPension - taxWithPension;
    const marginal = ngMarginalRate(Math.max(0, annualGross - annualEe));

    // Projection: monthly contributions grow with salary raises, compounded monthly.
    const n = Math.max(0, Math.floor(toNum(years))) * 12;
    const mRate = Math.pow(1 + toNum(growth) / 100, 1 / 12) - 1;
    const mRaise = Math.pow(1 + toNum(raise) / 100, 1 / 12) - 1;
    let bal = toNum(openingBalance);
    let contrib = ee + er + vol;
    let totalIn = 0;
    for (let m = 1; m <= n; m++) {
      bal = bal * (1 + mRate) + contrib;
      totalIn += contrib;
      contrib *= 1 + mRaise;
    }
    return { em, ee, er, vol, saved, marginal, bal, totalIn, growthEarned: bal - toNum(openingBalance) - totalIn, annualEe };
  }, [basic, housing, transport, otherGross, empRate, erRate, voluntary, openingBalance, years, growth, raise]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card title="Monthly pay">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="rsa-basic" label="Basic salary (₦)" value={basic} onChange={setBasic} step="1000" />
          <Field id="rsa-housing" label="Housing allowance (₦)" value={housing} onChange={setHousing} step="1000" />
          <Field id="rsa-transport" label="Transport allowance (₦)" value={transport} onChange={setTransport} step="1000" />
          <Field id="rsa-other" label="Other taxable pay (₦)" value={otherGross} onChange={setOtherGross} step="1000" hint="Not pensionable" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field id="rsa-ee" label="Employee rate (%)" value={empRate} onChange={setEmpRate} step="0.5" hint="Minimum 8%" />
          <Field id="rsa-er" label="Employer rate (%)" value={erRate} onChange={setErRate} step="0.5" hint="Minimum 10%" />
          <Field id="rsa-vol" label="Voluntary per month (₦)" value={voluntary} onChange={setVoluntary} step="1000" />
        </div>
      </Card>

      <Card title="Each month">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="You pay" value={fmt(r.ee + r.vol)} />
          <Stat label="Employer pays" value={fmt(r.er)} />
          <Stat label="Into your RSA" value={fmt(r.ee + r.er + r.vol)} tone="good" />
          <Stat label="PAYE saved per year" value={fmt(r.saved)} tone="good" />
        </div>
        <p className="text-sm text-gray-600">
          Pensionable pay (basic + housing + transport) is {fmt(r.em)} a month. Your {fmt(r.annualEe)} of yearly
          contributions comes off your taxable income before PAYE. Your top tax rate after the deduction is{' '}
          {(r.marginal * 100).toFixed(0)}%.
        </p>
      </Card>

      <Card title="Projected RSA balance">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Field id="rsa-open" label="Current RSA balance (₦)" value={openingBalance} onChange={setOpeningBalance} step="10000" />
          <Field id="rsa-years" label="Years to retirement" value={years} onChange={setYears} />
          <Field id="rsa-growth" label="Annual return (%)" value={growth} onChange={setGrowth} step="0.5" />
          <Field id="rsa-raise" label="Yearly pay rise (%)" value={raise} onChange={setRaise} step="0.5" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Balance at retirement" value={fmt(r.bal)} tone="good" />
          <Stat label="Contributions paid in" value={fmt(r.totalIn)} />
        </div>
        <Note>
          The return and pay rise are your own assumptions, not guarantees. Fund returns vary by year and fund type.
          The model is nominal, so it does not adjust for inflation. Contribution minimums follow the Pension Reform Act 2014
          and tax follows the Nigeria Tax Act 2025 bands. Estimates only.
        </Note>
      </Card>
    </div>
  );
}
