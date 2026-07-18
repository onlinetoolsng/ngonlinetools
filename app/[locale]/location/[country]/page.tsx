// 📁 app/[locale]/location/[country]/page.tsx
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getToolsByCountry } from '@/lib/registry/tools'
import { CATEGORIES } from '@/lib/registry/categories'
import { LOCATIONS } from '@/lib/registry/locations'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { generateBreadcrumbSchema, generateLocationSchema } from '@/lib/schema/schemas'

type Params = { locale: string; country: string }

const TOOL_NAMES: Record<string, { en: string; ar: string }> = {
  'salary-calculator':           { en: 'Salary Calculator',              ar: 'حاسبة الراتب' },
  'loan-emi-calculator':         { en: 'Loan EMI Calculator',            ar: 'حاسبة القسط الشهري' },
  'gratuity-calculator':         { en: 'Gratuity Calculator',            ar: 'حاسبة مكافأة نهاية الخدمة' },
  'zakat-calculator':            { en: 'Zakat Calculator',               ar: 'حاسبة الزكاة' },
  'hijri-gregorian-converter':   { en: 'Hijri–Gregorian Converter',      ar: 'محول التاريخ الهجري' },
  'uae-vat-calculator':          { en: 'UAE VAT Calculator',             ar: 'حاسبة ضريبة القيمة المضافة الإمارات' },
  'ksa-vat-calculator':          { en: 'Saudi VAT Calculator',           ar: 'حاسبة ضريبة القيمة المضافة السعودية' },
  'invoice-generator':           { en: 'Invoice Generator',              ar: 'مولّد الفواتير' },
  'compound-interest-calculator':{ en: 'Compound Interest Calculator',   ar: 'حاسبة الفائدة المركبة' },
  'savings-goal-calculator':     { en: 'Savings Goal Calculator',        ar: 'حاسبة هدف الادخار' },
  'leave-encashment-calculator': { en: 'Leave Encashment Calculator',    ar: 'حاسبة صرف الإجازة' },
  'notice-period-calculator':    { en: 'Notice Period Calculator',       ar: 'حاسبة فترة الإشعار' },
  'profit-margin-calculator':    { en: 'Profit Margin Calculator',       ar: 'حاسبة هامش الربح' },
}

function getToolName(slug: string, locale: string): string {
  const entry = TOOL_NAMES[slug]
  if (entry) return locale === 'ar' ? entry.ar : entry.en
  return slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const countryNames: Record<string, { en: string; ar: string; flag: string }> = {
  uae:     { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', flag: '🇦🇪' },
  saudi:   { en: 'Saudi Arabia',          ar: 'المملكة العربية السعودية', flag: '🇸🇦' },
  qatar:   { en: 'Qatar',                 ar: 'قطر',                      flag: '🇶🇦' },
  kuwait:  { en: 'Kuwait',                ar: 'الكويت',                   flag: '🇰🇼' },
  bahrain: { en: 'Bahrain',               ar: 'البحرين',                  flag: '🇧🇭' },
  oman:    { en: 'Oman',                  ar: 'سلطنة عُمان',              flag: '🇴🇲' },
  egypt:   { en: 'Egypt',                 ar: 'مصر',                      flag: '🇪🇬' },
}

const countryFacts: Record<string, { currency: string; vat: string; taxNote: { en: string; ar: string } }> = {
  uae:     { currency: 'AED', vat: '5%',  taxNote: { en: 'No personal income tax',   ar: 'لا ضريبة دخل شخصية' } },
  saudi:   { currency: 'SAR', vat: '15%', taxNote: { en: 'GOSI mandatory for nationals', ar: 'التأمينات الاجتماعية إلزامية' } },
  qatar:   { currency: 'QAR', vat: '0%',  taxNote: { en: 'No personal income tax',   ar: 'لا ضريبة دخل شخصية' } },
  kuwait:  { currency: 'KWD', vat: '0%',  taxNote: { en: 'No VAT or income tax',     ar: 'لا ضريبة قيمة مضافة أو دخل' } },
  bahrain: { currency: 'BHD', vat: '10%', taxNote: { en: 'VAT introduced in 2019',   ar: 'ضريبة القيمة المضافة منذ 2019' } },
  oman:    { currency: 'OMR', vat: '5%',  taxNote: { en: 'VAT introduced in 2021',   ar: 'ضريبة القيمة المضافة منذ 2021' } },
  egypt:   { currency: 'EGP', vat: '14%', taxNote: { en: 'Progressive income tax applies', ar: 'ضريبة دخل تصاعدية' } },
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale, country } = await params
  const info = countryNames[country]
  if (!info) return {}
  const name = locale === 'ar' ? info.ar : info.en
  return {
    title: locale === 'ar'
      ? `أدوات ${name} المجانية | Gulf Tools`
      : `Free Tools for ${name} | Gulf Tools`,
    description: locale === 'ar'
      ? `حاسبات وأدوات مصممة خصيصاً لـ ${name} — رواتب، ضرائب، مكافآت، وأكثر`
      : `Calculators and tools built for ${name} — salary, tax, gratuity and more`,
  }
}

export default async function LocationPage({ params }: { params: Promise<Params> }) {
  const { locale, country } = await params
  const isAr = locale === 'ar'

  const location = LOCATIONS.find(l => l.slug === country)
  if (!location) notFound()

  const countryInfo = countryNames[country]
  if (!countryInfo) notFound()

  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tCat = await getTranslations({ locale, namespace: 'categories' })

  const countryName = isAr ? countryInfo.ar : countryInfo.en
  const facts = countryFacts[country]
  const BASE_URL = 'https://gulftools.jobmeter.app'

  // Get all tools for this country, grouped by category
  const tools = getToolsByCountry(country)
  const toolsByCategory = CATEGORIES.map(cat => ({
    category: cat,
    tools: tools.filter(t => t.category === cat.slug),
  })).filter(g => g.tools.length > 0)

  const breadcrumbItems = [
    { label: tNav('home'),      href: `/${locale}` },
    { label: tNav('locations'), href: `/${locale}/location` },
    { label: countryName,       href: `/${locale}/location/${country}` },
  ]

  // Build flat tool list for ItemList schema
  const allToolsFlat = toolsByCategory.flatMap(({ category: cat, tools: catTools }) =>
    catTools.map(tool => ({
      name: getToolName(tool.slug, locale),
      url: `${BASE_URL}/${locale}/tools/${cat.slug}/${tool.slug}`,
    }))
  )

  const locationSchema = generateLocationSchema({
    countryName: isAr
      ? `أدوات ${countryName} المجانية`
      : `Free Tools for ${countryName}`,
    countryNameEn: countryInfo.en,
    description: isAr
      ? `حاسبات وأدوات مبنية خصيصاً لـ ${countryName}`
      : `Free calculators and tools built for ${countryName} — salary, tax, gratuity and more`,
    url: `${BASE_URL}/${locale}/location/${country}`,
    tools: allToolsFlat,
    locale,
  })

  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbItems.map(b => ({ name: b.label, url: `${BASE_URL}${b.href}` }))
  )

  return (
    <>
      <SchemaOrg schema={[locationSchema, breadcrumbSchema]} />
      <Header locale={locale} activePath={`/${locale}/location`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* Country hero */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{countryInfo.flag}</span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
                {isAr ? `أدوات ${countryName}` : `${countryName} Tools`}
              </h1>
              <p className="text-gray-500 mt-1">
                {isAr
                  ? `${tools.length} أداة مجانية مصممة لـ ${countryName}`
                  : `${tools.length} free tools built for ${countryName}`}
              </p>
            </div>
          </div>

          {/* Country fact chips */}
          {facts && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                💱 {isAr ? 'العملة:' : 'Currency:'} {facts.currency}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                🧾 {isAr ? 'ضريبة القيمة المضافة:' : 'VAT:'} {facts.vat}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                📋 {isAr ? facts.taxNote.ar : facts.taxNote.en}
              </span>
            </div>
          )}
        </div>

        {/* Tools grouped by category */}
        <div className="space-y-10">
          {toolsByCategory.map(({ category: cat, tools: catTools }) => {
            const catName = tCat(`${cat.slug}.name` as any)
            return (
              <section key={cat.slug}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <span>{cat.icon}</span>
                    <span>{catName}</span>
                  </h2>
                  <Link
                    href={`/${locale}/tools/${cat.slug}`}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    {isAr ? 'عرض الكل ←' : 'View all →'}
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catTools.map(tool => (
                    <Link
                      key={tool.slug}
                      href={`/${locale}/tools/${tool.category}/${tool.slug}`}
                      className="group bg-white border border-gray-100 rounded-xl p-4 hover:border-emerald-200 hover:shadow-sm transition-all"
                    >
                      <h3 className="font-semibold text-sm text-gray-800 group-hover:text-emerald-600 transition-colors">
                        {getToolName(tool.slug, locale)}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 capitalize">
                        {tool.schema}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* Other countries strip */}
        <div className="mt-16 pt-10 border-t border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
            {isAr ? 'دول أخرى' : 'Other Countries'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(countryNames)
              .filter(([slug]) => slug !== country)
              .map(([slug, info]) => (
                <Link
                  key={slug}
                  href={`/${locale}/location/${slug}`}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition-all"
                >
                  <span>{info.flag}</span>
                  <span>{isAr ? info.ar : info.en}</span>
                </Link>
              ))}
          </div>
        </div>
      </div>

      <Footer locale={locale} />
    </>
  )
}