// 📁 app/[locale]/documents/[type]/[country]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getDocumentTemplate, getAllPublishedTemplateParams } from '@/lib/documents/document-templates-data';
import { getDocumentType, getDocumentCountry, type DocumentTypeDef, type DocumentCountryDef } from '@/lib/documents/document-types';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { BackButton } from '@/components/layout/BackButton';
import { SchemaOrg } from '@/components/seo/SchemaOrg';
import { generateBreadcrumbSchema } from '@/lib/schema/schemas';
import TemplateDocumentClient from './client';

const BASE_URL = 'https://toolbase.com.ng';

// ── Static params (ISR) ───────────────────────────────────────────
export async function generateStaticParams() {
  const params = await getAllPublishedTemplateParams();
  // locale is fixed to 'en' on this site; still return { locale, type, country }
  // so Next can build the full param set if more locales are added later.
  return params.map(p => ({ locale: 'en', type: p.type, country: p.country }));
}

// TEMPORARY: forces every request to hit Supabase directly with zero caching,
// so newly-added templates show up immediately without a redeploy. Because
// this page also uses generateStaticParams, revalidate=0 alone isn't
// reliable once a page has been statically generated on Vercel — this is
// the actual override. Remove this line once you're done adding templates
// regularly and want normal ISR caching back.
export const revalidate = 0;
export const dynamic = 'force-dynamic';

// Supabase is the real source of truth for whether a template page exists —
// DOCUMENT_TYPES/DOCUMENT_COUNTRIES only enrich a page when the slug happens
// to match one of the site's known labels/categories. When it doesn't
// match, the page still renders using the template's own title/country
// code instead of 404ing.
function resolveDocType(slug: string, templateTitle: string): DocumentTypeDef {
  return getDocumentType(slug) ?? {
    slug,
    label: templateTitle,
    description: '',
    tier: 'template',
    category: 'Other',
    popular: false,
  };
}

function resolveDocCountry(code: string): DocumentCountryDef {
  return getDocumentCountry(code) ?? {
    code,
    name: code.toUpperCase(),
    flag: '\u{1F30D}',
    popular: false,
  };
}

// ── Metadata ──────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string; country: string }>;
}): Promise<Metadata> {
  const { locale, type, country } = await params;
  const template = await getDocumentTemplate(type, country);
  if (!template) return { title: 'Document Not Found | ToolBase' };

  const docType = resolveDocType(type, template.title);
  const docCountry = resolveDocCountry(country);

  const title = `${docType.label} Template (Free) | ToolBase`;
  const description = `Free, ready-to-use ${docType.label} for ${docCountry.name}. Fill in your details, edit inline, then download as PDF or Word — no sign-up required.`;
  const url = `${BASE_URL}/${locale}/documents/${type}/${country}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function TemplateDocumentPage({
  params,
}: {
  params: Promise<{ locale: string; type: string; country: string }>;
}) {
  const { locale, type, country } = await params;
  setRequestLocale(locale);

  // Supabase decides existence, not the fixed DOCUMENT_TYPES list.
  const template = await getDocumentTemplate(type, country);
  if (!template) notFound();

  const docType = resolveDocType(type, template.title);
  const docCountry = resolveDocCountry(country);
  const url = `${BASE_URL}/${locale}/documents/${type}/${country}`;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: `${BASE_URL}/${locale}` },
    { name: 'Documents', url: `${BASE_URL}/${locale}/documents` },
    { name: docType.label, url },
  ]);

  const breadcrumbItems = [
    { label: 'Home', href: `/${locale}` },
    { label: 'Documents', href: `/${locale}/documents` },
    { label: docType.label, href: `/${locale}/documents/${docType.slug}/${docCountry.code}` },
  ];

  return (
    <>
      <SchemaOrg schema={breadcrumbSchema} />
      <Header locale={locale} activePath={`/${locale}/documents`} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="no-print">
          <Breadcrumb items={breadcrumbItems} />
          <div className="mb-2">
            <BackButton fallbackHref={`/${locale}/documents`} />
          </div>
        </div>

        <TemplateDocumentClient template={template} docType={docType} docCountry={docCountry} />
      </div>

      <Footer locale={locale} />
    </>
  );
}
