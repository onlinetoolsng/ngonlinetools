'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Note, toNum } from './shared/ui';

/**
 * SASSA SRD grant (R370) eligibility checker.
 * Criteria (2026): age 18 to 59; South African citizen, permanent resident,
 * refugee or asylum seeker with a valid permit; unemployed; no other SASSA
 * grant, UIF payment or NSFAS funding; income below R624 per month (checked
 * monthly against bank accounts); applications are online only.
 * Government can change these rules, so confirm on srd.sassa.gov.za.
 */

const INCOME_LIMIT = 624;
const AMOUNT = 370;

export default function SouthAfricaSrdGrantEligibilityChecker({ locale }: { locale: string }) {
  void locale;
  const [age, setAge] = useState('30');
  const [status, setStatus] = useState('citizen');
  const [employed, setEmployed] = useState('no');
  const [other, setOther] = useState('no');
  const [income, setIncome] = useState('0');
  const [institution, setInstitution] = useState('no');

  const r = useMemo(() => {
    const issues: string[] = [];
    const a = toNum(age, -1);
    if (a < 18 || a > 59) issues.push('You must be between 18 and 59 years old.');
    if (status === 'other') issues.push('You must be a South African citizen, permanent resident, refugee or asylum seeker with a valid permit.');
    if (employed === 'yes') issues.push('You must be unemployed.');
    if (other === 'yes') issues.push('You cannot receive another SASSA grant, a UIF payment or NSFAS funding.');
    if (toNum(income) >= INCOME_LIMIT) issues.push(`Your monthly income, including money paid into your bank account, must be below R${INCOME_LIMIT}.`);
    if (institution === 'yes') issues.push('You cannot be living in a state-funded institution such as a prison or care facility.');
    return { ok: issues.length === 0, issues };
  }, [age, status, employed, other, income, institution]);

  const yn = [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="srd-age" label="Your age" value={age} onChange={setAge} />
          <Select id="srd-status" label="Status" value={status} onChange={setStatus}
            options={[{ value: 'citizen', label: 'South African citizen or permanent resident' }, { value: 'refugee', label: 'Refugee or asylum seeker with a valid permit' }, { value: 'other', label: 'Other' }]} />
          <Select id="srd-emp" label="Do you have a job or run a business that pays you?" value={employed} onChange={setEmployed} options={yn} />
          <Select id="srd-oth" label="Do you get another SASSA grant, UIF or NSFAS?" value={other} onChange={setOther} options={yn} />
          <Field id="srd-inc" label="Monthly money coming in (R)" value={income} onChange={setIncome} step="50" hint="Include deposits into any bank account linked to your ID, even from family" />
          <Select id="srd-inst" label="Living in a state-funded institution?" value={institution} onChange={setInstitution} options={yn} />
        </div>
      </Card>
      <Card>
        {r.ok ? (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-900">
            <p className="font-semibold">You appear to meet the SRD grant criteria.</p>
            <p>The grant is R{AMOUNT} a month. Apply online at the official SASSA SRD site. SASSA re-checks your income every month, so approval is not permanent.</p>
          </div>
        ) : (
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 space-y-1">
            <p className="font-semibold">You may not qualify right now:</p>
            <ul className="list-disc pl-5">{r.issues.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        )}
        <Note>
          This is an indication only, not a decision. SASSA decides each month after bank and database checks, and a deposit above the income limit can lead to a decline for that month.
          If you are declined you can appeal within 90 days through the SRD appeals process. The grant is currently extended to 31 March 2027, and the rules can change.
          Use only the official SASSA channels (srd.sassa.gov.za) and never pay anyone to apply.
        </Note>
      </Card>
    </div>
  );
}
