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
    description: 'ToolBase Privacy Policy — how we collect, use, and protect your data, including our use of Google AdSense and analytics cookies.',
    robots: { index: true, follow: true },
  }
}

const sections = [
  { id: 'overview', title: '1. Overview' },
  { id: 'information-we-collect', title: '2. Information We Collect' },
  { id: 'contact-form', title: '3. Contact Form Data' },
  { id: 'cookies', title: '4. Cookies & Similar Technologies' },
  { id: 'adsense', title: '5. Google AdSense & Advertising' },
  { id: 'analytics', title: '6. Google Analytics' },
  { id: 'data-sharing', title: '7. How We Share Data' },
  { id: 'data-retention', title: '8. Data Retention' },
  { id: 'data-security', title: '9. Data Security' },
  { id: 'childrens-privacy', title: '10. Children\u2019s Privacy' },
  { id: 'your-rights', title: '11. Your Rights (NDPR, GDPR & CCPA)' },
  { id: 'international-transfers', title: '12. International Data Transfers' },
  { id: 'do-not-track', title: '13. Do Not Track' },
  { id: 'changes', title: '14. Changes to This Policy' },
  { id: 'contact', title: '15. Contact Us' },
]

const cookieTypes = [
  { type: 'Necessary', purpose: 'Required for core site functionality, such as remembering your locale and basic session state.', canOptOut: 'No — required for the site to work' },
  { type: 'Analytics', purpose: 'Google Analytics — helps us understand which tools and pages are used, so we can prioritise fixes and new features.', canOptOut: 'Yes — via browser settings or opt-out add-on' },
  { type: 'Advertising', purpose: 'Google AdSense and its partners — used to serve and measure the advertisements that support this free site.', canOptOut: 'Yes — via Google Ads Settings' },
]

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
          <p className="text-sm text-gray-400 mb-6">
            {`Last updated: ${lastUpdated}`}
          </p>

          <p className="text-gray-600 leading-relaxed mb-8">
            This Privacy Policy explains what information ToolBase (&quot;we,&quot; &quot;us&quot;) collects
            when you visit toolbase.com.ng, why we collect it, and the choices available to
            you. ToolBase is built for a Nigerian audience and this policy is written with
            the Nigeria Data Protection Act 2023 (NDPR) in mind, alongside the EU General
            Data Protection Regulation (GDPR) and the California Consumer Privacy Act
            (CCPA) for visitors those laws apply to.
          </p>

          {/* Table of contents */}
          <nav aria-label="Table of contents" className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">On this page</p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {sections.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-indigo-700 hover:text-indigo-800 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-headings:scroll-mt-24 prose-h2:mt-10 prose-h2:mb-4 first:prose-h2:mt-0 prose-p:text-gray-600 prose-p:leading-relaxed prose-ul:my-4 prose-li:text-gray-600 prose-li:my-2">
            <h2 id="overview">1. Overview</h2>
            <p>
              ToolBase does not require account creation to use any calculator, document
              generator, or other tool on the site. You can use every tool anonymously. We
              collect a limited amount of information automatically to operate, secure, and
              improve the site, plus whatever you choose to submit through our contact form.
              We do not sell your personal data.
            </p>

            <h2 id="information-we-collect">2. Information We Collect</h2>
            <p>We collect two broad categories of information:</p>
            <ul>
              <li><strong>Automatically collected data:</strong> browser type and version, device and operating system, approximate location (derived from IP address), pages visited, time spent on each page, referring site, and general usage patterns, gathered via analytics and standard server logs.</li>
              <li><strong>Data you provide directly:</strong> the name, email address, topic, and message you enter into our contact form. Some tools also let you type figures (e.g. a salary amount) purely to calculate a result in your browser — these inputs are not sent to us or stored unless the tool explicitly says otherwise.</li>
            </ul>

            <h2 id="contact-form">3. Contact Form Data</h2>
            <p>
              If you use our contact form, we collect the name, email address, topic, and
              message you provide, store it securely in our database, and use it solely to
              respond to your enquiry, investigate a bug or accuracy report, or follow up on
              a partnership request. This information is only accessible to the small
              ToolBase team and is never sold, rented, or used for unrelated marketing.
            </p>

            <h2 id="cookies">4. Cookies &amp; Similar Technologies</h2>
            <p>Cookies are small text files stored on your device. We and our partners use the following categories:</p>
            <div className="not-prose overflow-x-auto my-4">
              <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2.5 font-bold text-gray-700">Type</th>
                    <th className="px-4 py-2.5 font-bold text-gray-700">Purpose</th>
                    <th className="px-4 py-2.5 font-bold text-gray-700">Can you opt out?</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieTypes.map(c => (
                    <tr key={c.type} className="border-t border-gray-100">
                      <td className="px-4 py-2.5 font-semibold text-gray-900 align-top">{c.type}</td>
                      <td className="px-4 py-2.5 text-gray-600 align-top">{c.purpose}</td>
                      <td className="px-4 py-2.5 text-gray-600 align-top">{c.canOptOut}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>You can control or delete cookies through your browser settings at any time. Blocking necessary cookies may affect how parts of the site function; blocking analytics or advertising cookies will not affect your ability to use any calculator or tool.</p>

            <h2 id="adsense">5. Google AdSense &amp; Advertising</h2>
            <p>
              We use Google AdSense to display advertisements that support this free site.
              Google and its advertising partners use cookies to serve ads based on a
              visitor&apos;s prior visits to this and other websites, and to measure how those
              ads perform. This is sometimes called interest-based or personalised
              advertising.
            </p>
            <p>
              You can opt out of personalised advertising, or see which companies are
              currently serving personalised ads to you, via{' '}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. If you are in the European Economic Area, Google&apos;s
              consent-based ad delivery framework governs how partner vendors may process
              your data for advertising on this site; you can review and adjust consent
              choices via{' '}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google&apos;s ad settings</a>. Third-party vendors, including Google, may also use
              cookies to serve ads based on your past visits to this and other websites — you
              can find a general overview of how Google uses data from sites that use its
              services at{' '}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google&apos;s Partner Sites policy</a>.
            </p>

            <h2 id="analytics">6. Google Analytics</h2>
            <p>
              We use Google Analytics to understand traffic and usage patterns across the
              site — which tools are most used, how visitors navigate between pages, and
              where errors occur. This service collects data about your use of the site in a
              form that is not directly tied to your name or contact details. You can opt out
              via the{' '}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
            </p>

            <h2 id="data-sharing">7. How We Share Data</h2>
            <p>
              We do not sell or rent your personal data. We share data only with the
              service providers necessary to operate the site — currently Google Analytics
              and Google AdSense (as described above) and Supabase, our database provider,
              which stores contact form submissions on our behalf under its own security
              controls. We may also disclose information where required by Nigerian law or
              a valid legal process.
            </p>

            <h2 id="data-retention">8. Data Retention</h2>
            <p>
              Contact form submissions are retained for as long as needed to resolve your
              enquiry and for a reasonable period afterward for our records, after which
              they are periodically deleted. Aggregated, anonymised analytics data may be
              retained longer, since it cannot reasonably be linked back to an individual
              visitor.
            </p>

            <h2 id="data-security">9. Data Security</h2>
            <p>
              We implement reasonable technical and organisational measures to protect the
              data we hold, including restricting database access and using row-level
              security on our contact form data so it cannot be read back out through the
              public parts of the site. No method of transmission over the internet or
              electronic storage is 100% secure, so we cannot guarantee absolute security.
            </p>

            <h2 id="childrens-privacy">10. Children&apos;s Privacy</h2>
            <p>
              ToolBase is not directed at children under the age of 13, and we do not
              knowingly collect personal information from children under 13. If you believe
              a child has provided us with personal information through our contact form,
              please contact us so we can delete it.
            </p>

            <h2 id="your-rights">11. Your Rights (NDPR, GDPR &amp; CCPA)</h2>
            <p>Depending on where you are located, you may have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict certain processing</li>
              <li>Withdraw consent to cookies or advertising at any time (see Sections 4 and 5)</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:onlinetoolsng@gmail.com">onlinetoolsng@gmail.com</a>. We will
              respond within a reasonable time and in line with applicable Nigerian, EU, or
              US state law.
            </p>

            <h2 id="international-transfers">12. International Data Transfers</h2>
            <p>
              Some of our service providers (including Google and Supabase) may process or
              store data outside Nigeria. Where this happens, we rely on those providers&apos;
              own safeguards and standard contractual protections for cross-border data
              transfer.
            </p>

            <h2 id="do-not-track">13. Do Not Track</h2>
            <p>
              Some browsers offer a &quot;Do Not Track&quot; signal. There is currently no
              universal industry standard for how sites should respond to this signal, so
              ToolBase does not currently change its behaviour based on it — you can still
              control tracking directly through the cookie and ad-personalisation opt-outs
              described above.
            </p>

            <h2 id="changes">14. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our
              practices or applicable law. We will notify you of any material changes by
              posting the new policy on this page and updating the &quot;Last updated&quot; date
              above.
            </p>

            <h2 id="contact">15. Contact Us</h2>
            <p>
              For any privacy-related questions or requests, contact us at{' '}
              <a href="mailto:onlinetoolsng@gmail.com">onlinetoolsng@gmail.com</a> or visit
              our{' '}
              <Link href={localePath(locale, '/contact')} className="text-indigo-700 hover:text-indigo-800">contact page</Link>.
            </p>
          </div>
        </div>
      </div>

      <Footer locale={locale} />
    </>
  )
}
