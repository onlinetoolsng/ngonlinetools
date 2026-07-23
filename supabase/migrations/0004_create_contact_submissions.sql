-- Contact form submissions from /contact.
--
-- The anon key is allowed to INSERT only (the public contact form posts
-- through the /api/contact route using the public client) — it can never
-- SELECT, UPDATE, or DELETE rows, so submitted messages aren't readable
-- back out through the public key. Reading/managing submissions happens
-- via the Supabase dashboard or a service-role key.

create table if not exists contact_submissions (
  id            uuid primary key default gen_random_uuid(),

  name          text not null,
  email         text not null,
  topic         text not null default 'general'
                  check (topic in ('general', 'privacy', 'bug', 'partnership')),
  message       text not null,

  status        text not null default 'new'
                  check (status in ('new', 'read', 'replied', 'archived')),

  -- Light abuse/spam context — never shown back to the public.
  user_agent    text,
  page_path     text,

  created_at    timestamptz not null default now()
);

create index if not exists idx_contact_submissions_status
  on contact_submissions (status);

create index if not exists idx_contact_submissions_created_at
  on contact_submissions (created_at desc);

alter table contact_submissions enable row level security;

-- Public (anon) client can submit the form...
create policy "Public can submit contact form"
  on contact_submissions
  for insert
  with check (
    length(trim(name)) > 0
    and length(trim(email)) > 0
    and length(trim(message)) between 1 and 5000
  );

-- ...but cannot read, update, or delete submissions. No select/update/delete
-- policy is defined for anon/authenticated, so those actions fall through to
-- "denied" under RLS. Reviewing and managing submissions happens via the
-- Supabase dashboard or a service-role key.
