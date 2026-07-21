'use client';

import { useRef, useState } from 'react';
import { Loader2, Download, FileDown, RotateCcw, AlertTriangle } from 'lucide-react';
import { GeneratedDocument, sanitizeDocument } from '@/lib/documents/document-format';

interface DocumentEditorProps {
  document: GeneratedDocument;
  onChange: (doc: GeneratedDocument) => void;
  isHighRisk?: boolean;
  fileNamePrefix: string;
  onReset: () => void;
  resetLabel?: string;
}

export default function DocumentEditor({
  document: generatedDocument,
  onChange,
  isHighRisk,
  fileNamePrefix,
  onReset,
  resetLabel = 'Start Over',
}: DocumentEditorProps) {
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const updateTitle = (value: string) => onChange({ ...generatedDocument, title: value });
  const updateIntro = (value: string) => onChange({ ...generatedDocument, intro: value });
  const updateSectionHeading = (i: number, value: string) => {
    const sections = [...generatedDocument.sections];
    sections[i] = { ...sections[i], heading: value };
    onChange({ ...generatedDocument, sections });
  };
  const updateSectionBody = (i: number, value: string) => {
    const sections = [...generatedDocument.sections];
    sections[i] = { ...sections[i], body: value };
    onChange({ ...generatedDocument, sections });
  };

  const downloadPdf = () => {
    setDownloading('pdf');
    // Print CSS (below) hides everything except #doc-print-area.
    setTimeout(() => {
      window.print();
      setDownloading(null);
    }, 50);
  };

  const downloadDocx = async () => {
    setDownloading('docx');
    try {
      const {
        Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle,
      } = await import('docx');

      const doc = sanitizeDocument(generatedDocument);
      const children: any[] = [
        new Paragraph({
          text: doc.title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
      ];

      if (doc.intro) {
        children.push(new Paragraph({ text: doc.intro, spacing: { after: 300 } }));
      }

      for (const section of doc.sections) {
        children.push(new Paragraph({
          text: section.heading,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        }));
        for (const para of section.body.split(/\n\n+/)) {
          if (para.trim()) {
            children.push(new Paragraph({ text: para.trim(), spacing: { after: 150 } }));
          }
        }
      }

      children.push(new Paragraph({
        text: 'SIGNATURES',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
      }));

      for (const sig of doc.signatures) {
        children.push(
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' } },
            spacing: { before: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `${sig.role} — Signature`, size: 18, color: '666666' })],
            spacing: { after: 300 },
          }),
          new Paragraph({ text: `${sig.role} — Printed Name: ________________________   Date: ______________`, spacing: { after: 300 } }),
        );
      }

      const docxDoc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(docxDoc);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `${fileNamePrefix.replace(/\s+/g, '-').toLowerCase()}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Could not build the Word file. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Print styles — only #doc-print-area is visible when printing */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #doc-print-area, #doc-print-area * { visibility: visible; }
          #doc-print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-wrap items-center gap-2 no-print">
        <button
          onClick={downloadPdf}
          disabled={!!downloading}
          className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          {downloading === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Download PDF
        </button>
        <button
          onClick={downloadDocx}
          disabled={!!downloading}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          {downloading === 'docx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Download Word
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm font-medium px-4 py-2.5 transition-colors ml-auto"
        >
          <RotateCcw className="h-4 w-4" />
          {resetLabel}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 no-print">{error}</p>}

      <p className="text-xs text-gray-500 no-print">
        Click any text in the document below to edit it before downloading.
      </p>

      {isHighRisk && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm no-print">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>This document type carries meaningful legal and financial risk. Have it reviewed by a licensed Nigerian lawyer before you sign or rely on it.</span>
        </div>
      )}

      {/* A4 document preview / editor — always rendered as white paper regardless of site theme */}
      <div
        id="doc-print-area"
        ref={printAreaRef}
        className="bg-white text-black mx-auto max-w-[210mm] shadow-lg rounded-sm p-[15mm] sm:p-[20mm]"
      >
        <h2
          contentEditable
          suppressContentEditableWarning
          onBlur={e => updateTitle(e.currentTarget.textContent || '')}
          className="text-xl sm:text-2xl font-bold text-center mb-6 outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
        >
          {generatedDocument.title}
        </h2>

        {generatedDocument.intro && (
          <p
            contentEditable
            suppressContentEditableWarning
            onBlur={e => updateIntro(e.currentTarget.textContent || '')}
            className="text-sm leading-relaxed mb-6 outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
          >
            {generatedDocument.intro}
          </p>
        )}

        {generatedDocument.sections.map((section, i) => (
          <div key={i} className="mb-5">
            <h3
              contentEditable
              suppressContentEditableWarning
              onBlur={e => updateSectionHeading(i, e.currentTarget.textContent || '')}
              className="text-sm font-bold mb-1.5 outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
            >
              {section.heading}
            </h3>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={e => updateSectionBody(i, e.currentTarget.innerText || '')}
              className="text-sm leading-relaxed whitespace-pre-wrap outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
            >
              {section.body}
            </div>
          </div>
        ))}

        <div className="mt-10 pt-6 border-t border-gray-300">
          <p className="text-sm font-bold mb-6">SIGNATURES</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {generatedDocument.signatures.map((sig, i) => (
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
