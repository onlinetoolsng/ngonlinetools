// 📁 components/layout/CookieConsent.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const locale = useLocale()
  const isAr = locale === 'ar'

  useEffect(() => {
    const timer = setTimeout(() => {
      const accepted = localStorage.getItem('gt_cookie_accepted')
      if (!accepted) setIsVisible(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  function accept() {
    localStorage.setItem('gt_cookie_accepted', 'true')
    setIsVisible(false)
  }

  function decline() {
    localStorage.setItem('gt_cookie_accepted', 'declined')
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div
      role="dialog"
      aria-label={isAr ? 'إشعار ملفات تعريف الارتباط' : 'Cookie consent'}
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white shadow-2xl border-t border-gray-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          {/* Text */}
          <div className="flex items-start gap-3 text-sm leading-relaxed flex-1">
            <span className="text-xl flex-shrink-0 mt-0.5">🍪</span>
            <p className="text-gray-300">
              {isAr
                ? 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتقديم الإعلانات ذات الصلة. باستمرارك في استخدام الموقع، توافق على استخدامنا لها.'
                : 'We use cookies to improve your experience and serve relevant ads. By continuing to use this site, you agree to our use of cookies.'}
              {' '}
              <Link
                href={`/${locale}/privacy`}
                className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors"
              >
                {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </Link>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              {isAr ? 'رفض' : 'Decline'}
            </button>
            <button
              onClick={accept}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              {isAr ? 'قبول' : 'Accept All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
