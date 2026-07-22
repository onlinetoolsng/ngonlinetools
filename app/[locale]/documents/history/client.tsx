'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, Trash2, ShieldAlert, FileText } from 'lucide-react';
import { DocumentHistoryEntry, getHistory, deleteFromHistory, clearHistory } from '@/lib/documents/document-history';
import { HIGH_RISK_DOCUMENT_TYPES } from '@/lib/documents/document-types';
import { localePath } from '@/lib/i18n/paths';
import DocumentEditor from '@/components/documents/DocumentEditor';

// This is the client-side counterpart to app/[locale]/documents/history/page.tsx.
// It used to live as a small sidebar (<DocumentHistoryList/>) embedded inside
// every individual template page. It's been pulled out into its own hub here
// instead, so "Fill Document" pages stay focused on filling in the current
// template, and saved documents from ANY template live in one place users can
// find from a single "History" entry point on /documents.

export default function DocumentsHistoryClient({ locale }: { locale: string }) {
  const [entries, setEntries] = useState<DocumentHistoryEntry[] | null>(null);
  const [openEntry, setOpenEntry] = useState<DocumentHistoryEntry | null>(null);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  if (openEntry) {
    return (
      <DocumentEditor
        document={openEntry.document}
        onChange={doc => setOpenEntry({ ...openEntry, document: doc })}
        isHighRisk={HIGH_RISK_DOCUMENT_TYPES.has(openEntry.documentTypeSlug)}
        fileNamePrefix={openEntry.documentTypeLabel}
        onReset={() => setOpenEntry(null)}
        resetLabel="Back to Saved Documents"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <History className="h-4 w-4 text-indigo-600" />
          <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Saved On This Device</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2">Your Saved Documents</h1>
        <p className="text-gray-500 max-w-2xl">
          Every document you've filled in from our templates, saved right here so you can come back, reopen, edit, or download it again.
        </p>
      </div>

      <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 max-w-2xl">
        <ShieldAlert className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>Saved only on this device/browser — never sent to our servers. Clear it before using a shared or public computer.</span>
      </div>

      {entries === null ? null : entries.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">You haven&apos;t filled in any documents yet.</p>
          <Link
            href={localePath(locale, '/documents')}
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
          >
            Browse document templates →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entries.map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 bg-white border border-gray-200 hover:border-indigo-300 rounded-xl px-4 py-3 transition-colors"
              >
                <button onClick={() => setOpenEntry(entry)} className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {entry.documentTypeLabel} — {entry.countryLabel}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </button>
                <button
                  onClick={() => setEntries(deleteFromHistory(entry.id))}
                  className="text-gray-400 hover:text-red-500 p-1.5 transition-colors flex-shrink-0"
                  aria-label="Delete this saved document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => { clearHistory(); setEntries([]); }}
            className="text-xs font-medium text-gray-500 hover:text-red-500 transition-colors"
          >
            Clear all saved documents
          </button>
        </>
      )}
    </div>
  );
}
