// 📁 app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getFeaturedTools } from '@/lib/registry/tools'
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

// Tailwind color map for category pills — matches lib/registry/categories.ts
const colorMap: Record<string, string> = {
  indigo:  'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  amber:   'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  blue:    'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  slate:   'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  orange:  'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  rose:    'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  cyan:    'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  yellow:  'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  stone:   'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100',
  zinc:    'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100',
}

export default async function HomePage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale } = await params

  const t = await getTranslations({ locale, namespace: 'homepage' })
  const tCat = await getTranslations({ locale, namespace: 'categories' })

  const featuredTools = getFeaturedTools()

  const stats = [
    { value: '10',   label: t('toolsCount') },
    { value: '100%', label: t('countriesCount') },
    { value: '🇳🇬',   label: t('languagesCount') },
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
              <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
                <span>🇳🇬</span>
                <span>Made for Nigeria</span>
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
                  className="inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
                >
                  {t('heroCta')}
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <p className="mt-6 text-sm text-gray-400">{t('trustedBy')}</p>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {stats.map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-black text-indigo-700">{stat.value}</div>
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
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors"
              >
                View all →
              </Link>
            </div>

            {featuredTools.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {featuredTools.map(tool => {
                  const emoji = getToolIcon(tool)

                  return (
                    <Link
                      key={tool.slug}
                      href={`/${locale}/tools/${tool.category}/${tool.slug}`}
                      className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-md transition-all"
                    >
                      <div className="text-2xl mb-3">{emoji}</div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors text-sm leading-snug mb-1">
                        {tool.slug}
                      </h3>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <div className="text-3xl mb-3">🛠️</div>
                <p className="font-semibold text-gray-700 mb-1">{t('comingSoon')}</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">{t('comingSoonSub')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Ad: between sections */}
        <section className="py-4 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
            <AdUnit slot={AD_SLOTS.MIDDLE_DISPLAY} />
          </div>
        </section>

        {/* ─── CATEGORIES ──────────────────────────────────────────────────────── */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('popularCategories')}</h2>
              <Link
                href={`/${locale}/tools`}
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors"
              >
                All categories →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {CATEGORIES.map(cat => {
                const colors = colorMap[cat.color] ?? colorMap.indigo
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
      </main>

      <Footer locale={locale} />
    </>
  )
}
