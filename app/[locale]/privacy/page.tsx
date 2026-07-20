// 📁 app/[locale]/privacy/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'

type Params = { locale: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  setRequestLocale(locale)
  return {
    title: locale === 'ar' ? 'سياسة الخصوصية | ToolBase' : 'Privacy Policy | ToolBase',
    description:
      locale === 'ar'
        ? 'سياسة الخصوصية لموقع ToolBase — كيف نجمع بياناتك ونستخدمها ونحميها'
        : 'ToolBase Privacy Policy — how we collect, use and protect your data',
    robots: { index: true, follow: true },
  }
}

export default async function PrivacyPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  setRequestLocale(locale)
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const breadcrumbItems = [
    { label: tNav('home'), href: `/${locale}` },
    { label: isAr ? 'سياسة الخصوصية' : 'Privacy Policy', href: `/${locale}/privacy` },
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
            {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {isAr ? `آخر تحديث: ${lastUpdated}` : `Last updated: ${lastUpdated}`}
          </p>

          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">

            {isAr ? (
              <>
                <h2>1. المعلومات التي نجمعها</h2>
                <p>
                  لا يطلب موقع ToolBase إنشاء حساب أو تقديم معلومات شخصية لاستخدام أدواتنا. نجمع تلقائياً معلومات غير شخصية تشمل: نوع المتصفح، نظام التشغيل، الصفحات التي تزورها، ومدة زيارتك.
                </p>

                <h2>2. ملفات تعريف الارتباط (Cookies)</h2>
                <p>
                  يستخدم موقعنا ملفات تعريف الارتباط لتحسين تجربتك. تشمل:
                </p>
                <ul>
                  <li><strong>ملفات ضرورية:</strong> لتشغيل الموقع بشكل صحيح</li>
                  <li><strong>ملفات تحليلية:</strong> عبر Google Analytics لفهم كيفية استخدام الموقع</li>
                  <li><strong>ملفات إعلانية:</strong> عبر Google AdSense لعرض إعلانات ذات صلة</li>
                </ul>

                <h2>3. Google AdSense</h2>
                <p>
                  نستخدم Google AdSense لعرض الإعلانات. قد تستخدم Google ملفات تعريف الارتباط لعرض إعلانات بناءً على زياراتك السابقة لهذا الموقع ومواقع أخرى. يمكنك إلغاء الاشتراك في الإعلانات المخصصة من خلال <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">إعدادات إعلانات Google</a>.
                </p>

                <h2>4. Google Analytics</h2>
                <p>
                  نستخدم Google Analytics لتحليل حركة الزيارات. تجمع هذه الخدمة بيانات مجهولة الهوية حول استخدامك للموقع. يمكنك إلغاء التتبع عبر <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">إضافة إيقاف Google Analytics</a>.
                </p>

                <h2>5. مشاركة البيانات</h2>
                <p>
                  لا نبيع بياناتك الشخصية أو نشاركها مع أطراف ثالثة، باستثناء مزودي الخدمات الضروريين (Google Analytics، Google AdSense، Supabase) لتشغيل الموقع.
                </p>

                <h2>6. أمان البيانات</h2>
                <p>
                  نطبق إجراءات أمنية معقولة لحماية بياناتك. لا توجد طريقة نقل عبر الإنترنت أو تخزين إلكتروني آمنة بنسبة 100%، لذا لا يمكننا ضمان الأمان المطلق.
                </p>

                <h2>7. حقوقك</h2>
                <p>
                  يحق لك: الوصول إلى بياناتك، تصحيحها، حذفها، والاعتراض على معالجتها. للتواصل معنا: <a href="mailto:hello@jobmeter.app">hello@jobmeter.app</a>
                </p>

                <h2>8. التغييرات على هذه السياسة</h2>
                <p>
                  قد نحدّث سياسة الخصوصية هذه من حين لآخر. سنخطرك بأي تغييرات جوهرية عبر نشر السياسة الجديدة على هذه الصفحة.
                </p>
              </>
            ) : (
              <>
                <h2>1. Information We Collect</h2>
                <p>
                  ToolBase does not require account creation or personal information to use our tools. We automatically collect non-personal information including browser type, operating system, pages visited, and session duration via analytics.
                </p>

                <h2>2. Cookies</h2>
                <p>We use cookies to improve your experience. These include:</p>
                <ul>
                  <li><strong>Necessary cookies:</strong> Required for the site to function correctly</li>
                  <li><strong>Analytics cookies:</strong> Via Google Analytics to understand how the site is used</li>
                  <li><strong>Advertising cookies:</strong> Via Google AdSense to serve relevant advertisements</li>
                </ul>

                <h2>3. Google AdSense</h2>
                <p>
                  We use Google AdSense to display advertisements. Google may use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalised advertising via <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
                </p>

                <h2>4. Google Analytics</h2>
                <p>
                  We use Google Analytics to analyse traffic. This service collects anonymised data about your use of the site. You can opt out via the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
                </p>

                <h2>5. Data Sharing</h2>
                <p>
                  We do not sell or share your personal data with third parties, except necessary service providers (Google Analytics, Google AdSense, Supabase) required to operate the site.
                </p>

                <h2>6. Data Security</h2>
                <p>
                  We implement reasonable security measures to protect your data. No method of transmission over the internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
                </p>

                <h2>7. Your Rights</h2>
                <p>
                  You have the right to access, correct, delete your data, and object to its processing. Contact us at: <a href="mailto:hello@jobmeter.app">hello@jobmeter.app</a>
                </p>

                <h2>8. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy periodically. We will notify you of any material changes by posting the new policy on this page.
                </p>

                <h2>9. Contact</h2>
                <p>
                  For any privacy-related questions, contact us at <a href="mailto:hello@jobmeter.app">hello@jobmeter.app</a> or visit <a href="https://jobmeter.app">jobmeter.app</a>.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer locale={locale} />
    </>
  )
}