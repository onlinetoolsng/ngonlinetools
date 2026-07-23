import { localizedUrl } from '@/lib/i18n/paths'

// ─── Tool Schema ──────────────────────────────────────────────────────────────

export function generateToolSchema({
  title,
  description,
  url,
  category,
  locale,
}: {
  title: string
  description: string
  url: string
  category: string
  locale: string
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: 'en',
        isPartOf: { '@id': 'https://toolbase.com.ng/#website' },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${url}#tool`,
        name: title,
        description,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        url,
      },
    ],
  }
}

// ─── FAQ Schema ───────────────────────────────────────────────────────────────

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// ─── Breadcrumb Schema ────────────────────────────────────────────────────────

export type BreadcrumbItem = {
  name: string
  url: string
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${items[items.length - 1].url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ─── Article Schema ───────────────────────────────────────────────────────────

export function generateArticleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  imageUrl,
  wordCount,
  authorName = 'Henry Agwu',
}: {
  title: string
  description: string
  url: string
  datePublished: string
  dateModified: string
  imageUrl: string
  wordCount?: number
  authorName?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished,
    dateModified,
    ...(wordCount ? { wordCount } : {}),
    author: {
      '@type': 'Person',
      name: authorName,
      url: 'https://toolbase.com.ng/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ToolBase',
      logo: {
        '@type': 'ImageObject',
        url: 'https://toolbase.com.ng/icons/logo.png',
      },
    },
    image: {
      '@type': 'ImageObject',
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  }
}

// ─── Blog Index Schema ────────────────────────────────────────────────────────

export function generateBlogSchema({
  url,
  name,
  description,
  locale = 'en',
  articles,
}: {
  url: string
  name: string
  description: string
  locale?: string
  articles: { title: string; url: string; datePublished: string; description?: string }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${url}#blog`,
    url,
    name,
    description,
    inLanguage: 'en',
    blogPost: articles.map(article => ({
      '@type': 'BlogPosting',
      headline: article.title,
      url: article.url,
      datePublished: article.datePublished,
      ...(article.description ? { description: article.description } : {}),
    })),
  }
}

// ─── Organization + WebSite Schema (root layout) ─────────────────────────────

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://toolbase.com.ng/#organization',
        name: 'ToolBase',
        url: 'https://toolbase.com.ng',
        logo: {
          '@type': 'ImageObject',
          url: 'https://toolbase.com.ng/icons/logo.png',
        },
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://toolbase.com.ng/#website',
        url: 'https://toolbase.com.ng',
        name: 'ToolBase',
        description: 'Free calculators and tools for Nigeria',
        publisher: { '@id': 'https://toolbase.com.ng/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate:
              `${localizedUrl('en', '/tools')}?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: ['en'],
      },
    ],
  }
}

// ─── Collection Page Schema (category pages) ─────────────────────────────────

export function generateCollectionSchema({
  name,
  description,
  url,
  tools,
  locale = 'en',
}: {
  name: string
  description: string
  url: string
  tools: { name: string; url: string }[]
  locale?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    inLanguage: 'en',
    numberOfItems: tools.length,
    hasPart: tools.map(tool => ({
      '@type': 'SoftwareApplication',
      name: tool.name,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      url: tool.url,
    })),
  }
}

// ─── Location / Country Page Schema ──────────────────────────────────────────

export function generateLocationSchema({
  countryName,
  countryNameEn,
  description,
  url,
  tools,
  locale = 'en',
}: {
  countryName: string
  countryNameEn: string
  description: string
  url: string
  tools: { name: string; url: string }[]
  locale?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: countryName,
        description,
        inLanguage: 'en',
        about: {
          '@type': 'Country',
          name: countryNameEn,
        },
        isPartOf: { '@id': 'https://toolbase.com.ng/#website' },
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#toollist`,
        name: `Free Tools for ${countryNameEn}`,
        description,
        numberOfItems: tools.length,
        itemListElement: tools.map((tool, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: tool.name,
          url: tool.url,
        })),
      },
    ],
  }
}