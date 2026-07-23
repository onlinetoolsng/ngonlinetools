// 📁 app/[locale]/contact/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
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
      'Get in touch with the ToolBase team — for questions, tool suggestions, accuracy reports, or bug reports.',
    robots: { index: true, follow: true },
  }
}

const CONTACT_EMAIL = 'onlinetoolsng@gmail.com'

const contacts = [
  {
    icon: '✉️',
    label: 'General Enquiries',
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
  },
  {
    icon: '🔒',
    label: 'Privacy & Data',
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
  },
  {
    icon: '🐛',
    label: 'Bug & Accuracy Reports',
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
  },
  {
    icon: '💼',
    label: 'Partnerships & Advertising',
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
  },
]

const faqs = [
  {
    q: 'I think a calculator gave me the wrong number. What should I do?',
    a: 'Select "Bug & Accuracy Reports" as your topic and tell us which tool, the inputs you used, and what result you expected. These reports go to the top of our queue — every one is checked against the underlying law or rate schedule by our reviewer, a Chartered Accountant.',
  },
  {
    q: 'Can you build a tool that doesn\u2019t exist yet?',
    a: 'Yes — tool suggestions are one of the main reasons this contact form exists. Tell us what the tool should calculate and who it\u2019s for, and we\u2019ll add it to our roadmap.',
  },
  {
    q: 'Do you offer paid accounting, tax, or legal advice?',
    a: 'No. ToolBase is a free self-service tools platform, not an advisory firm. We can\u2019t review your individual tax filing or contract, but our tools are built to give you an accurate starting estimate you can take to a licensed professional.',
  },
  {
    q: 'How do I request my data be deleted?',
    a: 'Email us using the "Privacy & Data" topic. Since ToolBase doesn\u2019t require an account, in most cases the only personal data we hold about you is what you\u2019ve submitted through this form — see our Privacy Policy for the full detail.',
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

        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-center mb-10">
          <p className="text-indigo-900 font-medium mb-1">
            Typical response time
          </p>
          <p className="text-indigo-700 text-sm">
            1–2 business days
          </p>
        </div>

        {/* About the team / who reads this */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-3">Who You&apos;ll Reach</h2>
          <p className="text-gray-600 leading-relaxed">
            ToolBase is built and maintained by a small Nigeria-based team. Messages
            submitted here are read directly by that team — accuracy and bug reports are
            checked against current Nigerian tax and financial regulation by our reviewer,
            Henry Agwu, a Chartered Accountant with over 10 years of professional
            experience. You can read more about our editorial process on the{' '}
            <Link href={localePath(locale, '/about')} className="text-indigo-700 hover:text-indigo-800 font-medium">
              About page
            </Link>
            .
          </p>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-10">
          <h2 className="text-xl font-black text-gray-900 mb-5">Frequently Asked Questions</h2>
          <div className="divide-y divide-gray-100">
            {faqs.map(faq => (
              <div key={faq.q} className="py-4 first:pt-0 last:pb-0">
                <p className="font-semibold text-gray-900 mb-1.5">{faq.q}</p>
                <p className="text-gray-600 leading-relaxed text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}
