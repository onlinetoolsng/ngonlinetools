'use client';

import { useState, useEffect, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GroceryItem {
  id: string;
  name: string;
  category: 'grains' | 'tubers' | 'proteins' | 'vegetables' | 'oils' | 'others';
  unit: string;
  priceNGN: number;
  typicalQuantity: number;
  notes?: string;
}

interface MealIngredient {
  itemId: string;
  qty: number;
}

interface MealPreset {
  id: string;
  name: string;
  servings: number;
  ingredients: MealIngredient[];
}

interface ListEntry {
  itemId: string;
  qty: number;
}

type LocationKey = 'national' | 'lagos' | 'abuja' | 'kano' | 'portharcourt';

// ---------------------------------------------------------------------------
// Seed data (sample averages — see disclaimer). Update periodically.
// ---------------------------------------------------------------------------

const LAST_UPDATED = 'June 2026 (based on NBS Selected Food Price Watch & market surveys)';

const LOCATIONS: { key: LocationKey; label: string; multiplier: number }[] = [
  { key: 'national', label: 'National Average', multiplier: 1 },
  { key: 'lagos', label: 'Lagos', multiplier: 1.18 },
  { key: 'abuja', label: 'Abuja (FCT)', multiplier: 1.12 },
  { key: 'kano', label: 'Kano', multiplier: 0.9 },
  { key: 'portharcourt', label: 'Port Harcourt', multiplier: 1.15 },
];

const GROCERY_ITEMS: GroceryItem[] = [
  { id: 'rice-local', name: 'Local Rice', category: 'grains', unit: 'kg', priceNGN: 1600, typicalQuantity: 5 },
  { id: 'rice-foreign', name: 'Foreign Rice', category: 'grains', unit: 'kg', priceNGN: 2100, typicalQuantity: 5 },
  { id: 'garri-white', name: 'Garri (White)', category: 'grains', unit: 'kg', priceNGN: 800, typicalQuantity: 3 },
  { id: 'garri-yellow', name: 'Garri (Yellow, Ijebu)', category: 'grains', unit: 'kg', priceNGN: 950, typicalQuantity: 3 },
  { id: 'beans-brown', name: 'Brown Beans (Oloyin)', category: 'grains', unit: 'kg', priceNGN: 1900, typicalQuantity: 2 },
  { id: 'beans-white', name: 'White Beans', category: 'grains', unit: 'kg', priceNGN: 1500, typicalQuantity: 2 },
  { id: 'spaghetti', name: 'Spaghetti', category: 'grains', unit: '500g pack', priceNGN: 950, typicalQuantity: 2 },
  { id: 'indomie', name: 'Indomie Noodles', category: 'grains', unit: 'pack of 5', priceNGN: 1400, typicalQuantity: 1 },
  { id: 'semovita', name: 'Semovita', category: 'grains', unit: '2kg pack', priceNGN: 3200, typicalQuantity: 1 },
  { id: 'yam-tuber', name: 'Yam', category: 'tubers', unit: 'medium tuber', priceNGN: 2200, typicalQuantity: 2 },
  { id: 'plantain', name: 'Plantain (Unripe)', category: 'tubers', unit: 'bunch', priceNGN: 2000, typicalQuantity: 1 },
  { id: 'sweet-potato', name: 'Sweet Potato', category: 'tubers', unit: 'kg', priceNGN: 700, typicalQuantity: 2 },
  { id: 'irish-potato', name: 'Irish Potato', category: 'tubers', unit: 'kg', priceNGN: 1100, typicalQuantity: 2 },
  { id: 'chicken', name: 'Chicken (Live/Dressed)', category: 'proteins', unit: 'kg', priceNGN: 4200, typicalQuantity: 2 },
  { id: 'beef', name: 'Beef (Boneless)', category: 'proteins', unit: 'kg', priceNGN: 7200, typicalQuantity: 1.5 },
  { id: 'fish-titus', name: 'Titus Fish (Frozen)', category: 'proteins', unit: 'kg', priceNGN: 3600, typicalQuantity: 2 },
  { id: 'fish-dried', name: 'Dried/Smoked Fish', category: 'proteins', unit: 'kg', priceNGN: 6500, typicalQuantity: 0.5 },
  { id: 'eggs', name: 'Eggs', category: 'proteins', unit: 'crate of 30', priceNGN: 4200, typicalQuantity: 1 },
  { id: 'turkey', name: 'Turkey (Parts)', category: 'proteins', unit: 'kg', priceNGN: 6000, typicalQuantity: 1 },
  { id: 'tomato', name: 'Fresh Tomato', category: 'vegetables', unit: 'kg', priceNGN: 1500, typicalQuantity: 3 },
  { id: 'pepper-mix', name: 'Pepper Mix (Tatashe/Rodo)', category: 'vegetables', unit: 'kg', priceNGN: 1800, typicalQuantity: 1.5 },
  { id: 'onion', name: 'Onion', category: 'vegetables', unit: 'kg', priceNGN: 1200, typicalQuantity: 2 },
  { id: 'ugu', name: 'Ugu (Fluted Pumpkin Leaf)', category: 'vegetables', unit: 'bunch', priceNGN: 700, typicalQuantity: 1 },
  { id: 'spinach', name: 'Spinach (Green)', category: 'vegetables', unit: 'bunch', priceNGN: 500, typicalQuantity: 1 },
  { id: 'okra', name: 'Okra', category: 'vegetables', unit: 'kg', priceNGN: 1300, typicalQuantity: 1 },
  { id: 'palm-oil', name: 'Palm Oil', category: 'oils', unit: '1L bottle', priceNGN: 2400, typicalQuantity: 1 },
  { id: 'vegetable-oil', name: 'Vegetable Oil', category: 'oils', unit: '1L bottle', priceNGN: 2600, typicalQuantity: 1 },
  { id: 'groundnut-oil', name: 'Groundnut Oil', category: 'oils', unit: '1L bottle', priceNGN: 3200, typicalQuantity: 1 },
  { id: 'egusi', name: 'Egusi (Melon Seed)', category: 'others', unit: 'kg', priceNGN: 3800, typicalQuantity: 0.5 },
  { id: 'crayfish', name: 'Crayfish (Ground)', category: 'others', unit: 'kg', priceNGN: 8500, typicalQuantity: 0.25 },
  { id: 'salt', name: 'Salt', category: 'others', unit: '500g pack', priceNGN: 350, typicalQuantity: 1 },
  { id: 'seasoning-cubes', name: 'Seasoning Cubes', category: 'others', unit: 'pack of 50', priceNGN: 1600, typicalQuantity: 1 },
  { id: 'sugar', name: 'Sugar', category: 'others', unit: 'kg', priceNGN: 1300, typicalQuantity: 1 },
  { id: 'bread', name: 'Bread (Sliced Loaf)', category: 'others', unit: 'loaf', priceNGN: 1500, typicalQuantity: 1 },
  { id: 'milk-powder', name: 'Milk (Powdered)', category: 'others', unit: '400g tin', priceNGN: 3400, typicalQuantity: 1 },
];

const ITEM_MAP: Record<string, GroceryItem> = Object.fromEntries(GROCERY_ITEMS.map((i) => [i.id, i]));

const CATEGORY_LABELS: Record<GroceryItem['category'], string> = {
  grains: 'Grains & Staples',
  tubers: 'Tubers & Plantain',
  proteins: 'Proteins',
  vegetables: 'Vegetables & Pepper',
  oils: 'Oils',
  others: 'Others',
};

const MEAL_PRESETS: MealPreset[] = [
  {
    id: 'jollof-family-5',
    name: 'Jollof Rice (Family of 5)',
    servings: 5,
    ingredients: [
      { itemId: 'rice-local', qty: 2.5 },
      { itemId: 'tomato', qty: 1.5 },
      { itemId: 'pepper-mix', qty: 0.5 },
      { itemId: 'onion', qty: 0.5 },
      { itemId: 'vegetable-oil', qty: 0.5 },
      { itemId: 'chicken', qty: 1.5 },
      { itemId: 'seasoning-cubes', qty: 1 },
      { itemId: 'salt', qty: 0.2 },
    ],
  },
  {
    id: 'eba-egusi-5',
    name: 'Eba & Egusi Soup (Family of 5)',
    servings: 5,
    ingredients: [
      { itemId: 'garri-white', qty: 1.5 },
      { itemId: 'egusi', qty: 0.5 },
      { itemId: 'ugu', qty: 2 },
      { itemId: 'palm-oil', qty: 0.5 },
      { itemId: 'beef', qty: 1 },
      { itemId: 'fish-dried', qty: 0.3 },
      { itemId: 'crayfish', qty: 0.2 },
      { itemId: 'seasoning-cubes', qty: 1 },
    ],
  },
  {
    id: 'beans-porridge-4',
    name: 'Beans Porridge (Family of 4)',
    servings: 4,
    ingredients: [
      { itemId: 'beans-brown', qty: 1.5 },
      { itemId: 'plantain', qty: 0.5 },
      { itemId: 'palm-oil', qty: 0.3 },
      { itemId: 'pepper-mix', qty: 0.3 },
      { itemId: 'onion', qty: 0.3 },
      { itemId: 'seasoning-cubes', qty: 0.5 },
    ],
  },
  {
    id: 'indomie-egg-1',
    name: 'Indomie & Egg (1 Person)',
    servings: 1,
    ingredients: [
      { itemId: 'indomie', qty: 0.2 },
      { itemId: 'eggs', qty: 0.07 },
      { itemId: 'onion', qty: 0.05 },
      { itemId: 'vegetable-oil', qty: 0.05 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GroceryMealCostEstimator({ locale }: { locale: string }) {
  const [mode, setMode] = useState<'build' | 'meals'>('build');
  const [location, setLocation] = useState<LocationKey>('national');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<GroceryItem['category'] | 'all'>('all');
  const [list, setList] = useState<ListEntry[]>([]);
  const [familySize, setFamilySize] = useState<number>(4);
  const [bufferOn, setBufferOn] = useState(false);
  const [bufferPct, setBufferPct] = useState(15);
  const [activeMeal, setActiveMeal] = useState<string | null>(null);
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [showUsd, setShowUsd] = useState(false);
  const [copied, setCopied] = useState(false);

  const locationMultiplier = LOCATIONS.find((l) => l.key === location)?.multiplier ?? 1;

  // Optional, best-effort NGN -> USD reference rate. Fails silently.
  useEffect(() => {
    let cancelled = false;
    fetch('https://open.er-api.com/v6/latest/NGN')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.rates?.USD) {
          setUsdRate(data.rates.USD);
        }
      })
      .catch(() => {
        // Silently ignore — USD reference is optional and non-essential.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    return GROCERY_ITEMS.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  function addItem(itemId: string) {
    setList((prev) => {
      const existing = prev.find((e) => e.itemId === itemId);
      if (existing) return prev;
      const item = ITEM_MAP[itemId];
      return [...prev, { itemId, qty: item?.typicalQuantity ?? 1 }];
    });
  }

  function updateQty(itemId: string, qty: number) {
    const safeQty = Number.isFinite(qty) && qty >= 0 ? Math.min(qty, 9999) : 0;
    setList((prev) => prev.map((e) => (e.itemId === itemId ? { ...e, qty: safeQty } : e)));
  }

  function removeItem(itemId: string) {
    setList((prev) => prev.filter((e) => e.itemId !== itemId));
  }

  function loadMeal(mealId: string) {
    const meal = MEAL_PRESETS.find((m) => m.id === mealId);
    if (!meal) return;
    setActiveMeal(mealId);
    setServingsMultiplier(1);
    setList(meal.ingredients.map((ing) => ({ itemId: ing.itemId, qty: ing.qty })));
  }

  const activeMealData = MEAL_PRESETS.find((m) => m.id === activeMeal) || null;

  const displayList = useMemo(() => {
    if (mode === 'meals' && activeMealData) {
      return list.map((e) => ({ ...e, qty: e.qty * servingsMultiplier }));
    }
    return list;
  }, [list, mode, activeMealData, servingsMultiplier]);

  const subtotal = useMemo(() => {
    return displayList.reduce((sum, entry) => {
      const item = ITEM_MAP[entry.itemId];
      if (!item || entry.qty <= 0) return sum;
      return sum + item.priceNGN * entry.qty * locationMultiplier;
    }, 0);
  }, [displayList, locationMultiplier]);

  const total = bufferOn ? subtotal * (1 + bufferPct / 100) : subtotal;
  const perPerson = familySize > 0 ? total / familySize : total;
  const usdEquivalent = usdRate ? total * usdRate : null;

  function handleCopy() {
    const lines = displayList
      .filter((e) => e.qty > 0)
      .map((e) => {
        const item = ITEM_MAP[e.itemId];
        if (!item) return '';
        const lineCost = item.priceNGN * e.qty * locationMultiplier;
        return `${item.name}: ${e.qty} ${item.unit} — ${formatNGN(lineCost)}`;
      })
      .filter(Boolean);
    const summary = [
      mode === 'meals' && activeMealData ? activeMealData.name : 'Grocery List',
      `Location: ${LOCATIONS.find((l) => l.key === location)?.label}`,
      ...lines,
      `Total: ${formatNGN(total)}`,
    ].join('\n');
    navigator.clipboard
      ?.writeText(summary)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        // Clipboard access can fail silently (e.g. permissions) — non-critical.
      });
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Top disclaimer */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-4 text-sm text-amber-900">
        <strong>Estimate only.</strong> Figures are based on sample/averaged public market data (NBS Selected Food
        Price Watch and market surveys) that fluctuate by location, season, vendor, and inflation. This tool is not
        financial advice and is not a substitute for checking prices locally. Last updated: {LAST_UPDATED}.
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Estimate the cost of groceries or specific meals using sample Nigerian market prices. Use it for budgeting,
        meal planning, or comparing options — then verify prices at your local market.
      </p>

      {/* Mode tabs */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('build')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            mode === 'build' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Build Grocery List
        </button>
        <button
          type="button"
          onClick={() => setMode('meals')}
          className={`px-4 py-2 rounded-xl text-sm font-medium ${
            mode === 'meals' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Predefined Meals
        </button>
      </div>

      {/* Location + family size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-gray-200 p-3">
          <label htmlFor="location-select" className="block text-xs font-medium text-gray-500 mb-1">
            Location
          </label>
          <select
            id="location-select"
            value={location}
            onChange={(e) => setLocation(e.target.value as LocationKey)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc.key} value={loc.key}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border border-gray-200 p-3">
          <label htmlFor="family-size" className="block text-xs font-medium text-gray-500 mb-1">
            Family / household size (for per-person cost)
          </label>
          <input
            id="family-size"
            type="number"
            min={1}
            max={30}
            value={familySize}
            onChange={(e) => setFamilySize(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left/main panel */}
        <div className="md:col-span-2">
          {mode === 'build' ? (
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Search items (e.g. rice, tomato, beans)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search grocery items"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value as GroceryItem['category'] | 'all')}
                  aria-label="Filter by category"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All categories</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatNGN(item.priceNGN)} / {item.unit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addItem(item.id)}
                      className="rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-1.5 hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                ))}
                {filteredItems.length === 0 && <p className="text-sm text-gray-500 py-4">No items match your search.</p>}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Choose a predefined meal</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {MEAL_PRESETS.map((meal) => (
                  <button
                    key={meal.id}
                    type="button"
                    onClick={() => loadMeal(meal.id)}
                    className={`text-left rounded-xl border p-3 text-sm ${
                      activeMeal === meal.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                    }`}
                  >
                    <p className="font-medium text-gray-800">{meal.name}</p>
                    <p className="text-xs text-gray-500">Base: {meal.servings} servings</p>
                  </button>
                ))}
              </div>
              {activeMealData && (
                <div>
                  <label htmlFor="servings-multiplier" className="block text-xs font-medium text-gray-500 mb-1">
                    Servings multiplier (base {activeMealData.servings} servings)
                  </label>
                  <input
                    id="servings-multiplier"
                    type="number"
                    min={0.5}
                    step={0.5}
                    max={20}
                    value={servingsMultiplier}
                    onChange={(e) => setServingsMultiplier(Math.max(0.5, Math.min(20, Number(e.target.value) || 1)))}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Feeds approximately {Math.round(activeMealData.servings * servingsMultiplier)} people at this
                    multiplier.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results panel */}
        <div>
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 sticky top-4">
            <h3 className="text-sm font-semibold text-indigo-900 mb-3">Your List</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
              {displayList.filter((e) => e.qty > 0).length === 0 && (
                <p className="text-xs text-indigo-700">No items yet. Add items or pick a meal.</p>
              )}
              {list.map((entry) => {
                const item = ITEM_MAP[entry.itemId];
                if (!item) return null;
                const effectiveQty = mode === 'meals' && activeMealData ? entry.qty * servingsMultiplier : entry.qty;
                const lineCost = item.priceNGN * effectiveQty * locationMultiplier;
                return (
                  <div key={entry.itemId} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-500">{formatNGN(lineCost)}</p>
                    </div>
                    {mode === 'build' && (
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={entry.qty}
                        onChange={(e) => updateQty(entry.itemId, Number(e.target.value))}
                        aria-label={`Quantity for ${item.name}`}
                        className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(entry.itemId)}
                      aria-label={`Remove ${item.name}`}
                      className="text-gray-400 hover:text-red-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <label className="flex items-center gap-2 text-xs text-indigo-900 mb-2">
              <input type="checkbox" checked={bufferOn} onChange={(e) => setBufferOn(e.target.checked)} />
              Add market variability buffer
            </label>
            {bufferOn && (
              <input
                type="range"
                min={5}
                max={30}
                value={bufferPct}
                onChange={(e) => setBufferPct(Number(e.target.value))}
                className="w-full mb-2"
                aria-label="Buffer percentage"
              />
            )}
            {bufferOn && <p className="text-[11px] text-indigo-700 mb-2">Buffer: +{bufferPct}%</p>}

            <div className="border-t border-indigo-200 pt-3 mt-2">
              <p className="text-xs text-indigo-700">Estimated total</p>
              <p className="text-2xl font-bold text-indigo-900">{formatNGN(total)}</p>
              <p className="text-xs text-indigo-700 mt-1">
                ≈ {formatNGN(perPerson)} per person ({familySize} people)
              </p>
              {usdRate && (
                <label className="flex items-center gap-2 text-[11px] text-indigo-700 mt-2">
                  <input type="checkbox" checked={showUsd} onChange={(e) => setShowUsd(e.target.checked)} />
                  Show USD reference
                </label>
              )}
              {showUsd && usdEquivalent && (
                <p className="text-xs text-indigo-700 mt-1">≈ ${usdEquivalent.toFixed(2)} (reference rate only)</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full mt-3 rounded-lg bg-indigo-600 text-white text-xs font-medium px-3 py-2 hover:bg-indigo-700"
            >
              {copied ? 'Copied!' : 'Copy summary'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Prices shown are sample averages sourced from NBS Selected Food Price Watch data and public market surveys as
        of {LAST_UPDATED.split(' (')[0]}; they are approximations, not live quotes, and can differ substantially by
        vendor, season, and exact location (for example, Lagos vs. Kano). The optional USD figure uses a floating
        reference exchange rate for convenience only and is not a transactional rate. Always confirm current prices
        with a local vendor or market before budgeting large purchases. Locale: {locale}.
      </p>
    </div>
  );
}
