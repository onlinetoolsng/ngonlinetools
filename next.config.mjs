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
      "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://ep1.adtrafficquality.google https://p.typekit.net https://open.er-api.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Canonical host redirect: www -> apex.
  //
  // Every canonical tag, sitemap URL, OG URL, and JSON-LD URL across the
  // app is built from BASE_URL = 'https://toolbase.com.ng' (see
  // lib/i18n/paths.ts, lib/schema/schemas.ts, all sitemap-*.xml routes).
  // But nothing was actually redirecting the www host to it, so both
  // https://toolbase.com.ng/... and https://www.toolbase.com.ng/...
  // served the exact same content as two independent, fully-crawlable
  // URLs. Google Search Console confirms this isn't stale: 39+ paths are
  // indexed under BOTH hosts as of Aug 2026, most recrawled within the
  // last few days on each host, and 171 of 210 total indexed pages are
  // actually sitting on www — the opposite host from what every
  // canonical tag on the site claims. That's the same
  // "canonical points at a URL that isn't what actually got indexed"
  // contradiction that be0e916 already fixed for the /en/ locale prefix,
  // just at the host level instead. A `<link rel="canonical">` alone
  // does not merge/redirect anything on its own — it's a hint, and
  // Google is evidently not resolving it here — so this needs an actual
  // 301, not just correct canonical tags.
  //
  // Redirecting www -> apex (rather than the other way) matches the
  // existing BASE_URL convention everywhere else in the codebase, so
  // this is the only file that needs to change.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.toolbase.com.ng' }],
        destination: 'https://toolbase.com.ng/:path*',
        permanent: true,
      },
    ]
  },

  // Security headers on all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
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

  // Compress responses
  compress: true,

  // Strict mode
  reactStrictMode: true,
}

export default withNextIntl(nextConfig)
