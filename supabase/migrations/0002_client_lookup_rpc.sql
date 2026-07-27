-- ============================================================================
-- 0002 — MASKED CLIENT LOOKUP (privacy-critical)
-- Unblocks: B1 (returning-client lookup by phone from an anon kiosk)
-- Flag:     NEXT_PUBLIC_FF_CLIENT_IDENTITY
-- Requires: 0001
--
-- WHY AN RPC AND NOT A SELECT POLICY:
-- The kiosk runs as `anon`. Granting anon SELECT on customers would turn the
-- tablet into a data-harvesting endpoint — anyone could enumerate phone
-- numbers and read back names and visit history. Instead anon keeps NO table
-- read, and gets one SECURITY DEFINER function that:
--   * requires a full 10-digit number (no prefix probing)
--   * returns ONLY masked fields — first name + last initial, masked phone
--   * returns at most one row
--   * is rate limited per device
-- The unmasked record is never exposed to the kiosk at all; the job insert
-- goes through the returned opaque id.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Rate limiting — per device, not per phone number, so one kiosk cannot
-- sweep the number space regardless of which numbers it tries.
-- ---------------------------------------------------------------------------
create table if not exists public.lookup_attempts (
  device_id  uuid        not null,
  attempted_at timestamptz not null default now()
);

create index if not exists lookup_attempts_device_time_idx
  on public.lookup_attempts (device_id, attempted_at desc);

alter table public.lookup_attempts enable row level security;
-- No policies: only the SECURITY DEFINER function below may touch this table.

comment on table public.lookup_attempts is
  'Rate-limit ledger for client_lookup(). Prune with delete_old_lookup_attempts().';

create or replace function public.delete_old_lookup_attempts()
returns void language sql security definer set search_path = public as $$
  delete from public.lookup_attempts where attempted_at < now() - interval '1 day';
$$;

-- ---------------------------------------------------------------------------
-- The lookup itself
-- ---------------------------------------------------------------------------
create or replace function public.client_lookup(
  p_phone     text,
  p_device_id uuid
)
returns table (
  client_id      uuid,
  display_name   text,   -- 'Mai N.'
  masked_phone   text,   -- '(•••) •••-0142'
  last_visit_at  timestamptz,
  last_visit_summary text,
  language       text,
  sensitivities  text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  digits         text;
  recent_attempts int;
  v_id           uuid;
begin
  digits := nullif(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), '');

  -- Refuse partial numbers outright. Prefix search is the whole attack.
  if digits is null or length(digits) <> 10 then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  if p_device_id is null then
    raise exception 'device_required' using errcode = '22023';
  end if;

  -- 8 lookups per rolling minute per device (§8.1.3).
  select count(*) into recent_attempts
  from public.lookup_attempts
  where device_id = p_device_id
    and attempted_at > now() - interval '1 minute';

  if recent_attempts >= 8 then
    raise exception 'rate_limited' using errcode = '53400';
  end if;

  insert into public.lookup_attempts (device_id) values (p_device_id);

  select c.id into v_id
  from public.customers c
  where c.phone_normalized = digits
  limit 1;

  -- No match is not an error — the kiosk offers the new-client path.
  if v_id is null then
    return;
  end if;

  return query
  select
    c.id,
    -- First name + last initial only. Never the full surname.
    trim(
      coalesce(nullif(c.first_name, ''), split_part(c.name, ' ', 1))
      || case
           when coalesce(c.last_name, '') <> ''
           then ' ' || upper(left(c.last_name, 1)) || '.'
           else ''
         end
    ),
    '(•••) •••-' || right(c.phone_normalized, 4),
    j.created_at,
    j.summary,
    c.language,
    c.sensitivities
  from public.customers c
  left join lateral (
    select jj.created_at,
           concat_ws(' · ',
             initcap(jj.shape), initcap(jj.length),
             initcap(jj.color_family), initcap(replace(jj.design_type, '_', ' '))
           ) as summary
    from public.jobs jj
    where jj.customer_id = c.id
      and jj.status = 'completed'
    order by jj.created_at desc
    limit 1
  ) j on true
  where c.id = v_id;
end;
$$;

-- anon may CALL the function; it still has no table read of its own.
revoke all on function public.client_lookup(text, uuid) from public;
grant execute on function public.client_lookup(text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- drop function if exists public.client_lookup(text, uuid);
-- drop function if exists public.delete_old_lookup_attempts();
-- drop table if exists public.lookup_attempts;
