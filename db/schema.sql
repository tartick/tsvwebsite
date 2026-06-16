-- ═══════════════════════════════════════════════════════════════
-- The Season — Proposal Tool schema
-- Run this in the Supabase SQL Editor (one-time setup).
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT throughout.
--
-- REUSED-PROJECT SAFE: every table is prefixed `prop_` so this tool
-- cannot collide with or touch any existing tables in your project.
--
-- Security model: ALL access goes through Vercel serverless functions
-- using the Supabase SECRET key (which bypasses RLS). RLS is enabled
-- with NO public policies, so the publishable/anon key can read nothing.
-- The browser never talks to Supabase directly.
-- ═══════════════════════════════════════════════════════════════

-- ── Companies (seeded catalog; rarely changes) ─────────────────
create table if not exists prop_companies (
  key         text primary key,          -- tsv | 11oc | relay | flyer | marathon | forest
  name        text not null,
  category    text,                       -- e.g. "Brand Studio"
  is_core     boolean default false,      -- true = a Season company; false = bundled partner
  sort        int default 0
);

insert into prop_companies (key, name, category, is_core, sort) values
  ('tsv',      'The Season',        'Producing & Marketing Direction', true,  0),
  ('11oc',     '11 O''Clock Studio','Brand Studio',                     true,  1),
  ('relay',    'Relay',             'Creator Network',                  true,  2),
  ('flyer',    'Flyer',             'Creative Production',              true,  3),
  ('marathon', 'Marathon Digital',  'Social & Digital',                 false, 4),
  ('forest',   'Forest',            'Social Media Management',          false, 5)
on conflict (key) do update set
  name = excluded.name, category = excluded.category,
  is_core = excluded.is_core, sort = excluded.sort;

-- ── Service catalog ────────────────────────────────────────────
create table if not exists prop_services (
  id           uuid primary key default gen_random_uuid(),
  company_key  text references prop_companies(key),
  name         text not null,
  description  text,
  rate_amount  int,                       -- in whole dollars
  rate_unit    text default 'flat',       -- flat | monthly
  rate_note    text,                       -- e.g. "+ media"
  is_default   boolean default false,      -- auto-suggested for its company in the builder
  sort         int default 0,
  created_at   timestamptz default now()
);

-- ── Reference library (PDFs + external links) ──────────────────
create table if not exists prop_references (
  id           uuid primary key default gen_random_uuid(),
  type         text not null default 'link',   -- link | pdf
  title        text not null,
  client       text,                            -- "PAC NYC · 2024"
  url          text,                            -- link target OR /assets/refs/x.pdf
  company_key  text references prop_companies(key),
  tags         text[] default '{}',             -- ['Key Art','Website']
  page_count   int,                             -- for PDFs
  sort         int default 0,
  created_at   timestamptz default now()
);

-- ── Team contacts (for the "I Have Questions" modal) ───────────
create table if not exists prop_contacts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  title        text,
  company_key  text references prop_companies(key),
  email        text,
  phone        text,
  specialty    text,
  is_pinned    boolean default false,           -- default-featured on new proposals
  sort         int default 0,
  created_at   timestamptz default now()
);

-- ── Proposals (document-style: nested content in JSONB) ────────
create table if not exists prop_proposals (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  client_name        text not null,
  show_subtitle      text,
  hero_date          text,                       -- display string, e.g. "June 2026"
  status             text not null default 'draft',
                     -- draft | sent | questions | accepted | contract-sent | contracted
  password_hash      text,                       -- sha256(plaintext); plaintext never stored in hash form
  password_plain     text,                       -- shown only in admin list (server-gated)
  opening_note       text,
  featured_companies text[] default '{tsv}',     -- company keys in the collective block
  -- services: [{ company_key, name, description, deliverables[], rate_amount,
  --              rate_unit, rate_note, reference_ids[] }]
  services           jsonb default '[]',
  terms              text,
  investment_note    text,
  contact_ids        uuid[] default '{}',        -- selected for the Questions modal
  -- contract
  contract_status    text default 'not-started', -- not-started | sent | signed
  docusign_url       text,
  signed_date        date,
  signed_pdf_url     text,
  internal_tag       text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create index if not exists prop_proposals_status_idx  on prop_proposals(status);
create index if not exists prop_proposals_updated_idx on prop_proposals(updated_at desc);

-- ── Client action log (Accept / Questions) ─────────────────────
-- Mirrors what also gets emailed + appended to the Google Sheet,
-- so the admin has an in-app record too.
create table if not exists prop_events (
  id           uuid primary key default gen_random_uuid(),
  proposal_id  uuid references prop_proposals(id) on delete cascade,
  type         text not null,                    -- accept | questions
  message      text,                             -- client's feedback (questions)
  created_at   timestamptz default now()
);

create index if not exists prop_events_proposal_idx on prop_events(proposal_id, created_at desc);

-- ── auto-update updated_at on proposals ────────────────────────
create or replace function prop_touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists prop_proposals_touch on prop_proposals;
create trigger prop_proposals_touch before update on prop_proposals
  for each row execute function prop_touch_updated_at();

-- ── Lock everything down: RLS on, no public policies ───────────
-- The secret key (server-side) bypasses RLS. The publishable/anon
-- key gets nothing. The browser never connects directly anyway.
alter table prop_companies  enable row level security;
alter table prop_services   enable row level security;
alter table prop_references enable row level security;
alter table prop_contacts   enable row level security;
alter table prop_proposals  enable row level security;
alter table prop_events     enable row level security;
