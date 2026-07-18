// 📁 app/sitemap-blog/route.ts
// Covers: blog index + all published article slugs from Supabase.
// Live — new articles appear in the sitemap without a deploy.
// Cached at edge for 1 hour (Cache-Control in xmlResponse).

import { buildSitemapXml, xmlResponse } from '@/lib/sitemap/xml'
import { getAllPublishedArticleSlugs } from '@/lib/supabase/queries'

const BASE_URL = 'https://gulftools.jobmeter.app'
const locales  = ['en', 'ar'] as const

export async function GET() {
  const entries = []

  // Blog index pages
  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
      alternates: {
        en: `${BASE_URL}/en/blog`,
        ar: `${BASE_URL}/ar/blog`,
      },
    })
  }

  // Individual article pages — fetched live from Supabase
  try {
    const slugs = await getAllPublishedArticleSlugs()

    for (const { slug, published_at } of slugs) {
      for (const locale of locales) {
        entries.push({
          url: `${BASE_URL}/${locale}/blog/${slug}`,
          lastModified: new Date(published_at),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
          alternates: {
            en: `${BASE_URL}/en/blog/${slug}`,
            ar: `${BASE_URL}/ar/blog/${slug}`,
          },
        })
      }
    }
  } catch {
    console.warn('sitemap-blog: could not fetch article slugs from Supabase')
  }

  return xmlResponse(buildSitemapXml(entries))
}
