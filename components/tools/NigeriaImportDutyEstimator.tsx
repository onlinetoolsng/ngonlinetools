'use client'

import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TradeRegime = 'non-ecowas' | 'ecowas' | 'other'
type CargoType = 'container20' | 'container40' | 'loose' | 'vehicle'
type Port = 'lagos-apapa' | 'tin-can' | 'other'
type Currency = 'USD' | 'GBP' | 'EUR'

interface HsPreset {
  label: string
  dutyRate: number // as a decimal, e.g. 0.2 for 20%
}

interface LineItem {
  label: string
  base: string
  rate: string
  amountNgn: number
  note?: string
}

interface CalculationResult {
  cifNgn: number
  fobNgn: number
  freightNgn: number
  insuranceNgn: number
  duty: number
  surcharge: number
  cissFcs: number
  etls: number
  otherLevies: number
  vat: number
  subtotalCustoms: number
  portCharges: number
  demurrageNgn: number
  grandTotal: number
  effectivePercentOfCif: number
  lineItems: LineItem[]
}

// ---------------------------------------------------------------------------
// Static reference data
// Sources: Nigeria Customs Service (NCS) Common External Tariff (CET) bands,
// FIRS VAT Act, and publicly published NCS/terminal fee schedules. These are
// indicative bands only — always confirm against the live NCS tariff book.
// ---------------------------------------------------------------------------

const HS_PRESETS: Record<string, HsPreset> = {
  '6403': { label: 'Footwear (leather upper)', dutyRate: 0.35 },
  '8517': { label: 'Phones & telecom equipment', dutyRate: 0.1 },
  '8471': { label: 'Computers & laptops', dutyRate: 0.05 },
  '8703': { label: 'Passenger vehicles', dutyRate: 0.35 },
  '1006': { label: 'Rice', dutyRate: 0.1 },
  '3004': { label: 'Pharmaceuticals (finished)', dutyRate: 0.0 },
  '8708': { label: 'Vehicle parts & accessories', dutyRate: 0.2 },
  '6109': { label: 'T-shirts & apparel (knitted)', dutyRate: 0.2 },
  '8528': { label: 'TVs & monitors', dutyRate: 0.2 },
  '2523': { label: 'Cement', dutyRate: 0.1 },
}

const PORT_THC: Record<Port, { container20: number; container40: number; loose: number; vehicle: number }> = {
  'lagos-apapa': { container20: 250000, container40: 420000, loose: 90000, vehicle: 180000 },
  'tin-can': { container20: 220000, container40: 380000, loose: 80000, vehicle: 160000 },
  other: { container20: 180000, container40: 320000, loose: 70000, vehicle: 140000 },
}

const RESTRICTED_HINTS = [
  'used vehicles over 12 years old (age-restricted at port of entry)',
  'certain frozen poultry parts and other import-prohibited food items',
  'used tyres and refurbished vehicle tyres',
  'weapons, narcotics, and other goods on the Import Prohibition List',
]

const DEFAULT_NGN_FALLBACK = 1550 // used only if the live rate fetch fails

// ---------------------------------------------------------------------------
// Calculation logic
// ---------------------------------------------------------------------------

interface CalcInputs {
  fob: number
  currency: Currency
  freight: number
  insurance: number
  useAutoInsurance: boolean
  rateNgn: number
  regime: TradeRegime
  port: Port
  cargoType: CargoType
  dutyRatePercent: number
  cissFcsPercent: number
  demurrageDays: number
}

function calculateImportCosts(inputs: CalcInputs): CalculationResult {
  const {
    fob,
    freight,
    insurance,
    useAutoInsurance,
    rateNgn,
    regime,
    port,
    cargoType,
    dutyRatePercent,
    cissFcsPercent,
    demurrageDays,
  } = inputs

  const fobNgn = fob * rateNgn
  const freightNgn = freight * rateNgn
  const insuranceBaseNgn = useAutoInsurance ? (fobNgn + freightNgn) * 0.005 : insurance * rateNgn
  const insuranceNgn = insuranceBaseNgn
  const cifNgn = fobNgn + freightNgn + insuranceNgn

  // ECOWAS Trade Liberalisation Scheme (ETLS): 0% for qualifying ECOWAS-origin
  // goods, ~0.5% of CIF otherwise (levy funds the ECOWAS Community).
  const etls = regime === 'ecowas' ? 0 : cifNgn * 0.005

  const duty = cifNgn * (dutyRatePercent / 100)
  const surcharge = duty * 0.07 // 7% surcharge on duty, per CET implementation
  const cissFcs = fobNgn * (cissFcsPercent / 100)

  // Nigeria VAT Act (as amended): 7.5% VAT on the customs value plus duty and
  // the associated levies.
  const vat = (cifNgn + duty + surcharge + cissFcs + etls) * 0.075

  const otherLevies = 0 // placeholder for vehicle NAC / excise, toggled separately if needed

  const subtotalCustoms = duty + surcharge + cissFcs + etls + vat + otherLevies

  const thcTable = PORT_THC[port]
  const portCharges =
    cargoType === 'container20'
      ? thcTable.container20
      : cargoType === 'container40'
      ? thcTable.container40
      : cargoType === 'vehicle'
      ? thcTable.vehicle
      : thcTable.loose

  // Demurrage: rough flat estimate per day beyond free storage days, varies
  // widely by terminal and is not part of the customs calculation.
  const demurrageNgn = demurrageDays > 0 ? demurrageDays * 45000 : 0

  const grandTotal = cifNgn + subtotalCustoms + portCharges + demurrageNgn
  const effectivePercentOfCif = cifNgn > 0 ? ((grandTotal - cifNgn) / cifNgn) * 100 : 0

  const lineItems: LineItem[] = [
    { label: 'CIF Value', base: 'FOB + Freight + Insurance', rate: '—', amountNgn: cifNgn },
    { label: 'Import Duty', base: 'CIF', rate: `${dutyRatePercent}%`, amountNgn: duty, note: 'Per ECOWAS CET band or user override' },
    { label: 'Surcharge', base: 'Duty', rate: '7%', amountNgn: surcharge },
    { label: 'CISS / FCS / Admin Levy', base: 'FOB', rate: `${cissFcsPercent}%`, amountNgn: cissFcs, note: 'Rate varies by current policy — verify on filing day' },
    { label: 'ETLS', base: 'CIF', rate: regime === 'ecowas' ? '0% (ECOWAS)' : '0.5%', amountNgn: etls },
    { label: 'VAT', base: 'CIF + Duty + Surcharge + CISS + ETLS', rate: '7.5%', amountNgn: vat },
    { label: 'Terminal Handling Charge (est.)', base: 'Port + cargo type', rate: '—', amountNgn: portCharges, note: 'Terminal-specific, not an official customs charge' },
  ]

  if (demurrageNgn > 0) {
    lineItems.push({ label: 'Storage / Demurrage (est.)', base: `${demurrageDays} day(s)`, rate: '₦45,000/day (approx.)', amountNgn: demurrageNgn, note: 'Highly terminal- and time-dependent — confirm with your agent' })
  }

  return {
    cifNgn,
    fobNgn,
    freightNgn,
    insuranceNgn,
    duty,
    surcharge,
    cissFcs,
    etls,
    otherLevies,
    vat,
    subtotalCustoms,
    portCharges,
    demurrageNgn,
    grandTotal,
    effectivePercentOfCif,
    lineItems,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNgn(value: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value)
}

function matchHsPreset(hsCode: string): HsPreset | null {
  const digits = hsCode.replace(/\D/g, '')
  if (digits.length < 4) return null
  const prefix = digits.slice(0, 4)
  return HS_PRESETS[prefix] ?? null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NigeriaImportDutyEstimator({ locale }: { locale: string }) {
  const [hsCode, setHsCode] = useState('')
  const [productNote, setProductNote] = useState('')
  const [fob, setFob] = useState<string>('')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [freight, setFreight] = useState<string>('')
  const [useAutoInsurance, setUseAutoInsurance] = useState(true)
  const [insurance, setInsurance] = useState<string>('')
  const [regime, setRegime] = useState<TradeRegime>('non-ecowas')
  const [port, setPort] = useState<Port>('lagos-apapa')
  const [cargoType, setCargoType] = useState<CargoType>('container20')
  const [weight, setWeight] = useState<string>('')
  const [dutyRatePercent, setDutyRatePercent] = useState<string>('20')
  const [cissFcsPercent, setCissFcsPercent] = useState<string>('4')
  const [demurrageDays, setDemurrageDays] = useState<string>('0')

  const [rateNgn, setRateNgn] = useState<number>(DEFAULT_NGN_FALLBACK)
  const [rateTimestamp, setRateTimestamp] = useState<string>('')
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'fallback'>('loading')
  const [manualRate, setManualRate] = useState<string>('')

  const [errors, setErrors] = useState<string[]>([])
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [activeTab, setActiveTab] = useState<'customs' | 'port' | 'total'>('customs')

  useEffect(() => {
    let cancelled = false

    async function fetchRate() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD')
        if (!res.ok) throw new Error('rate fetch failed')
        const data = await res.json()
        const usdToNgn = data?.rates?.NGN
        const usdToOther = currency === 'USD' ? 1 : data?.rates?.[currency]
        if (!usdToNgn || !usdToOther) throw new Error('missing rate')
        const crossRate = usdToNgn / usdToOther
        if (!cancelled) {
          setRateNgn(crossRate)
          setRateTimestamp(new Date().toLocaleString('en-NG'))
          setRateStatus('live')
        }
      } catch {
        if (!cancelled) {
          setRateNgn(DEFAULT_NGN_FALLBACK)
          setRateStatus('fallback')
        }
      }
    }

    fetchRate()
    return () => {
      cancelled = true
    }
  }, [currency])

  const hsPreset = matchHsPreset(hsCode)

  useEffect(() => {
    if (hsPreset) {
      setDutyRatePercent(String(hsPreset.dutyRate * 100))
    }
  }, [hsPreset])

  function validate(): string[] {
    const issues: string[] = []
    const digits = hsCode.replace(/\D/g, '')
    if (hsCode && (digits.length < 4 || digits.length > 10)) {
      issues.push('HS code should be 4–10 digits (e.g. 6403.99).')
    }
    if (!fob || Number(fob) <= 0) issues.push('Enter a valid FOB / cost of goods amount.')
    if (freight !== '' && Number(freight) < 0) issues.push('Freight cost cannot be negative.')
    if (!useAutoInsurance && insurance !== '' && Number(insurance) < 0) issues.push('Insurance cannot be negative.')
    if (!dutyRatePercent || Number(dutyRatePercent) < 0) issues.push('Enter a valid duty rate percentage.')
    return issues
  }

  function handleCalculate() {
    const issues = validate()
    setErrors(issues)
    if (issues.length > 0) {
      setResult(null)
      return
    }

    const effectiveRate = manualRate ? Number(manualRate) : rateNgn

    const calc = calculateImportCosts({
      fob: Number(fob) || 0,
      currency,
      freight: Number(freight) || 0,
      insurance: Number(insurance) || 0,
      useAutoInsurance,
      rateNgn: effectiveRate,
      regime,
      port,
      cargoType,
      dutyRatePercent: Number(dutyRatePercent) || 0,
      cissFcsPercent: Number(cissFcsPercent) || 0,
      demurrageDays: Number(demurrageDays) || 0,
    })

    setResult(calc)
    setActiveTab('customs')
  }

  function handleReset() {
    setHsCode('')
    setProductNote('')
    setFob('')
    setFreight('')
    setInsurance('')
    setUseAutoInsurance(true)
    setRegime('non-ecowas')
    setPort('lagos-apapa')
    setCargoType('container20')
    setWeight('')
    setDutyRatePercent('20')
    setCissFcsPercent('4')
    setDemurrageDays('0')
    setManualRate('')
    setErrors([])
    setResult(null)
  }

  function handleCopyResults() {
    if (!result) return
    const lines = [
      'Nigeria Import Duty & Clearance Estimate',
      `CIF Value: ${formatNgn(result.cifNgn)}`,
      ...result.lineItems
        .filter((li) => li.label !== 'CIF Value')
        .map((li) => `${li.label}: ${formatNgn(li.amountNgn)}`),
      `Grand Total (est.): ${formatNgn(result.grandTotal)}`,
      `Effective rate over CIF: ${result.effectivePercentOfCif.toFixed(1)}%`,
      'This is an estimate only. Confirm with NCS PAAR and a licensed clearing agent.',
    ]
    navigator.clipboard?.writeText(lines.join('\n'))
  }

  const showContainerFields = cargoType === 'container20' || cargoType === 'container40'
  const showWeightField = cargoType === 'loose'

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Input card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">HS Code</label>
            <input
              type="text"
              value={hsCode}
              onChange={(e) => setHsCode(e.target.value)}
              placeholder="e.g. 6403.99"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {hsPreset && (
              <p className="text-xs text-indigo-600 mt-1">
                Matched: {hsPreset.label} — indicative duty {(hsPreset.dutyRate * 100).toFixed(0)}%
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duty Rate (%)</label>
            <input
              type="number"
              value={dutyRatePercent}
              onChange={(e) => setDutyRatePercent(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">Auto-filled from HS code match, or enter your own CET band.</p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Description (optional)</label>
            <textarea
              value={productNote}
              onChange={(e) => setProductNote(e.target.value)}
              rows={2}
              placeholder="e.g. 500 pairs of leather boots for retail"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">FOB / Cost of Goods</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={fob}
                onChange={(e) => setFob(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="rounded-xl border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Freight Cost ({currency})</label>
            <input
              type="number"
              value={freight}
              onChange={(e) => setFreight(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Insurance ({currency})</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={useAutoInsurance ? '' : insurance}
                disabled={useAutoInsurance}
                onChange={(e) => setInsurance(e.target.value)}
                placeholder={useAutoInsurance ? 'Auto (0.5% of Cost+Freight)' : '0.00'}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <input type="checkbox" checked={useAutoInsurance} onChange={(e) => setUseAutoInsurance(e.target.checked)} />
              Auto-calculate at 0.5%
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origin / Trade Regime</label>
            <select
              value={regime}
              onChange={(e) => setRegime(e.target.value as TradeRegime)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="non-ecowas">Non-ECOWAS</option>
              <option value="ecowas">ECOWAS (qualifying origin)</option>
              <option value="other">Other / Not sure</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port / Destination</label>
            <select
              value={port}
              onChange={(e) => setPort(e.target.value as Port)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="lagos-apapa">Lagos — Apapa</option>
              <option value="tin-can">Lagos — Tin Can</option>
              <option value="other">Other port</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cargo Type</label>
            <div className="flex flex-wrap gap-3 text-sm text-gray-700">
              {(['container20', 'container40', 'loose', 'vehicle'] as CargoType[]).map((type) => (
                <label key={type} className="flex items-center gap-1.5">
                  <input type="radio" name="cargoType" checked={cargoType === type} onChange={() => setCargoType(type)} />
                  {type === 'container20' && '20ft Container'}
                  {type === 'container40' && '40ft Container'}
                  {type === 'loose' && 'Loose / General Cargo'}
                  {type === 'vehicle' && 'Vehicle'}
                </label>
              ))}
            </div>
          </div>

          {showWeightField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg, optional)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CISS / FCS / Admin Levy (%)</label>
            <input
              type="number"
              value={cissFcsPercent}
              onChange={(e) => setCissFcsPercent(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">Policy on this levy has changed in recent years — confirm current rate.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Demurrage Days (optional)</label>
            <input
              type="number"
              value={demurrageDays}
              onChange={(e) => setDemurrageDays(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Exchange rate row */}
        <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600">
          {rateStatus === 'loading' && <span>Fetching current exchange rate…</span>}
          {rateStatus === 'live' && (
            <span>
              Using approx. rate: ₦{rateNgn.toFixed(2)}/{currency} (fetched {rateTimestamp}) — actual assessment uses the official CBN rate on filing day.
            </span>
          )}
          {rateStatus === 'fallback' && (
            <span>
              Live rate unavailable right now — using a fallback estimate of ₦{DEFAULT_NGN_FALLBACK}/USD. Enter a manual rate below for accuracy.
            </span>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Override rate (₦ per {currency}):</span>
            <input
              type="number"
              value={manualRate}
              onChange={(e) => setManualRate(e.target.value)}
              placeholder={rateNgn.toFixed(2)}
              className="w-28 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            <ul className="list-disc list-inside space-y-0.5">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleCalculate}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition"
          >
            Calculate
          </button>
          <button
            onClick={handleReset}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Reset
          </button>
          {result && (
            <button
              onClick={handleCopyResults}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Copy Results
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Estimated Landed Cost</h3>
            <span className="text-sm text-gray-500">Effective: +{result.effectivePercentOfCif.toFixed(1)}% over CIF</span>
          </div>

          <div className="flex gap-2 mb-4">
            {(['customs', 'port', 'total'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {tab === 'customs' && 'Customs Taxes'}
                {tab === 'port' && 'Port / Terminal'}
                {tab === 'total' && 'Total Landed'}
              </button>
            ))}
          </div>

          {activeTab === 'customs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-indigo-100">
                    <th className="py-2 pr-2">Line Item</th>
                    <th className="py-2 pr-2">Base</th>
                    <th className="py-2 pr-2">Rate</th>
                    <th className="py-2 pr-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {result.lineItems
                    .filter((li) => li.label !== 'Terminal Handling Charge (est.)' && li.label !== 'Storage / Demurrage (est.)')
                    .map((li) => (
                      <tr key={li.label} className="border-b border-indigo-50">
                        <td className="py-2 pr-2 font-medium text-gray-800">{li.label}</td>
                        <td className="py-2 pr-2 text-gray-500">{li.base}</td>
                        <td className="py-2 pr-2 text-gray-500">{li.rate}</td>
                        <td className="py-2 pr-2 text-right text-gray-800">{formatNgn(li.amountNgn)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'port' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-indigo-100">
                    <th className="py-2 pr-2">Line Item</th>
                    <th className="py-2 pr-2">Base</th>
                    <th className="py-2 pr-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {result.lineItems
                    .filter((li) => li.label === 'Terminal Handling Charge (est.)' || li.label === 'Storage / Demurrage (est.)')
                    .map((li) => (
                      <tr key={li.label} className="border-b border-indigo-50">
                        <td className="py-2 pr-2 font-medium text-gray-800">{li.label}</td>
                        <td className="py-2 pr-2 text-gray-500">{li.base}</td>
                        <td className="py-2 pr-2 text-right text-gray-800">{formatNgn(li.amountNgn)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-2">
                Port and terminal charges are additive estimates, not official NCS figures — they vary by terminal operator and change periodically.
              </p>
            </div>
          )}

          {activeTab === 'total' && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">CIF Value</span>
                <span className="font-medium text-gray-900">{formatNgn(result.cifNgn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal Customs Charges</span>
                <span className="font-medium text-gray-900">{formatNgn(result.subtotalCustoms)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Port / Terminal Charges</span>
                <span className="font-medium text-gray-900">{formatNgn(result.portCharges + result.demurrageNgn)}</span>
              </div>
              <div className="flex justify-between border-t border-indigo-200 pt-2 mt-2">
                <span className="font-semibold text-gray-900">Grand Total (est.)</span>
                <span className="font-semibold text-gray-900">{formatNgn(result.grandTotal)}</span>
              </div>
            </div>
          )}

          {regime !== 'ecowas' && RESTRICTED_HINTS.length > 0 && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              <p className="font-medium mb-1">Check for import restrictions before shipping:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {RESTRICTED_HINTS.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 leading-relaxed">
        This tool provides an estimate only. Duty bands, CISS/FCS levies, ETLS, and port charges change periodically and vary by
        terminal, so figures shown here are approximations for planning purposes and are not a customs assessment. Insurance,
        exchange rate, and demurrage figures are auto-calculated approximations unless you enter your own. Actual liability is
        determined by the Nigeria Customs Service (NCS) through the PAAR/Form M process, and clearing should be handled by a
        licensed customs agent. This is not legal or financial advice.
      </p>
    </div>
  )
}
