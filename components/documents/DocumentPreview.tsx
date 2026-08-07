// 📁 components/documents/DocumentPreview.tsx
//
// Read-only "paper" rendering of a document, filled with placeholder
// brackets like [TENANT'S FULL NAME]. This is deliberately NOT
// DocumentEditor: no contentEditable, no download buttons, no edit
// affordance of its own. Those belong to the interactive, real-values
// state that appears only after someone fills in the form via the Edit
// flow in TemplateDocumentClient — download buttons here would let
// someone download a document that's still full of placeholder text.
//
// Plain Server Component on purpose: fillTemplate() in placeholder mode
// needs no client-side state, so this can render server-side as part of
// the initial HTML — the actual document text is now visible to a
// crawler in the first response instead of only appearing after client
// JS runs, on top of just being faster to first paint.

import { AlertTriangle } from 'lucide-react';
import { GeneratedDocument } from '@/lib/documents/document-format';

interface DocumentPreviewProps {
  document: GeneratedDocument;
  isHighRisk?: boolean;
}

export default function DocumentPreview({ document: doc, isHighRisk }: DocumentPreviewProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 no-print">
        This is a preview with placeholder details like <span className="font-medium text-gray-700">[TENANT&apos;S FULL NAME]</span>.
        Tap Edit below to fill in your own details and download your copy.
      </p>

      {isHighRisk && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm no-print">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>This document type carries meaningful legal and financial risk. Have it reviewed by a licensed Nigerian lawyer before you sign or rely on it.</span>
        </div>
      )}

      <div className="bg-white text-black mx-auto max-w-[210mm] shadow-lg rounded-sm p-[15mm] sm:p-[20mm]">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">{doc.title}</h2>

        {doc.intro && <p className="text-sm leading-relaxed mb-6">{doc.intro}</p>}

        {doc.sections.map((section, i) => (
          <div key={i} className="mb-5">
            <h3 className="text-sm font-bold mb-1.5">{section.heading}</h3>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{section.body}</div>
          </div>
        ))}

        <div className="mt-10 pt-6 border-t border-gray-300">
          <p className="text-sm font-bold mb-6">SIGNATURES</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {doc.signatures.map((sig, i) => (
              <div key={i}>
                <div className="border-b border-gray-400 h-10" />
                <p className="text-xs text-gray-600 mt-1">{sig.role} — Signature</p>
                <p className="text-xs mt-3">Printed Name: ________________________</p>
                <p className="text-xs mt-2">Date: ______________</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
