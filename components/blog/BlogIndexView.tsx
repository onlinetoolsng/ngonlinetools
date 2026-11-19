'use client'

import { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import type { BlogSearchResult } from '@/lib/supabase/queries'
import { BlogControls } from './BlogControls'
import { BlogGrid } from './BlogGrid'
import { BlogPagination } from './BlogPagination'
import { BlogCategoryChips } from './BlogCategoryChips'
import { buildBlogHref } from './blog-utils'

type Props = {
  locale: string
  isAr: boolean
  categories: { slug: string; count: number }[]
  /** Server-rendered default view (page 1, newest, no filters). Part of the static HTML. */
  defaultView: ReactNode
}

// /blog itself is a static page (cached one day). The default view above is baked into that
// HTML. When the URL carries filters, search text or a page number, the matching results are
// fetched from /api/blog-search (also CDN-cached) instead of rendering a function per URL.
export function BlogIndexView({ locale, isAr, categories, defaultView }: Props) {
  const sp = useSearchParams()
  const q = sp.get('q') ?? ''
  const category = sp.get('category') ?? ''
  const sort = sp.get('sort') ?? 'newest'
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1)
  const isDefault = !q && !category && sort === 'newest' && page === 1
  const key = sp.toString()

  const [loaded, setLoaded] = useState<{ key: string; data: BlogSearchResult } | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)

  useEffect(() => {
    if (isDefault) return
    const ctrl = new AbortController()
    const params = new URLSearchParams({ locale })
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    if (sort !== 'newest') params.set('sort', sort)
    if (page > 1) params.set('page', String(page))
    fetch(`/api/blog-search?${params.toString()}`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: BlogSearchResult) => setLoaded({ key, data }))
      .catch(err => {
        if (err?.name !== 'AbortError') setFailedKey(key)
      })
    return () => ctrl.abort()
  }, [isDefault, key, locale, q, category, sort, page])

  if (isDefault) return <>{defaultView}</>

  const data = loaded?.key === key ? loaded.data : null
  const failed = failedKey === key

  return (
    <>
      <Suspense fallback={<div className="mb-8 h-11" />}>
        <BlogControls isAr={isAr} categories={categories} />
      </Suspense>

      {failed ? (
        <p className="text-sm text-gray-500 py-10 text-center">
          {isAr ? 'تعذّر تحميل المقالات. حاول مرة أخرى.' : 'Could not load articles. Please try again.'}
        </p>
      ) : !data ? (
        <p className="text-sm text-gray-400 py-10 text-center" aria-live="polite">
          {isAr ? 'جارٍ التحميل…' : 'Loading…'}
        </p>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-5">
            {isAr
              ? `عرض ${data.articles.length} من ${data.total} مقالاً`
              : `Showing ${data.articles.length} of ${data.total} article${data.total === 1 ? '' : 's'}`}
            {data.totalPages > 1 &&
              (isAr ? ` · صفحة ${page} من ${data.totalPages}` : ` · page ${page} of ${data.totalPages}`)}
          </p>
          <BlogGrid articles={data.articles} isAr={isAr} locale={locale} />
          <BlogPagination
            page={page}
            totalPages={data.totalPages}
            buildHref={p => buildBlogHref(locale, { q, category, sort }, p)}
            isAr={isAr}
          />
        </>
      )}

      <BlogCategoryChips
        locale={locale}
        isAr={isAr}
        categories={categories}
        activeCategory={category || undefined}
        sort={sort}
      />
    </>
  )
}
