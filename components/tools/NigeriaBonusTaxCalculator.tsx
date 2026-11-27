'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';
import { ngPayeOnAnnual, ngMarginalRate } from '@/lib/calculators/ngPaye';

/**
 * Annual bonus tax calculator (Nigeria, Nigeria Tax Act 2025 bands).
 * The bonus is added to the year's income. Its tax is the extra PAYE caused
 * by adding it: PAYE(income + bonus) minus PAYE(income).
 */

export default function NigeriaBonusTaxCalculator({ locale }: { locale: string }) {
  void locale;
  const [monthly, setMonthly] = useState('600000');
  const [pensionable, setPensionable] = useState('420000');
  const [rent, setRent] = useState('1200000');
  const [bonus, setBonus] = useState('1500000');
  const [bonusPensionable, setBonusPensionable] = useState(false);

  const r = useMemo(() => {
    const gross = toNum(monthly) * 12;
    const pension = toNum(pensionable) * 12 * 0.08;
    const rentRelief = Math.min(toNum(rent) * 0.2, 500000);
    const b = toNum(bonus);
    const bonusPension = bonusPensionable ? b * 0.08 : 0;
    const base = Math.max(0, gross - pension - rentRelief);
    const withBonus = Math.max(0, gross + b - pension - bonusPension - rentRelief);
    const taxBase = ngPayeOnAnnual(base);
    const taxWith = ngPayeOnAnnual(withBonus);
    const bonusTax = taxWith - taxBase;
    return { base, withBonus, taxBase, taxWith, bonusTax, bonusPension, net: b - bonusTax - bonusPension, eff: b > 0 ? (bonusTax / b) * 100 : 0, marginal: ngMarginalRate(withBonus) };
  }, [monthly, pensionable, rent, bonus, bonusPensionable]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <Field id="bt-m" label="Monthly gross pay (₦)" value={monthly} onChange={setMonthly} step="10000" />
          <Field id="bt-p" label="Monthly pensionable pay (₦)" value={pensionable} onChange={setPensionable} step="10000" hint="Basic + housing + transport" />
          <Field id="bt-r" label="Annual rent paid (₦)" value={rent} onChange={setRent} step="10000" hint="20% relief, capped at ₦500,000" />
          <Field id="bt-b" label="Annual bonus (₦)" value={bonus} onChange={setBonus} step="10000" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={bonusPensionable} onChange={(e) => setBonusPensionable(e.target.checked)} />
          My employer takes 8% pension on the bonus
        </label>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Tax on the bonus" value={fmt(r.bonusTax)} tone="bad" />
          <Stat label="Bonus you keep" value={fmt(r.net)} tone="good" />
          <Stat label="Effective rate on bonus" value={`${r.eff.toFixed(1)}%`} />
          <Stat label="Top tax rate with bonus" value={`${(r.marginal * 100).toFixed(0)}%`} />
        </div>
        <p className="text-sm text-gray-600">Yearly PAYE without the bonus: {fmt(r.taxBase)}. With it: {fmt(r.taxWith)}.</p>
        <Note>
          Uses the Nigeria Tax Act 2025 bands (₦0 to ₦800,000 at 0%, then 15%, 18%, 21%, 23% and 25%) with 8% employee pension and rent relief.
          Employers may withhold bonus tax differently in the month it is paid, but the year-end liability is what this shows. Estimates only.
        </Note>
      </Card>
    </div>
  );
}
