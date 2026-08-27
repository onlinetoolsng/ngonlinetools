-- 0005_tool_translations_trust_and_image_fields.sql
-- Adds trust/freshness/image fields to tool_translations, used by the
-- tool page to show an image, "Last updated" date, reviewer credit,
-- and a source link alongside the article body. Already applied to the
-- live project (Online Tools NG) directly via Supabase; this file just
-- brings that change into version control.

alter table tool_translations
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists last_updated date,
  add column if not exists reviewer_name text,
  add column if not exists source_url text;

comment on column tool_translations.image_url is 'Featured/explainer image for the tool article (e.g. a diagram or chart), rendered above or within the article body.';
comment on column tool_translations.image_alt is 'Alt text for image_url.';
comment on column tool_translations.last_updated is 'Date the article content was last verified/updated against current law or data. Rendered as a freshness signal at the top of the article.';
comment on column tool_translations.reviewer_name is 'Name/title of the author or reviewer, e.g. "Reviewed by Tolu Adebayo, Tax Analyst in Lagos". Rendered at top of article.';
comment on column tool_translations.source_url is 'Primary authoritative source for the figures/rules cited (e.g. FIRS, CAC, SARS, PenCom).';
