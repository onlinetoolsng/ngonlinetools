export type Category = {
  slug: string
  icon: string
  color: string
  badgeClass: string
  priority: number
  countries?: string[]
}

export const CATEGORIES: Category[] = [
  { slug: 'finance',        icon: '💰', color: 'indigo',  badgeClass: 'bg-indigo-50 text-indigo-700',  priority: 1 },
  { slug: 'tax',            icon: '🧾', color: 'amber',   badgeClass: 'bg-amber-50 text-amber-700',    priority: 2 },
  { slug: 'business',       icon: '🏢', color: 'blue',    badgeClass: 'bg-blue-50 text-blue-700',      priority: 3 },
  { slug: 'hr-payroll',     icon: '👥', color: 'slate',   badgeClass: 'bg-slate-50 text-slate-700',    priority: 4 },
  { slug: 'real-estate',    icon: '🏠', color: 'orange',  badgeClass: 'bg-orange-50 text-orange-700',  priority: 5 },
  { slug: 'education',      icon: '🎓', color: 'rose',    badgeClass: 'bg-rose-50 text-rose-700',      priority: 6 },
  { slug: 'health',         icon: '🏥', color: 'cyan',    badgeClass: 'bg-cyan-50 text-cyan-700',      priority: 7 },
  { slug: 'currency',       icon: '💱', color: 'yellow',  badgeClass: 'bg-yellow-50 text-yellow-700',  priority: 8 },
  { slug: 'faith',          icon: '🙏', color: 'stone',   badgeClass: 'bg-stone-50 text-stone-700',    priority: 9 },
  { slug: 'everyday',       icon: '⚡', color: 'zinc',    badgeClass: 'bg-zinc-50 text-zinc-700',      priority: 10 },
]

// ─── Display helpers ────────────────────────────────────────────────────────
// Single source of truth for category icon/badge styling. Any page that
// needs to show a category badge or icon should use these instead of
// keeping its own local Record<string, string> map — three pages used to
// do that, drifted out of sync with each other, and two of them still had
// categories from the old Gulf template ('tax-vat', 'career', 'travel',
// 'auto') that don't exist on this site.

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find(c => c.slug === slug)
}

export function getCategoryIcon(slug: string): string {
  return getCategoryBySlug(slug)?.icon ?? '📄'
}

export function getCategoryBadgeClass(slug: string): string {
  return getCategoryBySlug(slug)?.badgeClass ?? 'bg-gray-50 text-gray-700'
}