import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { CATEGORIES } from '@/lib/registry/categories'

type Props = {
  locale: string
}

export async function Footer({ locale }: Props) {
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const categories = CATEGORIES.slice(0, 6)

  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          {/* Brand */}
          <div>
            <Link href={`/${locale}`} className="inline-block mb-3">
              <span className="text-2xl font-black tracking-tight">
                <span className="text-indigo-700">Online</span>
                <span className="text-gray-900">Tools</span>
                <span className="text-amber-500">NG</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Free calculators and tools built for individuals and businesses in Nigeria.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Categories
            </h3>
            <ul className="space-y-2">
              {categories.map(cat => (
                <li key={cat.slug}>
                  <Link
                    href={`/${locale}/tools/${cat.slug}`}
                    className="text-sm text-gray-500 hover:text-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <span>{cat.icon}</span>
                    <span className="capitalize">{cat.slug.replace(/-/g, ' ')}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`/${locale}/tools`}
                  className="text-sm text-indigo-700 hover:text-indigo-800 font-medium transition-colors"
                >
                  All categories →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} ToolBase. All rights reserved.</p>
          <div className="flex items-center gap-4">
<Link href={`/${locale}/tools`} className="hover:text-gray-600 transition-colors">
  {tNav('tools')}
</Link>

<Link href={`/${locale}/blog`} className="hover:text-gray-600 transition-colors">
  {tNav('blog')}
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