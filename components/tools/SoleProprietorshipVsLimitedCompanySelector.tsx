'use client';

import { useMemo, useState } from 'react';
import { Card, Select, Note } from './shared/ui';

/**
 * Sole proprietorship vs limited company selector (Nigeria and Ghana).
 * A short questionnaire that scores the answers and recommends a structure.
 * General guidance only, not legal or tax advice.
 */

type Q = { id: string; text: string; options: { label: string; company: number; note?: string }[] };

const QUESTIONS: Q[] = [
  {
    id: 'liability',
    text: 'If the business is sued or cannot pay its debts, how worried are you about your personal assets?',
    options: [
      { label: 'Very worried: I want my personal assets protected', company: 3 },
      { label: 'Somewhat worried', company: 1 },
      { label: 'Not worried: low risk business', company: 0 },
    ],
  },
  {
    id: 'owners',
    text: 'How many owners will there be?',
    options: [
      { label: 'Just me', company: 0 },
      { label: 'Two or more people', company: 2 },
    ],
  },
  {
    id: 'investors',
    text: 'Do you plan to raise money from investors or issue shares?',
    options: [
      { label: 'Yes', company: 3 },
      { label: 'Maybe later', company: 1 },
      { label: 'No', company: 0 },
    ],
  },
  {
    id: 'contracts',
    text: 'Will you bid for large contracts or corporate clients that expect a registered company?',
    options: [
      { label: 'Yes, often', company: 2 },
      { label: 'Sometimes', company: 1 },
      { label: 'No', company: 0 },
    ],
  },
  {
    id: 'size',
    text: 'How big do you expect the business to be in the next two to three years?',
    options: [
      { label: 'Growing fast with staff and premises', company: 2 },
      { label: 'Steady and small', company: 0 },
    ],
  },
  {
    id: 'admin',
    text: 'How do you feel about extra paperwork and yearly filings?',
    options: [
      { label: 'Fine, I will use an accountant', company: 1 },
      { label: 'I want the simplest set-up', company: -2 },
    ],
  },
];

const COUNTRY = {
  nigeria: {
    soleName: 'Business name (sole proprietorship)',
    coName: 'Private limited company',
    regulator: 'the Corporate Affairs Commission (CAC) under CAMA 2020',
    solePoints: ['Registered as a business name with the CAC', 'You and the business are the same legal person, so you are personally liable', 'Profits are taxed as your personal income', 'Simplest and cheapest to set up'],
    coPoints: ['Registered as a company with the CAC', 'The company is a separate legal person, and members\' liability is limited to their shares', 'The company pays company income tax and files annual returns', 'Can issue shares and raise investment'],
  },
  ghana: {
    soleName: 'Sole proprietorship',
    coName: 'Company limited by shares',
    regulator: 'the Registrar of Companies (Registrar-General\'s Department) under the Companies Act, 2019 (Act 992)',
    solePoints: ['Registered as a business name with the Registrar-General\'s Department', 'You and the business are the same legal person, so you are personally liable', 'Profits are taxed as your personal income', 'Simplest and cheapest to set up'],
    coPoints: ['Registered as a company with the Registrar-General\'s Department', 'The company is a separate legal person, and members\' liability is limited to their shares', 'The company pays company income tax and files annual returns', 'Can issue shares and raise investment'],
  },
} as const;

export default function SoleProprietorshipVsLimitedCompanySelector({ locale }: { locale: string }) {
  void locale;
  const [country, setCountry] = useState<'nigeria' | 'ghana'>('nigeria');
  const [picked, setPicked] = useState<Record<string, number>>({});

  const answered = Object.keys(picked).length;
  const score = useMemo(
    () => QUESTIONS.reduce((sum, q) => sum + (picked[q.id] !== undefined ? q.options[picked[q.id]].company : 0), 0),
    [picked]
  );
  const c = COUNTRY[country];
  const done = answered === QUESTIONS.length;
  const company = score >= 3;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <Select id="sp-country" label="Country" value={country} onChange={(v) => setCountry(v as 'nigeria' | 'ghana')}
          options={[{ value: 'nigeria', label: 'Nigeria' }, { value: 'ghana', label: 'Ghana' }]} />
        {QUESTIONS.map((q) => (
          <fieldset key={q.id} className="space-y-2">
            <legend className="text-sm font-medium text-gray-800">{q.text}</legend>
            {q.options.map((o, i) => (
              <label key={o.label} className="flex items-start gap-2 text-sm text-gray-700">
                <input type="radio" name={q.id} className="mt-1" checked={picked[q.id] === i}
                  onChange={() => setPicked({ ...picked, [q.id]: i })} />
                <span>{o.label}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </Card>

      {done ? (
        <Card title="Suggested structure">
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
            Based on your answers, a <strong>{company ? c.coName : c.soleName}</strong> looks like the better fit.
          </p>
          <table className="w-full text-sm text-left">
            <thead><tr className="text-gray-500 border-b"><th className="py-2 w-1/2">{c.soleName}</th><th className="py-2 w-1/2">{c.coName}</th></tr></thead>
            <tbody>
              {c.solePoints.map((p, i) => (
                <tr key={i} className="border-b border-gray-100 align-top"><td className="py-2 pr-3">{p}</td><td className="py-2">{c.coPoints[i]}</td></tr>
              ))}
            </tbody>
          </table>
          <Note>
            Registration is handled by {c.regulator}. This is general guidance, not legal or tax advice. Fees, share capital rules and
            filing duties change, so confirm with the registry or a professional before you register.
          </Note>
        </Card>
      ) : (
        <p className="text-sm text-gray-500 text-center">Answer all {QUESTIONS.length} questions to see a suggestion ({answered} done).</p>
      )}
    </div>
  );
}
