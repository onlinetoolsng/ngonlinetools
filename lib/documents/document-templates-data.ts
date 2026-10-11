// lib/documents/document-templates-data.ts
//
// Server-only Supabase data access for document_templates. Ported from
// naira.autos's lib/document-templates-data.ts, adapted to use
// createSupabasePublicClient() (this repo's convention).
//
// Types and the pure fillTemplate() logic live in
// ./document-templates-fill.ts instead of here, because that file must be
// safe to import from a Client Component — this file is not (it imports
// lib/supabase/client.ts, which pulls in `next/headers`).

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createSupabasePublicClient } from '@/lib/supabase/client';
import type { DocumentTemplateRow } from './document-templates-fill';

export type { DocumentTemplateField, DocumentTemplateRow } from './document-templates-fill';
export { fillTemplate } from './document-templates-fill';

// ── Fetch a single published template by (document type, country) ──────
export const getDocumentTemplate = cache(async function getDocumentTemplate(
  documentType: string,
  country: string
): Promise<DocumentTemplateRow | null> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('document_type', documentType)
    .eq('country', country)
    .eq('status', 'published')
    .single();

  if (error) {
    // PGRST116 = no matching row -> genuinely not published (page may 404).
    if (error.code === 'PGRST116') return null;
    // Real failure: throw so the weekly ISR cache never stores a 404 for a live template.
    console.error('[document-templates] getDocumentTemplate error:', error.message);
    throw new Error(`getDocumentTemplate failed: ${error.message}`);
  }
  return data as DocumentTemplateRow;
});

// ── All published (document_type, country) pairs — for generateStaticParams ──
export async function getAllPublishedTemplateParams(): Promise<{ type: string; country: string }[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('document_templates')
    .select('document_type, country')
    .eq('status', 'published');

  if (error) {
    console.error('[document-templates] getAllPublishedTemplateParams error:', error.message);
    return [];
  }
  return (data ?? []).map((r: { document_type: string; country: string }) => ({ type: r.document_type, country: r.country }));
}

// ── All published templates — SUMMARY ONLY ─────────────────────────────
// Every caller (homepage, /documents index, sitemap, RelatedContent) only
// needs identity + title + updated_at. The full rows carry large jsonb
// bodies (sections, fields, seo_intro), so selecting them here was a major
// Supabase egress cost. Cached for a day and tagged 'documents'.
export type DocumentTemplateSummary = Pick<
  DocumentTemplateRow,
  'id' | 'document_type' | 'country' | 'title' | 'updated_at'
>;

async function fetchPublishedTemplateSummaries(): Promise<DocumentTemplateSummary[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('document_templates')
    .select('id, document_type, country, title, updated_at')
    .eq('status', 'published')
    .order('document_type', { ascending: true });

  if (error) {
    console.error('[document-templates] getAllPublishedTemplates error:', error.message);
    // Throw so unstable_cache does NOT store an empty list for a day.
    throw new Error(error.message);
  }
  return (data ?? []) as DocumentTemplateSummary[];
}

const cachedTemplateSummaries = unstable_cache(
  fetchPublishedTemplateSummaries,
  ['published-template-summaries-v2'],
  { revalidate: 86400, tags: ['documents'] }
);

// Throws if Supabase fails. Pages that are cached (ISR / sitemap) must use this
// so a transient error is not stored as an empty list.
export async function getAllPublishedTemplates(): Promise<DocumentTemplateSummary[]> {
  return cachedTemplateSummaries();
}

// Best-effort variant for decorative uses (homepage tiles) where an empty list is
// an acceptable degradation.
export async function getAllPublishedTemplatesOrEmpty(): Promise<DocumentTemplateSummary[]> {
  try {
    return await cachedTemplateSummaries();
  } catch {
    return [];
  }
}
