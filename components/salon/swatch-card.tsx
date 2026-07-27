"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

import { useHaptic } from "@/components/providers/preferences-provider";
import { checkVariants } from "@/lib/motion";
import type { ColorFamily } from "@/lib/nail-colors";
import { cn } from "@/lib/utils";

/**
 * Colour-family card. The swatch is a lacquer DROP with a gloss highlight,
 * not a flat circle — the whole visual language of the app is "polish wall".
 *
 * Carries a text label and a checkmark so selection never depends on colour
 * perception, which matters doubly on a card whose entire content is a colour.
 */
export function SwatchCard({
  family,
  label,
  selected = false,
  disabled = false,
  onSelect,
  className,
}: {
  family: ColorFamily;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  className?: string;
}) {
  const haptic = useHaptic();
  const gradId = `drop-${family.key}`;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled || undefined}
      onClick={() => {
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
        disabled && "cursor-not-allowed opacity-45",
        className
      )}
    >
      <svg viewBox="0 0 64 72" className="h-16 w-auto" aria-hidden focusable="false">
        <defs>
          <linearGradient id={gradId} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={family.swatchFrom} />
            <stop offset="100%" stopColor={family.swatchTo} />
          </linearGradient>
        </defs>
        {/* A drop: rounded belly, drawn to a point at the top. */}
        <path
          d="M32,4 C42,22 56,34 56,46 C56,60 45,69 32,69 C19,69 8,60 8,46 C8,34 22,22 32,4 Z"
          fill={`url(#${gradId})`}
          stroke="rgba(74,30,61,0.22)"
          strokeWidth={1.5}
        />
        {/* Specular — same trick as the nail preview. */}
        <ellipse cx={23} cy={42} rx={5.5} ry={10} fill="#fff" opacity={0.5} />
        {family.effect === "glitter" && (
          <>
            <circle cx={40} cy={36} r={2} fill="#fff" opacity={0.85} />
            <circle cx={44} cy={52} r={1.6} fill="#fff" opacity={0.7} />
            <circle cx={28} cy={58} r={1.8} fill="#fff" opacity={0.8} />
          </>
        )}
      </svg>

      <span
        className={cn(
          "text-body-lg font-semibold leading-tight",
          selected ? "text-coral-strong" : "text-ink"
        )}
      >
        {label}
      </span>

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
