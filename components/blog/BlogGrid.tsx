import Link from 'next/link'
import type { ArticleWithTranslation } from '@/lib/supabase/queries'
import { getCategoryIcon, getCategoryBadgeClass } from '@/lib/registry/categories'
import { localePath } from '@/lib/i18n/paths'

// Plain presentational component (no hooks): rendered on the server for the static /blog page
// and in the browser for filtered/paginated views.
export function BlogGrid({
  articles,
  isAr,
  locale,
}: {
  articles: ArticleWithTranslation[]
  isAr: boolean
  locale: string
}) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16 border border-gray-100 rounded-2xl">
        <div className="text-4xl mb-3">🔍</div>
        <h2 className="text-lg font-bold text-gray-700 mb-2">
          {isAr ? 'لا توجد مقالات مطابقة' : 'No articles match your search'}
        </h2>
        <p className="text-gray-400 mb-6 text-sm">
          {isAr ? 'جرّب كلمات مختلفة أو امسح الفلاتر' : 'Try different keywords, or clear your filters'}
        </p>
        <Link
          href={localePath(locale, `/blog`)}
          className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          {isAr ? '✕ مسح الفلاتر' : '✕ Clear filters'}
        </Link>
      </div>
    )
  }

  return (
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
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">{t.excerpt}</p>
            )}

            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-3">
              <time dateTime={article.published_at} className="text-xs text-gray-400">
                {new Date(article.published_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
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
  )
}
