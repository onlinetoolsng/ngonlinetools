// 📁 app/sitemap-static/route.ts
// Covers: homepages, tools directory, blog index, location index,
// and all static legal/info pages.

import { buildSitemapXml, xmlResponse } from '@/lib/sitemap/xml'
import { localizedUrl } from '@/lib/i18n/paths'

const locales = ['en'] as const

// All static page paths (relative, without locale prefix)
const STATIC_PATHS = [
  { path: '',          changeFrequency: 'weekly'  as const, priority: 1.0 },
  { path: '/tools',    changeFrequency: 'weekly'  as const, priority: 0.95 },
  { path: '/blog',     changeFrequency: 'daily'   as const, priority: 0.9 },
  { path: '/about',    changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/contact',  changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/privacy',  changeFrequency: 'monthly' as const, priority: 0.4 },
  { path: '/terms',    changeFrequency: 'monthly' as const, priority: 0.4 },
  { path: '/disclaimer',changeFrequency: 'monthly'as const, priority: 0.4 },
]

export async function GET() {
  const entries = STATIC_PATHS.flatMap(({ path, changeFrequency, priority }) =>
    locales.map(locale => ({
      url: localizedUrl(locale, path),
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: { en: localizedUrl(locale, path) },
    }))
  )

  return xmlResponse(buildSitemapXml(entries))
}
