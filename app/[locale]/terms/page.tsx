// 📁 app/[locale]/terms/page.tsx
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
    title: 'Terms of Service | ToolBase',
    description: 'Terms and conditions for using ToolBase',
    robots: { index: true, follow: true },
  }
}

export default async function TermsPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const breadcrumbItems = [
    { label: tNav('home'), href: localePath(locale) },
    { label: 'Terms of Service', href: localePath(locale, `/terms`) },
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
            Terms of Service
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {`Last updated: ${lastUpdated}`}
          </p>

          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
            <h2>1. Acceptance of Terms</h2>
            <p>By using ToolBase, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please stop using the site.</p>

            <h2>2. Description of Service</h2>
            <p>ToolBase provides free calculators and tools for informational purposes. Services include salary, tax, business, and other calculators built for the Nigerian market.</p>

            <h2>3. Disclaimer</h2>
            <p>The results provided by our tools are for informational and estimation purposes only. They do not constitute legal, financial, or tax advice. Always consult a qualified professional before making financial decisions.</p>

            <h2>4. Accuracy of Information</h2>
            <p>We strive to ensure the accuracy of all calculations, but we cannot guarantee they are error-free. Laws and regulations are subject to change. Always verify with official sources for the most current information.</p>

            <h2>5. Acceptable Use</h2>
            <p>You may use ToolBase for lawful purposes only. You must not:</p>
            <ul>
              <li>Use the site for any unlawful purpose</li>
              <li>Attempt to hack or disrupt site systems</li>
              <li>Copy or distribute site content without permission</li>
              <li>Use automated scraping or data extraction tools</li>
              <li>Submit false, misleading, or abusive content through the contact form or any other input on the site</li>
            </ul>

            <h2>6. Intellectual Property</h2>
            <p>All content, tools, and designs on this site are owned by or licensed to ToolBase. They may not be reused without prior written permission.</p>

            <h2>7. Advertising</h2>
            <p>The site displays advertisements from Google AdSense and other advertising networks. We are not responsible for the content of these advertisements or external links they lead to.</p>

            <h2>8. Limitation of Liability</h2>
            <p>ToolBase shall not be liable for any direct or indirect losses resulting from your use of the site or reliance on tool results.</p>

            <h2>9. Modifications</h2>
            <p>We reserve the right to modify these terms at any time. The last updated date at the top of this page will reflect any changes.</p>

            <h2>10. Governing Law</h2>
            <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>

            <h2>11. Contact</h2>
            <p>For any questions about these terms: <a href="mailto:hello@toolbase.com.ng">hello@toolbase.com.ng</a></p>
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}
