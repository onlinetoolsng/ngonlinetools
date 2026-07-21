'use client';

import { useState } from 'react';

type HeightUnit = 'cm' | 'ftin';
type WeightUnit = 'kg' | 'lbs';
type Sex = 'male' | 'female';

interface Props {
  locale: string;
}

interface Results {
  bmi: number;
  bmiCategory: string;
  bodyFat: number;
  bodyFatCategory: string;
  method: 'navy' | 'deurenberg';
}

const BMI_CATEGORIES = [
  { max: 18.5, label: 'Underweight' },
  { max: 25, label: 'Normal weight' },
  { max: 30, label: 'Overweight' },
  { max: Infinity, label: 'Obese' },
];

function bmiCategoryFor(bmi: number): string {
  return BMI_CATEGORIES.find((c) => bmi < c.max)?.label ?? 'Obese';
}

function bodyFatCategoryFor(bf: number, sex: Sex): string {
  const bands =
    sex === 'male'
      ? [
          { max: 5, label: 'Essential fat' },
          { max: 13, label: 'Athletic' },
          { max: 17, label: 'Fit' },
          { max: 24, label: 'Acceptable' },
          { max: Infinity, label: 'Above healthy range' },
        ]
      : [
          { max: 13, label: 'Essential fat' },
          { max: 20, label: 'Athletic' },
          { max: 24, label: 'Fit' },
          { max: 31, label: 'Acceptable' },
          { max: Infinity, label: 'Above healthy range' },
        ];
  return bands.find((b) => bf < b.max)?.label ?? 'Above healthy range';
}

function toCm(value: number, unit: HeightUnit, feet?: number): number {
  if (unit === 'cm') return value;
  const ft = feet ?? 0;
  const totalInches = ft * 12 + value;
  return totalInches * 2.54;
}

function toKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value * 0.453592;
}

export default function BmiBodyFatCalculator({ locale }: Props) {
  const [age, setAge] = useState<string>('');
  const [sex, setSex] = useState<Sex>('male');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');

  const [heightCm, setHeightCm] = useState<string>('');
  const [heightFt, setHeightFt] = useState<string>('');
  const [heightIn, setHeightIn] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [waist, setWaist] = useState<string>('');
  const [neck, setNeck] = useState<string>('');
  const [hip, setHip] = useState<string>('');

  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    setError(null);
    setResults(null);

    const ageNum = parseFloat(age);
    const weightNum = parseFloat(weight);

    let heightInCm: number;
    if (heightUnit === 'cm') {
      heightInCm = parseFloat(heightCm);
    } else {
      heightInCm = toCm(parseFloat(heightIn || '0'), 'ftin', parseFloat(heightFt || '0'));
    }

    const weightInKg = toKg(weightNum, weightUnit);

    if (
      !ageNum || ageNum < 16 || ageNum > 100 ||
      !heightInCm || heightInCm < 100 || heightInCm > 250 ||
      !weightInKg || weightInKg < 30 || weightInKg > 300
    ) {
      setError('Please enter a realistic age (16-100), height and weight to get a result.');
      return;
    }

    const heightM = heightInCm / 100;
    const bmi = weightInKg / (heightM * heightM);
    const bmiCategory = bmiCategoryFor(bmi);

    const waistNum = parseFloat(waist);
    const neckNum = parseFloat(neck);
    const hipNum = parseFloat(hip);

    let bodyFat: number;
    let method: 'navy' | 'deurenberg';

    const hasNavyInputs =
      waistNum > 0 && neckNum > 0 && waistNum > neckNum && (sex === 'male' || hipNum > 0);

    if (hasNavyInputs) {
      method = 'navy';
      if (sex === 'male') {
        bodyFat =
          495 /
            (1.0324 -
              0.19077 * Math.log10(waistNum - neckNum) +
              0.15456 * Math.log10(heightInCm)) -
          450;
      } else {
        bodyFat =
          495 /
            (1.29579 -
              0.35004 * Math.log10(waistNum + hipNum - neckNum) +
              0.221 * Math.log10(heightInCm)) -
          450;
      }
    } else {
      method = 'deurenberg';
      const sexVal = sex === 'male' ? 1 : 0;
      bodyFat = 1.2 * bmi + 0.23 * ageNum - 10.8 * sexVal - 5.4;
    }

    bodyFat = Math.max(2, Math.min(bodyFat, 70));

    setResults({
      bmi: Math.round(bmi * 10) / 10,
      bmiCategory,
      bodyFat: Math.round(bodyFat * 10) / 10,
      bodyFatCategory: bodyFatCategoryFor(bodyFat, sex),
      method,
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 32"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as Sex)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Height</label>
            <button
              type="button"
              onClick={() => setHeightUnit(heightUnit === 'cm' ? 'ftin' : 'cm')}
              className="text-xs text-indigo-600 font-medium"
            >
              Switch to {heightUnit === 'cm' ? 'ft/in' : 'cm'}
            </button>
          </div>
          {heightUnit === 'cm' ? (
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="e.g. 170"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div className="flex gap-2">
              <input
                type="number"
                value={heightFt}
                onChange={(e) => setHeightFt(e.target.value)}
                placeholder="ft"
                className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="number"
                value={heightIn}
                onChange={(e) => setHeightIn(e.target.value)}
                placeholder="in"
                className="w-1/2 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Weight</label>
            <button
              type="button"
              onClick={() => setWeightUnit(weightUnit === 'kg' ? 'lbs' : 'kg')}
              className="text-xs text-indigo-600 font-medium"
            >
              Switch to {weightUnit === 'kg' ? 'lbs' : 'kg'}
            </button>
          </div>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={weightUnit === 'kg' ? 'e.g. 68' : 'e.g. 150'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-indigo-600 font-medium"
          >
            {showAdvanced ? 'Hide' : 'Add'} waist/neck measurements for a more accurate body fat estimate
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Waist (cm)</label>
                <input
                  type="number"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Neck (cm)</label>
                <input
                  type="number"
                  value={neck}
                  onChange={(e) => setNeck(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {sex === 'female' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hip (cm)</label>
                  <input
                    type="number"
                    value={hip}
                    onChange={(e) => setHip(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleCalculate}
          className="w-full rounded-xl bg-indigo-600 text-white font-semibold py-3 hover:bg-indigo-700 transition"
        >
          Calculate BMI & Body Fat
        </button>
      </div>

      {results && (
        <div className="rounded-xl bg-indigo-50 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">BMI</p>
              <p className="text-2xl font-bold text-indigo-900">{results.bmi}</p>
              <p className="text-sm font-medium text-indigo-700">{results.bmiCategory}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Body Fat %</p>
              <p className="text-2xl font-bold text-indigo-900">{results.bodyFat}%</p>
              <p className="text-sm font-medium text-indigo-700">{results.bodyFatCategory}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Body fat estimated using the {results.method === 'navy' ? 'U.S. Navy circumference method' : 'Deurenberg formula (BMI-based estimate)'}.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        This calculator gives an estimate only and is not a medical diagnosis. BMI does not distinguish
        muscle from fat and can be less accurate for athletes, older adults, and pregnant women. The
        body fat estimate is approximate, especially without waist/neck measurements. Always consult a
        doctor or registered dietitian before making health decisions.
      </p>
    </div>
  );
}
