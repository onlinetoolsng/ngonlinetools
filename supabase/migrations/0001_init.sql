-- 0001_init.sql
-- Core content tables for OnlineToolsNG. Matches the TS types in
-- lib/supabase/queries.ts exactly — keep both in sync if you change either.
-- Run this once in the Supabase SQL editor after the project is created
-- and connected to Vercel.

-- ─── articles ──────────────────────────────────────────────────────────────
create table if not exists articles (
  slug                text primary key,
  category_slug       text not null,
  related_tool_slugs  text[] not null default '{}',
  countries           text[] not null default '{"nigeria"}',
  published           boolean not null default false,
  published_at        timestamptz,
  created_at          timestamptz not null default now()
);

create table if not exists article_translations (
  article_slug          text not null references articles(slug) on delete cascade,
  locale                text not null default 'en',
  title                 text not null,
  excerpt               text,
  content               text not null,
  meta_description      text,
  og_image_url          text,
  reading_time_minutes  integer not null default 5,
  is_translated         boolean not null default true,
  created_at            timestamptz not null default now(),
  primary key (article_slug, locale)
);

-- ─── tool_translations ─────────────────────────────────────────────────────
-- One row per tool (+ locale) holds the SEO title/description shown in
-- metadata, plus the 700+ word long-form article and FAQ shown on the page.
-- A tool page 404s until a row exists here for it — that's intentional:
-- it keeps thin/unwritten tools out of search until content is ready.
create table if not exists tool_translations (
  tool_slug       text not null,
  locale          text not null default 'en',
  title           text not null,
  description     text,
  meta_description text,
  article_title   text,
  article_body    text,
  faq             jsonb not null default '[]',
  is_translated   boolean not null default true,
  created_at      timestamptz not null default now(),
  primary key (tool_slug, locale)
);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Public (anon) client should only ever read. All writes happen via the
-- Supabase dashboard/SQL editor or a service-role key, never the anon key.

alter table articles enable row level security;
alter table article_translations enable row level security;
alter table tool_translations enable row level security;

create policy "Public can read published articles"
  on articles for select
  using (published = true);

create policy "Public can read article translations"
  on article_translations for select
  using (true);

create policy "Public can read tool translations"
  on tool_translations for select
  using (true);
