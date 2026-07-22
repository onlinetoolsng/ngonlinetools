// 📁 app/sitemap-categories/route.ts
// Covers: all 16 category pages × 2 locales = 32 URLs.
// Static — derived from the categories registry, no DB call needed.

import { buildSitemapXml, xmlResponse } from '@/lib/sitemap/xml'
import { CATEGORIES } from '@/lib/registry/categories'
import { localizedUrl } from '@/lib/i18n/paths'

const locales = ['en'] as const

export async function GET() {
  const entries = CATEGORIES.flatMap(category =>
    locales.map(locale => ({
      url: localizedUrl(locale, `/tools/${category.slug}`),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      // Higher-priority categories rank first in crawl queue
      priority: category.priority <= 4 ? 0.9 : category.priority <= 8 ? 0.85 : 0.8,
      alternates: { en: localizedUrl(locale, `/tools/${category.slug}`) },
    }))
  )

  return xmlResponse(buildSitemapXml(entries))
}
