// 📁 lib/content/tools/types.ts
//
// Code-based tool SEO content. Replaces the need to seed tool_translations in
// Supabase: add a file in this folder, register it in ./index.ts, and the tool
// page, metadata, FAQ schema and sitemap all pick it up.

export type ToolFaq = { q: string; a: string }

export type ToolContentFields = {
  title: string
  description: string
  meta_description: string
  article_title: string
  /** Markdown. Rendered by BlogMarkdownRenderer (tables, headings, lists, bold). */
  article_body: string
  /** Optional markdown rendered above article_body (quick answers, rate tables). */
  content_addition?: string
  faq: ToolFaq[]
  /** ISO date (YYYY-MM-DD) the figures were last verified. */
  last_updated: string
  source_url?: string
  image_url?: string
  image_alt?: string
}

/**
 * mode 'replace' (default): this file is the whole page content; Supabase is
 *   not queried for the slug. All fields required.
 * mode 'patch': start from the existing Supabase row and override only the
 *   fields given here (e.g. new title/meta + a content_addition block on a
 *   tool whose article already lives in Supabase).
 */
export type ToolContent =
  | ({ mode?: 'replace' } & ToolContentFields)
  | ({ mode: 'patch' } & Partial<ToolContentFields>)
