// 📁 components/layout/RelatedContent.tsx
//
// Single shared "related content" block for tool, template, and blog
// pages: 5 random same-category tools + 5 random same-category
// templates + (on tool/template pages only) 5 random same-category blog
// posts, for internal linking.
//
// This replaces what used to be two separate, separately-maintained
// related-tools blocks on the blog article page (an inline one inside
// the article body, and a near-identical one in the sidebar) with one
// section, and extends the same pattern — random picks from the shared
// category taxonomy in lib/registry/categories.ts — to templates and
// blog posts, and to the tool and template detail pages too. The
// related-blog-posts section is skipped on blog pages themselves,
// since the sidebar "More articles" list already covers that ground —
// showing both was duplicate.
//
// Rendered once, at the bottom of the page, on all three page types.

import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getRandomToolsForCategory, getRandomTemplateTypesForCategory, pickRandom } from '@/lib/utils/relatedContent'
import { getAllPublishedTemplates } from '@/lib/documents/document-templates-data'
import { getArticlesByCategory } from '@/lib/supabase/queries'
import { getDocumentCountry } from '@/lib/documents/document-types'
import { includesCountry } from '@/lib/registry/countries'
import { getToolIcon } from '@/lib/utils/toolIcons'
import { getToolName } from '@/lib/utils/toolNames'
import { getCategoryIcon } from '@/lib/registry/categories'
import { localePath } from '@/lib/i18n/paths'

type Props = {
  locale: string
  /** Shared category slug (finance, tax, hr-payroll, ...) to match related content against. */
  categorySlug: string
  /** Which page type this is being rendered on — controls the order of the sections below. */
  pageType: 'tool' | 'document' | 'blog'
  /** Country/countries the current page is about, e.g. a tool's `countries`
   *  array or a single document's `country`. When given, related tools,
   *  templates, and blog posts sharing at least one country are preferred
   *  — falling back to the rest of the category if there aren't enough
   *  same-country matches, so the section is never empty or under-filled. */
  countries?: string[]
  /** Exclude the tool currently being viewed, if this is a tool page. */
  excludeToolSlug?: string
  /** Exclude the document type currently being viewed, if this is a template page. */
  excludeTemplateSlug?: string
  /** Exclude the article currently being viewed, if this is a blog page. */
  excludeArticleSlug?: string
}

const COUNT = 5

export async function RelatedContent({
  locale,
  categorySlug,
  pageType,
  countries,
  excludeToolSlug,
  excludeTemplateSlug,
  excludeArticleSlug,
}: Props) {
  const isAr = locale === 'ar'
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tBlog = await getTranslations({ locale, namespace: 'blog' })

  // ── Tools: same category, same country preferred ───────────────────────
  const relatedTools = getRandomToolsForCategory(categorySlug, excludeToolSlug, COUNT, countries)

  // ── Templates: same category, same country preferred, cross-checked
  //    against what's actually published in Supabase so we never link to
  //    a 404 ─────────────────────────────────────────────────────────────
  let relatedTemplates: { slug: string; country: string; label: string }[] = []
  try {
    const published = await getAllPublishedTemplates()
    const publishedByType = new Map(published.map(p => [p.document_type, p]))
    const candidateDefs = getRandomTemplateTypesForCategory(categorySlug, excludeTemplateSlug, published.length)
      .filter(d => publishedByType.has(d.slug))
    const candidates = candidateDefs.map(d => {
      const row = publishedByType.get(d.slug)!
      return { slug: d.slug, country: row.country, label: d.label }
    })
    if (countries && countries.length > 0) {
      const priority = candidates.filter(c => countries.some(country => includesCountry([c.country], country)))
      const rest = candidates.filter(c => !countries.some(country => includesCountry([c.country], country)))
      relatedTemplates = pickRandom(priority, COUNT)
      if (relatedTemplates.length < COUNT) {
        relatedTemplates.push(...pickRandom(rest, COUNT - relatedTemplates.length))
      }
    } else {
      relatedTemplates = pickRandom(candidates, COUNT)
    }
  } catch (err) {
    console.error('RelatedContent: templates lookup error:', err)
  }

  // ── Blog posts: same category, same country preferred — skipped on blog
  //    pages, which already have a "More articles" sidebar list covering
  //    this ground ─────────────────────────────────────────────────────
  let relatedArticles: { slug: string; title: string; readingTime: number }[] = []
  if (pageType !== 'blog') {
    try {
      const articles = await getArticlesByCategory(categorySlug, locale, 30)
      const candidates = articles
        .filter(a => a.slug !== excludeArticleSlug && a.translation)
        .map(a => ({
          slug: a.slug,
          title: a.translation!.title,
          readingTime: a.translation!.reading_time_minutes,
          countries: a.countries,
        }))
      if (countries && countries.length > 0) {
        const priority = candidates.filter(a => countries.some(country => includesCountry(a.countries, country)))
        const rest = candidates.filter(a => !countries.some(country => includesCountry(a.countries, country)))
        relatedArticles = pickRandom(priority, COUNT)
        if (relatedArticles.length < COUNT) {
          relatedArticles.push(...pickRandom(rest, COUNT - relatedArticles.length))
        }
      } else {
        relatedArticles = pickRandom(candidates, COUNT)
      }
    } catch (err) {
      console.error('RelatedContent: articles lookup error:', err)
    }
  }

  if (relatedTools.length === 0 && relatedTemplates.length === 0 && relatedArticles.length === 0) {
    return null
  }

  const toolsSection = relatedTools.length > 0 && (
    <div key="tools">
      <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
        {tCommon('relatedTools')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {relatedTools.map(tool => (
          <Link
            key={tool.slug}
            href={localePath(locale, `/tools/${tool.category}/${tool.slug}`)}
            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <span className="text-2xl flex-shrink-0">{getToolIcon(tool)}</span>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-gray-900 group-hover:text-indigo-700 transition-colors">
                {getToolName(tool.slug, locale)}
              </div>
              <div className="text-xs text-gray-400 capitalize">{tool.schema}</div>
            </div>
            <span className="ml-auto text-indigo-500 text-lg flex-shrink-0">{isAr ? '←' : '→'}</span>
          </Link>
        ))}
      </div>
    </div>
  )

  const templatesSection = relatedTemplates.length > 0 && (
    <div key="templates">
      <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
        {tCommon('relatedTemplates')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {relatedTemplates.map(template => {
          const docCountry = getDocumentCountry(template.country)
          return (
            <Link
              key={template.slug}
              href={localePath(locale, `/documents/${template.slug}/${template.country}`)}
              className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <span className="text-2xl flex-shrink-0">📄</span>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug">
                  {template.label}
                </div>
                <div className="text-xs text-gray-400">{docCountry?.flag ?? '🌍'} {docCountry?.name ?? template.country.toUpperCase()}</div>
              </div>
              <span className="ml-auto text-indigo-500 text-lg flex-shrink-0">{isAr ? '←' : '→'}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )

  const articlesSection = relatedArticles.length > 0 && (
    <div key="articles">
      <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
        {tCommon('relatedBlogPosts')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {relatedArticles.map(article => (
          <Link
            key={article.slug}
            href={localePath(locale, `/blog/${article.slug}`)}
            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <span className="text-2xl flex-shrink-0">{getCategoryIcon(categorySlug)}</span>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-gray-900 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2">
                {article.title}
              </div>
              <div className="text-xs text-gray-400">{tBlog('readingTime', { minutes: article.readingTime })}</div>
            </div>
            <span className="ml-auto text-indigo-500 text-lg flex-shrink-0">{isAr ? '←' : '→'}</span>
          </Link>
        ))}
      </div>
    </div>
  )

  // Order sections so the current page's own type leads, matching user intent:
  // a tool page leads with related tools, a document page with related documents.
  // Blog pages never show a related-blog-posts section here — the sidebar
  // "More articles" list already covers that, so showing both was duplicate.
  const orderByPageType: Record<Props['pageType'], React.ReactNode[]> = {
    tool: [toolsSection, templatesSection, articlesSection],
    document: [templatesSection, toolsSection, articlesSection],
    blog: [toolsSection, templatesSection],
  }

  return (
    <section className="mt-10 space-y-8 no-print" dir={isAr ? 'rtl' : 'ltr'}>
      {orderByPageType[pageType]}
    </section>
  )
}
