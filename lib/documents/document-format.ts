// lib/documents/document-format.ts
//
// Shared shape for a generated document, used by the fixed Template flow
// (/documents/[type]/[country]). Ported verbatim from naira.autos's
// lib/document-format.ts.

export interface GeneratedDocument {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  signatures: { role: string }[];
}

// Safety net: strips any stray markdown (**bold**, _italic_, leftover
// asterisks) that shouldn't be in a rendered/downloaded document.
export function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*\*/g, '')
    .trim();
}

export function sanitizeDocument(doc: GeneratedDocument): GeneratedDocument {
  return {
    title: stripMarkdown(doc.title),
    intro: stripMarkdown(doc.intro),
    sections: doc.sections.map(s => ({ heading: stripMarkdown(s.heading), body: stripMarkdown(s.body) })),
    signatures: doc.signatures,
  };
}
