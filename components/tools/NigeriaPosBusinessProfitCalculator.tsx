'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';

/**
 * POS agent profit calculator. All rates are inputs: charges you collect,
 * what your provider charges you, and your running costs.
 */

export default function NigeriaPosBusinessProfitCalculator({ locale }: { locale: string }) {
  void locale;
  const [txPerDay, setTxPerDay] = useState('40');
  const [avgAmount, setAvgAmount] = useState('15000');
  const [custPct, setCustPct] = useState('0.5');
  const [custMin, setCustMin] = useState('100');
  const [provPct, setProvPct] = useState('0.3');
  const [provCap, setProvCap] = useState('0');
  const [days, setDays] = useState('26');
  const [rent, setRent] = useState('30000');
  const [other, setOther] = useState('15000');
  const [float, setFloat] = useState('300000');

  const r = useMemo(() => {
    const amt = toNum(avgAmount);
    const charge = Math.max(amt * (toNum(custPct) / 100), toNum(custMin));
    let provider = amt * (toNum(provPct) / 100);
    if (toNum(provCap) > 0) provider = Math.min(provider, toNum(provCap));
    const perTx = charge - provider;
    const month = toNum(txPerDay) * toNum(days);
    const gross = perTx * month;
    const net = gross - toNum(rent) - toNum(other);
    const breakEvenTx = perTx > 0 ? (toNum(rent) + toNum(other)) / perTx : 0;
    return { charge, provider, perTx, month, gross, net, breakEvenTx, volume: month * amt, roi: toNum(float) > 0 ? (net / toNum(float)) * 100 : 0 };
  }, [txPerDay, avgAmount, custPct, custMin, provPct, provCap, days, rent, other, float]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card title="Your transactions">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field id="pos-tx" label="Withdrawals per day" value={txPerDay} onChange={setTxPerDay} />
          <Field id="pos-amt" label="Average amount (₦)" value={avgAmount} onChange={setAvgAmount} step="1000" />
          <Field id="pos-days" label="Working days a month" value={days} onChange={setDays} />
          <Field id="pos-cp" label="You charge customers (%)" value={custPct} onChange={setCustPct} step="0.1" />
          <Field id="pos-cm" label="Your minimum charge (₦)" value={custMin} onChange={setCustMin} step="50" />
          <Field id="pos-pp" label="Provider charges you (%)" value={provPct} onChange={setProvPct} step="0.05" />
          <Field id="pos-pc" label="Provider charge cap per transaction (₦, 0 = none)" value={provCap} onChange={setProvCap} step="50" />
        </div>
      </Card>
      <Card title="Monthly costs and capital">
        <div className="grid grid-cols-3 gap-4">
          <Field id="pos-rent" label="Shop rent (₦)" value={rent} onChange={setRent} step="1000" />
          <Field id="pos-oth" label="Other costs (₦)" value={other} onChange={setOther} step="1000" />
          <Field id="pos-float" label="Float and capital (₦)" value={float} onChange={setFloat} step="10000" />
        </div>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Profit per transaction" value={fmt(r.perTx, '₦', 2)} tone={r.perTx >= 0 ? 'good' : 'bad'} />
          <Stat label="Transactions a month" value={r.month.toLocaleString()} />
          <Stat label="Monthly profit before costs" value={fmt(r.gross)} />
          <Stat label="Monthly profit after costs" value={fmt(r.net)} tone={r.net >= 0 ? 'good' : 'bad'} />
          <Stat label="Transactions to cover costs" value={Math.ceil(r.breakEvenTx).toLocaleString()} />
          <Stat label="Monthly return on capital" value={`${r.roi.toFixed(1)}%`} />
        </div>
        <p className="text-sm text-gray-600">Monthly money moved through the terminal: {fmt(r.volume)}. You charge {fmt(r.charge, '₦', 2)} and pay {fmt(r.provider, '₦', 2)} on an average transaction.</p>
        <Note>Charges, provider fees and costs are inputs: use your own. The tool ignores failed transactions, disputes, taxes and any cash-handling losses.</Note>
      </Card>
    </div>
  );
}
