// 📁 app/[locale]/about/page.tsx
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { BackButton } from '@/components/layout/BackButton'

type Params = { locale: string }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  return {
    title:
      locale === 'ar'
        ? 'من نحن | Gulf Tools'
        : 'About Us | Gulf Tools',
    description:
      locale === 'ar'
        ? 'تعرّف على الفريق وراء Gulf Tools — أدوات مالية مجانية مبنية من قِبَل محاسبين ومهنيين مقيمين في دول الخليج'
        : 'Meet the team behind Gulf Tools — free financial calculators built by qualified accountants and professionals living and working across the Gulf.',
    robots: { index: true, follow: true },
  }
}

export default async function AboutPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const isAr = locale === 'ar'
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const breadcrumbItems = [
    { label: tNav('home'), href: `/${locale}` },
    { label: isAr ? 'من نحن' : 'About Us', href: `/${locale}/about` },
  ]

  const stats = [
    { value: '50+', label: isAr ? 'أداة مجانية' : 'Free Tools' },
    { value: '7',   label: isAr ? 'دول خليجية' : 'Gulf Countries' },
    { value: '2',   label: isAr ? 'لغة' : 'Languages' },
    { value: '0',   label: isAr ? 'تسجيل مطلوب' : 'Sign-ups Required' },
  ]

  const team = [
    {
      name: 'Victor Klen',
      nameAr: 'فيكتور كلن',
      role: isAr ? 'مؤسس ومحاسب قانوني معتمد — دبي، الإمارات' : 'Founder & Certified Accountant — Dubai, UAE',
      bioEn:
        'Victor is a certified accountant with over 12 years of experience working across the UAE and Eastern Europe. After relocating to Dubai as an expat in 2014, he spent years manually recalculating gratuity payouts, VAT obligations and loan schedules for clients who couldn\'t find reliable Gulf-specific tools online. Gulf Tools was born out of that frustration — every calculator on this site reflects the exact formulas Victor uses in professional practice, grounded in UAE Labour Law, Saudi GOSI regulations and GCC VAT frameworks.',
      bioAr:
        'فيكتور محاسب قانوني معتمد يتمتع بخبرة تزيد على 12 عامًا في الإمارات وأوروبا الشرقية. انتقل إلى دبي كمقيم أجنبي عام 2014، وأمضى سنوات في إعادة حساب مكافآت نهاية الخدمة وضريبة القيمة المضافة والقروض يدويًا لعملائه. وُلدت Gulf Tools من هذه المعاناة — كل حاسبة في الموقع تعكس المعادلات التي يستخدمها فيكتور في عمله المهني، استنادًا إلى قانون العمل الإماراتي وأنظمة التأمينات السعودية وأطر ضريبة القيمة المضافة الخليجية.',
      credentials: isAr
        ? ['محاسب قانوني معتمد (ACCA)', 'مقيم في دبي منذ 2014', 'متخصص في قانون العمل الإماراتي وضريبة القيمة المضافة']
        : ['ACCA Certified Accountant', 'Dubai resident since 2014', 'Specialist in UAE Labour Law & GCC VAT'],
    },
    {
      name: 'Omar Al-Rashidi',
      nameAr: 'عمر الراشدي',
      role: isAr ? 'مستشار مالي — الكويت' : 'Financial Consultant — Kuwait',
      bioEn:
        'Omar is a Kuwaiti financial consultant with a decade of experience advising SMEs and individual professionals across Kuwait, Qatar and Bahrain. He joined Gulf Tools to ensure every tool accurately reflects the regulatory nuances of Arabic-speaking Gulf nationals — from Zakat calculation under GAZT guidelines to Hijri date handling and GOSI contribution rates. Omar leads the Arabic localisation and validates all tools against the latest GCC regulatory updates.',
      bioAr:
        'عمر مستشار مالي كويتي يمتلك عشر سنوات من الخبرة في تقديم المشورة للشركات الصغيرة والمتوسطة والمهنيين في الكويت وقطر والبحرين. انضم إلى Gulf Tools لضمان دقة كل أداة فيما يخص الأنظمة الخاصة بمواطني الخليج — من حساب الزكاة وفق إرشادات هيئة الزكاة والضريبة والجمارك، إلى التواريخ الهجرية واشتراكات التأمينات الاجتماعية. يشرف عمر على التعريب ويتحقق من صحة الأدوات وفق أحدث التحديثات التنظيمية الخليجية.',
      credentials: isAr
        ? ['ماجستير في المالية — جامعة الكويت', 'خبير في أنظمة الزكاة والتأمينات الخليجية', 'مستشار معتمد لدى شركات في الكويت وقطر والبحرين']
        : ['MSc Finance — Kuwait University', 'Expert in GCC Zakat & social insurance regulations', 'Certified consultant to firms in Kuwait, Qatar and Bahrain'],
    },
  ]

  return (
    <>
      <Header locale={locale} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={`/${locale}`} />
        </div>

        {/* Hero */}
        <div className="text-center py-12">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
            {isAr ? 'من نحن' : 'About Gulf Tools'}
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'أدوات مالية مجانية بُنيت من قِبَل محاسبين ومهنيين يعيشون ويعملون في الخليج'
              : 'Free financial tools built by qualified accountants and professionals who live and work across the Gulf'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
              <div className="text-3xl font-black text-emerald-600 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-10 space-y-8 mb-10">
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              {isAr ? 'ما هو Gulf Tools؟' : 'What is Gulf Tools?'}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {isAr
                ? 'Gulf Tools هو مجموعة أدوات وحاسبات مالية مجانية مصممة خصيصًا للمقيمين في دول الخليج العربي — الإمارات والسعودية وقطر والكويت والبحرين وعُمان ومصر. كل أداة مبنية بمراعاة القوانين المحلية والعملات والأنظمة الخاصة بكل دولة، وتم التحقق من صحتها من قِبَل محاسبين ومستشارين ماليين مقيمين في المنطقة.'
                : 'Gulf Tools is a suite of free financial tools and calculators designed specifically for residents of the Arabian Gulf — UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman and Egypt. Every tool is built with local laws, currencies and regulations in mind, and validated by qualified accountants and financial consultants based in the region.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              {isAr ? 'لماذا بنينا هذا؟' : 'Why We Built This'}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {isAr
                ? 'معظم الأدوات المالية على الإنترنت مصممة للأسواق الغربية. لا تأخذ بعين الاعتبار مكافأة نهاية الخدمة، أو ضريبة القيمة المضافة بنسبة 5% أو 15%، أو التقويم الهجري، أو اشتراكات التأمينات الاجتماعية السعودية. بعد سنوات من الحساب اليدوي لهذه الأرقام لصالح العملاء، قرر فريقنا بناء الأدوات التي كنا نتمنى وجودها منذ البداية — مجانية، ودقيقة، ومصممة لواقع الخليج.'
                : 'Most financial tools online are built for Western markets. They don\'t account for end-of-service gratuity, 5% or 15% VAT, the Hijri calendar, or Saudi GOSI contributions. After years of manually calculating these figures for clients, our team decided to build the tools we always wished existed — free, accurate and designed for Gulf reality.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              {isAr ? 'دقة يمكن الوثوق بها' : 'Accuracy You Can Trust'}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {isAr
                ? 'كل حاسبة في Gulf Tools مبنية على أساس الأنظمة القانونية الرسمية: قانون العمل الإماراتي، ولوائح هيئة الزكاة والضريبة والجمارك، وأنظمة المؤسسة العامة للتأمينات الاجتماعية في السعودية، وأطر ضريبة القيمة المضافة لدول مجلس التعاون الخليجي. نحرص على تحديث أدواتنا عند كل تغيير تنظيمي.'
                : 'Every calculator on Gulf Tools is built on official regulatory frameworks: UAE Labour Law, GAZT guidelines, Saudi GOSI regulations and GCC VAT frameworks. We update our tools whenever regulations change.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-3">
              {isAr ? 'مجاني تمامًا، دائمًا' : 'Completely Free, Always'}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {isAr
                ? 'جميع الأدوات مجانية بالكامل ولا تتطلب تسجيلاً أو إنشاء حساب. ندعم الموقع من خلال الإعلانات. لا نبيع بياناتك ولا نجمع معلومات شخصية.'
                : 'All tools are completely free and require no registration or account creation. We support the site through advertising. We do not sell your data or collect personal information.'}
            </p>
          </section>
        </div>

        {/* Team */}
        <div className="mb-10">
          <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">
            {isAr ? 'الفريق' : 'The Team'}
          </h2>
          <div className="space-y-6">
            {team.map(member => (
              <div
                key={member.name}
                className="bg-white border border-gray-100 rounded-2xl p-8 sm:p-10"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-black text-gray-900">
                    {isAr ? member.nameAr : member.name}
                  </h3>
                  <p className="text-sm text-emerald-600 font-semibold mt-1">
                    {member.role}
                  </p>
                </div>
                <p className="text-gray-600 leading-relaxed mb-5">
                  {isAr ? member.bioAr : member.bioEn}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {member.credentials.map(c => (
                    <li
                      key={c}
                      className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            href={`/${locale}/tools`}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            {isAr ? 'تصفح جميع الأدوات ←' : 'Browse All Tools →'}
          </Link>
        </div>
      </div>
      <Footer locale={locale} />
    </>
  )
}
