'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

type NavLink = {
  href: string
  label: string
  isActive: boolean
}

type Props = {
  navLinks: NavLink[]
}

export function MobileNav({ navLinks }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-indigo-700 hover:bg-gray-50 transition-colors"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 bg-white border-b border-gray-100 shadow-lg z-50">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  link.isActive
                    ? 'text-indigo-700 bg-indigo-50 font-semibold'
                    : 'text-gray-700 hover:text-indigo-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}
