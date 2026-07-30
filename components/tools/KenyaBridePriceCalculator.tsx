'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  KENYA_TRIBES,
  getTribe,
  EDUCATION_PREMIUM_KES,
  EDUCATION_LABELS,
  FAMILY_PROMINENCE_MULTIPLIER,
  DEFAULT_LIVESTOCK_PRICE_KES,
  GIFT_ITEMS,
  type TribeKey,
  type EducationLevel,
  type FamilyProminence,
} from '@/lib/data/kenyaDowryData'

// ─── Legal & cultural context ──────────────────────────────────────────────
// Bride price in Kenya (commonly called dowry, or mahari in Swahili) is a
// customary practice, not a statutory requirement under the Marriage Act
// 2014. It's recognised as part of customary marriages but is not
// mandatory for civil, Christian, or other registered marriage types.
// Where disputes arise — refunds on divorce, or enforceability of a
// promise — courts generally treat it as a community-specific custom,
// approached as a symbol of respect, gratitude, and alliance between
// families rather than a purchase price, and it never overrides a
// person's constitutional rights (including a woman's property and
// inheritance rights). Payment is voluntary and negotiated: full payment
// on the day is rare, and instalments over years are common. Refunds on
// dissolution vary by community and circumstances (e.g. whether there are
// children, or which party is at fault) and are not governed by a single
// national rule.
//
// This tool is an estimation/planning aid built from public cultural data
// and typical market rates — not a fixed price list, not legal advice,
// and not a substitute for the family's own negotiation.

const PIE_COLORS = ['#4338ca', '#f59e0b', '#0ea5e9']

function formatKES(value: number) {
  if (!Number.isFinite(value)) return 'KES 0'
  return `KES ${Math.max(0, Math.round(value)).toLocaleString('en-US')}`
}

export function KenyaBridePriceCalculator(_props: { locale: string }) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)

  // Step 1: community
  const [tribeKey, setTribeKey] = useState<TribeKey>('kikuyu')
  const tribe = getTribe(tribeKey)

  // Step 2: profile factors
  const [education, setEducation] = useState<EducationLevel>('degree')
  const [firstBornDaughter, setFirstBornDaughter] = useState(false)
  const [setting, setSetting] = useState<'urban' | 'rural'>('urban')
  const [prominence, setProminence] = useState<FamilyProminence>('medium')

  // Step 3: composition
  const [cows, setCows] = useState(tribe.defaultCows)
  const [goats, setGoats] = useState(tribe.defaultGoats)
  const [cowPrice, setCowPrice] = useState(DEFAULT_LIVESTOCK_PRICE_KES.cow)
  const [goatPrice, setGoatPrice] = useState(DEFAULT_LIVESTOCK_PRICE_KES.goat)
  const [baseCashInput, setBaseCashInput] = useState(String(tribe.defaultCashKES))
  const [selectedGifts, setSelectedGifts] = useState<Record<string, boolean>>(
    Object.fromEntries(GIFT_ITEMS.map(g => [g.id, true]))
  )
  const [giftQty, setGiftQty] = useState<Record<string, number>>(
    Object.fromEntries(GIFT_ITEMS.map(g => [g.id, g.defaultQty]))
  )
  const [giftPrice, setGiftPrice] = useState<Record<string, number>>(
    Object.fromEntries(GIFT_ITEMS.map(g => [g.id, g.defaultPriceKES]))
  )
  const [transportInput, setTransportInput] = useState('10000')
  const [facilitationInput, setFacilitationInput] = useState('15000')
  const [foodDrinksInput, setFoodDrinksInput] = useState('20000')
  const [contingencyPct, setContingencyPct] = useState(15)

  const applyTribeDefaults = (key: TribeKey) => {
    setTribeKey(key)
    const t = getTribe(key)
    setCows(t.defaultCows)
    setGoats(t.defaultGoats)
    setBaseCashInput(String(t.defaultCashKES))
  }

  // ─── Calculations ─────────────────────────────────────────────────────
  const livestockTotal = cows * cowPrice + goats * goatPrice

  const educationPremium = EDUCATION_PREMIUM_KES[education]
  const firstBornPremium = firstBornDaughter ? 20_000 : 0
  const urbanAdjustment = setting === 'urban' ? 15_000 : 0
  const baseCash = parseFloat(baseCashInput) || 0
  const adjustedCash = (baseCash + educationPremium + firstBornPremium + urbanAdjustment) * FAMILY_PROMINENCE_MULTIPLIER[prominence]

  const giftsTotal = GIFT_ITEMS.reduce((sum, g) => {
    if (!selectedGifts[g.id]) return sum
    return sum + (giftQty[g.id] || 0) * (giftPrice[g.id] || 0)
  }, 0)

  const transport = parseFloat(transportInput) || 0
  const facilitation = parseFloat(facilitationInput) || 0
  const foodDrinks = parseFloat(foodDrinksInput) || 0
  const ceremonyExtras = transport + facilitation + foodDrinks

  const subtotal = livestockTotal + adjustedCash + giftsTotal + ceremonyExtras
  const contingency = subtotal * (contingencyPct / 100)
  const grandTotal = subtotal + contingency

  const lowEstimate = grandTotal * 0.85
  const highEstimate = grandTotal * 1.2

  const pieData = useMemo(
    () => [
      { name: 'Livestock', value: livestockTotal },
      { name: 'Cash', value: adjustedCash },
      { name: 'Gifts & ceremony', value: giftsTotal + ceremonyExtras },
    ],
    [livestockTotal, adjustedCash, giftsTotal, ceremonyExtras]
  )

  const copyResult = () => {
    const text = `${tribe.label} (${tribe.localTerm}) dowry plan — Livestock: ${formatKES(livestockTotal)} | Cash: ${formatKES(adjustedCash)} | Gifts & ceremony: ${formatKES(giftsTotal + ceremonyExtras)} | Contingency: ${formatKES(contingency)} | Estimated total: ${formatKES(lowEstimate)}–${formatKES(highEstimate)}`
    navigator.clipboard.writeText(text)
  }

  const steps = ['Community', 'Profile', 'Composition', 'Results']

  return (
    <div className="space-y-6">
      {/* Step tabs */}
      <div className="flex gap-1 text-xs font-semibold">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i as 0 | 1 | 2 | 3)}
            className={`flex-1 px-2 py-2 rounded-lg border transition-colors ${step === i ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-gray-500 border-gray-200'}`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* Step 0: Community */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Customs vary widely between and within communities — this uses public averages as a starting point. Select your community for tailored defaults, all of which you can adjust.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {KENYA_TRIBES.map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => applyTribeDefaults(t.key)}
                className={`text-left px-3 py-3 rounded-xl border text-sm transition-colors ${tribeKey === t.key ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-200'}`}
              >
                <div className="font-semibold text-gray-900">{t.label}</div>
                <div className="text-xs text-gray-500">{t.localTerm}</div>
              </button>
            ))}
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-600 space-y-1.5">
            <p>{tribe.notes}</p>
            <p className="text-xs text-gray-400">{tribe.averageRangeNote}</p>
          </div>
          <button type="button" onClick={() => setStep(1)} className="w-full bg-indigo-700 text-white font-semibold py-3 rounded-xl">Next: Profile</button>
        </div>
      )}

      {/* Step 1: Profile */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Education level</label>
            <select value={education} onChange={e => setEducation(e.target.value as EducationLevel)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900">
              {(Object.keys(EDUCATION_LABELS) as EducationLevel[]).map(key => (
                <option key={key} value={key}>{EDUCATION_LABELS[key]} {EDUCATION_PREMIUM_KES[key] > 0 ? `(+${formatKES(EDUCATION_PREMIUM_KES[key])})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Setting</label>
              <select value={setting} onChange={e => setSetting(e.target.value as 'urban' | 'rural')} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900">
                <option value="urban">Urban (e.g. Nairobi, Kisumu)</option>
                <option value="rural">Rural</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Family prominence</label>
              <select value={prominence} onChange={e => setProminence(e.target.value as FamilyProminence)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900">
                <option value="modest">Modest</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={firstBornDaughter} onChange={e => setFirstBornDaughter(e.target.checked)} className="accent-indigo-700" />
            First-born daughter (some communities note a premium)
          </label>
          <p className="text-xs text-gray-400">These are optional, adjustable factors reflecting patterns some families reference in negotiation — not fixed rules.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl">Back</button>
            <button type="button" onClick={() => setStep(2)} className="flex-1 bg-indigo-700 text-white font-semibold py-3 rounded-xl">Next: Composition</button>
          </div>
        </div>
      )}

      {/* Step 2: Composition */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Livestock</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cows / heifers</label>
                <input type="number" min={0} value={cows} onChange={e => setCows(parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Price per cow (KES)</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(String(cowPrice))} onChange={e => setCowPrice(parseFloat(cleanNumberInput(e.target.value)) || 0)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Goats / sheep</label>
                <input type="number" min={0} value={goats} onChange={e => setGoats(parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Price per goat (KES)</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(String(goatPrice))} onChange={e => setGoatPrice(parseFloat(cleanNumberInput(e.target.value)) || 0)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            </div>
            {tribe.key === 'kikuyu' && (
              <p className="text-xs text-gray-400 mt-1.5">The symbolic full count in Kikuyu custom is often cited as 99 goats — in practice, families commonly agree on a smaller number to pay upfront.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Base negotiated cash (KES, before profile adjustments)</label>
            <input type="text" inputMode="decimal" value={formatNumberInput(baseCashInput)} onChange={e => setBaseCashInput(cleanNumberInput(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900" />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Gifts / shopping list</p>
            <div className="space-y-2">
              {GIFT_ITEMS.map(g => (
                <div key={g.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedGifts[g.id]} onChange={e => setSelectedGifts(s => ({ ...s, [g.id]: e.target.checked }))} className="accent-indigo-700" />
                  <span className="flex-1 text-gray-700">{g.label}</span>
                  <input type="number" min={0} value={giftQty[g.id]} onChange={e => setGiftQty(q => ({ ...q, [g.id]: parseInt(e.target.value) || 0 }))} className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
                  <input type="text" inputMode="decimal" value={formatNumberInput(String(giftPrice[g.id]))} onChange={e => setGiftPrice(p => ({ ...p, [g.id]: parseFloat(cleanNumberInput(e.target.value)) || 0 }))} className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Ceremony extras</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transport</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(transportInput)} onChange={e => setTransportInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Elders&apos; facilitation</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(facilitationInput)} onChange={e => setFacilitationInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Food & drinks</label>
                <input type="text" inputMode="decimal" value={formatNumberInput(foodDrinksInput)} onChange={e => setFoodDrinksInput(cleanNumberInput(e.target.value))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contingency buffer: {contingencyPct}%</label>
            <input type="range" min={0} max={30} value={contingencyPct} onChange={e => setContingencyPct(parseInt(e.target.value))} className="w-full accent-indigo-700" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl">Back</button>
            <button type="button" onClick={() => setStep(3)} className="flex-1 bg-indigo-700 text-white font-semibold py-3 rounded-xl">See results</button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-3">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">{tribe.label} · {tribe.localTerm}</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Livestock ({cows} cow{cows !== 1 ? 's' : ''}, {goats} goat{goats !== 1 ? 's' : ''})</dt>
                <dd className="font-medium text-gray-800">{formatKES(livestockTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Cash (incl. profile adjustments)</dt>
                <dd className="font-medium text-gray-800">{formatKES(adjustedCash)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Gifts</dt>
                <dd className="font-medium text-gray-800">{formatKES(giftsTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Ceremony extras</dt>
                <dd className="font-medium text-gray-800">{formatKES(ceremonyExtras)}</dd>
              </div>
              <div className="flex justify-between border-t border-indigo-100 pt-2">
                <dt className="text-gray-700 font-medium">Contingency ({contingencyPct}%)</dt>
                <dd className="font-semibold text-gray-800">{formatKES(contingency)}</dd>
              </div>
              <div className="flex justify-between border-t border-indigo-100 pt-2">
                <dt className="text-gray-700 font-medium">Estimated total range</dt>
                <dd className="font-semibold text-indigo-700 text-lg">{formatKES(lowEstimate)} – {formatKES(highEstimate)}</dd>
              </div>
            </dl>
            <button type="button" onClick={copyResult} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Copy result</button>
          </div>

          {grandTotal > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Composition breakdown</p>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={64}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => formatKES(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <h3 className="text-sm font-semibold text-gray-800">Good to know</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Bride price is a customary practice under Kenyan law, not a statutory requirement — it applies to customary marriages and isn&apos;t mandatory for civil, Christian, or other registered marriages under the Marriage Act 2014.</li>
              <li>Payment is voluntary and negotiated between families. Full payment on the day is rare — instalments over months or years are common practice.</li>
              <li>It does not override constitutional rights, including a woman&apos;s property and inheritance rights.</li>
              <li>If a marriage ends, refund expectations vary by community and circumstances (e.g. whether there are children) — there is no single national rule.</li>
            </ul>
            <p className="text-[11px] text-gray-400 pt-1">
              This is an estimation/planning tool based on public cultural data and typical market rates. Actual amounts are negotiated by families and vary widely. Not legal or financial advice — consult your elders and, for legal questions, a lawyer.
            </p>
          </div>

          <button type="button" onClick={() => setStep(0)} className="w-full border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl">Start over</button>
        </div>
      )}
    </div>
  )
}
