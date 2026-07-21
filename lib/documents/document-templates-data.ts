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

import { createSupabasePublicClient } from '@/lib/supabase/client';
import type { DocumentTemplateRow } from './document-templates-fill';

export type { DocumentTemplateField, DocumentTemplateRow } from './document-templates-fill';
export { fillTemplate } from './document-templates-fill';

// ── Fetch a single published template by (document type, country) ──────
export async function getDocumentTemplate(
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
    if (error.code !== 'PGRST116') {
      console.error('[document-templates] getDocumentTemplate error:', error.message);
    }
    return null;
  }
  return data as DocumentTemplateRow;
}

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

// ── All published templates — for the /documents index page ────────────
export async function getAllPublishedTemplates(): Promise<DocumentTemplateRow[]> {
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('status', 'published')
    .order('document_type', { ascending: true });

  if (error) {
    console.error('[document-templates] getAllPublishedTemplates error:', error.message);
    return [];
  }
  return (data ?? []) as DocumentTemplateRow[];
}
