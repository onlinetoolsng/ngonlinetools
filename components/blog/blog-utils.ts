import { localePath } from '@/lib/i18n/paths'

export const BLOG_PER_PAGE = 24

export function buildBlogHref(
  locale: string,
  current: { q?: string; category?: string; sort?: string },
  page: number
) {
  const params = new URLSearchParams()
  if (current.q) params.set('q', current.q)
  if (current.category) params.set('category', current.category)
  if (current.sort && current.sort !== 'newest') params.set('sort', current.sort)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  const base = localePath(locale, '/blog')
  return qs ? `${base}?${qs}` : base
}
