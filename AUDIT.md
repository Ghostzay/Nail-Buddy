# AUDIT — Phase 0

Read-only audit of the repo as of `e494400` on `claude/nail-salon-walk-in-9zlerb`.
No feature code written. Everything below is verified against the source or a
live check, not assumed; where I could not verify, it is called out explicitly.

---

## 1. Stack — verified

| Thing | Value | How verified |
|---|---|---|
| Next.js | **15.5.22**, App Router | `require('next/package.json').version` |
| React | 19.2.8 | package.json |
| Tailwind | **v4.3.3, CSS-first** | resolved version + `@import "tailwindcss"` and `@theme inline` in `app/globals.css`; **no `tailwind.config.*` exists** |
| PostCSS | `@tailwindcss/postcss` v4 | `postcss.config.mjs` |
| shadcn/ui | New York style, `neutral` base, CSS variables | `components.json` |
| Supabase | `supabase-js` 2.110.9, `@supabase/ssr` 0.12.3 | package.json |
| Bundler | Webpack (not Turbopack — `next build` has no `--turbopack`) | package.json scripts |

**Token registration must go in `app/globals.css` under `@theme inline`.** There is
no config file to add to, and creating one would be a v3 pattern that v4 ignores
by default. This resolves brief §2's "don't guess" item.

### Libraries the brief allows but that are NOT installed
`framer-motion` · `motion` · `next-intl` · `browser-image-compression` · `date-fns`
— all absent. `sonner` **is** installed (2.0.7) and already wired via
`components/ui/sonner.tsx` + `<Toaster>` in the root layout.

---

## 2. Routes

| Route | Type | Auth | Notes |
|---|---|---|---|
| `/` | Server, static | public | Landing page with three links. Not in the brief — see Q4. |
| `/request` | Server shell → client leaf | public | Kiosk. Currently a 7-step wizard. |
| `/tech` | Server (`force-dynamic`) → client leaf | **protected** | Realtime queue. |
| `/manager` | Server (`force-dynamic`) | **protected** | Today's jobs + customers. |
| `/login` | Server → client leaf | public | Supabase email/password. |
| `/api/jobs` | Route handler | public (anon) | `POST` — creates customer **and** job. |
| `/api/jobs/[id]` | Route handler | authed | `PATCH` — status only. |
| `/api/translate` | Route handler | authed | `POST` — on-demand VI translation. |

**No `/styleguide` route exists** — Phase 1 creates it.

### Client/server boundaries — already correct
No `page.tsx` carries `"use client"`. It appears only on 13 leaf components
(7 app components + 6 shadcn primitives that genuinely need it). Brief §2's
boundary constraint is **already satisfied**; I don't need to restructure it,
only preserve it.

---

## 3. Supabase — schema as written in `supabase/schema.sql`

> ⚠️ **I cannot verify what is actually deployed in your Supabase project.**
> I have no project URL or key in this environment. Everything below is the
> *intended* schema from the repo file. If you have not run `schema.sql`, or
> ran an earlier version, reality differs. See §8.

### `public.customers`
`id uuid pk` · `name text not null` · `phone text` · `notes text` · `created_at timestamptz`
Indexes: `created_at desc`, `phone`.

### `public.jobs`
`id uuid pk` · `customer_id uuid → customers(id) on delete cascade` ·
`shape` · `length` · `color_family` · `design_type` · `notes text` ·
`notes_vi text` · `photo_url text` · `status` · `created_at` · `updated_at`
Indexes: `status`, `created_at desc`, `customer_id`.
Trigger: `set_updated_at()` before update. `replica identity full`.

### `public.inventory_items`
`id` · `name` · `category` · `quantity int` · `low_stock_threshold int` · `created_at`
Not referenced by any UI. Dead table today.

### Constrained value sets — these are CHECK constraints, **not Postgres enums**
```
shape         square | almond | coffin | stiletto | round          (5)
length        short | medium | long | xl                           (4)
color_family  nudes | reds | pinks | blacks | whites | chrome | glitter  (7)
design_type   solid | french | ombre | simple_art | other           (5)
status        pending | accepted | declined | completed             (4)
```
Widening any of these is an `ALTER TABLE ... DROP/ADD CONSTRAINT` — a migration,
not a code change.

### RLS — the load-bearing finding
```
customers   anon: INSERT only          authenticated: SELECT, UPDATE
jobs        anon: INSERT only          authenticated: SELECT, UPDATE
inventory   —                          authenticated: ALL
storage     anon: INSERT               public: SELECT      authenticated: ALL
            (bucket 'job-photos', public = true)
```
**`anon` has no SELECT on `customers`.** No DELETE policy anywhere.

### Realtime
`jobs` only — `alter publication supabase_realtime add table public.jobs`,
with `replica identity full` so UPDATE payloads carry the full row.
`customers` is **not** in the publication; `tech-queue.tsx` compensates by
issuing a follow-up `select` on `customers` for each INSERT event (works
because `/tech` is authenticated).

### Types
**`types/supabase.ts` does not exist.** Types are hand-authored in `lib/types.ts`
including a `Database` type. Two things whoever regenerates them must know:

1. The `Database` schema type **must use `type` aliases, not `interface`**.
   Supabase's generics constrain rows to `Record<string, unknown>`, which
   `interface` does not satisfy (interfaces lack implicit index signatures).
   Using `interface` makes every query resolve to `never` with a misleading
   "not assignable to parameter of type 'never'" error. This was hit and fixed
   during the initial build. `supabase gen types` emits type aliases, so
   regenerating is safe — hand-editing is where this bites.
2. Each table needs a `Relationships` key and the schema needs `Views` /
   `Functions` keys, or the same `never` collapse occurs.

---

## 4. Gap analysis — brief vs. what exists

This is the substance of the audit. The brief describes a materially larger
product than the schema supports.

### 4a. Blocking — requires a migration (brief §0 #6: separate file + flag + tell you)

| # | Brief requirement | Blocked by |
|---|---|---|
| B1 | Returning client lookup by phone (§8.1) | `anon` has **no SELECT** on `customers`. Needs a `SECURITY DEFINER` RPC returning only masked fields + server-side rate limit. The brief already specifies this design (§8.1.3) — it just cannot exist without a migration. |
| B2 | **Client identity at all** (§8.1) | `/api/jobs` **unconditionally INSERTs a new customer row on every request** — no dedupe by phone, and `anon` can't SELECT to check. A regular who visits 6 times has **6 customer rows**, not one with 6 jobs. "Returning · 6th visit", "last visit", and "same as last time" are all structurally impossible today. This is the single biggest gap. |
| B3 | Multi-service (§8.2) | `jobs` holds exactly one `shape`/`length`/`color_family`/`design_type`. No `services` table, no join table. Mani+pedi+wax cannot be represented. |
| B4 | Technicians (§8.3, §9) | No `technicians` table, no `tech_id`/`requested_tech_id` on `jobs`. Requested-tech routing, claim ownership, reassignment, and "First available" all have nowhere to live. |
| B5 | Status model (§9) | Brief wants `open/claimed/in progress/complete/cancelled`. Actual is `pending/accepted/declined/completed`. No `in_progress`, no `cancelled`. `accepted` ≈ `claimed`. |
| B6 | Duration stats (§9, §10) | No `started_at` / `completed_at`. Only `created_at`/`updated_at`, and `updated_at` is clobbered by every edit — unusable as a completion timestamp. "Avg service time" is not derivable. |
| B7 | Up to 3 photos (§8 photo picker) | `photo_url` is a single `text`. |
| B8 | Color multi-select ≤3 + hands/feet split (§8.2) | `color_family` is one constrained `text`. |
| B9 | Sensitivities as a safety flag (§8.1, §9) | Only `customers.notes` free text. A safety flag cannot be a substring search. |
| B10 | Preferred language, SMS consent (§8.1) | No columns. |

### 4b. Non-blocking — buildable against current schema

- Pricing + duration estimates → brief specifies `lib/pricing.ts` / `lib/services.ts`
  config files. **No DB needed.** Can be built fully in Phase 2/3.
- Queue position ("You're #3") → derivable from `order by created_at` over open jobs.
- i18n map, motion system, tokens, `/styleguide`, all components in §7 that
  don't read new fields → pure front-end.
- Kiosk hardening (idle reset, sessionStorage draft, popstate, touch-action) → pure front-end.
- Trends on `/manager` (top colors/shapes/designs) → works on existing columns,
  though only single-value-per-job until B3/B8 land.

### 4c. Correctness bugs found while auditing (independent of the redesign)

| # | Issue | Evidence |
|---|---|---|
| C1 | **Double-claim is possible.** `PATCH /api/jobs/[id]` does `.update({status}).eq("id", id)` with **no status guard**. Two techs tapping Accept both succeed; last write wins. Brief §9 explicitly requires an atomic guarded claim. | `app/api/jobs/[id]/route.ts:35-40` |
| C2 | Every request creates a duplicate customer (see B2). | `app/api/jobs/route.ts:65-72` |
| C3 | 5 hardcoded hex values in page code — `COLOR_SWATCH` map. Violates brief §14. | `components/request/request-kiosk.tsx:24-31` |
| C4 | 100% of UI strings are hardcoded English, including toasts and aria-labels. Violates brief §6. | all `.tsx` |
| C5 | `job-photos` bucket is **public**. Filenames are UUIDs so URLs aren't guessable, but they are permanent and unauthenticated. Customer inspo photos are low-sensitivity, so this is a judgement call, not a defect — flagging it, not fixing it unprompted. | `supabase/schema.sql:148-161` |

---

## 5. Typography — verified against Google Fonts

The brief asked me to confirm the `vietnamese` subset rather than assume. I queried
the Google Fonts CSS API directly:

| Family | Subsets returned | Verdict |
|---|---|---|
| **Fraunces** (opsz 9..144, wght 600) | `latin`, `latin-ext`, **`vietnamese`** | ✅ ships Vietnamese |
| **Be Vietnam Pro** (400, 600) | `latin`, `latin-ext`, **`vietnamese`** | ✅ ships Vietnamese |

**The brief's fallback contingency is unnecessary.** §4 says "If Fraunces doesn't
[include vietnamese], keep it for English-only headings and fall back to Be Vietnam
Pro SemiBold for Vietnamese headings." Fraunces does include it, so headings stay
Fraunces in both languages and that branch can be dropped from the plan.

Current fonts are `Geist` / `Geist_Mono` via `next/font/google` in `app/layout.tsx`
— both get replaced.

---

## 6. Current design system (what's being replaced)

`app/globals.css` defines a standard shadcn OKLCH token set with a pink-ish primary
(`oklch(0.55 0.18 340)`), plus `--success` / `--warning` additions and a `.kiosk`
utility that disables text selection. Dark mode is a `.dark` class with **no toggle
wired anywhere** — it is currently unreachable at runtime.

Radii: single `--radius: 0.65rem` with sm/md/lg/xl derived. Brief wants a
larger, more differentiated family (cards 24 / buttons 16 / pills 999 / previews 20).

Shadows: Tailwind defaults (black-tinted). Brief wants plum-tinted.

12 shadcn primitives exist: `badge button card dialog input label select separator
sonner table tabs textarea`. **These were hand-written**, not pulled from the
registry — `ui.shadcn.com` is blocked by this environment's network policy, so
`npx shadcn add` fails with a 403. Any new primitive must also be hand-authored.
That's a constraint on Phase 2 worth knowing before you plan around the CLI.

`components/` currently holds: `auth/` (2), `layout/` (1), `manager/` (1),
`request/` (3), `tech/` (2), `ui/` (12). **`components/salon/` does not exist.**

Total source: ~2,770 LOC across app/components/lib.

---

## 7. Deploy state — resolved

The Vercel deployment was returning `500 MIDDLEWARE_INVOCATION_FAILED`. Commit
`e494400` hardened `lib/supabase/middleware.ts` so that public routes never
construct a Supabase client and staff routes redirect to `/login` instead of
throwing. Verified locally with **both env vars unset**: `/`, `/request`, `/login`
→ 200; `/tech`, `/manager` → 307.

**Confirmed fixed by you.** Deploy is green. Noting it here only because it
means the Supabase env vars are now present in Vercel — which implies a real
Supabase project exists and is reachable, and makes assumption #1 below
(does the deployed schema match `schema.sql`?) answerable and worth answering.

---

## 8. Assumptions I would otherwise have to guess at

Numbered for easy reply — answer only the ones you want to change.

**Schema & data**
1. `schema.sql` reflects what is actually deployed in your Supabase project. **I could not verify this.** If you have run it, say so; if not, that changes Phase 1 sequencing.
2. B1–B10 require migrations. Per §0 #6 I will write them as separate `supabase/migrations/*.sql` files, gate features behind flags, and **not** apply them. I assume you run them yourself and confirm before I build anything that reads the new columns.
3. `inventory_items` stays dead. The brief never mentions inventory; I won't build UI for it.
4. The 5 nail shapes in the DB (`square almond coffin stiletto round`) vs the brief's 6 (adds **squoval**). Adding it is a CHECK-constraint migration. Assuming yes, since §5 and §8 both specify six shapes.

**Product**
5. `/` landing page: the brief only defines `/request`, `/tech`, `/manager`, `/styleguide`. I assume `/` stays as a minimal router (a kiosk should boot straight to `/request`), and is **not** redesigned. Say if you want it gone or restyled.
6. Salon name, technician roster, real service prices, and durations are all **unknown to me**. I will use clearly-marked placeholders in `lib/pricing.ts` / `lib/services.ts` config files for you to edit, and flag them as faked in the phase summary.
7. Español is "stubbed but wired" (§0 #5) = the locale exists in the i18n map and the toggle can select it, with strings falling back to English. Not translated.
8. "Combo · saves $12" is a placeholder number in config, not a real salon policy.

**Technical**
9. Tokens go in `@theme inline` in `app/globals.css` (Tailwind v4). Confirmed, not assumed — noting it so the decision is visible.
10. I will install `framer-motion`, `browser-image-compression`, and `date-fns` when the phase that needs them arrives — all pre-authorized by §2. For i18n I'll use a **light custom map**, not `next-intl`: the app has three routes and no locale routing, and `next-intl` would add middleware complexity to a middleware that just caused a production outage. Say if you'd rather have `next-intl`.
11. New shadcn primitives must be hand-authored (registry is network-blocked here). No impact on output quality, but it means "just run `npx shadcn add`" isn't available.
12. C1 (double-claim) and C2 (duplicate customers) are **bugs in the current build**, not redesign work. I assume you want them fixed as part of Phase 4 / Phase 3 respectively rather than left in place.

**Scope**
13. Phases 1–6 as written is a large body of work — realistically several sessions. I assume you want genuine checkpoints (I stop, you review) rather than me running straight through. I will not start Phase 1 until you reply.

---

## 9. Recommended sequencing change (one)

The brief runs Phase 1 (design system) → 2 (components) → 3 (`/request`). I'd
keep that, **but insert the migration files as a Phase 1 deliverable** rather
than discovering them mid-Phase-3. Reason: B1–B10 touch every phase, they need
your review and a manual `psql` run before any dependent UI is real, and the
round-trip latency on that is the biggest schedule risk in the plan. Writing
them early means they're approved and applied by the time Phase 3 needs them,
and the UI can build against mock data behind flags in the meantime — which is
exactly what §0 #2 asks for.

Everything else in the phase order stands.
