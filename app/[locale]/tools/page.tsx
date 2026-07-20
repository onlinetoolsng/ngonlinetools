// 📁 app/[locale]/tools/page.tsx
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { CATEGORIES } from '@/lib/registry/categories'
import { TOOLS } from '@/lib/registry/tools'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'
import { generateBreadcrumbSchema } from '@/lib/schema/schemas'

type Params = { locale: string }

const colorMap: Record<string, string> = {
  indigo:  'border-indigo-200 hover:bg-indigo-50',
  amber:   'border-amber-200 hover:bg-amber-50',
  blue:    'border-blue-200 hover:bg-blue-50',
  slate:   'border-slate-200 hover:bg-slate-50',
  orange:  'border-orange-200 hover:bg-orange-50',
  rose:    'border-rose-200 hover:bg-rose-50',
  cyan:    'border-cyan-200 hover:bg-cyan-50',
  yellow:  'border-yellow-200 hover:bg-yellow-50',
  stone:   'border-stone-200 hover:bg-stone-50',
  zinc:    'border-zinc-200 hover:bg-zinc-50',
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'جميع الأدوات | ToolBase' : 'All Tools | ToolBase',
    description: locale === 'ar'
      ? 'تصفح أكثر من 50 أداة مجانية مصممة لدول الخليج'
      : 'Browse free tools built for individuals and businesses in Nigeria',
  }
}

export default async function ToolsDirectoryPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const isAr = locale === 'ar'

  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tCat = await getTranslations({ locale, namespace: 'categories' })

  const BASE_URL = 'https://toolbase.com.ng'

  const breadcrumbItems = [
    { label: tNav('home'),  href: `/${locale}` },
    { label: tNav('tools'), href: `/${locale}/tools` },
  ]

  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbItems.map(b => ({ name: b.label, url: `${BASE_URL}${b.href}` }))
  )

  // Count tools per category
  const toolCountByCategory = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.slug] = TOOLS.filter(t => t.category === cat.slug).length
    return acc
  }, {})

  // Only show categories that actually have at least one tool
  const visibleCategories = CATEGORIES.filter(cat => (toolCountByCategory[cat.slug] ?? 0) > 0)

  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />

      {/* Header */}
      <Header locale={locale} activePath={`/${locale}/tools`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={`/${locale}`} />
        </div>

        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            {isAr ? 'جميع الأدوات' : 'All Tools'}
          </h1>
          <p className="text-gray-500 text-lg">
            {isAr
              ? `${TOOLS.length}+ أداة مجانية موزعة على ${visibleCategories.length} فئة`
              : `${TOOLS.length}+ free tools across ${visibleCategories.length} categories`}
          </p>
        </header>

        {/* Categories grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleCategories.map(cat => {
            const hoverColor = colorMap[cat.color] ?? colorMap.indigo
            const count = toolCountByCategory[cat.slug] ?? 0
            const catName = tCat(`${cat.slug}.name` as any)
            const catDesc = tCat(`${cat.slug}.description` as any)

            return (
              <Link
                key={cat.slug}
                href={`/${locale}/tools/${cat.slug}`}
                className={`group bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${hoverColor}`}
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h2 className="font-bold text-gray-900 group-hover:text-indigo-800 transition-colors mb-1">
                  {catName}
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
                  {catDesc}
                </p>
                <span className="text-xs font-semibold text-gray-500">
                  {count} {isAr ? 'أداة' : count === 1 ? 'tool' : 'tools'}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <Footer locale={locale} />
    </>
  )
}