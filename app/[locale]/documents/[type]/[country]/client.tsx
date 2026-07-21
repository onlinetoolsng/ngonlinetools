'use client';

import { useState } from 'react';
import { FileCheck2, Wand2 } from 'lucide-react';
import { DocumentTemplateRow, fillTemplate } from '@/lib/documents/document-templates-fill';
import { DocumentTypeDef, DocumentCountryDef, HIGH_RISK_DOCUMENT_TYPES } from '@/lib/documents/document-types';
import { GeneratedDocument } from '@/lib/documents/document-format';
import { DocumentHistoryEntry, saveToHistory } from '@/lib/documents/document-history';
import DocumentEditor from '@/components/documents/DocumentEditor';
import DocumentHistoryList from '@/components/documents/DocumentHistoryList';

// This is a Client Component scoped to ONLY the interactive fill-in-form /
// document-editor slice. Header/Footer/Breadcrumb/BackButton are rendered
// by the parent Server Component (page.tsx) instead — Header and Footer
// are async Server Components that call next-intl's getTranslations(),
// which throws at runtime if it ends up bundled into a Client Component's
// module graph. Keep this file free of any import that isn't itself
// marked 'use client' or a plain browser-safe utility.

const SHORT_DISCLAIMER =
  'Informational only, not legal advice. Have high-value or high-risk agreements reviewed by a licensed Nigerian lawyer.';

interface TemplateDocumentClientProps {
  template: DocumentTemplateRow;
  docType: DocumentTypeDef;
  docCountry: DocumentCountryDef;
}

export default function TemplateDocumentClient({ template, docType, docCountry }: TemplateDocumentClientProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [usePlaceholders, setUsePlaceholders] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);

  const isHighRisk = HIGH_RISK_DOCUMENT_TYPES.has(docType.slug);

  const handleFieldChange = (id: string, value: string) => {
    setValues(v => ({ ...v, [id]: value }));
    if (usePlaceholders) setUsePlaceholders(false);
  };

  const missingRequired = !usePlaceholders && template.fields.some(f => f.required && !values[f.id]?.trim());

  const handleFill = () => {
    const filled = fillTemplate(template, values, template.fields, usePlaceholders);
    const doc: GeneratedDocument = {
      title: filled.title,
      intro: filled.intro,
      sections: filled.sections,
      signatures: template.signatures,
    };
    setGeneratedDocument(doc);
    saveToHistory({
      source: 'template',
      documentTypeSlug: docType.slug,
      documentTypeLabel: docType.label,
      countryCode: docCountry.code,
      countryLabel: docCountry.name,
      isHighRisk,
      document: doc,
    });
  };

  const handleOpenHistoryEntry = (entry: DocumentHistoryEntry) => {
    setGeneratedDocument(entry.document);
  };

  const handleReset = () => {
    setGeneratedDocument(null);
    setValues({});
    setUsePlaceholders(false);
  };

  return (
    <>
      {!generatedDocument && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileCheck2 className="h-4 w-4 text-indigo-600" />
              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Free Template · No Sign-Up</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
              {docType.label} Template — {docCountry.flag} {docCountry.name}
            </h1>
          </div>

          {template.legal_note && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg px-4 py-3 text-sm">
              {template.legal_note}
            </div>
          )}

          <p className="text-xs text-gray-400">{SHORT_DISCLAIMER}</p>

          <DocumentHistoryList filterSource="template" onOpen={handleOpenHistoryEntry} />

          {/* Fill-in form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Fill in your details</h2>
              <button
                type="button"
                onClick={() => { setUsePlaceholders(true); setValues({}); }}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                  usePlaceholders
                    ? 'bg-indigo-700 border-indigo-700 text-white'
                    : 'border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-700'
                }`}
              >
                Use placeholder details
              </button>
            </div>

            {usePlaceholders ? (
              <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                Placeholder fields like [TENANT'S FULL NAME] will be used — fill them in after downloading.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {template.fields.map(field => (
                  <div key={field.id} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={values[field.id] || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    ) : (
                      <input
                        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                        value={values[field.id] || ''}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleFill}
              disabled={missingRequired}
              className="w-full flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 transition-colors"
            >
              <Wand2 className="h-4 w-4" />
              Fill Document
            </button>
          </div>

          {/* SEO article content — below the form */}
          {template.seo_intro && (
            <div className="prose-sm text-gray-500 leading-relaxed border-t border-gray-200 pt-6">
              <p>{template.seo_intro}</p>
            </div>
          )}
        </>
      )}

      {generatedDocument && (
        <DocumentEditor
          document={generatedDocument}
          onChange={setGeneratedDocument}
          isHighRisk={isHighRisk}
          fileNamePrefix={docType.label}
          onReset={handleReset}
          resetLabel="Edit Details Again"
        />
      )}
    </>
  );
}
