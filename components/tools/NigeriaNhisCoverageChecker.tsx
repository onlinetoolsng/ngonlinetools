'use client';

import { useMemo, useState } from 'react';
import { Card, Note } from './shared/ui';

/**
 * NHIS / NHIA coverage checker (Nigeria).
 * A searchable guide to what the standard NHIA benefit package generally
 * covers, partly covers and excludes. Coverage varies by plan, HMO and
 * provider, so every result tells the user to confirm with their HMO.
 */

type Status = 'covered' | 'partial' | 'not' | 'ask';
type Entry = { name: string; status: Status; note: string; keywords?: string };

const ENTRIES: Entry[] = [
  { name: 'General outpatient consultation', status: 'covered', note: 'At your registered primary provider, including necessary consumables.', keywords: 'doctor visit clinic' },
  { name: 'Specialist consultation', status: 'covered', note: 'Usually on referral from your primary provider.' },
  { name: 'Laboratory tests and diagnostics', status: 'covered', note: 'Those on the approved diagnostic test list.', keywords: 'lab test scan x-ray ultrasound' },
  { name: 'Essential prescription drugs', status: 'covered', note: 'Drugs on the essential list. A 10% co-payment has been reported.', keywords: 'medicine medication' },
  { name: 'Emergency care', status: 'covered', note: 'Emergency treatment at accredited facilities.', keywords: 'accident' },
  { name: 'Hospital admission (inpatient care)', status: 'covered', note: 'Standard ward care at secondary level facilities.', keywords: 'ward admit' },
  { name: 'Antenatal and postnatal care', status: 'covered', note: 'Pregnancy care, including neonatal and postnatal services.', keywords: 'pregnancy maternity' },
  { name: 'Normal delivery', status: 'covered', note: 'Covered under maternity care.', keywords: 'birth childbirth' },
  { name: 'Caesarean section', status: 'covered', note: 'Covered under maternity care when medically needed.', keywords: 'cs c-section birth' },
  { name: 'Basic dental care', status: 'covered', note: 'Consultation, preventive care, fillings and simple extractions.', keywords: 'tooth teeth dentist filling extraction' },
  { name: 'Eye examination and low-priced spectacles', status: 'covered', note: 'Contact lenses are excluded.', keywords: 'glasses optical vision' },
  { name: 'Annual medical check-up', status: 'covered', note: 'A routine check-up not linked to an illness.', keywords: 'screening' },
  { name: 'Preventive care and immunisation', status: 'covered', note: 'Preventive services in the basic package.', keywords: 'vaccine vaccination' },
  { name: 'Prostheses made in Nigeria', status: 'covered', note: 'Limited to locally produced artificial limbs.', keywords: 'artificial limb' },
  { name: 'CT scan and MRI', status: 'partial', note: 'Reported to attract a co-payment.', keywords: 'imaging scan' },
  { name: 'Kidney dialysis', status: 'partial', note: 'Partial support under cost-sharing, often limited in sessions.', keywords: 'renal kidney' },
  { name: 'Physiotherapy', status: 'partial', note: 'Partial financial support under cost-sharing.' },
  { name: 'Optical services beyond basic eye care', status: 'partial', note: 'Partial financial support under cost-sharing.' },
  { name: 'Cancer treatment', status: 'partial', note: 'Reported to receive partial financial support. Check what your plan allows.', keywords: 'chemotherapy oncology' },
  { name: 'Surgery such as fibroid, hernia or appendix', status: 'ask', note: 'Selected surgical procedures are covered. Ask your HMO whether your specific operation is on the list.', keywords: 'fibroid hernia appendectomy operation' },
  { name: 'Cosmetic surgery', status: 'not', note: 'Excluded.', keywords: 'plastic aesthetic' },
  { name: 'In-vitro fertilisation (IVF)', status: 'not', note: 'Excluded.', keywords: 'ivf fertility' },
  { name: 'Family planning commodities', status: 'not', note: 'Excluded.', keywords: 'contraceptive' },
  { name: 'Home visits by doctors', status: 'not', note: 'Excluded.', keywords: 'domiciliary' },
  { name: 'Dental implants', status: 'not', note: 'Excluded.' },
  { name: 'Complex surgeries (cardiac, renal transplant)', status: 'not', note: 'Reported as excluded.', keywords: 'heart transplant' },
  { name: 'Contact lenses', status: 'not', note: 'Excluded.' },
  { name: 'Work-related injuries', status: 'not', note: 'Covered by the employer under workers\' compensation rules.', keywords: 'occupational industrial' },
  { name: 'Patient evacuation or treatment abroad', status: 'not', note: 'Excluded.', keywords: 'air ambulance' },
  { name: 'Drug and substance abuse treatment', status: 'not', note: 'Reported as excluded.', keywords: 'rehab' },
];

const LABEL: Record<Status, { text: string; cls: string }> = {
  covered: { text: 'Generally covered', cls: 'bg-green-100 text-green-800' },
  partial: { text: 'Partly covered', cls: 'bg-yellow-100 text-yellow-800' },
  ask: { text: 'Depends on your HMO', cls: 'bg-blue-100 text-blue-800' },
  not: { text: 'Generally not covered', cls: 'bg-red-100 text-red-800' },
};

export default function NigeriaNhisCoverageChecker({ locale }: { locale: string }) {
  void locale;
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | Status>('all');

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ENTRIES.filter((e) => (filter === 'all' || e.status === filter) && (!s || `${e.name} ${e.keywords ?? ''}`.toLowerCase().includes(s)));
  }, [q, filter]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <label htmlFor="nhis-q" className="block text-sm font-medium text-gray-700 mb-1">Search a service or condition</label>
        <input id="nhis-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. dental, caesarean, dialysis, IVF"
          className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        <div className="flex flex-wrap gap-2">
          {(['all', 'covered', 'partial', 'ask', 'not'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-sm border ${filter === f ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-700'}`}>
              {f === 'all' ? 'All' : LABEL[f].text}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {results.length === 0 && (
          <p className="text-sm text-gray-500 text-center">
            Nothing matches. Ask your HMO or the NHIA directly about that service.
          </p>
        )}
        {results.map((e) => (
          <div key={e.name} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900">{e.name}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${LABEL[e.status].cls}`}>{LABEL[e.status].text}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{e.note}</p>
          </div>
        ))}
      </div>

      <Note>
        This is a general guide to the standard NHIA benefit package. Cover differs by plan (formal sector, informal sector, vulnerable groups,
        state schemes), HMO and provider, and rules change. Always confirm with your HMO or the NHIA before treatment. Not medical or legal advice.
      </Note>
    </div>
  );
}
