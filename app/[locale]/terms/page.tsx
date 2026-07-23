// 📁 app/[locale]/terms/page.tsx
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
    title: 'Terms of Service | ToolBase',
    description: 'Terms and conditions for using ToolBase',
    robots: { index: true, follow: true },
  }
}

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'eligibility', title: '2. Eligibility' },
  { id: 'description', title: '3. Description of Service' },
  { id: 'disclaimer', title: '4. Disclaimer' },
  { id: 'accuracy', title: '5. Accuracy of Information' },
  { id: 'acceptable-use', title: '6. Acceptable Use' },
  { id: 'contact-submissions', title: '7. Contact Form Submissions' },
  { id: 'intellectual-property', title: '8. Intellectual Property' },
  { id: 'advertising', title: '9. Advertising' },
  { id: 'third-party-links', title: '10. Third-Party Links' },
  { id: 'liability', title: '11. Limitation of Liability' },
  { id: 'indemnification', title: '12. Indemnification' },
  { id: 'termination', title: '13. Termination of Access' },
  { id: 'modifications', title: '14. Modifications' },
  { id: 'severability', title: '15. Severability' },
  { id: 'governing-law', title: '16. Governing Law' },
  { id: 'contact', title: '17. Contact' },
]

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
          <p className="text-sm text-gray-400 mb-6">
            {`Last updated: ${lastUpdated}`}
          </p>

          <p className="text-gray-600 leading-relaxed mb-8">
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of
            toolbase.com.ng and its calculators, document templates, and content
            (together, the &quot;Service&quot;). Please read them carefully before using the
            Service.
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
            <h2 id="acceptance">1. Acceptance of Terms</h2>
            <p>By accessing or using ToolBase, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please stop using the site.</p>

            <h2 id="eligibility">2. Eligibility</h2>
            <p>ToolBase does not require an account and does not knowingly collect information from children under 13. By using the Service, you confirm you are using it for lawful, personal, or legitimate business purposes.</p>

            <h2 id="description">3. Description of Service</h2>
            <p>ToolBase provides free calculators, document templates, and reference content for informational purposes. Services include salary, tax, pension, business, and other calculators built for the Nigerian market, along with a growing library of generic document templates such as tenancy agreements and offer letters.</p>

            <h2 id="disclaimer">4. Disclaimer</h2>
            <p>The results provided by our tools are for informational and estimation purposes only. They do not constitute legal, financial, or tax advice. Always consult a qualified professional before making financial, legal, or tax decisions. See our full <Link href={localePath(locale, '/disclaimer')} className="text-indigo-700 hover:text-indigo-800">Disclaimer</Link> for more detail.</p>

            <h2 id="accuracy">5. Accuracy of Information</h2>
            <p>We strive to ensure the accuracy of all calculations and content, and our tax and payroll tools are reviewed against current Nigerian legislation by a Chartered Accountant. However, we cannot guarantee they are error-free. Laws and regulations are subject to change. Always verify with official sources for the most current information.</p>

            <h2 id="acceptable-use">6. Acceptable Use</h2>
            <p>You may use ToolBase for lawful purposes only. You must not:</p>
            <ul>
              <li>Use the site for any unlawful purpose or in violation of any applicable Nigerian or international law</li>
              <li>Attempt to hack, disrupt, or gain unauthorised access to site systems or data</li>
              <li>Copy, resell, or distribute site content, tools, or templates without permission</li>
              <li>Use automated scraping, crawling, or bulk data extraction tools against the site</li>
              <li>Submit false, misleading, threatening, or abusive content through the contact form or any other input on the site</li>
              <li>Interfere with the display or delivery of advertisements on the site</li>
            </ul>

            <h2 id="contact-submissions">7. Contact Form Submissions</h2>
            <p>When you submit a message through our contact form, you grant us the right to use that message solely to respond to you, investigate the issue you&apos;ve raised, or improve the Service. You are responsible for the accuracy of the information you submit. See our <Link href={localePath(locale, '/privacy')} className="text-indigo-700 hover:text-indigo-800">Privacy Policy</Link> for how this data is stored and protected.</p>

            <h2 id="intellectual-property">8. Intellectual Property</h2>
            <p>All content, tools, calculators, templates, and designs on this site are owned by or licensed to ToolBase, unless otherwise noted. They may not be reused, republished, or redistributed without prior written permission.</p>

            <h2 id="advertising">9. Advertising</h2>
            <p>The site displays advertisements from Google AdSense and other advertising networks to keep every tool free to use. We are not responsible for the content of these advertisements or external links they lead to. See our <Link href={localePath(locale, '/privacy')} className="text-indigo-700 hover:text-indigo-800">Privacy Policy</Link> for details on how advertising cookies work.</p>

            <h2 id="third-party-links">10. Third-Party Links</h2>
            <p>The Service may link to third-party websites, including government portals referenced for context (e.g. NRS, PenCom, CAC). We do not control and are not responsible for the content, accuracy, or availability of those external sites.</p>

            <h2 id="liability">11. Limitation of Liability</h2>
            <p>ToolBase shall not be liable for any direct, indirect, incidental, or consequential losses resulting from your use of the site, reliance on tool results, or use of any generated document, to the fullest extent permitted by law.</p>

            <h2 id="indemnification">12. Indemnification</h2>
            <p>You agree to indemnify and hold ToolBase harmless from any claims, damages, or expenses arising from your misuse of the Service or violation of these Terms.</p>

            <h2 id="termination">13. Termination of Access</h2>
            <p>We reserve the right to restrict or terminate your access to the Service, without notice, if we reasonably believe you have violated these Terms or misused the site.</p>

            <h2 id="modifications">14. Modifications</h2>
            <p>We reserve the right to modify these Terms at any time. The &quot;Last updated&quot; date at the top of this page will reflect any changes. Continued use of the Service after a change constitutes acceptance of the revised Terms.</p>

            <h2 id="severability">15. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</p>

            <h2 id="governing-law">16. Governing Law</h2>
            <p>These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to its conflict of law principles.</p>

            <h2 id="contact">17. Contact</h2>
            <p>For any questions about these Terms, contact us at <a href="mailto:onlinetoolsng@gmail.com">onlinetoolsng@gmail.com</a> or through our <Link href={localePath(locale, '/contact')} className="text-indigo-700 hover:text-indigo-800">contact form</Link>.</p>
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}
