"use client";

import { LiveNailPreview } from "@/components/salon/live-nail-preview";
import { ComboBadge } from "@/components/salon/combo-badge";
import { useT } from "@/lib/i18n";
import type { KioskDraft } from "@/lib/kiosk/flow";
import { estimate, formatMoney } from "@/lib/pricing";
import { requiresNailChoices } from "@/lib/services";
import { cn } from "@/lib/utils";

/**
 * The persistent footer. Carries the assembled nail, the running summary, and
 * the estimate — labelled as an estimate, because the tech sets the real price
 * and a number that later changes without warning is how you lose trust.
 *
 * The single glass surface in the app (§14). Everything else is opaque.
 */
export function PreviewBar({
  draft,
  className,
}: {
  draft: KioskDraft;
  className?: string;
}) {
  const t = useT();
  const est = estimate(draft.services);
  const showNail = requiresNailChoices(draft.services);

  const summary = [
    showNail ? t(`shape.${draft.shape}` as const) : null,
    showNail ? t(`length.${draft.length}` as const) : null,
    ...draft.colors.map((c) => t(`color.${c}` as const)),
    showNail && draft.design !== "solid" ? t(`design.${draft.design}` as const) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <aside
      className={cn(
        "border-hairline bg-surface-raised/80 flex items-center gap-4 rounded-card border p-3 shadow-md backdrop-blur-md",
        className
      )}
    >
      {showNail && (
        <LiveNailPreview
          state={{
            shape: draft.shape,
            length: draft.length,
            colors: draft.colors,
            design: draft.design,
          }}
          size={72}
          className="shrink-0"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-body text-ink truncate">
          {summary || t("services.helper")}
        </p>
        {est.hasCombo && <ComboBadge savingCents={est.comboDiscountCents} />}
      </div>

      {draft.services.length > 0 && (
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-h2 font-display text-ink" data-numeric>
            ~{formatMoney(est.totalCents)}
          </span>
          <span className="text-caption text-ink-muted" data-numeric>
            {t("common.aboutMinutes", { n: est.durationMin })}
          </span>
        </div>
      )}
    </aside>
  );
}
