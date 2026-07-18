'use client'

import { useState } from 'react'

type Props = { locale: string }

// ─── Country rules ───────────────────────────────────────────────────────────
const COUNTRY_RULES: Record<
  string,
  {
    label: string
    currency: string
    flag: string
    indefinite: { minDays: number; maxDays: number; note: string }
    fixed: { days: number; note: string }
    probation: { days: number; note: string }
    source: string
  }
> = {
  uae: {
    label: 'UAE',
    currency: 'AED',
    flag: '🇦🇪',
    indefinite: {
      minDays: 30,
      maxDays: 90,
      note: 'UAE Labour Law (Federal Decree-Law No. 33 of 2021): 30 days minimum, up to 90 days as agreed. Same for employer and employee.',
    },
    fixed: {
      days: 30,
      note: 'Fixed-term contracts: 30 days minimum notice or as stipulated in contract.',
    },
    probation: {
      days: 14,
      note: 'During probation (max 6 months): 14 days notice required.',
    },
    source: 'https://mohre.gov.ae',
  },
  saudi: {
    label: 'Saudi Arabia',
    currency: 'SAR',
    flag: '🇸🇦',
    indefinite: {
      minDays: 60,
      maxDays: 60,
      note: 'Saudi Labour Law (Royal Decree M/51): 60 days for monthly-paid employees on indefinite contracts.',
    },
    fixed: {
      days: 30,
      note: 'Fixed-term contracts: 30 days notice, or as per contract terms.',
    },
    probation: {
      days: 0,
      note: 'During probation (max 90 days): no statutory notice period required.',
    },
    source: 'https://hrsd.gov.sa',
  },
  qatar: {
    label: 'Qatar',
    currency: 'QAR',
    flag: '🇶🇦',
    indefinite: {
      minDays: 30,
      maxDays: 90,
      note: 'Qatar Labour Law (Law No. 14 of 2004, amended): 30 days for <5 years service; up to 90 days for longer tenure.',
    },
    fixed: {
      days: 30,
      note: 'Fixed-term contracts: 30 days or as specified in the contract.',
    },
    probation: {
      days: 0,
      note: 'During probation (max 6 months): no mandatory notice required.',
    },
    source: 'https://adlsa.gov.qa',
  },
  kuwait: {
    label: 'Kuwait',
    currency: 'KWD',
    flag: '🇰🇼',
    indefinite: {
      minDays: 30,
      maxDays: 90,
      note: 'Kuwait Labour Law (Law No. 6 of 2010): minimum 30 days; up to 3 months for senior roles or as agreed.',
    },
    fixed: {
      days: 30,
      note: 'Fixed-term contracts: end-of-contract notice as per agreement, typically 30 days.',
    },
    probation: {
      days: 0,
      note: 'During probation (max 100 days): notice may be waived unless contractually stated.',
    },
    source: 'https://msal.gov.kw',
  },
}

const CONTRACT_TYPES = [
  { value: 'indefinite', labelEn: 'Indefinite / Unlimited', labelAr: 'عقد غير محدد المدة' },
  { value: 'fixed',      labelEn: 'Fixed-term / Limited',   labelAr: 'عقد محدد المدة'   },
  { value: 'probation',  labelEn: 'During Probation',       labelAr: 'فترة التجربة'     },
]

type Result = {
  noticeDays: number
  lastWorkingDate: string
  payInLieu: number
  dailyRate: number
  currency: string
  country: string
  contractType: string
  note: string
  source: string
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatNum(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function NoticePeriodCalculator({ locale }: Props) {
  const isAr = locale === 'ar'

  const [country, setCountry] = useState('uae')
  const [contractType, setContractType] = useState('indefinite')
  const [startDate, setStartDate] = useState('')          // resignation/termination date
  const [monthlySalary, setMonthlySalary] = useState('')  // optional, for pay-in-lieu
  const [serviceYears, setServiceYears] = useState('')    // for Qatar tiered rule
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  const rules = COUNTRY_RULES[country]

  function calculate() {
    setError('')
    if (!startDate) {
      setError(isAr ? 'يرجى اختيار تاريخ الإشعار' : 'Please select the notice start date')
      return
    }

    const noticeStart = new Date(startDate)
    let noticeDays = 0
    let note = ''

    // ── Determine days based on country + contract ──
    if (contractType === 'probation') {
      noticeDays = rules.probation.days
      note = rules.probation.note
    } else if (contractType === 'fixed') {
      noticeDays = rules.fixed.days
      note = rules.fixed.note
    } else {
      // Indefinite — Qatar has tiered rule
      if (country === 'qatar') {
        const years = parseFloat(serviceYears) || 0
        noticeDays = years < 5 ? 30 : years < 10 ? 60 : 90
      } else {
        noticeDays = rules.indefinite.minDays
      }
      note = rules.indefinite.note
    }

    const lastDay = addDays(noticeStart, noticeDays)
    const salary = parseFloat(monthlySalary) || 0
    const dailyRate = salary / 30
    const payInLieu = dailyRate * noticeDays

    setResult({
      noticeDays,
      lastWorkingDate: formatDate(lastDay, locale),
      payInLieu,
      dailyRate,
      currency: rules.currency,
      country: rules.label,
      contractType,
      note,
      source: rules.source,
    })
  }

  function reset() {
    setCountry('uae')
    setContractType('indefinite')
    setStartDate('')
    setMonthlySalary('')
    setServiceYears('')
    setResult(null)
    setError('')
  }

  const t = isAr
    ? {
        title: 'حاسبة فترة الإشعار',
        country: 'الدولة',
        contractType: 'نوع العقد',
        startDate: 'تاريخ بدء فترة الإشعار',
        salary: 'الراتب الشهري الأساسي (اختياري)',
        salaryHint: 'لحساب الأجر بدلاً من فترة الإشعار',
        serviceYears: 'سنوات الخدمة',
        calculate: 'احسب',
        reset: 'إعادة تعيين',
        results: 'نتائج فترة الإشعار',
        noticeDays: 'مدة فترة الإشعار',
        days: 'يوم',
        lastDay: 'آخر يوم عمل',
        payInLieu: 'الأجر بدلاً من الإشعار',
        dailyRate: 'الأجر اليومي',
        legalNote: 'الأساس القانوني',
        source: 'المصدر الرسمي',
        visitSource: 'زيارة المصدر',
        disclaimer: 'هذه الأداة للأغراض المعلوماتية فقط. تحقق من وزارة العمل أو استشر محامياً.',
        enterAmount: 'أدخل المبلغ',
      }
    : {
        title: 'Notice Period Calculator',
        country: 'Country',
        contractType: 'Contract Type',
        startDate: 'Notice Start Date',
        salary: 'Basic Monthly Salary (optional)',
        salaryHint: 'Used to calculate pay in lieu of notice',
        serviceYears: 'Years of Service',
        calculate: 'Calculate Notice Period',
        reset: 'Reset',
        results: 'Notice Period Results',
        noticeDays: 'Notice Period',
        days: 'days',
        lastDay: 'Last Working Day',
        payInLieu: 'Pay in Lieu of Notice',
        dailyRate: 'Daily Rate',
        legalNote: 'Legal Basis',
        source: 'Official Source',
        visitSource: 'Visit Source',
        disclaimer: 'For informational purposes only. Verify with the Ministry of Labour or consult a legal professional.',
        enterAmount: 'Enter amount',
      }

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Country */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.country}</label>
          <select
            value={country}
            onChange={e => { setCountry(e.target.value); setResult(null) }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {Object.entries(COUNTRY_RULES).map(([k, v]) => (
              <option key={k} value={k}>{v.flag} {v.label}</option>
            ))}
          </select>
        </div>

        {/* Contract type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.contractType}</label>
          <select
            value={contractType}
            onChange={e => { setContractType(e.target.value); setResult(null) }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          >
            {CONTRACT_TYPES.map(c => (
              <option key={c.value} value={c.value}>
                {isAr ? c.labelAr : c.labelEn}
              </option>
            ))}
          </select>
        </div>

        {/* Notice start date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.startDate}</label>
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setResult(null) }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        {/* Service years — only shown for Qatar indefinite */}
        {country === 'qatar' && contractType === 'indefinite' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.serviceYears}</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={serviceYears}
              onChange={e => setServiceYears(e.target.value)}
              placeholder="e.g. 3"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        )}

        {/* Optional salary */}
        <div className={country === 'qatar' && contractType === 'indefinite' ? '' : 'sm:col-span-2'}>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t.salary}
            <span className="ml-2 text-xs font-normal text-gray-500">({t.salaryHint})</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
              {rules.currency}
            </span>
            <input
              type="number"
              min="0"
              value={monthlySalary}
              onChange={e => setMonthlySalary(e.target.value)}
              placeholder={t.enterAmount}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 font-medium">{error}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {t.calculate}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition-colors"
        >
          {t.reset}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100">
          <h3 className="font-bold text-gray-900">{t.results}</h3>

          {/* Hero: notice days */}
          <div className="bg-emerald-600 rounded-xl p-4 text-white flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80 mb-1">{t.noticeDays}</div>
              <div className="text-4xl font-black">{result.noticeDays}</div>
            </div>
            <div className="text-6xl font-black opacity-20">{t.days}</div>
          </div>

          {/* Key fields */}
          <div className="space-y-3">
            <ResultRow
              label={t.lastDay}
              value={result.lastWorkingDate}
              highlight
            />

            {result.payInLieu > 0 && (
              <>
                <ResultRow
                  label={t.dailyRate}
                  value={formatNum(result.dailyRate, result.currency)}
                />
                <ResultRow
                  label={t.payInLieu}
                  value={formatNum(result.payInLieu, result.currency)}
                  highlight
                />
              </>
            )}

            {/* Legal note */}
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t.legalNote}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{result.note}</p>
              <a
                href={result.source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline font-medium"
              >
                {t.visitSource} — {result.source} ↗
              </a>
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

function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-semibold text-right ${highlight ? 'text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}
