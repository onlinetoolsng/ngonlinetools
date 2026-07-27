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

/** Random `count` tools from the given category, excluding one slug (the
 *  tool/page currently being viewed, if applicable). */
export function getRandomToolsForCategory(
  categorySlug: string,
  excludeSlug?: string,
  count = 5
): Tool[] {
  const pool = TOOLS.filter(t => t.category === categorySlug && t.slug !== excludeSlug)
  return pickRandom(pool, count)
}

/** Random `count` document-type definitions from the given category,
 *  excluding one slug. Callers that need to guarantee the template is
 *  actually published should cross-reference against
 *  getAllPublishedTemplates() — see components/layout/RelatedContent.tsx. */
export function getRandomTemplateTypesForCategory(
  categorySlug: string,
  excludeSlug?: string,
  count = 5
): DocumentTypeDef[] {
  const pool = DOCUMENT_TYPES.filter(d => d.categorySlug === categorySlug && d.slug !== excludeSlug)
  return pickRandom(pool, count)
}
