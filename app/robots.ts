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
      'https://onlinetoolsng.com/sitemap.xml',
      'https://onlinetoolsng.com/sitemap-static.xml',
      'https://onlinetoolsng.com/sitemap-categories.xml',
      'https://onlinetoolsng.com/sitemap-tools.xml',
      'https://onlinetoolsng.com/sitemap-blog.xml',
    ],
  }
}