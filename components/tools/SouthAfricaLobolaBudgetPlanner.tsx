'use client'

import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

// ─── PURE CLIENT COMPONENT — no SEO, no schema, no registry imports. ───────
// Parent page (app/[locale]/tools/[category]/[tool]/page.tsx) owns SEO.
//
// Framed deliberately and only as a FAMILY BUDGETING / NEGOTIATION-PLANNING
// estimator — never as a "valuation" of a person. Lobola amounts are
// privately negotiated between families under customary law (Recognition
// of Customary Marriages Act 120 of 1998); there is no fixed national rate
// or legal cap. This tool intentionally does NOT include a "virginity
// status" or similar personal-attribute pricing factor sometimes seen in
// other lobola calculators — reducing a person to a price adjustment isn't
// something this tool should do, and it isn't necessary for genuine family
// budget planning.

type Tribe = 'zulu' | 'xhosa' | 'sotho' | 'tswana' | 'other'

const TRIBE_PRESETS: Record<Tribe, { label: string; baseCows: number; note: string }> = {
  zulu: { label: 'Zulu', baseCows: 11, note: 'Traditionally around 10-11 cows (ilobolo), often including an extra "mother\u2019s cow" (ubheka).' },
  xhosa: { label: 'Xhosa', baseCows: 10, note: 'Traditionally around 8-11 cows (ikhazi), varying by family and region.' },
  sotho: { label: 'Sotho / Pedi', baseCows: 8, note: 'Traditionally lower head counts than Nguni customs, commonly negotiated around 8 cows (bohali/magadi).' },
  tswana: { label: 'Tswana', baseCows: 8, note: 'Bogadi negotiations vary widely by family; 8 cows is a common modern starting point.' },
  other: { label: 'Other / Not listed', baseCows: 10, note: 'Use the base cow count your families are working from, or a neutral default.' },
}

const EDUCATION_OPTIONS = [
  { key: 'none', label: 'No formal qualification', multiplier: 1.0 },
  { key: 'matric', label: 'Matric', multiplier: 1.0 },
  { key: 'diploma', label: 'Diploma', multiplier: 1.05 },
  { key: 'degree', label: "Bachelor's Degree", multiplier: 1.15 },
  { key: 'postgrad', label: 'Postgraduate Degree', multiplier: 1.25 },
] as const

const EMPLOYMENT_OPTIONS = [
  { key: 'unemployed', label: 'Unemployed', multiplier: 0.9 },
  { key: 'student', label: 'Student', multiplier: 0.95 },
  { key: 'entry', label: 'Employed (entry-level)', multiplier: 1.0 },
  { key: 'professional', label: 'Employed (professional)', multiplier: 1.1 },
] as const

const PROVINCE_OPTIONS = [
  { key: 'gauteng', label: 'Gauteng', multiplier: 1.15 },
  { key: 'westernCape', label: 'Western Cape', multiplier: 1.15 },
  { key: 'urbanOther', label: 'Other urban area', multiplier: 1.0 },
  { key: 'rural', label: 'Rural area', multiplier: 0.85 },
] as const

const PIE_COLORS = ['#4338ca', '#f59e0b', '#059669']

function formatRand(value: number): string {
  if (!Number.isFinite(value)) return 'R0'
  return 'R' + Math.round(Math.max(0, value)).toLocaleString('en-ZA')
}

export default function SouthAfricaLobolaBudgetPlanner(_props: { locale: string }) {
  const [tribe, setTribe] = useState<Tribe>('zulu')
  const [baseCows, setBaseCows] = useState<number>(TRIBE_PRESETS.zulu.baseCows)
  const [cowValue, setCowValue] = useState<number>(14000)
  const [education, setEducation] = useState<(typeof EDUCATION_OPTIONS)[number]['key']>('matric')
  const [employment, setEmployment] = useState<(typeof EMPLOYMENT_OPTIONS)[number]['key']>('entry')
  const [province, setProvince] = useState<(typeof PROVINCE_OPTIONS)[number]['key']>('urbanOther')
  const [childrenCount, setChildrenCount] = useState<number>(0)
  const [negotiationCosts, setNegotiationCosts] = useState<number>(5000)
  const [giftsCosts, setGiftsCosts] = useState<number>(8000)
  const [includeWeddingBudget, setIncludeWeddingBudget] = useState(false)
  const [weddingBudget, setWeddingBudget] = useState<number>(80000)
  const [installments, setInstallments] = useState<number>(1)

  function handleTribeChange(next: Tribe) {
    setTribe(next)
    setBaseCows(TRIBE_PRESETS[next].baseCows)
  }

  const calc = useMemo(() => {
    const eduMult = EDUCATION_OPTIONS.find(o => o.key === education)?.multiplier ?? 1
    const empMult = EMPLOYMENT_OPTIONS.find(o => o.key === employment)?.multiplier ?? 1
    const provMult = PROVINCE_OPTIONS.find(o => o.key === province)?.multiplier ?? 1

    const rawBaseLobola = baseCows * cowValue
    const adjustedLobola = rawBaseLobola * eduMult * empMult * provMult
    const childrenReduction = Math.min(adjustedLobola * 0.4, childrenCount * cowValue * 0.5)
    const finalLobola = Math.max(cowValue * 2, adjustedLobola - childrenReduction) // floor: at least ~2 cows, negotiation never goes to zero

    const extras = negotiationCosts + giftsCosts
    const weddingAddOn = includeWeddingBudget ? weddingBudget : 0
    const totalEstimate = finalLobola + extras + weddingAddOn

    const installmentAmount = installments > 0 ? totalEstimate / installments : totalEstimate
    const cowEquivalent = cowValue > 0 ? finalLobola / cowValue : 0

    const pieData = [
      { name: 'Lobola (adjusted)', value: finalLobola },
      { name: 'Negotiation & gifts', value: extras },
      ...(includeWeddingBudget ? [{ name: 'Wedding budget', value: weddingAddOn }] : []),
    ]

    return { rawBaseLobola, adjustedLobola, childrenReduction, finalLobola, extras, weddingAddOn, totalEstimate, installmentAmount, cowEquivalent, pieData }
  }, [baseCows, cowValue, education, employment, province, childrenCount, negotiationCosts, giftsCosts, includeWeddingBudget, weddingBudget, installments])

  const shareText = `Lobola budget estimate: ${formatRand(calc.totalEstimate)} total (≈${calc.cowEquivalent.toFixed(1)} cows at ${formatRand(cowValue)}/head), including negotiation & gift costs${includeWeddingBudget ? ' and wedding budget' : ''}. Planning estimate only — final amount is negotiated by the families.`

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Lobola Budget Planner (South Africa)</h2>
        <p className="mt-1 text-sm text-gray-600">
          A family budgeting estimate to help plan for lobola negotiations — not a valuation, not a fixed
          price. The final amount is always negotiated between families.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INPUTS */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Cultural basis</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tribe / culture</label>
            <select
              value={tribe}
              onChange={(e) => handleTribeChange(e.target.value as Tribe)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {(Object.entries(TRIBE_PRESETS) as [Tribe, typeof TRIBE_PRESETS[Tribe]][]).map(([key, preset]) => (
                <option key={key} value={key}>{preset.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{TRIBE_PRESETS[tribe].note}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base cows</label>
              <input
                type="number"
                min={0}
                max={30}
                value={baseCows}
                onChange={(e) => setBaseCows(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cow value (R/head)</label>
              <input
                type="number"
                min={0}
                step={500}
                value={cowValue}
                onChange={(e) => setCowValue(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">
            Current market cattle prices vary roughly R10,000-R20,000+ per head depending on type and region — adjust to match local prices.
          </p>

          <h3 className="text-base font-semibold text-gray-900 pt-2">Family planning factors</h3>
          <p className="text-xs text-gray-400 -mt-2">
            These reflect common modern negotiation practice, not a rule — every family negotiates differently.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
            <select value={education} onChange={(e) => setEducation(e.target.value as typeof education)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {EDUCATION_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment status</label>
            <select value={employment} onChange={(e) => setEmployment(e.target.value as typeof employment)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {EMPLOYMENT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province / area</label>
            <select value={province} onChange={(e) => setProvince(e.target.value as typeof province)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {PROVINCE_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Children from a previous relationship: {childrenCount}
            </label>
            <input
              type="range"
              min={0}
              max={4}
              value={childrenCount}
              onChange={(e) => setChildrenCount(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-1">Some customs adjust the negotiation for this — entirely a family decision.</p>
          </div>

          <h3 className="text-base font-semibold text-gray-900 pt-2">Additional costs</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Negotiation costs (R)</label>
              <input type="number" min={0} value={negotiationCosts} onChange={(e) => setNegotiationCosts(Number(e.target.value) || 0)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gifts (R)</label>
              <input type="number" min={0} value={giftsCosts} onChange={(e) => setGiftsCosts(Number(e.target.value) || 0)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={includeWeddingBudget} onChange={(e) => setIncludeWeddingBudget(e.target.checked)} className="rounded border-gray-300" />
            Include a wedding budget in the total
          </label>
          {includeWeddingBudget && (
            <input type="number" min={0} step={5000} value={weddingBudget} onChange={(e) => setWeddingBudget(Number(e.target.value) || 0)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment plan: {installments} installment{installments === 1 ? '' : 's'}</label>
            <input
              type="range"
              min={1}
              max={12}
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* RESULTS */}
        <div className="rounded-xl border border-gray-200 bg-indigo-50 p-5 space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Budget estimate</h3>

          <div className="rounded-lg bg-white p-4 text-center">
            <p className="text-xs text-gray-500">Total estimated budget</p>
            <p className="text-3xl font-bold text-indigo-700">{formatRand(calc.totalEstimate)}</p>
            <p className="text-xs text-gray-500 mt-1">≈ {calc.cowEquivalent.toFixed(1)} cows at {formatRand(cowValue)}/head</p>
          </div>

          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={calc.pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={54}>
                  {calc.pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => formatRand(Number(v ?? 0))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Adjusted lobola</p>
              <p className="text-sm font-semibold text-gray-900">{formatRand(calc.finalLobola)}</p>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="text-xs text-gray-500">Negotiation & gifts</p>
              <p className="text-sm font-semibold text-gray-900">{formatRand(calc.extras)}</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4">
            <p className="text-xs text-gray-500">Per installment ({installments}x)</p>
            <p className="text-lg font-semibold text-indigo-700">{formatRand(calc.installmentAmount)}</p>
          </div>

          <div className="flex flex-wrap gap-1" aria-hidden="true">
            {Array.from({ length: Math.min(20, Math.round(calc.cowEquivalent)) }).map((_, i) => (
              <span key={i} className="text-lg">🐄</span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(shareText)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
          >
            Copy summary to share
          </button>

          <div className="rounded-lg bg-white p-3 space-y-1">
            <p className="text-xs font-medium text-gray-700">Planning tips</p>
            <ul className="text-xs text-gray-600 list-disc list-inside space-y-0.5">
              <li>Lobola amounts are negotiated by families, not fixed by law — treat this as a starting point for that conversation, not a final number.</li>
              <li>If you want legal recognition and proof of your customary marriage (for inheritance, property, etc.), register it at Home Affairs — there&rsquo;s a special registration window for previously unregistered customary marriages extended to 31 August 2026.</li>
              <li>Without a valid antenuptial contract concluded before the marriage, the default matrimonial property regime is in community of property.</li>
            </ul>
          </div>

          <p className="text-xs text-gray-400">
            This is a planning estimate only, not a valuation of any person and not legal or financial advice.
            The actual amount is negotiated privately between families and varies enormously by culture, region
            and personal circumstances. Consult family elders and, for legal questions, a qualified attorney.
          </p>
        </div>
      </div>
    </div>
  )
}
