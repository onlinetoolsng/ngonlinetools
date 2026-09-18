'use client'

import { useCallback, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type CategoryCount = { slug: string; count: number }

type BlogControlsProps = {
  isAr: boolean
  categories: CategoryCount[]
}

const SORT_OPTIONS: { value: string; label: string; labelAr: string }[] = [
  { value: 'newest', label: 'Newest first', labelAr: 'الأحدث أولاً' },
  { value: 'oldest', label: 'Oldest first', labelAr: 'الأقدم أولاً' },
  { value: 'quick-read', label: 'Quickest read', labelAr: 'أقصر وقت قراءة' },
]

export function BlogControls({ isAr, categories }: BlogControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlTerm = searchParams.get('q') ?? ''
  const [term, setTerm] = useState(urlTerm)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep the input in sync if the URL changes from elsewhere (e.g. back/forward
  // navigation, or the "Clear filters" button). Adjusting state during render
  // (rather than in an effect) avoids an extra render pass for this reset.
  const [lastUrlTerm, setLastUrlTerm] = useState(urlTerm)
  if (urlTerm !== lastUrlTerm) {
    setLastUrlTerm(urlTerm)
    setTerm(urlTerm)
  }

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      // Any filter change invalidates the current page number.
      next.delete('page')
      const qs = next.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const handleSearchChange = (value: string) => {
    setTerm(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ q: value.trim() || null })
    }, 400)
  }

  const currentSort = searchParams.get('sort') ?? 'newest'
  const currentCategory = searchParams.get('category') ?? ''
  const hasFilters = !!(searchParams.get('q') || searchParams.get('category') || (searchParams.get('sort') && searchParams.get('sort') !== 'newest'))

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="search"
            value={term}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder={isAr ? 'ابحث في المقالات...' : 'Search articles...'}
            aria-label={isAr ? 'ابحث في المقالات' : 'Search articles'}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
          />
        </div>

        <select
          value={currentCategory}
          onChange={e => updateParams({ category: e.target.value || null })}
          aria-label={isAr ? 'الفئة' : 'Category'}
          className="py-2.5 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
        >
          <option value="">{isAr ? 'كل الفئات' : 'All categories'}</option>
          {categories.map(c => (
            <option key={c.slug} value={c.slug}>
              {c.slug.replace(/-/g, ' ')} ({c.count})
            </option>
          ))}
        </select>

        <select
          value={currentSort}
          onChange={e => updateParams({ sort: e.target.value === 'newest' ? null : e.target.value })}
          aria-label={isAr ? 'الترتيب' : 'Sort'}
          className="py-2.5 px-3 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-colors"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {isAr ? o.labelAr : o.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="mt-3 text-xs font-semibold text-indigo-700 hover:text-indigo-800 transition-colors"
        >
          {isAr ? '✕ مسح الفلاتر' : '✕ Clear filters'}
        </button>
      )}
    </div>
  )
}
