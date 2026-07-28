# Nail Buddy

A walk-in nail salon system built with Next.js 15 (App Router), TypeScript,
Tailwind CSS, shadcn/ui, and Supabase.

- **`/request`** — full-screen kiosk. Dynamic steps (a wax-only client sees 3,
  a full set sees 7), a live nail preview that morphs with each choice, running
  price and duration estimate, EN/VI/ES, and kiosk hardening (idle reset,
  draft persistence, back-button guard). No login required.
- **`/tech`** — realtime job queue with an atomic claim (two techs cannot
  double-claim), undo toasts, a polling fallback when realtime drops, and an
  on-demand "Translate to Vietnamese" button per job. Requires staff sign-in.
- **`/manager`** — stats, queue health, colour/shape trends, URL-reflected
  date filters and CSV export. Requires staff sign-in.
- **`/styleguide`** — the design contract: every token and component state in
  light and dark, with contrast ratios computed from rendered pixels.
- **`/login`** — Supabase email/password sign-in for staff.

## Folder structure

```
nail-buddy/
├─ app/
│  ├─ layout.tsx                    # fonts, providers (prefs, i18n, motion)
│  ├─ globals.css                   # ALL design tokens (Tailwind v4 @theme inline)
│  ├─ error.tsx / not-found.tsx     # route-level recovery
│  ├─ request/page.tsx              # kiosk shell (server) -> components/request/kiosk
│  ├─ tech/page.tsx                 # queue shell (server)
│  ├─ manager/page.tsx              # dashboard shell (server)
│  ├─ styleguide/page.tsx           # the design contract
│  ├─ login/page.tsx
│  └─ api/
│     ├─ jobs/route.ts              # POST create   · jobs/[id]/route.ts PATCH (atomic)
│     ├─ queue/route.ts             # GET  queue    (realtime refetch + poll fallback)
│     ├─ client-lookup/route.ts     # POST masked, rate-limited phone lookup
│     └─ translate/route.ts         # POST on-demand VI translation
├─ components/
│  ├─ salon/                        # the component library (18 files)
│  │  ├─ live-nail-preview.tsx      #   the signature element
│  │  ├─ choice-card · swatch-card · service-card · tech-card
│  │  ├─ phone-keypad · progress-rail · step-shell · photo-picker
│  │  ├─ client-confirm-card · repeat-last-visit-card · registration-form
│  │  ├─ job-card · wait-badge · status-pill · stat-tile
│  │  └─ states.tsx                 #   empty / error / skeletons
│  ├─ request/                      # kiosk orchestrator, gates, steps, preview bar
│  ├─ tech/tech-queue.tsx
│  ├─ manager/dashboard.tsx
│  ├─ providers/                    # preferences (theme/text/haptics), motion
│  ├─ styleguide/                   # swatch, motion demo, salon gallery
│  └─ ui/                           # shadcn primitives
├─ lib/
│  ├─ i18n/                         # typed message map (en/vi/es)
│  ├─ kiosk/flow.ts                 # dynamic step machine
│  ├─ nail-shapes.ts                # 6 silhouettes + morph invariant
│  ├─ nail-colors.ts · services.ts · pricing.ts   # editable config
│  ├─ job-adapter.ts                # maps UI <-> whichever schema is live
│  ├─ flags.ts                      # migration gates
│  ├─ analytics.ts · queue.ts · upload.ts · motion.ts
│  └─ supabase/                     # client · server · middleware · config
├─ hooks/use-kiosk-session.ts       # draft persistence, idle reset, back guard
├─ scripts/seed.ts                  # ~20 demo jobs across all statuses
├─ supabase/
│  ├─ schema.sql                    # the CURRENT schema
│  └─ migrations/                   # written, NOT applied — see its README
├─ DESIGN.md                        # tokens, rules, and the reasoning
└─ AUDIT.md                         # Phase 0 audit + gap analysis
```

## Database schema

See [`supabase/schema.sql`](./supabase/schema.sql) for the full SQL (run it in
the Supabase SQL editor). Summary:

- **`customers`** — `id, name, phone, notes, created_at`
- **`jobs`** — `id, customer_id, shape, length, color_family, design_type,
  notes, notes_vi, photo_url, status, created_at, updated_at`
  - `notes_vi` is only ever populated when a tech clicks "Translate to
    Vietnamese" on `/tech` — nothing is translated automatically.
  - `status` is one of `pending | accepted | declined | completed`.
- **`inventory_items`** — `id, name, category, quantity,
  low_stock_threshold, created_at`

RLS policies allow anonymous (`anon`) inserts on `customers`/`jobs` (for the
public kiosk) and full read/write for `authenticated` staff. A public
`job-photos` storage bucket is created for kiosk photo uploads. Realtime is
enabled on `jobs` for the `/tech` queue.

## Current state — read this before deploying

The app runs **against the existing schema with every migration unapplied**.
`lib/flags.ts` gates each new capability and `lib/job-adapter.ts` maps the UI
onto whatever is actually live — hiding `squoval` and the extra colour families
rather than writing values the current CHECK constraints would reject, and
folding anything the old schema can't hold (multi-service, extra colours,
sensitivities) into the notes field instead of dropping it.

So: deploy now, it works. Apply migrations later, flip the matching flag, and
the richer behaviour turns on with no second UI. See
[`supabase/migrations/README.md`](./supabase/migrations/README.md) — **0001 has
a manual dedupe step**, because the old code created a new customer row on
every request.

## Setup

1. **Create a Supabase project** and run `supabase/schema.sql` in the SQL
   editor.
2. **Create a staff user** (Authentication -> Users -> Add user) for signing
   in at `/login`.
3. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project
     Settings -> API).
   - Optionally `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to enable the
     "Translate to Vietnamese" button on `/tech`. Leave both unset and the
     button will surface an error when clicked instead of silently
     translating anything — translation is always opt-in, never automatic.
4. Install dependencies and run the dev server:
   ```bash
   npm install
   npm run dev
   ```
5. Optionally seed demo data so no screen is ever empty (needs
   `SUPABASE_SERVICE_ROLE_KEY`):
   ```bash
   npm run seed            # insert ~20 jobs across every status
   npm run seed -- --wipe  # remove them again
   ```

Checks: `npm run typecheck`, `npm run lint`, `npm run build`.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the same environment variables from `.env.local` to the Vercel
   project (Production + Preview).
3. Deploy. `/request` is meant to be opened full-screen on a salon tablet
   (e.g. as a pinned browser tab or via a kiosk-mode browser app).
