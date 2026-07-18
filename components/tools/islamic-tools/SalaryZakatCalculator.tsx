'use client'

import { useState, useEffect, useMemo } from 'react'
import { FALLBACK_GOLD_USD_PER_GRAM, FALLBACK_SILVER_USD_PER_GRAM } from '@/lib/constants/metalPrices'

type Props = { locale: string }

// ─── Constants ─────────────────────────────────────────────────────────────────
const NISAB_SILVER_GRAMS = 612.36
const NISAB_GOLD_GRAMS   = 87.48
const ZAKAT_RATE         = 0.025

// Fallback spot prices in USD (see lib/constants/metalPrices.ts)
const FALLBACK_SILVER_USD = FALLBACK_SILVER_USD_PER_GRAM  // per gram
const FALLBACK_GOLD_USD   = FALLBACK_GOLD_USD_PER_GRAM    // per gram

const CURRENCIES = [
  { value: 'SAR', label: 'SAR — Saudi Riyal',     symbol: 'SAR', usd: 0.2667 },
  { value: 'AED', label: 'AED — UAE Dirham',       symbol: 'AED', usd: 0.2723 },
  { value: 'QAR', label: 'QAR — Qatari Riyal',     symbol: 'QAR', usd: 0.2747 },
  { value: 'KWD', label: 'KWD — Kuwaiti Dinar',    symbol: 'KWD', usd: 3.257  },
  { value: 'BHD', label: 'BHD — Bahraini Dinar',   symbol: 'BHD', usd: 2.653  },
  { value: 'OMR', label: 'OMR — Omani Rial',       symbol: 'OMR', usd: 2.597  },
  { value: 'EGP', label: 'EGP — Egyptian Pound',   symbol: 'EGP', usd: 0.0204 },
  { value: 'USD', label: 'USD — US Dollar',        symbol: '$',   usd: 1      },
]

const COUNTRIES = [
  { value: 'general', label: 'General GCC',     note: '' },
  { value: 'saudi',   label: 'Saudi Arabia',    note: 'ZATCA oversees Zakat collection for Saudi nationals and some businesses. Individuals self-assess personal wealth Zakat.' },
  { value: 'uae',     label: 'UAE',             note: 'No mandatory personal Zakat collection. Individual obligation. Dubai Islamic Affairs can guide.' },
  { value: 'qatar',   label: 'Qatar',           note: 'Voluntary personal Zakat. Qatar Charity and MOSA provide guidance.' },
  { value: 'kuwait',  label: 'Kuwait',          note: 'Companies pay 1% Zakat on net profits. Individuals self-assess personal Zakat.' },
  { value: 'bahrain', label: 'Bahrain',         note: 'Personal Zakat is voluntary and self-assessed.' },
  { value: 'oman',    label: 'Oman',            note: 'Personal Zakat is voluntary and self-assessed.' },
  { value: 'egypt',   label: 'Egypt',           note: "Dar al-Ifta Egypt provides fatawa on Zakat. Bayt al-Zakat is an official collection body." },
]

const MADHABS = [
  { value: 'general', label: 'General / Not specified' },
  { value: 'hanafi',  label: 'Hanafi' },
  { value: 'maliki',  label: 'Maliki' },
  { value: 'shafi',   label: "Shafi'i" },
  { value: 'hanbali', label: 'Hanbali' },
]

const STEPS = ['profile', 'income', 'deductions', 'assets', 'results'] as const
type Step = typeof STEPS[number]

function fmt(n: number, symbol: string, decimals = 0) {
  return `${symbol} ${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

function pct(n: number) { return `${(n * 100).toFixed(1)}%` }

type ZakatResult = {
  // Nisab
  nisabSilverLocal: number
  nisabGoldLocal: number
  activeNisab: number
  // Wealth method
  netWealthZakatable: number
  wealthMeetsNisab: boolean
  wealthZakat: number
  // Income method
  annualNetIncome: number
  incomeMeetsNisab: boolean
  incomeZakat: number
  monthlyIncomeZakat: number
  currency: string
  symbol: string
}

export default function SalaryZakatCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('profile')

  // ── Profile ─────────────────────────────────────────────────────────────────
  const [country,    setCountry]    = useState('general')
  const [currency,   setCurrency]   = useState('SAR')
  const [madhab,     setMadhab]     = useState('general')
  const [nisabBasis, setNisabBasis] = useState<'silver' | 'gold'>('silver')
  const [hawlMet,    setHawlMet]    = useState(false)
  const [calcMode,   setCalcMode]   = useState<'wealth' | 'income' | 'both'>('both')

  // ── Income ──────────────────────────────────────────────────────────────────
  const [monthlySalary, setMonthlySalary] = useState('')
  const [bonuses,       setBonuses]       = useState('')
  const [otherIncome,   setOtherIncome]   = useState('')

  // ── Deductions ──────────────────────────────────────────────────────────────
  const [rent,       setRent]       = useState('')
  const [food,       setFood]       = useState('')
  const [transport,  setTransport]  = useState('')
  const [utilities,  setUtilities]  = useState('')
  const [education,  setEducation]  = useState('')
  const [healthcare, setHealthcare] = useState('')
  const [debtPayments, setDebt]     = useState('')
  const [otherExp,   setOtherExp]   = useState('')

  // ── Assets ──────────────────────────────────────────────────────────────────
  const [savings,   setSavings]   = useState('')
  const [goldValue, setGoldValue] = useState('')
  const [stocks,    setStocks]    = useState('')
  const [otherAssets, setOtherA]  = useState('')

  // ── Live prices ──────────────────────────────────────────────────────────────
  const [silverUsd, setSilver] = useState(FALLBACK_SILVER_USD)
  const [goldUsd,   setGold]   = useState(FALLBACK_GOLD_USD)
  const [fxRates,   setFx]     = useState<Record<string, number>>({})
  const [priceNote, setPriceNote] = useState('estimated')

  // ── Result ──────────────────────────────────────────────────────────────────
  const [result, setResult] = useState<ZakatResult | null>(null)

  // ── Fetch live metal prices ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchPrices() {
      try {
        // metals-api free (metals.live public endpoint)
        const res = await fetch('https://data-asg.goldprice.org/dbXRates/USD')
        const json = await res.json()
        const goldPerOz: number  = json?.items?.[0]?.xauPrice
        const silverPerOz: number = json?.items?.[0]?.xagPrice
        if (goldPerOz > 0)   setGold(goldPerOz / 31.1035)
        if (silverPerOz > 0) setSilver(silverPerOz / 31.1035)
        setPriceNote('live')
      } catch { /* use fallbacks */ }
    }
    async function fetchFx() {
      try {
        const res  = await fetch('https://open.er-api.com/v6/latest/USD')
        const json = await res.json()
        if (json?.rates) setFx(json.rates)
      } catch { /* use static fallbacks */ }
    }
    fetchPrices()
    fetchFx()
  }, [])

  // ── Currency helpers ─────────────────────────────────────────────────────────
  const currMeta = CURRENCIES.find(c => c.value === currency) ?? CURRENCIES[0]
  const usdRate  = fxRates[currency] ?? (1 / currMeta.usd)  // USD → local

  function usdToLocal(usd: number) { return usd * usdRate }

  const nisabSilverLocal = usdToLocal(silverUsd * NISAB_SILVER_GRAMS)
  const nisabGoldLocal   = usdToLocal(goldUsd   * NISAB_GOLD_GRAMS)
  const activeNisab      = nisabBasis === 'silver' ? nisabSilverLocal : nisabGoldLocal

  // ── Derived numbers ──────────────────────────────────────────────────────────
  const n = (s: string) => parseFloat(s) || 0

  const monthlyGross    = n(monthlySalary)
  const annualGross     = monthlyGross * 12 + n(bonuses) + n(otherIncome)
  const monthlyExpenses = n(rent) + n(food) + n(transport) + n(utilities) + n(education) + n(healthcare) + n(debtPayments) + n(otherExp)
  const annualExpenses  = monthlyExpenses * 12
  const annualNetIncome = Math.max(0, annualGross - annualExpenses)

  const totalAssets       = n(savings) + n(goldValue) + n(stocks) + n(otherAssets)
  const netWealthZakatable = Math.max(0, totalAssets + annualNetIncome - annualExpenses * 0) // savings-based

  // ── Calculate ────────────────────────────────────────────────────────────────
  function calculate() {
    const wealthMeetsNisab = netWealthZakatable >= activeNisab
    const wealthZakat      = (wealthMeetsNisab && hawlMet) ? netWealthZakatable * ZAKAT_RATE : 0

    const monthlyNet       = Math.max(0, monthlyGross - monthlyExpenses)
    const proportionalNisab = activeNisab / 12
    const incomeMeetsNisab = annualNetIncome >= activeNisab
    const incomeZakat      = incomeMeetsNisab ? annualNetIncome * ZAKAT_RATE : 0
    const monthlyIncomeZakat = (monthlyNet >= proportionalNisab) ? monthlyNet * ZAKAT_RATE : 0

    setResult({
      nisabSilverLocal,
      nisabGoldLocal,
      activeNisab,
      netWealthZakatable,
      wealthMeetsNisab,
      wealthZakat,
      annualNetIncome,
      incomeMeetsNisab,
      incomeZakat,
      monthlyIncomeZakat,
      currency,
      symbol: currMeta.symbol,
    })
    setStep('results')
  }

  function reset() {
    setStep('profile')
    setResult(null)
    setMonthlySalary(''); setBonuses(''); setOtherIncome('')
    setRent(''); setFood(''); setTransport(''); setUtilities('')
    setEducation(''); setHealthcare(''); setDebt(''); setOtherExp('')
    setSavings(''); setGoldValue(''); setStocks(''); setOtherA('')
    setHawlMet(false)
  }

  const stepIndex = STEPS.indexOf(step)

  const countryMeta = COUNTRIES.find(c => c.value === country)!

  const L = isAr ? {
    title: 'حاسبة زكاة الراتب والدخل',
    steps: ['الملف الشخصي', 'الدخل', 'المصروفات', 'الأصول', 'النتائج'],
    next: 'التالي', back: 'السابق', calculate: 'احسب الزكاة', reset: 'إعادة',
    country: 'الدولة', currency: 'العملة', madhab: 'المذهب الفقهي',
    nisabBasis: 'أساس النصاب', silver: 'الفضة (مُوصى به)', gold: 'الذهب',
    hawl: 'هل مضى على الثروة حول كامل (سنة قمرية)؟',
    calcMode: 'طريقة الحساب', wealth: 'زكاة الثروة (كلاسيكي)', income: 'زكاة الدخل (معاصر)', both: 'كلاهما للمقارنة',
    monthlySalary: 'الراتب الشهري الإجمالي', bonuses: 'المكافآت السنوية', otherIncome: 'دخل آخر (سنوي)',
    rent: 'إيجار / سكن', food: 'طعام وأسرة', transport: 'مواصلات', utilities: 'فواتير',
    education: 'تعليم', healthcare: 'صحة', debt: 'أقساط ديون', otherExp: 'مصروفات أخرى',
    savings: 'مدخرات نقدية / بنك', goldValue: 'قيمة الذهب والفضة', stocks: 'أسهم / استثمارات سائلة', otherAssets: 'أصول زكوية أخرى',
    results: 'نتائج الزكاة', nisabLabel: 'النصاب الحالي',
    wealthMethod: 'زكاة الثروة (الحول مطلوب)', incomeMethod: 'زكاة الدخل (معاصر)',
    meetsNisab: 'يبلغ النصاب', doesNot: 'لا يبلغ النصاب',
    noZakat: 'لا زكاة واجبة', disclaimer: 'هذه أداة تعليمية تقديرية. استشر عالماً مؤهلاً أو جهة دينية معتمدة في بلدك. النتائج تقريبية.',
    annualNet: 'صافي الدخل السنوي', netWealth: 'صافي الثروة الزكوية',
    monthlyZakat: 'الزكاة الشهرية (دفع شهري)',
    annualZakat: 'الزكاة السنوية',
    priceNote: priceNote === 'live' ? '(أسعار لحظية)' : '(أسعار تقريبية)',
  } : {
    title: 'Salary & Income Zakat Calculator',
    steps: ['Profile', 'Income', 'Expenses', 'Assets', 'Results'],
    next: 'Next', back: 'Back', calculate: 'Calculate Zakat', reset: 'Reset',
    country: 'Country', currency: 'Currency', madhab: 'School of Thought',
    nisabBasis: 'Nisab Standard', silver: 'Silver (recommended)', gold: 'Gold',
    hawl: 'Has this wealth been held for one full lunar year (Hawl)?',
    calcMode: 'Calculation Method', wealth: 'Wealth Zakat (classical)', income: 'Income Zakat (contemporary)', both: 'Both (for comparison)',
    monthlySalary: 'Gross Monthly Salary', bonuses: 'Annual Bonuses', otherIncome: 'Other Annual Income',
    rent: 'Rent / Housing', food: 'Food & Family', transport: 'Transport', utilities: 'Utilities',
    education: 'Education', healthcare: 'Healthcare', debt: 'Debt Installments', otherExp: 'Other Expenses',
    savings: 'Cash / Bank Savings', goldValue: 'Gold & Silver Value', stocks: 'Liquid Stocks / Investments', otherAssets: 'Other Zakatable Assets',
    results: 'Your Zakat Estimate', nisabLabel: 'Current Nisab',
    wealthMethod: 'Wealth Zakat (Hawl required)', incomeMethod: 'Income Zakat (contemporary)',
    meetsNisab: 'Meets Nisab ✓', doesNot: 'Below Nisab ✗',
    noZakat: 'No Zakat due', disclaimer: 'This is an educational estimation tool based on common scholarly opinions. Zakat rules vary by school of thought and personal circumstances. Consult a qualified scholar or official authority in your country. Results are approximate.',
    annualNet: 'Annual Net Income', netWealth: 'Net Zakatable Wealth',
    monthlyZakat: 'Monthly Zakat (if paying monthly)',
    annualZakat: 'Annual Zakat Due',
    priceNote: priceNote === 'live' ? '(live prices)' : '(estimated prices)',
  }

  // ── Nisab progress bar ───────────────────────────────────────────────────────
  const wealthPct = Math.min(1, activeNisab > 0 ? netWealthZakatable / activeNisab : 0)
  const incomePct = Math.min(1, activeNisab > 0 ? annualNetIncome / activeNisab : 0)

  return (
    <div
      className="space-y-6"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: "'Noto Sans', 'Segoe UI', sans-serif" }}
    >
      {/* ── Stepper ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {L.steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => i < stepIndex && setStep(STEPS[i])}
              disabled={i > stepIndex}
              className={`w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
                i < stepIndex  ? 'bg-emerald-500 text-white cursor-pointer' :
                i === stepIndex ? 'bg-teal-700 text-white ring-2 ring-teal-300' :
                'bg-gray-100 text-gray-500 cursor-default'
              }`}
            >
              {i < stepIndex ? '✓' : i + 1}
            </button>
            <span className={`hidden sm:block text-xs ml-1 truncate ${i === stepIndex ? 'text-teal-700 font-semibold' : 'text-gray-500'}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded ${i < stepIndex ? 'bg-emerald-400' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Nisab Banner (always visible) ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className={`rounded-xl px-4 py-2.5 border ${nisabBasis === 'silver' ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-100'}`}>
          <p className="text-xs text-gray-500 mb-0.5">{isAr ? 'نصاب الفضة' : 'Silver Nisab'} {L.priceNote}</p>
          <p className="font-bold text-gray-800">{fmt(nisabSilverLocal, currMeta.symbol)}</p>
        </div>
        <div className={`rounded-xl px-4 py-2.5 border ${nisabBasis === 'gold' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
          <p className="text-xs text-gray-500 mb-0.5">{isAr ? 'نصاب الذهب' : 'Gold Nisab'} {L.priceNote}</p>
          <p className="font-bold text-gray-800">{fmt(nisabGoldLocal, currMeta.symbol)}</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          STEP 1 — PROFILE
      ══════════════════════════════════════════════════════════════════════════ */}
      {step === 'profile' && (
        <div className="space-y-4">
          <SectionTitle isAr={isAr} en="Your Profile" ar="ملفك الشخصي" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label={L.country} value={country} onChange={setCountry}
              options={COUNTRIES.map(c => ({ value: c.value, label: c.label }))} />
            <SelectField label={L.currency} value={currency} onChange={setCurrency}
              options={CURRENCIES.map(c => ({ value: c.value, label: c.label }))} />
            <SelectField label={L.madhab} value={madhab} onChange={setMadhab}
              options={MADHABS.map(m => ({ value: m.value, label: m.label }))} />
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.nisabBasis}</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {(['silver', 'gold'] as const).map(b => (
                  <button key={b} onClick={() => setNisabBasis(b)}
                    className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${nisabBasis === b ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    {b === 'silver' ? L.silver : L.gold}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calc Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{L.calcMode}</label>
            <div className="flex flex-col sm:flex-row rounded-xl overflow-hidden border border-gray-200">
              {(['wealth', 'income', 'both'] as const).map(m => (
                <button key={m} onClick={() => setCalcMode(m)}
                  className={`flex-1 py-2.5 px-3 text-sm font-semibold transition-colors text-left sm:text-center ${calcMode === m ? 'bg-teal-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {m === 'wealth' ? L.wealth : m === 'income' ? L.income : L.both}
                </button>
              ))}
            </div>
          </div>

          {/* Hawl */}
          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-gray-100 bg-gray-50 p-3">
            <input type="checkbox" checked={hawlMet} onChange={e => setHawlMet(e.target.checked)}
              className="mt-0.5 rounded accent-teal-600" />
            <span className="text-sm text-gray-700">{L.hawl}</span>
          </label>

          {countryMeta.note && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
              🏛 {countryMeta.note}
            </div>
          )}

          <NavButtons onNext={() => setStep('income')} showBack={false} nextLabel={L.next} backLabel={L.back} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          STEP 2 — INCOME
      ══════════════════════════════════════════════════════════════════════════ */}
      {step === 'income' && (
        <div className="space-y-4">
          <SectionTitle isAr={isAr} en="Income Sources" ar="مصادر الدخل" />

          <NumberField label={L.monthlySalary}  symbol={currMeta.symbol} value={monthlySalary}  onChange={setMonthlySalary} />
          <NumberField label={L.bonuses}         symbol={currMeta.symbol} value={bonuses}         onChange={setBonuses} hint={isAr ? 'سنوي' : 'Annual total'} />
          <NumberField label={L.otherIncome}     symbol={currMeta.symbol} value={otherIncome}     onChange={setOtherIncome} hint={isAr ? 'عمل حر، استثمارات...' : 'Freelance, investments...'} />

          {monthlySalary && (
            <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 text-sm text-teal-800">
              {isAr ? 'إجمالي الدخل السنوي المقدَّر' : 'Estimated annual gross'}: <strong>{fmt(annualGross, currMeta.symbol)}</strong>
            </div>
          )}

          <NavButtons onBack={() => setStep('profile')} onNext={() => setStep('deductions')} nextLabel={L.next} backLabel={L.back} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          STEP 3 — DEDUCTIONS
      ══════════════════════════════════════════════════════════════════════════ */}
      {step === 'deductions' && (
        <div className="space-y-4">
          <SectionTitle isAr={isAr} en="Monthly Essential Expenses" ar="المصروفات الضرورية الشهرية" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberField label={L.rent}       symbol={currMeta.symbol} value={rent}       onChange={setRent} />
            <NumberField label={L.food}       symbol={currMeta.symbol} value={food}       onChange={setFood} />
            <NumberField label={L.transport}  symbol={currMeta.symbol} value={transport}  onChange={setTransport} />
            <NumberField label={L.utilities}  symbol={currMeta.symbol} value={utilities}  onChange={setUtilities} />
            <NumberField label={L.education}  symbol={currMeta.symbol} value={education}  onChange={setEducation} />
            <NumberField label={L.healthcare} symbol={currMeta.symbol} value={healthcare} onChange={setHealthcare} />
            <NumberField label={L.debt}       symbol={currMeta.symbol} value={debtPayments} onChange={setDebt} />
            <NumberField label={L.otherExp}   symbol={currMeta.symbol} value={otherExp}   onChange={setOtherExp} />
          </div>

          {monthlyExpenses > 0 && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{isAr ? 'إجمالي المصروفات الشهرية' : 'Total monthly expenses'}</span>
                <span className="font-semibold text-gray-800">{fmt(monthlyExpenses, currMeta.symbol)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{isAr ? 'صافي الدخل السنوي' : 'Annual net income'}</span>
                <span className="font-bold text-teal-700">{fmt(annualNetIncome, currMeta.symbol)}</span>
              </div>
              {/* Progress to nisab */}
              <div className="pt-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{isAr ? 'تقدم نحو النصاب' : 'Progress to Nisab'}</span>
                  <span>{pct(incomePct)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${incomePct * 100}%`, backgroundColor: incomePct >= 1 ? '#059669' : '#0d9488' }} />
                </div>
              </div>
            </div>
          )}

          <NavButtons onBack={() => setStep('income')} onNext={() => setStep('assets')} nextLabel={L.next} backLabel={L.back} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          STEP 4 — ASSETS
      ══════════════════════════════════════════════════════════════════════════ */}
      {step === 'assets' && (
        <div className="space-y-4">
          <SectionTitle isAr={isAr} en="Zakatable Assets" ar="الأصول الزكوية" />
          <p className="text-xs text-gray-500">{isAr ? 'أدخل القيمة الحالية لكل ما تمتلكه من أصول قابلة للزكاة' : 'Enter current market value of all zakatable holdings'}</p>

          <NumberField label={L.savings}    symbol={currMeta.symbol} value={savings}    onChange={setSavings} hint={isAr ? 'حساب بنكي، نقد' : 'Bank accounts, cash'} />
          <NumberField label={L.goldValue}  symbol={currMeta.symbol} value={goldValue}  onChange={setGoldValue} hint={isAr ? 'القيمة السوقية الحالية' : 'Current market value'} />
          <NumberField label={L.stocks}     symbol={currMeta.symbol} value={stocks}     onChange={setStocks} hint={isAr ? 'أسهم وصناديق استثمار' : 'Stocks, funds, crypto'} />
          <NumberField label={L.otherAssets} symbol={currMeta.symbol} value={otherAssets} onChange={setOtherA} />

          {totalAssets > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{isAr ? 'إجمالي الأصول' : 'Total assets declared'}</span>
                <span className="font-bold text-amber-800">{fmt(totalAssets, currMeta.symbol)}</span>
              </div>
              <div className="pt-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{isAr ? 'الأصول مقارنة بالنصاب' : 'Assets vs Nisab'}</span>
                  <span>{pct(wealthPct)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${wealthPct * 100}%`, backgroundColor: wealthPct >= 1 ? '#059669' : '#d97706' }} />
                </div>
              </div>
            </div>
          )}

          <NavButtons onBack={() => setStep('deductions')} onNext={calculate} nextLabel={L.calculate} backLabel={L.back} isPrimary />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          STEP 5 — RESULTS
      ══════════════════════════════════════════════════════════════════════════ */}
      {step === 'results' && result && (
        <div className="space-y-4">
          <SectionTitle isAr={isAr} en="Your Zakat Estimate" ar="تقدير زكاتك" />

          {/* Nisab status */}
          <div className="grid grid-cols-2 gap-3">
            <StatusCard
              label={isAr ? 'زكاة الثروة' : 'Wealth Zakat'}
              meets={result.wealthMeetsNisab && hawlMet}
              meetsLabel={L.meetsNisab}
              notLabel={!hawlMet ? (isAr ? 'الحول غير مكتمل' : 'Hawl not confirmed') : L.doesNot}
            />
            <StatusCard
              label={isAr ? 'زكاة الدخل' : 'Income Zakat'}
              meets={result.incomeMeetsNisab}
              meetsLabel={L.meetsNisab}
              notLabel={L.doesNot}
            />
          </div>

          {/* Wealth method */}
          {(calcMode === 'wealth' || calcMode === 'both') && (
            <ResultCard
              title={L.wealthMethod}
              color="teal"
              rows={[
                { label: L.netWealth,   value: fmt(result.netWealthZakatable, result.symbol) },
                { label: L.nisabLabel,  value: fmt(result.activeNisab, result.symbol) },
                { label: L.annualZakat, value: result.wealthZakat > 0 ? fmt(result.wealthZakat, result.symbol) : L.noZakat,
                  highlight: result.wealthZakat > 0 },
              ]}
              note={isAr
                ? 'زكاة الثروة الكلاسيكية: 2.5% من صافي الثروة الزكوية إذا بلغت النصاب وحال عليها الحول.'
                : 'Classical wealth Zakat: 2.5% of net zakatable wealth if Nisab is met and Hawl (1 lunar year) has passed.'}
            />
          )}

          {/* Income method */}
          {(calcMode === 'income' || calcMode === 'both') && (
            <ResultCard
              title={L.incomeMethod}
              color="amber"
              rows={[
                { label: L.annualNet,        value: fmt(result.annualNetIncome, result.symbol) },
                { label: L.annualZakat,      value: result.incomeZakat > 0 ? fmt(result.incomeZakat, result.symbol) : L.noZakat,
                  highlight: result.incomeZakat > 0 },
                { label: L.monthlyZakat,     value: fmt(result.monthlyIncomeZakat, result.symbol) },
              ]}
              note={isAr
                ? 'الزكاة على الدخل المعاصرة: 2.5% من صافي الدخل السنوي (بعد المصروفات الضرورية). مستندة لآراء علماء معاصرين كالشيخ يوسف القرضاوي. لا تشترط الحول.'
                : 'Contemporary income Zakat: 2.5% on annual net income (after essential expenses). Based on scholars like Sheikh Yusuf al-Qaradawi. Hawl not strictly required under this view.'}
            />
          )}

          {/* Country note */}
          {countryMeta.note && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
              🏛 {countryMeta.note}
            </div>
          )}

          {/* Madhab note */}
          {madhab !== 'general' && (
            <div className="rounded-xl bg-purple-50 border border-purple-100 px-4 py-3 text-xs text-purple-700">
              {isAr
                ? `ملاحظة: هذه الحاسبة تعتمد على الأسس الفقهية العامة. قد تكون لمذهب ${MADHABS.find(m=>m.value===madhab)?.label} خصائص دقيقة مختلفة. استشر عالماً متخصصاً.`
                : `Note: This calculator uses general Shariah principles. The ${MADHABS.find(m=>m.value===madhab)?.label} school may have nuanced differences. Consult a specialist scholar.`}
            </div>
          )}

          {/* Disclaimer */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500 leading-relaxed">⚠️ {L.disclaimer}</p>
          </div>

          {/* Reset */}
          <button onClick={reset}
            className="w-full py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors">
            {L.reset}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ en, ar, isAr }: { en: string; ar: string; isAr: boolean }) {
  return <h3 className="font-bold text-gray-900 text-base">{isAr ? ar : en}</h3>
}

function NumberField({ label, symbol, value, onChange, hint }: {
  label: string; symbol: string; value: string; onChange: (v: string) => void; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">{symbol}</span>
        <input
          type="number" min="0" value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
        />
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-sm">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function NavButtons({ onBack, onNext, nextLabel, backLabel, showBack = true, isPrimary = false }: {
  onBack?: () => void; onNext?: () => void; nextLabel: string; backLabel: string;
  showBack?: boolean; isPrimary?: boolean
}) {
  return (
    <div className="flex gap-3 pt-2">
      {showBack && onBack && (
        <button onClick={onBack}
          className="px-5 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors text-sm">
          {backLabel}
        </button>
      )}
      {onNext && (
        <button onClick={onNext}
          className={`flex-1 font-bold py-3 px-6 rounded-xl transition-colors text-sm ${
            isPrimary
              ? 'bg-teal-700 hover:bg-teal-800 text-white'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}>
          {nextLabel}
        </button>
      )}
    </div>
  )
}

function StatusCard({ label, meets, meetsLabel, notLabel }: {
  label: string; meets: boolean; meetsLabel: string; notLabel: string
}) {
  return (
    <div className={`rounded-xl px-4 py-3 border ${meets ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-sm font-bold ${meets ? 'text-emerald-700' : 'text-gray-500'}`}>
        {meets ? meetsLabel : notLabel}
      </p>
    </div>
  )
}

function ResultCard({ title, color, rows, note }: {
  title: string; color: 'teal' | 'amber';
  rows: { label: string; value: string; highlight?: boolean }[];
  note: string
}) {
  const hdr = color === 'teal' ? 'bg-teal-700' : 'bg-amber-600'
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100">
      <div className={`${hdr} px-5 py-3`}>
        <p className="text-white font-bold text-sm">{title}</p>
      </div>
      <div className="bg-white px-5 py-4 space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{r.label}</span>
            <span className={`text-sm font-bold ${r.highlight ? (color === 'teal' ? 'text-teal-700' : 'text-amber-700') : 'text-gray-800'}`}>
              {r.value}
            </span>
          </div>
        ))}
        <p className="text-xs text-gray-500 pt-2 border-t border-gray-50 leading-relaxed">{note}</p>
      </div>
    </div>
  )
}
