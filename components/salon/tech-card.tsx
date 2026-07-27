"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

import { useHaptic } from "@/components/providers/preferences-provider";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";
import { checkVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface Technician {
  id: string;
  displayName: string;
  photoUrl?: string | null;
  specialties: string[];
  /** null = free now; a number = minutes until free. */
  busyForMin: number | null;
}

/** Deterministic monogram tint — never a gray silhouette. */
function Monogram({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden
      className="from-plum to-lavender text-on-plum grid size-16 shrink-0 place-items-center rounded-pill bg-gradient-to-br text-h2 font-display"
    >
      {initials}
    </span>
  );
}

export function TechCard({
  tech,
  selected,
  onSelect,
  className,
}: {
  tech: Technician;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  const t = useT();
  const haptic = useHaptic();
  const free = tech.busyForMin === null;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => {
        haptic();
        onSelect();
      }}
      className={cn(
        "relative flex min-h-[9.5rem] flex-col items-center justify-center gap-2 p-4 text-center",
        "rounded-card border-2 transition-[border-color,box-shadow,background-color] duration-[160ms]",
        "active:scale-[0.97]",
        selected
          ? "border-coral bg-coral/8 shadow-glow"
          : "border-hairline-strong bg-surface-raised shadow-sm hover:border-coral-strong/60",
        className
      )}
    >
      {tech.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tech.photoUrl}
          alt=""
          className="size-16 shrink-0 rounded-pill object-cover"
        />
      ) : (
        <Monogram name={tech.displayName} />
      )}

      <span className="text-body-lg text-ink font-semibold leading-tight">
        {tech.displayName}
      </span>

      {/* Availability is colour + icon + words, never colour alone. */}
      <Badge variant={free ? "success" : "warning"} size="sm">
        {free ? t("tech.freeNow") : t("tech.busyFor", { n: tech.busyForMin! })}
      </Badge>

      {tech.specialties.length > 0 && (
        <span className="text-caption text-ink-muted leading-snug">
          {tech.specialties.slice(0, 3).join(" · ")}
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

/**
 * Pinned, pre-selected, and labelled as fastest. Most people genuinely don't
 * care who does their nails and shouldn't be made to decide — but the ones
 * who do care, care a lot, so the roster sits right underneath.
 */
export function FirstAvailableCard({
  waitMin,
  selected,
  onSelect,
  className,
}: {
  waitMin: number;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  const t = useT();
  const haptic = useHaptic();

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => {
        haptic();
        onSelect();
      }}
      className={cn(
        "relative flex w-full items-center gap-4 p-5 text-left",
        "rounded-card border-2 transition-[border-color,box-shadow,background-color] duration-[160ms]",
        "active:scale-[0.98]",
        selected
          ? "border-coral bg-coral/8 shadow-glow"
          : "border-coral-strong/50 bg-surface-raised shadow-sm",
        className
      )}
    >
      <span className="bg-coral text-on-coral grid size-12 shrink-0 place-items-center rounded-pill">
        <Zap className="size-6" aria-hidden />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-body-lg text-ink font-semibold">
          {t("tech.firstAvailable")}
        </span>
        <span className="text-caption text-ink-muted" data-numeric>
          {t("common.aboutMinutes", { n: waitMin })}
        </span>
      </span>
      <Badge variant="solid-coral">{t("tech.fastest")}</Badge>

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
