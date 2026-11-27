'use client';

import { useMemo, useState } from 'react';
import { Card, Field, Stat, Note, toNum, fmt } from './shared/ui';

/** Truck and haulage trip cost calculator. Every cost is an input. */

export default function NigeriaHaulageTripCostCalculator({ locale }: { locale: string }) {
  void locale;
  const [distance, setDistance] = useState('600');
  const [kmPerLitre, setKmPerLitre] = useState('2.5');
  const [fuelPrice, setFuelPrice] = useState('1000');
  const [driver, setDriver] = useState('60000');
  const [tolls, setTolls] = useState('15000');
  const [maint, setMaint] = useState('40');
  const [other, setOther] = useState('20000');
  const [loadTonnes, setLoadTonnes] = useState('20');
  const [rate, setRate] = useState('1200000');

  const r = useMemo(() => {
    const km = toNum(distance) * 2; // round trip
    const kpl = toNum(kmPerLitre);
    const fuelLitres = kpl > 0 ? km / kpl : 0;
    const fuel = fuelLitres * toNum(fuelPrice);
    const maintenance = km * toNum(maint);
    const total = fuel + toNum(driver) + toNum(tolls) + maintenance + toNum(other);
    const income = toNum(rate);
    const profit = income - total;
    const t = toNum(loadTonnes);
    return { km, fuelLitres, fuel, maintenance, total, profit, perTonne: t > 0 ? total / t : 0, perKm: km > 0 ? total / km : 0, margin: income > 0 ? (profit / income) * 100 : 0 };
  }, [distance, kmPerLitre, fuelPrice, driver, tolls, maint, other, loadTonnes, rate]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card title="Trip">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field id="ht-d" label="One-way distance (km)" value={distance} onChange={setDistance} step="10" />
          <Field id="ht-kpl" label="Truck km per litre" value={kmPerLitre} onChange={setKmPerLitre} step="0.1" />
          <Field id="ht-fp" label="Diesel price per litre (₦)" value={fuelPrice} onChange={setFuelPrice} step="10" />
          <Field id="ht-dr" label="Driver and motor boy pay (₦)" value={driver} onChange={setDriver} step="1000" />
          <Field id="ht-tl" label="Tolls, levies, checkpoints (₦)" value={tolls} onChange={setTolls} step="1000" />
          <Field id="ht-m" label="Maintenance per km (₦)" value={maint} onChange={setMaint} step="5" />
          <Field id="ht-o" label="Other trip costs (₦)" value={other} onChange={setOther} step="1000" />
          <Field id="ht-t" label="Load (tonnes)" value={loadTonnes} onChange={setLoadTonnes} />
          <Field id="ht-r" label="Freight you charge (₦)" value={rate} onChange={setRate} step="10000" />
        </div>
        <p className="text-xs text-gray-500">Carrying a paid return load? Add its income to the freight you charge.</p>
      </Card>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total trip cost" value={fmt(r.total)} />
          <Stat label="Profit on the trip" value={fmt(r.profit)} tone={r.profit >= 0 ? 'good' : 'bad'} />
          <Stat label="Fuel cost (round trip)" value={fmt(r.fuel)} />
          <Stat label="Cost per tonne" value={fmt(r.perTonne)} />
          <Stat label="Cost per km" value={fmt(r.perKm, '₦', 0)} />
          <Stat label="Margin" value={`${r.margin.toFixed(1)}%`} />
        </div>
        <p className="text-sm text-gray-600">Round trip of {r.km.toLocaleString()} km uses about {Math.round(r.fuelLitres).toLocaleString()} litres of diesel.</p>
        <Note>Every figure is an input, so use real quotes and records. Excludes truck purchase or finance, insurance, depreciation and tax.</Note>
      </Card>
    </div>
  );
}
