// 📁 app/[locale]/disclaimer/page.tsx
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'

type Params = { locale: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  return {
    title: locale === 'ar' ? 'إخلاء المسؤولية | ToolBase' : 'Disclaimer | ToolBase',
    description:
      locale === 'ar'
        ? 'إخلاء مسؤولية ToolBase — النتائج لأغراض معلوماتية فقط وليست استشارة مهنية'
        : 'ToolBase disclaimer — results are for informational purposes only and do not constitute professional advice',
    robots: { index: true, follow: true },
  }
}

export default async function DisclaimerPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const breadcrumbItems = [
    { label: tNav('home'), href: `/${locale}` },
    { label: isAr ? 'إخلاء المسؤولية' : 'Disclaimer', href: `/${locale}/disclaimer` },
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
            {isAr ? 'إخلاء المسؤولية' : 'Disclaimer'}
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {isAr ? `آخر تحديث: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
          </p>

          {/* Important notice banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <p className="text-amber-800 text-sm font-medium leading-relaxed">
              {isAr
                ? 'جميع الأدوات والحاسبات على هذا الموقع مخصصة للأغراض المعلوماتية فقط. النتائج تقديرية وليست استشارة قانونية أو مالية أو ضريبية.'
                : 'All tools and calculators on this site are for informational purposes only. Results are estimates and do not constitute legal, financial, or tax advice.'}
            </p>
          </div>

          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
            {isAr ? (
              <>
                <h2>1. للأغراض المعلوماتية فقط</h2>
                <p>جميع الأدوات والحاسبات والمحتوى على موقع ToolBase مقدَّمة للأغراض المعلوماتية العامة فقط. لا ينبغي الاعتماد عليها كبديل عن المشورة المهنية المتخصصة.</p>

                <h2>2. ليست استشارة مالية</h2>
                <p>لا تُعدّ نتائج حاسبات الرواتب والقروض والمدخرات والاستثمارات استشارة مالية. يرجى استشارة مستشار مالي مرخص قبل اتخاذ أي قرارات استثمارية أو مالية.</p>

                <h2>2. ليست استشارة قانونية</h2>
                <p>لا تُعدّ معلومات قانون العمل ومكافأة نهاية الخدمة وفترة الإشعار والتأشيرات المقدَّمة على هذا الموقع استشارة قانونية. القوانين عرضة للتغيير وقد تختلف التفسيرات. استشر محامياً أو مستشاراً قانونياً مختصاً لحالتك الخاصة.</p>

                <h2>3. ليست استشارة ضريبية</h2>
                <p>لا تُعدّ حاسبات ضريبة القيمة المضافة والزكاة والضرائب الأخرى استشارة ضريبية. استشر محاسباً أو مستشاراً ضريبياً مرخصاً لضمان الامتثال الكامل للأنظمة الضريبية في بلدك.</p>

                <h2>4. دقة الحسابات</h2>
                <p>نبذل قصارى جهدنا لضمان دقة جميع الحسابات، إلا أننا لا نضمن خلوّها من الأخطاء. القوانين واللوائح والمعدلات عرضة للتغيير في أي وقت. تحقق دائماً من النتائج مع المصادر الرسمية.</p>

                <h2>5. روابط خارجية</h2>
                <p>قد يحتوي الموقع على روابط لمواقع خارجية. لا نتحمل مسؤولية محتوى هذه المواقع أو سياسات الخصوصية المتبعة فيها.</p>

                <h2>6. الإعلانات</h2>
                <p>يعرض الموقع إعلانات من طرف ثالث. لا نتحمل مسؤولية محتوى هذه الإعلانات أو المنتجات والخدمات التي تروّج لها.</p>

                <h2>7. تحديد المسؤولية</h2>
                <p>لن تتحمل شبكة JobMeter أو ToolBase أي مسؤولية عن أي خسائر أو أضرار مباشرة أو غير مباشرة ناتجة عن استخدامك للموقع أو الاعتماد على معلوماته.</p>
              </>
            ) : (
              <>
                <h2>1. For Informational Purposes Only</h2>
                <p>All tools, calculators, and content on ToolBase are provided for general informational purposes only. They should not be relied upon as a substitute for specialised professional advice.</p>

                <h2>2. Not Financial Advice</h2>
                <p>The results of salary, loan, savings, and investment calculators do not constitute financial advice. Please consult a licensed financial advisor before making any investment or financial decisions.</p>

                <h2>3. Not Legal Advice</h2>
                <p>Information about labour law, employment terms, and payroll on this site does not constitute legal advice. Laws are subject to change and interpretations may vary. Consult a qualified lawyer or legal advisor for your specific situation.</p>

                <h2>4. Not Tax Advice</h2>
                <p>Tax, salary, and other financial calculators do not constitute tax or financial advice. Consult a licensed accountant or tax advisor to ensure full compliance with tax regulations in Nigeria.</p>

                <h2>5. Accuracy of Calculations</h2>
                <p>We make every effort to ensure the accuracy of all calculations, but we cannot guarantee they are error-free. Laws, regulations, and rates are subject to change at any time. Always verify results against official sources.</p>

                <h2>6. External Links</h2>
                <p>The site may contain links to external websites. We are not responsible for the content of these sites or their privacy practices.</p>

                <h2>7. Advertising</h2>
                <p>The site displays third-party advertisements. We are not responsible for the content of these advertisements or the products and services they promote.</p>

                <h2>8. Limitation of Liability</h2>
                <p>The JobMeter network and ToolBase shall not be liable for any direct or indirect losses or damages arising from your use of the site or reliance on its information.</p>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}