// 📁 app/[locale]/blog/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { generateBreadcrumbSchema, generateBlogSchema } from '@/lib/schema/schemas'
import { getPublishedArticles } from '@/lib/supabase/queries'
import { generateBlogIndexMetadata } from '@/lib/utils/seo'
import AdUnit from '@/components/ads/AdUnit'
import { AD_SLOTS } from '@/components/ads/slots'

type Params = { locale: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return generateBlogIndexMetadata(locale)
}

import { getCategoryIcon, getCategoryBadgeClass, CATEGORIES } from '@/lib/registry/categories'
import { localePath, localizedUrl } from '@/lib/i18n/paths'

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { locale } = await params
  const isAr = locale === 'ar'
  setRequestLocale(locale)

  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const BASE_URL = 'https://toolbase.com.ng'

  const articles = await getPublishedArticles(locale, 24)

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

  return (
    <>
      <SchemaOrg schema={[breadcrumbSchema, blogSchema]} />
      <Header locale={locale} activePath={localePath(locale, `/blog`)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={localePath(locale)} />
        </div>

        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            {isAr ? 'المدونة' : 'Blog'}
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            {isAr
              ? 'أدلة عملية ومقالات حول الرواتب والضرائب وقانون العمل والمال في دول الخليج'
              : 'Practical guides and articles on personal finance, tax, and money in Nigeria'}
          </p>
        </header>

        {articles.length === 0 ? (
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
            {/* Ad: above blog grid */}
            <div className="mb-6">
              <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
              <AdUnit slot={AD_SLOTS.DISPLAY_TOP} />
            </div>

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
          </>
        )}

        {/* Ad: below blog grid */}
        {articles.length > 0 && (
          <div className="my-8">
            <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
            <AdUnit slot={AD_SLOTS.DISPLAY_BOTTOM} />
          </div>
        )}

        {articles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              {isAr ? 'تصفح حسب الفئة' : 'Browse by Category'}
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ slug, icon }) => (
                <Link
                  key={slug}
                  href={localePath(locale, `/tools/${slug}`)}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-800 transition-all"
                >
                  <span>{icon}</span>
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