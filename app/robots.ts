// 📁 app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/'],
    },
    sitemap: [
      'https://www.toolbase.com.ng/sitemap.xml',
      'https://www.toolbase.com.ng/sitemap-static.xml',
      'https://www.toolbase.com.ng/sitemap-categories.xml',
      'https://www.toolbase.com.ng/sitemap-tools.xml',
      'https://www.toolbase.com.ng/sitemap-documents.xml',
      'https://www.toolbase.com.ng/sitemap-blog.xml',
    ],
  }
}