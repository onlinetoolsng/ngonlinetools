// 📁 app/[locale]/location/page.tsx
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { LOCATIONS } from '@/lib/registry/locations'
import { getToolsByCountry } from '@/lib/registry/tools'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { generateBreadcrumbSchema } from '@/lib/schema/schemas'

type Params = { locale: string }

const countryMeta: Record<string, { en: string; ar: string; flag: string; desc: { en: string; ar: string } }> = {
  uae:     { en: 'UAE',          ar: 'الإمارات', flag: '🇦🇪', desc: { en: 'Salary, gratuity, VAT and UAE labour law tools', ar: 'أدوات الرواتب والمكافآت وضريبة القيمة المضافة وقانون العمل الإماراتي' } },
  saudi:   { en: 'Saudi Arabia', ar: 'السعودية', flag: '🇸🇦', desc: { en: 'GOSI, zakat, KSA VAT and Vision 2030 tools',       ar: 'أدوات التأمينات والزكاة وضريبة القيمة المضافة ورؤية 2030' } },
  qatar:   { en: 'Qatar',        ar: 'قطر',      flag: '🇶🇦', desc: { en: 'Salary, gratuity and business tools for Qatar',     ar: 'أدوات الرواتب والمكافآت والأعمال في قطر' } },
  kuwait:  { en: 'Kuwait',       ar: 'الكويت',   flag: '🇰🇼', desc: { en: 'Finance, payroll and business tools for Kuwait',    ar: 'أدوات المال والرواتب والأعمال في الكويت' } },
  bahrain: { en: 'Bahrain',      ar: 'البحرين',  flag: '🇧🇭', desc: { en: 'VAT, salary and business tools for Bahrain',        ar: 'أدوات ضريبة القيمة المضافة والرواتب والأعمال في البحرين' } },
  oman:    { en: 'Oman',         ar: 'عُمان',    flag: '🇴🇲', desc: { en: 'Payroll, VAT and finance tools for Oman',            ar: 'أدوات الرواتب وضريبة القيمة المضافة والمال في عُمان' } },
  egypt:   { en: 'Egypt',        ar: 'مصر',      flag: '🇪🇬', desc: { en: 'Tax, salary and business tools for Egypt',           ar: 'أدوات الضرائب والرواتب والأعمال في مصر' } },
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'الأدوات حسب الدولة | OnlineToolsNG' : 'Tools by Country | OnlineToolsNG',
    description: locale === 'ar'
      ? 'أدوات وحاسبات مصممة لكل دولة خليجية — الإمارات والسعودية وقطر والكويت والبحرين وعُمان ومصر'
      : 'Tools and calculators built for every Gulf country — UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman and Egypt',
  }
}

export default async function LocationIndexPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const isAr = locale === 'ar'

  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const BASE_URL = 'https://onlinetoolsng.com'

  const breadcrumbItems = [
    { label: tNav('home'),      href: `/${locale}` },
    { label: tNav('locations'), href: `/${locale}/location` },
  ]

  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbItems.map(b => ({ name: b.label, url: `${BASE_URL}${b.href}` }))
  )

  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      <Header locale={locale} activePath={`/${locale}/location`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={`/${locale}`} />
        </div>

        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            {isAr ? 'الأدوات حسب الدولة' : 'Tools by Country'}
          </h1>
          <p className="text-gray-500 text-lg">
            {isAr
              ? 'كل أداة مصممة للقوانين والعملات والأنظمة المحلية'
              : 'Every tool calibrated for local laws, currencies and regulations'}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LOCATIONS.map(loc => {
            const meta = countryMeta[loc.slug]
            if (!meta) return null
            const toolCount = getToolsByCountry(loc.slug).length

            return (
              <Link
                key={loc.slug}
                href={`/${locale}/location/${loc.slug}`}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl flex-shrink-0">{meta.flag}</span>
                  <div className="min-w-0">
                    <h2 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors text-lg">
                      {isAr ? meta.ar : meta.en}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {isAr ? meta.desc.ar : meta.desc.en}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                        {loc.currencyCode}
                      </span>
                      {loc.vatRate !== undefined && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                          VAT {loc.vatRate}%
                        </span>
                      )}
                      <span className="text-xs text-indigo-700 font-semibold">
                        {toolCount} {isAr ? 'أداة' : 'tools'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <Footer locale={locale} />
    </>
  )
}