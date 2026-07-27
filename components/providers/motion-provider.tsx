"use client";

import { MotionConfig } from "framer-motion";

import { DURATION, EASE_OUT } from "@/lib/motion";

/**
 * Reduced motion is wired ONCE, here (§4).
 *
 * `reducedMotion="user"` makes Framer Motion respect the OS setting globally:
 * transform and layout animations are skipped, opacity still animates. Combined
 * with the `prefers-reduced-motion` block in globals.css (which clamps CSS
 * transitions to a 120ms opacity fade), that covers both animation systems.
 *
 * Do not call useReducedMotion() in individual components — that is exactly
 * the per-component checking the brief rules out.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
    >
      {children}
    </MotionConfig>
  );
}
