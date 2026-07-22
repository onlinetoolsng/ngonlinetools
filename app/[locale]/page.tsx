// 📁 app/[locale]/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
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
import { FileCheck2 } from 'lucide-react'
import { getAllPublishedTemplates } from '@/lib/documents/document-templates-data'
import { getDocumentType, getDocumentCountry } from '@/lib/documents/document-types'
import { getPublishedArticles } from '@/lib/supabase/queries'
import { getCategoryIcon, getCategoryBadgeClass } from '@/lib/registry/categories'
import { localePath } from '@/lib/i18n/paths'

type Params = { locale: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale } = await params
  setRequestLocale(locale)
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
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'homepage' })
  const tCat = await getTranslations({ locale, namespace: 'categories' })
  const isAr = locale === 'ar'

  const featuredTools = getFeaturedTools()

  const [allTemplates, latestArticles] = await Promise.all([
    getAllPublishedTemplates(),
    getPublishedArticles(locale, 3),
  ])
  const featuredDocuments = allTemplates.slice(0, 4)

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
                  href={localePath(locale, `/tools`)}
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
                href={localePath(locale, `/tools`)}
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
                      href={localePath(locale, `/tools/${tool.category}/${tool.slug}`)}
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
                href={localePath(locale, `/tools`)}
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
                    href={localePath(locale, `/tools/${cat.slug}`)}
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

        {/* ─── DOCUMENT TEMPLATES ──────────────────────────────────────────────── */}
        <section className="py-16 bg-gray-50 border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck2 className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    {t('freeNoSignUp')}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('documentTemplates')}</h2>
              </div>
              <Link
                href={localePath(locale, `/documents`)}
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors whitespace-nowrap"
              >
                {t('viewAllDocuments')}
              </Link>
            </div>

            {featuredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredDocuments.map(doc => {
                  const docType = getDocumentType(doc.document_type)
                  const docCountry = getDocumentCountry(doc.country)
                  const label = docType?.label || doc.title
                  const countryFlag = docCountry?.flag || '🌍'
                  const countryName = docCountry?.name || doc.country.toUpperCase()

                  return (
                    <Link
                      key={doc.id}
                      href={localePath(locale, `/documents/${doc.document_type}/${doc.country}`)}
                      className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-indigo-200 hover:shadow-md transition-all"
                    >
                      <div className="text-2xl mb-3">📄</div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors text-sm leading-snug mb-1">
                        {label}
                      </h3>
                      <p className="text-xs text-gray-500">{countryFlag} {countryName}</p>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <div className="text-3xl mb-3">📄</div>
                <p className="font-semibold text-gray-700 mb-1">{t('documentsComingSoon')}</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">{t('documentsComingSoonSub')}</p>
              </div>
            )}
          </div>
        </section>

        {/* ─── FROM THE BLOG ───────────────────────────────────────────────────── */}
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('fromTheBlog')}</h2>
              <Link
                href={localePath(locale, `/blog`)}
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800 transition-colors whitespace-nowrap"
              >
                {t('viewAllArticles')}
              </Link>
            </div>

            {latestArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestArticles.map(article => {
                  const at = article.translation
                  if (!at) return null
                  const badgeColor = getCategoryBadgeClass(article.category_slug)
                  const icon = getCategoryIcon(article.category_slug)

                  return (
                    <article
                      key={article.slug}
                      className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl">{icon}</span>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
                          {article.category_slug.replace(/-/g, ' ')}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 leading-snug mb-2 flex-1">
                        <Link
                          href={localePath(locale, `/blog/${article.slug}`)}
                          className="hover:text-indigo-700 transition-colors"
                        >
                          {at.title}
                        </Link>
                      </h3>

                      {at.excerpt && (
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">
                          {at.excerpt}
                        </p>
                      )}

                      <time
                        dateTime={article.published_at}
                        className="text-xs text-gray-400 mt-auto pt-4 border-t border-gray-50"
                      >
                        {new Date(article.published_at).toLocaleDateString(
                          isAr ? 'ar-AE' : 'en-NG',
                          { year: 'numeric', month: 'short', day: 'numeric' }
                        )}
                      </time>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <div className="text-3xl mb-3">✍️</div>
                <p className="font-semibold text-gray-700 mb-1">{t('articlesComingSoon')}</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">{t('articlesComingSoonSub')}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </>
  )
}
