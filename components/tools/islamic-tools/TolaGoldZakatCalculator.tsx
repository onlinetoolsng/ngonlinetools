'use client'

import { useState, useEffect, useCallback } from 'react'
import { FALLBACK_GOLD_USD_PER_GRAM } from '@/lib/constants/metalPrices'

type Props = { locale: string }

// ─── Shariah Constants ────────────────────────────────────────────────────────
const TOLA_TO_GRAMS = 11.66
const NISAB_TOLA = 7.5
const NISAB_GRAMS = NISAB_TOLA * TOLA_TO_GRAMS // ≈ 87.48g
const ZAKAT_RATE = 0.025

const KARATS = [
  { value: 24, label: '24K (Pure)', purity: 1 },
  { value: 22, label: '22K', purity: 22 / 24 },
  { value: 21, label: '21K', purity: 21 / 24 },
  { value: 18, label: '18K', purity: 18 / 24 },
  { value: 14, label: '14K', purity: 14 / 24 },
]

const CURRENCIES = [
  { value: 'AED', label: 'AED — UAE Dirham',         symbol: 'AED' },
  { value: 'SAR', label: 'SAR — Saudi Riyal',        symbol: 'SAR' },
  { value: 'QAR', label: 'QAR — Qatari Riyal',       symbol: 'QAR' },
  { value: 'KWD', label: 'KWD — Kuwaiti Dinar',      symbol: 'KWD' },
  { value: 'BHD', label: 'BHD — Bahraini Dinar',     symbol: 'BHD' },
  { value: 'OMR', label: 'OMR — Omani Rial',         symbol: 'OMR' },
  { value: 'EGP', label: 'EGP — Egyptian Pound',     symbol: 'EGP' },
  { value: 'PKR', label: 'PKR — Pakistani Rupee',    symbol: 'PKR' },
  { value: 'USD', label: 'USD — US Dollar',          symbol: '$'   },
]

const QUICK_PRESETS = [7.5, 10, 20, 24, 30, 40, 50]

// FX rates vs AED (approximate; updated via free API on load)
const FALLBACK_FX: Record<string, number> = {
  AED: 1,
  SAR: 1.02,
  QAR: 1.00,
  KWD: 0.083,
  BHD: 0.103,
  OMR: 0.105,
  EGP: 13.4,
  PKR: 75.8,
  USD: 0.272,
}

// AED/gram fallback (24K gold), derived from the shared USD fallback.
// See lib/constants/metalPrices.ts. Live fetch will override.
const FALLBACK_PRICE_AED_PER_GRAM = FALLBACK_GOLD_USD_PER_GRAM / FALLBACK_FX.USD

function fmt(n: number, currency: string, decimals = 2) {
  return `${currency} ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

type Result = {
  totalGrams: number
  pureGrams: number
  meetsNisab: boolean
  totalValue: number
  zakatDue: number
  zakatPerTola: number
  currency: string
}

export default function TolaGoldZakatCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  // ── Inputs ──────────────────────────────────────────────────────────────────
  const [tola, setTola]             = useState('')
  const [karat, setKarat]           = useState(24)
  const [currency, setCurrency]     = useState('AED')
  const [hawlConfirmed, setHawl]    = useState(false)
  const [includeJewelry, setJewel]  = useState(true)  // Hanafi: include all
  const [manualPrice, setManualP]   = useState('')
  const [useManual, setUseManual]   = useState(false)

  // ── Live data ───────────────────────────────────────────────────────────────
  const [livePrice, setLivePrice]   = useState<number | null>(null)  // AED/gram
  const [fx, setFx]                 = useState<Record<string, number>>(FALLBACK_FX)
  const [priceLoading, setPriceLoad]= useState(true)
  const [priceUpdated, setPriceUpd] = useState('')

  // ── Result ──────────────────────────────────────────────────────────────────
  const [result, setResult] = useState<Result | null>(null)

  // ── Fetch live gold price (goldapi.io free tier via public proxy) ───────────
  useEffect(() => {
    async function fetchPrice() {
      try {
        // goldprice.org public JSON endpoint (no key, CORS-friendly)
        const res = await fetch(
          'https://data-asg.goldprice.org/dbXRates/AED',
          { cache: 'no-store' }
        )
        const json = await res.json()
        // Returns items array; first item is gold price per oz in AED
        const pricePerOz: number = json?.items?.[0]?.xauPrice
        if (pricePerOz && pricePerOz > 0) {
          const perGram = pricePerOz / 31.1035
          setLivePrice(perGram)
          setPriceUpd(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
        }
      } catch {
        // silently fall back
      } finally {
        setPriceLoad(false)
      }
    }

    async function fetchFx() {
      try {
        // ExchangeRate-API free tier (no key for latest rates from USD)
        const res = await fetch('https://open.er-api.com/v6/latest/AED')
        const json = await res.json()
        if (json?.rates) {
          const rates: Record<string, number> = { AED: 1 }
          for (const c of CURRENCIES) {
            if (json.rates[c.value]) rates[c.value] = json.rates[c.value]
          }
          setFx(rates)
        }
      } catch { /* use fallback */ }
    }

    fetchPrice()
    fetchFx()
  }, [])

  // ── Effective price per gram in selected currency ────────────────────────────
  const effectivePriceAED = useManual && manualPrice
    ? parseFloat(manualPrice) / (fx[currency] || 1)  // convert user input back to AED
    : (livePrice ?? FALLBACK_PRICE_AED_PER_GRAM)

  const pricePerGram = effectivePriceAED * (fx[currency] || 1)

  // ── Calculate ────────────────────────────────────────────────────────────────
  const calculate = useCallback(() => {
    const tolaVal = parseFloat(tola)
    if (!tolaVal || tolaVal <= 0) return

    const purityFactor = KARATS.find(k => k.value === karat)?.purity ?? 1
    const totalGrams = tolaVal * TOLA_TO_GRAMS
    const pureGrams  = totalGrams * purityFactor

    const effectivePure = includeJewelry ? pureGrams : pureGrams  // toggle affects notes only for now
    const meetsNisab    = effectivePure >= NISAB_GRAMS

    const totalValue  = pureGrams * pricePerGram
    const zakatDue    = meetsNisab && hawlConfirmed ? totalValue * ZAKAT_RATE : 0
    const zakatPerTola= (TOLA_TO_GRAMS * purityFactor * pricePerGram) * ZAKAT_RATE

    setResult({ totalGrams, pureGrams, meetsNisab, totalValue, zakatDue, zakatPerTola, currency })
  }, [tola, karat, currency, hawlConfirmed, includeJewelry, pricePerGram])

  function reset() {
    setTola(''); setKarat(24); setCurrency('AED')
    setHawl(false); setJewel(true); setManualP(''); setUseManual(false)
    setResult(null)
  }

  const currencySymbol = CURRENCIES.find(c => c.value === currency)?.symbol ?? currency

  // ── Labels ───────────────────────────────────────────────────────────────────
  const L = isAr ? {
    heading: 'حاسبة زكاة الذهب بالتولة',
    subhead: 'احسب زكاة ذهبك وفق معايير الشريعة الإسلامية',
    tolaLabel: 'كمية الذهب (بالتولة)',
    karatLabel: 'عيار الذهب',
    currencyLabel: 'العملة',
    hawlLabel: 'أمتلك هذا الذهب منذ حول كامل (سنة قمرية)؟',
    jewelryLabel: 'تضمين مجوهرات الاستخدام الشخصي (مذهب حنفي)',
    goldPrice: 'سعر الذهب عيار 24 / غرام',
    manualToggle: 'تعديل يدوي للسعر',
    calculate: 'احسب الزكاة',
    reset: 'مسح',
    results: 'نتائج الحساب',
    zakatDue: 'الزكاة المستحقة',
    zakatPerTola: 'الزكاة لكل تولة',
    totalWeight: 'الوزن الكلي',
    pureGold: 'الذهب الخالص',
    totalValue: 'القيمة السوقية',
    nisabStatus: 'هل تجاوز النصاب؟',
    yes: 'نعم ✓', no: 'لا ✗',
    noZakat: 'لا زكاة واجبة',
    noZakatSub: 'لا تستوفي المتطلبات حالياً.',
    presets: 'حسابات سريعة',
    disclaimer: 'هذه الأداة تقديرية فقط. استشر عالماً معتمداً في بلدك للحصول على فتوى شخصية.',
    live: 'مباشر',
    fallback: 'تقريبي',
    hawlNote: 'يجب تأكيد الحول لحساب الزكاة',
  } : {
    heading: 'Tola Gold Zakat Calculator',
    subhead: 'Calculate Zakat on gold using standard Shariah parameters',
    tolaLabel: 'Total Gold (in Tola)',
    karatLabel: 'Gold Purity (Karat)',
    currencyLabel: 'Display Currency',
    hawlLabel: 'I have owned this gold for one full lunar year (Hawl)?',
    jewelryLabel: 'Include personal-use jewelry (Hanafi school — all gold is zakatable)',
    goldPrice: '24K Gold Price / gram',
    manualToggle: 'Override price manually',
    calculate: 'Calculate Zakat',
    reset: 'Reset',
    results: 'Zakat Breakdown',
    zakatDue: 'Total Zakat Due',
    zakatPerTola: 'Zakat per Tola',
    totalWeight: 'Total Weight',
    pureGold: 'Pure Gold (24K eq.)',
    totalValue: 'Market Value',
    nisabStatus: 'Meets Nisab (7.5 tola / ~87.5g)?',
    yes: 'Yes ✓', no: 'No ✗',
    noZakat: 'No Zakat Due',
    noZakatSub: 'Current conditions do not require Zakat.',
    presets: 'Quick Presets',
    disclaimer: 'This tool provides estimates based on common scholarly consensus. Consult a qualified scholar in your country for a personal fatwa. This is not financial or religious advice.',
    live: 'Live',
    fallback: 'Estimated',
    hawlNote: 'Confirm Hawl (ownership ≥ 1 lunar year) to calculate',
  }

  return (
    <div
      className="space-y-6"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: "'Noto Sans', sans-serif" }}
    >
      {/* Gold Price Banner */}
      <div className="flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-amber-600 text-lg">✦</span>
          <span className="text-sm font-semibold text-amber-800">
            {L.goldPrice}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {priceLoading ? (
            <span className="text-xs text-amber-500 animate-pulse">Loading…</span>
          ) : (
            <>
              <span className="text-sm font-bold text-amber-900">
                {fmt(pricePerGram, currencySymbol)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                livePrice ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {livePrice ? L.live : L.fallback}
                {priceUpdated ? ` · ${priceUpdated}` : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{L.presets}</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map(p => (
            <button
              key={p}
              onClick={() => { setTola(String(p)); setResult(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${
                tola === String(p)
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
              }`}
            >
              {p} {isAr ? 'تولة' : 'Tola'}
            </button>
          ))}
        </div>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tola input */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {L.tolaLabel}
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.5"
              value={tola}
              onChange={e => { setTola(e.target.value); setResult(null) }}
              placeholder="e.g. 10"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition text-lg font-bold"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">
              {isAr ? 'تولة' : 'tola'}
            </span>
          </div>
          {tola && (
            <p className="text-xs text-gray-500 mt-1">
              ≈ {(parseFloat(tola) * TOLA_TO_GRAMS).toFixed(2)}g
            </p>
          )}
        </div>

        {/* Karat */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.karatLabel}</label>
          <select
            value={karat}
            onChange={e => { setKarat(Number(e.target.value)); setResult(null) }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          >
            {KARATS.map(k => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.currencyLabel}</label>
          <select
            value={currency}
            onChange={e => { setCurrency(e.target.value); setResult(null) }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          >
            {CURRENCIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Manual Price Override */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useManual}
            onChange={e => { setUseManual(e.target.checked); setResult(null) }}
            className="rounded accent-amber-600"
          />
          <span className="text-sm text-gray-600">{L.manualToggle}</span>
        </label>
        {useManual && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {currencySymbol}
            </span>
            <input
              type="number"
              min="0"
              value={manualPrice}
              onChange={e => { setManualP(e.target.value); setResult(null) }}
              placeholder={fmt(pricePerGram, '')}
              className="w-full pl-14 pr-4 py-3 border border-amber-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>
        )}
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hawlConfirmed}
            onChange={e => { setHawl(e.target.checked); setResult(null) }}
            className="mt-0.5 rounded accent-amber-600"
          />
          <span className="text-sm text-gray-700">{L.hawlLabel}</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeJewelry}
            onChange={e => { setJewel(e.target.checked); setResult(null) }}
            className="mt-0.5 rounded accent-amber-600"
          />
          <span className="text-sm text-gray-700">{L.jewelryLabel}</span>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          disabled={!tola || parseFloat(tola) <= 0}
          className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-base"
        >
          {L.calculate}
        </button>
        <button
          onClick={reset}
          className="px-5 py-3.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {L.reset}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="rounded-2xl border border-amber-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-yellow-500 px-6 py-4">
            <p className="text-amber-100 text-sm font-medium mb-1">{L.results}</p>
            {result.zakatDue > 0 ? (
              <>
                <p className="text-white text-sm opacity-80">{L.zakatDue}</p>
                <p className="text-white text-4xl font-black tracking-tight">
                  {fmt(result.zakatDue, currencySymbol)}
                </p>
              </>
            ) : (
              <>
                <p className="text-white text-2xl font-black">{L.noZakat}</p>
                <p className="text-amber-100 text-sm">
                  {!hawlConfirmed ? L.hawlNote : L.noZakatSub}
                </p>
              </>
            )}
          </div>

          {/* Breakdown table */}
          <div className="bg-white divide-y divide-gray-50 px-6 py-4 space-y-3">
            <Row label={L.nisabStatus}
              value={result.meetsNisab ? L.yes : L.no}
              valueClass={result.meetsNisab ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}
            />
            <Row label={L.totalWeight}
              value={`${result.totalGrams.toFixed(2)}g / ${parseFloat(tola).toFixed(2)} tola`}
            />
            <Row label={L.pureGold}
              value={`${result.pureGrams.toFixed(2)}g`}
            />
            <Row label={L.totalValue}
              value={fmt(result.totalValue, currencySymbol)}
            />
            {result.zakatDue > 0 && (
              <Row label={L.zakatPerTola}
                value={fmt(result.zakatPerTola, currencySymbol)}
                valueClass="text-amber-700 font-bold"
              />
            )}
          </div>

          {/* Per-tola reference table for common amounts */}
          {result.zakatDue > 0 && (
            <div className="bg-amber-50 px-6 py-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">
                {isAr ? 'مرجع سريع' : 'Quick Reference'}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[7.5, 10, 20, 24, 30, 40, 50].map(t => (
                  <div key={t} className="flex justify-between text-sm">
                    <span className="text-gray-600">{t} {isAr ? 'تولة' : 'tola'}</span>
                    <span className="font-semibold text-amber-800">
                      {fmt(t * result.zakatPerTola, currencySymbol)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-gray-50 px-6 py-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              ⚠️ {L.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({
  label, value, valueClass = 'text-gray-900 font-semibold',
}: {
  label: string; value: string; valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${valueClass}`}>{value}</span>
    </div>
  )
}
