-- scripts/randomize-content-dates-2026-08-01.sql
-- One-off maintenance script: spreads content dates randomly across
-- 2026-06-03 through the time this is run, instead of everything
-- clustering on the day each row was actually inserted. Run once in
-- the Supabase SQL editor. Re-running will re-randomize (not idempotent
-- by design).

-- Tool SEO content
update tool_translations
set created_at = '2026-06-03 00:00:00'::timestamptz
    + (random() * (now() - '2026-06-03 00:00:00'::timestamptz));

-- Blog articles: published_at and created_at get the same randomized
-- date per article (computed once per row via the subquery), so an
-- article's "created" and "published" timestamps stay consistent with
-- each other.
update articles a
set published_at = r.d,
    created_at = r.d
from (
  select slug,
         '2026-06-03 00:00:00'::timestamptz
           + (random() * (now() - '2026-06-03 00:00:00'::timestamptz)) as d
  from articles
) r
where a.slug = r.slug;

-- Blog article translations: sync to the parent article's new date
-- rather than randomizing independently, so a translation never shows
-- as "created" before its own article.
update article_translations at
set created_at = a.created_at
from articles a
where at.article_slug = a.slug;

-- Document template SEO pages: same pattern as articles, both
-- created_at and updated_at get the same randomized date per row.
update document_templates dt
set created_at = r.d,
    updated_at = r.d
from (
  select id,
         '2026-06-03 00:00:00'::timestamptz
           + (random() * (now() - '2026-06-03 00:00:00'::timestamptz)) as d
  from document_templates
) r
where dt.id = r.id;
