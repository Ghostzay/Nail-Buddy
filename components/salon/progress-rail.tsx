"use client";

import { motion } from "framer-motion";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Dots that fill like polish: incomplete is an outlined ring, complete fills
 * with a wipe from the bottom, active is coral and breathing.
 *
 * The rail is driven by the ACTIVE step list, not a fixed length — when the
 * service selection skips the nail steps, the rail visibly shrinks rather
 * than showing "step 6 of 8" and then jumping (§8).
 */
export function ProgressRail({
  steps,
  currentIndex,
  onJumpTo,
  className,
}: {
  /** Stable ids for the steps currently in play. */
  steps: string[];
  currentIndex: number;
  /** Tapping a completed dot returns to it, keeping forward answers. */
  onJumpTo?: (index: number) => void;
  className?: string;
}) {
  const t = useT();
  const total = steps.length;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <ol className="flex items-center gap-2" role="list">
        {steps.map((id, i) => {
          const complete = i < currentIndex;
          const active = i === currentIndex;
          const reachable = complete && !!onJumpTo;

          return (
            <li key={id}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onJumpTo(i)}
                aria-current={active ? "step" : undefined}
                aria-label={
                  reachable
                    ? t("a11y.goToStep", { n: i + 1 })
                    : t("a11y.stepOf", { n: i + 1, total })
                }
                className={cn(
                  "relative grid size-6 place-items-center rounded-pill",
                  reachable && "cursor-pointer",
                  !reachable && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "block size-3 overflow-hidden rounded-pill border-2 transition-colors duration-[160ms]",
                    active
                      ? "border-coral bg-coral"
                      : complete
                        ? "border-lavender-strong"
                        : "border-hairline-strong"
                  )}
                >
                  {/* the polish filling the ring */}
                  <motion.span
                    className="bg-lavender-strong block h-full w-full origin-bottom"
                    initial={false}
                    animate={{ scaleY: complete ? 1 : 0 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>

                {active && (
                  <motion.span
                    className="border-coral absolute inset-0 rounded-pill border-2"
                    animate={{ opacity: [0.55, 0, 0.55], scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <span className="text-label text-ink-muted" data-numeric>
        {t("a11y.stepOf", { n: currentIndex + 1, total })}
      </span>

      {/* Screen readers get the step change announced without a visual dupe. */}
      <span aria-live="polite" className="sr-only">
        {t("a11y.stepOf", { n: currentIndex + 1, total })}
      </span>
    </div>
  );
}
