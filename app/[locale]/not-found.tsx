// 📁 app/[locale]/not-found.tsx
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// next-intl provides locale via this in not-found pages
import { getLocale } from 'next-intl/server'

export default async function NotFound() {
  const locale = await getLocale()
  const isAr = locale === 'ar'

  return (
    <>
      <Header locale={locale} />

      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-black text-gray-900 mb-4">
          {isAr ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h1>
        <p className="text-gray-500 text-lg mb-10 leading-relaxed">
          {isAr
            ? 'لم نتمكن من إيجاد الصفحة التي تبحث عنها. ربما تم نقلها أو حذفها.'
            : "We couldn't find the page you're looking for. It may have been moved or removed."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {isAr ? '← العودة للرئيسية' : '← Back to Home'}
          </Link>
          <Link
            href={`/${locale}/tools`}
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {isAr ? 'تصفح الأدوات' : 'Browse Tools'}
          </Link>
        </div>

        {/* Quick links to popular tools */}
        <div className="mt-16 text-left">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
            {isAr ? 'الأدوات الشائعة' : 'Popular Tools'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { slug: 'salary-calculator',   cat: 'finance',       icon: '💵', name: isAr ? 'حاسبة الراتب'              : 'Salary Calculator' },
              { slug: 'gratuity-calculator', cat: 'hr-payroll',    icon: '📋', name: isAr ? 'حاسبة مكافأة نهاية الخدمة' : 'Gratuity Calculator' },
              { slug: 'zakat-calculator',    cat: 'islamic-tools', icon: '☪️', name: isAr ? 'حاسبة الزكاة'              : 'Zakat Calculator' },
            ].map(tool => (
              <Link
                key={tool.slug}
                href={`/${locale}/tools/${tool.cat}/${tool.slug}`}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all group"
              >
                <span className="text-2xl">{tool.icon}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 transition-colors">
                  {tool.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </>
  )
}