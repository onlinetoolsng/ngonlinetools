// 📁 components/tools/CategoryToolGrid.tsx
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Tool } from '@/lib/registry/tools'
import { getToolIcon, COUNTRY_FLAG_MAP } from '@/lib/utils/toolIcons'
import { getToolName } from '@/lib/utils/toolNames'
import { localePath } from '@/lib/i18n/paths'

function countryLabel(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function CategoryToolGrid({ tools, category, locale }: { tools: Tool[]; category: string; locale: string }) {
  const isAr = locale === 'ar'
  const allCountries = useMemo(() => Array.from(new Set(tools.flatMap(t => t.countries))).sort(), [tools])
  const [countryFilter, setCountryFilter] = useState<string | null>(null)

  const visibleTools = countryFilter ? tools.filter(t => t.countries.includes(countryFilter)) : tools

  return (
    <>
      {/* Country filter — only shown when this category actually spans more than one country */}
      {allCountries.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setCountryFilter(null)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              countryFilter === null ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
            }`}
          >
            {isAr ? 'الكل' : 'All countries'}
          </button>
          {allCountries.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCountryFilter(c)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                countryFilter === c ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {COUNTRY_FLAG_MAP[c] ? `${COUNTRY_FLAG_MAP[c]} ` : ''}
              {countryLabel(c)}
            </button>
          ))}
        </div>
      )}

      {/* Tool grid */}
      {visibleTools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleTools.map(tool => (
            <Link
              key={tool.slug}
              href={localePath(locale, `/tools/${category}/${tool.slug}`)}
              className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-3">
                {getToolIcon(tool)}
              </div>
              <h2 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors mb-1">
                {getToolName(tool.slug, locale)}
              </h2>
              <div className="flex flex-wrap gap-1 mt-2">
                {tool.countries.slice(0, 4).map(c => (
                  <span key={c} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {COUNTRY_FLAG_MAP[c] ? `${COUNTRY_FLAG_MAP[c]} ` : ''}
                    {countryLabel(c)}
                  </span>
                ))}
                {tool.countries.length > 4 && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    +{tool.countries.length - 4}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p>{isAr ? 'لا توجد أدوات لهذه الدولة بعد' : 'No tools for this country yet'}</p>
        </div>
      )}
    </>
  )
}
