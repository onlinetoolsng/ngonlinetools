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

type Section = { id: string; title: string; paragraphs?: string[]; list?: string[] }

const sectionsBase: Section[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    paragraphs: ['By accessing or using ToolBase, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please stop using the site.'],
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    paragraphs: ['ToolBase does not require an account and does not knowingly collect information from children under 13. By using the Service, you confirm you are using it for lawful, personal, or legitimate business purposes.'],
  },
  {
    id: 'description',
    title: '3. Description of Service',
    paragraphs: ['ToolBase provides free calculators, document templates, and reference content for informational purposes. Services include salary, tax, pension, business, and other calculators built for the Nigerian market, along with a growing library of generic document templates such as tenancy agreements and offer letters.'],
  },
]

const sectionsAfterDisclaimer: Section[] = [
  {
    id: 'accuracy',
    title: '5. Accuracy of Information',
    paragraphs: ['We strive to ensure the accuracy of all calculations and content, and our tax and payroll tools are reviewed against current Nigerian legislation by a Chartered Accountant. However, we cannot guarantee they are error-free. Laws and regulations are subject to change. Always verify with official sources for the most current information.'],
  },
  {
    id: 'acceptable-use',
    title: '6. Acceptable Use',
    paragraphs: ['You may use ToolBase for lawful purposes only.'],
    list: [
      'Use the site for any unlawful purpose or in violation of any applicable Nigerian or international law',
      'Attempt to hack, disrupt, or gain unauthorised access to site systems or data',
      'Copy, resell, or distribute site content, tools, or templates without permission',
      'Use automated scraping, crawling, or bulk data extraction tools against the site',
      'Submit false, misleading, threatening, or abusive content through the contact form or any other input on the site',
      'Interfere with the display or delivery of advertisements on the site',
    ],
  },
]

const sectionsAfterPrivacy: Section[] = [
  {
    id: 'advertising',
    title: '9. Advertising',
    paragraphs: ['The site displays advertisements from Google AdSense and other advertising networks to keep every tool free to use. We are not responsible for the content of these advertisements or external links they lead to.'],
  },
  {
    id: 'third-party-links',
    title: '10. Third-Party Links',
    paragraphs: ['The Service may link to third-party websites, including government portals referenced for context (e.g. NRS, PenCom, CAC). We do not control and are not responsible for the content, accuracy, or availability of those external sites.'],
  },
  {
    id: 'liability',
    title: '11. Limitation of Liability',
    paragraphs: ['ToolBase shall not be liable for any direct, indirect, incidental, or consequential losses resulting from your use of the site, reliance on tool results, or use of any generated document, to the fullest extent permitted by law.'],
  },
  {
    id: 'indemnification',
    title: '12. Indemnification',
    paragraphs: ['You agree to indemnify and hold ToolBase harmless from any claims, damages, or expenses arising from your misuse of the Service or violation of these Terms.'],
  },
  {
    id: 'termination',
    title: '13. Termination of Access',
    paragraphs: ['We reserve the right to restrict or terminate your access to the Service, without notice, if we reasonably believe you have violated these Terms or misused the site.'],
  },
  {
    id: 'modifications',
    title: '14. Modifications',
    paragraphs: ['We reserve the right to modify these Terms at any time. The "Last updated" date at the top of this page will reflect any changes. Continued use of the Service after a change constitutes acceptance of the revised Terms.'],
  },
  {
    id: 'severability',
    title: '15. Severability',
    paragraphs: ['If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.'],
  },
  {
    id: 'governing-law',
    title: '16. Governing Law',
    paragraphs: ['These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to its conflict of law principles.'],
  },
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

  const tocItems = [
    ...sectionsBase.map(s => ({ id: s.id, title: s.title })),
    { id: 'disclaimer', title: '4. Disclaimer' },
    ...sectionsAfterDisclaimer.map(s => ({ id: s.id, title: s.title })),
    { id: 'contact-submissions', title: '7. Contact Form Submissions' },
    { id: 'intellectual-property', title: '8. Intellectual Property' },
    ...sectionsAfterPrivacy.map(s => ({ id: s.id, title: s.title })),
    { id: 'contact', title: '17. Contact' },
  ]

  function renderSection(s: Section) {
    return (
      <section key={s.id} id={s.id} className="mb-10 scroll-mt-24">
        <h2 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h2>
        {s.paragraphs && (
          <div className="space-y-3 mb-3">
            {s.paragraphs.map((p, i) => (
              <p key={i} className="text-gray-600 leading-relaxed">{p}</p>
            ))}
          </div>
        )}
        {s.list && (
          <ul className="list-disc pl-5 space-y-2">
            {s.list.map((item, i) => (
              <li key={i} className="text-gray-600 leading-relaxed">{item}</li>
            ))}
          </ul>
        )}
      </section>
    )
  }

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
          <nav aria-label="Table of contents" className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">On this page</p>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {tocItems.map(s => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-indigo-700 hover:text-indigo-800 hover:underline">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div>
            {sectionsBase.map(renderSection)}

            <section id="disclaimer" className="mb-10 scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Disclaimer</h2>
              <p className="text-gray-600 leading-relaxed">
                The results provided by our tools are for informational and estimation purposes only. They do not constitute legal, financial, or tax advice. Always consult a qualified professional before making financial, legal, or tax decisions. See our full{' '}
                <Link href={localePath(locale, '/disclaimer')} className="text-indigo-700 hover:text-indigo-800 underline underline-offset-2">Disclaimer</Link> for more detail.
              </p>
            </section>

            {sectionsAfterDisclaimer.map(renderSection)}

            <section id="contact-submissions" className="mb-10 scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact Form Submissions</h2>
              <p className="text-gray-600 leading-relaxed">
                When you submit a message through our contact form, you grant us the right to use that message solely to respond to you, investigate the issue you&apos;ve raised, or improve the Service. You are responsible for the accuracy of the information you submit. See our{' '}
                <Link href={localePath(locale, '/privacy')} className="text-indigo-700 hover:text-indigo-800 underline underline-offset-2">Privacy Policy</Link> for how this data is stored and protected.
              </p>
            </section>

            <section id="intellectual-property" className="mb-10 scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Intellectual Property</h2>
              <p className="text-gray-600 leading-relaxed">
                All content, tools, calculators, templates, and designs on this site are owned by or licensed to ToolBase, unless otherwise noted. They may not be reused, republished, or redistributed without prior written permission.
              </p>
            </section>

            {sectionsAfterPrivacy.map(renderSection)}

            <section id="contact" className="scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 mb-3">17. Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                For any questions about these Terms, contact us at{' '}
                <a href="mailto:onlinetoolsng@gmail.com" className="text-indigo-700 hover:text-indigo-800 underline underline-offset-2">onlinetoolsng@gmail.com</a> or through our{' '}
                <Link href={localePath(locale, '/contact')} className="text-indigo-700 hover:text-indigo-800 underline underline-offset-2">contact form</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}
