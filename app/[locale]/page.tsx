// 📁 app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getFeaturedTools, TOOLS } from '@/lib/registry/tools'
import { CATEGORIES } from '@/lib/registry/categories'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { generateOrganizationSchema } from '@/lib/schema/schemas'
import AdUnit from '@/components/ads/AdUnit'
import { AD_SLOTS } from '@/components/ads/slots'
import { generateHomepageMetadata } from '@/lib/utils/seo'
import { getToolIcon } from '@/lib/utils/toolIcons'

type Params = { locale: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale } = await params
  return generateHomepageMetadata(locale)
}

// Tailwind color map for category pills
const colorMap: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  blue:    'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  purple:  'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  orange:  'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  teal:    'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
  red:     'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  green:   'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  yellow:  'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  pink:    'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
  slate:   'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  sky:     'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  zinc:    'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100',
  amber:   'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  stone:   'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100',
  lime:    'bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100',
}

// Tool name translations (static lookup — these match tool slugs to i18n keys)
const toolNameMap: Record<string, string> = {
  'salary-calculator':                       'Salary Calculator',
  'loan-emi-calculator':                     'Loan EMI Calculator',
  'gratuity-calculator':                     'Gratuity Calculator',
  'zakat-calculator':                        'Zakat Calculator',
  'hijri-gregorian-converter':               'Hijri–Gregorian Converter',
  'uae-vat-calculator':                      'UAE VAT Calculator',
  'invoice-generator':                       'Invoice Generator',
  'uae-salary-calculator':                   'UAE Salary Calculator',
  'dubai-salary-calculator':                 'Dubai Salary Calculator',
  'gcc-emi-calculator':                      'GCC EMI Calculator',
  'car-loan-calculator-uae':                 'UAE Car Loan Calculator',
  'uae-mortgage-calculator':                 'UAE Mortgage Calculator',
  'dubai-mortgage-calculator-non-residents': 'Dubai Mortgage (Non-Residents)',
  'home-loan-calculator-dubai':              'Dubai Home Loan Calculator',
  'gold-zakat-calculator':                   'Gold Zakat Calculator',
  'cash-zakat-calculator':                   'Cash Zakat Calculator',
}

const toolDescMap: Record<string, string> = {
  'salary-calculator':                       'Net salary after deductions for UAE, KSA, Qatar and more',
  'loan-emi-calculator':                     'Monthly EMI, total interest and repayment schedule',
  'gratuity-calculator':                     'End-of-service benefit under UAE & Gulf Labour Law',
  'zakat-calculator':                        'Annual Zakat on savings, gold and investments',
  'hijri-gregorian-converter':               'Convert between Hijri and Gregorian calendars instantly',
  'uae-vat-calculator':                      'Add or remove UAE 5% VAT from any amount',
  'invoice-generator':                       'Professional invoices with VAT for Gulf businesses',
  'uae-salary-calculator':                   'Take-home pay after deductions across the UAE',
  'dubai-salary-calculator':                 'Calculate your net salary in Dubai instantly',
  'gcc-emi-calculator':                      'Compare loan EMIs across all Gulf countries',
  'car-loan-calculator-uae':                 'Monthly instalments for auto financing in the UAE',
  'uae-mortgage-calculator':                 'Estimate your monthly mortgage payments in the UAE',
  'dubai-mortgage-calculator-non-residents': 'Mortgage estimates for non-resident property buyers in Dubai',
  'home-loan-calculator-dubai':              'Plan your home loan repayments in Dubai',
  'gold-zakat-calculator':                   'Calculate Zakat due on your gold holdings',
  'cash-zakat-calculator':                   'Calculate Zakat due on cash and savings',
}

const toolNameMapAr: Record<string, string> = {
  'salary-calculator':                       'حاسبة الراتب',
  'loan-emi-calculator':                     'حاسبة القسط الشهري',
  'gratuity-calculator':                     'حاسبة مكافأة نهاية الخدمة',
  'zakat-calculator':                        'حاسبة الزكاة',
  'hijri-gregorian-converter':               'محول التاريخ الهجري والميلادي',
  'uae-vat-calculator':                      'حاسبة ضريبة القيمة المضافة',
  'invoice-generator':                       'مولّد الفواتير',
  'uae-salary-calculator':                   'حاسبة الراتب في الإمارات',
  'dubai-salary-calculator':                 'حاسبة راتب دبي',
  'gcc-emi-calculator':                      'حاسبة القسط الشهري الخليجية',
  'car-loan-calculator-uae':                 'حاسبة قرض السيارة في الإمارات',
  'uae-mortgage-calculator':                 'حاسبة الرهن العقاري في الإمارات',
  'dubai-mortgage-calculator-non-residents': 'رهن عقاري لغير المقيمين في دبي',
  'home-loan-calculator-dubai':              'حاسبة قرض المنزل في دبي',
  'gold-zakat-calculator':                   'حاسبة زكاة الذهب',
  'cash-zakat-calculator':                   'حاسبة زكاة النقد',
}

const toolDescMapAr: Record<string, string> = {
  'salary-calculator':                       'الراتب الصافي بعد الخصومات للإمارات والسعودية وقطر',
  'loan-emi-calculator':                     'القسط الشهري وإجمالي الفوائد وجدول السداد',
  'gratuity-calculator':                     'مكافأة نهاية الخدمة وفق قانون العمل الخليجي',
  'zakat-calculator':                        'الزكاة السنوية على المدخرات والذهب والاستثمارات',
  'hijri-gregorian-converter':               'التحويل بين التقويم الهجري والميلادي فوراً',
  'uae-vat-calculator':                      'إضافة أو طرح ضريبة القيمة المضافة 5% من أي مبلغ',
  'invoice-generator':                       'فواتير احترافية شاملة ضريبة القيمة المضافة',
  'uae-salary-calculator':                   'الراتب الصافي بعد الخصومات في الإمارات',
  'dubai-salary-calculator':                 'احسب راتبك الصافي في دبي فوراً',
  'gcc-emi-calculator':                      'قارن الأقساط الشهرية بين دول الخليج',
  'car-loan-calculator-uae':                 'الأقساط الشهرية لتمويل السيارات في الإمارات',
  'uae-mortgage-calculator':                 'احسب أقساط الرهن العقاري الشهرية في الإمارات',
  'dubai-mortgage-calculator-non-residents': 'تقديرات الرهن العقاري لغير المقيمين في دبي',
  'home-loan-calculator-dubai':              'خطط لأقساط قرض منزلك في دبي',
  'gold-zakat-calculator':                   'احسب الزكاة المستحقة على مقتنياتك الذهبية',
  'cash-zakat-calculator':                   'احسب الزكاة المستحقة على النقد والمدخرات',
}


export default async function HomePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale } = await params
  const isAr = locale === 'ar'

  const t = await getTranslations({ locale, namespace: 'homepage' })
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tCat = await getTranslations({ locale, namespace: 'categories' })

  const featuredTools = getFeaturedTools()
  // Top 8 categories that actually have at least one tool
  const categoriesWithTools = CATEGORIES.filter(cat => TOOLS.some(t => t.category === cat.slug))
  const topCategories = categoriesWithTools.slice(0, 8)

  const stats = [
    { value: '50+', label: t('toolsCount') },
    { value: '7',   label: t('countriesCount') },
    { value: '2',   label: t('languagesCount') },
  ]

  const locations = [
    { slug: 'uae',     flag: '🇦🇪', name: isAr ? 'الإمارات' : 'UAE' },
    { slug: 'saudi',   flag: '🇸🇦', name: isAr ? 'السعودية' : 'Saudi Arabia' },
    { slug: 'qatar',   flag: '🇶🇦', name: isAr ? 'قطر' : 'Qatar' },
    { slug: 'kuwait',  flag: '🇰🇼', name: isAr ? 'الكويت' : 'Kuwait' },
    { slug: 'bahrain', flag: '🇧🇭', name: isAr ? 'البحرين' : 'Bahrain' },
    { slug: 'oman',    flag: '🇴🇲', name: isAr ? 'عُمان' : 'Oman' },
    { slug: 'egypt',   flag: '🇪🇬', name: isAr ? 'مصر' : 'Egypt' },
  ]

  return (
    <>
      <SchemaOrg schema={generateOrganizationSchema()} />

      <Header locale={locale} />

      <main>
        {/* ─── HERO ────────────────────────────────────────────────────────────── */}
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-4xl mx-auto">
              {/* Country flags row */}
              <div className="flex justify-center items-center gap-2 mb-6">
                {locations.map(l => (
                  <span key={l.slug} className="text-2xl" title={l.name}>
                    {l.flag}
                  </span>
                ))}
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-tight tracking-tight mb-6">
                {t('hero')}
              </h1>
              <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                {t('heroSub')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/${locale}/tools`}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
                >
                  {t('heroCta')}
                  <span aria-hidden>{isAr ? '←' : '→'}</span>
                </Link>
              </div>

              <p className="mt-6 text-sm text-gray-400">{t('trustedBy')}</p>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {stats.map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-black text-emerald-600">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURED TOOLS ──────────────────────────────────────────────────── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('featuredTools')}</h2>
              <Link
                href={`/${locale}/tools`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {isAr ? 'عرض الكل ←' : 'View all →'}
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {featuredTools.map(tool => {
                const name = isAr
                  ? (toolNameMapAr[tool.slug] ?? tool.slug)
                  : (toolNameMap[tool.slug] ?? tool.slug)
                const desc = isAr
                  ? (toolDescMapAr[tool.slug] ?? '')
                  : (toolDescMap[tool.slug] ?? '')
                const emoji = getToolIcon(tool)

                return (
                  <Link
                    key={tool.slug}
                    href={`/${locale}/tools/${tool.category}/${tool.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-emerald-200 hover:shadow-md transition-all"
                  >
                    <div className="text-2xl mb-3">{emoji}</div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors text-sm leading-snug mb-1">
                      {name}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Ad: between sections */}
        <section className="py-4 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
            <AdUnit slot={AD_SLOTS.MIDDLE_DISPLAY} />
          </div>
        </section>

        {/* ─── POPULAR CATEGORIES ──────────────────────────────────────────────── */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('popularCategories')}</h2>
              <Link
                href={`/${locale}/tools`}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {isAr ? 'جميع الفئات ←' : 'All categories →'}
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {topCategories.map(cat => {
                const colors = colorMap[cat.color] ?? colorMap.emerald
                // Safe key lookup for tCat — categories are defined, so this is safe
                const catName = tCat(`${cat.slug}.name` as any)
                const catDesc = tCat(`${cat.slug}.description` as any)

                return (
                  <Link
                    key={cat.slug}
                    href={`/${locale}/tools/${cat.slug}`}
                    className={`group rounded-2xl border p-4 transition-all ${colors}`}
                  >
                    <div className="text-2xl mb-2">{cat.icon}</div>
                    <div className="font-semibold text-sm leading-snug">{catName}</div>
                    <p className="text-xs mt-1 opacity-75 leading-relaxed hidden sm:block line-clamp-2">
                      {catDesc}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── LOCATIONS ───────────────────────────────────────────────────────── */}
        <section className="py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              {isAr ? 'متاح في جميع دول الخليج' : 'Available across the Gulf'}
            </h2>
            <div className="flex flex-wrap justify-center gap-3">
              {locations.map(loc => (
                <Link
                  key={loc.slug}
                  href={`/${locale}/location/${loc.slug}`}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:border-emerald-300 hover:text-emerald-700 transition-all"
                >
                  <span>{loc.flag}</span>
                  <span>{loc.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </>
  )
}