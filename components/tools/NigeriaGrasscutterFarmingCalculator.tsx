'use client';

import { useMemo, useState } from 'react';

/**
 * Grasscutter Farming Startup & Profit Calculator (Nigeria)
 * Pure client component, receives { locale } only. English only.
 * Month-by-month projection over 36 months. Biology defaults follow published
 * grasscutter figures (gestation about 5 months, litter about 4, 1 male to 4
 * females); every price and cost is an editable assumption, not market data.
 */

const MONTHS = 36;
const GESTATION_MONTHS = 5;

type N = string;
const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;
const num = (v: N, d = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
};

export default function NigeriaGrasscutterFarmingCalculator({ locale }: { locale: string }) {
  void locale;
  const [colonies, setColonies] = useState<N>('2');
  const [femalesPer, setFemalesPer] = useState<N>('4');
  const [colonyPrice, setColonyPrice] = useState<N>('150000');
  const [housing, setHousing] = useState<N>('40000');
  const [otherSetup, setOtherSetup] = useState<N>('50000');
  const [litterSize, setLitterSize] = useState<N>('4');
  const [survival, setSurvival] = useState<N>('80');
  const [cycle, setCycle] = useState<N>('6');
  const [marketMonths, setMarketMonths] = useState<N>('7');
  const [price, setPrice] = useState<N>('25000');
  const [breederFeed, setBreederFeed] = useState<N>('2000');
  const [youngFeed, setYoungFeed] = useState<N>('1000');
  const [monthlyOther, setMonthlyOther] = useState<N>('10000');

  const r = useMemo(() => {
    const c = Math.max(1, Math.floor(num(colonies, 1)));
    const fp = Math.max(1, Math.floor(num(femalesPer, 4)));
    const females = c * fp;
    const males = c;
    const cyc = Math.max(1, Math.round(num(cycle, 6)));
    const mk = Math.max(1, Math.round(num(marketMonths, 7)));
    const born = females * num(litterSize, 4) * (Math.min(100, num(survival, 80)) / 100);
    const setup = c * (num(colonyPrice) + num(housing)) + num(otherSetup);

    const cash = new Array(MONTHS + 1).fill(0);
    const births = new Array(MONTHS + 1).fill(0);
    for (let m = GESTATION_MONTHS; m <= MONTHS; m += cyc) births[m] += born;

    let firstSale = -1;
    let animalsSold = 0;
    cash[0] = -setup;
    for (let m = 1; m <= MONTHS; m++) {
      let alive = 0;
      let sold = 0;
      for (let b = 0; b <= MONTHS; b++) {
        if (births[b] === 0) continue;
        if (m > b && m <= b + mk) alive += births[b]; // young being fed
        if (m === b + mk) sold += births[b];
      }
      if (sold > 0 && firstSale === -1) firstSale = m;
      animalsSold += sold;
      cash[m] =
        sold * num(price) -
        (females + males) * num(breederFeed) -
        alive * num(youngFeed) -
        num(monthlyOther);
    }

    let cum = 0;
    let breakEven = -1;
    const cumulative: number[] = [];
    for (let m = 0; m <= MONTHS; m++) {
      cum += cash[m];
      cumulative.push(cum);
      if (breakEven === -1 && m > 0 && cum >= 0) breakEven = m;
    }
    const years = [1, 2, 3].map((y) => {
      let net = 0;
      for (let m = (y - 1) * 12 + 1; m <= y * 12; m++) net += cash[m];
      return net - (y === 1 ? setup : 0);
    });
    return { setup, firstSale, animalsSold, breakEven, years, total: cum, females, males };
  }, [colonies, femalesPer, colonyPrice, housing, otherSetup, litterSize, survival, cycle, marketMonths, price, breederFeed, youngFeed, monthlyOther]);

  const inp = 'w-full rounded-lg border border-gray-300 px-3 py-2';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';
  const field = (id: string, label: string, v: N, set: (s: N) => void, step = '1') => (
    <div>
      <label htmlFor={id} className={lbl}>{label}</label>
      <input id={id} type="number" inputMode="decimal" min="0" step={step} value={v} onChange={(e) => set(e.target.value)} className={inp} />
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h3 className="text-sm font-semibold text-gray-800">Setup</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {field('gc-col', 'Colonies (1 male + females)', colonies, setColonies)}
          {field('gc-fem', 'Females per colony', femalesPer, setFemalesPer)}
          {field('gc-cp', 'Price per colony (₦)', colonyPrice, setColonyPrice, '1000')}
          {field('gc-h', 'Housing per colony (₦)', housing, setHousing, '1000')}
          {field('gc-os', 'Other setup (₦)', otherSetup, setOtherSetup, '1000')}
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Breeding and sales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {field('gc-ls', 'Young per litter', litterSize, setLitterSize, '0.5')}
          {field('gc-sv', 'Survival to sale (%)', survival, setSurvival)}
          {field('gc-cy', 'Months between litters', cycle, setCycle)}
          {field('gc-mm', 'Months from birth to sale', marketMonths, setMarketMonths)}
          {field('gc-pr', 'Price per animal sold (₦)', price, setPrice, '500')}
        </div>
        <h3 className="text-sm font-semibold text-gray-800">Running costs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {field('gc-bf', 'Feed per breeder per month (₦)', breederFeed, setBreederFeed, '100')}
          {field('gc-yf', 'Feed per young per month (₦)', youngFeed, setYoungFeed, '100')}
          {field('gc-mo', 'Labour, vet and other per month (₦)', monthlyOther, setMonthlyOther, '500')}
        </div>
        <p className="text-xs text-gray-400">
          Prices and costs are placeholders. Replace them with quotes from your supplier and local market.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Startup cost</p>
            <p className="text-xl font-bold text-gray-900">{naira(r.setup)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Net after {MONTHS} months</p>
            <p className={`text-xl font-bold ${r.total >= 0 ? 'text-green-700' : 'text-red-700'}`}>{naira(r.total)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">First sale</p>
            <p className="text-xl font-bold text-gray-900">{r.firstSale === -1 ? 'Not in 36 months' : `Month ${r.firstSale}`}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Break-even</p>
            <p className="text-xl font-bold text-gray-900">{r.breakEven === -1 ? 'Not in 36 months' : `Month ${r.breakEven}`}</p>
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-gray-500 border-b"><th className="py-2">Year</th><th className="py-2">Net cash (setup in year 1)</th></tr>
          </thead>
          <tbody>
            {r.years.map((n, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">Year {i + 1}</td>
                <td className={`py-2 ${n >= 0 ? 'text-green-700' : 'text-red-700'}`}>{naira(n)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-gray-600">
          {r.females} breeding females and {r.males} males produce about {Math.round(r.animalsSold)} animals for sale within{' '}
          {MONTHS} months. Gestation takes about {GESTATION_MONTHS} months, so the first litters arrive late and sales
          follow only once the young reach market age.
        </p>
        <p className="text-xs text-gray-400">An estimate only. It ignores inflation, loan interest, taxes and disease losses beyond the survival rate you enter.</p>
      </div>
    </div>
  );
}
