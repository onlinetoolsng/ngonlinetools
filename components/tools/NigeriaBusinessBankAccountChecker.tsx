'use client';

import { useMemo, useState } from 'react';
import { Card, Select, Note } from './shared/ui';

/**
 * Business bank account requirements checklist (Nigeria).
 * Typical documents banks ask for by business type. Banks differ, so this is a
 * starting checklist to confirm with the bank.
 */

type Kind = { label: string; docs: string[]; tips: string[] };

const COMMON = [
  'Valid government ID for each signatory (NIN slip or card, international passport, driver\'s licence or voter\'s card)',
  'Bank Verification Number (BVN) for each signatory',
  'Recent passport photographs of each signatory',
  'Proof of address: a recent utility bill or similar',
  'Completed account opening form and specimen signatures',
];

const KINDS: Record<string, Kind> = {
  businessName: {
    label: 'Registered business name (sole proprietor)',
    docs: [
      'CAC certificate of registration of the business name',
      'CAC status report or application form for the business name',
      'Tax Identification Number (TIN) for the business',
      'Two references (often from existing current account holders)',
      ...COMMON,
    ],
    tips: ['Some banks open a current account for a business name in the owner\'s name alongside the business name.'],
  },
  limited: {
    label: 'Private limited company',
    docs: [
      'CAC certificate of incorporation',
      'Memorandum and Articles of Association',
      'CAC status report and the forms listing directors and shareholders',
      'Board resolution authorising the account and naming signatories',
      'Tax Identification Number (TIN) for the company',
      'Two references (often from existing current account holders)',
      ...COMMON.map((d) => d.replace('each signatory', 'each director and signatory')),
    ],
    tips: ['Directors and signatories usually must appear in person or be verified at the branch.'],
  },
  partnership: {
    label: 'Partnership',
    docs: [
      'CAC registration certificate for the partnership business name',
      'Partnership deed or agreement',
      'Resolution or mandate naming signatories',
      'Tax Identification Number (TIN)',
      ...COMMON.map((d) => d.replace('each signatory', 'each partner and signatory')),
    ],
    tips: ['Every partner is usually asked for ID and BVN.'],
  },
  ngo: {
    label: 'Incorporated trustees (NGO, church, association)',
    docs: [
      'CAC certificate of registration of the incorporated trustees',
      'Constitution of the organisation',
      'Resolution of trustees authorising the account and naming signatories',
      'List of trustees with IDs',
      'Tax Identification Number (TIN) or tax exemption letter if available',
      ...COMMON.map((d) => d.replace('each signatory', 'each trustee and signatory')),
    ],
    tips: ['Banks usually ask for the trustees\' minutes approving the account.'],
  },
  unregistered: {
    label: 'Not yet registered',
    docs: [...COMMON],
    tips: [
      'Most banks need CAC registration before opening a business current account.',
      'Until then you can run the business through a personal account. Registering the business is the next step.',
    ],
  },
};

export default function NigeriaBusinessBankAccountChecker({ locale }: { locale: string }) {
  void locale;
  const [kind, setKind] = useState('businessName');
  const [done, setDone] = useState<Record<string, boolean>>({});
  const k = KINDS[kind];
  const count = useMemo(() => k.docs.filter((d) => done[`${kind}:${d}`]).length, [k, done, kind]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <Select id="ba-kind" label="What kind of business?" value={kind} onChange={setKind}
          options={Object.entries(KINDS).map(([v, x]) => ({ value: v, label: x.label }))} />
        <h3 className="text-sm font-semibold text-gray-800">Documents to prepare ({count} of {k.docs.length} ready)</h3>
        <ul className="space-y-2">
          {k.docs.map((d) => (
            <li key={d}>
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" className="mt-1" checked={!!done[`${kind}:${d}`]}
                  onChange={(e) => setDone({ ...done, [`${kind}:${d}`]: e.target.checked })} />
                <span>{d}</span>
              </label>
            </li>
          ))}
        </ul>
        {count === k.docs.length && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">You have the typical documents. Visit the bank.</p>}
      </Card>
      <Card title="Good to know">
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
          {k.tips.map((t) => <li key={t}>{t}</li>)}
          <li>Ask each bank about opening deposit, monthly maintenance charges, transfer fees and POS or card options before you choose.</li>
        </ul>
        <Note>Requirements differ between banks and change with CBN and CAC rules. This is a typical checklist, not an official list. Confirm with your bank.</Note>
      </Card>
    </div>
  );
}
