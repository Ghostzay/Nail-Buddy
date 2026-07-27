# Migrations

**Nothing here has been applied.** These files were written for you to review
and run yourself. I have no access to your Supabase project and did not
execute any of them.

Every feature that depends on a migration is gated behind a flag in
`lib/flags.ts`. With all flags off the app builds, renders, and is fully
navigable — features either read mock data or hide. So you can apply these on
your own schedule without the deployed site breaking.

## Order

Apply in numeric order. Each depends on the ones before it.

| File | Unblocks | Risk |
|---|---|---|
| `0001_client_identity.sql` | A returning client is one row, not N. Language, sensitivities, SMS consent. | ⚠️ **Has a manual step** — see below |
| `0002_client_lookup_rpc.sql` | Masked phone lookup from the anon kiosk, rate limited | low |
| `0003_services_and_technicians.sql` | Multi-service, tech roster, requested/assigned tech | low — all new tables |
| `0004_job_lifecycle.sql` | Status vocabulary, real timestamps, multi-photo/colour, atomic claim, squoval | ⚠️ alters two CHECK constraints and remaps `status` |

## How to apply

Supabase Dashboard → SQL Editor → paste one file → Run. Or:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_client_identity.sql
```

**Take a backup first** (Dashboard → Database → Backups). `0001` deletes rows
and `0004` rewrites the `status` column; neither is fully reversible.

## ⚠️ The manual step in 0001

`0001` ends by adding a `UNIQUE` index on the normalized phone number. That
**will fail** on your project, because the current `/api/jobs` handler inserts
a brand-new customer row on every single request — so a regular who has
visited six times has six rows with the same phone number.

Do this in order:

1. Run **section 1** of the file (the `ALTER TABLE ... ADD COLUMN` block). Safe.
2. Run the **inspection query** in section 2 (it is commented out — copy it
   out and run it). It lists every duplicated phone number and how many rows
   each has.
3. If it returns rows, run the merge. It keeps the **oldest** row per phone
   number as canonical, repoints that phone's jobs onto it, **unions** the
   recorded sensitivities (never drops an allergy just because a later visit
   didn't re-enter it), and deletes the rest:
   ```sql
   select public.merge_duplicate_customers();  -- returns rows removed
   ```
4. Re-run the inspection query. It should return nothing.
5. Run **section 3** to add the unique index.

If step 2 returns nothing, skip to step 5.

## After applying

Set the matching flag in `.env.local` **and** in the Vercel project, then
redeploy:

```
NEXT_PUBLIC_FF_CLIENT_IDENTITY=true    # after 0001 + 0002
NEXT_PUBLIC_FF_SERVICES_TECHS=true     # after 0003
NEXT_PUBLIC_FF_JOB_LIFECYCLE=true      # after 0004
```

Then regenerate types so `lib/types.ts` matches reality:

```bash
npx supabase gen types typescript --project-id <ref> --schema public > types/supabase.ts
```

Note the generated file uses `type` aliases, not `interface` — do not convert
them. Supabase's generics constrain rows to `Record<string, unknown>`, which
an `interface` does not satisfy, and every query silently resolves to `never`
with a misleading error. See `AUDIT.md` §3.

## What is deliberately NOT here

- **Dropping the legacy `photo_url` / `color_family` scalar columns.** They
  stay until no code reads them. That is a later, separate migration.
- **Seeding services and technicians.** Real prices, durations, and the tech
  roster are yours — I have no idea what they are. `scripts/seed.ts` (Phase 6)
  will populate clearly-fake demo data.
- **Any change to existing RLS policies.** Nothing here revokes or rewrites a
  policy you already have; `0003` only adds policies for its own new tables.
