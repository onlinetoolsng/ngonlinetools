'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { FALLBACK_GOLD_USD_PER_GRAM, FALLBACK_SILVER_USD_PER_GRAM } from '@/lib/constants/metalPrices'

type Props = { locale: string }

// ─── Currencies ───────────────────────────────────────────────────────────────
const CURRENCIES = [
  { value: 'AED', label: 'AED — UAE Dirham',         symbol: 'AED' },
  { value: 'SAR', label: 'SAR — Saudi Riyal',         symbol: 'SAR' },
  { value: 'QAR', label: 'QAR — Qatari Riyal',        symbol: 'QAR' },
  { value: 'KWD', label: 'KWD — Kuwaiti Dinar',       symbol: 'KWD' },
  { value: 'BHD', label: 'BHD — Bahraini Dinar',      symbol: 'BHD' },
  { value: 'OMR', label: 'OMR — Omani Rial',          symbol: 'OMR' },
  { value: 'EGP', label: 'EGP — Egyptian Pound',      symbol: 'EGP' },
  { value: 'USD', label: 'USD — US Dollar',            symbol: 'USD' },
]

// ─── Static FX rates vs USD (GCC currencies are pegged; EGP/USD float)
// AED, SAR, QAR, BHD, OMR are pegged — these never need a live call.
// KWD is pegged to a basket; EGP floats but moves slowly.
// Update EGP periodically or add a secondary FX fetch if needed.
const FX_TO_USD: Record<string, number> = {
  AED: 0.2723,  // pegged: 1 USD = 3.6725 AED
  SAR: 0.2667,  // pegged: 1 USD = 3.75 SAR
  QAR: 0.2747,  // pegged: 1 USD = 3.64 QAR
  KWD: 3.2520,  // basket peg; update quarterly
  BHD: 2.6525,  // pegged: 1 USD = 0.376 BHD
  OMR: 2.5974,  // pegged: 1 USD = 0.385 OMR
  EGP: 0.0203,  // floating; update periodically
  USD: 1,
}

// ─── Nisab weights (grams of pure metal)
const NISAB_GRAMS = { gold: 85, silver: 595 }

// ─── Fallback spot prices per gram in USD (see lib/constants/metalPrices.ts)
const FALLBACK_SPOT_USD_PER_GRAM = { gold: FALLBACK_GOLD_USD_PER_GRAM, silver: FALLBACK_SILVER_USD_PER_GRAM }

// ─── Gold purity multipliers
const GOLD_PURITY: Record<string, number> = {
  '24k': 1,
  '22k': 22 / 24,
  '21k': 21 / 24,
  '18k': 18 / 24,
}

// ─── Types
type NisabType = 'gold' | 'silver'
type GoldUnit = 'grams' | 'tola' | 'oz'
type GoldCarat = '24k' | '22k' | '21k' | '18k'

function toGrams(value: number, unit: GoldUnit): number {
  if (unit === 'tola') return value * 11.664
  if (unit === 'oz')   return value * 31.1035
  return value
}

function fmt(n: number, currency: string): string {
  const decimals = ['KWD', 'BHD', 'OMR'].includes(currency) ? 3 : 2
  return `${currency} ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function parseNum(s: string): number {
  const n = parseFloat(s)
  return isNaN(n) || n < 0 ? 0 : n
}

// ─── Small reusable input
function Field({
  label,
  hint,
  value,
  onChange,
  currency,
  isAr,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  currency: string
  isAr: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {hint && (
          <span className="ml-2 text-xs font-normal text-gray-500">{hint}</span>
        )}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
          {currency}
        </span>
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="w-full pl-14 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
        />
      </div>
    </div>
  )
}

// ─── Section wrapper
function Section({
  icon,
  title,
  children,
}: {
  icon: string
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition text-left"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          <span className="text-lg">{icon}</span>
          {title}
        </span>
        <span className="text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  )
}

// ─── Result row
function ResultRow({
  label,
  value,
  highlight = false,
  muted = false,
}: {
  label: string
  value: string
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-sm ${muted ? 'text-gray-500' : 'text-gray-600'}`}>{label}</span>
      <span
        className={`text-sm font-semibold ${
          highlight ? 'text-teal-600' : muted ? 'text-gray-500' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Live price fetch from gold-api.com (no key, CORS-enabled, no rate limits)
type SpotPrices = { goldPerGram: number; silverPerGram: number; fetchedAt: string; isLive: boolean }

async function fetchSpotPrices(): Promise<SpotPrices> {
  // gold-api.com returns price per troy oz in USD → divide by 31.1035 for per-gram
  const [goldRes, silverRes] = await Promise.all([
    fetch('https://api.gold-api.com/price/XAU'),
    fetch('https://api.gold-api.com/price/XAG'),
  ])
  const goldJson   = await goldRes.json()
  const silverJson = await silverRes.json()
  // Response shape: { price: number, ... }
  return {
    goldPerGram:   goldJson.price   / 31.1035,
    silverPerGram: silverJson.price / 31.1035,
    fetchedAt: new Date().toLocaleTimeString(),
    isLive: true,
  }
}

// ─── Main component
export default function ZakatCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  // Settings
  const [currency, setCurrency] = useState('AED')
  const [nisabType, setNisabType] = useState<NisabType>('gold')

  // ── Live spot prices
  const [spot, setSpot] = useState<SpotPrices>({
    goldPerGram:   FALLBACK_SPOT_USD_PER_GRAM.gold,
    silverPerGram: FALLBACK_SPOT_USD_PER_GRAM.silver,
    fetchedAt: '',
    isLive: false,
  })
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError,   setPriceError]   = useState(false)

  const refreshPrices = useCallback(async () => {
    setPriceLoading(true)
    setPriceError(false)
    try {
      const prices = await fetchSpotPrices()
      setSpot(prices)
      // Auto-fill gold & silver per-gram fields in selected currency
      const rate = FX_TO_USD[currency] ?? 1
      setGoldValuePerGram(  (prices.goldPerGram   / rate).toFixed(2))
      setSilverValuePerGram((prices.silverPerGram / rate).toFixed(4))
    } catch {
      setPriceError(true)
    } finally {
      setPriceLoading(false)
    }
  }, [currency])

  // Fetch on mount
  useEffect(() => { refreshPrices() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cash & Savings
  const [cashOnHand, setCashOnHand]       = useState('')
  const [bankSavings, setBankSavings]     = useState('')
  const [fixedDeposits, setFixedDeposits] = useState('')

  // Gold
  const [goldWeight, setGoldWeight]       = useState('')
  const [goldUnit, setGoldUnit]           = useState<GoldUnit>('grams')
  const [goldCarat, setGoldCarat]         = useState<GoldCarat>('21k')
  const [goldValuePerGram, setGoldValuePerGram] = useState('')

  // Silver
  const [silverWeight, setSilverWeight]   = useState('')
  const [silverValuePerGram, setSilverValuePerGram] = useState('')

  // Investments
  const [sharesValue, setSharesValue]     = useState('')
  const [inventory, setInventory]         = useState('')
  const [receivables, setReceivables]     = useState('')

  // Liabilities
  const [debts, setDebts]                 = useState('')
  const [expenses, setExpenses]           = useState('')

  // ── Nisab in local currency — now driven by live spot price
  const nisabLocal = useMemo(() => {
    const rate = FX_TO_USD[currency] ?? 1
    const spotPerGramLocal = nisabType === 'gold'
      ? spot.goldPerGram   / rate
      : spot.silverPerGram / rate
    const grams = nisabType === 'gold' ? NISAB_GRAMS.gold : NISAB_GRAMS.silver
    return spotPerGramLocal * grams
  }, [currency, nisabType, spot])

  // ── Gold value calculation
  const goldValueLocal = useMemo(() => {
    const grams = toGrams(parseNum(goldWeight), goldUnit) * GOLD_PURITY[goldCarat]
    const pricePerGram = parseNum(goldValuePerGram)
    return grams * pricePerGram
  }, [goldWeight, goldUnit, goldCarat, goldValuePerGram])

  // ── Silver value
  const silverValueLocal = useMemo(() => {
    return parseNum(silverWeight) * parseNum(silverValuePerGram)
  }, [silverWeight, silverValuePerGram])

  // ── Total assets
  const totalAssets = useMemo(() => {
    return (
      parseNum(cashOnHand) +
      parseNum(bankSavings) +
      parseNum(fixedDeposits) +
      goldValueLocal +
      silverValueLocal +
      parseNum(sharesValue) +
      parseNum(inventory) +
      parseNum(receivables)
    )
  }, [cashOnHand, bankSavings, fixedDeposits, goldValueLocal, silverValueLocal, sharesValue, inventory, receivables])

  // ── Total liabilities
  const totalLiabilities = useMemo(() => {
    return parseNum(debts) + parseNum(expenses)
  }, [debts, expenses])

  // ── Net zakatable wealth
  const netWealth = useMemo(() => Math.max(0, totalAssets - totalLiabilities), [totalAssets, totalLiabilities])

  // ── Zakat due
  const zakatDue = useMemo(() => {
    if (netWealth < nisabLocal) return 0
    return netWealth * 0.025
  }, [netWealth, nisabLocal])

  const aboveNisab = netWealth >= nisabLocal && totalAssets > 0

  function reset() {
    setCashOnHand(''); setBankSavings(''); setFixedDeposits('')
    setGoldWeight('')
    setSilverWeight('')
    setSharesValue(''); setInventory(''); setReceivables('')
    setDebts(''); setExpenses('')
    // Re-populate price fields from current live spot
    const rate = FX_TO_USD[currency] ?? 1
    setGoldValuePerGram(  (spot.goldPerGram   / rate).toFixed(2))
    setSilverValuePerGram((spot.silverPerGram / rate).toFixed(4))
  }

  const t = isAr ? {
    title: 'حاسبة الزكاة',
    currency: 'العملة',
    nisabBasis: 'أساس النصاب',
    nisabGold: 'ذهب (85 جرام)',
    nisabSilver: 'فضة (595 جرام)',
    nisabValue: 'قيمة النصاب التقريبية',
    sectionCash: 'النقد والمدخرات',
    cashOnHand: 'النقد في اليد',
    bankSavings: 'المدخرات البنكية',
    fixedDeposits: 'الودائع الثابتة',
    sectionGold: 'الذهب والفضة',
    goldWeight: 'وزن الذهب',
    goldUnit: 'الوحدة',
    goldCarat: 'العيار',
    goldPricePerGram: 'سعر الذهب لكل جرام',
    silverWeight: 'وزن الفضة (جرام)',
    silverPricePerGram: 'سعر الفضة لكل جرام',
    sectionInvest: 'الاستثمارات والأعمال',
    shares: 'الأسهم والمحافظ الاستثمارية',
    inventory: 'البضائع والمخزون (بسعر البيع)',
    receivables: 'الديون المستحقة لك',
    sectionLiab: 'الخصومات والالتزامات',
    debts: 'الديون قصيرة المدى (مستحقة خلال عام)',
    expenses: 'النفقات الواجبة الأخرى',
    results: 'ملخص الزكاة',
    totalAssets: 'إجمالي الأصول الزكوية',
    totalLiab: 'إجمالي الخصومات',
    netWealth: 'صافي الثروة الزكوية',
    nisabThreshold: 'حد النصاب',
    zakatDue: 'الزكاة المستحقة (2.5٪)',
    aboveNisab: '✓ تجاوزت النصاب — الزكاة واجبة',
    belowNisab: 'لم تبلغ النصاب — لا تجب الزكاة',
    reset: 'إعادة تعيين',
    disclaimer: 'هذه الأداة للإرشاد العام وفق المبادئ الشرعية الشائعة. ليست فتوى ولا بديلاً عن استشارة عالم شرعي مؤهل. الأسعار والنصاب تقريبية — تحقق منها بشكل مستقل.',
    hintCash: 'تشمل جميع الحسابات الجارية',
    hintInventory: 'لأصحاب الأعمال فقط',
    hintReceivables: 'الديون المتوقع تحصيلها',
    hintDebts: 'الديون المستحقة خلال العام القادم',
  } : {
    title: 'Zakat Calculator',
    currency: 'Currency',
    nisabBasis: 'Nisab Basis',
    nisabGold: 'Gold (85g)',
    nisabSilver: 'Silver (595g)',
    nisabValue: 'Approximate Nisab',
    sectionCash: 'Cash & Savings',
    cashOnHand: 'Cash on Hand',
    bankSavings: 'Bank Savings',
    fixedDeposits: 'Fixed Deposits',
    sectionGold: 'Gold & Silver',
    goldWeight: 'Gold Weight',
    goldUnit: 'Unit',
    goldCarat: 'Purity (Carat)',
    goldPricePerGram: 'Gold Price per Gram',
    silverWeight: 'Silver Weight (grams)',
    silverPricePerGram: 'Silver Price per Gram',
    sectionInvest: 'Investments & Business',
    shares: 'Shares / Investment Portfolios',
    inventory: 'Business Inventory (at resale value)',
    receivables: 'Money Owed to You',
    sectionLiab: 'Deductions & Liabilities',
    debts: 'Short-term Debts (due within one year)',
    expenses: 'Other Immediate Expenses',
    results: 'Zakat Summary',
    totalAssets: 'Total Zakatable Assets',
    totalLiab: 'Total Deductions',
    netWealth: 'Net Zakatable Wealth',
    nisabThreshold: 'Nisab Threshold',
    zakatDue: 'Zakat Due (2.5%)',
    aboveNisab: '✓ Above Nisab — Zakat is obligatory',
    belowNisab: 'Below Nisab — No Zakat due',
    reset: 'Reset',
    disclaimer: 'This tool provides general guidance based on common Shariah principles. It is not a fatwa or substitute for advice from a qualified Islamic scholar. Prices and Nisab values are approximate — verify independently.',
    hintCash: 'All current accounts included',
    hintInventory: 'Business owners only',
    hintReceivables: 'Debts you expect to collect',
    hintDebts: 'Debts due within the coming year',
  }

  const sym = currency

  return (
    <div className="space-y-5">

      {/* Settings row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Currency */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.currency}</label>
          <select
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
          >
            {CURRENCIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Nisab type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.nisabBasis}</label>
          <div className="flex gap-2">
            {(['gold', 'silver'] as NisabType[]).map(n => (
              <button
                key={n}
                onClick={() => setNisabType(n)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition border ${
                  nisabType === n
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {n === 'gold' ? t.nisabGold : t.nisabSilver}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nisab display + live price status */}
      <div className="bg-teal-50 rounded-xl px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-teal-700 font-medium">{t.nisabValue}</span>
          <span className="text-sm font-bold text-teal-800">{fmt(nisabLocal, currency)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-teal-600">
            {priceLoading
              ? (isAr ? 'جارٍ تحديث الأسعار...' : 'Fetching live prices...')
              : priceError
              ? (isAr ? '⚠ سعر تقريبي (تعذّر الاتصال)' : '⚠ Fallback price (fetch failed)')
              : spot.isLive
              ? (isAr ? `✓ سعر مباشر · ${spot.fetchedAt}` : `✓ Live price · ${spot.fetchedAt}`)
              : (isAr ? 'سعر تقديري' : 'Estimated price')}
          </span>
          <button
            onClick={refreshPrices}
            disabled={priceLoading}
            className="text-xs text-teal-600 hover:text-teal-800 font-semibold disabled:opacity-40 flex items-center gap-1 transition"
          >
            {priceLoading ? '⟳' : '↺'} {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>
        {/* Gold/silver per-gram shown for transparency */}
        {spot.isLive && (
          <div className="text-xs text-teal-500 flex gap-4">
            <span>
              {isAr ? 'ذهب/جرام:' : 'Gold/g:'}{' '}
              {fmt(spot.goldPerGram / (FX_TO_USD[currency] ?? 1), currency)}
            </span>
            <span>
              {isAr ? 'فضة/جرام:' : 'Silver/g:'}{' '}
              {fmt(spot.silverPerGram / (FX_TO_USD[currency] ?? 1), currency)}
            </span>
          </div>
        )}
      </div>

      {/* ── Asset Sections ── */}
      <Section icon="💵" title={t.sectionCash}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label={t.cashOnHand}    value={cashOnHand}    onChange={setCashOnHand}    currency={sym} isAr={isAr} />
          <Field label={t.bankSavings}   hint={t.hintCash} value={bankSavings}   onChange={setBankSavings}   currency={sym} isAr={isAr} />
          <Field label={t.fixedDeposits} value={fixedDeposits} onChange={setFixedDeposits} currency={sym} isAr={isAr} />
        </div>
      </Section>

      <Section icon="🥇" title={t.sectionGold}>
        {/* Gold */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.goldWeight}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={goldWeight}
              onChange={e => setGoldWeight(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.goldUnit}</label>
            <select
              value={goldUnit}
              onChange={e => setGoldUnit(e.target.value as GoldUnit)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            >
              <option value="grams">Grams</option>
              <option value="tola">Tola</option>
              <option value="oz">Troy oz</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.goldCarat}</label>
            <select
              value={goldCarat}
              onChange={e => setGoldCarat(e.target.value as GoldCarat)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            >
              {Object.keys(GOLD_PURITY).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Field
              label={t.goldPricePerGram}
              value={goldValuePerGram}
              onChange={setGoldValuePerGram}
              currency={sym}
              isAr={isAr}
            />
          </div>
        </div>
        {goldValueLocal > 0 && (
          <p className="text-xs text-teal-600 font-medium">
            ≈ {fmt(goldValueLocal, currency)}
          </p>
        )}

        {/* Silver */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.silverWeight}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={silverWeight}
              onChange={e => setSilverWeight(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
            />
          </div>
          <Field
            label={t.silverPricePerGram}
            value={silverValuePerGram}
            onChange={setSilverValuePerGram}
            currency={sym}
            isAr={isAr}
          />
        </div>
      </Section>

      <Section icon="📈" title={t.sectionInvest}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label={t.shares}      value={sharesValue} onChange={setSharesValue} currency={sym} isAr={isAr} />
          <Field label={t.inventory}   hint={t.hintInventory}   value={inventory}   onChange={setInventory}   currency={sym} isAr={isAr} />
          <Field label={t.receivables} hint={t.hintReceivables} value={receivables} onChange={setReceivables} currency={sym} isAr={isAr} />
        </div>
      </Section>

      <Section icon="➖" title={t.sectionLiab}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t.debts}    hint={t.hintDebts} value={debts}    onChange={setDebts}    currency={sym} isAr={isAr} />
          <Field label={t.expenses} value={expenses} onChange={setExpenses} currency={sym} isAr={isAr} />
        </div>
      </Section>

      {/* Reset */}
      <div className="flex justify-end">
        <button
          onClick={reset}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition text-sm"
        >
          {t.reset}
        </button>
      </div>

      {/* ── Results ── */}
      {totalAssets > 0 && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
          <h3 className="font-bold text-gray-900">{t.results}</h3>

          {/* Nisab status badge */}
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            aboveNisab
              ? 'bg-teal-600 text-white'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {aboveNisab ? t.aboveNisab : t.belowNisab}
          </div>

          {/* Breakdown */}
          <div className="space-y-2.5">
            <ResultRow label={t.totalAssets}    value={fmt(totalAssets, currency)} />
            <ResultRow label={t.totalLiab}      value={`− ${fmt(totalLiabilities, currency)}`} muted={totalLiabilities === 0} />
            <div className="border-t border-gray-200 pt-2.5 space-y-2.5">
              <ResultRow label={t.netWealth}     value={fmt(netWealth, currency)} />
              <ResultRow label={t.nisabThreshold} value={fmt(nisabLocal, currency)} muted />
            </div>
            {/* Zakat hero */}
            <div className="border-t border-gray-200 pt-3">
              <div className={`rounded-xl p-4 ${zakatDue > 0 ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                <div className="text-sm opacity-80 mb-1">{t.zakatDue}</div>
                <div className="text-3xl font-black">
                  {zakatDue > 0 ? fmt(zakatDue, currency) : `${currency} 0.00`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
        ⚠️ {t.disclaimer}
      </p>
    </div>
  )
}
