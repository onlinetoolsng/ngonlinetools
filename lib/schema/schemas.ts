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
        inLanguage: locale === 'ar' ? 'ar' : 'en',
        isPartOf: { '@id': 'https://gulftools.jobmeter.app/#website' },
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
  authorName = 'Gulf Tools Editorial Team',
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
      url: 'https://gulftools.jobmeter.app/about',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Gulf Tools',
      logo: {
        '@type': 'ImageObject',
        url: 'https://gulftools.jobmeter.app/icons/logo.png',
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
    inLanguage: locale === 'ar' ? 'ar' : 'en',
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
        '@id': 'https://gulftools.jobmeter.app/#organization',
        name: 'Gulf Tools',
        url: 'https://gulftools.jobmeter.app',
        logo: {
          '@type': 'ImageObject',
          url: 'https://gulftools.jobmeter.app/icons/logo.png',
        },
        sameAs: [],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://gulftools.jobmeter.app/#website',
        url: 'https://gulftools.jobmeter.app',
        name: 'Gulf Tools',
        description: '50+ free tools for Gulf countries',
        publisher: { '@id': 'https://gulftools.jobmeter.app/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate:
              'https://gulftools.jobmeter.app/en/tools?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: ['en', 'ar'],
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
    inLanguage: locale === 'ar' ? 'ar' : 'en',
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
        inLanguage: locale === 'ar' ? 'ar' : 'en',
        about: {
          '@type': 'Country',
          name: countryNameEn,
        },
        isPartOf: { '@id': 'https://gulftools.jobmeter.app/#website' },
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