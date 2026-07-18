import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

type Props = {
  locale: string
}

export async function Footer({ locale }: Props) {
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const isAr = locale === 'ar'

  const categories = [
    { slug: 'finance',        icon: '💰' },
    { slug: 'hr-payroll',     icon: '👥' },
    { slug: 'islamic-tools',  icon: '☪️' },
    { slug: 'tax-vat',        icon: '🧾' },
    { slug: 'business',       icon: '🏢' },
    { slug: 'real-estate',    icon: '🏠' },
  ]

  const locations = [
    { slug: 'uae',     flag: '🇦🇪', name: isAr ? 'الإمارات'  : 'UAE' },
    { slug: 'saudi',   flag: '🇸🇦', name: isAr ? 'السعودية' : 'Saudi Arabia' },
    { slug: 'qatar',   flag: '🇶🇦', name: isAr ? 'قطر'       : 'Qatar' },
    { slug: 'kuwait',  flag: '🇰🇼', name: isAr ? 'الكويت'   : 'Kuwait' },
    { slug: 'bahrain', flag: '🇧🇭', name: isAr ? 'البحرين'  : 'Bahrain' },
    { slug: 'oman',    flag: '🇴🇲', name: isAr ? 'عُمان'     : 'Oman' },
    { slug: 'egypt',   flag: '🇪🇬', name: isAr ? 'مصر'       : 'Egypt' },
  ]

  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

          {/* Brand */}
          <div>
            <Link href={`/${locale}`} className="inline-block mb-3">
              <span className="text-2xl font-black text-emerald-600 tracking-tight">
                Gulf<span className="text-gray-900">Tools</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              {isAr
                ? 'أدوات مجانية مصممة للمقيمين والمهنيين والشركات في منطقة الخليج.'
                : 'Free tools built for expats, professionals and businesses across the Gulf.'}
            </p>
            <Link
              href={locale === 'en' ? '/ar' : '/en'}
              className="inline-block mt-4 text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 text-gray-500 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
            >
              {locale === 'en' ? '🌐 عربي' : '🌐 English'}
            </Link>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              {isAr ? 'الفئات' : 'Categories'}
            </h3>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat.slug}>
                  <Link
                    href={`/${locale}/tools/${cat.slug}`}
                    className="text-sm text-gray-500 hover:text-emerald-600 transition-colors flex items-center gap-2"
                  >
                    <span>{cat.icon}</span>
                    <span className="capitalize">{cat.slug.replace(/-/g, ' ')}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`/${locale}/tools`}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  {isAr ? 'جميع الفئات ←' : 'All categories →'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              {isAr ? 'الدول' : 'Locations'}
            </h3>
            <ul className="space-y-2">
              {locations.map(loc => (
                <li key={loc.slug}>
                  <Link
                    href={`/${locale}/location/${loc.slug}`}
                    className="text-sm text-gray-500 hover:text-emerald-600 transition-colors flex items-center gap-2"
                  >
                    <span>{loc.flag}</span>
                    <span>{loc.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Gulf Tools. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          <div className="flex items-center gap-4">
<Link href={`/${locale}/tools`} className="hover:text-gray-600 transition-colors">
  {tNav('tools')}
</Link>

<Link href={`/${locale}/blog`} className="hover:text-gray-600 transition-colors">
  {tNav('blog')}
</Link>

<Link href={`/${locale}/location`} className="hover:text-gray-600 transition-colors">
  {tNav('locations')}
</Link>

<Link href={`/${locale}/about`} className="hover:text-gray-600 transition-colors">
  {tNav('about')}
</Link>

<Link href={`/${locale}/contact`} className="hover:text-gray-600 transition-colors">
  {tNav('contact')}
</Link>

<Link href={`/${locale}/disclaimer`} className="hover:text-gray-600 transition-colors">
  {tNav('disclaimer')}
</Link>

<Link href={`/${locale}/privacy`} className="hover:text-gray-600 transition-colors">
  {tNav('privacy')}
</Link>

<Link href={`/${locale}/terms`} className="hover:text-gray-600 transition-colors">
  {tNav('terms')}
</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}