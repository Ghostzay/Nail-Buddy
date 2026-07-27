"use client";

import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * One-tap rebook of the previous visit.
 *
 * This is the highest-value interaction in the whole app: it's the difference
 * between a regular checking in in ~15 seconds and walking a seven-step wizard
 * to arrive at exactly what they had last time. It gets prime position, the
 * primary button, and no confirmation step — accepting jumps straight to
 * review with everything prefilled and still editable.
 */
export function RepeatLastVisitCard({
  summary,
  onRepeat,
  onDifferent,
  className,
}: {
  /** "Gel-X · Almond · Medium · Nude · French" */
  summary: string;
  onRepeat: () => void;
  onDifferent: () => void;
  className?: string;
}) {
  const t = useT();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING}
      className={cn(
        "border-coral bg-coral/8 flex flex-col gap-4 rounded-card border-2 p-6 shadow-glow",
        className
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-ink font-display">{t("repeat.title")}</h2>
        <p className="text-body-lg text-ink">{summary}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="xl" block onClick={onRepeat} className="sm:flex-1">
          <RotateCcw className="size-5" />
          {t("repeat.cta")}
        </Button>
        <Button variant="ghost" size="lg" block onClick={onDifferent} className="sm:w-auto">
          {t("repeat.different")}
        </Button>
      </div>
    </motion.section>
  );
}
