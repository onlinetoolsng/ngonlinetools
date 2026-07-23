// 📁 app/[locale]/privacy/page.tsx
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
    title: 'Privacy Policy | ToolBase',
    description: 'ToolBase Privacy Policy — how we collect, use and protect your data',
    robots: { index: true, follow: true },
  }
}

export default async function PrivacyPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const breadcrumbItems = [
    { label: tNav('home'), href: localePath(locale) },
    { label: 'Privacy Policy', href: localePath(locale, `/privacy`) },
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
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {`Last updated: ${lastUpdated}`}
          </p>

          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
            <h2>1. Information We Collect</h2>
            <p>
              ToolBase does not require account creation or personal information to use our tools. We automatically collect non-personal information including browser type, operating system, pages visited, and session duration via analytics.
            </p>

            <h2>2. Contact Form</h2>
            <p>
              If you use our contact form, we collect the name, email address, topic, and message you provide, so we can respond to your enquiry. This information is stored securely and is only accessible to the ToolBase team — it is never sold or shared for marketing purposes.
            </p>

            <h2>3. Cookies</h2>
            <p>We use cookies to improve your experience. These include:</p>
            <ul>
              <li><strong>Necessary cookies:</strong> Required for the site to function correctly</li>
              <li><strong>Analytics cookies:</strong> Via Google Analytics to understand how the site is used</li>
              <li><strong>Advertising cookies:</strong> Via Google AdSense to serve relevant advertisements</li>
            </ul>

            <h2>4. Google AdSense</h2>
            <p>
              We use Google AdSense to display advertisements. Google may use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalised advertising via <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
            </p>

            <h2>5. Google Analytics</h2>
            <p>
              We use Google Analytics to analyse traffic. This service collects anonymised data about your use of the site. You can opt out via the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
            </p>

            <h2>6. Data Sharing</h2>
            <p>
              We do not sell or share your personal data with third parties, except necessary service providers (Google Analytics, Google AdSense, Supabase) required to operate the site.
            </p>

            <h2>7. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your data. No method of transmission over the internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
            </p>

            <h2>8. Your Rights</h2>
            <p>
              You have the right to access, correct, delete your data, and object to its processing. Contact us at: <a href="mailto:privacy@toolbase.com.ng">privacy@toolbase.com.ng</a>
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of any material changes by posting the new policy on this page.
            </p>

            <h2>10. Contact</h2>
            <p>
              For any privacy-related questions, contact us at <a href="mailto:privacy@toolbase.com.ng">privacy@toolbase.com.ng</a> or visit our{' '}
              <Link href={localePath(locale, '/contact')} className="text-indigo-700 hover:text-indigo-800">contact page</Link>.
            </p>
          </div>
        </div>
      </div>

      <Footer locale={locale} />
    </>
  )
}
