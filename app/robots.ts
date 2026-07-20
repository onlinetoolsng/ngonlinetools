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
      'https://toolbase.com.ng/sitemap.xml',
      'https://toolbase.com.ng/sitemap-static.xml',
      'https://toolbase.com.ng/sitemap-categories.xml',
      'https://toolbase.com.ng/sitemap-tools.xml',
      'https://toolbase.com.ng/sitemap-blog.xml',
    ],
  }
}