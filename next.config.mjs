// 📁 next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    // CSP — permissive enough for AdSense, GA4, Typekit, Google Fonts
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googletagmanager.com https://www.google-analytics.com https://adservice.google.com https://tpc.googlesyndication.com https://fundingchoicesmessages.google.com https://ep1.adtrafficquality.google https://use.typekit.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://use.typekit.net https://p.typekit.net",
      "font-src 'self' https://fonts.gstatic.com https://use.typekit.net",
      "img-src 'self' data: https: blob:",
      "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://fundingchoicesmessages.google.com",
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://ep1.adtrafficquality.google https://p.typekit.net https://open.er-api.com https://generativelanguage.googleapis.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
]

// Static files in /public that never change between deploys (same file name = same content).
const staticAssetSources = [
  '/og/:path*',
  '/images/:path*',
  '/logo.png',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/apple-icon-precomposed.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers on all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // /blog is a static page (cached one day). Filtered / searched / paginated URLs serve the same
      // HTML and load their results in the browser, so keep those variants out of the index.
      ...['q', 'category', 'page', 'sort'].map((key) => ({
        source: '/blog',
        has: [{ type: 'query', key }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, follow' }],
      })),
      // Files in /public are served by Vercel with max-age=0 + must-revalidate by default, so every
      // visit re-checks each logo/icon/social image. Let browsers and the CDN keep them.
      ...staticAssetSources.map((source) => ({
        source,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
          },
        ],
      })),
    ]
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },

  // Locale routing without middleware. The site has one locale ('en', no URL prefix), which is what
  // next-intl's middleware used to handle on every page view (a middleware invocation each time).
  // Same behaviour, but done by Vercel's router with no function run:
  //  - /en and /en/* are redirected to the unprefixed URL
  //  - unprefixed page URLs are internally rewritten to /en/*
  async redirects() {
    return [
      { source: '/en', destination: '/', permanent: true },
      { source: '/en/:path*', destination: '/:path*', permanent: true },
    ]
  },
  async rewrites() {
    return {
      // afterFiles: files in /public, /api routes, sitemaps, robots etc. are matched first
      afterFiles: [
        { source: '/', destination: '/en' },
        { source: '/:path+', destination: '/en/:path+' },
      ],
    }
  },

  // Compress responses
  compress: true,

  // Strict mode
  reactStrictMode: true,
}

export default withNextIntl(nextConfig)
