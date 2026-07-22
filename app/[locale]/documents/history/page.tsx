// 📁 app/[locale]/documents/history/page.tsx
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { BackButton } from '@/components/layout/BackButton';
import { localePath, localizedUrl } from '@/lib/i18n/paths';
import DocumentsHistoryClient from './client';

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return {
    title: 'Your Saved Documents | ToolBase',
    description: 'Documents you\u2019ve filled in from our free templates, saved locally on this device so you can come back and reopen them.',
    alternates: { canonical: localizedUrl(locale, `/documents/history`) },
    // Purely personal, device-local content — nothing here is the same
    // page twice for two different visitors, so it shouldn't be indexed.
    robots: { index: false, follow: true },
  };
}

export default async function DocumentsHistoryPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const breadcrumbItems = [
    { label: tNav('home'), href: localePath(locale) },
    { label: 'Documents', href: localePath(locale, `/documents`) },
    { label: 'Saved Documents', href: localePath(locale, `/documents/history`) },
  ];

  return (
    <>
      <Header locale={locale} activePath={localePath(locale, `/documents/history`)} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={localePath(locale, `/documents`)} />
        </div>

        <DocumentsHistoryClient locale={locale} />
      </div>

      <Footer locale={locale} />
    </>
  );
}
