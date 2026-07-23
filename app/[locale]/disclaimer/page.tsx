// 📁 app/[locale]/disclaimer/page.tsx
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
    title: 'Disclaimer | ToolBase',
    description:
      'ToolBase disclaimer — results are for informational purposes only and do not constitute professional advice',
    robots: { index: true, follow: true },
  }
}

const sections = [
  { id: 'informational', title: '1. For Informational Purposes Only' },
  { id: 'not-financial', title: '2. Not Financial or Investment Advice' },
  { id: 'not-legal', title: '3. Not Legal Advice' },
  { id: 'not-tax', title: '4. Not Tax or Accounting Advice' },
  { id: 'accuracy', title: '5. Accuracy of Calculations' },
  { id: 'documents', title: '6. Document Templates' },
  { id: 'external-links', title: '7. External Links' },
  { id: 'advertising', title: '8. Advertising & Third-Party Content' },
  { id: 'no-warranty', title: '9. No Warranty' },
  { id: 'liability', title: '10. Limitation of Liability' },
  { id: 'indemnification', title: '11. Indemnification' },
  { id: 'changes', title: '12. Changes to This Disclaimer' },
  { id: 'contact', title: '13. Contact' },
]

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
          <p className="text-sm text-gray-400 mb-6">
            {`Last updated: ${lastUpdated}`}
          </p>

          {/* Important notice banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <p className="text-amber-800 text-sm font-medium leading-relaxed">
              All tools and calculators on this site are for informational purposes only. Results are estimates and do not constitute legal, financial, or tax advice.
            </p>
          </div>

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

          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-headings:scroll-mt-24 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
            <h2 id="informational">1. For Informational Purposes Only</h2>
            <p>All tools, calculators, document templates, and content on ToolBase are provided for general informational purposes only. They should not be relied upon as a substitute for specialised professional advice tailored to your specific circumstances.</p>

            <h2 id="not-financial">2. Not Financial or Investment Advice</h2>
            <p>The results of salary, loan, savings, investment, and net worth calculators do not constitute financial or investment advice. Figures such as projected returns, loan repayment schedules, or savings targets are estimates based on the assumptions you enter and published rates at the time of calculation — actual outcomes depend on market conditions, lender terms, and other factors outside our control. Please consult a licensed financial advisor before making any investment or financial decisions.</p>

            <h2 id="not-legal">3. Not Legal Advice</h2>
            <p>Information about labour law, employment terms, tenancy agreements, and payroll on this site does not constitute legal advice, and using a document template does not create a lawyer-client relationship of any kind. Nigerian laws are subject to change, court interpretation can vary by jurisdiction, and your specific facts may change what applies to you. Consult a qualified lawyer or legal advisor for your specific situation before relying on any template or explanation here in a dispute or formal proceeding.</p>

            <h2 id="not-tax">4. Not Tax or Accounting Advice</h2>
            <p>Tax, PAYE, VAT, company income tax, and other financial calculators do not constitute tax or accounting advice, and do not replace filing guidance from the Nigeria Revenue Service (NRS) or a licensed practitioner. Consult a licensed accountant or tax advisor to ensure full compliance with tax regulations in Nigeria. Our calculators are reviewed by a Chartered Accountant for accuracy, but they remain a starting point for your own planning, not a substitute for personalised advice on your specific filing.</p>

            <h2 id="accuracy">5. Accuracy of Calculations</h2>
            <p>We make every effort to ensure the accuracy of all calculations, cross-checking formulas against primary legislation and official rate schedules. However, we cannot guarantee they are error-free. Laws, regulations, and rates are subject to change at any time, sometimes with limited notice, and a calculator may not immediately reflect the very latest amendment. Always verify results against official sources — the NRS, PenCom, the Corporate Affairs Commission, or your professional advisor — before relying on them for a filing, contract, or other formal decision.</p>

            <h2 id="documents">6. Document Templates</h2>
            <p>Document templates (such as tenancy agreements, offer letters, and invoices) are generic starting points built around commonly used Nigerian clauses. They are not customised for your transaction and may omit provisions relevant to your situation. Review any generated document carefully, and have it checked by a qualified professional before signing or relying on it, particularly for tenancy, employment, or other higher-value or higher-risk agreements.</p>

            <h2 id="external-links">7. External Links</h2>
            <p>The site may contain links to external websites, including government portals and third-party services. We are not responsible for the content, accuracy, or privacy practices of these sites, and a link does not imply our endorsement of the linked site&apos;s content.</p>

            <h2 id="advertising">8. Advertising &amp; Third-Party Content</h2>
            <p>The site displays third-party advertisements, including through Google AdSense. We are not responsible for the content of these advertisements, the products or services they promote, or the sites they link to. Advertisements are served by third-party networks and are not endorsed or vetted by ToolBase individually.</p>

            <h2 id="no-warranty">9. No Warranty</h2>
            <p>ToolBase and its tools are provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind, whether express or implied, including but not limited to implied warranties of accuracy, merchantability, fitness for a particular purpose, or non-infringement.</p>

            <h2 id="liability">10. Limitation of Liability</h2>
            <p>ToolBase shall not be liable for any direct, indirect, incidental, consequential, or special losses or damages arising from your use of the site, reliance on tool results, or any document generated using our templates, to the fullest extent permitted by Nigerian law.</p>

            <h2 id="indemnification">11. Indemnification</h2>
            <p>You agree to indemnify and hold ToolBase harmless from any claim, loss, or damage, including reasonable legal fees, arising from your use of the site or your reliance on any calculation, document, or content provided here in place of qualified professional advice.</p>

            <h2 id="changes">12. Changes to This Disclaimer</h2>
            <p>We may update this Disclaimer from time to time to reflect changes in our tools, applicable law, or our practices. The &quot;Last updated&quot; date at the top of this page will always reflect the most recent revision.</p>

            <h2 id="contact">13. Contact</h2>
            <p>
              Questions about this Disclaimer, or spotted a figure that looks wrong? Contact us at <a href="mailto:onlinetoolsng@gmail.com">onlinetoolsng@gmail.com</a> or through our{' '}
              <Link href={localePath(locale, '/contact')} className="text-indigo-700 hover:text-indigo-800">contact form</Link>.
            </p>
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}
