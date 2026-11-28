'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * NELFUND student loan eligibility checker (Nigeria).
 * Rules from NELFUND guidelines: Nigerian citizen with valid admission into an
 * eligible public tertiary institution; NIN, BVN and JAMB details; loan covers
 * institutional charges (paid to the school) and an optional N20,000 monthly
 * upkeep; repayment starts two years after NYSC at 10% of income.
 */

const UPKEEP = 20000;

export default function NigeriaNelfundEligibilityChecker({ locale }: { locale: string }) {
  void locale;
  const [citizen, setCitizen] = useState('yes');
  const [inst, setInst] = useState('public');
  const [admission, setAdmission] = useState('yes');
  const [nin, setNin] = useState('yes');
  const [bvn, setBvn] = useState('yes');
  const [jamb, setJamb] = useState('yes');
  const [months, setMonths] = useState('10');
  const [salary, setSalary] = useState('200000');

  const r = useMemo(() => {
    const issues: string[] = [];
    if (citizen !== 'yes') issues.push('You must be a Nigerian citizen.');
    if (inst !== 'public') issues.push('The scheme currently covers students in eligible public tertiary institutions. Private institutions are not included.');
    if (admission !== 'yes') issues.push('You need valid admission into an eligible institution.');
    if (nin !== 'yes') issues.push('You need a National Identification Number (NIN).');
    if (bvn !== 'yes') issues.push('You need a Bank Verification Number (BVN) and a bank account that matches it.');
    if (jamb !== 'yes') issues.push('Your JAMB details must be on record and match your NIN and BVN.');
    return { ok: issues.length === 0, issues, upkeep: UPKEEP * toNum(months), repay: toNum(salary) * 0.1 };
  }, [citizen, inst, admission, nin, bvn, jamb, months, salary]);

  const yn = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="nl-cit" label="Are you a Nigerian citizen?" value={citizen} onChange={setCitizen} options={yn} />
          <Select id="nl-inst" label="Where are you studying?" value={inst} onChange={setInst}
            options={[{ value: 'public', label: 'Public university, polytechnic or college' }, { value: 'private', label: 'Private institution' }]} />
          <Select id="nl-adm" label="Do you have valid admission?" value={admission} onChange={setAdmission} options={yn} />
          <Select id="nl-nin" label="Do you have a NIN?" value={nin} onChange={setNin} options={yn} />
          <Select id="nl-bvn" label="Do you have a BVN and a bank account?" value={bvn} onChange={setBvn} options={yn} />
          <Select id="nl-jamb" label="Are your JAMB details correct and matching?" value={jamb} onChange={setJamb} options={yn} />
        </div>
      </Card>
      <Card>
        <div className={`rounded-lg p-4 text-sm ${r.ok ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'}`}>
          <p className="font-semibold">{r.ok ? 'You appear to meet the NELFUND requirements.' : 'You may not be able to apply yet:'}</p>
          {!r.ok && <ul className="list-disc pl-5 mt-1">{r.issues.map((i) => <li key={i}>{i}</li>)}</ul>}
          {r.ok && <p>Keep these ready: NIN, BVN, JAMB registration number, admission letter, matriculation number, an active email and phone number, and a bank account that matches your BVN.</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="nl-m" label="Months of upkeep you will request" value={months} onChange={setMonths} hint="Upkeep is optional and needs an institutional charges loan too" />
          <Field id="nl-s" label="Future monthly salary (₦), to see repayment" value={salary} onChange={setSalary} step="10000" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label={`Upkeep over ${toNum(months)} months`} value={fmt(r.upkeep)} />
          <Stat label="Repayment at 10% of salary" value={fmt(r.repay)} />
        </div>
        <Note>
          Loan amounts depend on your institution&apos;s charges. The loan is interest-free and repayment begins two years after NYSC or exemption, at 10% of income (10% of profits if self-employed).
          Rules and application windows change. Apply only through the official NELFUND portal and confirm details there.
        </Note>
      </Card>
    </div>
  );
}
