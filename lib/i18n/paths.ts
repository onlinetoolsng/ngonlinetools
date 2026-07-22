import { routing } from './routing'

const BASE_URL = 'https://toolbase.com.ng'

/**
 * Builds an internal path for a link/href, respecting next-intl's
 * `localePrefix: 'as-needed'` behavior: the default locale gets NO prefix.
 *
 * Hardcoding `/${locale}/...` everywhere (the previous pattern across this
 * codebase) broke this site sitewide: since 'en' is both the only and the
 * default locale, next-intl's middleware treats any `/en/...` URL as a
 * superfluous prefix and 301-redirects it to the unprefixed path. Every
 * canonical tag, sitemap URL, and internal link built with `/${locale}/...`
 * was therefore pointing at a URL that immediately redirects elsewhere —
 * and the page it redirects to then declares ITS canonical as the very URL
 * that just redirected to it. That contradiction is a well-known signal to
 * search engines that a site's URLs aren't trustworthy, which is a very
 * plausible explanation for organic clicks/impressions collapsing to zero.
 *
 * Always build hrefs/canonicals through this helper (or `localizedUrl`
 * below) instead of a raw `/${locale}/...` template literal.
 */
export function localePath(locale: string, path: string = '/'): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  const cleanPath = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`
  return `${prefix}${cleanPath}` || '/'
}

/** Same as `localePath`, but returns an absolute URL — for canonical tags,
 *  OpenGraph URLs, JSON-LD, and sitemap entries. */
export function localizedUrl(locale: string, path: string = '/'): string {
  return `${BASE_URL}${localePath(locale, path)}`
}
