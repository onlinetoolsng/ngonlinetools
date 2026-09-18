// 📁 app/[locale]/blog/page.tsx
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { generateBreadcrumbSchema, generateBlogSchema } from '@/lib/schema/schemas'
import { searchPublishedArticles, getBlogCategoryCounts, type BlogSort } from '@/lib/supabase/queries'
import { generateBlogIndexMetadata } from '@/lib/utils/seo'
import AdUnit from '@/components/ads/AdUnit'
import { AD_SLOTS } from '@/components/ads/slots'
import { BlogControls } from '@/components/blog/BlogControls'
import { BlogPagination } from '@/components/blog/BlogPagination'
import { getCategoryIcon, getCategoryBadgeClass } from '@/lib/registry/categories'
import { localePath, localizedUrl } from '@/lib/i18n/paths'

type Params = { locale: string }
type SearchParams = { q?: string; page?: string; sort?: string; category?: string }

const SORT_VALUES: BlogSort[] = ['newest', 'oldest', 'quick-read']
const PER_PAGE = 24

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  const sp = await searchParams
  setRequestLocale(locale)
  const base = generateBlogIndexMetadata(locale)

  // Filtered / paginated views are variants of the same content, not
  // distinct pages worth indexing — keep the canonical/indexed entry as the
  // plain /blog root (already set in generateBlogIndexMetadata) and mark
  // search/filter/page-N results noindex,follow so they don't compete with
  // it or read to a crawler as thin duplicate pages.
  const hasFilters = !!(sp.q || sp.category || (sp.page && sp.page !== '1'))
  if (!hasFilters) return base

  return { ...base, robots: { index: false, follow: true } }
}

function buildBlogHref(
  locale: string,
  localePathFn: (locale: string, path?: string) => string,
  current: { q?: string; category?: string; sort?: string },
  page: number
) {
  const params = new URLSearchParams()
  if (current.q) params.set('q', current.q)
  if (current.category) params.set('category', current.category)
  if (current.sort && current.sort !== 'newest') params.set('sort', current.sort)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  const base = localePathFn(locale, '/blog')
  return qs ? `${base}?${qs}` : base
}

export default async function BlogIndexPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  const sp = await searchParams
  const isAr = locale === 'ar'
  setRequestLocale(locale)

  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const BASE_URL = 'https://www.toolbase.com.ng'

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const sort: BlogSort = SORT_VALUES.includes(sp.sort as BlogSort) ? (sp.sort as BlogSort) : 'newest'
  const category = sp.category || undefined
  const q = sp.q || undefined
  const isFiltered = !!(q || category)

  const [{ articles, total, totalPages }, categoryCounts] = await Promise.all([
    searchPublishedArticles({ locale, page, perPage: PER_PAGE, q, category, sort }),
    getBlogCategoryCounts(locale),
  ])

  const breadcrumbItems = [
    { label: tNav('home'), href: localePath(locale) },
    { label: tNav('blog'), href: localePath(locale, `/blog`) },
  ]

  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbItems.map(b => ({ name: b.label, url: `${BASE_URL}${b.href}` }))
  )

  const blogSchema = generateBlogSchema({
    url: localizedUrl(locale, `/blog`),
    name: isAr ? 'المدونة' : 'Blog',
    description: isAr
      ? 'أدلة عملية ومقالات حول الرواتب والضرائب وقانون العمل والمال في دول الخليج'
      : 'Practical guides and articles on personal finance, tax, and money in Nigeria',
    locale,
    articles: articles
      .filter(a => a.translation)
      .map(a => ({
        title: a.translation!.title,
        url: localizedUrl(locale, `/blog/${a.slug}`),
        datePublished: a.published_at,
        description: a.translation!.excerpt ?? undefined,
      })),
  })

  const hasAnyPublishedArticles = total > 0 || isFiltered
  const buildHref = (targetPage: number) => buildBlogHref(locale, localePath, { q, category, sort }, targetPage)

  return (
    <>
      <SchemaOrg schema={[breadcrumbSchema, blogSchema]} />
      <Header locale={locale} activePath={localePath(locale, `/blog`)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={localePath(locale)} />
        </div>

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            {isAr ? 'المدونة' : 'Blog'}
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            {isAr
              ? 'أدلة عملية ومقالات حول الرواتب والضرائب وقانون العمل والمال في دول الخليج'
              : 'Practical guides and articles on personal finance, tax, and money in Nigeria'}
          </p>
        </header>

        {total === 0 && !isFiltered ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✍️</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              {isAr ? 'المقالات قادمة قريباً' : 'Articles coming soon'}
            </h2>
            <p className="text-gray-400 mb-8">
              {isAr
                ? 'في انتظار ذلك، جرّب أدواتنا المجانية'
                : 'In the meantime, try our free tools'}
            </p>
            <Link
              href={localePath(locale, `/tools`)}
              className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {isAr ? 'تصفح الأدوات ←' : 'Browse Tools →'}
            </Link>
          </div>
        ) : (
          <>
            <Suspense fallback={<div className="mb-8 h-11" />}>
              <BlogControls isAr={isAr} categories={categoryCounts} />
            </Suspense>

            <p className="text-xs text-gray-400 mb-5">
              {isAr
                ? `عرض ${articles.length} من ${total} مقالاً`
                : `Showing ${articles.length} of ${total} article${total === 1 ? '' : 's'}`}
              {totalPages > 1 && (isAr ? ` · صفحة ${page} من ${totalPages}` : ` · page ${page} of ${totalPages}`)}
            </p>

            {/* Ad: above blog grid. TEMPORARILY DISABLED ahead of AdSense
                reapplication. Flip `false` below to re-enable. */}
            {false && (
              <div className="mb-6">
                <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
                <AdUnit slot={AD_SLOTS.DISPLAY_TOP} />
              </div>
            )}

            {articles.length === 0 ? (
              <div className="text-center py-16 border border-gray-100 rounded-2xl">
                <div className="text-4xl mb-3">🔍</div>
                <h2 className="text-lg font-bold text-gray-700 mb-2">
                  {isAr ? 'لا توجد مقالات مطابقة' : 'No articles match your search'}
                </h2>
                <p className="text-gray-400 mb-6 text-sm">
                  {isAr
                    ? 'جرّب كلمات مختلفة أو امسح الفلاتر'
                    : 'Try different keywords, or clear your filters'}
                </p>
                <Link
                  href={localePath(locale, `/blog`)}
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
                >
                  {isAr ? '✕ مسح الفلاتر' : '✕ Clear filters'}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map(article => {
                  const t = article.translation
                  if (!t) return null
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
                        <span className="text-xs text-gray-400 ml-auto">
                          {t.reading_time_minutes} {isAr ? 'د قراءة' : 'min read'}
                        </span>
                      </div>

                      <h2 className="font-bold text-gray-900 leading-snug mb-2 flex-1">
                        <Link
                          href={localePath(locale, `/blog/${article.slug}`)}
                          className="hover:text-indigo-700 transition-colors"
                        >
                          {t.title}
                        </Link>
                      </h2>

                      {t.excerpt && (
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">
                          {t.excerpt}
                        </p>
                      )}

                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
                        <time dateTime={article.published_at} className="text-xs text-gray-400">
                          {new Date(article.published_at).toLocaleDateString(
                            isAr ? 'ar-AE' : 'en-AE',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </time>
                        {article.category_slug && (
                          <Link
                            href={localePath(locale, `/tools/${article.category_slug}`)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 transition-colors flex-shrink-0"
                          >
                            🔧 {isAr ? 'استكشف الأدوات ←' : 'Explore tools →'}
                          </Link>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            <BlogPagination page={page} totalPages={totalPages} buildHref={buildHref} isAr={isAr} />
          </>
        )}

        {/* Ad: below blog grid. TEMPORARILY DISABLED, see note above. */}
        {false && articles.length > 0 && (
          <div className="my-8">
            <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
            <AdUnit slot={AD_SLOTS.DISPLAY_BOTTOM} />
          </div>
        )}

        {hasAnyPublishedArticles && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              {isAr ? 'تصفح حسب الفئة' : 'Browse by Category'}
            </p>
            <div className="flex flex-wrap gap-2">
              {categoryCounts.map(({ slug }) => (
                <Link
                  key={slug}
                  href={buildBlogHref(locale, localePath, { category: category === slug ? undefined : slug, sort }, 1)}
                  className={`inline-flex items-center gap-1.5 border text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                    category === slug
                      ? 'bg-indigo-700 border-indigo-700 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-800'
                  }`}
                >
                  <span>{getCategoryIcon(slug)}</span>
                  <span className="capitalize">{slug.replace(/-/g, ' ')}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer locale={locale} />
    </>
  )
}
