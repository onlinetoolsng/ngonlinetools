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
  /** Plain text (paragraphs separated by \n\n) or an HTML string from a rich-text editor. */
  article_body: string | null
  faq: { q: string; a: string }[]
  is_translated: boolean
  created_at: string
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