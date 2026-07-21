// lib/documents/document-templates-data.ts
//
// Ported from naira.autos's lib/document-templates-data.ts. Adapted to use
// createSupabasePublicClient() (this repo's convention) instead of a bare
// `supabase` singleton import.

import { createSupabasePublicClient } from '@/lib/supabase/client';

export interface DocumentTemplateField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number';
  placeholder?: string;
  required: boolean;
}

export interface DocumentTemplateRow {
  id: string;
  document_type: string;
  country: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  signatures: { role: string }[];
  fields: DocumentTemplateField[];
  legal_note: string;
  seo_intro: string;
  status: 'draft' | 'published';
  updated_at: string;
}

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

// ── Token substitution — the deterministic "fill" step, zero AI calls ──
export function fillTemplate(
  template: Pick<DocumentTemplateRow, 'title' | 'intro' | 'sections'>,
  values: Record<string, string>,
  fields: DocumentTemplateField[],
  usePlaceholders: boolean
) {
  const resolve = (fieldId: string): string => {
    const value = values[fieldId]?.trim();
    if (value) return value;
    if (usePlaceholders) {
      const field = fields.find(f => f.id === fieldId);
      return field ? `[${field.label.toUpperCase()}]` : `[${fieldId.toUpperCase()}]`;
    }
    return '';
  };

  const substitute = (text: string): string =>
    text.replace(/\{\{(\w+)\}\}/g, (_, fieldId) => resolve(fieldId));

  return {
    title: substitute(template.title),
    intro: substitute(template.intro),
    sections: template.sections.map(s => ({ heading: substitute(s.heading), body: substitute(s.body) })),
  };
}
