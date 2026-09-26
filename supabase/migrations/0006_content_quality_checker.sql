-- 0006_content_quality_checker.sql
-- Supports the "Google Content Quality Checker" tool.
--
-- NOTE: I couldn't run this against the live project directly — the
-- Supabase project connected to my tooling doesn't match this site's
-- project. Run this yourself (SQL editor or `supabase db push`) and let
-- me know once it's applied, or share the project ref and I can run it.

-- ─── Logging table ─────────────────────────────────────────────────────────
-- One row per analysis run. No page content is stored — only enough to do
-- rate limiting and basic usage analytics. Not used for caching results;
-- users are expected to re-run after editing their content.
create table if not exists content_quality_checks (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  ip_hash       text not null,
  mode          text not null check (mode in ('paste', 'url')),
  source_url    text,
  overall_score integer,
  ymyl          text
);

create index if not exists content_quality_checks_ip_created_idx
  on content_quality_checks (ip_hash, created_at);

alter table content_quality_checks enable row level security;

-- No public policies are created — this table is only ever written to by
-- the edge function using the service-role key, and isn't read by the
-- client, so anon/public gets no access at all by default.

-- ─── Tool content row ──────────────────────────────────────────────────────
-- Adjust category/copy to taste before running — category assumed as
-- 'business' since no 'seo' category currently exists in lib/registry/categories.ts.
insert into tool_translations (
  tool_slug, locale, title, description, meta_description,
  article_title, article_body, faq, is_translated
) values (
  'google-content-quality-checker',
  'en',
  'Google Content Quality Checker',
  'Analyze your content against Google''s documented helpful, reliable, people-first content principles and get a detailed score with specific improvement suggestions.',
  'Free AI-powered content quality checker. Paste your article or a URL and get a 100-point score based on Google''s published Search and AdSense content guidance, plus concrete fixes.',
  'How the Content Quality Score works',
  E'This tool analyzes your content against Google''s **publicly documented** guidance on helpful, reliable, people-first content — it is not an official Google score, and it can''t tell you whether a page will rank, get indexed, or get approved for AdSense.\n\nThe score is based on 8 weighted categories: originality & added value, helpfulness, depth & completeness, experience & expertise, trust & evidence, people-first quality, writing & presentation, and low-value/manipulation risk. Health, finance, legal and safety topics (YMYL) are held to a stricter evidence standard.\n\nThe tool also tells you plainly what it *can''t* evaluate from a single page or article — things like site-wide duplicate content, backlinks, or actual Search Console performance — because a single-page analysis should never pretend to be a full site audit.',
  '[
    {"q": "Is this an official Google score?", "a": "No. Google does not publish a numerical content-quality score. This tool interprets Google''s publicly documented Search and AdSense guidance into an analytical score of our own design — useful for spotting issues, not a guarantee of rankings or approval."},
    {"q": "Does a low score mean my content will be penalized?", "a": "Not necessarily. The score reflects how well the content matches documented best practices. Many other factors (site-wide trust, backlinks, technical SEO) affect actual search performance and aren''t visible from a single page."},
    {"q": "Why did URL analysis fail for my page?", "a": "Some pages can''t be retrieved automatically (paywalls, heavy JavaScript rendering, or blocking). If that happens, paste the article text directly instead."},
    {"q": "Is my content stored anywhere?", "a": "No page content is saved by this tool. Only basic usage metadata (timestamp, score, whether you used paste or URL mode) is logged for abuse prevention."}
  ]'::jsonb,
  true
)
on conflict (tool_slug, locale) do update set
  title = excluded.title,
  description = excluded.description,
  meta_description = excluded.meta_description,
  article_title = excluded.article_title,
  article_body = excluded.article_body,
  faq = excluded.faq;
