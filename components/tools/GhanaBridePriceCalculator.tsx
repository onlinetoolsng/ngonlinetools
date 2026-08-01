'use client'

import { useMemo, useState } from 'react'
import { cleanNumberInput, formatNumberInput } from '@/lib/utils/numberInput'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  GHANA_ETHNIC_GROUPS,
  getEthnicGroup,
  BRIDE_PRICE_ITEMS,
  CATEGORY_LABELS,
  EDUCATION_LABELS,
  EDUCATION_MULTIPLIER,
  FAMILY_STATUS_MULTIPLIER,
  CEREMONY_SCALE_MULTIPLIER,
  CEREMONY_SCALE_LABELS,
  type EthnicGroupKey,
  type EducationLevel,
  type FamilyStatus,
  type CeremonyScale,
  type ItemCategory,
} from '@/lib/data/ghanaBridePriceData'

// ─── Cultural & legal context ──────────────────────────────────────────────
// Bride price (bridewealth) is a customary practice central to validating
// traditional/customary marriages in Ghana, which are legally recognised
// once essential rites — including presentation and acceptance of the
// bride price items — are performed and witnessed. There is no national
// statute capping amounts or items; customs vary by ethnic group, family,
// region, and negotiation. It is symbolic of respect and family bonding,
// not a purchase, and is typically paid by the groom (or his family) to
// the bride's family. Customary marriages can additionally be registered
// under PNDCL 112 for stronger legal recognition.
//
// This tool is an estimation/planning aid built from public cultural data
// and typical market rates — not a fixed price list, not legal advice, and
// not a substitute for the family's own negotiation.

const PIE_COLORS = ['#047857', '#f59e0b', '#0ea5e9', '#dc2626', '#7c3aed']
const CATEGORY_ORDER: ItemCategory[] = ['knocking', 'core', 'brideItems', 'drinksProvisions', 'other']

function formatGHS(value: number) {
  if (!Number.isFinite(value)) return 'GHS 0'
  return `GHS ${Math.max(0, Math.round(value)).toLocaleString('en-GH')}`
}

export default function GhanaBridePriceCalculator() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)

  // Step 0: ethnic group
  const [groupKey, setGroupKey] = useState<EthnicGroupKey>('akan')
  const group = getEthnicGroup(groupKey)

  // Step 1: profile factors
  const [education, setEducation] = useState<EducationLevel>('tertiary')
  const [familyStatus, setFamilyStatus] = useState<FamilyStatus>('medium')
  const [ceremonyScale, setCeremonyScale] = useState<CeremonyScale>('standard')

  // Step 2: itemized list — include/qty/price state, seeded from item defaults
  const [included, setIncluded] = useState<Record<string, boolean>>(
    Object.fromEntries(BRIDE_PRICE_ITEMS.map(i => [i.id, i.includedByDefault]))
  )
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(BRIDE_PRICE_ITEMS.map(i => [i.id, i.defaultQty]))
  )
  const [price, setPrice] = useState<Record<string, number>>(
    Object.fromEntries(BRIDE_PRICE_ITEMS.map(i => [i.id, i.defaultPriceGHS]))
  )
  const [customItems, setCustomItems] = useState<{ id: string; label: string; qty: number; price: number }[]>([])
  const [contingencyPct, setContingencyPct] = useState(15)

  function applyGroupDefaults(key: EthnicGroupKey) {
    setGroupKey(key)
    setIncluded(prev => {
      const next = { ...prev }
      for (const item of BRIDE_PRICE_ITEMS) {
        if (item.groups) {
          next[item.id] = item.groups.includes(key) ? item.includedByDefault : false
        }
      }
      return next
    })
  }

  const visibleItems = useMemo(
    () => BRIDE_PRICE_ITEMS.filter(item => !item.groups || item.groups.includes(groupKey)),
    [groupKey]
  )

  const itemsByCategory = useMemo(() => {
    const map: Record<ItemCategory, typeof BRIDE_PRICE_ITEMS> = {
      knocking: [], core: [], brideItems: [], drinksProvisions: [], other: [],
    }
    for (const item of visibleItems) map[item.category].push(item)
    return map
  }, [visibleItems])

  const categorySubtotal = (category: ItemCategory) =>
    itemsByCategory[category].reduce((sum, item) => {
      if (!included[item.id]) return sum
      return sum + (qty[item.id] || 0) * (price[item.id] || 0)
    }, 0)

  const itemsSubtotal = CATEGORY_ORDER.reduce((sum, c) => sum + categorySubtotal(c), 0)
  const customTotal = customItems.reduce((sum, c) => sum + c.qty * c.price, 0)

  const multiplier = EDUCATION_MULTIPLIER[education] * FAMILY_STATUS_MULTIPLIER[familyStatus] * CEREMONY_SCALE_MULTIPLIER[ceremonyScale]
  const adjustedSubtotal = (itemsSubtotal + customTotal) * multiplier
  const contingency = adjustedSubtotal * (contingencyPct / 100)
  const grandTotal = adjustedSubtotal + contingency

  const lowEstimate = grandTotal * 0.85
  const highEstimate = grandTotal * 1.25

  const pieData = useMemo(
    () =>
      CATEGORY_ORDER.map(c => ({ name: CATEGORY_LABELS[c], value: categorySubtotal(c) * multiplier })).filter(
        d => d.value > 0
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemsByCategory, included, qty, price, multiplier]
  )

  function addCustomItem() {
    setCustomItems(list => [...list, { id: `custom-${Date.now()}`, label: '', qty: 1, price: 0 }])
  }

  function copyResult() {
    const text = `${group.label} (${group.localTerm}) bride price plan — Items: ${formatGHS(itemsSubtotal + customTotal)} | After profile adjustment: ${formatGHS(adjustedSubtotal)} | Contingency: ${formatGHS(contingency)} | Estimated total: ${formatGHS(lowEstimate)}–${formatGHS(highEstimate)}`
    navigator.clipboard.writeText(text)
  }

  const steps = ['Ethnic Group', 'Profile', 'Item List', 'Results']

  return (
    <div className="space-y-6">
      {/* Step tabs */}
      <div className="flex gap-1 text-xs font-semibold">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i as 0 | 1 | 2 | 3)}
            className={`flex-1 px-2 py-2 rounded-lg border transition-colors ${step === i ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-500 border-gray-200'}`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {/* Step 0: Ethnic Group */}
      {step === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Customs vary widely between and within Ghana&apos;s ethnic groups — this uses public averages as a starting point. Select your group for tailored defaults, all of which you can adjust.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GHANA_ETHNIC_GROUPS.map(g => (
              <button
                key={g.key}
                type="button"
                onClick={() => applyGroupDefaults(g.key)}
                className={`text-left px-3 py-3 rounded-xl border text-sm transition-colors ${groupKey === g.key ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:border-green-200'}`}
              >
                <div className="font-semibold text-gray-900">{g.label}</div>
                <div className="text-xs text-gray-500">{g.localTerm}</div>
              </button>
            ))}
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-600">
            <p>{group.notes}</p>
          </div>
          <button type="button" onClick={() => setStep(1)} className="w-full bg-green-700 text-white font-semibold py-3 rounded-xl">Next: Profile</button>
        </div>
      )}

      {/* Step 1: Profile */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bride&apos;s education level</label>
            <select value={education} onChange={e => setEducation(e.target.value as EducationLevel)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900">
              {(Object.keys(EDUCATION_LABELS) as EducationLevel[]).map(key => (
                <option key={key} value={key}>{EDUCATION_LABELS[key]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Family status</label>
            <select value={familyStatus} onChange={e => setFamilyStatus(e.target.value as FamilyStatus)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900">
              <option value="modest">Modest</option>
              <option value="medium">Medium</option>
              <option value="prominent">Prominent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ceremony scale</label>
            <select value={ceremonyScale} onChange={e => setCeremonyScale(e.target.value as CeremonyScale)} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-900">
              {(Object.keys(CEREMONY_SCALE_LABELS) as CeremonyScale[]).map(key => (
                <option key={key} value={key}>{CEREMONY_SCALE_LABELS[key]}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400">These are optional, adjustable factors reflecting patterns some families reference in negotiation — not fixed rules, and never a reflection of a person&apos;s worth.</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl">Back</button>
            <button type="button" onClick={() => setStep(2)} className="flex-1 bg-green-700 text-white font-semibold py-3 rounded-xl">Next: Item List</button>
          </div>
        </div>
      )}

      {/* Step 2: Item list */}
      {step === 2 && (
        <div className="space-y-5">
          {CATEGORY_ORDER.map(category => (
            itemsByCategory[category].length > 0 && (
              <div key={category}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-gray-700">{CATEGORY_LABELS[category]}</p>
                  <p className="text-xs text-gray-400">{formatGHS(categorySubtotal(category))}</p>
                </div>
                <div className="space-y-2">
                  {itemsByCategory[category].map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={included[item.id]}
                        onChange={e => setIncluded(s => ({ ...s, [item.id]: e.target.checked }))}
                        className="accent-green-700"
                        aria-label={item.label}
                      />
                      <div className="flex-1">
                        <span className="text-gray-700">{item.label}</span>
                        <p className="text-[11px] text-gray-400">{item.description}</p>
                      </div>
                      <input
                        type="number"
                        min={0}
                        value={qty[item.id]}
                        onChange={e => setQty(q => ({ ...q, [item.id]: parseInt(e.target.value) || 0 }))}
                        className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                        aria-label={`Quantity for ${item.label}`}
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumberInput(String(price[item.id]))}
                        onChange={e => setPrice(p => ({ ...p, [item.id]: parseFloat(cleanNumberInput(e.target.value)) || 0 }))}
                        className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                        aria-label={`Price for ${item.label}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}

          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-700">Custom items</p>
              <button type="button" onClick={addCustomItem} className="text-xs font-medium text-green-700 hover:text-green-900">+ Add item</button>
            </div>
            {customItems.length === 0 && <p className="text-xs text-gray-400">Add anything specific to your family&apos;s list — extra cloths, a business capital gift, etc.</p>}
            <div className="space-y-2">
              {customItems.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={c.label}
                    onChange={e => setCustomItems(list => list.map((it, idx) => idx === i ? { ...it, label: e.target.value } : it))}
                    className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    value={c.qty}
                    onChange={e => setCustomItems(list => list.map((it, idx) => idx === i ? { ...it, qty: parseInt(e.target.value) || 0 } : it))}
                    className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="GHS"
                    value={formatNumberInput(String(c.price))}
                    onChange={e => setCustomItems(list => list.map((it, idx) => idx === i ? { ...it, price: parseFloat(cleanNumberInput(e.target.value)) || 0 } : it))}
                    className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                  />
                  <button type="button" onClick={() => setCustomItems(list => list.filter((_, idx) => idx !== i))} className="text-xs text-red-500">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contingency / negotiation buffer: {contingencyPct}%</label>
            <input type="range" min={0} max={30} value={contingencyPct} onChange={e => setContingencyPct(parseInt(e.target.value))} className="w-full accent-green-700" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl">Back</button>
            <button type="button" onClick={() => setStep(3)} className="flex-1 bg-green-700 text-white font-semibold py-3 rounded-xl">See results</button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-green-50 rounded-2xl p-6 border border-green-100 space-y-3">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">{group.label} · {group.localTerm}</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Item list subtotal</dt>
                <dd className="font-medium text-gray-800">{formatGHS(itemsSubtotal + customTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">After profile adjustment (×{multiplier.toFixed(2)})</dt>
                <dd className="font-medium text-gray-800">{formatGHS(adjustedSubtotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-green-100 pt-2">
                <dt className="text-gray-700 font-medium">Contingency ({contingencyPct}%)</dt>
                <dd className="font-semibold text-gray-800">{formatGHS(contingency)}</dd>
              </div>
              <div className="flex justify-between border-t border-green-100 pt-2">
                <dt className="text-gray-700 font-medium">Estimated total range</dt>
                <dd className="font-semibold text-green-700 text-lg">{formatGHS(lowEstimate)} – {formatGHS(highEstimate)}</dd>
              </div>
            </dl>
            <button type="button" onClick={copyResult} className="text-xs font-medium text-green-600 hover:text-green-800">Copy result</button>
          </div>

          {pieData.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Composition breakdown</p>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={34} outerRadius={64}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => formatGHS(Number(v ?? 0))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
            <h3 className="text-sm font-semibold text-gray-800">Good to know</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Bride price validates a traditional/customary marriage in Ghana, which is legally recognised once essential rites are performed and witnessed — there is no national statute fixing amounts or items.</li>
              <li>Payment is symbolic of respect and family bonding, not a purchase. It is typically paid by the groom or his family to the bride&apos;s family.</li>
              <li>Customs vary enormously by ethnic group, family, region, and negotiation — treat every figure here as a starting point, not a rule.</li>
              <li>Customary marriages can be registered under PNDCL 112 for stronger legal recognition.</li>
            </ul>
            <p className="text-[11px] text-gray-400 pt-1">
              This is an estimation/planning tool based on public cultural data and typical costs. Actual amounts are negotiated by families and vary widely. Not legal or financial advice — consult your family elders and, for legal questions, a lawyer.
            </p>
          </div>

          <button type="button" onClick={() => setStep(0)} className="w-full border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl">Start over</button>
        </div>
      )}
    </div>
  )
}
