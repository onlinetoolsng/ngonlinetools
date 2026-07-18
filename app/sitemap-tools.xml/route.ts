// 📁 app/sitemap-tools/route.ts
// Covers: all tool pages × 2 locales.
// Only includes tools that have a row in tool_translations (i.e. SEO content exists).
// Falls back to full TOOLS registry if Supabase is unavailable.

import { buildSitemapXml, xmlResponse } from '@/lib/sitemap/xml'
import { TOOLS } from '@/lib/registry/tools'
import { createSupabasePublicClient } from '@/lib/supabase/client'

const BASE_URL = 'https://onlinetoolsng.com'
const locales = ['en'] as const

async function getTranslatedToolSlugs(): Promise<Set<string>> {
  try {
    const supabase = createSupabasePublicClient()
    const { data, error } = await supabase
      .from('tool_translations')
      .select('tool_slug')
      .eq('locale', 'en') // only need to check EN — AR falls back to EN anyway

    if (error || !data) return new Set(TOOLS.map(t => t.slug))
    return new Set(data.map((r: { tool_slug: string }) => r.tool_slug))
  } catch {
    // Supabase unavailable — include all tools
    return new Set(TOOLS.map(t => t.slug))
  }
}

export async function GET() {
  const translatedSlugs = await getTranslatedToolSlugs()

  const entries = TOOLS
    .filter(tool => translatedSlugs.has(tool.slug))
    .flatMap(tool =>
      locales.map(locale => ({
        url: `${BASE_URL}/${locale}/tools/${tool.category}/${tool.slug}`,
        lastModified: new Date(tool.launchDate),
        changeFrequency: 'monthly' as const,
        priority: tool.featured ? 0.85 : 0.75,
        alternates: {
          en: `${BASE_URL}/en/tools/${tool.category}/${tool.slug}`,
          ar: `${BASE_URL}/ar/tools/${tool.category}/${tool.slug}`,
        },
      }))
    )

  return xmlResponse(buildSitemapXml(entries))
}
