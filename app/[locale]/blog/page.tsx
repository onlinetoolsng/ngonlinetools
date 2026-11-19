// 📁 app/[locale]/blog/page.tsx
// STATIC page, regenerated at most once a day (and instantly when an article is published:
// the publish hooks call revalidatePath('/en/blog') + revalidateTag('blog')).
// It deliberately does NOT read searchParams. Filters / search / page numbers are handled in
// the browser by <BlogIndexView>, which fetches /api/blog-search (CDN-cached). That way
// /blog?anything is served from the cache instead of running a function per URL.
import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { generateBreadcrumbSchema, generateBlogSchema } from '@/lib/schema/schemas'
import { getCachedBlogSearch, getCachedBlogCategoryCounts } from '@/lib/supabase/queries'
import { generateBlogIndexMetadata } from '@/lib/utils/seo'
import AdUnit from '@/components/ads/AdUnit'
import { AD_SLOTS } from '@/components/ads/slots'
import { BlogControls } from '@/components/blog/BlogControls'
import { BlogPagination } from '@/components/blog/BlogPagination'
import { BlogGrid } from '@/components/blog/BlogGrid'
import { BlogCategoryChips } from '@/components/blog/BlogCategoryChips'
import { BlogIndexView } from '@/components/blog/BlogIndexView'
import { BLOG_PER_PAGE, buildBlogHref } from '@/components/blog/blog-utils'
import { localePath, localizedUrl } from '@/lib/i18n/paths'

type Params = { locale: string }

export const revalidate = 86400 // one day

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  setRequestLocale(locale)
  // Filtered / paginated URLs are marked noindex via an X-Robots-Tag header (see next.config.mjs);
  // the canonical here is always the plain /blog root.
  return generateBlogIndexMetadata(locale)
}

export default async function BlogIndexPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  setRequestLocale(locale)

  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const BASE_URL = 'https://www.toolbase.com.ng'

  const categoryCounts = await getCachedBlogCategoryCounts(locale)
  const { articles, total, totalPages } = await getCachedBlogSearch({
    locale,
    page: 1,
    perPage: BLOG_PER_PAGE,
    sort: 'newest',
  })

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
      ? 'أدلة عملية ومقالات حول التمويل الشخصي والضرائب والمال في نيجيريا'
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

  // Default view: page 1, newest first, no filters. Baked into the static HTML.
  const defaultView = (
    <>
      <Suspense fallback={<div className="mb-8 h-11" />}>
        <BlogControls isAr={isAr} categories={categoryCounts} />
      </Suspense>

      <p className="text-xs text-gray-400 mb-5">
        {isAr
          ? `عرض ${articles.length} من ${total} مقالاً`
          : `Showing ${articles.length} of ${total} article${total === 1 ? '' : 's'}`}
        {totalPages > 1 && (isAr ? ` · صفحة 1 من ${totalPages}` : ` · page 1 of ${totalPages}`)}
      </p>

      {/* Ad: above blog grid. TEMPORARILY DISABLED ahead of AdSense
          reapplication. Flip `false` below to re-enable. */}
      {false && (
        <div className="mb-6">
          <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
          <AdUnit slot={AD_SLOTS.DISPLAY_TOP} />
        </div>
      )}

      <BlogGrid articles={articles} isAr={isAr} locale={locale} />

      <BlogPagination
        page={1}
        totalPages={totalPages}
        buildHref={p => buildBlogHref(locale, {}, p)}
        isAr={isAr}
      />

      <BlogCategoryChips locale={locale} isAr={isAr} categories={categoryCounts} />
    </>
  )

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
              ? 'أدلة عملية ومقالات حول التمويل الشخصي والضرائب والمال في نيجيريا'
              : 'Practical guides and articles on personal finance, tax, and money in Nigeria'}
          </p>
        </header>

        {total === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✍️</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              {isAr ? 'المقالات قادمة قريباً' : 'Articles coming soon'}
            </h2>
            <p className="text-gray-400 mb-8">
              {isAr ? 'في انتظار ذلك، جرّب أدواتنا المجانية' : 'In the meantime, try our free tools'}
            </p>
            <Link
              href={localePath(locale, `/tools`)}
              className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {isAr ? 'تصفح الأدوات ←' : 'Browse Tools →'}
            </Link>
          </div>
        ) : (
          // useSearchParams() inside <BlogIndexView> makes this boundary client-rendered, so the
          // static HTML contains the fallback: the full default view (cards, links, pagination).
          <Suspense fallback={defaultView}>
            <BlogIndexView
              locale={locale}
              isAr={isAr}
              categories={categoryCounts}
              defaultView={defaultView}
            />
          </Suspense>
        )}

        {/* Ad: below blog grid. TEMPORARILY DISABLED, see note above. */}
        {false && articles.length > 0 && (
          <div className="my-8">
            <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
            <AdUnit slot={AD_SLOTS.DISPLAY_BOTTOM} />
          </div>
        )}
      </div>

      <Footer locale={locale} />
    </>
  )
}
