import Link from 'next/link'
import { getCategoryIcon } from '@/lib/registry/categories'
import { buildBlogHref } from './blog-utils'

export function BlogCategoryChips({
  locale,
  isAr,
  categories,
  activeCategory,
  sort,
}: {
  locale: string
  isAr: boolean
  categories: { slug: string; count: number }[]
  activeCategory?: string
  sort?: string
}) {
  return (
    <div className="mt-12 pt-8 border-t border-gray-100">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
        {isAr ? 'تصفح حسب الفئة' : 'Browse by Category'}
      </p>
      <div className="flex flex-wrap gap-2">
        {categories.map(({ slug }) => (
          <Link
            key={slug}
            href={buildBlogHref(locale, { category: activeCategory === slug ? undefined : slug, sort }, 1)}
            className={`inline-flex items-center gap-1.5 border text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
              activeCategory === slug
                ? 'bg-indigo-700 border-indigo-700 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-800'
            }`}
          >
            <span>{getCategoryIcon(slug)}</span>
            <span className="capitalize">{slug.replace(/-/g, ' ')}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
