"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

import { useHaptic } from "@/components/providers/preferences-provider";
import { useT } from "@/lib/i18n";
import { checkVariants } from "@/lib/motion";
import { formatMoney } from "@/lib/pricing";
import type { ServiceDef } from "@/lib/services";
import { cn } from "@/lib/utils";

/**
 * A single service. Wider and shorter than a ChoiceCard because it carries
 * price and duration — the customer is making a spending decision here, and
 * hiding the number until the total is a way to lose trust cheaply.
 */
export function ServiceCard({
  service,
  selected,
  disabledReason,
  onToggle,
  className,
}: {
  service: ServiceDef;
  selected: boolean;
  /** Set when an add-on has no compatible parent — shown, not silent. */
  disabledReason?: string;
  onToggle: () => void;
  className?: string;
}) {
  const t = useT();
  const haptic = useHaptic();
  const disabled = Boolean(disabledReason);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (disabled) return;
        haptic();
        onToggle();
      }}
      className={cn(
        "relative flex min-h-[5.5rem] w-full items-center gap-3 p-4 text-left",
        "rounded-card border-2",
        "transition-[border-color,box-shadow,background-color] duration-[160ms]",
        "active:scale-[0.98]",
        selected
          ? "border-coral bg-coral/8 shadow-glow"
          : "border-hairline-strong bg-surface-raised shadow-sm hover:border-coral-strong/60",
        disabled && "cursor-not-allowed opacity-55",
        className
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-body-lg font-semibold leading-tight",
            selected ? "text-coral-strong" : "text-ink"
          )}
        >
          {service.label}
        </span>
        <span className="text-caption text-ink-muted" data-numeric>
          {formatMoney(service.priceCents)} ·{" "}
          {t("common.minutesShort", { n: service.durationMin })}
        </span>
        {disabledReason && (
          <span className="text-caption text-ink-muted inline-flex items-center gap-1 pt-0.5">
            <Lock className="size-3" aria-hidden />
            {disabledReason}
          </span>
        )}
      </span>

      <AnimatePresence>
        {selected && (
          <motion.span
            variants={checkVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="bg-coral text-on-coral grid size-7 shrink-0 place-items-center rounded-pill"
            aria-hidden
          >
            <Check className="size-4" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
