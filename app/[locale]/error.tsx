// 📁 app/[locale]/error.tsx
// Catches unhandled errors anywhere in the [locale] route tree (blog, tools,
// static pages) and shows a friendly page instead of Next.js's generic
// "This page couldn't load / A server error occurred" screen.
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Route error boundary caught:', error)
  }, [error])

  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center">
      <div className="text-8xl mb-6">⚠️</div>
      <h1 className="text-4xl font-black text-gray-900 mb-4">
        Something went wrong
      </h1>
      <p className="text-gray-500 text-lg mb-10 leading-relaxed">
        This page hit an unexpected error. You can try again, or head back to
        the homepage.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-700 font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  )
}
