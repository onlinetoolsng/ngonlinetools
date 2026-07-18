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
      'https://gulftools.jobmeter.app/sitemap.xml',
      'https://gulftools.jobmeter.app/sitemap-static.xml',
      'https://gulftools.jobmeter.app/sitemap-categories.xml',
      'https://gulftools.jobmeter.app/sitemap-tools.xml',
      'https://gulftools.jobmeter.app/sitemap-locations.xml',
      'https://gulftools.jobmeter.app/sitemap-blog.xml',
    ],
  }
}