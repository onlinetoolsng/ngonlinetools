// 📁 app/sitemap-documents.xml/route.ts
// Covers: /documents index + every published (type, country) template page.
// Live — new templates appear in the sitemap without a deploy, since it
// reads document_templates directly rather than a static registry.

import { buildSitemapXml, xmlResponse } from '@/lib/sitemap/xml'
import { getAllPublishedTemplates } from '@/lib/documents/document-templates-data'

const BASE_URL = 'https://toolbase.com.ng'
const locales = ['en'] as const

// Route Handlers with a GET can be statically cached by default; force
// this one dynamic so newly published templates appear in the sitemap
// without waiting on a redeploy.
export const revalidate = 0
export const dynamic = 'force-dynamic'

export async function GET() {
  const entries = []

  // Documents index page
  for (const locale of locales) {
    entries.push({
      url: `${BASE_URL}/${locale}/documents`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: {
        en: `${BASE_URL}/en/documents`,
        ar: `${BASE_URL}/ar/documents`,
      },
    })
  }

  // Individual template pages — fetched live from Supabase
  try {
    const templates = await getAllPublishedTemplates()

    for (const t of templates) {
      for (const locale of locales) {
        entries.push({
          url: `${BASE_URL}/${locale}/documents/${t.document_type}/${t.country}`,
          lastModified: new Date(t.updated_at),
          changeFrequency: 'monthly' as const,
          priority: 0.75,
          alternates: {
            en: `${BASE_URL}/en/documents/${t.document_type}/${t.country}`,
            ar: `${BASE_URL}/ar/documents/${t.document_type}/${t.country}`,
          },
        })
      }
    }
  } catch {
    console.warn('sitemap-documents: could not fetch templates from Supabase')
  }

  return xmlResponse(buildSitemapXml(entries))
}
