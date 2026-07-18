// 📁 app/layout.tsx
import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

const siteUrl = 'https://gulftools.jobmeter.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Gulf Tools — Free Online tools for UAE, Saudi Arabia & the Gulf',
    template: '%s | Gulf Tools',
  },
  description:
    'Free online tools and calculators built for the Gulf — salary, gratuity, VAT, zakat, loan EMI and more for UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman and Egypt.',
  keywords: [
    'gulf tools',
    'uae salary calculator',
    'gratuity calculator uae',
    'zakat calculator',
    'uae vat calculator',
    'loan emi calculator gulf',
    'saudi arabia tools',
    'qatar calculators',
    'gulf finance tools',
    'expat tools uae',
  ],
  authors: [{ name: 'Gulf Tools' }],
  creator: 'Gulf Tools',
  publisher: 'Gulf Tools', // ✅ FIXED: was 'JobMeter Network'
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_AE',
    url: siteUrl,
    siteName: 'Gulf Tools',
    title: 'Gulf Tools — Free Calculators for UAE, Saudi Arabia & the Gulf',
    description:
      'Free online tools and calculators built for the Gulf — salary, gratuity, VAT, zakat, loan EMI and more.',
    images: [
      {
        url: `${siteUrl}/og/homepage.png`,
        width: 1200,
        height: 630,
        alt: 'Gulf Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gulf Tools — Free Calculators for UAE, Saudi Arabia & the Gulf',
    description: 'Free online tools and calculators built for the Gulf.',
    images: [`${siteUrl}/og/homepage.png`],
    creator: '@gulftools', // ✅ FIXED: was '@jobmeterapp'
    site: '@gulftools',   // ✅ FIXED: was '@jobmeterapp'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  alternates: {
    canonical: siteUrl,
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* AdSense account verification */}
        <meta
          name="google-adsense-account"
          content="ca-pub-1119289641389825"
        />

        {/* Admaven */}
        <meta name="admaven-placement" content="Bqjw8rHw7" />

        {/* Preconnects */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://pagead2.googlesyndication.com"
        />

        {/* AdSense script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1119289641389825"
          crossOrigin="anonymous"
        />

        {/* ✅ ADDED: WebSite structured data — strongest signal to Google for site name */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Gulf Tools',
              alternateName: 'Gulf Tools — Free Online Calculators',
              url: siteUrl,
            }),
          }}
        />
      </head>

      <body suppressHydrationWarning>
        {children}

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-315B0S5RGE"
          strategy="afterInteractive"
        />

        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-315B0S5RGE');
          `}
        </Script>
      </body>
    </html>
  )
}
