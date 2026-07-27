-- ============================================================================
-- 0004 — JOB LIFECYCLE & DETAIL
-- Unblocks: B5 (open/claimed/in_progress/complete/cancelled)
--           B6 (started_at / completed_at -> real duration stats on /manager)
--           B7 (up to 3 photos)  B8 (multi-colour + hands/feet split)
--           C1 (atomic claim — two techs currently CAN double-claim a job)
--           squoval
-- Flag:     NEXT_PUBLIC_FF_JOB_LIFECYCLE
--
-- This one DOES alter two CHECK constraints in place (status and shape).
-- A CHECK constraint cannot be widened any other way. Both are widened only —
-- every value that is currently legal stays legal, so existing rows always
-- survive. Existing statuses are then remapped onto the new vocabulary.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Shape — add squoval (5 -> 6)
-- ---------------------------------------------------------------------------
alter table public.jobs drop constraint if exists jobs_shape_check;
alter table public.jobs add constraint jobs_shape_check
  check (shape in ('square','squoval','round','almond','coffin','stiletto'));

-- ---------------------------------------------------------------------------
-- 2. Status vocabulary
--    old: pending | accepted | declined | completed
--    new: open | claimed | in_progress | complete | cancelled
--    Widen to accept BOTH, remap the data, then narrow to the new set.
-- ---------------------------------------------------------------------------
alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check
  check (status in (
    'pending','accepted','declined','completed',          -- legacy
    'open','claimed','in_progress','complete','cancelled' -- new
  ));

update public.jobs set status = case status
  when 'pending'   then 'open'
  when 'accepted'  then 'claimed'
  when 'declined'  then 'cancelled'
  when 'completed' then 'complete'
  else status
end
where status in ('pending','accepted','declined','completed');

alter table public.jobs alter column status set default 'open';

alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check
  check (status in ('open','claimed','in_progress','complete','cancelled'));

-- ---------------------------------------------------------------------------
-- 3. Real timestamps. updated_at is clobbered by every edit and is useless
--    as a completion time, so /manager cannot derive service duration today.
-- ---------------------------------------------------------------------------
alter table public.jobs
  add column if not exists started_at   timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists decline_reason text;

-- Backfill: the best available estimate for already-complete jobs.
update public.jobs
set completed_at = updated_at
where status = 'complete' and completed_at is null;

-- ---------------------------------------------------------------------------
-- 4. Multiple photos, multiple colours, hands/feet colour split
-- ---------------------------------------------------------------------------
alter table public.jobs
  add column if not exists photo_urls text[] not null default '{}',
  -- <= 3 colour families, validated below
  add column if not exists color_families text[] not null default '{}',
  -- when hands and feet are both booked and the customer wants them different
  add column if not exists toe_color_families text[] not null default '{}';

-- Carry the existing single values into the new array columns.
update public.jobs
set photo_urls = array[photo_url]
where photo_url is not null and photo_urls = '{}';

update public.jobs
set color_families = array[color_family]
where color_family is not null and color_families = '{}';

-- drop-then-add so the file stays re-runnable (constraints have no IF NOT EXISTS)
alter table public.jobs
  drop constraint if exists jobs_color_families_max3,
  drop constraint if exists jobs_toe_color_families_max3,
  drop constraint if exists jobs_photo_urls_max3;

alter table public.jobs
  add constraint jobs_color_families_max3
    check (array_length(color_families, 1) is null
           or array_length(color_families, 1) <= 3),
  add constraint jobs_toe_color_families_max3
    check (array_length(toe_color_families, 1) is null
           or array_length(toe_color_families, 1) <= 3),
  add constraint jobs_photo_urls_max3
    check (array_length(photo_urls, 1) is null
           or array_length(photo_urls, 1) <= 3);

-- NOTE: the legacy scalar columns (photo_url, color_family) are deliberately
-- LEFT IN PLACE and still NOT NULL where they were. Dropping them is a
-- separate, later migration once no code reads them — see 0005 (not written).

-- ---------------------------------------------------------------------------
-- 5. Atomic claim — fixes C1
--    Today PATCH /api/jobs/[id] does `update ... where id = $1` with no status
--    guard, so two techs tapping Accept both succeed and the last write wins.
--    This function claims only if the job is still open, and returns zero rows
--    otherwise so the UI can say "someone else got this one".
-- ---------------------------------------------------------------------------
create or replace function public.claim_job(
  p_job_id  uuid,
  p_tech_id uuid
)
returns setof public.jobs
language sql
security invoker          -- runs as the caller; RLS still applies
set search_path = public
as $$
  update public.jobs
  set status           = 'claimed',
      assigned_tech_id = p_tech_id
  where id = p_job_id
    and status = 'open'   -- the guard that makes this atomic
  returning *;
$$;

grant execute on function public.claim_job(uuid, uuid) to authenticated;

-- Start / complete, with the timestamps that make /manager's stats real.
create or replace function public.start_job(p_job_id uuid)
returns setof public.jobs
language sql security invoker set search_path = public as $$
  update public.jobs
  set status = 'in_progress', started_at = coalesce(started_at, now())
  where id = p_job_id and status = 'claimed'
  returning *;
$$;

create or replace function public.complete_job(p_job_id uuid)
returns setof public.jobs
language sql security invoker set search_path = public as $$
  update public.jobs
  set status = 'complete', completed_at = now(),
      started_at = coalesce(started_at, now())
  where id = p_job_id and status in ('claimed','in_progress')
  returning *;
$$;

grant execute on function public.start_job(uuid)    to authenticated;
grant execute on function public.complete_job(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ROLLBACK  (status remap is NOT reversible — the old labels are gone)
-- ---------------------------------------------------------------------------
-- drop function if exists public.complete_job(uuid);
-- drop function if exists public.start_job(uuid);
-- drop function if exists public.claim_job(uuid, uuid);
-- alter table public.jobs
--   drop constraint if exists jobs_photo_urls_max3,
--   drop constraint if exists jobs_toe_color_families_max3,
--   drop constraint if exists jobs_color_families_max3,
--   drop column if exists toe_color_families,
--   drop column if exists color_families,
--   drop column if exists photo_urls,
--   drop column if exists decline_reason,
--   drop column if exists completed_at,
--   drop column if exists started_at;
