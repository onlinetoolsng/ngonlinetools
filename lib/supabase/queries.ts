import { createSupabasePublicClient } from './client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ArticleRow = {
  slug: string
  category_slug: string
  related_tool_slugs: string[]
  countries: string[]
  published: boolean
  published_at: string
  created_at: string
}

export type ArticleTranslationRow = {
  article_slug: string
  locale: string
  title: string
  excerpt: string | null
  content: string
  meta_description: string | null
  og_image_url: string | null
  reading_time_minutes: number
  is_translated: boolean
  created_at: string
}

export type ArticleWithTranslation = ArticleRow & {
  translation: ArticleTranslationRow | null
}

export type ToolTranslation = {
  tool_slug: string
  locale: string
  title: string
  description: string | null
  meta_description: string | null
  article_title: string | null
  /** Markdown (preferred going forward). Legacy rows may be plain text with \n\n paragraphs or raw HTML — the renderer handles all three. */
  article_body: string | null
  /** Supplementary markdown (worked example, table, trust context) rendered above article_body. Separate column — never overwrites the original. */
  content_addition: string | null
  faq: { q: string; a: string }[]
  is_translated: boolean
  created_at: string
  /** Featured/explainer image for the article. */
  image_url: string | null
  image_alt: string | null
  /** Date the content was last verified against current law/data. */
  last_updated: string | null
  /** e.g. "Reviewed by Tolu Adebayo, Tax Analyst in Lagos". */
  reviewer_name: string | null
  /** Primary authoritative source (FIRS, CAC, SARS, PenCom, etc). */
  source_url: string | null
}

// ─── Article queries ──────────────────────────────────────────────────────────

export async function getPublishedArticles(
  locale: string,
  limit = 20
): Promise<ArticleWithTranslation[]> {
  const supabase = createSupabasePublicClient()

  const { data, error } = await supabase
    .from('articles')
    .select(`*, article_translations!inner(*)`)
    .eq('published', true)
    .eq('article_translations.locale', locale)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getPublishedArticles error:', error.message)
    return []
  }

  return (data ?? []).map((row: any) => ({
    ...row,
    translation: row.article_translations?.[0] ?? null,
  }))
}

// ─── Blog index: search, filter, sort, paginate ────────────────────────────────
// Powers the /blog index page. Unlike getPublishedArticles above (a flat,
// unpaginated top-N fetch used elsewhere), this returns a total count and a
// page slice so the blog index can expose all published articles instead of
// silently capping the list at N — a thin/undiscoverable blog index is bad
// for readers and was flagged as a plausible AdSense "low value content" cause.

export type BlogSort = 'newest' | 'oldest' | 'quick-read'

export type BlogSearchParams = {
  locale: string
  page?: number
  perPage?: number
  q?: string
  category?: string
  sort?: BlogSort
}

export type BlogSearchResult = {
  articles: ArticleWithTranslation[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export async function searchPublishedArticles({
  locale,
  page = 1,
  perPage = 24,
  q,
  category,
  sort = 'newest',
}: BlogSearchParams): Promise<BlogSearchResult> {
  const supabase = createSupabasePublicClient()
  const safePage = Math.max(1, Math.floor(page) || 1)

  let query = supabase
    .from('articles')
    .select(`*, article_translations!inner(*)`, { count: 'exact' })
    .eq('published', true)
    .eq('article_translations.locale', locale)

  if (category) {
    query = query.eq('category_slug', category)
  }

  const term = q?.trim()
  if (term) {
    // Strip characters that are meaningful to the PostgREST filter grammar
    // (comma separates or() clauses, parens/percent are part of the ilike
    // pattern syntax) so a stray character in a search box can't break the
    // query or escape the intended column scope.
    const safeTerm = term.replace(/[%,()]/g, ' ').trim()
    if (safeTerm) {
      query = query.or(
        `title.ilike.%${safeTerm}%,excerpt.ilike.%${safeTerm}%`,
        { foreignTable: 'article_translations' }
      )
    }
  }

  if (sort === 'quick-read') {
    query = query.order('reading_time_minutes', {
      ascending: true,
      foreignTable: 'article_translations',
    })
  } else {
    query = query.order('published_at', { ascending: sort === 'oldest' })
  }

  const from = (safePage - 1) * perPage
  const to = from + perPage - 1
  const { data, error, count } = await query.range(from, to)

  if (error) {
    console.error('searchPublishedArticles error:', error.message)
    return { articles: [], total: 0, page: safePage, perPage, totalPages: 0 }
  }

  const articles = (data ?? []).map((row: any) => ({
    ...row,
    translation: row.article_translations?.[0] ?? null,
  }))

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return { articles, total, page: safePage, perPage, totalPages }
}

/** Category slugs + counts among published articles, for the blog filter dropdown.
 *  Derived from live data rather than the CATEGORIES registry, since the two
 *  have drifted (e.g. DB has 'faith-giving'/'everyday-tools'/'currency', which
 *  aren't in the static registry) — the filter must offer categories that
 *  actually have articles. */
export async function getBlogCategoryCounts(
  locale: string
): Promise<{ slug: string; count: number }[]> {
  const supabase = createSupabasePublicClient()

  const { data, error } = await supabase
    .from('articles')
    .select('category_slug, article_translations!inner(locale)')
    .eq('published', true)
    .eq('article_translations.locale', locale)

  if (error) {
    console.error('getBlogCategoryCounts error:', error.message)
    return []
  }

  const counts = new Map<string, number>()
  for (const row of (data ?? []) as any[]) {
    const slug = row.category_slug as string
    counts.set(slug, (counts.get(slug) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count)
}

export async function getArticlesByCategory(
  categorySlug: string,
  locale: string,
  limit = 10
): Promise<ArticleWithTranslation[]> {
  const supabase = createSupabasePublicClient()

  const { data, error } = await supabase
    .from('articles')
    .select(`*, article_translations!inner(*)`)
    .eq('published', true)
    .eq('category_slug', categorySlug)
    .eq('article_translations.locale', locale)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getArticlesByCategory error:', error.message)
    return []
  }

  return (data ?? []).map((row: any) => ({
    ...row,
    translation: row.article_translations?.[0] ?? null,
  }))
}

export async function getArticleBySlug(
  slug: string,
  locale: string
): Promise<ArticleWithTranslation | null> {
  const supabase = createSupabasePublicClient()

  const { data, error } = await supabase
    .from('articles')
    .select(`*, article_translations!inner(*)`)
    .eq('slug', slug)
    .eq('published', true)
    .eq('article_translations.locale', locale)
    .single()

  if (error) {
    if (locale !== 'en') return getArticleBySlug(slug, 'en')
    console.error('getArticleBySlug error:', error.message)
    return null
  }

  return {
    ...data,
    translation: (data as any).article_translations?.[0] ?? null,
  }
}

export async function getArticlesForTool(
  toolSlug: string,
  locale: string,
  limit = 3
): Promise<ArticleWithTranslation[]> {
  const supabase = createSupabasePublicClient()

  const { data, error } = await supabase
    .from('articles')
    .select(`*, article_translations!inner(*)`)
    .eq('published', true)
    .contains('related_tool_slugs', [toolSlug])
    .eq('article_translations.locale', locale)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getArticlesForTool error:', error.message)
    return []
  }

  return (data ?? []).map((row: any) => ({
    ...row,
    translation: row.article_translations?.[0] ?? null,
  }))
}

export async function getAllPublishedArticleSlugs(): Promise<
  { slug: string; published_at: string }[]
> {
  const supabase = createSupabasePublicClient()

  const { data, error } = await supabase
    .from('articles')
    .select('slug, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })

  if (error) {
    console.error('getAllPublishedArticleSlugs error:', error.message)
    return []
  }

  return data ?? []
}

// ─── Tool translation queries ─────────────────────────────────────────────────

export async function getToolTranslation(
  slug: string,
  locale: string
): Promise<ToolTranslation | null> {
  const supabase = createSupabasePublicClient()

  const { data, error } = await supabase
    .from('tool_translations')
    .select('*')
    .eq('tool_slug', slug)
    .eq('locale', locale)
    .single()

  if (error) {
    // Arabic not translated yet — fall back to English
    if (locale !== 'en') return getToolTranslation(slug, 'en')
    console.error('getToolTranslation error:', error.message)
    return null
  }

  return data as ToolTranslation
}