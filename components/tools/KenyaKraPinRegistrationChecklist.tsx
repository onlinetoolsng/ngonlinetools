'use client';

import { useMemo, useState } from 'react';
import { Card, Select, Note } from './shared/ui';

/**
 * Kenya KRA PIN Registration Checklist
 * Requirements follow the KRA website ("Requirements for KRA PIN registration").
 * Pure client component, receives { locale } only.
 */

type Applicant = {
  label: string;
  docs: string[];
  extra?: string;
};

const APPLICANTS: Record<string, Applicant> = {
  resident: {
    label: 'Kenyan or Alien ID holder (resident)',
    docs: ['National ID or Alien ID card details', 'An active email address and phone number (an OTP is sent to the email)'],
  },
  employee: {
    label: 'Resident who is employed',
    docs: ['National ID or Alien ID card details', 'Your employer\'s KRA PIN', 'An active email address and phone number'],
  },
  business: {
    label: 'Resident in business',
    docs: ['National ID or Alien ID card details', 'Business registration certificate details', 'An active email address and phone number'],
  },
  pwo: {
    label: 'Resident with no income yet (PIN without obligation)',
    docs: ['National ID card details', 'An active email address and phone number'],
    extra: 'Choose the option that you do not have a tax obligation. You can add obligations later on iTax.',
  },
  student: {
    label: 'Non-citizen student or intern',
    docs: ['Original passport and a copy', 'Student ID and a copy', 'Letter of introduction from your institution, or an internship letter'],
    extra: 'Non-residents get an acknowledgement receipt, which you take with your documents to a KRA iTax office to complete registration.',
  },
  investor: {
    label: 'Non-citizen investor',
    docs: ['Original passport and a copy', 'Letter of introduction from a tax agent or lawyer, with the agent\'s PIN'],
    extra: 'Non-residents get an acknowledgement receipt, which you take with your documents to a KRA iTax office to complete registration.',
  },
  company: {
    label: 'Company',
    docs: ['Certificate of incorporation', 'CR12 (list of directors and shareholders)', 'PIN and ID details of the directors'],
  },
  partnership: {
    label: 'Partnership',
    docs: ['KRA acknowledgement receipt', 'KRA PIN certificate of one of the partners', 'Partnership deed (optional)'],
  },
};

const STEPS = [
  'Go to the KRA iTax portal and choose "New PIN Registration".',
  'Choose your taxpayer type (individual or non-individual) and the online form.',
  'Enter your ID details and date of birth. Your other details fill in automatically for residents.',
  'Add your email and phone number, request the OTP sent to your email and enter it.',
  'Fill in your income or business details, then submit.',
  'Download your PIN certificate. Residents get it straight away. Check your email as well.',
];

export default function KenyaKraPinRegistrationChecklist({ locale }: { locale: string }) {
  void locale;
  const [who, setWho] = useState('employee');
  const [done, setDone] = useState<Record<string, boolean>>({});
  const a = APPLICANTS[who];

  const progress = useMemo(() => {
    const n = a.docs.filter((d) => done[`${who}:${d}`]).length;
    return { n, total: a.docs.length };
  }, [a, done, who]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <Select id="kra-who" label="Who is applying?" value={who} onChange={setWho}
          options={Object.entries(APPLICANTS).map(([k, v]) => ({ value: k, label: v.label }))} />
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Have these ready ({progress.n} of {progress.total})
          </h3>
          <ul className="space-y-2">
            {a.docs.map((d) => (
              <li key={d}>
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="mt-1" checked={!!done[`${who}:${d}`]}
                    onChange={(e) => setDone({ ...done, [`${who}:${d}`]: e.target.checked })} />
                  <span>{d}</span>
                </label>
              </li>
            ))}
          </ul>
          {progress.n === progress.total && (
            <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">You have everything on the list. Start on iTax.</p>
          )}
          {a.extra && <p className="mt-3 text-sm text-gray-600">{a.extra}</p>}
        </div>
      </Card>

      <Card title="Steps on iTax">
        <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
          {STEPS.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <p className="text-sm text-gray-600">
          A KRA PIN is an 11-character number that starts with A and ends with a letter.
        </p>
        <Note>Requirements come from the KRA website and can change. Confirm on kra.go.ke before you apply. This tool does not submit anything for you.</Note>
      </Card>
    </div>
  );
}
