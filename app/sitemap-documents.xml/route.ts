// 📁 app/sitemap-documents.xml/route.ts
// Covers: /documents index + every published (type, country) template page.
// Live — new templates appear in the sitemap without a deploy, since it
// reads document_templates directly rather than a static registry.

import { buildSitemapXml, xmlResponse } from '@/lib/sitemap/xml'
import { getAllPublishedTemplates } from '@/lib/documents/document-templates-data'
import { localizedUrl } from '@/lib/i18n/paths'

const locales = ['en'] as const

// Regenerated at most once a day (the template list behind it is cached too).
export const revalidate = 86400

export async function GET() {
  const entries = []

  // Documents index page
  for (const locale of locales) {
    entries.push({
      url: localizedUrl(locale, `/documents`),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: { en: localizedUrl(locale, `/documents`) },
    })
  }

  // Individual template pages — fetched live from Supabase
  try {
    const templates = await getAllPublishedTemplates()

    for (const t of templates) {
      for (const locale of locales) {
        entries.push({
          url: localizedUrl(locale, `/documents/${t.document_type}/${t.country}`),
          lastModified: new Date(t.updated_at),
          changeFrequency: 'monthly' as const,
          priority: 0.75,
          alternates: { en: localizedUrl(locale, `/documents/${t.document_type}/${t.country}`) },
        })
      }
    }
  } catch (err) {
    // Don't serve (and cache for a day) a sitemap missing every URL. 503 isn't cached
    // and tells crawlers to retry.
    console.error('sitemap-documents: could not fetch templates from Supabase', err)
    return new Response('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' },
    })
  }

  return xmlResponse(buildSitemapXml(entries))
}
