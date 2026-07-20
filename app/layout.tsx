// 📁 app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

const siteUrl = 'https://toolbase.com.ng'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ToolBase — Free Online Calculators & Tools for Nigeria',
    template: '%s | ToolBase',
  },
  description:
    'Free online tools and calculators built for Nigeria — finance, tax, business, payroll, and more.',
  keywords: [
    'online tools nigeria',
    'naira calculator',
    'nigeria tax calculator',
    'paye calculator nigeria',
    'loan calculator nigeria',
    'nigeria finance tools',
  ],
  authors: [{ name: 'ToolBase' }],
  creator: 'ToolBase',
  publisher: 'ToolBase',
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
    locale: 'en_NG',
    url: siteUrl,
    siteName: 'ToolBase',
    title: 'ToolBase — Free Online Calculators & Tools for Nigeria',
    description:
      'Free online tools and calculators built for Nigeria — finance, tax, business, payroll, and more.',
    images: [
      {
        url: `${siteUrl}/og/homepage.png`,
        width: 1200,
        height: 630,
        alt: 'ToolBase',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ToolBase — Free Online Calculators & Tools for Nigeria',
    description: 'Free online tools and calculators built for Nigeria.',
    images: [`${siteUrl}/og/homepage.png`],
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
        {/* TODO: add your own AdSense verification meta tag + script once approved.
            <meta name="google-adsense-account" content="ca-pub-XXXXXXXXXXXXXXXX" />
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous" />
        */}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'ToolBase',
              alternateName: 'ToolBase — Free Online Calculators',
              url: siteUrl,
            }),
          }}
        />
      </head>

      <body suppressHydrationWarning>
        {children}

        {/* TODO: add your own Google Analytics tracking ID.
            <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-XXXXXXXXXX');`}
            </Script>
        */}
      </body>
    </html>
  )
}
