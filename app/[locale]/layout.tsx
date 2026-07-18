import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/lib/i18n/routing'
import { Manrope } from 'next/font/google'
import { SchemaOrg } from '@/components/seo/SchemaOrg'
import { generateOrganizationSchema } from '@/lib/schema/schemas'

const manrope = { variable: 'font-test' }

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()

  const schema = generateOrganizationSchema()

  return (
    <html
      lang={locale}
      dir="ltr"
      className={manrope.variable}
    >
      <head>
        {/* DO NOT put React components here */}
      </head>

      <body className="font-[family-name:var(--font-manrope)] antialiased bg-gray-50 text-gray-900">
        {/* Schema MUST be inside body */}
        <SchemaOrg schema={schema} />

        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}