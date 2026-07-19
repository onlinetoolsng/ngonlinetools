// 📁 app/[locale]/tools/[category]/[tool]/page.tsx
import type { ComponentType } from 'react'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { TOOLS, getToolBySlug, getRelatedTools } from '@/lib/registry/tools'
import { CATEGORIES, getCategoryBadgeClass } from '@/lib/registry/categories'
import {
  generateToolSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from '@/lib/schema/schemas'
import { getToolTranslation } from '@/lib/supabase/queries'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'
import { ToolWrapper } from '@/components/tools/ToolWrapper'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import AdUnit from '@/components/ads/AdUnit'
import { AD_SLOTS } from '@/components/ads/slots'
import { getToolIcon } from '@/lib/utils/toolIcons'
import Link from 'next/link'

// ─── Constants ────────────────────────────────────────────────────────────────
// (category badge styling now comes from lib/registry/categories.ts)

/**
 * Fallback display names for related-tools sidebar.
 * Used only when a related tool's DB title isn't available in this render.
 * Extend this list as you add more tools.
 */
const TOOL_NAMES: Record<string, { en: string; ar: string }> = {
  'salary-calculator': { en: 'Salary Calculator', ar: '' },
  'vat-calculator':    { en: 'VAT Calculator',    ar: '' },
  'company-income-tax-calculator': { en: 'Company Income Tax Calculator', ar: '' },
  'pension-calculator': { en: 'Pension Calculator', ar: '' },
  'investment-returns-calculator': { en: 'Investment Returns Calculator', ar: '' },
  'net-worth-calculator': { en: 'Net Worth Calculator', ar: '' },
  'loan-repayment-calculator': { en: 'Loan Repayment & True Cost Calculator', ar: '' },
  'capital-gains-tax-calculator': { en: 'Capital Gains Tax Calculator', ar: '' },
  'nigeria-crypto-vs-traditional-comparator': { en: 'Crypto vs Traditional Investments Comparator', ar: '' },
  'nigeria-stock-portfolio-tracker': { en: 'NGX Stock Portfolio Tracker', ar: '' },
  'nigeria-paye-tax-calculator': { en: 'Nigeria PAYE Tax Calculator', ar: '' },
}

function getToolName(slug: string, locale: string): string {
  const entry = TOOL_NAMES[slug]
  if (entry) return locale === 'ar' ? entry.ar : entry.en
  return slug
    .split('-')
    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Params = { locale: string; category: string; tool: string }

// ─── Route config ─────────────────────────────────────────────────────────────

export const revalidate = 86400

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const locales = ['en']
  return TOOLS.flatMap(tool =>
    locales.map(locale => ({
      locale,
      category: tool.category,
      tool:     tool.slug,
    }))
  )
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale, category, tool: toolSlug } = await params

  let toolContent
  try {
    toolContent = await getToolTranslation(toolSlug, locale)
  } catch {
    return {}
  }
  if (!toolContent) return {}

  const BASE_URL = 'https://onlinetoolsng.com'
  const url      = `${BASE_URL}/${locale}/tools/${category}/${toolSlug}`

  return {
    title:       `${toolContent.title} | OnlineToolsNG`,
    description: toolContent.meta_description ?? toolContent.description ?? '',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title:       toolContent.title,
      description: toolContent.meta_description ?? toolContent.description ?? '',
      url,
      siteName: 'OnlineToolsNG',
      locale:   'en_NG',
      type:     'website' as const,
      images:   [{ url: `${BASE_URL}/og/tools/${toolSlug}.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card:        'summary_large_image' as const,
      title:       toolContent.title,
      description: toolContent.meta_description ?? toolContent.description ?? '',
    },
    robots: { index: true, follow: true },
  }
}

async function loadToolComponent(toolSlug: string): Promise<ComponentType<{ locale: string }> | null> {
  try {
    switch (toolSlug) {
      // ── Add new tool cases here as they are built ──
      case 'salary-calculator': {
        const { SalaryCalculator } = await import('@/components/tools/SalaryCalculator')
        return SalaryCalculator
      }
      case 'vat-calculator': {
        const { VATCalculator } = await import('@/components/tools/VATCalculator')
        return VATCalculator
      }
      case 'company-income-tax-calculator': {
        const { CITCalculator } = await import('@/components/tools/CITCalculator')
        return CITCalculator
      }
      case 'net-worth-calculator': {
        const { NigeriaNetWorthCalculator } = await import('@/components/tools/NigeriaNetWorthCalculator')
        return NigeriaNetWorthCalculator
      }
      case 'pension-calculator': {
        const { PensionCalculator } = await import('@/components/tools/PensionCalculator')
        return PensionCalculator
      }
      case 'investment-returns-calculator': {
        const { InvestmentReturnsCalculator } = await import('@/components/tools/InvestmentReturnsCalculator')
        return InvestmentReturnsCalculator
      }
      case 'nigeria-retirement-planner': {
       const { NigeriaRetirementPlanner } = await import('@/components/tools/NigeriaRetirementPlanner')
     return NigeriaRetirementPlanner
     }
      case 'savings-goal-planner': {
      const { SavingsGoalPlanner } = await import('@/components/tools/SavingsGoalPlanner')
     return SavingsGoalPlanner
      }
      case 'loan-repayment-calculator': {
        const { NigeriaLoanCalculator } = await import('@/components/tools/NigeriaLoanCalculator')
        return NigeriaLoanCalculator
      }
      case 'nigeria-crypto-vs-traditional-comparator': {
        const { default: NigeriaCryptoVsTraditionalComparator } = await import('@/components/tools/NigeriaCryptoVsTraditionalComparator')
        return NigeriaCryptoVsTraditionalComparator
      }
      case 'nigeria-stock-portfolio-tracker': {
        const { default: NigeriaStockPortfolioTracker } = await import('@/components/tools/NigeriaStockPortfolioTracker')
        return NigeriaStockPortfolioTracker
      }
      case 'nigeria-paye-tax-calculator': {
        const { NigeriaPAYETaxCalculator } = await import('@/components/tools/NigeriaPAYETaxCalculator')
        return NigeriaPAYETaxCalculator
      }
      case 'capital-gains-tax-calculator': {
        const { CapitalGainsTaxCalculator } = await import('@/components/tools/CapitalGainsTaxCalculator')
        return CapitalGainsTaxCalculator
      }
      default:
        console.warn(`Tool slug not found: ${toolSlug}`);
        return null;
    } 
  } catch (error) {
    console.error(`Failed to dynamic load component for slug: ${toolSlug}`, error);
    return null;
  }
} 

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { locale, category, tool: toolSlug } = await params

  // ── Guards ──
  const tool = getToolBySlug(toolSlug)
  if (!tool || tool.category !== category) notFound()

  const categoryData = CATEGORIES.find(c => c.slug === category)
  if (!categoryData) notFound()

  let toolContent
  try {
    toolContent = await getToolTranslation(toolSlug, locale)
  } catch {
    notFound()
  }
  if (!toolContent) notFound()

  // ── i18n ──
  const tNav    = await getTranslations({ locale, namespace: 'nav' })
  const tCat    = await getTranslations({ locale, namespace: `categories.${category}` })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  // ── Data ──
  const BASE_URL     = 'https://onlinetoolsng.com'
  const toolUrl      = `${BASE_URL}/${locale}/tools/${category}/${toolSlug}`
  const ToolComponent = await loadToolComponent(toolSlug)
  const relatedTools  = getRelatedTools(tool)
  const isRtl         = locale === 'ar'

  const faqs = (toolContent.faq ?? []).map((item: { q: string; a: string }) => ({
    question: item.q,
    answer:   item.a,
  }))

  // ── Breadcrumb ──
  const breadcrumbItems = [
    { label: tNav('home'),      href: `/${locale}` },
    { label: tNav('tools'),     href: `/${locale}/tools` },
    { label: tCat('name'),      href: `/${locale}/tools/${category}` },
    { label: toolContent.title, href: `/${locale}/tools/${category}/${toolSlug}` },
  ]

  // ── Structured data ──
  const schemas = [
    generateToolSchema({
      title:       toolContent.title,
      description: toolContent.description ?? '',
      url:         toolUrl,
      category,
      locale,
    }),
    ...(faqs.length > 0 ? [generateFAQSchema(faqs)] : []),
    generateBreadcrumbSchema(
      breadcrumbItems.map(b => ({ name: b.label, url: `${BASE_URL}${b.href}` }))
    ),
  ]

  const badgeColor = getCategoryBadgeClass(category)

  // ── Article body: plain text paragraphs or raw HTML ──
  // toolContent.article_body can be plain text with \n\n paragraph breaks,
  // or an HTML string (e.g. from a rich-text editor).
  // We check for HTML tags; if none, split on double newlines and render as <p>.
  const articleBody: string | null = (toolContent as any).article_body ?? null
  const articleIsHtml = articleBody ? /<[a-z][\s\S]*>/i.test(articleBody) : false

  return (
    <>
      <SchemaOrg schema={schemas} />
      <Header locale={locale} activePath={`/${locale}/tools`} />

      <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={`/${locale}/tools/${category}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 mt-2">

          {/* ── Main column ── */}
          <main className="min-w-0" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Tool header */}
            <div className="mb-6">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${badgeColor}`}>
                {getToolIcon(tool)} {tCat('name')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-2">
                {toolContent.title}
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                {toolContent.description}
              </p>
            </div>

            {/* Ad — above tool */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 text-center mb-1">Advertisement</p>
              <AdUnit slot={AD_SLOTS.TOOL_BANNER_1} />
            </div>

            {/* Interactive tool */}
            <ToolWrapper>
              {ToolComponent ? (
                <ToolComponent locale={locale} />
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-4xl mb-3">🔧</div>
                  <p className="font-medium">{tCommon('comingSoon')}</p>
                </div>
              )}
            </ToolWrapper>

            {/* Ad — below tool */}
            <div className="my-6">
              <p className="text-xs text-gray-500 text-center mb-1">Advertisement</p>
              <AdUnit slot={AD_SLOTS.TOOL_BANNER_2} />
            </div>

            {/* ── Article / SEO content section ── */}
            {toolContent.article_title && articleBody && (
              <section
                className="mt-10 border border-gray-200 rounded-2xl p-6 sm:p-8 bg-white"
                aria-labelledby="article-heading"
              >
                <h2
                  id="article-heading"
                  className="text-xl sm:text-2xl font-bold text-gray-900 mb-5 leading-snug"
                >
                  {toolContent.article_title}
                </h2>

                {articleIsHtml ? (
                  // Rich-text / HTML content from a CMS or editor
                  <div
                    className="prose prose-base sm:prose-lg prose-gray max-w-none
                      prose-headings:font-bold prose-headings:text-gray-800
                      prose-p:text-gray-600 prose-p:leading-relaxed
                      prose-a:text-indigo-700 prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-gray-800 prose-li:text-gray-600"
                    dangerouslySetInnerHTML={{ __html: articleBody }}
                  />
                ) : (
                  // Plain text: split on double newlines → paragraphs
                  <div className="space-y-5">
                    {articleBody
                      .split(/\n\n+/)
                      .filter(Boolean)
                      .map((para, i) => (
                        <p key={i} className="text-gray-600 leading-relaxed text-base sm:text-lg">
                          {para.trim()}
                        </p>
                      ))}
                  </div>
                )}
              </section>
            )}

            {/* ── FAQ section ── */}
            {faqs.length > 0 && (
              <section className="mt-8" aria-labelledby="faq-heading">
                <h2
                  id="faq-heading"
                  className="text-2xl font-bold text-gray-900 mb-6"
                >
                  {tCommon('frequentlyAsked')}
                </h2>
                <div className="space-y-3">
                  {faqs.map((faq, i) => (
                    <details
                      key={i}
                      className="group border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <summary
                        id={`faq-${i}`}
                        className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-semibold text-gray-800 hover:bg-gray-50 transition-colors list-none"
                      >
                        <span>{faq.question}</span>
                        <span className="text-gray-500 text-xl flex-shrink-0 group-open:rotate-45 transition-transform duration-200">
                          +
                        </span>
                      </summary>
                      <div className="px-5 pb-5 pt-2 text-gray-600 leading-relaxed text-base border-t border-gray-100">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* ── Sidebar ── */}
          <aside className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Related tools */}
            {relatedTools.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-6">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                  {tCommon('relatedTools')}
                </h3>
                <div className="space-y-1">
                  {relatedTools.map(related => {
                    // Resolve a specific icon for the related tool
                    const icon = getToolIcon(related)
                    const relatedBadgeColor = getCategoryBadgeClass(related.category)
                    return (
                      <Link
                        key={related.slug}
                        href={`/${locale}/tools/${related.category}/${related.slug}`}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${relatedBadgeColor}`}
                        >
                          {icon}
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors leading-snug">
                          {getToolName(related.slug, locale)}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Sidebar ad */}
            <div>
              <p className="text-xs text-gray-500 text-center mb-1">Advertisement</p>
              <AdUnit slot={AD_SLOTS.BANNER} format="autorelaxed" />
            </div>
          </aside>

        </div>
      </div>
      </div>

      <Footer locale={locale} />
    </>
  )
}
