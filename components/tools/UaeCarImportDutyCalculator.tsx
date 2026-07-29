'use client'

import { useEffect, useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Regulatory context (informational only — planning estimate, not a
// customs quote) ─────────────────────────────────────────────────────────
// The UAE applies the GCC Common External Tariff (CET) under the GCC
// Unified Customs Law: a 5% customs duty on the CIF value (Cost + Insurance
// + Freight) of imported passenger vehicles and motorcycles (HS 8703 /
// 8711), new or used, including EVs. UAE VAT (Federal Tax Authority) then
// applies at 5% on top of (CIF + duty) — an effective combined rate of
// ~10.25% of CIF, since VAT compounds on the duty-inclusive value. This
// 5% CET rate has been stable for years with no change confirmed as of
// July 2026. Federal customs policy is set at GCC/federal level; clearance
// is handled by the relevant emirate's customs authority (Dubai Customs,
// Abu Dhabi Customs, etc.), and vehicle registration (Mulkiya) by that
// emirate's RTA/traffic department, so registration-side fees vary by
// emirate. Always confirm current rates at your emirate's customs portal
// or with a licensed clearing agent before relying on this for a real
// shipment.
const DUTY_RATE = 0.05
const VAT_RATE = 0.05
const DEFAULT_AED_PER_USD = 3.6725 // AED is a hard peg to USD, not a floating rate
const DEFAULT_INSURANCE_FREIGHT_PCT = 0.08 // rough auto-estimate if the user doesn't have a quote yet
const BROKER_FEE_MIN = 500
const BROKER_FEE_MAX = 2000
const CURRENT_YEAR = new Date().getFullYear()
const USED_AGE_LIMIT_YEARS = 10 // common practical cutoff for straightforward personal-import clearance

type Currency = 'AED' | 'USD'
type VehicleCondition = 'new' | 'used'
type VehicleType = 'passenger' | 'motorcycle' | 'commercial'

const EMIRATE_REG_FEE: Record<string, { min: number; max: number; label: string }> = {
  dubai: { min: 400, max: 1000, label: 'Dubai (RTA)' },
  'abu-dhabi': { min: 350, max: 900, label: 'Abu Dhabi (DMT)' },
  sharjah: { min: 300, max: 800, label: 'Sharjah' },
  other: { min: 300, max: 1000, label: 'Other emirate' },
}

function formatAED(value: number) {
  if (!Number.isFinite(value)) return 'AED 0'
  return `AED ${Math.max(0, Math.round(value)).toLocaleString('en-US')}`
}

const PIE_COLORS = ['#4338ca', '#f59e0b', '#0ea5e9', '#94a3b8']

export function UaeCarImportDutyCalculator(_props: { locale: string }) {
  const [currency, setCurrency] = useState<Currency>('AED')
  const [priceInput, setPriceInput] = useState('60000')
  const [freightInsuranceInput, setFreightInsuranceInput] = useState('')
  const [useAutoFreight, setUseAutoFreight] = useState(true)
  const [vehicleType, setVehicleType] = useState<VehicleType>('passenger')
  const [condition, setCondition] = useState<VehicleCondition>('used')
  const [modelYear, setModelYear] = useState(String(CURRENT_YEAR - 3))
  const [gccSpec, setGccSpec] = useState<'yes' | 'no'>('yes')
  const [emirate, setEmirate] = useState('dubai')

  const [rate, setRate] = useState(DEFAULT_AED_PER_USD)
  const [rateSource, setRateSource] = useState<'live' | 'peg'>('peg')

  useEffect(() => {
    const controller = new AbortController()
    fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const live = data?.rates?.AED
        if (typeof live === 'number' && live > 0) {
          setRate(live)
          setRateSource('live')
        }
      })
      .catch(() => {
        // AED is pegged to USD, so the hardcoded fallback is already accurate
      })
    return () => controller.abort()
  }, [])

  const priceRaw = parseFloat(priceInput) || 0
  const priceAED = currency === 'AED' ? priceRaw : priceRaw * rate

  const manualFreightAED = (parseFloat(freightInsuranceInput) || 0) * (currency === 'AED' ? 1 : rate)
  const autoFreightAED = priceAED * DEFAULT_INSURANCE_FREIGHT_PCT
  const freightInsuranceAED = useAutoFreight ? autoFreightAED : manualFreightAED

  const cifAED = priceAED + freightInsuranceAED
  const dutyAED = cifAED * DUTY_RATE
  const vatAED = (cifAED + dutyAED) * VAT_RATE
  const totalTaxAED = dutyAED + vatAED
  const effectivePct = cifAED > 0 ? (totalTaxAED / cifAED) * 100 : 0

  const regFee = EMIRATE_REG_FEE[emirate] ?? EMIRATE_REG_FEE.other
  const landedLowAED = cifAED + totalTaxAED + BROKER_FEE_MIN + regFee.min
  const landedHighAED = cifAED + totalTaxAED + BROKER_FEE_MAX + regFee.max

  const toDisplay = (aed: number) => (currency === 'AED' ? aed : aed / rate)
  const fmt = (aed: number) => (currency === 'AED' ? formatAED(aed) : `$${Math.max(0, Math.round(toDisplay(aed))).toLocaleString('en-US')}`)

  const vehicleAge = CURRENT_YEAR - (parseInt(modelYear, 10) || CURRENT_YEAR)
  const ageFlag = condition === 'used' && vehicleAge > USED_AGE_LIMIT_YEARS

  const pieData = useMemo(
    () => [
      { name: 'Vehicle price', value: priceAED },
      { name: 'Freight + insurance', value: freightInsuranceAED },
      { name: 'Customs duty (5%)', value: dutyAED },
      { name: 'VAT (5%)', value: vatAED },
    ],
    [priceAED, freightInsuranceAED, dutyAED, vatAED]
  )

  const copyResult = () => {
    const text = `CIF: ${fmt(cifAED)} | Customs duty (5%): ${fmt(dutyAED)} | VAT (5%): ${fmt(vatAED)} | Total taxes: ${fmt(totalTaxAED)} (${effectivePct.toFixed(2)}% of CIF) | Estimated landed cost: ${fmt(landedLowAED)}–${fmt(landedHighAED)}`
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Currency toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
        {(['AED', 'USD'] as Currency[]).map(c => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            className={`flex-1 px-4 py-2.5 font-semibold transition-colors ${currency === c ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle purchase price ({currency})</label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(priceInput)}
            onChange={e => setPriceInput(cleanNumberInput(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="60,000"
          />
          <input
            type="range"
            min={5_000}
            max={500_000}
            step={1_000}
            value={priceRaw || 0}
            onChange={e => setPriceInput(e.target.value)}
            className="w-full accent-indigo-700 mt-2"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-700">Freight + insurance</label>
            <button
              type="button"
              onClick={() => setUseAutoFreight(v => !v)}
              className="text-xs font-medium text-indigo-600"
            >
              {useAutoFreight ? 'Enter my own quote' : `Use auto-estimate (~${DEFAULT_INSURANCE_FREIGHT_PCT * 100}% of price)`}
            </button>
          </div>
          {useAutoFreight ? (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
              Auto-estimated at {fmt(autoFreightAED)} — a rough placeholder. Use your shipping line/freight forwarder&apos;s actual quote once you have one, since this varies by origin port and vehicle size.
            </p>
          ) : (
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(freightInsuranceInput)}
              onChange={e => setFreightInsuranceInput(cleanNumberInput(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
              placeholder={`e.g. ${currency === 'AED' ? '4,500' : '1,200'}`}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle type</label>
            <select
              value={vehicleType}
              onChange={e => setVehicleType(e.target.value as VehicleType)}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="passenger">Passenger car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="commercial">Commercial / truck</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condition</label>
            <select
              value={condition}
              onChange={e => setCondition(e.target.value as VehicleCondition)}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        {condition === 'used' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Model year</label>
            <input
              type="number"
              value={modelYear}
              onChange={e => setModelYear(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">GCC-spec vehicle?</label>
            <select
              value={gccSpec}
              onChange={e => setGccSpec(e.target.value as 'yes' | 'no')}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              <option value="yes">Yes, GCC-spec</option>
              <option value="no">No / not sure</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Registering emirate</label>
            <select
              value={emirate}
              onChange={e => setEmirate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            >
              {Object.entries(EMIRATE_REG_FEE).map(([key, v]) => (
                <option key={key} value={key}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Compliance flags */}
      {ageFlag && (
        <p className="text-xs rounded-xl px-3 py-2.5 border leading-relaxed bg-amber-50 text-amber-700 border-amber-100">
          This vehicle is about {vehicleAge} years old. Straightforward personal-import clearance is generally easiest for vehicles under ~10 years old — older vehicles can usually still be imported, but may face extra approvals, so confirm your model&apos;s eligibility with your emirate&apos;s customs authority before shipping.
        </p>
      )}
      {gccSpec === 'no' && (
        <p className="text-xs rounded-xl px-3 py-2.5 border leading-relaxed bg-amber-50 text-amber-700 border-amber-100">
          Non-GCC-spec vehicles typically need a MoIAT/GCC Conformity Certificate before registration — this adds cost and time on top of the estimate below. Get a quote from your clearing agent for this step.
        </p>
      )}

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">CIF value (price + freight + insurance)</dt>
            <dd className="font-medium text-gray-800">{fmt(cifAED)}</dd>
          </div>
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Customs duty (5% of CIF)</dt>
            <dd className="font-semibold text-gray-800">{fmt(dutyAED)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-700 font-medium">VAT (5% of CIF + duty)</dt>
            <dd className="font-semibold text-gray-800">{fmt(vatAED)}</dd>
          </div>
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Total government taxes</dt>
            <dd className="font-semibold text-indigo-700 text-lg">{fmt(totalTaxAED)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Effective rate on CIF</dt>
            <dd className="font-medium text-gray-800">{effectivePct.toFixed(2)}%</dd>
          </div>
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Est. landed cost (incl. broker + registration)</dt>
            <dd className="font-semibold text-gray-800">{fmt(landedLowAED)} – {fmt(landedHighAED)}</dd>
          </div>
        </dl>

        <p className="text-[11px] text-gray-400 leading-relaxed">
          Landed-cost range includes a broker fee of AED {BROKER_FEE_MIN.toLocaleString()}–{BROKER_FEE_MAX.toLocaleString()} and {regFee.label} registration of AED {regFee.min.toLocaleString()}–{regFee.max.toLocaleString()}. Port handling/inspection fees, and MoIAT conformity costs for non-GCC-spec vehicles, are not included — ask your clearing agent for those.
        </p>

        <button
          type="button"
          onClick={copyResult}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          Copy result
        </button>
      </div>

      {/* Chart */}
      {cifAED > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-600 mb-2">Cost breakdown</p>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={64}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Legal/accuracy notes */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">What this calculator assumes</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>The GCC Common External Tariff: 5% customs duty on CIF value for passenger vehicles and motorcycles (HS 8703/8711), then 5% UAE VAT on (CIF + duty) — an effective ~10.25% of CIF.</li>
          <li>Commercial vehicles/trucks may fall under different HS codes with different duty treatment — confirm with your broker before relying on this for commercial cargo.</li>
          <li>GCC-origin vehicles with a valid Certificate of Origin (≥40% local value-add) often clear at 0% duty when moved within the GCC — this tool assumes a non-GCC-origin import.</li>
          <li>Diplomats, returning residents&apos; personal effects, People of Determination (adapted vehicles), and some classic/vintage vehicles (25–30+ years) may qualify for exemptions or relief not modelled here.</li>
          <li>Personal imports are generally limited to one vehicle per consignee per year; salvage/flood-damaged/total-loss vehicles are not permitted for road use.</li>
          <li>AED is pegged to USD at a fixed 3.6725 — the {rateSource === 'live' ? 'live' : 'standard peg'} rate used here is {rate.toFixed(4)}.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          This is a planning estimate, not a customs valuation or clearance quote. Customs may reassess unusually low declared values. Confirm current rates and your vehicle&apos;s eligibility with Dubai Customs, Abu Dhabi Customs, or your emirate&apos;s customs authority, and with a licensed clearing agent, before shipping.
        </p>
      </div>
    </div>
  )
}
