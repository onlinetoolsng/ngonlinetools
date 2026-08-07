// 📁 lib/utils/relatedContent.ts
//
// Shared "pick N random items from the same category" helpers for the
// related-tools / related-templates / related-blog-posts sections that
// appear at the bottom of every tool, template, and blog page — see
// components/layout/RelatedContent.tsx, which is the single place all
// three of those sections are rendered so they can't drift out of sync
// (or get duplicated) the way the blog page's two separate related-tools
// blocks previously did.

import { TOOLS, type Tool } from '@/lib/registry/tools'
import { DOCUMENT_TYPES, type DocumentTypeDef } from '@/lib/documents/document-types'
import { includesCountry } from '@/lib/registry/countries'

/** Fisher–Yates shuffle, then take the first `count`. Avoids the bias of
 *  the common `array.sort(() => Math.random() - 0.5)` shortcut. */
export function pickRandom<T>(items: T[], count: number): T[] {
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

/** Picks `count` items, preferring ones whose country matches `countries`
 *  (via `matchesCountries`) but always filling the rest from the general
 *  pool so a country with few tools/articles never renders an empty or
 *  under-filled related-content section. Order of the priority group is
 *  still randomized, not "most relevant first" — this is for internal
 *  linking variety, not a ranked recommendation. */
function pickRandomCountryAware<T>(
  pool: T[],
  countries: string[] | undefined,
  matchesCountries: (item: T) => boolean,
  count: number
): T[] {
  if (!countries || countries.length === 0) {
    return pickRandom(pool, count)
  }
  const priority = pool.filter(matchesCountries)
  const rest = pool.filter((item) => !matchesCountries(item))
  const picked = pickRandom(priority, count)
  if (picked.length < count) {
    picked.push(...pickRandom(rest, count - picked.length))
  }
  return picked
}

/** Random `count` tools from the given category, excluding one slug (the
 *  tool/page currently being viewed, if applicable). When `countries` is
 *  given, tools sharing at least one of those countries are preferred,
 *  falling back to the rest of the category if there aren't enough. */
export function getRandomToolsForCategory(
  categorySlug: string,
  excludeSlug?: string,
  count = 5,
  countries?: string[]
): Tool[] {
  const pool = TOOLS.filter(t => t.category === categorySlug && t.slug !== excludeSlug)
  return pickRandomCountryAware(
    pool,
    countries,
    (tool) => (countries ?? []).some(c => includesCountry(tool.countries, c)),
    count
  )
}

/** Random `count` document-type definitions from the given category,
 *  excluding one slug. Callers that need to guarantee the template is
 *  actually published should cross-reference against
 *  getAllPublishedTemplates() — see components/layout/RelatedContent.tsx.
 *  Document types themselves aren't country-scoped (a given /documents/
 *  Supabase row is); country-aware filtering for templates happens in
 *  RelatedContent.tsx after the published rows are fetched. */
export function getRandomTemplateTypesForCategory(
  categorySlug: string,
  excludeSlug?: string,
  count = 5
): DocumentTypeDef[] {
  const pool = DOCUMENT_TYPES.filter(d => d.categorySlug === categorySlug && d.slug !== excludeSlug)
  return pickRandom(pool, count)
}
