// 📁 app/[locale]/tools/[category]/[tool]/page.tsx
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { TOOLS, getToolBySlug, getRelatedTools } from '@/lib/registry/tools'
import { CATEGORIES } from '@/lib/registry/categories'
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

const categoryColorMap: Record<string, string> = {
  finance:          'bg-emerald-50 text-emerald-700',
  'hr-payroll':     'bg-teal-50 text-teal-700',
  'islamic-tools':  'bg-green-50 text-green-700',
  'tax-vat':        'bg-red-50 text-red-700',
  business:         'bg-blue-50 text-blue-700',
  'real-estate':    'bg-orange-50 text-orange-700',
  currency:         'bg-yellow-50 text-yellow-700',
  education:        'bg-indigo-50 text-indigo-700',
  health:           'bg-pink-50 text-pink-700',
  career:           'bg-slate-50 text-slate-700',
  travel:           'bg-sky-50 text-sky-700',
  auto:             'bg-zinc-50 text-zinc-700',
  productivity:     'bg-amber-50 text-amber-700',
  government:       'bg-stone-50 text-stone-700',
}

/**
 * Fallback display names for related-tools sidebar.
 * Used only when a related tool's DB title isn't available in this render.
 * Extend this list as you add more tools.
 */
const TOOL_NAMES: Record<string, { en: string; ar: string }> = {
  'salary-calculator':            { en: 'Salary Calculator',            ar: 'حاسبة الراتب' },
  'loan-emi-calculator':          { en: 'Loan EMI Calculator',          ar: 'حاسبة القسط الشهري' },
  'gratuity-calculator':          { en: 'Gratuity Calculator',          ar: 'حاسبة مكافأة نهاية الخدمة' },
  'zakat-calculator':             { en: 'Zakat Calculator',             ar: 'حاسبة الزكاة' },
  'hijri-gregorian-converter':    { en: 'Hijri–Gregorian Converter',    ar: 'محول التاريخ الهجري' },
  'uae-vat-calculator':           { en: 'UAE VAT Calculator',           ar: 'حاسبة ضريبة القيمة المضافة الإمارات' },
  'ksa-vat-calculator':           { en: 'Saudi VAT Calculator',         ar: 'حاسبة ضريبة القيمة المضافة السعودية' },
  'invoice-generator':            { en: 'Invoice Generator',            ar: 'مولّد الفواتير' },
  'compound-interest-calculator': { en: 'Compound Interest Calculator', ar: 'حاسبة الفائدة المركبة' },
  'savings-goal-calculator':      { en: 'Savings Goal Calculator',      ar: 'حاسبة هدف الادخار' },
  'leave-encashment-calculator':  { en: 'Leave Encashment Calculator',  ar: 'حاسبة صرف الإجازة' },
  'notice-period-calculator':     { en: 'Notice Period Calculator',     ar: 'حاسبة فترة الإشعار' },
  'profit-margin-calculator':     { en: 'Profit Margin Calculator',     ar: 'حاسبة هامش الربح' },
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
  const locales = ['en', 'ar']
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

  const BASE_URL = 'https://gulftools.jobmeter.app'
  const url      = `${BASE_URL}/${locale}/tools/${category}/${toolSlug}`

  return {
    title:       `${toolContent.title} | Gulf Tools`,
    description: toolContent.meta_description ?? toolContent.description ?? '',
    alternates: {
      canonical: url,
      languages: {
        en:          `${BASE_URL}/en/tools/${category}/${toolSlug}`,
        ar:          `${BASE_URL}/ar/tools/${category}/${toolSlug}`,
        'x-default': `${BASE_URL}/en/tools/${category}/${toolSlug}`,
      },
    },
    openGraph: {
      title:       toolContent.title,
      description: toolContent.meta_description ?? toolContent.description ?? '',
      url,
      siteName: 'Gulf Tools',
      locale:   locale === 'ar' ? 'ar_AE' : 'en_AE',
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

async function loadToolComponent(toolSlug: string) {
  try {
    switch (toolSlug) {
      // ── FINANCE TOOLS ──
      case 'salary-calculator':
        return (await import('@/components/tools/finance/SalaryCalculator')).default;
      case 'uae-mortgage-calculator':
        return (await import('@/components/tools/finance/UAEMortgageCalculator')).default;
      case 'dubai-mortgage-calculator-non-residents':
        return (await import('@/components/tools/finance/DubaiNonResidentMortgageCalculator')).default;
      case 'home-loan-calculator-dubai':
        return (await import('@/components/tools/finance/HomeLoanCalculatorDubai')).default;
      case 'loan-emi-calculator':
        return (await import('@/components/tools/finance/LoanEMICalculator')).default;
      case 'savings-goal-calculator':
        return (await import('@/components/tools/finance/SavingsGoalCalculator')).default;
      case 'compound-interest-calculator':
        return (await import('@/components/tools/finance/CompoundInterestCalculator')).default;
      case 'uae-salary-calculator':
        return (await import('@/components/tools/finance/UAESalaryCalculator')).default;
      case 'dubai-salary-calculator':
        return (await import('@/components/tools/finance/DubaiSalaryCalculator')).default;
      case 'fab-loan-calculator':
        return (await import('@/components/tools/finance/FABLoanCalculator')).default;
      case 'rakbank-loan-calculator':
        return (await import('@/components/tools/finance/RakbankLoanCalculator')).default;
      case 'saudi-salary-calculator':
        return (await import('@/components/tools/finance/SaudiSalaryCalculator')).default;
      case 'egypt-salary-calculator':
        return (await import('@/components/tools/finance/EgyptSalaryCalculator')).default;
      case 'saudi-vacation-calculator':
        return (await import('@/components/tools/finance/SaudiVacationCalculator')).default;
      case 'uae-car-loan-calculator':
        return (await import('@/components/tools/finance/UAECarLoanCalculator')).default;
      case 'qatar-salary-calculator':
        return (await import('@/components/tools/finance/QatarSalaryCalculator')).default;
      case 'uae-loan-emi-calculator':
        return (await import('@/components/tools/finance/UAELoanEMICalculator')).default;
      case 'uae-loan-eligibility-calculator':
        return (await import('@/components/tools/finance/UAELoanEligibilityCalculator')).default;
      case 'gcc-emi-calculator':
        return (await import('@/components/tools/finance/GCCEMICalculator')).default;
      case 'kuwait-emi-calculator':
        return (await import('@/components/tools/finance/KuwaitEMICalculator')).default;
      case 'top-up-loan-calculator-uae':
        return (await import('@/components/tools/finance/TopUpLoanCalculatorUAE')).default;
      case 'car-loan-calculator-uae':
        return (await import('@/components/tools/finance/CarLoanCalculatorUAE')).default;
      case 'oman-emi-calculator':
      case 'oman-loan-calculator': // Aliased to the same component
        return (await import('@/components/tools/finance/OmanEmiCalculator')).default;
      case 'car-loan-emi-calculator':
        return (await import('@/components/tools/finance/CarLoanEMICalculator')).default;
      case 'car-loan-eligibility-calculator':
        return (await import('@/components/tools/finance/CarLoanEligibilityCalculator')).default;
      case 'credit-card-emi-calculator-uae':
        return (await import('@/components/tools/finance/CreditCardEmiCalculatorUAE')).default;
      case 'uae-end-of-service-calculator':
        return (await import('@/components/tools/finance/UAEEndOfServiceCalculator')).default;
      case 'uae-final-settlement-calculator':
        return (await import('@/components/tools/finance/UAEFinalSettlementCalculator')).default;
      case 'qatar-gratuity-calculator':
        return (await import('@/components/tools/finance/QatarGratuityCalculator')).default;
      case 'kuwait-gratuity-calculator':
        return (await import('@/components/tools/finance/KuwaitGratuityCalculator')).default;
      case 'oman-gratuity-calculator':
        return (await import('@/components/tools/finance/OmanGratuityCalculator')).default;
      case 'bahrain-gratuity-calculator':
        return (await import('@/components/tools/finance/BahrainGratuityCalculator')).default;
      case 'uae-indemnity-calculator':
        return (await import('@/components/tools/finance/UAEIndemnityCalculator')).default;
      case 'uae-leave-calculator':
        return (await import('@/components/tools/finance/UAELeaveCalculator')).default;
      case 'adcb-loan-calculator':
        return (await import('@/components/tools/finance/ADCBLoanCalculator')).default;
      case 'emirates-nbd-loan-calculator':
        return (await import('@/components/tools/finance/EmiratesNBDLoanCalculator')).default;
      case 'hsbc-loan-calculator-uae':
        return (await import('@/components/tools/finance/HSBCLoanCalculator')).default;
      case 'qatar-emi-calculator':
        return (await import('@/components/tools/finance/QatarEmiCalculator')).default;
      case 'uae-personal-loan-calculator':
        return (await import('@/components/tools/finance/UAEPersonalLoanCalculator')).default;
      case 'uae-loan-repayment-calculator':
        return (await import('@/components/tools/finance/UAELoanRepaymentCalculator')).default;
      case 'uae-loan-amortization-calculator':
        return (await import('@/components/tools/finance/UAELoanAmortizationCalculator')).default;
      case 'uae-early-settlement-calculator':
        return (await import('@/components/tools/finance/UAEEarlySettlementCalculator')).default;
      case 'oman-salary-calculator':
        return (await import('@/components/tools/finance/OmanSalaryCalculator')).default;
      case 'uae-leave-pay-calculator':
        return (await import('@/components/tools/finance/UAELeavePayCalculator')).default;
      case 'uae-credit-card-emi-calculator':
        return (await import('@/components/tools/finance/UAECreditCardEMICalculator')).default;
      case 'adcb-emi-calculator':
        return (await import('@/components/tools/finance/ADCBEMICalculator')).default;
      case 'mashreq-loan-calculator':
        return (await import('@/components/tools/finance/MashreqLoanCalculator')).default;
      case 'deem-loan-calculator':
        return (await import('@/components/tools/finance/DeemLoanCalculator')).default;
      case 'dbr-calculator-uae':
        return (await import('@/components/tools/finance/DBRCalculator')).default;
      case 'flat-interest-rate-calculator-uae':
        return (await import('@/components/tools/finance/FlatInterestRateCalculator')).default;
      case 'adcb-mortgage-calculator-dubai':
        return (await import('@/components/tools/finance/ADCBMortgageCalculator')).default;

      // ── HR & PAYROLL TOOLS ──
      case 'gratuity-calculator':
        return (await import('@/components/tools/hr-payroll/GratuityCalculator')).default;
      case 'notice-period-calculator':
        return (await import('@/components/tools/hr-payroll/NoticePeriodCalculator')).default;
      case 'leave-encashment-calculator':
        return (await import('@/components/tools/hr-payroll/LeaveEncashmentCalculator')).default;
      case 'uae-leave-settlement-calculator':
        return (await import('@/components/tools/hr-payroll/UAELeaveSettlementCalculator')).default;
      case 'uae-sick-leave-calculator':
        return (await import('@/components/tools/hr-payroll/UAESickLeaveCalculator')).default;
      case 'holiday-pay-calculator-uae':
      case 'uae-holiday-pay-calculator': // Consolidated duplicates
        return (await import('@/components/tools/hr-payroll/UAEHolidayPayCalculator')).default;
      case 'saudi-annual-leave-calculator':
        return (await import('@/components/tools/hr-payroll/SaudiAnnualLeaveCalculator')).default;
      case 'uae-gratuity-calculator':
        return (await import('@/components/tools/hr-payroll/UAEGratuityCalculator')).default;
      case 'uae-domestic-worker-gratuity-calculator':
        return (await import('@/components/tools/hr-payroll/UAEDomesticWorkerGratuityCalculator')).default;
      case 'uae-free-zone-gratuity-calculator':
        return (await import('@/components/tools/hr-payroll/UAEFreeZoneGratuityCalculator')).default;

      // ── ISLAMIC TOOLS ──
      case 'zakat-calculator':
        return (await import('@/components/tools/islamic-tools/ZakatCalculator')).default;
      case 'hijri-gregorian-converter':
        return (await import('@/components/tools/islamic-tools/HijriGregorianConverter')).default;
      case 'gold-zakat-calculator':
        return (await import('@/components/tools/islamic-tools/GoldZakatCalculator')).default;
      case 'cash-zakat-calculator':
        return (await import('@/components/tools/islamic-tools/CashZakatCalculator')).default;
      case 'tola-gold-zakat-calculator':
        return (await import('@/components/tools/islamic-tools/TolaGoldZakatCalculator')).default;
      case 'salary-zakat-calculator':
        return (await import('@/components/tools/islamic-tools/SalaryZakatCalculator')).default;

      // ── TAX & VAT TOOLS ──
      case 'uae-vat-calculator':
        return (await import('@/components/tools/tax-vat/UAEVatCalculator')).default;
      case 'ksa-vat-calculator':
        return (await import('@/components/tools/tax-vat/KSAVatCalculator')).default;

      // ── BUSINESS TOOLS ──
      case 'profit-margin-calculator':
        return (await import('@/components/tools/business/ProfitMarginCalculator')).default;
      case 'invoice-generator':
        return (await import('@/components/tools/business/InvoiceGenerator')).default;

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
  const BASE_URL     = 'https://gulftools.jobmeter.app'
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

  const badgeColor = categoryColorMap[category] ?? 'bg-gray-50 text-gray-700'

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
                      prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline
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
                    const relatedBadgeColor =
                      categoryColorMap[related.category] ?? 'bg-gray-50 text-gray-500'
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
                        <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors leading-snug">
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