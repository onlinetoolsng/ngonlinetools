// 📁 components/documents/DocumentsBrowser.tsx
//
// Interactive browser for the /documents index: free-text search,
// a country filter, and a sort control (category grouping by default,
// or a flat list sorted by name / latest updated / country).
// Takes a pre-computed, plain-object list of items from the server
// component (which does the docType/country lookups) so this file has
// no Supabase or next/headers dependency and can run in the browser.

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

export type DocBrowserItem = {
  id: string
  href: string
  label: string
  category: string
  countryCode: string
  countryFlag: string
  countryName: string
  updatedAt: string
}

type SortOption = 'category' | 'name' | 'latest' | 'country'

const SORT_LABELS: Record<SortOption, string> = {
  category: 'Category',
  name: 'Name (A–Z)',
  latest: 'Latest updated',
  country: 'Country',
}

export function DocumentsBrowser({ items }: { items: DocBrowserItem[] }) {
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('all')
  const [sort, setSort] = useState<SortOption>('category')

  const countryOptions = useMemo(() => {
    const map = new Map<string, { code: string; name: string; flag: string }>()
    for (const item of items) {
      if (!map.has(item.countryCode)) {
        map.set(item.countryCode, { code: item.countryCode, name: item.countryName, flag: item.countryFlag })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter(item => {
      if (country !== 'all' && item.countryCode !== country) return false
      if (q && !item.label.toLowerCase().includes(q) && !item.countryName.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [items, query, country])

  const card = (item: DocBrowserItem) => (
    <Link
      key={item.id}
      href={item.href}
      className="group bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-md rounded-2xl p-4 transition-all"
    >
      <p className="font-bold text-gray-900 text-sm group-hover:text-indigo-800 transition-colors">{item.label}</p>
      <p className="text-xs text-gray-500 mt-1">{item.countryFlag} {item.countryName}</p>
    </Link>
  )

  return (
    <div>
      {/* ─── Controls ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
          />
        </div>

        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 sm:w-48"
        >
          <option value="all">All countries</option>
          {countryOptions.map(c => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 sm:w-48"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map(key => (
            <option key={key} value={key}>Sort: {SORT_LABELS[key]}</option>
          ))}
        </select>
      </div>

      {/* ─── Results ───────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <p className="text-sm text-gray-500">No documents match your search.</p>
      )}

      {sort === 'category' ? (
        <div className="space-y-10">
          {Array.from(
            [...filtered]
              .sort((a, b) => a.label.localeCompare(b.label))
              .reduce((groups, item) => {
                if (!groups.has(item.category)) groups.set(item.category, [])
                groups.get(item.category)!.push(item)
                return groups
              }, new Map<string, DocBrowserItem[]>())
              .entries()
          ).map(([category, groupItems]) => (
            <section key={category}>
              <h2 className="text-xs font-bold tracking-widest uppercase text-indigo-700 mb-3">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupItems.map(card)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...filtered]
            .sort((a, b) => {
              if (sort === 'name') return a.label.localeCompare(b.label)
              if (sort === 'latest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              // country
              return a.countryName.localeCompare(b.countryName) || a.label.localeCompare(b.label)
            })
            .map(card)}
        </div>
      )}
    </div>
  )
}
