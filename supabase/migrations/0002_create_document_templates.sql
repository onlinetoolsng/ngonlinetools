-- Document Templates: fixed, deterministic document generator (free tier only).
--
-- Ported from naira.autos's document_templates table. This is Tier 1 only —
-- the AI-assembled generator tier is intentionally NOT included here.
--
-- Each row stores a document *skeleton* — clause text with {{token}}
-- placeholders — ready to be filled in and rendered client-side with zero
-- AI calls. Each row gets its own SEO page at /documents/[type]/[country].
--
-- `country` is kept (rather than dropped) so the schema matches naira.autos
-- exactly and stays open to non-Nigeria documents later, even though every
-- row on toolbase.com.ng today will use country = 'ng'.
--
-- Every row should be reviewed before `status` is set to 'published' —
-- especially anything touching tenancy, employment, or other higher-risk
-- legal terms.

create table if not exists document_templates (
  id uuid primary key default gen_random_uuid(),
  document_type text not null,
  country text not null,

  title text not null,               -- e.g. "TENANCY AGREEMENT" — tokens rarely needed here
  intro text default '',             -- opening paragraph, may contain {{tokens}}
  sections jsonb not null,           -- [{ "heading": string, "body": string with {{tokens}} }]
  signatures jsonb not null,         -- [{ "role": string }] e.g. Landlord, Tenant, Witness

  fields jsonb not null,             -- [{ "id": string, "label": string, "type": "text"|"textarea"|"date"|"number", "placeholder": string, "required": boolean }]
                                      -- field id must match the {{token}} names used above

  legal_note text default '',        -- short jurisdiction-specific note shown on the page
  seo_intro text default '',         -- longer article copy for the landing page (what/when/why)

  status text not null default 'draft' check (status in ('draft', 'published')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (document_type, country)
);

create index if not exists idx_doc_templates_lookup
  on document_templates (document_type, country);

create index if not exists idx_doc_templates_published
  on document_templates (status) where status = 'published';

alter table document_templates enable row level security;

-- Public read access, but ONLY for reviewed/published rows — drafts stay
-- invisible until you're ready to publish them.
create policy "Public read access to published templates"
  on document_templates
  for select
  using (status = 'published');

-- No insert/update/delete policies for anon/authenticated: writes only
-- happen via the Supabase SQL editor (or a future admin route) using the
-- service-role key, which bypasses RLS entirely.

-- Keep updated_at current on edits.
create or replace function set_document_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_document_templates_updated_at on document_templates;
create trigger trg_document_templates_updated_at
  before update on document_templates
  for each row execute function set_document_templates_updated_at();
