import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { localePath } from '@/lib/i18n/paths'

type Props = {
  locale: string
  activePath?: string
}

export async function Header({ locale, activePath }: Props) {
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  const navLinks = [
    { href: localePath(locale, `/tools`),      label: tNav('tools') },
    { href: localePath(locale, `/documents`),  label: tNav('documents') },
    { href: localePath(locale, `/blog`),       label: tNav('blog') },
  ]

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href={localePath(locale)} className="text-2xl font-black tracking-tight flex-shrink-0">
            <span className="text-indigo-700">Tool</span>
            <span className="text-gray-900">Base</span>
            <span className="text-amber-500">.com.ng</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map(link => {
              const isActive = activePath?.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    isActive
                      ? 'text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:text-indigo-700'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
