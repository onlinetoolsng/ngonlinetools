'use client';

import { useMemo, useState } from 'react';

type Gender = 'male' | 'female';
type ActivityLevel =
  | 'sedentary'
  | 'lightly'
  | 'moderately'
  | 'very'
  | 'extremely';
type Goal = 'maintenance' | 'mild_deficit' | 'moderate_deficit' | 'surplus';
type WeightUnit = 'kg' | 'lbs';
type HeightUnit = 'cm' | 'ftin';
type Tab = 'needs' | 'foods' | 'tracker';

interface FoodItem {
  id: string;
  name: string;
  category:
    | 'Swallows'
    | 'Soups'
    | 'Staples'
    | 'Proteins'
    | 'Snacks'
    | 'Drinks'
    | 'Fruits & Veg';
  caloriesPer100g: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  portionDescription: string;
  portionGrams: number;
  notes?: string;
}

interface LogEntry {
  logId: string;
  foodId: string;
  grams: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly: 1.375,
  moderately: 1.55,
  very: 1.725,
  extremely: 1.9,
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary (little to no exercise)',
  lightly: 'Lightly active (1-3 days/week)',
  moderately: 'Moderately active (3-5 days/week)',
  very: 'Very active (6-7 days/week)',
  extremely: 'Extremely active (physical job + training)',
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  maintenance: 0,
  mild_deficit: -250,
  moderate_deficit: -500,
  surplus: 300,
};

const GOAL_LABELS: Record<Goal, string> = {
  maintenance: 'Maintain weight',
  mild_deficit: 'Mild deficit (slow weight loss)',
  moderate_deficit: 'Moderate deficit (faster weight loss)',
  surplus: 'Surplus (weight/muscle gain)',
};

// Approximate values compiled from public Nigerian/West African food
// composition references. Portions and macros vary by recipe, oil
// quantity, and preparation method — treat as estimates.
const FOOD_DATA: FoodItem[] = [
  { id: 'jollof-rice', name: 'Jollof rice', category: 'Staples', caloriesPer100g: 180, proteinG: 3.5, carbsG: 28, fatG: 6, portionDescription: '1 standard plate (~300g)', portionGrams: 300, notes: 'Varies with oil quantity and added protein' },
  { id: 'white-rice-stew', name: 'White rice with stew', category: 'Staples', caloriesPer100g: 170, proteinG: 3, carbsG: 27, fatG: 5.5, portionDescription: '1 standard plate (~300g)', portionGrams: 300 },
  { id: 'fried-rice', name: 'Nigerian fried rice', category: 'Staples', caloriesPer100g: 190, proteinG: 4, carbsG: 26, fatG: 7.5, portionDescription: '1 standard plate (~300g)', portionGrams: 300 },
  { id: 'eba', name: 'Eba (garri swallow)', category: 'Swallows', caloriesPer100g: 160, proteinG: 0.8, carbsG: 38, fatG: 0.2, portionDescription: '1 wrap (~250g)', portionGrams: 250 },
  { id: 'pounded-yam', name: 'Pounded yam', category: 'Swallows', caloriesPer100g: 130, proteinG: 1.5, carbsG: 30, fatG: 0.2, portionDescription: '1 wrap (~250g)', portionGrams: 250 },
  { id: 'amala', name: 'Amala', category: 'Swallows', caloriesPer100g: 122, proteinG: 1.6, carbsG: 28, fatG: 0.3, portionDescription: '1 wrap (~250g)', portionGrams: 250 },
  { id: 'fufu', name: 'Fufu (cassava)', category: 'Swallows', caloriesPer100g: 155, proteinG: 0.9, carbsG: 37, fatG: 0.2, portionDescription: '1 wrap (~250g)', portionGrams: 250 },
  { id: 'semo', name: 'Semovita swallow', category: 'Swallows', caloriesPer100g: 130, proteinG: 2.5, carbsG: 28, fatG: 0.3, portionDescription: '1 wrap (~250g)', portionGrams: 250 },
  { id: 'tuwo-shinkafa', name: 'Tuwo shinkafa', category: 'Swallows', caloriesPer100g: 125, proteinG: 2.2, carbsG: 27, fatG: 0.3, portionDescription: '1 wrap (~250g)', portionGrams: 250 },
  { id: 'egusi-soup', name: 'Egusi soup', category: 'Soups', caloriesPer100g: 210, proteinG: 9, carbsG: 6, fatG: 17, portionDescription: '1 serving bowl (~200g)', portionGrams: 200, notes: 'Oil-heavy; varies widely by preparation' },
  { id: 'okra-soup', name: 'Okra soup', category: 'Soups', caloriesPer100g: 130, proteinG: 7, carbsG: 6, fatG: 8, portionDescription: '1 serving bowl (~200g)', portionGrams: 200 },
  { id: 'ogbono-soup', name: 'Ogbono soup', category: 'Soups', caloriesPer100g: 200, proteinG: 6, carbsG: 8, fatG: 16, portionDescription: '1 serving bowl (~200g)', portionGrams: 200 },
  { id: 'afang-soup', name: 'Afang soup', category: 'Soups', caloriesPer100g: 175, proteinG: 8, carbsG: 6, fatG: 13, portionDescription: '1 serving bowl (~200g)', portionGrams: 200 },
  { id: 'edikang-ikong', name: 'Edikang Ikong soup', category: 'Soups', caloriesPer100g: 160, proteinG: 8, carbsG: 5, fatG: 11, portionDescription: '1 serving bowl (~200g)', portionGrams: 200 },
  { id: 'pepper-soup', name: 'Pepper soup (goat meat)', category: 'Soups', caloriesPer100g: 110, proteinG: 12, carbsG: 2, fatG: 6, portionDescription: '1 bowl (~350g incl. meat)', portionGrams: 350 },
  { id: 'banga-soup', name: 'Banga soup', category: 'Soups', caloriesPer100g: 195, proteinG: 6, carbsG: 6, fatG: 16, portionDescription: '1 serving bowl (~200g)', portionGrams: 200 },
  { id: 'moi-moi', name: 'Moi moi', category: 'Proteins', caloriesPer100g: 150, proteinG: 9, carbsG: 12, fatG: 8, portionDescription: '1 medium wrap (~150g)', portionGrams: 150 },
  { id: 'akara', name: 'Akara (bean cake)', category: 'Snacks', caloriesPer100g: 290, proteinG: 12, carbsG: 18, fatG: 19, portionDescription: '3 pieces (~90g)', portionGrams: 90, notes: 'Deep-fried; oil absorption varies' },
  { id: 'suya', name: 'Suya (beef)', category: 'Proteins', caloriesPer100g: 250, proteinG: 26, carbsG: 4, fatG: 15, portionDescription: '1 standard portion (~150g)', portionGrams: 150 },
  { id: 'grilled-chicken', name: 'Grilled chicken (no skin)', category: 'Proteins', caloriesPer100g: 165, proteinG: 31, carbsG: 0, fatG: 3.6, portionDescription: '1 piece (~120g)', portionGrams: 120 },
  { id: 'fried-chicken', name: 'Fried chicken', category: 'Proteins', caloriesPer100g: 245, proteinG: 24, carbsG: 4, fatG: 15, portionDescription: '1 piece (~120g)', portionGrams: 120 },
  { id: 'fried-fish', name: 'Fried fish (mackerel/titus)', category: 'Proteins', caloriesPer100g: 220, proteinG: 22, carbsG: 1, fatG: 14, portionDescription: '1 piece (~130g)', portionGrams: 130 },
  { id: 'boiled-egg', name: 'Boiled egg', category: 'Proteins', caloriesPer100g: 155, proteinG: 13, carbsG: 1.1, fatG: 11, portionDescription: '1 large egg (~50g)', portionGrams: 50 },
  { id: 'beans-porridge', name: 'Beans porridge (ewa agoyin style)', category: 'Staples', caloriesPer100g: 135, proteinG: 8, carbsG: 20, fatG: 3, portionDescription: '1 serving bowl (~250g)', portionGrams: 250 },
  { id: 'yam-boiled', name: 'Boiled yam', category: 'Staples', caloriesPer100g: 118, proteinG: 1.5, carbsG: 28, fatG: 0.2, portionDescription: '3 medium slices (~250g)', portionGrams: 250 },
  { id: 'fried-yam', name: 'Fried yam', category: 'Snacks', caloriesPer100g: 200, proteinG: 2, carbsG: 30, fatG: 8, portionDescription: '4-5 pieces (~200g)', portionGrams: 200 },
  { id: 'plantain-fried', name: 'Fried plantain (dodo)', category: 'Snacks', caloriesPer100g: 240, proteinG: 1.5, carbsG: 32, fatG: 12, portionDescription: '5-6 slices (~150g)', portionGrams: 150 },
  { id: 'plantain-boiled', name: 'Boiled plantain', category: 'Staples', caloriesPer100g: 122, proteinG: 1.3, carbsG: 32, fatG: 0.4, portionDescription: '1 medium plantain (~150g)', portionGrams: 150 },
  { id: 'plantain-porridge', name: 'Plantain porridge (asaro-style)', category: 'Staples', caloriesPer100g: 145, proteinG: 3, carbsG: 22, fatG: 5, portionDescription: '1 serving bowl (~300g)', portionGrams: 300 },
  { id: 'yam-porridge', name: 'Yam porridge (asaro)', category: 'Staples', caloriesPer100g: 140, proteinG: 2.5, carbsG: 25, fatG: 4, portionDescription: '1 serving bowl (~300g)', portionGrams: 300 },
  { id: 'chin-chin', name: 'Chin chin', category: 'Snacks', caloriesPer100g: 480, proteinG: 7, carbsG: 60, fatG: 24, portionDescription: '1 small handful (~50g)', portionGrams: 50 },
  { id: 'puff-puff', name: 'Puff puff', category: 'Snacks', caloriesPer100g: 330, proteinG: 6, carbsG: 40, fatG: 16, portionDescription: '3 pieces (~90g)', portionGrams: 90 },
  { id: 'meat-pie', name: 'Meat pie', category: 'Snacks', caloriesPer100g: 300, proteinG: 8, carbsG: 30, fatG: 17, portionDescription: '1 pie (~120g)', portionGrams: 120 },
  { id: 'gala', name: 'Gala sausage roll', category: 'Snacks', caloriesPer100g: 320, proteinG: 9, carbsG: 25, fatG: 21, portionDescription: '1 roll (~60g)', portionGrams: 60 },
  { id: 'boli', name: 'Roasted plantain (bole)', category: 'Snacks', caloriesPer100g: 130, proteinG: 1.3, carbsG: 32, fatG: 0.3, portionDescription: '1 medium plantain (~150g)', portionGrams: 150 },
  { id: 'roasted-corn', name: 'Roasted corn', category: 'Snacks', caloriesPer100g: 130, proteinG: 4, carbsG: 27, fatG: 1.5, portionDescription: '1 cob (~150g)', portionGrams: 150 },
  { id: 'coconut-rice', name: 'Coconut rice', category: 'Staples', caloriesPer100g: 200, proteinG: 3.5, carbsG: 27, fatG: 9, portionDescription: '1 standard plate (~300g)', portionGrams: 300 },
  { id: 'ofada-rice-sauce', name: 'Ofada rice with ayamase sauce', category: 'Staples', caloriesPer100g: 210, proteinG: 5, carbsG: 24, fatG: 11, portionDescription: '1 standard plate (~300g)', portionGrams: 300 },
  { id: 'peppered-snail', name: 'Peppered snail', category: 'Proteins', caloriesPer100g: 140, proteinG: 21, carbsG: 4, fatG: 4, portionDescription: '3 pieces (~120g)', portionGrams: 120 },
  { id: 'nkwobi', name: 'Nkwobi', category: 'Proteins', caloriesPer100g: 260, proteinG: 15, carbsG: 3, fatG: 21, portionDescription: '1 serving (~200g)', portionGrams: 200 },
  { id: 'zobo', name: 'Zobo drink', category: 'Drinks', caloriesPer100g: 45, proteinG: 0.1, carbsG: 11, fatG: 0, portionDescription: '1 glass (~250ml)', portionGrams: 250, notes: 'Depends on added sugar' },
  { id: 'chapman', name: 'Chapman', category: 'Drinks', caloriesPer100g: 55, proteinG: 0, carbsG: 13, fatG: 0, portionDescription: '1 glass (~250ml)', portionGrams: 250 },
  { id: 'kunu', name: 'Kunu drink', category: 'Drinks', caloriesPer100g: 60, proteinG: 1.2, carbsG: 12, fatG: 0.8, portionDescription: '1 glass (~250ml)', portionGrams: 250 },
  { id: 'palm-wine', name: 'Palm wine', category: 'Drinks', caloriesPer100g: 40, proteinG: 0.2, carbsG: 5, fatG: 0, portionDescription: '1 glass (~250ml)', portionGrams: 250 },
  { id: 'malt-drink', name: 'Malt drink', category: 'Drinks', caloriesPer100g: 45, proteinG: 0.4, carbsG: 10.5, fatG: 0, portionDescription: '1 bottle (~330ml)', portionGrams: 330 },
  { id: 'banana', name: 'Banana', category: 'Fruits & Veg', caloriesPer100g: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, portionDescription: '1 medium (~120g)', portionGrams: 120 },
  { id: 'watermelon', name: 'Watermelon', category: 'Fruits & Veg', caloriesPer100g: 30, proteinG: 0.6, carbsG: 8, fatG: 0.2, portionDescription: '1 slice (~200g)', portionGrams: 200 },
  { id: 'pawpaw', name: 'Pawpaw (papaya)', category: 'Fruits & Veg', caloriesPer100g: 43, proteinG: 0.5, carbsG: 11, fatG: 0.3, portionDescription: '1 cup cubed (~150g)', portionGrams: 150 },
  { id: 'orange', name: 'Orange', category: 'Fruits & Veg', caloriesPer100g: 47, proteinG: 0.9, carbsG: 12, fatG: 0.1, portionDescription: '1 medium (~150g)', portionGrams: 150 },
  { id: 'garden-egg', name: 'Garden egg', category: 'Fruits & Veg', caloriesPer100g: 25, proteinG: 1, carbsG: 6, fatG: 0.2, portionDescription: '3 pieces (~120g)', portionGrams: 120 },
  { id: 'groundnut', name: 'Roasted groundnut (peanuts)', category: 'Snacks', caloriesPer100g: 570, proteinG: 25, carbsG: 16, fatG: 48, portionDescription: '1 small cup (~50g)', portionGrams: 50 },
];

const FOOD_CATEGORIES = [
  'All',
  'Swallows',
  'Soups',
  'Staples',
  'Proteins',
  'Snacks',
  'Drinks',
  'Fruits & Veg',
] as const;

const DATA_LAST_UPDATED = '2026-07-22';

function round(n: number, dp = 0) {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface Props {
  locale: string;
}

export default function DailyCalorieNigerianFoodCalculator({ locale }: Props) {
  const [tab, setTab] = useState<Tab>('needs');

  // Personal info state
  const [gender, setGender] = useState<Gender>('female');
  const [age, setAge] = useState<string>('28');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCm, setHeightCm] = useState<string>('165');
  const [heightFt, setHeightFt] = useState<string>('5');
  const [heightIn, setHeightIn] = useState<string>('5');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weightKg, setWeightKg] = useState<string>('65');
  const [activity, setActivity] = useState<ActivityLevel>('sedentary');
  const [goal, setGoal] = useState<Goal>('maintenance');
  const [errors, setErrors] = useState<string[]>([]);

  // Food lookup state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof FOOD_CATEGORIES)[number]>('All');

  // Meal log state
  const [log, setLog] = useState<LogEntry[]>([]);

  const heightCmValue = useMemo(() => {
    if (heightUnit === 'cm') return parseFloat(heightCm) || 0;
    const ft = parseFloat(heightFt) || 0;
    const inch = parseFloat(heightIn) || 0;
    return ft * 30.48 + inch * 2.54;
  }, [heightUnit, heightCm, heightFt, heightIn]);

  const weightKgValue = useMemo(() => {
    if (weightUnit === 'kg') return parseFloat(weightKg) || 0;
    return (parseFloat(weightKg) || 0) / 2.20462;
  }, [weightUnit, weightKg]);

  const ageValue = parseFloat(age) || 0;

  const validation = useMemo(() => {
    const errs: string[] = [];
    if (!ageValue || ageValue < 15 || ageValue > 100) {
      errs.push('Age should be between 15 and 100 years.');
    }
    if (!heightCmValue || heightCmValue < 120 || heightCmValue > 230) {
      errs.push('Height looks out of range — please check the value entered.');
    }
    if (!weightKgValue || weightKgValue < 30 || weightKgValue > 250) {
      errs.push('Weight looks out of range — please check the value entered.');
    }
    return errs;
  }, [ageValue, heightCmValue, weightKgValue]);

  const bmr = useMemo(() => {
    if (validation.length > 0) return 0;
    if (gender === 'male') {
      return (
        88.362 +
        13.397 * weightKgValue +
        4.799 * heightCmValue -
        5.677 * ageValue
      );
    }
    return (
      447.593 +
      9.247 * weightKgValue +
      3.098 * heightCmValue -
      4.33 * ageValue
    );
  }, [gender, weightKgValue, heightCmValue, ageValue, validation.length]);

  const tdee = useMemo(() => bmr * ACTIVITY_MULTIPLIERS[activity], [bmr, activity]);

  const targetCalories = useMemo(
    () => Math.max(1000, tdee + GOAL_ADJUSTMENTS[goal]),
    [tdee, goal]
  );

  const macroTargets = useMemo(() => {
    // Nigerian-diet-context split: higher carbs from staples.
    const carbsCals = targetCalories * 0.55;
    const proteinCals = targetCalories * 0.2;
    const fatCals = targetCalories * 0.25;
    return {
      carbsG: round(carbsCals / 4),
      proteinG: round(proteinCals / 4),
      fatG: round(fatCals / 9),
    };
  }, [targetCalories]);

  const filteredFoods = useMemo(() => {
    return FOOD_DATA.filter((f) => {
      const matchesCategory = category === 'All' || f.category === category;
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  function addToLog(food: FoodItem) {
    setLog((prev) => [
      ...prev,
      { logId: uid(), foodId: food.id, grams: food.portionGrams },
    ]);
    setTab('tracker');
  }

  function updateLogGrams(logId: string, grams: number) {
    setLog((prev) =>
      prev.map((entry) =>
        entry.logId === logId ? { ...entry, grams: Math.max(0, grams) } : entry
      )
    );
  }

  function removeLogEntry(logId: string) {
    setLog((prev) => prev.filter((entry) => entry.logId !== logId));
  }

  function clearLog() {
    setLog([]);
  }

  const logWithFood = useMemo(
    () =>
      log
        .map((entry) => {
          const food = FOOD_DATA.find((f) => f.id === entry.foodId);
          if (!food) return null;
          const ratio = entry.grams / 100;
          return {
            ...entry,
            food,
            calories: food.caloriesPer100g * ratio,
            protein: food.proteinG * ratio,
            carbs: food.carbsG * ratio,
            fat: food.fatG * ratio,
          };
        })
        .filter(Boolean) as Array<{
        logId: string;
        foodId: string;
        grams: number;
        food: FoodItem;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }>,
    [log]
  );

  const logTotals = useMemo(() => {
    return logWithFood.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [logWithFood]);

  const percentOfTarget =
    targetCalories > 0 ? round((logTotals.calories / targetCalories) * 100) : 0;

  const tabButtonClass = (t: Tab) =>
    `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
      tab === t
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <div className="w-full max-w-3xl mx-auto" data-locale={locale}>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button className={tabButtonClass('needs')} onClick={() => setTab('needs')}>
          Daily Needs Calculator
        </button>
        <button className={tabButtonClass('foods')} onClick={() => setTab('foods')}>
          Food Calorie Lookup
        </button>
        <button className={tabButtonClass('tracker')} onClick={() => setTab('tracker')}>
          Meal Tracker {log.length > 0 ? `(${log.length})` : ''}
        </button>
      </div>

      {tab === 'needs' && (
        <div className="rounded-xl border border-gray-200 p-5 bg-white space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2"
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age (years)
              </label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 p-2"
                value={age}
                min={15}
                max={100}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Height
                </label>
                <button
                  type="button"
                  className="text-xs text-indigo-600"
                  onClick={() =>
                    setHeightUnit(heightUnit === 'cm' ? 'ftin' : 'cm')
                  }
                >
                  Switch to {heightUnit === 'cm' ? 'ft/in' : 'cm'}
                </button>
              </div>
              {heightUnit === 'cm' ? (
                <input
                  type="number"
                  className="w-full rounded-lg border border-gray-300 p-2"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="cm"
                />
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="w-1/2 rounded-lg border border-gray-300 p-2"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    placeholder="ft"
                  />
                  <input
                    type="number"
                    className="w-1/2 rounded-lg border border-gray-300 p-2"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    placeholder="in"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Weight
                </label>
                <button
                  type="button"
                  className="text-xs text-indigo-600"
                  onClick={() =>
                    setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')
                  }
                >
                  Switch to {weightUnit === 'kg' ? 'lbs' : 'kg'}
                </button>
              </div>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 p-2"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder={weightUnit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activity level
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2"
                value={activity}
                onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              >
                {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((key) => (
                  <option key={key} value={key}>
                    {ACTIVITY_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2"
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
              >
                {(Object.keys(GOAL_LABELS) as Goal[]).map((key) => (
                  <option key={key} value={key}>
                    {GOAL_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {validation.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 space-y-1">
              {validation.map((msg) => (
                <p key={msg}>{msg}</p>
              ))}
            </div>
          )}

          {validation.length === 0 && (
            <div className="rounded-xl bg-indigo-50 p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-500">BMR</p>
                  <p className="text-lg font-semibold text-indigo-700">
                    {round(bmr)} kcal
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">TDEE</p>
                  <p className="text-lg font-semibold text-indigo-700">
                    {round(tdee)} kcal
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Target ({GOAL_LABELS[goal]})</p>
                  <p className="text-lg font-semibold text-indigo-700">
                    {round(targetCalories)} kcal
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center pt-2 border-t border-indigo-100">
                <div>
                  <p className="text-xs text-gray-500">Carbs</p>
                  <p className="text-sm font-medium">{macroTargets.carbsG} g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Protein</p>
                  <p className="text-sm font-medium">{macroTargets.proteinG} g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fat</p>
                  <p className="text-sm font-medium">{macroTargets.fatG} g</p>
                </div>
              </div>
              {Math.abs(GOAL_ADJUSTMENTS[goal]) >= 500 && (
                <p className="text-xs text-amber-700">
                  A deficit this large should generally be approached gradually
                  and under guidance from a health professional.
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400">
            This tool provides general estimates based on public data and
            formulas. It is not medical, dietary, or personalized professional
            advice. Consult a registered dietitian or doctor for health
            decisions. Values vary by individual physiology, preparation, and
            portions. All calculations happen in your browser — no data is
            sent or stored on our servers.
          </p>
        </div>
      )}

      {tab === 'foods' && (
        <div className="rounded-xl border border-gray-200 p-5 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search foods (e.g. Eba, Jollof, Suya)"
              className="flex-1 rounded-lg border border-gray-300 p-2"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-lg border border-gray-300 p-2"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as (typeof FOOD_CATEGORIES)[number])
              }
            >
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[28rem] overflow-y-auto pr-1">
            {filteredFoods.map((food) => (
              <div
                key={food.id}
                className="rounded-xl border border-gray-200 p-3 flex flex-col justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800">{food.name}</p>
                  <p className="text-xs text-gray-500">{food.portionDescription}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {round((food.caloriesPer100g * food.portionGrams) / 100)} kcal
                    · P {round((food.proteinG * food.portionGrams) / 100)}g · C{' '}
                    {round((food.carbsG * food.portionGrams) / 100)}g · F{' '}
                    {round((food.fatG * food.portionGrams) / 100)}g
                  </p>
                  {food.notes && (
                    <p className="text-xs text-gray-400 mt-1">{food.notes}</p>
                  )}
                </div>
                <button
                  className="mt-2 self-start rounded-lg bg-indigo-600 text-white text-xs px-3 py-1.5 hover:bg-indigo-700"
                  onClick={() => addToLog(food)}
                >
                  Add to meal log
                </button>
              </div>
            ))}
            {filteredFoods.length === 0 && (
              <p className="text-sm text-gray-500 col-span-2">
                No foods match that search.
              </p>
            )}
          </div>

          <p className="text-xs text-gray-400">
            Estimates only — actual values depend on recipe, oil quantity, and
            preparation. Compiled from public references including the West
            African Food Composition Table and published Nigerian dietary
            studies. Data last reviewed {DATA_LAST_UPDATED}.
          </p>
        </div>
      )}

      {tab === 'tracker' && (
        <div className="rounded-xl border border-gray-200 p-5 bg-white space-y-4">
          {logWithFood.length === 0 ? (
            <p className="text-sm text-gray-500">
              No foods logged yet. Go to “Food Calorie Lookup” to add items.
            </p>
          ) : (
            <div className="space-y-3">
              {logWithFood.map((entry) => (
                <div
                  key={entry.logId}
                  className="rounded-xl border border-gray-200 p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-800">{entry.food.name}</p>
                    <p className="text-xs text-gray-500">
                      {round(entry.calories)} kcal · P {round(entry.protein)}g · C{' '}
                      {round(entry.carbs)}g · F {round(entry.fat)}g
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={10}
                      max={800}
                      step={10}
                      value={entry.grams}
                      onChange={(e) =>
                        updateLogGrams(entry.logId, parseInt(e.target.value, 10))
                      }
                      className="w-28"
                    />
                    <span className="text-xs text-gray-500 w-14">
                      {entry.grams}g
                    </span>
                    <button
                      className="text-xs text-red-500 hover:underline"
                      onClick={() => removeLogEntry(entry.logId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {logWithFood.length > 0 && (
            <div className="rounded-xl bg-indigo-50 p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-500">Calories</p>
                  <p className="text-lg font-semibold text-indigo-700">
                    {round(logTotals.calories)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Protein</p>
                  <p className="text-sm font-medium">{round(logTotals.protein)}g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Carbs</p>
                  <p className="text-sm font-medium">{round(logTotals.carbs)}g</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fat</p>
                  <p className="text-sm font-medium">{round(logTotals.fat)}g</p>
                </div>
              </div>
              {targetCalories > 0 && validation.length === 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress toward daily target</span>
                    <span>{percentOfTarget}%</span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${Math.min(100, percentOfTarget)}%` }}
                    />
                  </div>
                </div>
              )}
              <button
                className="text-xs text-gray-500 hover:underline"
                onClick={clearLog}
              >
                Clear log
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400">
            This tool provides general estimates based on public data and
            formulas. It is not medical, dietary, or personalized professional
            advice. All calculations happen in your browser — nothing in your
            meal log is sent or stored on our servers, and it clears when you
            leave the page.
          </p>
        </div>
      )}
    </div>
  );
}
