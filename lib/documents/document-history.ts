// lib/documents/document-history.ts
//
// Lets someone come back and reopen documents they've filled in before —
// this is real personal data (names, addresses, amounts), so it is
// deliberately kept local-only, never sent to the server:
//   - capped to the most recent MAX_ENTRIES documents
//   - auto-expires entries older than MAX_AGE_DAYS
//   - every read/write is wrapped in try/catch (private/incognito browsing,
//     full storage, or a disabled localStorage should never break the app)
//   - a visible "Clear all" control is always shown alongside history —
//     see app/[locale]/documents/history/client.tsx (the "My Saved
//     Documents" hub, linked to from /documents and every template page)
//
// Ported from naira.autos's lib/document-history.ts. `source` is kept as
// 'ai' | 'template' for schema parity even though this site only ever
// writes 'template' entries.

import { GeneratedDocument } from './document-format';

const HISTORY_KEY = 'toolbase-doc-history';
const MAX_ENTRIES = 20;
const MAX_AGE_DAYS = 60;

export interface DocumentHistoryEntry {
  id: string;
  createdAt: string; // ISO
  source: 'ai' | 'template';
  documentTypeSlug: string;
  documentTypeLabel: string;
  countryCode: string;
  countryLabel: string;
  isHighRisk: boolean;
  document: GeneratedDocument;
}

function prune(entries: DocumentHistoryEntry[]): DocumentHistoryEntry[] {
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return entries
    .filter(e => new Date(e.createdAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_ENTRIES);
}

export function getHistory(): DocumentHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const pruned = prune(parsed);
    if (pruned.length !== parsed.length) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(pruned));
    }
    return pruned;
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<DocumentHistoryEntry, 'id' | 'createdAt'>): void {
  try {
    const existing = getHistory();
    const newEntry: DocumentHistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = prune([newEntry, ...existing]);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Storage full/unavailable — fine, the current session still works.
  }
}

export function deleteFromHistory(id: string): DocumentHistoryEntry[] {
  const updated = getHistory().filter(e => e.id !== id);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
