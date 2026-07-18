import createMiddleware from 'next-intl/middleware'
import { routing } from './lib/i18n/routing'

const intlMiddleware = createMiddleware(routing)

export default function middleware(request: import('next/server').NextRequest) {
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|sitemap|robots|ads\\.txt|.*\\..*).*)',],
}