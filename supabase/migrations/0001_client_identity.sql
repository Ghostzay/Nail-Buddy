-- ============================================================================
-- 0001 — CLIENT IDENTITY
-- Unblocks: B2 (a returning client is one row, not N), B9 (sensitivities as a
--           structured safety flag), B10 (language, SMS consent)
-- Flag:     NEXT_PUBLIC_FF_CLIENT_IDENTITY
--
-- ⚠️  THIS MIGRATION HAS A MANUAL STEP. Read §3 before running it.
--     Section 1 is safe and additive. Section 3 adds a UNIQUE index that WILL
--     FAIL if duplicate phone numbers already exist — and they almost certainly
--     do, because the current /api/jobs handler inserts a new customer row on
--     every single request. Run section 2 first and read its output.
--
-- Additive only. No existing column is dropped, retyped, or renamed.
-- Rollback at the bottom.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. New columns (safe — run anytime)
-- ---------------------------------------------------------------------------

alter table public.customers
  add column if not exists first_name    text,
  add column if not exists last_name     text,
  -- ISO 639-1. Drives the kiosk toggle default and the tech card hint.
  add column if not exists language      text not null default 'en'
    check (language in ('en', 'vi', 'es')),
  -- Safety flags, NOT marketing. Surfaced as a persistent amber flag on /tech.
  add column if not exists sensitivities text[] not null default '{}',
  -- Explicit and separate from any promotional consent.
  add column if not exists sms_consent   boolean not null default false,
  add column if not exists referral_source text,
  add column if not exists last_seen_at  timestamptz;

comment on column public.customers.sensitivities is
  'Safety flags e.g. {acrylic,acetone,latex,fragrance,injury}. Never a notes substring.';
comment on column public.customers.sms_consent is
  'Appointment/queue texts only. Promotional consent must be a separate column.';

-- Digits-only projection of `phone`, so (770) 555-0142 and 7705550142 collide.
alter table public.customers
  add column if not exists phone_normalized text
  generated always as (nullif(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), ''))
  stored;

create index if not exists customers_phone_normalized_idx
  on public.customers (phone_normalized);

-- Backfill first/last from the existing single `name` column. Best-effort:
-- everything before the first space is the first name. Only touches rows that
-- have not already been split.
update public.customers
set first_name = coalesce(first_name, split_part(name, ' ', 1)),
    last_name  = coalesce(
      last_name,
      nullif(substr(name, length(split_part(name, ' ', 1)) + 2), '')
    )
where first_name is null or last_name is null;

-- ---------------------------------------------------------------------------
-- 2. INSPECT DUPLICATES — run this and read it before section 3
-- ---------------------------------------------------------------------------
-- Returns every phone number held by more than one customer row, worst first.
-- If this returns zero rows, skip straight to section 3.
--
--   select phone_normalized,
--          count(*)                         as row_count,
--          min(created_at)                  as first_seen,
--          array_agg(id order by created_at) as ids
--   from public.customers
--   where phone_normalized is not null
--   group by phone_normalized
--   having count(*) > 1
--   order by count(*) desc;

-- Merge helper. Keeps the OLDEST row per phone number as canonical, repoints
-- that phone's jobs onto it, unions the sensitivities, keeps the most recent
-- non-null name/language, then deletes the redundant rows.
-- Returns the number of customer rows removed.
create or replace function public.merge_duplicate_customers()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer := 0;
begin
  -- Snapshot the duplicate groups once; every step below reuses it, so the
  -- grouping can't shift underneath us as we mutate rows.
  create temp table _dupes on commit drop as
  select phone_normalized,
         (array_agg(id order by created_at))[1] as keep_id,
         array_agg(id order by created_at)      as all_ids
  from public.customers
  where phone_normalized is not null
  group by phone_normalized
  having count(*) > 1;

  -- 1. Fold each group's best-known values onto the canonical (oldest) row.
  --    Sensitivities union rather than overwrite — dropping a recorded
  --    allergy because a later visit didn't re-enter it would be unsafe.
  update public.customers c
  set sensitivities = folded.sensitivities,
      language      = coalesce(folded.language, c.language),
      name          = coalesce(folded.name, c.name),
      notes         = coalesce(folded.notes, c.notes),
      sms_consent   = folded.sms_consent
  from (
    select d.keep_id,
           array(
             select distinct s
             from public.customers x, unnest(x.sensitivities) s
             where x.id = any(d.all_ids)
           )                                                     as sensitivities,
           (array_remove(array_agg(m.language order by m.created_at desc), null))[1] as language,
           (array_remove(array_agg(m.name     order by m.created_at desc), null))[1] as name,
           (array_remove(array_agg(m.notes    order by m.created_at desc), null))[1] as notes,
           bool_or(m.sms_consent)                                 as sms_consent
    from _dupes d
    join public.customers m on m.id = any(d.all_ids)
    group by d.keep_id, d.all_ids
  ) folded
  where c.id = folded.keep_id;

  -- 2. Repoint jobs from the redundant rows onto the canonical one.
  update public.jobs j
  set customer_id = d.keep_id
  from _dupes d
  where j.customer_id = any(d.all_ids)
    and j.customer_id <> d.keep_id;

  -- 3. Drop the now-orphaned rows.
  delete from public.customers c
  using _dupes d
  where c.id = any(d.all_ids) and c.id <> d.keep_id;

  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.merge_duplicate_customers() from public, anon;

-- Run it deliberately (NOT automatic — take a backup first):
--   select public.merge_duplicate_customers();

-- ---------------------------------------------------------------------------
-- 3. Enforce one row per phone — run ONLY after section 2 reports clean
-- ---------------------------------------------------------------------------
-- Partial: rows with no phone (walk-ins who declined to give one) stay exempt.
create unique index if not exists customers_phone_unique
  on public.customers (phone_normalized)
  where phone_normalized is not null;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- drop index if exists public.customers_phone_unique;
-- drop function if exists public.merge_duplicate_customers();
-- drop index if exists public.customers_phone_normalized_idx;
-- alter table public.customers
--   drop column if exists phone_normalized,
--   drop column if exists last_seen_at,
--   drop column if exists referral_source,
--   drop column if exists sms_consent,
--   drop column if exists sensitivities,
--   drop column if exists language,
--   drop column if exists last_name,
--   drop column if exists first_name;
-- NOTE: rollback cannot un-merge rows deleted by merge_duplicate_customers().
