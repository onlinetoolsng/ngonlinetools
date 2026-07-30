'use client'

import { useEffect, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'

// ─── Kenyan rental market context (norms, not statute) ────────────────────
// Kenya has no single law capping residential security deposits or
// mandating a deposit-protection scheme. Terms come from the tenancy
// agreement itself, ordinary contract law, the Rent Restriction Act
// (Cap 296) — which mainly covers older, low-rent controlled tenancies
// under roughly KES 2,500/month and is now rare in major cities — and
// common-law/tribunal practice treating a deposit as held in trust.
// Market norms (especially Nairobi): deposit typically 1 month (basic
// units) to 2 months (mid/high-end managed apartments), occasionally up
// to 3 months for premium units; usually 1 month's rent in advance;
// agent commission (often 1 month's rent) is commonly paid by the tenant.
// Deductions should only cover unpaid rent/utilities and damage beyond
// normal wear and tear, evidenced by an itemised statement. There's no
// fixed statutory refund deadline, but 14–30 days after vacating is the
// commonly cited reasonable window in tribunal practice. Disputes can go
// to the Small Claims Court (claims up to KES 1,000,000, fast-tracked,
// no lawyer required) or the Rent Restriction Tribunal for qualifying
// tenancies. These are market/contractual norms, not hard legal caps —
// always get everything in a written tenancy agreement, document the
// property's condition with photos at move-in, and pay through
// traceable methods (M-Pesa/bank) with receipts.

type PropertyType = 'bedsitter' | '1br' | '2br' | 'other'
type Scenario = 'basic' | 'midrange' | 'premium'
type Currency = 'KES' | 'USD'

const PROPERTY_PRESETS: Record<PropertyType, { label: string; rent: number; range: string }> = {
  bedsitter: { label: 'Bedsitter', rent: 15_000, range: 'typically KES 8,000–25,000' },
  '1br': { label: '1 Bedroom', rent: 30_000, range: 'typically KES 15,000–50,000' },
  '2br': { label: '2 Bedroom', rent: 50_000, range: 'typically KES 25,000–80,000' },
  other: { label: 'Other / custom', rent: 40_000, range: 'varies widely by area and size' },
}

const SCENARIOS: Record<Scenario, { label: string; rent: number; depositMonths: number; includeAgent: boolean }> = {
  basic: { label: 'Basic', rent: 15_000, depositMonths: 1, includeAgent: false },
  midrange: { label: 'Mid-range Nairobi', rent: 45_000, depositMonths: 2, includeAgent: true },
  premium: { label: 'Premium', rent: 90_000, depositMonths: 2.5, includeAgent: true },
}

const DEFAULT_KES_PER_USD = 129 // fallback only — live rate is fetched on load

function formatKES(value: number) {
  if (!Number.isFinite(value)) return 'KES 0'
  return `KES ${Math.max(0, Math.round(value)).toLocaleString('en-US')}`
}

export function KenyaRentDepositBudgetCalculator(_props: { locale: string }) {
  const [currency, setCurrency] = useState<Currency>('KES')
  const [propertyType, setPropertyType] = useState<PropertyType>('1br')
  const [rentInput, setRentInput] = useState(String(PROPERTY_PRESETS['1br'].rent))
  const [depositMonths, setDepositMonths] = useState(2)
  const [advanceMonths, setAdvanceMonths] = useState(1)
  const [includeAgent, setIncludeAgent] = useState(true)
  const [agentInput, setAgentInput] = useState('')
  const [movingCostInput, setMovingCostInput] = useState('8000')
  const [utilityDepositInput, setUtilityDepositInput] = useState('3000')
  const [furnishingInput, setFurnishingInput] = useState('0')
  const [serviceChargeInput, setServiceChargeInput] = useState('0')
  const [incomeInput, setIncomeInput] = useState('')
  const [otherExpensesInput, setOtherExpensesInput] = useState('')

  const [rate, setRate] = useState(DEFAULT_KES_PER_USD)

  useEffect(() => {
    const controller = new AbortController()
    fetch('https://open.er-api.com/v6/latest/USD', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const live = data?.rates?.KES
        if (typeof live === 'number' && live > 0) setRate(live)
      })
      .catch(() => {
        // keep the fallback rate
      })
    return () => controller.abort()
  }, [])

  const rentKES = (parseFloat(rentInput) || 0) * (currency === 'KES' ? 1 : rate)
  const agentDefaultKES = rentKES
  const agentKES = includeAgent
    ? agentInput
      ? (parseFloat(agentInput) || 0) * (currency === 'KES' ? 1 : rate)
      : agentDefaultKES
    : 0
  const movingCostKES = (parseFloat(movingCostInput) || 0) * (currency === 'KES' ? 1 : rate)
  const utilityDepositKES = (parseFloat(utilityDepositInput) || 0) * (currency === 'KES' ? 1 : rate)
  const furnishingKES = (parseFloat(furnishingInput) || 0) * (currency === 'KES' ? 1 : rate)
  const serviceChargeKES = (parseFloat(serviceChargeInput) || 0) * (currency === 'KES' ? 1 : rate)
  const incomeKES = (parseFloat(incomeInput) || 0) * (currency === 'KES' ? 1 : rate)
  const otherExpensesKES = (parseFloat(otherExpensesInput) || 0) * (currency === 'KES' ? 1 : rate)

  const depositAmountKES = rentKES * depositMonths
  const advanceAmountKES = rentKES * advanceMonths
  const otherUpfrontKES = movingCostKES + utilityDepositKES + furnishingKES
  const totalUpfrontKES = depositAmountKES + advanceAmountKES + agentKES + otherUpfrontKES
  const monthlyHousingCostKES = rentKES + serviceChargeKES

  const rentPctOfIncome = incomeKES > 0 ? (rentKES / incomeKES) * 100 : null
  const affordability: 'good' | 'stretch' | 'high' | null =
    rentPctOfIncome === null ? null : rentPctOfIncome <= 30 ? 'good' : rentPctOfIncome <= 40 ? 'stretch' : 'high'

  const monthlySurplusKES = incomeKES > 0 ? incomeKES - otherExpensesKES - monthlyHousingCostKES : null
  const monthsToSave =
    monthlySurplusKES && monthlySurplusKES > 0 ? Math.ceil(totalUpfrontKES / monthlySurplusKES) : null

  const toDisplay = (kes: number) => (currency === 'KES' ? kes : kes / rate)
  const fmt = (kes: number) =>
    currency === 'KES' ? formatKES(kes) : `$${Math.max(0, Math.round(toDisplay(kes))).toLocaleString('en-US')}`

  const applyScenario = (key: Scenario) => {
    const s = SCENARIOS[key]
    setRentInput(String(currency === 'KES' ? s.rent : Math.round(s.rent / rate)))
    setDepositMonths(s.depositMonths)
    setIncludeAgent(s.includeAgent)
  }

  const applyPropertyType = (key: PropertyType) => {
    setPropertyType(key)
    const preset = PROPERTY_PRESETS[key]
    setRentInput(String(currency === 'KES' ? preset.rent : Math.round(preset.rent / rate)))
  }

  const copyResult = () => {
    const text = `Monthly rent: ${fmt(rentKES)} | Deposit (${depositMonths}mo): ${fmt(depositAmountKES)} | Advance (${advanceMonths}mo): ${fmt(advanceAmountKES)} | Agent: ${fmt(agentKES)} | Other upfront: ${fmt(otherUpfrontKES)} | Total move-in cost: ${fmt(totalUpfrontKES)}`
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Currency toggle */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
        {(['KES', 'USD'] as Currency[]).map(c => (
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

      {/* Scenario presets */}
      <div className="flex gap-2">
        {(Object.keys(SCENARIOS) as Scenario[]).map(key => (
          <button
            key={key}
            type="button"
            onClick={() => applyScenario(key)}
            className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
          >
            {SCENARIOS[key].label}
          </button>
        ))}
      </div>

      {/* Property type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Property type</label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(PROPERTY_PRESETS) as PropertyType[]).map(key => (
            <button
              key={key}
              type="button"
              onClick={() => applyPropertyType(key)}
              className={`text-xs font-medium px-2 py-2 rounded-lg border transition-colors ${propertyType === key ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {PROPERTY_PRESETS[key].label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">{PROPERTY_PRESETS[propertyType].range}</p>
      </div>

      {/* Rent */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Monthly rent ({currency})</label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(rentInput)}
          onChange={e => setRentInput(cleanNumberInput(e.target.value))}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
        <input
          type="range"
          min={5_000}
          max={200_000}
          step={1_000}
          value={currency === 'KES' ? parseFloat(rentInput) || 0 : (parseFloat(rentInput) || 0) * rate}
          onChange={e => setRentInput(currency === 'KES' ? e.target.value : String(Math.round(Number(e.target.value) / rate)))}
          className="w-full accent-indigo-700 mt-2"
        />
      </div>

      {/* Deposit / advance / agent */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deposit (months)</label>
          <select
            value={depositMonths}
            onChange={e => setDepositMonths(parseFloat(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          >
            {[1, 1.5, 2, 2.5, 3].map(m => (
              <option key={m} value={m}>{m} month{m !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Advance rent (months)</label>
          <select
            value={advanceMonths}
            onChange={e => setAdvanceMonths(parseFloat(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          >
            {[0, 1, 2].map(m => (
              <option key={m} value={m}>{m} month{m !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-1.5">
          <input type="checkbox" checked={includeAgent} onChange={e => setIncludeAgent(e.target.checked)} className="accent-indigo-700" />
          Agent commission (commonly 1 month&apos;s rent, tenant-paid)
        </label>
        {includeAgent && (
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(agentInput)}
            onChange={e => setAgentInput(cleanNumberInput(e.target.value))}
            placeholder={fmt(agentDefaultKES)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          />
        )}
      </div>

      {/* Other upfront costs */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Moving costs</label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(movingCostInput)}
            onChange={e => setMovingCostInput(cleanNumberInput(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Utility deposits</label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(utilityDepositInput)}
            onChange={e => setUtilityDepositInput(cleanNumberInput(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Furnishing</label>
          <input
            type="text"
            inputMode="decimal"
            value={formatNumberInput(furnishingInput)}
            onChange={e => setFurnishingInput(cleanNumberInput(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Estimated monthly service charge / utilities on top of rent</label>
        <input
          type="text"
          inputMode="decimal"
          value={formatNumberInput(serviceChargeInput)}
          onChange={e => setServiceChargeInput(cleanNumberInput(e.target.value))}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400"
        />
      </div>

      {/* Affordability (optional) */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Affordability check (optional)</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly income</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(incomeInput)}
              onChange={e => setIncomeInput(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Other monthly expenses</label>
            <input
              type="text"
              inputMode="decimal"
              value={formatNumberInput(otherExpensesInput)}
              onChange={e => setOtherExpensesInput(cleanNumberInput(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Deposit ({depositMonths} mo, refundable)</dt>
            <dd className="font-medium text-gray-800">{fmt(depositAmountKES)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Advance rent ({advanceMonths} mo)</dt>
            <dd className="font-medium text-gray-800">{fmt(advanceAmountKES)}</dd>
          </div>
          {includeAgent && (
            <div className="flex justify-between">
              <dt className="text-gray-500">Agent commission</dt>
              <dd className="font-medium text-gray-800">{fmt(agentKES)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500">Other upfront (moving, utility deposits, furnishing)</dt>
            <dd className="font-medium text-gray-800">{fmt(otherUpfrontKES)}</dd>
          </div>
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Total cash needed to move in</dt>
            <dd className="font-semibold text-indigo-700 text-lg">{fmt(totalUpfrontKES)}</dd>
          </div>
          <div className="flex justify-between border-t border-indigo-100 pt-2">
            <dt className="text-gray-700 font-medium">Monthly housing cost (rent + service charge)</dt>
            <dd className="font-semibold text-gray-800">{fmt(monthlyHousingCostKES)}</dd>
          </div>
        </dl>

        {affordability && (
          <div
            className={`text-xs rounded-lg px-3 py-2.5 font-medium ${
              affordability === 'good'
                ? 'bg-emerald-50 text-emerald-700'
                : affordability === 'stretch'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            Rent is about {rentPctOfIncome!.toFixed(0)}% of your monthly income —{' '}
            {affordability === 'good' ? 'within the common 30% guideline.' : affordability === 'stretch' ? 'a bit of a stretch above the usual 30% guideline.' : 'well above the usual 30% guideline; budget carefully.'}
          </div>
        )}

        {monthsToSave !== null && (
          <p className="text-xs text-gray-500">
            At your current surplus, saving up the full move-in amount would take about <span className="font-semibold text-gray-700">{monthsToSave} month{monthsToSave !== 1 ? 's' : ''}</span>.
          </p>
        )}

        <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
          Copy result
        </button>
      </div>

      {/* Notes */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800">What this calculator assumes</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>Kenya has no statutory cap on residential deposits (outside old, low-rent controlled tenancies under the Rent Restriction Act) — the deposit/advance figures here are market norms, especially in Nairobi, not legal maximums.</li>
          <li>Deposits should only be reduced for unpaid rent/utilities or documented damage beyond normal wear and tear, with an itemised statement — not for general wear.</li>
          <li>There&apos;s no fixed statutory refund deadline; 14–30 days after vacating is the commonly cited reasonable window in tribunal practice.</li>
          <li>Deposit disputes can go to the Small Claims Court (claims up to KES 1,000,000, no lawyer needed) or the Rent Restriction Tribunal for qualifying tenancies.</li>
          <li>Rates outside Nairobi, and in lower-cost Nairobi neighbourhoods, are often lower than the presets shown here — treat these as a starting point, not a quote.</li>
        </ul>
        <p className="text-[11px] text-gray-400 pt-1">
          This is a budgeting tool based on common market practice, not legal advice. Always get your tenancy terms in writing, photograph the property&apos;s condition at move-in, and pay through traceable methods (M-Pesa/bank transfer) with receipts.
        </p>
      </div>
    </div>
  )
}
