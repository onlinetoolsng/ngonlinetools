// 📁 app/[locale]/about/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'
import { localePath } from '@/lib/i18n/paths'

type Params = { locale: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return {
    title: 'About Us | ToolBase',
    description:
      'ToolBase is a free suite of calculators and tools built for individuals and businesses in Nigeria, reviewed by Henry Agwu, a Chartered Accountant with over 10 years of experience.',
    robots: { index: true, follow: true },
  }
}

export default async function AboutPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const breadcrumbItems = [
    { label: tNav('home'), href: localePath(locale) },
    { label: 'About Us', href: localePath(locale, `/about`) },
  ]

  const stats = [
    { value: '10',   label: 'Categories' },
    { value: '100%', label: 'Free' },
    { value: '🇳🇬',   label: 'Made for Nigeria' },
    { value: '0',    label: 'Sign-ups Required' },
  ]

  const editorialSteps = [
    {
      title: 'We start with the source',
      body: 'Every calculator is built directly from primary legislation and official rate schedules — the Nigeria Tax Act, Pension Reform Act, National Housing Fund Act, CAC guidelines, and circulars from the Nigeria Revenue Service (NRS), PenCom, and the Federal Ministry of Finance — not from secondhand blog posts or outdated PDFs.',
    },
    {
      title: 'We test the numbers',
      body: 'Before a tool goes live, its calculations are checked against worked examples and, where relevant, cross-checked against payroll and accounting practice by our reviewer, Henry Agwu.',
    },
    {
      title: 'We watch for change',
      body: 'Nigerian tax and finance rules move — the 2025 Tax Act overhaul is a recent example. When a law, rate, or threshold changes, we update the affected calculators and note the change, rather than leaving stale figures live.',
    },
    {
      title: 'We welcome correction',
      body: 'If you spot a figure that looks off, we want to hear about it. Every tool page links back to our contact form, and bug or accuracy reports are the enquiries we prioritise first.',
    },
  ]

  return (
    <>
      <Header locale={locale} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={localePath(locale)} />
        </div>

        {/* Hero */}
        <div className="text-center py-12">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            About ToolBase
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Free calculators and tools built for individuals and businesses in Nigeria
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
              <div className="text-3xl font-black text-indigo-700 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-10 space-y-8 mb-10">
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              What is ToolBase?
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              ToolBase is a suite of free calculators and tools designed for people
              and businesses in Nigeria — covering everyday finance, tax, payroll, business
              registration, and personal planning. Every tool is built with local rules,
              currency, and context in mind, and kept up to date as Nigerian tax law and
              regulation change.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our tools fall into a handful of everyday categories: salary and PAYE
              calculators, pension and NHF contributions, VAT and company income tax,
              CAC registration and compliance, loan and investment planning, payslip and
              invoice generation, and a growing set of document templates such as tenancy
              agreements and offer letters. Each one is designed so a Nigerian individual,
              freelancer, HR officer, or small business owner can get an accurate answer in
              under a minute, without needing an accountant on standby for routine questions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              Why We Built This
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Many financial tools online aren&apos;t built with Nigeria in mind — they don&apos;t
              account for local tax rules, salary structures, or the naira. Global calculators
              routinely miss things that matter here: the difference between pensionable
              emoluments and gross pay, the 2025 Tax Act&apos;s rent relief provisions, or the
              specific documentation the Corporate Affairs Commission expects for annual
              returns.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We wanted to build the tools we wished existed: free, accurate, and designed
              for Nigerian reality, from PAYE and pension to invoicing and business
              registration. That means naira formatting by default, statutory rates that
              match what the NRS and PenCom actually publish, and language written for
              people who need an answer today, not a finance degree to interpret one.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              How We Keep Our Tools Accurate
            </h2>
            <div className="space-y-4">
              {editorialSteps.map(step => (
                <div key={step.title} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{step.title}</p>
                    <p className="text-gray-600 leading-relaxed text-sm">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              Completely Free, Always
            </h2>
            <p className="text-gray-600 leading-relaxed">
              All tools are completely free and require no registration or account
              creation. We support the site through display advertising served by Google
              AdSense and similar networks — you can read exactly how that works, and what
              data it involves, on our <Link href={localePath(locale, '/privacy')} className="text-indigo-700 hover:text-indigo-800 font-medium">Privacy Policy</Link>. We do not sell your personal
              data, and we do not put any tool behind a paywall.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              What ToolBase Is Not
            </h2>
            <p className="text-gray-600 leading-relaxed">
              ToolBase is an informational and estimation tool, not a substitute for a
              licensed accountant, tax adviser, or lawyer. Our calculators are designed to
              get you a reliable, well-sourced estimate quickly — but decisions with real
              financial or legal consequences (a tax filing, a business registration, a
              tenancy dispute) should always be checked with a qualified professional. See
              our <Link href={localePath(locale, '/disclaimer')} className="text-indigo-700 hover:text-indigo-800 font-medium">Disclaimer</Link> for the full detail.
            </p>
          </section>
        </div>

        {/* Author / editorial credibility */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-10 mb-10">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            Who&apos;s Behind the Numbers
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-black text-indigo-700 flex-shrink-0">
              HA
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Henry Agwu</h3>
              <p className="text-sm font-semibold text-indigo-700 mb-3">
                Chartered Accountant, 10+ Years of Professional Experience
              </p>
              <p className="text-gray-600 leading-relaxed mb-3">
                The tax, payroll, and financial logic behind ToolBase&apos;s calculators is
                reviewed by Henry Agwu, a Chartered Accountant with over a decade of
                professional experience in Nigerian tax compliance, payroll, and financial
                reporting. Henry&apos;s work ensures every calculator — from PAYE and pension
                to VAT and company income tax — reflects current Nigerian statutory rates
                and regulations, so the numbers you see are ones you can rely on for real
                decisions.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Henry&apos;s review covers both the underlying formulas — making sure a PAYE
                band or pension rate matches what&apos;s actually in force — and the plain-language
                explanations that accompany each tool, so the &quot;why&quot; behind a number is as
                accurate as the number itself.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 sm:p-10 mb-10 text-center">
          <h2 className="text-xl font-black text-gray-900 mb-2">
            Spotted an Error or Have a Tool Suggestion?
          </h2>
          <p className="text-gray-600 mb-5 max-w-xl mx-auto">
            We review every accuracy report personally. If a calculator gave you a figure
            that doesn&apos;t look right, or you&apos;d like to see a new tool built, we&apos;d like to
            know.
          </p>
          <Link
            href={localePath(locale, `/contact`)}
            className="inline-flex items-center gap-2 bg-white border border-indigo-200 hover:border-indigo-300 text-indigo-700 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Get in Touch →
          </Link>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href={localePath(locale, `/tools`)}
            className="inline-flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            Browse All Tools →
          </Link>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}
