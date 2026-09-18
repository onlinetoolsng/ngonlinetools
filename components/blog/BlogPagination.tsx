import Link from 'next/link'

type BlogPaginationProps = {
  page: number
  totalPages: number
  buildHref: (page: number) => string
  isAr: boolean
}

export function BlogPagination({ page, totalPages, buildHref, isAr }: BlogPaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageList(page, totalPages)
  const prevHref = buildHref(Math.max(1, page - 1))
  const nextHref = buildHref(Math.min(totalPages, page + 1))

  return (
    <nav
      className="mt-12 flex items-center justify-center gap-1.5 flex-wrap"
      aria-label={isAr ? 'ترقيم الصفحات' : 'Pagination'}
    >
      <PageLink href={prevHref} disabled={page === 1}>
        {isAr ? 'التالي' : 'Prev'}
      </PageLink>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">
            …
          </span>
        ) : (
          <PageLink key={p} href={buildHref(p as number)} active={p === page}>
            {p}
          </PageLink>
        )
      )}

      <PageLink href={nextHref} disabled={page === totalPages}>
        {isAr ? 'السابق' : 'Next'}
      </PageLink>
    </nav>
  )
}

function PageLink({
  href,
  active,
  disabled,
  children,
}: {
  href: string
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  if (disabled) {
    return (
      <span className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-100 text-gray-300 cursor-not-allowed">
        {children}
      </span>
    )
  }

  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? 'bg-indigo-700 border-indigo-700 text-white'
          : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-700'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </Link>
  )
}

/** Windowed page list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20 */
function getPageList(current: number, total: number): (number | '…')[] {
  const delta = 1
  const range: (number | '…')[] = []
  const left = Math.max(2, current - delta)
  const right = Math.min(total - 1, current + delta)

  range.push(1)
  if (left > 2) range.push('…')
  for (let i = left; i <= right; i++) range.push(i)
  if (right < total - 1) range.push('…')
  if (total > 1) range.push(total)

  return range
}
