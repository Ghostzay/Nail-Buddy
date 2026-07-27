"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

import { useHaptic } from "@/components/providers/preferences-provider";
import { checkVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface ChoiceCardProps {
  label: string;
  sublabel?: string;
  /** e.g. "+$12" */
  priceDelta?: string;
  selected?: boolean;
  disabled?: boolean;
  /** Shown on tap when disabled, instead of silently doing nothing. */
  disabledReason?: string;
  onSelect?: () => void;
  /** Icon, swatch, or nail silhouette. */
  media?: React.ReactNode;
  /** "radio" for single-select grids, "checkbox" for multi-select. */
  role?: "radio" | "checkbox";
  className?: string;
}

/**
 * The workhorse selection card. Selection is signalled by a coral ring, the
 * glow shadow, AND a checkmark badge — never colour alone (§11).
 *
 * Renders a real <button> with an aria role so keyboard and screen-reader
 * users get the same semantics as touch, rather than a div with onClick.
 */
export function ChoiceCard({
  label,
  sublabel,
  priceDelta,
  selected = false,
  disabled = false,
  disabledReason,
  onSelect,
  media,
  role = "radio",
  className,
}: ChoiceCardProps) {
  const haptic = useHaptic();

  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      aria-describedby={disabled && disabledReason ? `${label}-reason` : undefined}
      onClick={() => {
        // Disabled cards stay focusable and still announce why, rather than
        // being inert — a dead tap with no feedback reads as a broken kiosk.
        if (disabled) return;
        haptic();
        onSelect?.();
      }}
      className={cn(
        "group relative flex min-h-[9.5rem] flex-col items-center justify-center gap-2 p-4",
        "rounded-card border-2 text-center",
        "transition-[border-color,box-shadow,background-color] duration-[160ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        "active:scale-[0.97]",
        selected
          ? "border-coral bg-coral/8 shadow-glow"
          : "border-hairline-strong bg-surface-raised shadow-sm hover:border-coral-strong/60",
        disabled && "cursor-not-allowed opacity-45 hover:border-hairline-strong",
        className
      )}
    >
      {media && <span className="pointer-events-none">{media}</span>}

      <span
        className={cn(
          "text-body-lg font-semibold leading-tight",
          selected ? "text-coral-strong" : "text-ink"
        )}
      >
        {label}
      </span>

      {sublabel && (
        <span className="text-caption text-ink-muted leading-snug">{sublabel}</span>
      )}

      {priceDelta && (
        <span className="text-label text-ink-muted" data-numeric>
          {priceDelta}
        </span>
      )}

      {disabled && disabledReason && (
        <span
          id={`${label}-reason`}
          className="text-caption text-ink-muted mt-1 leading-snug"
        >
          {disabledReason}
        </span>
      )}

      <AnimatePresence>
        {selected && (
          <motion.span
            variants={checkVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="bg-coral text-on-coral absolute -right-2 -top-2 grid size-8 place-items-center rounded-pill shadow-sm"
            aria-hidden
          >
            <Check className="size-5" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
