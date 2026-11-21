import Link from 'next/link'
import { REVIEWER } from '@/lib/site/people'
import { localePath } from '@/lib/i18n/paths'

// "Reviewed by Henry Agwu, Chartered Accountant (ICAN) · Last reviewed March 2026"
// The date is only shown when we actually have one for the page.
export function ReviewedBy({
  locale,
  lastReviewed,
  className = '',
}: {
  locale: string
  lastReviewed?: string | null
  className?: string
}) {
  const date = lastReviewed ? new Date(lastReviewed) : null
  const dateLabel =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString('en-NG', { year: 'numeric', month: 'long' })
      : null

  return (
    <p className={`text-sm text-gray-500 ${className}`}>
      <span aria-hidden="true">✓ </span>
      Reviewed by{' '}
      <Link
        href={`${localePath(locale, '/about')}#${REVIEWER.id}`}
        className="font-semibold text-gray-700 hover:text-indigo-700 underline-offset-2 hover:underline"
      >
        {REVIEWER.name}
      </Link>
      , {REVIEWER.title}
      {dateLabel && <> · Last reviewed {dateLabel}</>}
    </p>
  )
}
