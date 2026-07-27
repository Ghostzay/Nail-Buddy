-- ============================================================================
-- 0003 — SERVICES & TECHNICIANS
-- Unblocks: B3 (multi-service: mani + pedi + wax in one request)
--           B4 (requested tech, claim ownership, reassignment)
-- Flag:     NEXT_PUBLIC_FF_SERVICES_TECHS
--
-- Pricing and duration live in the DB (not lib/pricing.ts) because the salon
-- must be able to change a price without a redeploy. lib/pricing.ts remains
-- the fallback/seed source and the shape of the config, and is what the UI
-- reads while this flag is off.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- services catalog
-- ---------------------------------------------------------------------------
create table if not exists public.services (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name_en         text not null,
  name_vi         text,
  "group"         text not null check ("group" in ('hands','feet','waxing','addons')),
  price_cents     integer not null default 0,
  duration_min    integer not null default 30,
  -- Base services are mutually exclusive within hands/feet; add-ons and
  -- waxing are freely multi-select. Enforced in lib/services.ts AND here so
  -- a bad client can't write an impossible combination.
  is_base         boolean not null default false,
  -- Which groups this add-on may attach to. Empty = standalone.
  requires_parent_group text[] not null default '{}',
  -- Whether this can run concurrently with another service (a pedicure runs
  -- while nails soak) — drives the duration estimate, which must NOT be a
  -- naive sum or it quotes 3 hours and scares people off.
  parallelizable  boolean not null default false,
  sort_order      integer not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists services_group_idx on public.services ("group", sort_order);

-- ---------------------------------------------------------------------------
-- technicians
-- ---------------------------------------------------------------------------
create table if not exists public.technicians (
  id            uuid primary key default gen_random_uuid(),
  -- Nullable: a tech can exist in the roster before they have a login.
  auth_user_id  uuid unique references auth.users (id) on delete set null,
  display_name  text not null,
  photo_url     text,
  specialties   text[] not null default '{}',
  -- Techs not clocked in are HIDDEN on the kiosk, not greyed out — a greyed
  -- card invites a tap and a disappointment (§8.3).
  is_clocked_in boolean not null default false,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists technicians_active_idx
  on public.technicians (active, is_clocked_in);

-- ---------------------------------------------------------------------------
-- job -> services (many-to-many)
-- ---------------------------------------------------------------------------
create table if not exists public.job_services (
  job_id      uuid not null references public.jobs (id) on delete cascade,
  service_id  uuid not null references public.services (id) on delete restrict,
  -- Snapshot the price at request time; changing the catalog later must not
  -- silently rewrite what a past customer was quoted.
  price_cents integer not null default 0,
  primary key (job_id, service_id)
);

create index if not exists job_services_job_idx on public.job_services (job_id);

-- ---------------------------------------------------------------------------
-- tech assignment on jobs
-- ---------------------------------------------------------------------------
alter table public.jobs
  -- who the customer asked for (nullable = "first available")
  add column if not exists requested_tech_id uuid
    references public.technicians (id) on delete set null,
  -- who actually holds it
  add column if not exists assigned_tech_id uuid
    references public.technicians (id) on delete set null,
  -- set when the assigned tech becomes unavailable, so the queue entry
  -- surfaces "your tech got tied up — take the next available?" instead of
  -- sitting there silently (§8.3 edge case)
  add column if not exists reassign_reason text;

create index if not exists jobs_requested_tech_idx
  on public.jobs (requested_tech_id) where requested_tech_id is not null;
create index if not exists jobs_assigned_tech_idx
  on public.jobs (assigned_tech_id) where assigned_tech_id is not null;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.services      enable row level security;
alter table public.technicians   enable row level security;
alter table public.job_services  enable row level security;

-- The kiosk must render the menu and the roster, so these two are readable by
-- anon. They contain no customer data. Note technicians.photo_url and
-- display_name are intentionally public — they are shown on the kiosk.
create policy "anyone can read active services"
  on public.services for select to anon, authenticated using (active);

create policy "anyone can read active technicians"
  on public.technicians for select to anon, authenticated using (active);

create policy "staff manage services"
  on public.services for all to authenticated using (true) with check (true);

create policy "staff manage technicians"
  on public.technicians for all to authenticated using (true) with check (true);

-- The kiosk writes its own job's service rows, then never reads them back.
create policy "anon can attach services to a job"
  on public.job_services for insert to anon with check (true);

create policy "staff read job services"
  on public.job_services for select to authenticated using (true);

create policy "staff manage job services"
  on public.job_services for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Realtime — /tech needs roster changes (clock in/out) to land live
-- ---------------------------------------------------------------------------
alter table public.technicians replica identity full;
alter publication supabase_realtime add table public.technicians;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- alter publication supabase_realtime drop table public.technicians;
-- alter table public.jobs
--   drop column if exists reassign_reason,
--   drop column if exists assigned_tech_id,
--   drop column if exists requested_tech_id;
-- drop table if exists public.job_services;
-- drop table if exists public.technicians;
-- drop table if exists public.services;
