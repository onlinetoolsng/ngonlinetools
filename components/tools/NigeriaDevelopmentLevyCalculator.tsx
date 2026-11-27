'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Development levy calculator (Nigeria Tax Act 2025, section 59).
 * 4% of assessable profits for companies other than small companies and
 * non-resident companies. Small company: turnover up to N100m and fixed
 * assets up to N250m. The levy replaced the Tertiary Education Tax, IT levy,
 * NASENI levy and Police Trust Fund levy.
 */

const TURNOVER_LIMIT = 100_000_000;
const ASSETS_LIMIT = 250_000_000;
const RATE = 0.04;

export default function NigeriaDevelopmentLevyCalculator({ locale }: { locale: string }) {
  void locale;
  const [residency, setResidency] = useState('resident');
  const [turnover, setTurnover] = useState('250000000');
  const [assets, setAssets] = useState('120000000');
  const [profit, setProfit] = useState('60000000');

  const r = useMemo(() => {
    const t = toNum(turnover), a = toNum(assets), p = toNum(profit);
    const small = t <= TURNOVER_LIMIT && a <= ASSETS_LIMIT;
    const nonResident = residency === 'non-resident';
    const liable = !small && !nonResident;
    return { small, nonResident, liable, levy: liable ? p * RATE : 0, monthly: liable ? (p * RATE) / 12 : 0 };
  }, [turnover, assets, profit, residency]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select id="dl-res" label="Company residency" value={residency} onChange={setResidency}
            options={[{ value: 'resident', label: 'Nigerian (resident) company' }, { value: 'non-resident', label: 'Non-resident company' }]} />
          <Field id="dl-t" label="Annual gross turnover (₦)" value={turnover} onChange={setTurnover} step="1000000" />
          <Field id="dl-a" label="Total fixed assets (₦)" value={assets} onChange={setAssets} step="1000000" />
          <Field id="dl-p" label="Assessable profits (₦)" value={profit} onChange={setProfit} step="1000000"
            hint="Taxable profit before deducting tax depreciation and trading losses" />
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Development levy (4%)" value={fmt(r.levy)} tone={r.liable ? 'bad' : 'good'} />
          <Stat label="Per month (if spread evenly)" value={fmt(r.monthly)} />
        </div>
        <p className="text-sm text-gray-700">
          {r.nonResident
            ? 'Non-resident companies are excluded from the development levy.'
            : r.small
              ? `This company qualifies as a small company (turnover up to ${fmt(TURNOVER_LIMIT)} and fixed assets up to ${fmt(ASSETS_LIMIT)}), so no development levy applies.`
              : 'This company is above the small-company limits, so the 4% levy applies to its assessable profits.'}
        </p>
        <Note>
          From the Nigeria Tax Act 2025 (effective 1 January 2026). The levy replaced the Tertiary Education Tax, IT levy, NASENI levy and Police Trust Fund levy.
          It is separate from company income tax. Confirm the small-company test and the assessable-profit adjustments with a tax adviser. Estimates only.
        </Note>
      </Card>
    </div>
  );
}
