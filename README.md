# Nail Buddy

A walk-in nail salon system built with Next.js 15 (App Router), TypeScript,
Tailwind CSS, shadcn/ui, and Supabase.

- **`/request`** — full-screen, kiosk/tablet-friendly customer request form.
  No login required.
- **`/tech`** — realtime job queue for nail techs (Accept / Decline / Mark
  Complete), with an on-demand "Translate to Vietnamese" button per job.
  Requires staff sign-in.
- **`/manager`** — dashboard listing today's jobs and customers. Requires
  staff sign-in.
- **`/login`** — Supabase email/password sign-in for staff.

## Folder structure

```
nail-buddy/
├─ app/
│  ├─ page.tsx                     # landing page (links to /request, /tech, /manager)
│  ├─ layout.tsx                   # root layout, fonts, <Toaster />
│  ├─ globals.css                  # Tailwind v4 + shadcn theme tokens
│  ├─ login/
│  │  └─ page.tsx                  # staff sign-in page
│  ├─ request/
│  │  └─ page.tsx                  # kiosk request page (public)
│  ├─ tech/
│  │  └─ page.tsx                  # realtime job queue (staff-only)
│  ├─ manager/
│  │  └─ page.tsx                  # today's jobs/customers dashboard (staff-only)
│  └─ api/
│     ├─ jobs/
│     │  ├─ route.ts               # POST -> create customer + job
│     │  └─ [id]/route.ts          # PATCH -> update job status
│     └─ translate/
│        └─ route.ts               # POST -> on-demand Vietnamese translation
├─ components/
│  ├─ ui/                          # shadcn/ui primitives (button, card, input, ...)
│  ├─ request/
│  │  ├─ request-kiosk.tsx         # step-by-step kiosk wizard
│  │  ├─ big-choice-grid.tsx       # big touch-target option grid
│  │  └─ photo-upload.tsx          # optional photo -> Supabase Storage
│  ├─ tech/
│  │  ├─ tech-queue.tsx            # realtime subscription + tabs
│  │  └─ job-card.tsx              # job card with actions + translate button
│  ├─ manager/
│  │  └─ dashboard.tsx             # stats + tables
│  ├─ auth/
│  │  ├─ login-form.tsx
│  │  └─ sign-out-button.tsx
│  └─ layout/
│     └─ staff-header.tsx          # shared nav for /tech and /manager
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts                 # browser client
│  │  ├─ server.ts                 # server component/route handler client
│  │  └─ middleware.ts             # session refresh + route protection
│  ├─ types.ts                     # Database types, domain types, option lists
│  ├─ translate.ts                 # Anthropic/OpenAI Vietnamese translation helper
│  └─ utils.ts                     # `cn()` class helper
├─ middleware.ts                   # wires up lib/supabase/middleware
├─ supabase/
│  └─ schema.sql                   # tables, RLS policies, storage bucket
├─ components.json                 # shadcn/ui config
└─ .env.example
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

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the same environment variables from `.env.local` to the Vercel
   project (Production + Preview).
3. Deploy. `/request` is meant to be opened full-screen on a salon tablet
   (e.g. as a pinned browser tab or via a kiosk-mode browser app).
