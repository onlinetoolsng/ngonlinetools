'use client'

import { useMemo, useState } from 'react'

/**
 * components/tools/GhanaFuelCostCalculator.tsx
 *
 * Pure client-side calculator. No SEO responsibility, no schema, no registry
 * imports — the parent server component (page.tsx) owns all of that.
 *
 * ─── Legal & regulatory context ────────────────────────────────────────────
 * Ghana's downstream petroleum sector is deregulated but guided by the
 * National Petroleum Authority (NPA) under the National Petroleum Authority
 * Act, 2005 (Act 691) and the Petroleum Products Pricing Formula
 * Regulations (L.I. 2186, as amended by L.I. 2222). Prices adjust roughly
 * every two weeks (1st–15th and 16th–end of month) and are uniform
 * nationwide per OMC brand thanks to the Unified Petroleum Price Fund
 * (UPPF) — there's no location-based pricing the way there is in Nigeria.
 * NPA publishes floor prices; actual pump prices vary a little by OMC
 * brand, generally at or above the floor.
 *
 * Trotro/taxi fares are set by operators via the GPRTU and allied unions,
 * not by a fixed legal formula — they move in response to fuel prices and
 * are posted at stations. This tool estimates a fuel-cost-based fare proxy,
 * not an official GPRTU rate.
 *
 * Fuel price default is a hardcoded constant that must be updated manually
 * each pricing window by the site owner.
 */

// ---- Manually maintained defaults (update every NPA pricing window) ----
const PETROL_PRICE_GHS = 14.5 // national average, indicative floor+
const DIESEL_PRICE_GHS = 15.2
const LPG_PRICE_GHS = 12.8 // per kg-equivalent litre pricing varies; treated as per-litre here
const PRICE_LAST_UPDATED = '2026-07-16'

type FuelType = 'petrol' | 'diesel' | 'lpg'

interface RoutePreset {
  label: string
  km: number
}

const ROUTE_PRESETS: RoutePreset[] = [
  { label: 'Accra Circle → Madina', km: 12 },
  { label: 'Accra → Kumasi', km: 250 },
  { label: 'Accra → Takoradi', km: 230 },
  { label: 'Kumasi → Tamale', km: 385 },
  { label: 'Accra → Cape Coast', km: 145 },
]

interface VehiclePreset {
  label: string
  kmPerLitre: number
}

const VEHICLE_PRESETS: VehiclePreset[] = [
  { label: 'Small car (e.g. Toyota Vitz, Kia Picanto)', kmPerLitre: 12 },
  { label: 'Sedan (e.g. Toyota Corolla, Honda Civic)', kmPerLitre: 10 },
  { label: 'SUV / 4x4 (e.g. Toyota RAV4, Nissan X-Trail)', kmPerLitre: 8 },
  { label: 'Trotro / minibus (e.g. Toyota HiAce)', kmPerLitre: 5 },
  { label: 'Okada / motorbike', kmPerLitre: 30 },
  { label: 'Custom (enter your own)', kmPerLitre: 0 },
]

function formatGHS(value: number): string {
  if (!Number.isFinite(value)) return 'GHS 0.00'
  return `GHS ${Math.max(0, value).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function GhanaFuelCostCalculator() {
  const [distance, setDistance] = useState<number>(20)
  const [vehicleIndex, setVehicleIndex] = useState<number>(0)
  const [customEfficiency, setCustomEfficiency] = useState<number>(10)
  const [fuelType, setFuelType] = useState<FuelType>('petrol')
  const [price, setPrice] = useState<number>(PETROL_PRICE_GHS)
  const [roundTrip, setRoundTrip] = useState<boolean>(true)
  const [tripsPerDay, setTripsPerDay] = useState<number>(2)
  const [daysPerMonth, setDaysPerMonth] = useState<number>(22)

  const selectedVehicle = VEHICLE_PRESETS[vehicleIndex]
  const isCustomVehicle = selectedVehicle.kmPerLitre === 0
  const efficiency = isCustomVehicle ? customEfficiency : selectedVehicle.kmPerLitre

  function handleFuelTypeChange(next: FuelType) {
    setFuelType(next)
    setPrice(next === 'petrol' ? PETROL_PRICE_GHS : next === 'diesel' ? DIESEL_PRICE_GHS : LPG_PRICE_GHS)
  }

  const results = useMemo(() => {
    if (distance <= 0 || efficiency <= 0) return null

    const totalDistance = roundTrip ? distance * 2 : distance
    const litresNeeded = totalDistance / efficiency
    const totalCost = litresNeeded * price
    const perKmCost = totalCost / totalDistance
    const monthlyCost = perKmCost * (roundTrip ? distance * 2 : distance) * tripsPerDay * daysPerMonth

    // Fuel-based trotro fare proxy: short/medium/long distance bands,
    // loosely reflecting typical GPRTU-posted fares relative to fuel cost.
    let fareBand: string
    let fareEstimate: number
    if (distance <= 8) {
      fareBand = 'Short hop'
      fareEstimate = Math.max(4, perKmCost * distance * 3.2)
    } else if (distance <= 25) {
      fareBand = 'Medium distance'
      fareEstimate = perKmCost * distance * 2.6
    } else {
      fareBand = 'Long distance / intercity'
      fareEstimate = perKmCost * distance * 2.0
    }

    return { totalDistance, litresNeeded, totalCost, perKmCost, monthlyCost, fareBand, fareEstimate }
  }, [distance, efficiency, price, roundTrip, tripsPerDay, daysPerMonth])

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        {/* Distance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Trip distance (km)</label>
          <input
            type="number"
            min={1}
            value={distance}
            onChange={e => setDistance(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {ROUTE_PRESETS.map(route => (
              <button
                key={route.label}
                type="button"
                onClick={() => setDistance(route.km)}
                className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                {route.label} ({route.km} km)
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle / efficiency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
          <select
            value={vehicleIndex}
            onChange={e => setVehicleIndex(parseInt(e.target.value, 10))}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            {VEHICLE_PRESETS.map((v, i) => (
              <option key={v.label} value={i}>{v.label}</option>
            ))}
          </select>

          {isCustomVehicle && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel efficiency (km per litre)</label>
              <input
                type="number"
                min={1}
                max={60}
                step={0.1}
                value={customEfficiency}
                onChange={e => setCustomEfficiency(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          )}
        </div>

        {/* Fuel type + price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fuel type &amp; price per litre</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleFuelTypeChange('petrol')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${fuelType === 'petrol' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Petrol
            </button>
            <button
              type="button"
              onClick={() => handleFuelTypeChange('diesel')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${fuelType === 'diesel' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Diesel
            </button>
            <button
              type="button"
              onClick={() => handleFuelTypeChange('lpg')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${fuelType === 'lpg' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              LPG
            </button>
          </div>

          <input
            type="range"
            min={8}
            max={22}
            step={0.1}
            value={price}
            onChange={e => setPrice(parseFloat(e.target.value))}
            className="w-full accent-green-700"
          />
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-600">{formatGHS(price)} / litre</span>
            <button
              type="button"
              onClick={() => setPrice(fuelType === 'petrol' ? PETROL_PRICE_GHS : fuelType === 'diesel' ? DIESEL_PRICE_GHS : LPG_PRICE_GHS)}
              className="text-xs font-medium text-green-700 hover:text-green-900"
            >
              Use current average
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Current average last updated: {PRICE_LAST_UPDATED} (NPA floor-guided national average). Drag to match your local OMC price.
          </p>
        </div>

        {/* Round trip + commute */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={roundTrip}
              onChange={e => setRoundTrip(e.target.checked)}
              className="rounded border-gray-300 text-green-700 focus:ring-green-600"
            />
            Round trip (double the distance)
          </label>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trips per day (for monthly estimate)</label>
              <input
                type="number"
                min={0}
                value={tripsPerDay}
                onChange={e => setTripsPerDay(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Days per month</label>
              <input
                type="number"
                min={0}
                max={31}
                value={daysPerMonth}
                onChange={e => setDaysPerMonth(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="rounded-xl bg-green-50 p-6 space-y-3">
          <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wide">Estimated trip cost</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-green-700">Fuel needed</p>
              <p className="text-xl font-bold text-green-900">{results.litresNeeded.toFixed(1)} L</p>
            </div>
            <div>
              <p className="text-xs text-green-700">Total cost</p>
              <p className="text-xl font-bold text-green-900">{formatGHS(results.totalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-green-700">Cost per km</p>
              <p className="text-xl font-bold text-green-900">{formatGHS(results.perKmCost)}</p>
            </div>
          </div>
          <p className="text-sm text-green-800">
            {results.totalDistance.toFixed(0)} km total{roundTrip ? ' (round trip)' : ' (one way)'} at {formatGHS(price)}/litre.
          </p>

          <div className="border-t border-green-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-green-700">Trotro fare proxy ({results.fareBand})</p>
              <p className="text-lg font-bold text-green-900">≈ {formatGHS(results.fareEstimate)}</p>
              <p className="text-[11px] text-green-700/70 mt-0.5">Fuel-based estimate — actual GPRTU fares vary by route and station.</p>
            </div>
            <div>
              <p className="text-xs text-green-700">Monthly estimate ({tripsPerDay}× trips × {daysPerMonth} days)</p>
              <p className="text-lg font-bold text-green-900">{formatGHS(results.monthlyCost)}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Based on current NPA floors/averages as of {PRICE_LAST_UPDATED}. Ex-pump prices are uniform nationwide per OMC
        under the Unified Petroleum Price Fund, but vary a little by brand — check your local station for the exact
        price. Trotro/taxi fares are set by operators via the GPRTU and posted at stations, not by a fixed formula —
        this tool gives a fuel-based estimate only. Not financial advice.
      </p>
    </div>
  )
}
