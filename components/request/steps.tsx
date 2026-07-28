"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ChoiceCard } from "@/components/salon/choice-card";
import { NailShapeIcon } from "@/components/salon/nail-shape-icon";
import { PhotoPicker } from "@/components/salon/photo-picker";
import { ServiceCard } from "@/components/salon/service-card";
import { SwatchCard } from "@/components/salon/swatch-card";
import { FirstAvailableCard, TechCard, type Technician } from "@/components/salon/tech-card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useT, type MessageKey } from "@/lib/i18n";
import {
  availableColors,
  availableShapes,
  maxColors,
  maxPhotos,
} from "@/lib/job-adapter";
import type { KioskDraft } from "@/lib/kiosk/flow";
import { COLOR_FAMILIES, DESIGNS, type ColorFamilyKey } from "@/lib/nail-colors";
import { LENGTH_SCALE, NAIL_SHAPE_KEYS, type NailLength } from "@/lib/nail-shapes";
import {
  SERVICE_GROUPS,
  disabledReason,
  servicesInGroup,
  toggleService,
  type ServiceGroup,
} from "@/lib/services";
import { uploadJobPhoto } from "@/lib/upload";

type Setter = (fn: (d: KioskDraft) => KioskDraft) => void;

// ---------------------------------------------------------------------------

export function ServicesStep({ draft, setDraft }: { draft: KioskDraft; setDraft: Setter }) {
  const t = useT();

  return (
    <div className="flex flex-col gap-8">
      {SERVICE_GROUPS.map((group: ServiceGroup) => (
        <section key={group} className="flex flex-col gap-3">
          <h2 className="text-h2 text-ink font-display">
            {t(`services.${group}` as MessageKey)}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {servicesInGroup(group).map((svc) => {
              const blocked = disabledReason(draft.services, svc.id);
              return (
                <ServiceCard
                  key={svc.id}
                  service={svc}
                  selected={draft.services.includes(svc.id)}
                  disabledReason={
                    blocked
                      ? t("services.needsParent", {
                          group: blocked.group
                            .map((g) => t(`services.${g}` as MessageKey))
                            .join(" / "),
                        })
                      : undefined
                  }
                  onToggle={() =>
                    setDraft((d) => {
                      const result = toggleService(d.services, svc.id);
                      if (result.swappedOutId) {
                        // A swap is expected behaviour, not an error — say so
                        // quietly rather than blocking with a dialog.
                        toast(t("services.swapped", { name: svc.label }));
                      }
                      return { ...d, services: result.selected };
                    })
                  }
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function TechStep({
  draft,
  setDraft,
  technicians,
  baseWaitMin,
}: {
  draft: KioskDraft;
  setDraft: Setter;
  technicians: Technician[];
  baseWaitMin: number;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-5">
      <FirstAvailableCard
        waitMin={baseWaitMin}
        selected={draft.techId === null}
        onSelect={() => setDraft((d) => ({ ...d, techId: null }))}
      />

      {technicians.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {technicians.map((tech) => (
            <TechCard
              key={tech.id}
              tech={tech}
              selected={draft.techId === tech.id}
              onSelect={() => setDraft((d) => ({ ...d, techId: tech.id }))}
            />
          ))}
        </div>
      )}

      {/* Tell them what the choice costs BEFORE they commit to a 40-min wait. */}
      {draft.techId && (
        <p className="text-body text-ink-muted" data-numeric>
          {t("tech.waitInstead", {
            n: technicians.find((x) => x.id === draft.techId)?.busyForMin ?? baseWaitMin,
            base: baseWaitMin,
          })}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ShapeStep({ draft, setDraft }: { draft: KioskDraft; setDraft: Setter }) {
  const t = useT();
  const shapes = availableShapes(NAIL_SHAPE_KEYS);

  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {shapes.map((s) => (
        <ChoiceCard
          key={s}
          label={t(`shape.${s}` as MessageKey)}
          selected={draft.shape === s}
          onSelect={() => setDraft((d) => ({ ...d, shape: s }))}
          media={<NailShapeIcon shape={s} filled={draft.shape === s} />}
        />
      ))}
    </div>
  );
}

export function LengthStep({ draft, setDraft }: { draft: KioskDraft; setDraft: Setter }) {
  const t = useT();
  const lengths = Object.keys(LENGTH_SCALE) as NailLength[];

  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {lengths.map((l) => (
        <ChoiceCard
          key={l}
          label={t(`length.${l}` as MessageKey)}
          selected={draft.length === l}
          onSelect={() => setDraft((d) => ({ ...d, length: l }))}
        />
      ))}
    </div>
  );
}

export function ColorStep({ draft, setDraft }: { draft: KioskDraft; setDraft: Setter }) {
  const t = useT();
  const allowed = availableColors(COLOR_FAMILIES.map((c) => c.key));
  const families = COLOR_FAMILIES.filter((c) => allowed.includes(c.key));
  const limit = maxColors();

  function toggle(key: ColorFamilyKey) {
    setDraft((d) => {
      if (d.colors.includes(key)) {
        return { ...d, colors: d.colors.filter((c) => c !== key) };
      }
      if (limit === 1) return { ...d, colors: [key] };
      if (d.colors.length >= limit) {
        toast(t("color.helper"));
        return d;
      }
      return { ...d, colors: [...d.colors, key] };
    });
  }

  return (
    <div role="group" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {families.map((f) => (
        <SwatchCard
          key={f.key}
          family={f}
          label={t(f.labelKey)}
          selected={draft.colors.includes(f.key)}
          onSelect={() => toggle(f.key)}
        />
      ))}
    </div>
  );
}

export function DesignStep({ draft, setDraft }: { draft: KioskDraft; setDraft: Setter }) {
  const t = useT();
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {DESIGNS.map((d) => (
        <ChoiceCard
          key={d.key}
          label={t(d.labelKey)}
          selected={draft.design === d.key}
          onSelect={() => setDraft((x) => ({ ...x, design: d.key }))}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

const QUICK_NOTES: MessageKey[] = [
  "details.quickAdd.hurry",
  "details.quickAdd.broken",
  "details.quickAdd.sensitive",
  "details.quickAdd.gentle",
];

export function DetailsStep({ draft, setDraft }: { draft: KioskDraft; setDraft: Setter }) {
  const t = useT();

  return (
    <div className="flex flex-col gap-6">
      {/* Most people will not type on a kiosk. The chips are the real input. */}
      <div className="flex flex-wrap gap-2">
        {QUICK_NOTES.map((k) => {
          const phrase = t(k);
          const already = draft.notes.includes(phrase);
          return (
            <Button
              key={k}
              type="button"
              variant={already ? "primary" : "outline"}
              size="sm"
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  notes: already
                    ? d.notes.replace(phrase, "").replace(/\s{2,}/g, " ").trim()
                    : [d.notes.trim(), phrase].filter(Boolean).join(". "),
                }))
              }
            >
              {phrase}
            </Button>
          );
        })}
      </div>

      <Textarea
        rows={5}
        value={draft.notes}
        onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
        placeholder={t("details.notesPlaceholder")}
        aria-label={t("details.question")}
      />

      <PhotoPicker
        photos={draft.photos.slice(0, maxPhotos())}
        onChange={(photos) => setDraft((d) => ({ ...d, photos }))}
        upload={uploadJobPhoto}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ReviewStep({
  draft,
  onEditStep,
  error,
}: {
  draft: KioskDraft;
  onEditStep: (step: string) => void;
  error?: string | null;
}) {
  const t = useT();
  const [showAll] = useState(true);
  void showAll;

  const rows: { key: string; label: string; value: string; step: string }[] = [];

  if (draft.services.length) {
    rows.push({
      key: "services",
      label: t("services.question"),
      value: draft.services.length.toString(),
      step: "services",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="border-hairline bg-surface-raised flex flex-col divide-y rounded-card border">
        <Row label={t("register.firstName")} value={`${draft.firstName} ${draft.lastName}`.trim()} />
        {draft.phone && <Row label={t("register.phone")} value={draft.phone} />}
        {rows.map((r) => (
          <Row key={r.key} label={r.label} value={r.value} onEdit={() => onEditStep(r.step)} />
        ))}
        <Row
          label={t("shape.question")}
          value={t(`shape.${draft.shape}` as MessageKey)}
          onEdit={() => onEditStep("shape")}
        />
        <Row
          label={t("length.question")}
          value={t(`length.${draft.length}` as MessageKey)}
          onEdit={() => onEditStep("length")}
        />
        {draft.colors.length > 0 && (
          <Row
            label={t("color.question")}
            value={draft.colors.map((c) => t(`color.${c}` as MessageKey)).join(", ")}
            onEdit={() => onEditStep("color")}
          />
        )}
        <Row
          label={t("design.question")}
          value={t(`design.${draft.design}` as MessageKey)}
          onEdit={() => onEditStep("design")}
        />
        {draft.notes && (
          <Row
            label={t("details.question")}
            value={draft.notes}
            onEdit={() => onEditStep("details")}
          />
        )}
      </dl>

      {error && (
        <p role="alert" className="text-body text-danger-strong">
          {error}
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}) {
  const t = useT();
  return (
    <div className="flex items-start gap-4 p-4">
      <dt className="text-label text-ink-muted w-40 shrink-0">{label}</dt>
      <dd className="text-body-lg text-ink flex-1">{value || "—"}</dd>
      {onEdit && (
        <Button variant="link" size="sm" onClick={onEdit}>
          {t("common.edit")}
        </Button>
      )}
    </div>
  );
}
