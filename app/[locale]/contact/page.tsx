// 📁 app/[locale]/contact/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'
import { ContactForm } from '@/components/contact/ContactForm'
import { localePath } from '@/lib/i18n/paths'

type Params = { locale: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return {
    title: 'Contact Us | ToolBase',
    description:
      'Get in touch with the ToolBase team — for questions, tool suggestions, or bug reports.',
    robots: { index: true, follow: true },
  }
}

const contacts = [
  {
    icon: '✉️',
    label: 'General Enquiries',
    value: 'hello@toolbase.com.ng',
    href: 'mailto:hello@toolbase.com.ng',
  },
  {
    icon: '🔒',
    label: 'Privacy & Data',
    value: 'privacy@toolbase.com.ng',
    href: 'mailto:privacy@toolbase.com.ng',
  },
  {
    icon: '🐛',
    label: 'Bug Reports',
    value: 'feedback@toolbase.com.ng',
    href: 'mailto:feedback@toolbase.com.ng',
  },
  {
    icon: '💼',
    label: 'Partnerships & Advertising',
    value: 'hello@toolbase.com.ng',
    href: 'mailto:hello@toolbase.com.ng',
  },
]

export default async function ContactPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const breadcrumbItems = [
    { label: tNav('home'), href: localePath(locale) },
    { label: 'Contact Us', href: localePath(locale, `/contact`) },
  ]

  return (
    <>
      <Header locale={locale} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={localePath(locale)} />
        </div>

        <div className="text-center py-10">
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            Contact Us
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            We&apos;d love to hear from you — whether you have a tool suggestion, found a bug, or just want to say hello
          </p>
        </div>

        {/* Contact form */}
        <div className="mb-10">
          <ContactForm />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {contacts.map(c => (
            <a
              key={c.label}
              href={c.href}
              className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-sm transition-all group"
            >
              <div className="text-2xl mb-3">{c.icon}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
                {c.label}
              </div>
              <div className="text-indigo-700 font-semibold group-hover:text-indigo-800 transition-colors text-sm">
                {c.value}
              </div>
            </a>
          ))}
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center">
          <p className="text-indigo-900 font-medium mb-1">
            Typical response time
          </p>
          <p className="text-indigo-700 text-sm">
            1–2 business days
          </p>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}
