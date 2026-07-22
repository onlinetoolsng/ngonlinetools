'use client';

import { useMemo, useState } from 'react';

/**
 * RecipeMealCostCalculator
 * Pure client component. No SEO, no schema, no registry imports.
 * Receives only { locale } per ToolBase's tool-component contract.
 * All copy below is English-only — ToolBase is Nigeria-only with no
 * Arabic/country-variant content, so no i18n string table is wired in.
 * If a genuine second locale is ever added for this tool, swap the
 * plain strings below for the site's existing i18n lookup.
 */

type Unit = 'kg' | 'g' | 'l' | 'ml' | 'piece' | 'bunch' | 'derica' | 'cup';

interface Ingredient {
  id: string;
  name: string;
  qty: number;
  unit: Unit;
  unitPrice: number; // price in Naira for one unit of `unit`
}

interface RecipePreset {
  name: string;
  tag: string;
  ingredients: Ingredient[];
}

const UNITS: Unit[] = ['kg', 'g', 'l', 'ml', 'piece', 'bunch', 'derica', 'cup'];

let idCounter = 0;
const nextId = () => `ing-${++idCounter}-${Date.now()}`;

const makeIngredient = (name: string, qty: number, unit: Unit, unitPrice: number): Ingredient => ({
  id: nextId(),
  name,
  qty,
  unit,
  unitPrice,
});

// Illustrative starting prices only — not live market data. Users are told
// to adjust every field before relying on the total.
const RECIPE_PRESETS: RecipePreset[] = [
  {
    name: 'Jollof Rice (party style)',
    tag: 'Lunch/Dinner',
    ingredients: [
      makeIngredient('Rice', 2, 'derica', 1800),
      makeIngredient('Tomatoes', 1, 'kg', 900),
      makeIngredient('Pepper mix (tatashe/rodo)', 1, 'kg', 1200),
      makeIngredient('Onions', 3, 'piece', 150),
      makeIngredient('Vegetable oil', 0.5, 'l', 1400),
      makeIngredient('Chicken', 1, 'kg', 3500),
      makeIngredient('Seasoning cubes', 6, 'piece', 25),
    ],
  },
  {
    name: 'Egusi Soup + Swallow',
    tag: 'Dinner',
    ingredients: [
      makeIngredient('Egusi (melon seeds)', 1, 'kg', 3200),
      makeIngredient('Palm oil', 0.5, 'l', 1300),
      makeIngredient('Assorted meat', 1, 'kg', 4500),
      makeIngredient('Stockfish/dried fish', 0.3, 'kg', 2000),
      makeIngredient('Ugu (pumpkin leaves)', 2, 'bunch', 300),
      makeIngredient('Semovita/garri', 1, 'kg', 1100),
      makeIngredient('Seasoning cubes', 4, 'piece', 25),
    ],
  },
  {
    name: 'Beans Porridge',
    tag: 'Lunch',
    ingredients: [
      makeIngredient('Beans (honey/oloyin)', 2, 'derica', 1600),
      makeIngredient('Palm oil', 0.3, 'l', 1300),
      makeIngredient('Pepper mix', 0.5, 'kg', 1200),
      makeIngredient('Onions', 2, 'piece', 150),
      makeIngredient('Sweet potato/plantain', 3, 'piece', 300),
      makeIngredient('Seasoning cubes', 3, 'piece', 25),
    ],
  },
  {
    name: 'Fried Rice',
    tag: 'Lunch/Dinner',
    ingredients: [
      makeIngredient('Rice', 2, 'derica', 1800),
      makeIngredient('Mixed vegetables (carrot, peas, green beans)', 0.5, 'kg', 1500),
      makeIngredient('Liver/chicken', 1, 'kg', 3500),
      makeIngredient('Vegetable oil', 0.4, 'l', 1400),
      makeIngredient('Curry/thyme', 1, 'piece', 200),
      makeIngredient('Seasoning cubes', 4, 'piece', 25),
    ],
  },
  {
    name: 'Indomie + Egg',
    tag: 'Breakfast/Budget',
    ingredients: [
      makeIngredient('Indomie (pack of 5)', 1, 'piece', 1500),
      makeIngredient('Eggs', 4, 'piece', 150),
      makeIngredient('Onions', 1, 'piece', 150),
      makeIngredient('Seasoning cubes', 1, 'piece', 25),
    ],
  },
  {
    name: 'Amala + Ewedu',
    tag: 'Lunch',
    ingredients: [
      makeIngredient('Yam flour (elubo)', 0.5, 'kg', 1200),
      makeIngredient('Ewedu leaves', 2, 'bunch', 250),
      makeIngredient('Locust beans (iru)', 1, 'piece', 200),
      makeIngredient('Assorted meat', 0.5, 'kg', 4500),
      makeIngredient('Palm oil', 0.2, 'l', 1300),
      makeIngredient('Seasoning cubes', 3, 'piece', 25),
    ],
  },
  {
    name: 'White Rice + Stew',
    tag: 'Lunch/Dinner',
    ingredients: [
      makeIngredient('Rice', 2, 'derica', 1800),
      makeIngredient('Tomatoes', 1, 'kg', 900),
      makeIngredient('Pepper mix', 0.7, 'kg', 1200),
      makeIngredient('Vegetable oil', 0.4, 'l', 1400),
      makeIngredient('Beef/chicken', 1, 'kg', 3500),
      makeIngredient('Seasoning cubes', 4, 'piece', 25),
    ],
  },
  {
    name: 'Garri + Soup',
    tag: 'Budget',
    ingredients: [
      makeIngredient('Garri', 1, 'derica', 1000),
      makeIngredient('Vegetable soup base (ugu/waterleaf)', 1, 'bunch', 400),
      makeIngredient('Palm oil', 0.2, 'l', 1300),
      makeIngredient('Dried fish', 0.2, 'kg', 2000),
      makeIngredient('Seasoning cubes', 2, 'piece', 25),
    ],
  },
];

// Informational only — no live pricing API. If prices drift with inflation,
// the user simply edits the fields; nothing here depends on an external feed.
const CITY_NOTES: Record<string, string> = {
  none: '',
  lagos: 'Lagos market prices commonly run 10–20% above the national average due to logistics costs.',
  abuja: 'Abuja prices are often close to the national average, occasionally higher for imported items.',
  portharcourt: 'Port Harcourt prices can run 5–15% above average, especially for perishables.',
  other: 'Prices vary by state and season — adjust each ingredient to match your local market.',
};

// Static, dated benchmark for context only — not a live feed.
const HEALTHY_DIET_BENCHMARK = {
  low: 1400,
  high: 1700,
  asOf: '2024 NBS Cost of Healthy Diet estimate',
};

const PROTEIN_ADDONS: { label: string; cost: number }[] = [
  { label: 'Add fish', cost: 800 },
  { label: 'Add chicken', cost: 1200 },
  { label: 'Add beef', cost: 1500 },
];

function formatNaira(value: number): string {
  if (!isFinite(value)) return '₦0';
  return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function cloneIngredients(ingredients: Ingredient[]): Ingredient[] {
  return ingredients.map((ing) => ({ ...ing, id: nextId() }));
}

export default function RecipeMealCostCalculator({ locale }: { locale: string }) {
  const [presetIndex, setPresetIndex] = useState<number | 'custom'>(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    cloneIngredients(RECIPE_PRESETS[0].ingredients)
  );
  const [servings, setServings] = useState(5);
  const [extraCost, setExtraCost] = useState(300); // fuel/gas/electricity estimate
  const [city, setCity] = useState<keyof typeof CITY_NOTES>('none');
  const [applyCityMultiplier, setApplyCityMultiplier] = useState(false);
  const [proteinAddon, setProteinAddon] = useState<number | null>(null);

  const cityMultiplier =
    applyCityMultiplier && city === 'lagos'
      ? 1.15
      : applyCityMultiplier && city === 'portharcourt'
      ? 1.1
      : 1;

  function handleSelectPreset(value: string) {
    if (value === 'custom') {
      setPresetIndex('custom');
      setIngredients([makeIngredient('New ingredient', 1, 'piece', 0)]);
      return;
    }
    const idx = Number(value);
    setPresetIndex(idx);
    setIngredients(cloneIngredients(RECIPE_PRESETS[idx].ingredients));
  }

  function updateIngredient(id: string, patch: Partial<Ingredient>) {
    setIngredients((prev) => prev.map((ing) => (ing.id === id ? { ...ing, ...patch } : ing)));
  }

  function removeIngredient(id: string) {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, makeIngredient('New ingredient', 1, 'piece', 0)]);
  }

  const results = useMemo(() => {
    const lineItems = ingredients.map((ing) => ({
      ...ing,
      cost: ing.qty * ing.unitPrice * cityMultiplier,
    }));
    const subtotal = lineItems.reduce((sum, item) => sum + item.cost, 0);
    const addonCost = proteinAddon ?? 0;
    const total = subtotal + extraCost + addonCost;
    const perPerson = servings > 0 ? total / servings : total;

    const topDrivers = [...lineItems]
      .filter((item) => item.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 3)
      .map((item) => ({
        name: item.name,
        share: subtotal > 0 ? Math.round((item.cost / subtotal) * 100) : 0,
      }));

    return { lineItems, subtotal, total, perPerson, topDrivers };
  }, [ingredients, extraCost, servings, proteinAddon, cityMultiplier]);

  const overBenchmark = results.perPerson > HEALTHY_DIET_BENCHMARK.high;

  function handleReset() {
    setPresetIndex(0);
    setIngredients(cloneIngredients(RECIPE_PRESETS[0].ingredients));
    setServings(5);
    setExtraCost(300);
    setCity('none');
    setApplyCityMultiplier(false);
    setProteinAddon(null);
  }

  function handleExport() {
    const lines = [
      `ToolBase.com.ng — Recipe & Meal Cost summary`,
      `Recipe: ${presetIndex === 'custom' ? 'Custom' : RECIPE_PRESETS[presetIndex].name}`,
      `Servings: ${servings}`,
      '',
      ...results.lineItems.map(
        (item) => `${item.name}: ${item.qty} ${item.unit} x ${formatNaira(item.unitPrice)} = ${formatNaira(item.cost)}`
      ),
      '',
      `Subtotal: ${formatNaira(results.subtotal)}`,
      `Fuel/gas/electricity estimate: ${formatNaira(extraCost)}`,
      proteinAddon ? `Add-on: ${formatNaira(proteinAddon)}` : '',
      `Total: ${formatNaira(results.total)}`,
      `Per person: ${formatNaira(results.perPerson)}`,
      '',
      'Prices are user-entered estimates, not live market data. Verify locally before budgeting.',
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meal-cost-summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" data-locale={locale}>
      {/* Disclaimer banner */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-500">
        This is an estimation tool only. Actual market prices vary by location, season, and
        vendor — edit every field to match what you actually paid or expect to pay.
      </div>

      {/* Recipe selector */}
      <div className="rounded-xl border border-gray-200 p-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Choose a meal</label>
        <select
          className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
          value={presetIndex === 'custom' ? 'custom' : String(presetIndex)}
          onChange={(e) => handleSelectPreset(e.target.value)}
        >
          {RECIPE_PRESETS.map((preset, idx) => (
            <option key={preset.name} value={idx}>
              {preset.name} — {preset.tag}
            </option>
          ))}
          <option value="custom">Custom recipe</option>
        </select>
      </div>

      {/* Ingredients editor */}
      <div className="rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Ingredients</h3>
          <button
            type="button"
            onClick={addIngredient}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            + Add ingredient
          </button>
        </div>

        <div className="space-y-2">
          {ingredients.map((ing) => (
            <div key={ing.id} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="col-span-4 rounded-lg border border-gray-300 p-2 text-sm"
                value={ing.name}
                onChange={(e) => updateIngredient(ing.id, { name: e.target.value })}
                aria-label="Ingredient name"
              />
              <input
                type="number"
                min={0}
                step={0.1}
                className="col-span-2 rounded-lg border border-gray-300 p-2 text-sm"
                value={ing.qty}
                onChange={(e) => updateIngredient(ing.id, { qty: Number(e.target.value) })}
                aria-label="Quantity"
              />
              <select
                className="col-span-2 rounded-lg border border-gray-300 p-2 text-sm"
                value={ing.unit}
                onChange={(e) => updateIngredient(ing.id, { unit: e.target.value as Unit })}
                aria-label="Unit"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step={10}
                className="col-span-3 rounded-lg border border-gray-300 p-2 text-sm"
                value={ing.unitPrice}
                onChange={(e) => updateIngredient(ing.id, { unitPrice: Number(e.target.value) })}
                aria-label="Unit price in naira"
              />
              <button
                type="button"
                onClick={() => removeIngredient(ing.id)}
                className="col-span-1 text-gray-400 hover:text-red-500 text-sm"
                aria-label="Remove ingredient"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Local measures like "derica" and "bunch" are approximate — a derica of rice is roughly
          2.5–3kg, but exact weight varies by vendor and by grain.
        </p>
      </div>

      {/* Servings, extras, protein, city */}
      <div className="rounded-xl border border-gray-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
            value={servings}
            onChange={(e) => setServings(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fuel/gas/electricity estimate ({formatNaira(extraCost)})
          </label>
          <input
            type="range"
            min={0}
            max={800}
            step={50}
            value={extraCost}
            onChange={(e) => setExtraCost(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Protein upgrade</label>
          <div className="flex flex-wrap gap-2">
            {PROTEIN_ADDONS.map((addon) => (
              <button
                key={addon.label}
                type="button"
                onClick={() =>
                  setProteinAddon((prev) => (prev === addon.cost ? null : addon.cost))
                }
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  proteinAddon === addon.cost
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 text-gray-600'
                }`}
              >
                {addon.label} (+{formatNaira(addon.cost)})
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City (optional)</label>
          <select
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm"
            value={city}
            onChange={(e) => setCity(e.target.value as keyof typeof CITY_NOTES)}
          >
            <option value="none">Select a city</option>
            <option value="lagos">Lagos</option>
            <option value="abuja">Abuja</option>
            <option value="portharcourt">Port Harcourt</option>
            <option value="other">Other</option>
          </select>
          {city !== 'none' && (
            <div className="mt-2 text-xs text-gray-500">
              {CITY_NOTES[city]}
              {(city === 'lagos' || city === 'portharcourt') && (
                <label className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={applyCityMultiplier}
                    onChange={(e) => setApplyCityMultiplier(e.target.checked)}
                  />
                  Apply this as a rough adjustment to my totals
                </label>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="rounded-xl bg-indigo-50 p-5 space-y-4">
        <div>
          <p className="text-sm text-indigo-900">
            Total for {servings} serving{servings === 1 ? '' : 's'}
          </p>
          <p className="text-3xl font-bold text-indigo-900">{formatNaira(results.total)}</p>
          <p className="text-sm text-indigo-700">{formatNaira(results.perPerson)} per person</p>
        </div>

        {results.topDrivers.length > 0 && (
          <div className="text-sm text-indigo-800">
            <span className="font-medium">Top cost drivers: </span>
            {results.topDrivers.map((d) => `${d.name} (${d.share}%)`).join(', ')}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-indigo-900/70">
                <th className="py-1 pr-2">Ingredient</th>
                <th className="py-1 pr-2">Qty</th>
                <th className="py-1 pr-2">Unit price</th>
                <th className="py-1">Cost</th>
              </tr>
            </thead>
            <tbody>
              {results.lineItems.map((item) => (
                <tr key={item.id} className="border-t border-indigo-100">
                  <td className="py-1 pr-2">{item.name}</td>
                  <td className="py-1 pr-2">
                    {item.qty} {item.unit}
                  </td>
                  <td className="py-1 pr-2">{formatNaira(item.unitPrice)}</td>
                  <td className="py-1">{formatNaira(item.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-indigo-700">
          For comparison, the {HEALTHY_DIET_BENCHMARK.asOf} put a healthy adult diet at roughly{' '}
          {formatNaira(HEALTHY_DIET_BENCHMARK.low)}–{formatNaira(HEALTHY_DIET_BENCHMARK.high)} per
          day. {overBenchmark
            ? 'This meal, per person, is above that range — fine for a special occasion, worth checking for daily budgeting.'
            : 'This meal, per person, is within or below that range.'}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg bg-indigo-600 text-white text-sm px-4 py-2 hover:bg-indigo-700"
          >
            Export summary
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-indigo-300 text-indigo-700 text-sm px-4 py-2 hover:bg-indigo-100"
          >
            Reset / make another
          </button>
        </div>
      </div>

      <p className="text-gray-400 text-xs">
        Prices shown for preset recipes are illustrative starting points based on common Nigerian
        market ranges, not live data — this tool does not sell food, set prices, or connect to any
        market feed. Always confirm current prices locally before budgeting. Nutrition note: these
        meals are carbohydrate-heavy; balance with vegetables and protein where your budget allows.
        Check NAFDAC guidance for food safety — this tool covers cost only, not health advice.
      </p>
    </div>
  );
}
