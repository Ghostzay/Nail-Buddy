"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  DURATION,
  SPRING,
  checkVariants,
  stepVariants,
  transition,
} from "@/lib/motion";

export function MotionDemo() {
  const [key, setKey] = useState(0);
  const [checked, setChecked] = useState(false);
  // Read-only here, purely to display the active mode. Components must NOT
  // branch on this — MotionConfig at the root already handles it.
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-hairline bg-surface-sunken rounded-media border px-4 py-3">
        <p className="text-body text-ink">
          <strong>prefers-reduced-motion:</strong>{" "}
          <span className="font-mono" data-numeric>
            {!mounted ? "…" : reduced ? "reduce — transforms disabled" : "no-preference"}
          </span>
        </p>
        <p className="text-caption text-ink-muted pt-1">
          Wired once via <code>MotionConfig reducedMotion=&quot;user&quot;</code> at the
          root plus a CSS clamp in globals.css. Never checked per component.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {(
          [
            ["instant", DURATION.instant],
            ["fast", DURATION.fast],
            ["base", DURATION.base],
            ["slow", DURATION.slow],
            ["entrance", DURATION.entrance],
          ] as const
        ).map(([name, d]) => (
          <div key={name} className="flex flex-col gap-2">
            <motion.div
              key={`${name}-${key}`}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: d, ease: [0.22, 1, 0.36, 1] }}
              className="bg-coral size-12 rounded-control"
            />
            <span className="text-caption text-ink-muted font-mono" data-numeric>
              {name} {Math.round(d * 1000)}ms
            </span>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <motion.div
            key={`spring-${key}`}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING}
            className="bg-lavender size-12 rounded-control"
          />
          <span className="text-caption text-ink-muted font-mono">spring</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setKey((k) => k + 1)}>
          Replay
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-label text-ink-muted">Step transition</span>
          <div className="border-hairline bg-surface-sunken relative h-24 w-64 overflow-hidden rounded-media border">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={key % 2}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="text-ink absolute inset-0 grid place-items-center text-body-lg"
              >
                Step {(key % 2) + 1}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-label text-ink-muted">Selection check</span>
          <button
            type="button"
            onClick={() => setChecked((c) => !c)}
            aria-pressed={checked}
            className="border-hairline-strong bg-surface-raised relative grid size-24 place-items-center rounded-media border-2 transition-[border-color,box-shadow] duration-[160ms] active:scale-[0.97] data-[on=true]:border-coral data-[on=true]:shadow-glow"
            data-on={checked}
          >
            <span className="text-caption text-ink-muted">tap me</span>
            <AnimatePresence>
              {checked && (
                <motion.span
                  variants={checkVariants}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  className="bg-coral text-on-coral absolute -right-2 -top-2 grid size-7 place-items-center rounded-pill text-caption font-bold"
                >
                  ✓
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-label text-ink-muted">Press feedback</span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            transition={transition.fast}
            className="bg-plum text-on-plum h-14 rounded-control px-6 text-body-lg font-semibold"
          >
            Hold me
          </motion.button>
        </div>
      </div>
    </div>
  );
}
