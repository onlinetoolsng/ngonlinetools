// 📁 app/api/blog-search/route.ts
// JSON behind the filtered / paginated views of the (static) /blog page.
// Responses are cached by Vercel's CDN for one day (free-text searches for one hour), and the
// underlying Supabase queries are cached for a day with the 'blog' tag, so repeat visitors and
// bots don't cost a function run each time.

import { NextRequest, NextResponse } from 'next/server'
import {
  getCachedBlogSearch,
  getCachedBlogCategoryCounts,
  searchPublishedArticles,
  type BlogSort,
} from '@/lib/supabase/queries'
import { routing } from '@/lib/i18n/routing'
import { BLOG_PER_PAGE } from '@/components/blog/blog-utils'

export const dynamic = 'force-dynamic'

const SORT_VALUES: BlogSort[] = ['newest', 'oldest', 'quick-read']
const DAY = 86400

function cacheHeader(seconds: number) {
  return { 'Cache-Control': `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=3600` }
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams

  const localeParam = sp.get('locale') ?? routing.defaultLocale
  const locale = routing.locales.includes(localeParam as never) ? localeParam : routing.defaultLocale
  const page = Math.min(100, Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1))
  const sortParam = sp.get('sort') as BlogSort | null
  const sort: BlogSort = sortParam && SORT_VALUES.includes(sortParam) ? sortParam : 'newest'
  const category = sp.get('category') || undefined
  const q = (sp.get('q') ?? '').trim().slice(0, 80) || undefined

  try {
    const categoryCounts = await getCachedBlogCategoryCounts(locale)
    const categoryKnown = !category || categoryCounts.some(c => c.slug === category)

    if (!categoryKnown) {
      return NextResponse.json(
        { articles: [], total: 0, page, perPage: BLOG_PER_PAGE, totalPages: 0 },
        { headers: cacheHeader(DAY) }
      )
    }

    const params = { locale, page, perPage: BLOG_PER_PAGE, q, category, sort }
    const result = q ? await searchPublishedArticles(params) : await getCachedBlogSearch(params)

    return NextResponse.json(result, { headers: cacheHeader(q ? 3600 : DAY) })
  } catch (err) {
    console.error('blog-search error:', err)
    return NextResponse.json({ error: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
