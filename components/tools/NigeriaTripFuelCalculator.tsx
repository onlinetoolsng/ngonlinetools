'use client';

import { useMemo, useState } from 'react';

/**
 * components/tools/everyday/NigeriaTripFuelCalculator.tsx
 *
 * Pure client-side calculator. No SEO responsibility, no schema, no registry
 * imports — the parent server component (page.tsx) owns all of that.
 *
 * Fuel price default is a hardcoded constant that must be updated manually,
 * roughly weekly, by the site owner. There is no live pricing API wired in —
 * Nigeria's post-subsidy-removal pump price varies too much by state/depot
 * for any single "current price" API to be reliable, so a manual default +
 * a user-adjustable slider is the honest approach here.
 */

// ---- Manually maintained defaults (update weekly) --------------------
const PETROL_PRICE_NGN = 1150; // national-ish blended estimate
const DIESEL_PRICE_NGN = 1350;
const PRICE_LAST_UPDATED = '2026-07-15';

type FuelType = 'petrol' | 'diesel';

interface RoutePreset {
  label: string;
  km: number;
}

const ROUTE_PRESETS: RoutePreset[] = [
  { label: 'Lagos → Ibadan', km: 128 },
  { label: 'Lagos → Abuja', km: 756 },
  { label: 'Abuja → Kano', km: 356 },
  { label: 'Lagos → Benin City', km: 320 },
  { label: 'Port Harcourt → Owerri', km: 100 },
];

interface VehiclePreset {
  label: string;
  litresPer100km: number;
}

const VEHICLE_PRESETS: VehiclePreset[] = [
  { label: 'Small car (e.g. Toyota Corolla, Kia Rio)', litresPer100km: 8.5 },
  { label: 'Mid-size sedan (e.g. Toyota Camry, Honda Accord)', litresPer100km: 10 },
  { label: 'SUV / 4x4 (e.g. Toyota Prado, Honda CR-V)', litresPer100km: 12.5 },
  { label: 'Minibus (e.g. Toyota HiAce)', litresPer100km: 15 },
  { label: 'Truck / haulage', litresPer100km: 22 },
  { label: 'Custom (enter your own)', litresPer100km: 0 },
];

function formatNaira(value: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function NigeriaTripFuelCalculator() {
  const [distance, setDistance] = useState<number>(120);
  const [vehicleIndex, setVehicleIndex] = useState<number>(0);
  const [customEfficiency, setCustomEfficiency] = useState<number>(9);
  const [drivingMode, setDrivingMode] = useState<'highway' | 'city'>('highway');
  const [fuelType, setFuelType] = useState<FuelType>('petrol');
  const [price, setPrice] = useState<number>(PETROL_PRICE_NGN);
  const [roundTrip, setRoundTrip] = useState<boolean>(false);
  const [heavyLoad, setHeavyLoad] = useState<boolean>(false);
  const [contingency, setContingency] = useState<boolean>(false);
  const [distanceError, setDistanceError] = useState<string>('');
  const [efficiencyError, setEfficiencyError] = useState<string>('');

  const selectedVehicle = VEHICLE_PRESETS[vehicleIndex];
  const isCustomVehicle = selectedVehicle.litresPer100km === 0;
  const baseEfficiency = isCustomVehicle ? customEfficiency : selectedVehicle.litresPer100km;

  function handleFuelTypeChange(next: FuelType) {
    setFuelType(next);
    setPrice(next === 'petrol' ? PETROL_PRICE_NGN : DIESEL_PRICE_NGN);
  }

  function handleDistanceChange(value: number) {
    if (Number.isNaN(value) || value <= 0) {
      setDistanceError('Enter a distance greater than 0 km.');
    } else {
      setDistanceError('');
    }
    setDistance(value);
  }

  function handleEfficiencyChange(value: number) {
    if (Number.isNaN(value) || value <= 0 || value > 60) {
      setEfficiencyError('Enter a realistic efficiency for your car (check your manual or typical values for Nigerian roads).');
    } else {
      setEfficiencyError('');
    }
    setCustomEfficiency(value);
  }

  const results = useMemo(() => {
    if (distance <= 0 || baseEfficiency <= 0) {
      return null;
    }

    let effectiveEfficiency = baseEfficiency;

    // City/highway adjustment — Lagos/Abuja traffic materially raises consumption
    if (drivingMode === 'city') {
      effectiveEfficiency *= 1.25;
    }

    // Heavy load / full passenger load adjustment
    if (heavyLoad) {
      effectiveEfficiency *= 1.15;
    }

    const oneWayDistance = distance;
    const totalDistance = roundTrip ? distance * 2 : distance;

    let litresNeeded = (totalDistance / 100) * effectiveEfficiency;
    let totalCost = litresNeeded * price;

    if (contingency) {
      litresNeeded *= 1.08;
      totalCost *= 1.08;
    }

    const perKmCost = totalCost / totalDistance;

    return {
      oneWayDistance,
      totalDistance,
      litresNeeded,
      totalCost,
      perKmCost,
    };
  }, [distance, baseEfficiency, drivingMode, heavyLoad, roundTrip, contingency, price]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        {/* Distance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trip distance (km)
          </label>
          <input
            type="number"
            min={1}
            value={distance}
            onChange={(e) => handleDistanceChange(parseFloat(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {distanceError && (
            <p className="mt-1 text-sm text-red-600">{distanceError}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {ROUTE_PRESETS.map((route) => (
              <button
                key={route.label}
                type="button"
                onClick={() => handleDistanceChange(route.km)}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
              >
                {route.label} ({route.km} km)
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle efficiency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle
          </label>
          <select
            value={vehicleIndex}
            onChange={(e) => setVehicleIndex(parseInt(e.target.value, 10))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {VEHICLE_PRESETS.map((v, i) => (
              <option key={v.label} value={i}>
                {v.label}
              </option>
            ))}
          </select>

          {isCustomVehicle && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuel efficiency (litres / 100 km)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                step={0.1}
                value={customEfficiency}
                onChange={(e) => handleEfficiencyChange(parseFloat(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {efficiencyError && (
                <p className="mt-1 text-sm text-red-600">{efficiencyError}</p>
              )}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setDrivingMode('highway')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                drivingMode === 'highway'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Highway driving
            </button>
            <button
              type="button"
              onClick={() => setDrivingMode('city')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                drivingMode === 'city'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              City / heavy traffic
            </button>
          </div>
        </div>

        {/* Fuel type + price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fuel type &amp; price per litre
          </label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleFuelTypeChange('petrol')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                fuelType === 'petrol'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Petrol (PMS)
            </button>
            <button
              type="button"
              onClick={() => handleFuelTypeChange('diesel')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                fuelType === 'diesel'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              Diesel (AGO)
            </button>
          </div>

          <input
            type="range"
            min={800}
            max={2000}
            step={10}
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-600">{formatNaira(price)} / litre</span>
            <button
              type="button"
              onClick={() =>
                setPrice(fuelType === 'petrol' ? PETROL_PRICE_NGN : DIESEL_PRICE_NGN)
              }
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Use current average
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Current average last updated: {PRICE_LAST_UPDATED}. Drag the slider to match your local pump price.
          </p>
        </div>

        {/* Extras */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={roundTrip}
              onChange={(e) => setRoundTrip(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Round trip (double the distance)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={heavyLoad}
              onChange={(e) => setHeavyLoad(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Full passenger load / heavy cargo (+15% consumption)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={contingency}
              onChange={(e) => setContingency(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Add 8% contingency buffer for traffic/detours
          </label>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="rounded-xl bg-indigo-50 p-6 space-y-3">
          <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wide">
            Estimated trip cost
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-indigo-700">Fuel needed</p>
              <p className="text-xl font-bold text-indigo-900">
                {results.litresNeeded.toFixed(1)} L
              </p>
            </div>
            <div>
              <p className="text-xs text-indigo-700">Total cost</p>
              <p className="text-xl font-bold text-indigo-900">
                {formatNaira(results.totalCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-indigo-700">Cost per km</p>
              <p className="text-xl font-bold text-indigo-900">
                {formatNaira(results.perKmCost)}
              </p>
            </div>
          </div>
          <p className="text-sm text-indigo-800">
            {results.totalDistance} km total
            {roundTrip ? ' (round trip)' : ' (one way)'} at {formatNaira(price)}/litre.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Estimate only. Pump prices vary by state, depot and station — Lagos and Ogun are
        often cheaper than northern states. Actual fuel use depends on vehicle condition,
        traffic, air-conditioning and road quality. Not financial advice.
      </p>
    </div>
  );
}
