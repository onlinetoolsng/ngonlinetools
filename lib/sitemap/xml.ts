// 📁 lib/sitemap/xml.ts
// Shared helpers for building sitemap XML responses.

export type SitemapEntry = {
  url: string
  lastModified?: Date | string
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  alternates?: { en: string; ar: string }
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0]
  if (date instanceof Date) return date.toISOString().split('T')[0]
  return new Date(date).toISOString().split('T')[0]
}

function buildUrl(entry: SitemapEntry): string {
  const lines: string[] = []
  lines.push('  <url>')
  lines.push(`    <loc>${entry.url}</loc>`)
  lines.push(`    <lastmod>${formatDate(entry.lastModified)}</lastmod>`)
  if (entry.changeFrequency) {
    lines.push(`    <changefreq>${entry.changeFrequency}</changefreq>`)
  }
  if (entry.priority !== undefined) {
    lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)
  }
  if (entry.alternates) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="en" href="${entry.alternates.en}"/>`)
    lines.push(`    <xhtml:link rel="alternate" hreflang="ar" href="${entry.alternates.ar}"/>`)
    lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${entry.alternates.en}"/>`)
  }
  lines.push('  </url>')
  return lines.join('\n')
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset',
    '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '  xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(buildUrl),
    '</urlset>',
  ].join('\n')
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
