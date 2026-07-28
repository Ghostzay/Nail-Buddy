# Design system

The live contract is **`/styleguide`** — it renders every token and component
state in light and dark, and computes contrast ratios from the actual rendered
pixels. When this document and that page disagree, the page is right.

## Colour

Reference: a polish wall — creamy neutral shelving, saturated lacquer drops, a
glossy specular highlight. Not "wellness spa beige".

Tokens live in `app/globals.css` and are registered for Tailwind in
`@theme inline` (this is Tailwind **v4**, CSS-first; there is no
`tailwind.config.ts` and adding one would do nothing).

### Every accent is a triad

Use the wrong member and you ship a contrast bug:

| Member | Use | Example |
|---|---|---|
| `--accent-X` / `bg-coral` | **Fills only.** Put `on-X` on top. | primary button background |
| `--accent-X-strong` / `text-coral-strong` | Accent as **text, icon, or meaningful border** on light surfaces. ≥4.5:1. | error text, focus ring |
| `--on-accent-X` / `text-on-coral` | The verified foreground for the vivid fill. | primary button label |

### Why the primary button has a plum label

White on coral is **3.21:1** and fails WCAG AA. Ink (deep plum) on coral is
**5.08:1** and passes. Rather than desaturate the brand colour to make white
work, the label changed. Plum-on-coral also reads far more like lacquer than
generic white-on-coral.

Two more measured results that shaped the system:

- **Lavender on cream is 2.21:1** — it fails even the 3:1 non-text threshold,
  so it cannot be a border or a completed-step dot without the `-strong` tier.
- **Success, warning, rosegold all fail as foregrounds** (2.78 / 2.31 / 1.93).
  They are fill-only colours.
- `--accent-danger` as a fill only reaches 4.40:1 with white, so destructive
  buttons fill with `-strong` instead. On dark, `-strong` lifts to a pale tint,
  so `--on-accent-danger-strong` flips to dark ink.

Dark mode is **not an inversion** — it is a plum-black room (`#171018`), not a
grey one, and the accents are lifted rather than dimmed. On dark, `-strong`
collapses onto the vivid value so components never branch on theme.

### Rules

- Never `bg-[#hex]` in page or component code. The only legitimate raw colour
  is `lib/nail-colors.ts`, which holds pigment values the preview paints — and
  it never styles UI chrome.
- Never convey state by colour alone. Selection is ring **+** glow **+**
  checkmark. Status is colour **+** icon **+** text.

## Typography

- **Display — Fraunces.** Step questions and screen titles only.
- **Body/UI — Be Vietnam Pro.** Chosen because it was drawn for Vietnamese
  diacritics.

Both were verified against the Google Fonts API to ship the `vietnamese`
subset, so headings stay Fraunces in both languages. (An earlier plan assumed
Fraunces lacked it and specified a fallback — that fallback is unnecessary.)

Scale: `text-display` 44/48 · `text-h1` 32/40 · `text-h2` 24/32 ·
`text-body-lg` 19/28 (default on `/request`) · `text-body` 16/24 (default on
`/tech`, `/manager`) · `text-label` 14/20 uppercase · `text-caption` 13/18.

Anything counting — timers, queue positions, stats — needs `data-numeric`,
which applies tabular figures so digits don't jitter.

A **Larger text** toggle bumps the root to 112% and persists.

## Shape, spacing, elevation

Radii, one family: `rounded-card` 24 · `rounded-media` 20 · `rounded-control`
16 · `rounded-pill` 999.

Touch targets: **56px minimum on `/request`**, **48px on `/tech`**. Selection
cards are much larger. Minimum gap between tappable things on the kiosk is
16px — fingers, acetone, wet hands.

Shadows are tinted plum, never black; black shadows over warm cream read as
grime. `shadow-glow` is the selection ring.

Kiosk max content width is 880px. Don't stretch to 1280 on a landscape tablet.

## Motion

Primitives in `lib/motion.ts`. Durations: instant 100 / fast 160 / base 240 /
slow 360 / entrance 480. Easing `cubic-bezier(0.22, 1, 0.36, 1)`. Spring is
`stiffness 420, damping 32, mass 0.9`.

- Animate `transform` and `opacity` only.
- Press feedback is `active:scale-[0.97]` in CSS — not a motion component.
- Step transitions: out `-24px`, in `+24px`, `AnimatePresence mode="wait"`.
- **Never animate a whole card's opacity to signal urgency.** `animate-pulse`
  fades the text with it and reads as *disabled*. The overdue JobCard pulses a
  border-only overlay instead.
- Cap concurrent movement at ~3. Restraint is the premium signal.

### Reduced motion

Wired **once**: `MotionConfig reducedMotion="user"` at the root plus a CSS
clamp in `globals.css`. Do not add `useReducedMotion()` per component.

**One deliberate exception:** `LiveNailPreview`. `MotionConfig` only suppresses
transform and layout animations, and a `d`-attribute tween, a gradient sweep,
and glitter particles are none of those — they would keep running. It is
commented in place.

## The nail geometry

`lib/nail-shapes.ts`. Six silhouettes, each `M` + exactly six `C` + `Z`, with
anchors always in the same order. That shared skeleton is what lets them
interpolate numerically without a morph library — the tip anchors slide
together for pointed shapes and apart for flat ones.

`assertSameStructure()` guards the invariant and is surfaced on `/styleguide`.
Break it and the morph tears.

## i18n

`lib/i18n`. Keys are typed dot-paths derived from the English catalogue, so a
typo is a compile error. Missing keys fall back to English, which is what makes
the stubbed Spanish shippable.

**No hardcoded English in JSX** — including toasts, aria-labels, and errors.
The check: switch the language toggle on `/styleguide` and look for anything
that doesn't move. (The styleguide's own descriptive prose is dev tooling and
is intentionally English-only.)

## Schema state

The migrations in `supabase/migrations/` are **written, not applied**. Every
feature depending on one is gated in `lib/flags.ts`, and `lib/job-adapter.ts`
maps the UI's vocabulary onto whichever schema is actually live — hiding
`squoval` and the extra colour families rather than coercing them into values
the current CHECK constraints would reject.

With all flags off the whole app builds, renders, and submits real jobs.
