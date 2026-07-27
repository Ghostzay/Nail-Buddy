import type { Metadata } from "next";

import { MotionDemo } from "@/components/styleguide/motion-demo";
import { SalonGallery } from "@/components/styleguide/salon-gallery";
import { StyleguideControls } from "@/components/styleguide/styleguide-controls";
import { Swatch } from "@/components/styleguide/swatch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata: Metadata = {
  title: "Styleguide | Nail Buddy",
  robots: { index: false, follow: false },
};

function Section({
  id,
  title,
  blurb,
  children,
}: {
  id: string;
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-5 scroll-mt-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-ink font-display">{title}</h2>
        {blurb && <p className="text-body text-ink-muted max-w-3xl">{blurb}</p>}
      </div>
      {children}
    </section>
  );
}

const BUTTON_VARIANTS = [
  "primary",
  "plum",
  "secondary",
  "outline",
  "ghost",
  "danger",
  "success",
  "link",
] as const;

export default function StyleguidePage() {
  return (
    <div className="bg-surface-base min-h-screen">
      <StyleguideControls />

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-3">
          <h1 className="text-display text-ink font-display">
            The contract
          </h1>
          <p className="text-body-lg text-ink-muted max-w-3xl">
            Every token and component state, light and dark. Contrast ratios below
            are computed live from the rendered pixels — flip the theme and they
            recompute. If something here fails, it fails in the app too.
          </p>
        </header>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="surfaces"
          title="Surfaces & ink"
          blurb="Warm porcelain, not gray. Ink is deep plum, never pure black — pure black on a cream ground reads as dirt."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Swatch token="--surface-base" label="page background" against="--ink" />
            <Swatch token="--surface-raised" label="cards" against="--ink" />
            <Swatch token="--surface-sunken" label="wells, tracks" against="--ink" />
            <Swatch token="--ink" label="primary text" against="--surface-base" />
            <Swatch
              token="--ink-muted"
              label="secondary text"
              against="--surface-base"
            />
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="accents-fill"
          title="Accents — vivid fills"
          blurb="These are FILLS. The label shown on each is its verified foreground (--on-accent-*). White on coral is only 3.21:1 and fails, which is why the primary button carries a plum label instead. Never use a vivid accent as text on a light surface."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Swatch
              token="--accent-coral"
              fg="--on-accent-coral"
              label="primary action, selection"
              note="fg = ink, not white"
            />
            <Swatch
              token="--accent-plum"
              fg="--on-accent-plum"
              label="headers, dark bands"
            />
            <Swatch
              token="--accent-lavender"
              fg="--on-accent-lavender"
              label="secondary selection"
            />
            <Swatch
              token="--accent-rosegold"
              fg="--on-accent-rosegold"
              label="dividers, ornament"
            />
            <Swatch
              token="--accent-success"
              fg="--on-accent-success"
              label="complete"
            />
            <Swatch
              token="--accent-warning"
              fg="--on-accent-warning"
              label="waiting too long"
            />
            <Swatch
              token="--accent-danger"
              fg="--on-accent-danger"
              label="decline, destructive"
              note="4.40:1 — buttons use -strong instead"
            />
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="accents-strong"
          title="Accents — text & border safe"
          blurb="Darkened so the accent clears 4.5:1 as text on the light base. Use these for accent-colored text, icons, and meaningful borders. On dark they collapse onto the vivid values, so components never branch on theme."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(
              [
                ["coral", "accent text, focus ring"],
                ["plum", "high-emphasis text"],
                ["lavender", "step complete"],
                ["rosegold", "tertiary chips"],
                ["success", "complete text"],
                ["warning", "wait escalation"],
                ["danger", "error text, destructive fill"],
              ] as const
            ).map(([name, label]) => (
              <Swatch
                key={name}
                token={`--accent-${name}-strong`}
                label={label}
                against="--surface-base"
              />
            ))}
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="type"
          title="Typography"
          blurb="Fraunces for display, Be Vietnam Pro for everything else. Both were verified against the Google Fonts API to ship the vietnamese subset — so headings keep their personality in both languages rather than falling back."
        >
          <div className="border-hairline bg-surface-raised flex flex-col gap-6 rounded-card border p-6">
            <div>
              <span className="text-label text-ink-muted">display · 44/48 · Fraunces 600</span>
              <p className="text-display text-ink font-display">
                What shape are you thinking?
              </p>
              <p className="text-display text-ink font-display">
                Bạn muốn kiểu móng nào?
              </p>
            </div>
            <div>
              <span className="text-label text-ink-muted">h1 · 32/40 · Fraunces 600</span>
              <p className="text-h1 text-ink font-display">
                Welcome in — Chào mừng quý khách
              </p>
            </div>
            <div>
              <span className="text-label text-ink-muted">h2 · 24/32 · Be Vietnam Pro 600</span>
              <p className="text-h2 text-ink">Choose your technician</p>
            </div>
            <div>
              <span className="text-label text-ink-muted">
                body-lg · 19/28 · default on /request
              </span>
              <p className="text-body-lg text-ink max-w-2xl">
                Móng ngắn, vuông, màu nude bóng. Nếu được thì làm nhẹ tay ở ngón
                cái giùm em, ngón đó hơi đau.
              </p>
            </div>
            <div>
              <span className="text-label text-ink-muted">
                body · 16/24 · default on /tech, /manager
              </span>
              <p className="text-body text-ink max-w-2xl">
                Short and square, nude with a glossy top coat. Please be gentle on
                my thumb.
              </p>
            </div>
            <div className="flex flex-wrap items-baseline gap-6">
              <div>
                <span className="text-label text-ink-muted">label · 14/20 · uppercase</span>
                <p className="text-label text-ink">Requested tech</p>
              </div>
              <div>
                <span className="text-label text-ink-muted">caption · 13/18</span>
                <p className="text-caption text-ink-muted">Estimate — final price set by your tech</p>
              </div>
            </div>
            <div className="border-hairline border-t pt-4">
              <span className="text-label text-ink-muted">
                tabular numerals — digits must not jitter while counting
              </span>
              <p className="text-h1 text-ink" data-numeric>
                00:11 · 00:18 · 00:41
              </p>
            </div>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="shape"
          title="Shape & elevation"
          blurb="One radius family. Shadows are tinted plum, not black — black shadows over warm cream look like grime."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ["rounded-card", "cards · 24px"],
                ["rounded-media", "image previews · 20px"],
                ["rounded-control", "buttons, inputs · 16px"],
                ["rounded-pill", "chips · 999px"],
              ] as const
            ).map(([cls, label]) => (
              <div key={cls} className="flex flex-col gap-2">
                <div
                  className={`bg-surface-sunken border-hairline-strong h-20 border-2 ${cls}`}
                />
                <code className="text-caption text-ink font-mono">{cls}</code>
                <span className="text-caption text-ink-muted">{label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {(
              [
                ["shadow-sm", "resting chips"],
                ["shadow-md", "cards"],
                ["shadow-lg", "dialogs, the kiosk footer"],
                ["shadow-glow", "selection ring"],
              ] as const
            ).map(([cls, label]) => (
              <div key={cls} className="flex flex-col gap-2">
                <div className={`bg-surface-raised h-20 rounded-card ${cls}`} />
                <code className="text-caption text-ink font-mono">{cls}</code>
                <span className="text-caption text-ink-muted">{label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="motion"
          title="Motion"
          blurb="Transform and opacity only. Press feedback is scale(0.97) at 100ms on everything tappable. Cap concurrent movement at three — restraint is the premium signal."
        >
          <MotionDemo />
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="buttons"
          title="Button — every variant"
          blurb="Hover and focus these directly; the states are live, not simulated. Tab to one to see the 3px focus ring, which is plum on light and lavender on dark."
        >
          <div className="border-hairline bg-surface-raised overflow-x-auto rounded-card border">
            <table className="w-full min-w-[42rem] border-collapse">
              <thead>
                <tr className="border-hairline border-b">
                  {["variant", "default", "disabled", "loading"].map((h) => (
                    <th
                      key={h}
                      className="text-label text-ink-muted px-4 py-3 text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BUTTON_VARIANTS.map((v) => (
                  <tr key={v} className="border-hairline border-b last:border-0">
                    <td className="px-4 py-3">
                      <code className="text-caption text-ink font-mono">{v}</code>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant={v}>Send request</Button>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant={v} disabled>
                        Send request
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant={v} loading>
                        Sending…
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-label text-ink-muted">
              sizes — 48px minimum on /tech, 56px+ on /request
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">sm · 48</Button>
              <Button size="md">md · 48</Button>
              <Button size="lg">lg · 56</Button>
              <Button size="xl">xl · 64 thumb zone</Button>
              <Button size="icon" aria-label="Icon button">
                ✓
              </Button>
            </div>
            <Button size="xl" block>
              block — the kiosk Send button
            </Button>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="fields"
          title="Fields"
          blurb="56px tall so they clear the kiosk touch minimum. Error state is conveyed by border, icon, and message — never color alone."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sg-default">Default</Label>
              <Input id="sg-default" placeholder="(770) 555-0142" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sg-filled">Filled</Label>
              <Input id="sg-filled" defaultValue="Mai Nguyễn" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sg-disabled">Disabled</Label>
              <Input id="sg-disabled" placeholder="Unavailable" disabled />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sg-error" className="text-danger-strong">
                Error
              </Label>
              <Input
                id="sg-error"
                defaultValue="770555"
                aria-invalid
                aria-describedby="sg-error-msg"
              />
              <p
                id="sg-error-msg"
                role="alert"
                className="text-caption text-danger-strong"
              >
                That&apos;s only 6 digits — a phone number needs 10.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="sg-notes">Notes</Label>
              <Textarea
                id="sg-notes"
                rows={5}
                placeholder="Móng ngắn, vuông, màu nude bóng"
              />
            </div>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="badges"
          title="Badges"
          blurb="Tinted wash plus -strong text. Meaning never rides on color alone — pair every status badge with an icon or a word."
        >
          <div className="flex flex-wrap gap-2">
            {(
              [
                "neutral",
                "coral",
                "plum",
                "lavender",
                "rosegold",
                "success",
                "warning",
                "danger",
                "solid-coral",
                "solid-plum",
                "outline",
              ] as const
            ).map((v) => (
              <Badge key={v} variant={v}>
                {v}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral" size="sm">
              Almond
            </Badge>
            <Badge variant="neutral" size="sm">
              Medium
            </Badge>
            <Badge variant="neutral" size="sm">
              Nude
            </Badge>
            <Badge variant="neutral" size="sm">
              French
            </Badge>
            <Badge variant="warning">⏱ waiting 12 min</Badge>
            <Badge variant="danger">⚠ acrylic sensitivity</Badge>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section id="cards" title="Card">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-h2 font-display">Mai N.</CardTitle>
                <CardDescription>waiting 4 min · requested Linh</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge variant="neutral" size="sm">
                  Gel-X
                </Badge>
                <Badge variant="neutral" size="sm">
                  Almond
                </Badge>
                <Badge variant="neutral" size="sm">
                  Nude
                </Badge>
              </CardContent>
            </Card>
            <Card className="border-coral shadow-glow">
              <CardHeader>
                <CardTitle className="text-h2 font-display">Selected</CardTitle>
                <CardDescription>
                  coral border + glow — the selection treatment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="solid-coral">✓ chosen</Badge>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* ---------------------------------------------------------------- */}
        <Section
          id="salon"
          title="Salon components"
          blurb="The Phase 2 library. These are live and interactive — change the nail preview, break the service rules, tap a completed progress dot. Switching language at the bottom re-renders every string on this page, which is the check that nothing is hardcoded."
        >
          <SalonGallery />
        </Section>

        <footer className="border-hairline text-caption text-ink-muted border-t pt-6">
          Phase 2 contract. Pages (/request, /tech, /manager) are assembled from
          these in Phases 3–5.
        </footer>
      </main>
    </div>
  );
}
