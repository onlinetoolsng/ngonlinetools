// 📁 app/[locale]/disclaimer/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
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
    title: 'Disclaimer | ToolBase',
    description:
      'ToolBase disclaimer — results are for informational purposes only and do not constitute professional advice',
    robots: { index: true, follow: true },
  }
}

export default async function DisclaimerPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const breadcrumbItems = [
    { label: tNav('home'), href: localePath(locale) },
    { label: 'Disclaimer', href: localePath(locale, `/disclaimer`) },
  ]

  const lastUpdated = 'July 23, 2026'

  return (
    <>
      <Header locale={locale} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={localePath(locale)} />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-10 mt-4">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Disclaimer
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {`Last updated: ${lastUpdated}`}
          </p>

          {/* Important notice banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <p className="text-amber-800 text-sm font-medium leading-relaxed">
              All tools and calculators on this site are for informational purposes only. Results are estimates and do not constitute legal, financial, or tax advice.
            </p>
          </div>

          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
            <h2>1. For Informational Purposes Only</h2>
            <p>All tools, calculators, and content on ToolBase are provided for general informational purposes only. They should not be relied upon as a substitute for specialised professional advice.</p>

            <h2>2. Not Financial Advice</h2>
            <p>The results of salary, loan, savings, and investment calculators do not constitute financial advice. Please consult a licensed financial advisor before making any investment or financial decisions.</p>

            <h2>3. Not Legal Advice</h2>
            <p>Information about labour law, employment terms, and payroll on this site does not constitute legal advice. Laws are subject to change and interpretations may vary. Consult a qualified lawyer or legal advisor for your specific situation.</p>

            <h2>4. Not Tax Advice</h2>
            <p>Tax, salary, and other financial calculators do not constitute tax or financial advice. Consult a licensed accountant or tax advisor to ensure full compliance with tax regulations in Nigeria. Our calculators are reviewed by a Chartered Accountant for accuracy, but they remain a starting point, not a substitute for personalised advice.</p>

            <h2>5. Accuracy of Calculations</h2>
            <p>We make every effort to ensure the accuracy of all calculations, but we cannot guarantee they are error-free. Laws, regulations, and rates are subject to change at any time. Always verify results against official sources.</p>

            <h2>6. External Links</h2>
            <p>The site may contain links to external websites. We are not responsible for the content of these sites or their privacy practices.</p>

            <h2>7. Advertising</h2>
            <p>The site displays third-party advertisements. We are not responsible for the content of these advertisements or the products and services they promote.</p>

            <h2>8. Limitation of Liability</h2>
            <p>ToolBase shall not be liable for any direct or indirect losses or damages arising from your use of the site or reliance on its information.</p>
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}
