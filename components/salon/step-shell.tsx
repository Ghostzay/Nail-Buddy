"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { stepVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Owns the question heading, the grid slot, and the enter/exit animation, so
 * step components stay declarative and every step animates identically.
 *
 * The grid area reserves its height (min-h) so advancing a step doesn't shift
 * layout — the performance budget forbids layout shift on step transition.
 */
export function StepShell({
  stepKey,
  question,
  helper,
  children,
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  backLabel,
  showBack = true,
  footer,
  className,
}: {
  /** Changing this triggers the enter/exit transition. */
  stepKey: string;
  question: string;
  helper?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  backLabel?: string;
  showBack?: boolean;
  /** Slot between the grid and the nav — the preview bar lives here. */
  footer?: React.ReactNode;
  className?: string;
}) {
  const t = useT();

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stepKey}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex flex-1 flex-col gap-6"
        >
          <header className="flex flex-col gap-1.5">
            <h1 className="text-display font-display text-ink text-balance">
              {question}
            </h1>
            {helper && <p className="text-body-lg text-ink-muted">{helper}</p>}
          </header>

          <div className="min-h-[20rem] flex-1">{children}</div>
        </motion.div>
      </AnimatePresence>

      {footer}

      <nav className="mt-4 flex items-center gap-3">
        {showBack && onBack && (
          <Button variant="ghost" size="lg" onClick={onBack}>
            <ArrowLeft className="size-5" />
            {backLabel ?? t("common.back")}
          </Button>
        )}
        <div className="flex-1" />
        {onNext && (
          <Button size="xl" onClick={onNext} disabled={nextDisabled}>
            {nextLabel ?? t("common.continue")}
            <ArrowRight className="size-5" />
          </Button>
        )}
      </nav>
    </div>
  );
}
