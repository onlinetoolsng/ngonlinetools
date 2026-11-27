'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Select, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * Nigerian Treasury Bill (NTB) calculator. T-bills are sold at a discount and
 * pay face value at maturity. Rates are quoted as a discount rate (stop rate).
 *   price per 100 = 100 x (1 - d x t / 365)
 *   true yield    = d / (1 - d x t / 365)
 * The discount rate is an input because it changes at every auction.
 */

const TENORS = [{ v: '91', l: '91 days' }, { v: '182', l: '182 days' }, { v: '364', l: '364 days' }];

export default function NigeriaTreasuryBillCalculator({ locale }: { locale: string }) {
  void locale;
  const [mode, setMode] = useState<'invest' | 'target'>('invest');
  const [amount, setAmount] = useState('1000000');
  const [tenor, setTenor] = useState('364');
  const [discount, setDiscount] = useState('18');
  const [tax, setTax] = useState('0');
  const [target, setTarget] = useState('1000000');

  const r = useMemo(() => {
    const t = toNum(tenor);
    const d = toNum(discount) / 100;
    const denom = 1 - (d * t) / 365;
    if (denom <= 0) return null;
    const pricePer100 = 100 * denom;
    const trueYield = d / denom;
    const annualisedYield = trueYield; // already per year (365-day basis)
    const taxRate = Math.min(100, toNum(tax)) / 100;
    const faceFor = (invest: number) => invest / (pricePer100 / 100);
    const invest = mode === 'invest' ? toNum(amount) : toNum(target) * (pricePer100 / 100);
    const face = faceFor(invest);
    const gain = face - invest;
    const netGain = gain * (1 - taxRate);
    return { pricePer100, annualisedYield, invest, face, gain, netGain, periodReturn: invest > 0 ? (gain / invest) * 100 : 0 };
  }, [mode, amount, tenor, discount, target, tax]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <Select id="tb-mode" label="What do you want to know?" value={mode} onChange={(v) => setMode(v as 'invest' | 'target')}
          options={[{ value: 'invest', label: 'What I get back for an amount I invest' }, { value: 'target', label: 'How much to invest to receive a target at maturity' }]} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {mode === 'invest'
            ? <Field id="tb-amt" label="Amount invested (₦)" value={amount} onChange={setAmount} step="10000" />
            : <Field id="tb-tg" label="Amount at maturity (₦)" value={target} onChange={setTarget} step="10000" />}
          <Select id="tb-ten" label="Tenor" value={tenor} onChange={setTenor} options={TENORS.map((x) => ({ value: x.v, label: x.l }))} />
          <Field id="tb-d" label="Discount rate (%)" value={discount} onChange={setDiscount} step="0.01" hint="Use the latest auction stop rate. 18 is only an example." />
          <Field id="tb-tax" label="Tax on gain (%), optional" value={tax} onChange={setTax} />
        </div>
      </Card>
      {r ? (
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="You invest" value={fmt(r.invest)} />
            <Stat label="You receive at maturity" value={fmt(r.face)} tone="good" />
            <Stat label="Gain" value={fmt(r.gain)} />
            <Stat label="Gain after tax" value={fmt(r.netGain)} />
            <Stat label="Return over the tenor" value={`${r.periodReturn.toFixed(2)}%`} />
            <Stat label="True yield (per year)" value={`${(r.annualisedYield * 100).toFixed(2)}%`} tone="good" />
          </div>
          <p className="text-sm text-gray-600">Price per ₦100 face value: ₦{r.pricePer100.toFixed(2)}.</p>
          <Note>
            Treasury bills are bought at a discount and redeemed at face value. The true yield is higher than the discount rate. Enter the stop rate from the latest
            CBN auction result. Actual allotment amounts, fees and tax treatment depend on your bank or broker. Estimates only.
          </Note>
        </Card>
      ) : <p className="text-sm text-red-600">That discount rate is too high for the tenor.</p>}
    </div>
  );
}
