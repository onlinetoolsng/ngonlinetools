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
      'ToolBase is a free suite of calculators and tools built for individuals and businesses in Nigeria.',
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
            <p className="text-gray-600 leading-relaxed">
              ToolBase is a suite of free calculators and tools designed for people
              and businesses in Nigeria — covering everyday finance, tax, payroll, and
              more. Every tool is built with local rules, currency, and context in mind.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              Why We Built This
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Many financial tools online aren't built with Nigeria in mind — they don't
              account for local tax rules, salary structures, or the naira. We wanted to
              build the tools we wished existed: free, accurate, and designed for
              Nigerian reality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              Completely Free, Always
            </h2>
            <p className="text-gray-600 leading-relaxed">
              All tools are completely free and require no registration or account
              creation. We support the site through advertising. We do not sell your
              data or collect personal information.
            </p>
          </section>
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
