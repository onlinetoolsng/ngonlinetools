'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { generateBreadcrumbSchema } from '@/lib/schema/schemas'

type BreadcrumbItem = {
  label: string
  href: string
}

const BASE_URL = 'https://onlinetoolsng.com'

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const locale = useLocale()
  const isRTL = locale === 'ar'

  const schemaItems = items.map(item => ({
    name: item.label,
    url: `${BASE_URL}${item.href}`,
  }))

  return (
    <>
      <SchemaOrg schema={generateBreadcrumbSchema(schemaItems)} />
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-1.5 text-sm text-gray-500 py-3"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {items.map((item, index) => (
          <span key={item.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <span
                className={`text-gray-400 select-none ${isRTL ? 'rotate-180 inline-block' : ''}`}
                aria-hidden
              >
                ›
              </span>
            )}
            {index === items.length - 1 ? (
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-indigo-700 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
