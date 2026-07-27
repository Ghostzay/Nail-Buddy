"use client";

import { useState } from "react";

import { ChoiceCard } from "@/components/salon/choice-card";
import { ClientConfirmCard } from "@/components/salon/client-confirm-card";
import { ComboBadge } from "@/components/salon/combo-badge";
import { JobCard } from "@/components/salon/job-card";
import { LanguageToggle } from "@/components/salon/language-toggle";
import { LiveNailPreview } from "@/components/salon/live-nail-preview";
import { NailShapeIcon } from "@/components/salon/nail-shape-icon";
import { PhoneKeypad } from "@/components/salon/phone-keypad";
import { PhotoPicker, type PickedPhoto } from "@/components/salon/photo-picker";
import { ProgressRail } from "@/components/salon/progress-rail";
import { RegistrationForm, type RegistrationValues } from "@/components/salon/registration-form";
import { RepeatLastVisitCard } from "@/components/salon/repeat-last-visit-card";
import { ServiceCard } from "@/components/salon/service-card";
import { StatTile, Sparkline } from "@/components/salon/stat-tile";
import { StatusPill, type JobStatus } from "@/components/salon/status-pill";
import { SwatchCard } from "@/components/salon/swatch-card";
import { TechCard, FirstAvailableCard } from "@/components/salon/tech-card";
import { WaitBadge } from "@/components/salon/wait-badge";
import {
  EmptyState,
  ErrorState,
  JobCardSkeleton,
  StatTileSkeleton,
} from "@/components/salon/states";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { COLOR_FAMILIES, DESIGNS, type ColorFamilyKey, type DesignKey } from "@/lib/nail-colors";
import { NAIL_SHAPE_KEYS, assertSameStructure, type NailLength, type NailShape } from "@/lib/nail-shapes";
import { estimate } from "@/lib/pricing";
import { SERVICE_BY_ID, disabledReason, toggleService } from "@/lib/services";

function Row({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-h2 font-display text-ink">{title}</h3>
        {note && <p className="text-body text-ink-muted max-w-3xl">{note}</p>}
      </div>
      {children}
    </div>
  );
}

const minsAgo = (n: number) => new Date(Date.now() - n * 60000).toISOString();

export function SalonGallery() {
  const t = useT();

  const [shape, setShape] = useState<NailShape>("almond");
  const [length, setLength] = useState<NailLength>("medium");
  const [colors, setColors] = useState<ColorFamilyKey[]>(["reds"]);
  const [design, setDesign] = useState<DesignKey>("solid");

  const [phone, setPhone] = useState("770555");
  const [step, setStep] = useState(2);
  const [services, setServices] = useState<string[]>(["gel-x"]);
  const [tech, setTech] = useState<string>("first");
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [reg, setReg] = useState<RegistrationValues>({
    firstName: "Mai",
    lastName: "",
    phone: "7705550142",
    sensitivities: ["acrylic"],
    smsConsent: false,
  });

  const est = estimate(services);
  const shapeProblems = assertSameStructure();

  return (
    <div className="flex flex-col gap-14">
      {/* ---------------------------------------------------------------- */}
      <Row
        title="Live nail preview"
        note="The signature element. Shape morphs numerically between hand-authored silhouettes; length springs from the cuticle; lacquer wipes on in 400ms; the gloss ellipse is always present. Tap around and watch the same SVG change."
      >
        {shapeProblems.length > 0 && (
          <p role="alert" className="text-body text-danger-strong">
            Path invariant broken: {shapeProblems.join("; ")}
          </p>
        )}

        <div className="border-hairline bg-surface-raised flex flex-wrap items-center gap-8 rounded-card border p-6">
          <LiveNailPreview
            state={{ shape, length, colors, design }}
            size={190}
          />

          <div className="flex min-w-64 flex-1 flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {NAIL_SHAPE_KEYS.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={shape === s ? "primary" : "outline"}
                  onClick={() => setShape(s)}
                >
                  {t(`shape.${s}` as const)}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(["short", "medium", "long", "xl"] as NailLength[]).map((l) => (
                <Button
                  key={l}
                  size="sm"
                  variant={length === l ? "primary" : "outline"}
                  onClick={() => setLength(l)}
                >
                  {t(`length.${l}` as const)}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {COLOR_FAMILIES.map((c) => (
                <Button
                  key={c.key}
                  size="sm"
                  variant={colors.includes(c.key) ? "primary" : "outline"}
                  onClick={() =>
                    setColors((prev) =>
                      prev.includes(c.key)
                        ? prev.filter((x) => x !== c.key)
                        : [...prev, c.key].slice(-3)
                    )
                  }
                >
                  {t(c.labelKey)}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {DESIGNS.map((d) => (
                <Button
                  key={d.key}
                  size="sm"
                  variant={design === d.key ? "primary" : "outline"}
                  onClick={() => setDesign(d.key)}
                >
                  {t(d.labelKey)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="NailShapeIcon" note="Hand-authored per shape. Outline when idle, filled when selected.">
        <div className="flex flex-wrap gap-6">
          {NAIL_SHAPE_KEYS.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <NailShapeIcon shape={s} filled={i % 2 === 1} />
              <span className="text-caption text-ink-muted">{t(`shape.${s}` as const)}</span>
            </div>
          ))}
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="ChoiceCard" note="Idle · selected · disabled-with-reason. Selection is ring + glow + checkmark, never colour alone.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <ChoiceCard label={t("shape.square")} media={<NailShapeIcon shape="square" />} />
          <ChoiceCard
            label={t("shape.almond")}
            selected
            media={<NailShapeIcon shape="almond" filled />}
          />
          <ChoiceCard label={t("length.long")} sublabel="+2 weeks wear" priceDelta="+$8" />
          <ChoiceCard
            label={t("design.art")}
            disabled
            disabledReason={t("services.needsParent", { group: t("services.hands") })}
          />
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="SwatchCard" note="A lacquer drop with a gloss highlight, not a flat circle. Label + checkmark carry the meaning.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {COLOR_FAMILIES.slice(0, 5).map((c, i) => (
            <SwatchCard key={c.key} family={c} label={t(c.labelKey)} selected={i === 1} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {COLOR_FAMILIES.slice(5).map((c) => (
            <SwatchCard key={c.key} family={c} label={t(c.labelKey)} />
          ))}
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="ProgressRail" note="Dots fill like polish. Completed dots are tappable and keep forward answers; the rail shrinks when steps are skipped.">
        <div className="flex flex-col gap-4">
          <ProgressRail
            steps={["signin", "services", "tech", "shape", "colour"]}
            currentIndex={step}
            onJumpTo={setStep}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))}>
              −
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStep((s) => Math.min(4, s + 1))}>
              +
            </Button>
            <span className="text-caption text-ink-muted self-center">
              wax-only client sees four steps, not eight
            </span>
          </div>
          <ProgressRail steps={["signin", "services", "tech", "details"]} currentIndex={1} />
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="PhoneKeypad" note="72px keys, live formatting, auto-lookup on the 10th digit. Not an OS keyboard — that eats half a tablet and shifts the layout.">
        <div className="flex flex-wrap gap-10">
          <PhoneKeypad value={phone} onChange={setPhone} />
          <div className="flex flex-col gap-8">
            <PhoneKeypad value="7705550142" onChange={() => {}} loading />
            <PhoneKeypad
              value="770555"
              onChange={() => {}}
              error={t("phone.invalid", { n: 6 })}
            />
          </div>
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="Sign-in cards" note="Masked confirmation and one-tap rebook. Nothing unmasked ever reaches the device.">
        <div className="grid gap-4 lg:grid-cols-2">
          <ClientConfirmCard
            client={{
              clientId: "1",
              displayName: "Mai N.",
              maskedPhone: "(•••) •••-0142",
              lastVisitSummary: "Gel-X · Almond · Nude French",
              usualTech: "Linh",
              sensitivities: [t("sensitivity.acrylic")],
            }}
            onConfirm={() => {}}
            onReject={() => {}}
            onEdit={() => {}}
          />
          <RepeatLastVisitCard
            summary="Gel-X · Almond · Medium · Nude · French"
            onRepeat={() => {}}
            onDifferent={() => {}}
          />
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row
        title="ServiceCard + ComboBadge"
        note="Live rules. Pick a Hands and a Feet service to trigger the combo. Picking a second base in the same group swaps rather than errors. Add-ons are disabled with a reason until a parent exists."
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-body text-ink" data-numeric>
            {t("common.estimate")} · ${(est.totalCents / 100).toFixed(0)} ·{" "}
            {t("common.aboutMinutes", { n: est.durationMin })}
          </span>
          <ComboBadge savingCents={est.comboDiscountCents} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["gel-x", "fill", "classic-pedi", "wax-brow", "nail-art", "paraffin"].map((id) => {
            const svc = SERVICE_BY_ID.get(id)!;
            const blocked = disabledReason(services, id);
            return (
              <ServiceCard
                key={id}
                service={svc}
                selected={services.includes(id)}
                disabledReason={
                  blocked
                    ? t("services.needsParent", {
                        group: blocked.group.map((g) => t(`services.${g}` as const)).join("/"),
                      })
                    : undefined
                }
                onToggle={() => setServices((prev) => toggleService(prev, id).selected)}
              />
            );
          })}
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="TechCard" note="First available is pinned and pre-selected. Monogram fallback on the plum/lavender gradient — never a grey silhouette.">
        <FirstAvailableCard
          waitMin={10}
          selected={tech === "first"}
          onSelect={() => setTech("first")}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { id: "linh", displayName: "Linh Tran", specialties: ["art", "gel"], busyForMin: null },
            { id: "trang", displayName: "Trang Vo", specialties: ["pedi", "wax"], busyForMin: 25 },
            { id: "kim", displayName: "Kim Le", specialties: ["dip"], busyForMin: 40 },
          ].map((tc) => (
            <TechCard
              key={tc.id}
              tech={tc}
              selected={tech === tc.id}
              onSelect={() => setTech(tc.id)}
            />
          ))}
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="PhotoPicker" note="Local preview is instant; compression and upload run in the background and never block Send. HEIC is rejected with a message rather than silently uploaded.">
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="RegistrationForm" note="One screen. No email, no birthday, no address. Validation on blur. SMS consent is queue-only and separate.">
        <div className="max-w-2xl">
          <RegistrationForm values={reg} onChange={setReg} onSubmit={() => {}} />
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="StatusPill + WaitBadge" note="Colour AND icon AND text. Wait escalates neutral → amber → danger at 5 and 15 minutes.">
        <div className="flex flex-wrap gap-2">
          {(["open", "claimed", "in_progress", "complete", "cancelled"] as JobStatus[]).map((s) => (
            <StatusPill key={s} status={s} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <WaitBadge since={minsAgo(0)} />
          <WaitBadge since={minsAgo(7)} />
          <WaitBadge since={minsAgo(23)} />
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="JobCard" note="Safety flags sit above the request, not buried in notes. Requested-tech badge, returning-client context, translate on demand.">
        <div className="grid gap-4 lg:grid-cols-2">
          <JobCard
            job={{
              id: "1",
              status: "open",
              createdAt: minsAgo(4),
              customerName: "Mai N.",
              chips: ["Gel-X", "Almond", "Medium", "Nude"],
              waxing: ["brow", "lip"],
              notes: "Please be gentle on my thumb, the nail is split.",
              sensitivities: [t("sensitivity.acrylic")],
              requestedTechName: "you",
              requestedIsMe: true,
              visitCount: 6,
              lastVisitSummary: "Gel-X · Almond · Nude French",
            }}
            onAccept={() => {}}
            onDecline={() => {}}
            onTranslate={async () => {}}
          />
          <JobCard
            job={{
              id: "2",
              status: "open",
              createdAt: minsAgo(23),
              customerName: "Jordan P.",
              chips: ["Classic pedi", "Reds"],
              notes: "Móng ngắn, vuông, màu nude bóng.",
              notesVi: "Móng ngắn, vuông, màu nude bóng.",
            }}
            onAccept={() => {}}
            onDecline={() => {}}
          />
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="StatTile" note="A number without a comparison is decoration. Delta inverts for metrics where a rise is bad.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label={t("manager.waitingNow")} value={7} deltaPct={38} invertDelta />
          <StatTile label={t("manager.completedToday")} value={24} deltaPct={12} />
          <StatTile
            label={t("manager.avgWait")}
            value={11}
            unit="min"
            deltaPct={-8}
            invertDelta
            sparkline={<Sparkline points={[8, 12, 9, 15, 11, 7, 11]} />}
          />
          <StatTileSkeleton />
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="Empty, error, loading" note="Built before they were needed. Empty invites; error says what happened and what to do.">
        <div className="grid gap-4 lg:grid-cols-2">
          <EmptyState title={t("queue.empty")} />
          <ErrorState onRetry={() => {}} />
          <ErrorState offline onRetry={() => {}} />
          <JobCardSkeleton />
        </div>
      </Row>

      {/* ---------------------------------------------------------------- */}
      <Row title="LanguageToggle" note="EN / VI / ES as text. A flag is a country, not a language. Switching re-renders every string on this page.">
        <LanguageToggle />
      </Row>
    </div>
  );
}
