-- Nail Buddy — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push` / migrations).

create extension if not exists pgcrypto;

-- =========================================================
-- customers
-- =========================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists customers_created_at_idx on public.customers (created_at desc);
create index if not exists customers_phone_idx on public.customers (phone);

-- =========================================================
-- jobs
-- =========================================================
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,

  shape text not null check (shape in ('square', 'almond', 'coffin', 'stiletto', 'round')),
  length text not null check (length in ('short', 'medium', 'long', 'xl')),
  color_family text not null check (
    color_family in ('nudes', 'reds', 'pinks', 'blacks', 'whites', 'chrome', 'glitter')
  ),
  design_type text not null check (
    design_type in ('solid', 'french', 'ombre', 'simple_art', 'other')
  ),

  notes text,
  notes_vi text, -- Vietnamese translation, populated on demand (not automatic)

  photo_url text,

  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'declined', 'completed')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_idx on public.jobs (status);
create index if not exists jobs_created_at_idx on public.jobs (created_at desc);
create index if not exists jobs_customer_id_idx on public.jobs (customer_id);

-- keep updated_at current on every change
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row
  execute function public.set_updated_at();

-- required for realtime UPDATE payloads to include full row data
alter table public.jobs replica identity full;

-- =========================================================
-- inventory_items
-- =========================================================
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  created_at timestamptz not null default now()
);

create index if not exists inventory_items_category_idx on public.inventory_items (category);

-- =========================================================
-- Realtime
-- =========================================================
alter publication supabase_realtime add table public.jobs;

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.inventory_items enable row level security;

-- customers: the public kiosk (/request) needs to create a customer
-- record anonymously; staff (any authenticated user) can read/update.
create policy "anon can create customers"
  on public.customers for insert
  to anon
  with check (true);

create policy "staff can read customers"
  on public.customers for select
  to authenticated
  using (true);

create policy "staff can update customers"
  on public.customers for update
  to authenticated
  using (true)
  with check (true);

-- jobs: the public kiosk creates jobs anonymously; staff manage the queue.
create policy "anon can create jobs"
  on public.jobs for insert
  to anon
  with check (true);

create policy "staff can read jobs"
  on public.jobs for select
  to authenticated
  using (true);

create policy "staff can update jobs"
  on public.jobs for update
  to authenticated
  using (true)
  with check (true);

-- inventory_items: staff only.
create policy "staff can read inventory"
  on public.inventory_items for select
  to authenticated
  using (true);

create policy "staff can manage inventory"
  on public.inventory_items for all
  to authenticated
  using (true)
  with check (true);

-- =========================================================
-- Storage: job photos uploaded from the kiosk
-- =========================================================
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

create policy "anon can upload job photos"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'job-photos');

create policy "anyone can view job photos"
  on storage.objects for select
  to public
  using (bucket_id = 'job-photos');

create policy "staff can manage job photos"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'job-photos')
  with check (bucket_id = 'job-photos');
