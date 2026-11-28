'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Nigeria driver's licence fee calculator.
 * Fees (Joint Tax Board revision effective 8 June 2025, matching the FRSC
 * portal): motor vehicle N15,000 for 3 years, N21,000 for 5 years;
 * tricycle and motorcycle N7,000 for 3 years, N11,000 for 5 years.
 * Extra costs (driving school, photos, bank charges) are inputs.
 */

const FEES = {
  vehicle: { label: 'Motor vehicle (car, bus, truck)', 3: 15000, 5: 21000 },
  motorcycle: { label: 'Tricycle or motorcycle', 3: 7000, 5: 11000 },
} as const;
type Cls = keyof typeof FEES;

export default function NigeriaDriversLicenceRenewalCalculator({ locale }: { locale: string }) {
  void locale;
  const [cls, setCls] = useState<Cls>('vehicle');
  const [years, setYears] = useState<'3' | '5'>('3');
  const [kind, setKind] = useState('renewal');
  const [school, setSchool] = useState('0');
  const [other, setOther] = useState('0');

  const r = useMemo(() => {
    const y = Number(years) as 3 | 5;
    const fee = FEES[cls][y];
    const extra = (kind === 'new' ? toNum(school) : 0) + toNum(other);
    const other3 = FEES[cls][3] / 3;
    const other5 = FEES[cls][5] / 5;
    return { fee, extra, total: fee + extra, perYear: fee / y, per3: other3, per5: other5, saving5: other3 * 5 - FEES[cls][5] };
  }, [cls, years, kind, school, other]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="dl-c" label="Licence class" value={cls} onChange={(v) => setCls(v as Cls)} options={Object.entries(FEES).map(([k, v]) => ({ value: k, label: v.label }))} />
          <Select id="dl-y" label="Validity" value={years} onChange={(v) => setYears(v as '3' | '5')} options={[{ value: '3', label: '3 years' }, { value: '5', label: '5 years' }]} />
          <Select id="dl-k" label="Application" value={kind} onChange={setKind} options={[{ value: 'renewal', label: 'Renewal' }, { value: 'new', label: 'New licence' }]} />
          {kind === 'new' && <Field id="dl-s" label="Driving school fee (₦)" value={school} onChange={setSchool} step="1000" hint="Set by each school" />}
          <Field id="dl-o" label="Other costs (₦)" value={other} onChange={setOther} step="500" hint="Photos, bank or payment charges" />
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Licence fee" value={fmt(r.fee)} tone="good" />
          <Stat label="Total with other costs" value={fmt(r.total)} />
          <Stat label="Cost per year of validity" value={fmt(r.perYear)} />
          <Stat label="5-year saving vs two 3-year renewals" value={fmt(Math.max(0, r.saving5))} />
        </div>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          <li>Apply and pay on the official FRSC driver&apos;s licence portal, using the payment reference it generates.</li>
          <li>After biometric capture you receive a temporary licence, valid for 60 days, while the card is produced.</li>
          <li>Typical documents: your NIN, a valid ID and passport photographs. Confirm the current list on the portal.</li>
        </ul>
        <Note>
          Fees are the Joint Tax Board rates in force since 8 June 2025 and shown on the FRSC portal in November 2026. They can change, and payment channels may add charges, so check the
          amount on the portal before you pay. Never pay touts or unofficial agents.
        </Note>
      </Card>
    </div>
  );
}
