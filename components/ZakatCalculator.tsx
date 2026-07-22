'use client';

import { useEffect, useState, useMemo } from 'react';

// -----------------------------------------------------------------------
// Zakat Calculator — pure client component.
// No SEO responsibility, no schema, no registry imports (per site rules).
// Receives { locale } only because the page shell always passes it down;
// the calculator itself is English-only (site is Nigeria-only, no Arabic
// content per project rules), so `locale` is accepted but not branched on.
// -----------------------------------------------------------------------

const GRAMS_PER_OUNCE = 31.1034768;
const GOLD_NISAB_GRAMS = 87.48; // 24k pure gold
const SILVER_NISAB_GRAMS = 612.36;
const ZAKAT_RATE = 0.025;

// Static fallback used only if the live price fetch fails. These are
// approximate reference figures — the UI clearly flags when they're in use.
const FALLBACK_GOLD_USD_PER_OZ = 2650;
const FALLBACK_SILVER_USD_PER_OZ = 31;
const FALLBACK_USD_NGN = 1600;
const FALLBACK_LABEL = 'offline reference price';

const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

function clampNumber(value: string): number {
  const n = parseFloat(value.replace(/,/g, ''));
  if (!isFinite(n) || n < 0) return 0;
  return n;
}

interface PriceState {
  goldPerGramNgn: number | null;
  silverPerGramNgn: number | null;
  isLive: boolean;
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
}

async function fetchLivePrices(): Promise<Omit<PriceState, 'loading'>> {
  try {
    const [goldRes, silverRes, fxRes] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU'),
      fetch('https://api.gold-api.com/price/XAG'),
      fetch('https://open.er-api.com/v6/latest/USD'),
    ]);

    if (!goldRes.ok || !silverRes.ok || !fxRes.ok) {
      throw new Error('One or more price sources returned an error');
    }

    const [gold, silver, fx] = await Promise.all([
      goldRes.json(),
      silverRes.json(),
      fxRes.json(),
    ]);

    const usdToNgn = fx?.rates?.NGN;
    const goldUsdPerOz = gold?.price;
    const silverUsdPerOz = silver?.price;

    if (!usdToNgn || !goldUsdPerOz || !silverUsdPerOz) {
      throw new Error('Malformed response from a price source');
    }

    const goldPerGramNgn = (goldUsdPerOz / GRAMS_PER_OUNCE) * usdToNgn;
    const silverPerGramNgn = (silverUsdPerOz / GRAMS_PER_OUNCE) * usdToNgn;

    return {
      goldPerGramNgn,
      silverPerGramNgn,
      isLive: true,
      lastUpdated: new Date(),
      error: null,
    };
  } catch (err) {
    // Fallback: static reference prices so the tool still returns a usable
    // (clearly-labelled) estimate instead of a blank/broken calculator.
    const goldPerGramNgn =
      (FALLBACK_GOLD_USD_PER_OZ / GRAMS_PER_OUNCE) * FALLBACK_USD_NGN;
    const silverPerGramNgn =
      (FALLBACK_SILVER_USD_PER_OZ / GRAMS_PER_OUNCE) * FALLBACK_USD_NGN;
    return {
      goldPerGramNgn,
      silverPerGramNgn,
      isLive: false,
      lastUpdated: null,
      error:
        'Live gold/silver prices are temporarily unavailable, so this uses a static offline reference price. Refresh to try live prices again, or confirm today\u2019s Nisab with your local zakat committee before paying.',
    };
  }
}

interface AssetInputs {
  cash: string;
  goldSavingsGrams: string;
  goldSavingsKarat: string;
  goldJewelryGrams: string;
  goldJewelryKarat: string;
  includeJewelry: boolean;
  silverGrams: string;
  businessAssets: string;
  investments: string;
  receivables: string;
  other: string;
}

interface LiabilityInputs {
  debtsDue: string;
  billsDue: string;
}

const emptyAssets: AssetInputs = {
  cash: '',
  goldSavingsGrams: '',
  goldSavingsKarat: '24',
  goldJewelryGrams: '',
  goldJewelryKarat: '21',
  includeJewelry: false,
  silverGrams: '',
  businessAssets: '',
  investments: '',
  receivables: '',
  other: '',
};

const emptyLiabilities: LiabilityInputs = {
  debtsDue: '',
  billsDue: '',
};

export default function ZakatCalculator({ locale }: { locale: string }) {
  void locale; // English-only tool; kept for prop-shape compatibility

  const [nisabStandard, setNisabStandard] = useState<'silver' | 'gold'>(
    'silver'
  );
  const [prices, setPrices] = useState<PriceState>({
    goldPerGramNgn: null,
    silverPerGramNgn: null,
    isLive: false,
    lastUpdated: null,
    loading: true,
    error: null,
  });

  const [assets, setAssets] = useState<AssetInputs>(emptyAssets);
  const [liabilities, setLiabilities] =
    useState<LiabilityInputs>(emptyLiabilities);

  async function loadPrices() {
    setPrices((p) => ({ ...p, loading: true }));
    const result = await fetchLivePrices();
    setPrices({ ...result, loading: false });
  }

  useEffect(() => {
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectiveGoldSavingsGrams =
    clampNumber(assets.goldSavingsGrams) *
    (clampNumber(assets.goldSavingsKarat) / 24);
  const effectiveGoldJewelryGrams = assets.includeJewelry
    ? clampNumber(assets.goldJewelryGrams) *
      (clampNumber(assets.goldJewelryKarat) / 24)
    : 0;

  const goldValueNgn =
    (effectiveGoldSavingsGrams + effectiveGoldJewelryGrams) *
    (prices.goldPerGramNgn ?? 0);
  const silverValueNgn =
    clampNumber(assets.silverGrams) * (prices.silverPerGramNgn ?? 0);

  const totalAssets =
    clampNumber(assets.cash) +
    goldValueNgn +
    silverValueNgn +
    clampNumber(assets.businessAssets) +
    clampNumber(assets.investments) +
    clampNumber(assets.receivables) +
    clampNumber(assets.other);

  const totalLiabilities =
    clampNumber(liabilities.debtsDue) + clampNumber(liabilities.billsDue);

  const netZakatableWealth = Math.max(0, totalAssets - totalLiabilities);

  const nisabValue = useMemo(() => {
    if (nisabStandard === 'gold') {
      return (prices.goldPerGramNgn ?? 0) * GOLD_NISAB_GRAMS;
    }
    return (prices.silverPerGramNgn ?? 0) * SILVER_NISAB_GRAMS;
  }, [nisabStandard, prices.goldPerGramNgn, prices.silverPerGramNgn]);

  const meetsNisab = netZakatableWealth >= nisabValue && nisabValue > 0;
  const zakatDue = meetsNisab ? netZakatableWealth * ZAKAT_RATE : 0;

  function updateAsset<K extends keyof AssetInputs>(
    key: K,
    value: AssetInputs[K]
  ) {
    setAssets((a) => ({ ...a, [key]: value }));
  }

  function updateLiability<K extends keyof LiabilityInputs>(
    key: K,
    value: LiabilityInputs[K]
  ) {
    setLiabilities((l) => ({ ...l, [key]: value }));
  }

  function handleReset() {
    setAssets(emptyAssets);
    setLiabilities(emptyLiabilities);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        {/* Nisab & currency setup */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Nisab standard
          </h2>
          <div className="flex flex-wrap gap-3 mb-3">
            <button
              type="button"
              onClick={() => setNisabStandard('silver')}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                nisabStandard === 'silver'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Silver Nisab (612.36g)
            </button>
            <button
              type="button"
              onClick={() => setNisabStandard('gold')}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                nisabStandard === 'gold'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Gold Nisab (87.48g)
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Most scholars recommend the silver standard because it is lower,
            which brings more wealth into zakat obligation. Some Nigerian
            zakat committees announce a gold-based figure instead — switch
            above if that is what your committee uses.
          </p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            {prices.loading ? (
              <span className="text-gray-500">Fetching live prices…</span>
            ) : (
              <>
                <span
                  className={
                    prices.isLive ? 'text-green-700' : 'text-amber-700'
                  }
                >
                  {prices.isLive
                    ? `Live prices • updated ${prices.lastUpdated?.toLocaleTimeString(
                        'en-NG'
                      )}`
                    : `Using ${FALLBACK_LABEL} (live source unavailable)`}
                </span>
                <button
                  type="button"
                  onClick={loadPrices}
                  className="text-indigo-600 underline"
                >
                  Refresh
                </button>
              </>
            )}
          </div>
          {prices.error && (
            <p className="mt-2 text-sm text-amber-700">{prices.error}</p>
          )}
        </div>

        {/* Assets */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Your assets</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cash & liquid assets (₦)
            </label>
            <input
              type="number"
              min={0}
              placeholder="Bank accounts, cash at home, mobile money, e.g. 850000"
              value={assets.cash}
              onChange={(e) => updateAsset('cash', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gold savings/investment (grams)
              </label>
              <input
                type="number"
                min={0}
                placeholder="e.g. 50"
                value={assets.goldSavingsGrams}
                onChange={(e) =>
                  updateAsset('goldSavingsGrams', e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purity (karat)
              </label>
              <select
                value={assets.goldSavingsKarat}
                onChange={(e) =>
                  updateAsset('goldSavingsKarat', e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2"
              >
                <option value="24">24k</option>
                <option value="22">22k</option>
                <option value="21">21k</option>
                <option value="18">18k</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <input
                type="checkbox"
                checked={assets.includeJewelry}
                onChange={(e) =>
                  updateAsset('includeJewelry', e.target.checked)
                }
              />
              Include personally-worn gold jewellery
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Scholars differ on everyday jewellery: some (Hanafi) count it
              toward zakat, others (many Shafi'i/Maliki/Hanbali views) exempt
              jewellery in regular personal use. Tick this only if you follow
              a view that includes it.
            </p>
            {assets.includeJewelry && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Jewellery weight (grams)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 30"
                    value={assets.goldJewelryGrams}
                    onChange={(e) =>
                      updateAsset('goldJewelryGrams', e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Purity (karat)
                  </label>
                  <select
                    value={assets.goldJewelryKarat}
                    onChange={(e) =>
                      updateAsset('goldJewelryKarat', e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2"
                  >
                    <option value="24">24k</option>
                    <option value="22">22k</option>
                    <option value="21">21k</option>
                    <option value="18">18k</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Silver (grams)
            </label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 100"
              value={assets.silverGrams}
              onChange={(e) => updateAsset('silverGrams', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business/trade assets (₦)
            </label>
            <input
              type="number"
              min={0}
              placeholder="Inventory & merchandise at market value, business cash"
              value={assets.businessAssets}
              onChange={(e) =>
                updateAsset('businessAssets', e.target.value)
              }
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Investments (₦)
            </label>
            <input
              type="number"
              min={0}
              placeholder="Stocks, shares, crypto — zakatable portion"
              value={assets.investments}
              onChange={(e) => updateAsset('investments', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receivables (₦)
            </label>
            <input
              type="number"
              min={0}
              placeholder="Money owed to you that you expect to receive"
              value={assets.receivables}
              onChange={(e) => updateAsset('receivables', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other zakatable assets (₦)
            </label>
            <input
              type="number"
              min={0}
              placeholder="e.g. rental income due"
              value={assets.other}
              onChange={(e) => updateAsset('other', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </div>
        </div>

        {/* Liabilities */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Liabilities & deductions
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Debts due now or very soon (₦)
            </label>
            <input
              type="number"
              min={0}
              placeholder="Loan installments currently due"
              value={liabilities.debtsDue}
              onChange={(e) => updateLiability('debtsDue', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bills due now or very soon (₦)
            </label>
            <input
              type="number"
              min={0}
              placeholder="Rent, utilities, immediate obligations"
              value={liabilities.billsDue}
              onChange={(e) => updateLiability('billsDue', e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2"
            />
          </div>
          <p className="text-xs text-gray-500">
            Only debts and bills due immediately or within the near term are
            deducted here. Long-term obligations (e.g. a multi-year mortgage
            balance) are generally not deducted in full — only the portion
            due within the current period.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset all fields
        </button>
      </div>

      {/* Results panel */}
      <div className="lg:sticky lg:top-4 h-fit space-y-4">
        <div className="rounded-xl bg-indigo-50 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Zakat estimate
          </h2>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">
                Current Nisab (
                {nisabStandard === 'gold' ? 'gold' : 'silver'} standard)
              </dt>
              <dd className="font-medium text-gray-900">
                {naira.format(nisabValue)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Total assets</dt>
              <dd className="font-medium text-gray-900">
                {naira.format(totalAssets)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Total deductions</dt>
              <dd className="font-medium text-gray-900">
                −{naira.format(totalLiabilities)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-indigo-200 pt-3">
              <dt className="text-gray-700 font-medium">
                Net zakatable wealth
              </dt>
              <dd className="font-semibold text-gray-900">
                {naira.format(netZakatableWealth)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Meets Nisab?</dt>
              <dd
                className={`font-medium ${
                  meetsNisab ? 'text-green-700' : 'text-gray-700'
                }`}
              >
                {meetsNisab ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl bg-white p-4">
            <p className="text-sm text-gray-600">Zakat due (2.5%)</p>
            <p className="text-3xl font-bold text-indigo-700">
              {naira.format(zakatDue)}
            </p>
          </div>

          <p className="mt-4 text-xs text-gray-600">
            Zakat is only obligatory once qualifying wealth has stayed at or
            above the Nisab for one full lunar year (Hawl, ≈354 days). This
            tool does not track your Hawl date automatically — check your
            estimate against the anniversary of when your wealth first
            reached Nisab.
          </p>
        </div>

        <p className="text-xs text-gray-400">
          This calculator gives an estimate for planning purposes only, based
          on standard Nisab weights (87.48g gold / 612.36g silver) and
          approximate live market prices converted to naira. It is not
          religious guidance. For zakat obligations on complex assets (mixed
          business inventory, agricultural produce, livestock, or disputed
          receivables), confirm with a qualified scholar or your local zakat
          committee before paying.
        </p>
      </div>
    </div>
  );
}
