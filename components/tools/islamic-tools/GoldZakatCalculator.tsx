'use client'

import { useState, useEffect, useCallback } from 'react'
import { FALLBACK_GOLD_USD_PER_GRAM } from '@/lib/constants/metalPrices'

type Props = { locale: string }

// ── Constants ────────────────────────────────────────────────────────────────
const NISAB_GOLD_GRAMS = 85          // pure 24K grams (scholarly consensus)
const ZAKAT_RATE       = 0.025
const TROY_OZ_TO_GRAM  = 31.1035
const TOLA_TO_GRAM     = 11.6638
const KARAT_OPTIONS    = [24, 22, 21, 18, 14, 9]

const CURRENCIES = [
  { value: 'AED', label: 'UAE — AED',          flag: '🇦🇪' },
  { value: 'SAR', label: 'Saudi Arabia — SAR',  flag: '🇸🇦' },
  { value: 'QAR', label: 'Qatar — QAR',         flag: '🇶🇦' },
  { value: 'KWD', label: 'Kuwait — KWD',        flag: '🇰🇼' },
  { value: 'BHD', label: 'Bahrain — BHD',       flag: '🇧🇭' },
  { value: 'OMR', label: 'Oman — OMR',          flag: '🇴🇲' },
  { value: 'EGP', label: 'Egypt — EGP',         flag: '🇪🇬' },
  { value: 'USD', label: 'USD',                 flag: '🌍' },
  { value: 'GBP', label: 'GBP',                 flag: '🇬🇧' },
  { value: 'EUR', label: 'EUR',                 flag: '🇪🇺' },
]

type Unit = 'g' | 'tola' | 'oz'
type GoldType = 'investment' | 'jewellery'

interface Holding {
  id: string
  type: GoldType
  weight: string
  karat: number
  unit: Unit
}

interface PriceData {
  pricePerGram24K: number   // in USD
  rates: Record<string, number>
  updatedAt: string
  live: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function toGrams(weight: number, unit: Unit): number {
  if (unit === 'tola') return weight * TOLA_TO_GRAM
  if (unit === 'oz')   return weight * TROY_OZ_TO_GRAM
  return weight
}

function pureGrams(h: Holding): number {
  const w = parseFloat(h.weight) || 0
  return toGrams(w, h.unit) * (h.karat / 24)
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n)
}

function fmtG(n: number) {
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}g`
}

async function fetchPrices(): Promise<PriceData> {
  try {
    const [metalRes, fxRes] = await Promise.all([
      fetch('https://api.metals.live/v1/spot/gold', { cache: 'no-store' }),
      fetch('https://api.frankfurter.app/latest?from=USD&to=AED,SAR,QAR,KWD,BHD,OMR,EGP,GBP,EUR'),
    ])
    const metalData = await metalRes.json()
    const fxData    = await fxRes.json()
    const ozPrice   = Array.isArray(metalData) ? metalData[0]?.price : metalData?.price
    if (!ozPrice) throw new Error('no price')
    return {
      pricePerGram24K: ozPrice / TROY_OZ_TO_GRAM,
      rates: { USD: 1, ...fxData.rates },
      updatedAt: new Date().toLocaleTimeString(),
      live: true,
    }
  } catch {
    return {
      pricePerGram24K: FALLBACK_GOLD_USD_PER_GRAM,
      rates: { USD: 1, AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.307, BHD: 0.376, OMR: 0.385, EGP: 48.5, GBP: 0.79, EUR: 0.92 },
      updatedAt: 'cached',
      live: false,
    }
  }
}

let holdingCounter = 1
function newHolding(type: GoldType = 'investment'): Holding {
  return { id: `h${holdingCounter++}`, type, weight: '', karat: 24, unit: 'g' }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function GoldZakatCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [currency,      setCurrency]      = useState('AED')
  const [holdings,      setHoldings]      = useState<Holding[]>([newHolding()])
  const [hawlConfirmed, setHawlConfirmed] = useState(false)
  const [madhab,        setMadhab]        = useState<'hanafi' | 'majority'>('majority')
  const [prices,        setPrices]        = useState<PriceData | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [showResult,    setShowResult]    = useState(false)

  useEffect(() => {
    fetchPrices().then(p => { setPrices(p); setLoading(false) })
  }, [])

  // ── Derived ────────────────────────────────────────────────────────────────
  const rate = prices?.rates[currency] ?? 1
  const pricePerGram = (prices?.pricePerGram24K ?? FALLBACK_GOLD_USD_PER_GRAM) * rate

  const calcHoldings = useCallback(() => {
    return holdings.map(h => {
      const pg  = pureGrams(h)
      const val = pg * pricePerGram
      // jewellery exempt under majority unless Hanafi
      const exempt = h.type === 'jewellery' && madhab === 'majority'
      return { ...h, pureGrams: pg, value: val, exempt }
    })
  }, [holdings, pricePerGram, madhab])

  const computed = calcHoldings()

  const totalPureGrams = computed.filter(h => !h.exempt).reduce((s, h) => s + h.pureGrams, 0)
  const totalValue     = computed.filter(h => !h.exempt).reduce((s, h) => s + h.value, 0)
  const nisabValue     = NISAB_GOLD_GRAMS * pricePerGram
  const eligible       = hawlConfirmed && totalPureGrams >= NISAB_GOLD_GRAMS
  const zakatDue       = eligible ? totalValue * ZAKAT_RATE : 0
  const progressPct    = Math.min(100, (totalPureGrams / NISAB_GOLD_GRAMS) * 100)

  // ── Holding helpers ────────────────────────────────────────────────────────
  function addHolding(type: GoldType) {
    setHoldings(h => [...h, newHolding(type)])
  }
  function removeHolding(id: string) {
    setHoldings(h => h.filter(x => x.id !== id))
  }
  function updateHolding(id: string, patch: Partial<Holding>) {
    setHoldings(h => h.map(x => x.id === id ? { ...x, ...patch } : x))
  }

  // ── Labels ─────────────────────────────────────────────────────────────────
  const L = isAr ? {
    title: 'حاسبة زكاة الذهب',
    subtitle: 'الذهب الاستثماري والمجوهرات — بالجرام والتولة والأوقية',
    currency: 'العملة',
    madhab: 'المذهب الفقهي',
    majority: 'الجمهور (شافعي/مالكي/حنبلي)',
    hanafi: 'الحنفي',
    madhabNote: 'الجمهور يُعفي مجوهرات الاستخدام الشخصي. الحنفية تُوجب الزكاة على كل الذهب.',
    holdings: 'الذهب المملوك',
    addInvestment: '+ إضافة ذهب استثماري / سبائك',
    addJewellery: '+ إضافة مجوهرات',
    investment: 'استثماري / سبائك',
    jewellery: 'مجوهرات',
    weight: 'الوزن',
    karat: 'العيار',
    unit: 'الوحدة',
    pureLabel: 'ذهب خالص',
    valueLabel: 'القيمة',
    exempt: 'معفاة (الجمهور)',
    hawl: 'أؤكد أن هذا الذهب بحوزتي لمدة حول كامل (عام هجري)',
    calculate: 'احسب الزكاة',
    reset: 'إعادة تعيين',
    results: 'نتيجة زكاة الذهب',
    zakatDue: 'الزكاة الواجبة',
    notEligible: 'لا زكاة واجبة',
    notEligibleDesc: 'إجمالي الذهب الخالص أقل من النصاب (85 جرام) أو لم يكتمل الحول.',
    totalPure: 'إجمالي الذهب الخالص',
    totalValue: 'إجمالي القيمة',
    nisab: 'النصاب (85 جرام ذهب خالص)',
    livePrice: 'سعر الجرام 24 قيراط (مباشر)',
    cachedPrice: 'سعر الجرام 24 قيراط (مخزن)',
    progressLabel: 'التقدم نحو النصاب',
    disclaimer: 'هذه أداة حسابية للمعلومات العامة. ليست فتوى. استشر عالماً مؤهلاً. أحكام المجوهرات تختلف بحسب المذهب. استخدم السعر يوم استحقاق الزكاة.',
    remove: 'حذف',
    g: 'جرام', tola: 'تولة', oz: 'أوقية',
    noHawl: 'لم يُؤكَّد الحول',
    belowNisab: 'أقل من النصاب',
    enterAmount: 'أدخل الوزن',
  } : {
    title: 'Gold Zakat Calculator',
    subtitle: 'Investment Gold & Jewellery — Grams, Tola & Ounces',
    currency: 'Currency',
    madhab: 'School of Jurisprudence (Madhhab)',
    majority: 'Majority (Shafi\'i / Maliki / Hanbali)',
    hanafi: 'Hanafi',
    madhabNote: 'Majority schools exempt personally worn jewellery. Hanafi requires Zakat on all gold.',
    holdings: 'Your Gold Holdings',
    addInvestment: '+ Add Investment Gold / Bullion',
    addJewellery: '+ Add Jewellery',
    investment: 'Investment / Bullion',
    jewellery: 'Jewellery',
    weight: 'Weight',
    karat: 'Karat',
    unit: 'Unit',
    pureLabel: 'Pure gold',
    valueLabel: 'Value',
    exempt: 'Exempt (Majority)',
    hawl: 'I confirm this gold has been in my possession for one full lunar year (hawl)',
    calculate: 'Calculate Zakat',
    reset: 'Reset',
    results: 'Your Gold Zakat Result',
    zakatDue: 'Zakat Due',
    notEligible: 'No Zakat Due',
    notEligibleDesc: 'Total pure gold is below nisab (85g) or hawl is not confirmed.',
    totalPure: 'Total Pure Gold',
    totalValue: 'Total Value',
    nisab: 'Nisab (85g pure gold)',
    livePrice: '24K price / gram (live)',
    cachedPrice: '24K price / gram (cached)',
    progressLabel: 'Progress toward nisab',
    disclaimer: 'This is a calculation aid for general information only. Not a fatwa. Consult a qualified scholar. Jewellery rulings differ by school of jurisprudence. Use the gold price on your Zakat due date.',
    remove: 'Remove',
    g: 'Grams', tola: 'Tola', oz: 'Ounce (troy)',
    noHawl: 'Hawl not confirmed',
    belowNisab: 'Below nisab',
    enterAmount: 'Enter weight',
  }

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
        <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠️</span>
        <p className="text-sm text-amber-800">{L.disclaimer}</p>
      </div>

      {/* Currency + Price strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.currency}</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
          >
            {CURRENCIES.map(c => (
              <option key={c.value} value={c.value}>{c.flag} {c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
            <div className="text-xs text-yellow-600 font-medium mb-0.5">
              {loading ? '…' : prices?.live ? L.livePrice : L.cachedPrice}
            </div>
            <div className="text-lg font-black text-yellow-800">
              {loading ? '…' : fmt(pricePerGram, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Madhab selector */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.madhab}</label>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-2">
          {(['majority', 'hanafi'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMadhab(m)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${madhab === m ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {m === 'majority' ? L.majority : L.hanafi}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{L.madhabNote}</p>
      </div>

      {/* Holdings list */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{L.holdings}</h3>
        <div className="space-y-3">
          {holdings.map((h, idx) => {
            const pg  = pureGrams(h)
            const val = pg * pricePerGram
            const exempt = h.type === 'jewellery' && madhab === 'majority'
            return (
              <div key={h.id} className={`border rounded-xl p-4 space-y-3 ${exempt ? 'border-gray-200 bg-gray-50' : 'border-yellow-100 bg-yellow-50/30'}`}>
                {/* Row header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{h.type === 'investment' ? '🥇' : '💍'}</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {h.type === 'investment' ? L.investment : L.jewellery}
                      {exempt && <span className="ml-2 text-xs text-gray-500 font-normal">({L.exempt})</span>}
                    </span>
                  </div>
                  {holdings.length > 1 && (
                    <button
                      onClick={() => removeHolding(h.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      {L.remove}
                    </button>
                  )}
                </div>

                {/* Inputs row */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Weight */}
                  <div className="col-span-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{L.weight}</label>
                    <input
                      type="number"
                      min="0"
                      value={h.weight}
                      onChange={e => updateHolding(h.id, { weight: e.target.value })}
                      placeholder={L.enterAmount}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition bg-white"
                    />
                  </div>

                  {/* Karat */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{L.karat}</label>
                    <select
                      value={h.karat}
                      onChange={e => updateHolding(h.id, { karat: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
                    >
                      {KARAT_OPTIONS.map(k => (
                        <option key={k} value={k}>{k}K</option>
                      ))}
                    </select>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{L.unit}</label>
                    <select
                      value={h.unit}
                      onChange={e => updateHolding(h.id, { unit: e.target.value as Unit })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition"
                    >
                      <option value="g">{L.g}</option>
                      <option value="tola">{L.tola}</option>
                      <option value="oz">{L.oz}</option>
                    </select>
                  </div>
                </div>

                {/* Live mini-result */}
                {h.weight && parseFloat(h.weight) > 0 && (
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>{L.pureLabel}: <span className="font-semibold text-gray-700">{fmtG(pg)}</span></span>
                    <span>{L.valueLabel}: <span className={`font-semibold ${exempt ? 'text-gray-500 line-through' : 'text-yellow-700'}`}>{fmt(val, currency)}</span></span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => addHolding('investment')}
            className="flex-1 py-2.5 border border-dashed border-yellow-300 text-yellow-700 hover:bg-yellow-50 text-sm font-semibold rounded-xl transition-colors"
          >
            {L.addInvestment}
          </button>
          <button
            onClick={() => addHolding('jewellery')}
            className="flex-1 py-2.5 border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-colors"
          >
            {L.addJewellery}
          </button>
        </div>
      </div>

      {/* Progress toward nisab */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{L.progressLabel}</span>
          <span className="font-semibold">{fmtG(totalPureGrams)} / {NISAB_GOLD_GRAMS}g</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressPct >= 100 ? 'bg-yellow-500' : 'bg-yellow-300'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Hawl */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={hawlConfirmed}
          onChange={e => setHawlConfirmed(e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-yellow-500 rounded"
        />
        <span className="text-sm text-gray-700">{L.hawl}</span>
      </label>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowResult(true)}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {L.calculate}
        </button>
        <button
          onClick={() => {
            setHoldings([newHolding()])
            setHawlConfirmed(false)
            setShowResult(false)
          }}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {L.reset}
        </button>
      </div>

      {/* Results */}
      {showResult && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
          <h3 className="font-bold text-gray-900">{L.results}</h3>

          {/* Hero */}
          {eligible ? (
            <div className="bg-yellow-500 rounded-xl p-4 text-white">
              <div className="text-sm opacity-80 mb-1">{L.zakatDue}</div>
              <div className="text-3xl font-black">{fmt(zakatDue, currency)}</div>
              <div className="text-sm opacity-70 mt-1">2.5% × {fmt(totalValue, currency)}</div>
            </div>
          ) : (
            <div className="bg-gray-200 rounded-xl p-4 text-gray-700">
              <div className="text-lg font-bold">{L.notEligible}</div>
              <div className="text-sm mt-1 opacity-80">{L.notEligibleDesc}</div>
              {!hawlConfirmed && <div className="text-xs mt-1 text-gray-500">→ {L.noHawl}</div>}
              {totalPureGrams < NISAB_GOLD_GRAMS && <div className="text-xs mt-1 text-gray-500">→ {L.belowNisab}: {fmtG(totalPureGrams)} / {NISAB_GOLD_GRAMS}g</div>}
            </div>
          )}

          {/* Breakdown table */}
          <div className="space-y-2.5">
            {computed.map(h => (
              <div key={h.id} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-500">
                  {h.type === 'investment' ? '🥇' : '💍'} {parseFloat(h.weight || '0').toLocaleString()} {h.unit} {h.karat}K
                  {h.exempt && <span className="ml-1 text-xs text-gray-500">({L.exempt})</span>}
                </span>
                <span className={`font-semibold ${h.exempt ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {fmtG(h.pureGrams)} · {fmt(h.value, currency)}
                </span>
              </div>
            ))}

            <div className="border-t border-gray-200 pt-3 space-y-2">
              <GRow label={L.totalPure}  value={fmtG(totalPureGrams)} highlight />
              <GRow label={L.totalValue} value={fmt(totalValue, currency)} />
              <GRow label={L.nisab}      value={`${NISAB_GOLD_GRAMS}g = ${fmt(nisabValue, currency)}`} />
            </div>
          </div>

          <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">{L.disclaimer}</p>
        </div>
      )}
    </div>
  )
}

function GRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-yellow-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}
