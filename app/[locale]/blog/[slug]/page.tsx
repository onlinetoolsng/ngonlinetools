


// 📁 app/[locale]/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import BlogMarkdownRenderer from '@/components/BlogMarkdownRenderer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
} from '@/lib/schema/schemas'
import { getArticleBySlug, getPublishedArticles } from '@/lib/supabase/queries'
import { getToolBySlug } from '@/lib/registry/tools'
import { getCategoryIcon, getCategoryBadgeClass } from '@/lib/registry/categories'
import AdUnit from '@/components/ads/AdUnit'
import { AD_SLOTS } from '@/components/ads/slots'
import { getToolIcon } from '@/lib/utils/toolIcons'

type Params = { locale: string; slug: string }

// ISR: rebuild blog pages every hour
export const revalidate = 3600

const BASE_URL = 'https://toolbase.com.ng'

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params
  let article
  try {
    article = await getArticleBySlug(slug, locale)
  } catch {
    return {}
  }
  if (!article?.translation) return {}

  const t = article.translation
  const url = `${BASE_URL}/${locale}/blog/${slug}`

  return {
    title: `${t.title} | ToolBase`,
    description: t.meta_description ?? t.excerpt ?? '',
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/blog/${slug}`,
        ar: `${BASE_URL}/ar/blog/${slug}`,
        'x-default': `${BASE_URL}/en/blog/${slug}`,
      },
    },
    openGraph: {
      title: t.title,
      description: t.meta_description ?? t.excerpt ?? '',
      url,
      siteName: 'ToolBase',
      locale: 'en_NG',
      type: 'article',
      publishedTime: article.published_at,
      images: t.og_image_url
        ? [{ url: t.og_image_url, width: 1200, height: 630, alt: t.title }]
        : [{ url: `${BASE_URL}/og/blog-default.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.title,
      description: t.meta_description ?? t.excerpt ?? '',
    },
    robots: { index: true, follow: true },
  }
}

// ─── Static params for ISR ────────────────────────────────────────────────────
export async function generateStaticParams() {
  // Returns empty — pages generated on demand and cached via ISR
  return []
}

// ─── Category display helpers ─────────────────────────────────────────────────
// (icon/badge styling now comes from lib/registry/categories.ts — see comment there)

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params
  const isAr = locale === 'ar'

  let article
  try {
    article = await getArticleBySlug(slug, locale)
  } catch {
    notFound()
  }
  if (!article?.translation) notFound()

  const t = article.translation
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  const articleUrl = `${BASE_URL}/${locale}/blog/${slug}`
  const categoryIcon = getCategoryIcon(article.category_slug)
  const badgeColor = getCategoryBadgeClass(article.category_slug)

  // Related tools from registry
  const relatedTools = (article.related_tool_slugs ?? [])
    .map(s => getToolBySlug(s))
    .filter(Boolean) as NonNullable<ReturnType<typeof getToolBySlug>>[]

  // More articles (sidebar)
  let moreArticles: Awaited<ReturnType<typeof getPublishedArticles>> = []
  try {
    moreArticles = (await getPublishedArticles(locale, 5)).filter(
      a => a.slug !== slug
    ).slice(0, 4)
  } catch (err) {
    console.error('getPublishedArticles (sidebar) error:', err)
  }

  // Breadcrumb
  const breadcrumbItems = [
    { label: tNav('home'), href: `/${locale}` },
    { label: tNav('blog'), href: `/${locale}/blog` },
    { label: t.title,      href: `/${locale}/blog/${slug}` },
  ]

  // Schemas
  // Estimate word count from HTML content
  const wordCount = t.content
    ? t.content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    : undefined

  const articleSchema = generateArticleSchema({
    title: t.title,
    description: t.meta_description ?? t.excerpt ?? '',
    url: articleUrl,
    datePublished: article.published_at,
    dateModified: article.published_at,
    imageUrl: t.og_image_url ?? `${BASE_URL}/og/blog-default.png`,
    wordCount,
    authorName: 'ToolBase Editorial Team',
  })

  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbItems.map(b => ({ name: b.label, url: `${BASE_URL}${b.href}` }))
  )

  // Parse content — stored as HTML in Supabase
  // Wrap in prose for Tailwind typography styling
  const hasContent = t.content && t.content.trim().length > 0

  return (
    <>
      <SchemaOrg schema={[articleSchema, breadcrumbSchema]} />
      <Header locale={locale} activePath={`/${locale}/blog`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={`/${locale}/blog`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 mt-2">

          {/* ─── MAIN ARTICLE ─────────────────────────────────────────────── */}
          <main className="min-w-0">

            {/* Category badge */}
            <div className="mb-4">
              <Link
                href={article.category_slug ? `/${locale}/tools/${article.category_slug}` : `/${locale}/tools`}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 ${badgeColor}`}
              >
                <span>{categoryIcon}</span>
                <span className="capitalize">{(article.category_slug ?? '').replace(/-/g, ' ') || 'Uncategorized'}</span>
              </Link>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-4">
              {t.title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-100">
              <time dateTime={article.published_at}>
                {new Date(article.published_at).toLocaleDateString(
                  isAr ? 'ar-AE' : 'en-AE',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </time>
              <span>·</span>
              <span>{t.reading_time_minutes} {isAr ? 'دقائق قراءة' : 'min read'}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span>🌐</span>
                <span>ToolBase</span>
              </span>
            </div>

            {/* Excerpt / lead */}
            {t.excerpt && (
              <p className="text-xl text-gray-600 leading-relaxed mb-8 font-medium">
                {t.excerpt}
              </p>
            )}

            {/* Ad: top of article */}
            <div className="mb-8">
              <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
              <AdUnit slot={AD_SLOTS.DISPLAY_TOP} />
            </div>

{/* Article body */}
{hasContent ? (
  <BlogMarkdownRenderer content={t.content} locale={locale} />
) : (
  /* Placeholder when content column is empty */
  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
    <p className="text-amber-700 font-medium">
      {isAr ? 'المحتوى الكامل قادم قريباً.' : 'Full article content coming soon.'}
    </p>
    <p className="text-amber-600 text-sm mt-1">
      {isAr
        ? 'في انتظار ذلك، استخدم الأدوات ذات الصلة أدناه.'
        : 'In the meantime, use the related tools below.'}
    </p>
  </div>
)}

            {/* Ad: mid-article */}
            <div className="my-8">
              <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
              <AdUnit
                slot={AD_SLOTS.IN_ARTICLE_1}
                format="fluid"
                layout="in-article"
              />
            </div>

            {/* Related tools — inline CTA inside article */}
            {relatedTools.length > 0 && (
              <div className="mt-10 bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                <h3 className="font-bold text-indigo-900 mb-4">
                  {isAr ? '🔧 الأدوات ذات الصلة' : '🔧 Related Tools'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedTools.map(tool => (
                    <Link
                      key={tool.slug}
                      href={`/${locale}/tools/${tool.category}/${tool.slug}`}
                      className="flex items-center gap-3 bg-white rounded-xl p-4 border border-indigo-100 hover:border-indigo-300 hover:shadow-sm transition-all group"
                    >
                      <span className="text-2xl flex-shrink-0">
                        {getToolIcon(tool)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-900 group-hover:text-indigo-700 transition-colors">
                          {tool.slug
                            .split('-')
                            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ')}
                        </div>
                        <div className="text-xs text-gray-400 capitalize">{tool.schema}</div>
                      </div>
                      <span className="ml-auto text-indigo-500 text-lg">
                        {isAr ? '←' : '→'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Ad: bottom of article */}
            <div className="my-8">
              <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
              <AdUnit slot={AD_SLOTS.DISPLAY_BOTTOM} />
            </div>

            {/* Share strip */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-gray-400 font-medium">
                {isAr ? 'شارك هذا المقال' : 'Share this article'}
              </p>
              <div className="flex items-center gap-2">
                {[
                  {
                    label: 'X / Twitter',
                    href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(t.title)}&url=${encodeURIComponent(articleUrl)}`,
                    icon: '𝕏',
                  },
                  {
                    label: 'WhatsApp',
                    href: `https://wa.me/?text=${encodeURIComponent(`${t.title} ${articleUrl}`)}`,
                    icon: '💬',
                  },
                  {
                    label: 'LinkedIn',
                    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`,
                    icon: 'in',
                  },
                ].map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={s.label}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-700 transition-all text-sm font-bold"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </main>

          {/* ─── SIDEBAR ──────────────────────────────────────────────────── */}
          <aside className="space-y-6">

            {/* Related tools card */}
            {relatedTools.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 sticky top-20">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                  {tCommon('relatedTools')}
                </h3>
                <div className="space-y-2">
                  {relatedTools.map(tool => (
                    <Link
                      key={tool.slug}
                      href={`/${locale}/tools/${tool.category}/${tool.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-base flex-shrink-0">
                        {getToolIcon(tool)}
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors leading-snug">
                        {tool.slug
                          .split('-')
                          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ')}
                      </span>
                      <span className="ml-auto text-gray-300 group-hover:text-indigo-500 text-sm">
                        {isAr ? '←' : '→'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* More articles */}
            {moreArticles.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                  {isAr ? 'مقالات أخرى' : 'More Articles'}
                </h3>
                <div className="space-y-4">
                  {moreArticles.map(a => {
                    if (!a.translation) return null
                    return (
                      <Link
                        key={a.slug}
                        href={`/${locale}/blog/${a.slug}`}
                        className="block group"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0 mt-0.5">
                            {getCategoryIcon(a.category_slug)}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2">
                              {a.translation.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {a.translation.reading_time_minutes}{' '}
                              {isAr ? 'د قراءة' : 'min read'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <Link
                  href={`/${locale}/blog`}
                  className="block mt-4 text-xs font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
                >
                  {isAr ? 'جميع المقالات ←' : 'All articles →'}
                </Link>
              </div>
            )}

            {/* Sidebar ad */}
            <div>
              <p className="text-xs text-gray-400 text-center mb-1">Advertisement</p>
              <AdUnit slot={AD_SLOTS.BANNER} format="autorelaxed" />
            </div>
          </aside>
        </div>
      </div>

      <Footer locale={locale} />
    </>
  )
}