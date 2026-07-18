// 📁 app/[locale]/terms/page.tsx
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'

type Params = { locale: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'شروط الخدمة | OnlineToolsNG' : 'Terms of Service | OnlineToolsNG',
    description:
      locale === 'ar'
        ? 'شروط وأحكام استخدام موقع OnlineToolsNG'
        : 'Terms and conditions for using OnlineToolsNG',
    robots: { index: true, follow: true },
  }
}

export default async function TermsPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const breadcrumbItems = [
    { label: tNav('home'), href: `/${locale}` },
    { label: isAr ? 'شروط الخدمة' : 'Terms of Service', href: `/${locale}/terms` },
  ]

  const lastUpdated = 'May 18, 2026'

  return (
    <>
      <Header locale={locale} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={`/${locale}`} />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-10 mt-4">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            {isAr ? 'شروط الخدمة' : 'Terms of Service'}
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {isAr ? `آخر تحديث: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
          </p>

          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
            {isAr ? (
              <>
                <h2>1. القبول بالشروط</h2>
                <p>باستخدامك لموقع OnlineToolsNG، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء منها، يرجى التوقف عن استخدام الموقع.</p>

                <h2>2. وصف الخدمة</h2>
                <p>يوفر OnlineToolsNG أدوات وحاسبات مجانية للاستخدام المعلوماتي فقط. تشمل الخدمات حاسبات الرواتب والزكاة وضريبة القيمة المضافة ومكافأة نهاية الخدمة وغيرها.</p>

                <h2>3. إخلاء المسؤولية</h2>
                <p>النتائج التي تقدمها أدواتنا هي للأغراض المعلوماتية والتقديرية فحسب. لا تُعدّ هذه النتائج استشارة قانونية أو مالية أو ضريبية. استشر متخصصاً مؤهلاً قبل اتخاذ أي قرارات مالية.</p>

                <h2>4. دقة المعلومات</h2>
                <p>نسعى لضمان دقة جميع الحسابات، إلا أننا لا نضمن خلوّها من الأخطاء. القوانين واللوائح عرضة للتغيير. تحقق دائماً من المصادر الرسمية للحصول على أحدث المعلومات.</p>

                <h2>5. الاستخدام المقبول</h2>
                <p>يحق لك استخدام OnlineToolsNG للأغراض القانونية المشروعة فقط. يُحظر عليك:</p>
                <ul>
                  <li>استخدام الموقع لأي غرض غير قانوني</li>
                  <li>محاولة اختراق أو تعطيل أنظمة الموقع</li>
                  <li>نسخ أو توزيع محتوى الموقع دون إذن</li>
                  <li>استخدام برامج الزحف أو الاستخراج الآلي للبيانات</li>
                </ul>

                <h2>6. الملكية الفكرية</h2>
                <p>جميع المحتويات والأدوات والتصاميم على هذا الموقع هي ملك لشبكة JobMeter أو مرخصة لها. لا يجوز إعادة استخدامها دون إذن خطي مسبق.</p>

                <h2>7. الإعلانات</h2>
                <p>يعرض الموقع إعلانات من Google AdSense وشبكات إعلانية أخرى. لا نتحمل مسؤولية محتوى هذه الإعلانات أو الروابط الخارجية التي تؤدي إليها.</p>

                <h2>8. تحديد المسؤولية</h2>
                <p>لن تكون شبكة JobMeter أو OnlineToolsNG مسؤولة عن أي خسائر مباشرة أو غير مباشرة ناتجة عن استخدامك للموقع أو الاعتماد على نتائج الأدوات.</p>

                <h2>9. التعديلات</h2>
                <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيُشار إلى تاريخ آخر تحديث في أعلى هذه الصفحة.</p>

                <h2>10. القانون المطبّق</h2>
                <p>تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة.</p>

                <h2>11. التواصل</h2>
                <p>لأي استفسار حول هذه الشروط: <a href="mailto:hello@jobmeter.app">hello@jobmeter.app</a></p>
              </>
            ) : (
              <>
                <h2>1. Acceptance of Terms</h2>
                <p>By using OnlineToolsNG, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please stop using the site.</p>

                <h2>2. Description of Service</h2>
                <p>OnlineToolsNG provides free calculators and tools for informational purposes. Services include salary, zakat, VAT, gratuity calculators and more.</p>

                <h2>3. Disclaimer</h2>
                <p>The results provided by our tools are for informational and estimation purposes only. They do not constitute legal, financial, or tax advice. Always consult a qualified professional before making financial decisions.</p>

                <h2>4. Accuracy of Information</h2>
                <p>We strive to ensure the accuracy of all calculations, but we cannot guarantee they are error-free. Laws and regulations are subject to change. Always verify with official sources for the most current information.</p>

                <h2>5. Acceptable Use</h2>
                <p>You may use OnlineToolsNG for lawful purposes only. You must not:</p>
                <ul>
                  <li>Use the site for any unlawful purpose</li>
                  <li>Attempt to hack or disrupt site systems</li>
                  <li>Copy or distribute site content without permission</li>
                  <li>Use automated scraping or data extraction tools</li>
                </ul>

                <h2>6. Intellectual Property</h2>
                <p>All content, tools, and designs on this site are owned by or licensed to the JobMeter network. They may not be reused without prior written permission.</p>

                <h2>7. Advertising</h2>
                <p>The site displays advertisements from Google AdSense and other advertising networks. We are not responsible for the content of these advertisements or external links they lead to.</p>

                <h2>8. Limitation of Liability</h2>
                <p>The JobMeter network and OnlineToolsNG shall not be liable for any direct or indirect losses resulting from your use of the site or reliance on tool results.</p>

                <h2>9. Modifications</h2>
                <p>We reserve the right to modify these terms at any time. The last updated date at the top of this page will reflect any changes.</p>

                <h2>10. Governing Law</h2>
                <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>

                <h2>11. Contact</h2>
                <p>For any questions about these terms: <a href="mailto:hello@jobmeter.app">hello@jobmeter.app</a></p>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}