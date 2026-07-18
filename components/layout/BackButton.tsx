'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

type BackButtonProps = {
  /** Where to go if there's no usable browser history (e.g. landed here directly from search). */
  fallbackHref: string
  /** Optional custom label; defaults to a localized "Back". */
  label?: string
  className?: string
}

export function BackButton({ fallbackHref, label, className }: BackButtonProps) {
  const router = useRouter()
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const text = label ?? (isRTL ? 'رجوع' : 'Back')

  return (
    <button
      type="button"
      onClick={() => {
        // If the user actually navigated here from within the site, a real
        // browser "back" feels the most natural. Otherwise (direct link,
        // fresh tab, external referrer) send them to a sensible parent page.
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back()
        } else {
          router.push(fallbackHref)
        }
      }}
      className={
        className ??
        'inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-700 transition-colors'
      }
    >
      <span className={isRTL ? 'rotate-180 inline-block' : 'inline-block'} aria-hidden="true">
        ←
      </span>
      {text}
    </button>
  )
}
