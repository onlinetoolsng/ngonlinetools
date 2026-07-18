// 📁 app/sitemap-locations/route.ts
// Covers: location index + 7 country hub pages × 2 locales = 16 URLs.
// Static — derived from the locations registry, no DB call needed.

import { buildSitemapXml, xmlResponse } from '@/lib/sitemap/xml'
import { LOCATIONS } from '@/lib/registry/locations'

const BASE_URL = 'https://gulftools.jobmeter.app'
const locales  = ['en', 'ar'] as const

export async function GET() {
  const entries = []

  // Location index page
  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}/location`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
      alternates: {
        en: `${BASE_URL}/en/location`,
        ar: `${BASE_URL}/ar/location`,
      },
    })
  }

  // Country hub pages
  for (const location of LOCATIONS) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/location/${location.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        alternates: {
          en: `${BASE_URL}/en/location/${location.slug}`,
          ar: `${BASE_URL}/ar/location/${location.slug}`,
        },
      })
    }
  }

  return xmlResponse(buildSitemapXml(entries))
}
