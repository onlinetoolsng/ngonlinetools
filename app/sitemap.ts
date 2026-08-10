// 📁 app/sitemap.ts
// Root sitemap index — lists all child sitemaps.
// Google fetches this first then crawls each child independently.

import { MetadataRoute } from 'next'

const BASE_URL = 'https://toolbase.com.ng'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/sitemap-static.xml`,     lastModified: new Date() },
    { url: `${BASE_URL}/sitemap-categories.xml`, lastModified: new Date() },
    { url: `${BASE_URL}/sitemap-tools.xml`,      lastModified: new Date() },
    // sitemap-documents.xml intentionally excluded — documents are
    // noindexed while shelved (see app/[locale]/documents/page.tsx),
    // so submitting them here would just contradict the noindex tag
    // and waste crawl budget. The route itself is untouched — this
    // only stops it from being actively pushed to Google.
    { url: `${BASE_URL}/sitemap-blog.xml`,       lastModified: new Date() },
  ]
}
