// 📁 app/[locale]/documents/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileCheck2, History } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { BackButton } from '@/components/layout/BackButton';
import { SchemaOrg } from '@/components/seo/SchemaOrg';
import { generateBreadcrumbSchema } from '@/lib/schema/schemas';
import { getAllPublishedTemplates } from '@/lib/documents/document-templates-data';
import { getDocumentType, getDocumentCountry } from '@/lib/documents/document-types';
import { localePath, localizedUrl } from '@/lib/i18n/paths'

type Params = { locale: string };

const BASE_URL = 'https://toolbase.com.ng';

// Without this, this page can get statically generated once (e.g. during
// the first build after this feature shipped, possibly before the
// document_templates table/migrations existed) and then serve that same
// cached result — including an empty/error state — on every request
// after, since nothing here calls a dynamic API to trigger a refetch.
// Same category of bug as the earlier blog dynamic-rendering fix: force
// this to run fresh on every request so newly published/edited templates
// show up immediately.
export const revalidate = 0;
export const dynamic = 'force-dynamic';


export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  return {
    title: 'Free Document Templates | ToolBase',
    description: 'Free, ready-to-use document templates for Nigeria — tenancy agreements, employment contracts, loan agreements, affidavits, and more. Fill in your details and download as PDF or Word.',
    alternates: { canonical: localizedUrl(locale, `/documents`) },
  };
}

export default async function DocumentsIndexPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const templates = await getAllPublishedTemplates();

  const grouped = new Map<string, typeof templates>();
  for (const t of templates) {
    const docType = getDocumentType(t.document_type);
    const category = docType?.category || 'Other';
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category)!.push(t);
  }

  const breadcrumbItems = [
    { label: tNav('home'), href: localePath(locale) },
    { label: 'Documents', href: localePath(locale, `/documents`) },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbItems.map(b => ({ name: b.label, url: `${BASE_URL}${b.href}` }))
  );

  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      <Header locale={locale} activePath={localePath(locale, `/documents`)} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mb-4">
          <BackButton fallbackHref={localePath(locale)} />
        </div>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileCheck2 className="h-4 w-4 text-indigo-600" />
              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Free · No Sign-Up</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Document Templates</h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
              Ready-made Nigerian document templates. Fill in your details and download as PDF or Word — instantly, no waiting.
            </p>
          </div>

          <Link
            href={localePath(locale, `/documents/history`)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 text-sm font-semibold rounded-full px-4 py-2.5 transition-colors flex-shrink-0"
          >
            <History className="h-4 w-4" />
            My Saved Documents
          </Link>
        </div>

        {templates.length === 0 && (
          <p className="text-sm text-gray-500">No templates published yet — check back soon.</p>
        )}

        <div className="space-y-10">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-xs font-bold tracking-widest uppercase text-indigo-700 mb-3">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(t => {
                  const docType = getDocumentType(t.document_type);
                  const docCountry = getDocumentCountry(t.country);
                  const label = docType?.label || t.title;
                  const countryFlag = docCountry?.flag || '\u{1F30D}';
                  const countryName = docCountry?.name || t.country.toUpperCase();
                  return (
                    <Link
                      key={t.id}
                      href={localePath(locale, `/documents/${t.document_type}/${t.country}`)}
                      className="group bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-md rounded-2xl p-4 transition-all"
                    >
                      <p className="font-bold text-gray-900 text-sm group-hover:text-indigo-800 transition-colors">{label}</p>
                      <p className="text-xs text-gray-500 mt-1">{countryFlag} {countryName}</p>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <Footer locale={locale} />
    </>
  );
}
