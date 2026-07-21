// lib/documents/document-templates-fill.ts
//
// Pure client-safe types + logic split out of document-templates-data.ts.
// This file has NO import of lib/supabase/client.ts (which pulls in
// `next/headers` via createSupabaseClient) — it exists so client
// components can import the fill-in-the-blanks logic and the
// DocumentTemplateRow type without dragging next/headers into the browser
// bundle, which Next.js's App Router build fails on.

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
