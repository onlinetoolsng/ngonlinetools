'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Note, toNum, fmt } from './shared/ui';

/**
 * NSFAS eligibility checker (South Africa).
 * Financial test (NSFAS rules): verified SASSA grant recipients qualify; others
 * need gross combined household income of R350,000 a year or less (R600,000 for
 * persons with disabilities). R350,001 to R600,000 may apply for a NSFAS loan.
 * Applicant must be a South African citizen or permanent resident registered or
 * intending to register at a public university or TVET college.
 */

const BURSARY_LIMIT = 350_000;
const DISABILITY_LIMIT = 600_000;

export default function SouthAfricaNsfasEligibilityChecker({ locale }: { locale: string }) {
  void locale;
  const [citizen, setCitizen] = useState('yes');
  const [institution, setInstitution] = useState('public');
  const [sassa, setSassa] = useState('no');
  const [disability, setDisability] = useState('no');
  const [income, setIncome] = useState('280000');
  const [previous, setPrevious] = useState('no');

  const r = useMemo(() => {
    const issues: string[] = [];
    if (citizen !== 'yes') issues.push('NSFAS is open to South African citizens and permanent residents only.');
    if (institution !== 'public') issues.push('You must study at a public university or TVET college.');
    if (previous === 'yes') issues.push('NSFAS does not fund a second qualification of the same level, so having completed one can disqualify you.');
    const inc = toNum(income);
    let financial = '';
    let outcome: 'bursary' | 'loan' | 'no' = 'no';
    if (sassa === 'yes') { financial = 'Verified SASSA grant recipients automatically meet the financial requirement.'; outcome = 'bursary'; }
    else if (disability === 'yes' && inc <= DISABILITY_LIMIT) { financial = `Household income of ${fmt(inc, 'R')} is within the ${fmt(DISABILITY_LIMIT, 'R')} limit for persons with disabilities.`; outcome = 'bursary'; }
    else if (inc <= BURSARY_LIMIT) { financial = `Household income of ${fmt(inc, 'R')} is within the ${fmt(BURSARY_LIMIT, 'R')} bursary limit.`; outcome = 'bursary'; }
    else if (inc <= DISABILITY_LIMIT) { financial = `Household income above ${fmt(BURSARY_LIMIT, 'R')} but not above ${fmt(DISABILITY_LIMIT, 'R')} may apply for a NSFAS student loan.`; outcome = 'loan'; }
    else financial = `Household income above ${fmt(DISABILITY_LIMIT, 'R')} is outside NSFAS limits.`;
    if (issues.length) outcome = 'no';
    return { issues, financial, outcome };
  }, [citizen, institution, sassa, disability, income, previous]);

  const yn = [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="nf-cit" label="South African citizen or permanent resident?" value={citizen} onChange={setCitizen} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
          <Select id="nf-inst" label="Where will you study?" value={institution} onChange={setInstitution}
            options={[{ value: 'public', label: 'Public university or TVET college' }, { value: 'private', label: 'Private institution' }]} />
          <Select id="nf-sassa" label="Do you or your household receive a verified SASSA grant?" value={sassa} onChange={setSassa} options={yn} />
          <Select id="nf-dis" label="Are you a person with a disability?" value={disability} onChange={setDisability} options={yn} />
          <Field id="nf-inc" label="Gross combined household income per year (R)" value={income} onChange={setIncome} step="10000" hint="Before tax, for the whole household" />
          <Select id="nf-prev" label="Have you already completed a qualification at this level?" value={previous} onChange={setPrevious} options={yn} />
        </div>
      </Card>
      <Card>
        <div className={`rounded-lg p-4 text-sm ${r.outcome === 'bursary' ? 'bg-green-50 text-green-900' : r.outcome === 'loan' ? 'bg-blue-50 text-blue-900' : 'bg-amber-50 text-amber-900'}`}>
          <p className="font-semibold">
            {r.outcome === 'bursary' && 'You appear to meet the NSFAS bursary financial requirement.'}
            {r.outcome === 'loan' && 'You may be able to apply for a NSFAS student loan.'}
            {r.outcome === 'no' && 'You may not qualify.'}
          </p>
          <p>{r.financial}</p>
          {r.issues.length > 0 && <ul className="list-disc pl-5 mt-2">{r.issues.map((i) => <li key={i}>{i}</li>)}</ul>}
        </div>
        <Note>
          Meeting the income test is only part of NSFAS eligibility. You must also have an approved qualification and place, pass NSFAS verification and meet academic progress rules.
          The SRD grant does not count as a SASSA grant for this purpose. Application windows are limited: NSFAS 2027 applications closed on 31 October 2026, so check the official NSFAS website for the next window or any extension.
        </Note>
      </Card>
    </div>
  );
}
