// 📁 app/[locale]/contact/page.tsx
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'

type Params = { locale: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'اتصل بنا | ToolBase' : 'Contact Us | ToolBase',
    description:
      locale === 'ar'
        ? 'تواصل مع فريق ToolBase — لأي استفسار أو اقتراح أو تقرير عن خطأ'
        : 'Get in touch with the ToolBase team — for questions, suggestions or bug reports',
    robots: { index: true, follow: true },
  }
}

export default async function ContactPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const breadcrumbItems = [
    { label: tNav('home'), href: `/${locale}` },
    { label: isAr ? 'اتصل بنا' : 'Contact Us', href: `/${locale}/contact` },
  ]

  const contacts = [
    {
      icon: '✉️',
      label: isAr ? 'البريد الإلكتروني العام' : 'General Enquiries',
      value: 'hello@jobmeter.app',
      href: 'mailto:hello@jobmeter.app',
    },
    {
      icon: '🔒',
      label: isAr ? 'الخصوصية والبيانات' : 'Privacy & Data',
      value: 'hello@jobmeter.app',
      href: 'mailto:hello@jobmeter.app',
    },
    {
      icon: '🐛',
      label: isAr ? 'الإبلاغ عن خطأ' : 'Bug Reports',
      value: 'hello@jobmeter.app',
      href: 'mailto:hello@jobmeter.app',
    },
    {
      icon: '💼',
      label: isAr ? 'الشراكات والإعلانات' : 'Partnerships & Advertising',
      value: 'hello@jobmeter.app',
      href: 'mailto:hello@jobmeter.app',
    },
  ]

  return (
    <>
      <Header locale={locale} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={`/${locale}`} />
        </div>

        <div className="text-center py-10">
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            {isAr ? 'اتصل بنا' : 'Contact Us'}
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            {isAr
              ? 'يسعدنا سماع آرائك — سواء كان لديك اقتراح لأداة جديدة أو تريد الإبلاغ عن خطأ أو أي استفسار آخر'
              : "We'd love to hear from you — whether you have a tool suggestion, found a bug, or just want to say hello"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {contacts.map(c => (
            <a
              key={c.value}
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
            {isAr ? 'وقت الاستجابة المعتاد' : 'Typical response time'}
          </p>
          <p className="text-indigo-700 text-sm">
            {isAr ? '1–2 أيام عمل' : '1–2 business days'}
          </p>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}