import { getTranslations } from 'next-intl/server'

const BASE_URL = 'https://toolbase.com.ng'

export async function generateToolMetadata(
  locale: string,
  toolSlug: string,
  categorySlug: string
) {
  const t = await getTranslations({ locale, namespace: `tools.${toolSlug}` })

  return {
    title: `${t('title')} | ToolBase`,
    description: t('metaDescription'),
    alternates: {
      canonical: `${BASE_URL}/tools/${categorySlug}/${toolSlug}`,
    },
    openGraph: {
      title: t('title'),
      description: t('metaDescription'),
      url: `${BASE_URL}/tools/${categorySlug}/${toolSlug}`,
      siteName: 'ToolBase',
      locale: 'en_NG',
      type: 'website' as const,
      images: [
        {
          url: `${BASE_URL}/og/tools/${toolSlug}.png`,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: t('title'),
      description: t('metaDescription'),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
      },
    },
  }
}

export async function generateCategoryMetadata(
  locale: string,
  categorySlug: string
) {
  const t = await getTranslations({
    locale,
    namespace: `categories.${categorySlug}`,
  })

  return {
    title: `${t('name')} Tools | ToolBase`,
    description: t('description'),
    alternates: {
      canonical: `${BASE_URL}/tools/${categorySlug}`,
    },
    openGraph: {
      title: `${t('name')} Tools`,
      description: t('description'),
      url: `${BASE_URL}/tools/${categorySlug}`,
      siteName: 'ToolBase',
      locale: 'en_NG',
      type: 'website' as const,
    },
    robots: { index: true, follow: true },
  }
}

export async function generateHomepageMetadata(locale: string) {
  const t = await getTranslations({ locale, namespace: 'seo' })

  return {
    title: t('siteName'),
    description: t('siteDescription'),
    alternates: {
      canonical: `${BASE_URL}`,
    },
    openGraph: {
      title: t('siteName'),
      description: t('siteDescription'),
      url: `${BASE_URL}`,
      siteName: 'ToolBase',
      locale: 'en_NG',
      type: 'website' as const,
      images: [
        {
          url: `${BASE_URL}/og/homepage.png`,
          width: 1200,
          height: 630,
          alt: 'ToolBase',
        },
      ],
    },
    robots: { index: true, follow: true },
  }
}

export function generateBlogIndexMetadata(locale: string) {
  const title = 'Blog | ToolBase'
  const description = 'Guides and articles on personal finance, taxes, and money in Nigeria'

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/blog`,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/blog`,
      siteName: 'ToolBase',
      locale: 'en_NG',
      type: 'website' as const,
      images: [
        {
          url: `${BASE_URL}/og/blog-default.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
    },
    robots: { index: true, follow: true },
  }
}
