// 📁 app/[locale]/tools/[category]/page.tsx
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getToolsByCategory } from '@/lib/registry/tools'
import { CATEGORIES } from '@/lib/registry/categories'
import { generateCategoryMetadata } from '@/lib/utils/seo'
import { generateCollectionSchema, generateBreadcrumbSchema } from '@/lib/schema/schemas'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'
import { getToolIcon } from '@/lib/utils/toolIcons'

type Params = { locale: string; category: string }

const TOOL_NAMES: Record<string, { en: string; ar: string }> = {
  'salary-calculator': { en: 'Salary Calculator', ar: '' },
  'vat-calculator':    { en: 'VAT Calculator',    ar: '' },
  'company-income-tax-calculator': { en: 'Company Income Tax Calculator', ar: '' },
  'pension-calculator': { en: 'Pension Calculator', ar: '' },
  'investment-returns-calculator': { en: 'Investment Returns Calculator', ar: '' },
  'net-worth-calculator': { en: 'Net Worth Calculator', ar: '' },
  'loan-repayment-calculator': { en: 'Loan Repayment & True Cost Calculator', ar: '' },
  'capital-gains-tax-calculator': { en: 'Capital Gains Tax Calculator', ar: '' },
  'nigeria-crypto-vs-traditional-comparator': { en: 'Crypto vs Traditional Investments Comparator', ar: '' },
  'nigeria-stock-portfolio-tracker': { en: 'NGX Stock Portfolio Tracker', ar: '' },
  'nigeria-paye-tax-calculator': { en: 'Nigeria PAYE Tax Calculator', ar: '' },
}

function getToolName(slug: string, locale: string): string {
  const entry = TOOL_NAMES[slug]
  if (entry) return locale === 'ar' ? entry.ar : entry.en
  return slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale, category } = await params
  return generateCategoryMetadata(locale, category)
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { locale, category } = await params
  const isAr = locale === 'ar'

  const categoryData = CATEGORIES.find(c => c.slug === category)
  if (!categoryData) notFound()

  const tools = getToolsByCategory(category)
  const t = await getTranslations({ locale, namespace: `categories.${category}` })
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const BASE_URL = 'https://onlinetoolsng.com'

  const breadcrumbItems = [
    { label: tNav('home'),  href: `/${locale}` },
    { label: tNav('tools'), href: `/${locale}/tools` },
    { label: t('name'),     href: `/${locale}/tools/${category}` },
  ]

  // Resolve real tool names from translations (fall back to slug if not found)
  const toolsForSchema = tools.map(tool => ({
    name: getToolName(tool.slug, locale),
    url: `${BASE_URL}/${locale}/tools/${category}/${tool.slug}`,
  }))

  const collectionSchema = generateCollectionSchema({
    name: t('name'),
    description: t('description'),
    url: `${BASE_URL}/${locale}/tools/${category}`,
    tools: toolsForSchema,
  })

  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbItems.map(b => ({ name: b.label, url: `${BASE_URL}${b.href}` }))
  )

  return (
    <>
      <SchemaOrg schema={[collectionSchema, breadcrumbSchema]} />

      {/* Header */}
      <Header locale={locale} activePath={`/${locale}/tools`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={`/${locale}/tools`} />
        </div>

        {/* Category header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{categoryData.icon}</span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900">{t('name')}</h1>
          </div>
          <p className="text-gray-500 text-lg max-w-2xl">{t('description')}</p>
          <p className="text-sm text-gray-500 mt-2">
            {tools.length} {locale === 'ar' ? 'أداة متاحة' : 'tools available'}
          </p>
        </header>

        {/* Tool grid */}
        {tools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map(tool => (
              <Link
                key={tool.slug}
                href={`/${locale}/tools/${category}/${tool.slug}`}
                className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="text-2xl mb-3">
                  {getToolIcon(tool)}
                </div>
                <h2 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors mb-1">
                  {getToolName(tool.slug, locale)}
                </h2>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tool.countries.slice(0, 4).map(c => (
                    <span key={c} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">
                      {c}
                    </span>
                  ))}
                  {tool.countries.length > 4 && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      +{tool.countries.length - 4}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-3">{categoryData.icon}</div>
            <p>{locale === 'ar' ? 'أدوات قريباً' : 'Tools coming soon'}</p>
          </div>
        )}
      </div>

      <Footer locale={locale} />
    </>
  )
}