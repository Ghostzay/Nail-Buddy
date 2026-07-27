import type { Transition, Variants } from "framer-motion";

/**
 * Motion primitives. Every animation in the app pulls from here so timing
 * stays coherent — no ad-hoc durations in components.
 *
 * Reduced motion is NOT handled here. It is wired once at the root via
 * <MotionProvider> (MotionConfig reducedMotion="user"), which makes Framer
 * skip transform/layout animations globally. Do not add per-component
 * useReducedMotion() checks; see components/providers/motion-provider.tsx.
 */

export const DURATION = {
  instant: 0.1,
  fast: 0.16,
  base: 0.24,
  slow: 0.36,
  entrance: 0.48,
} as const;

/** cubic-bezier(0.22, 1, 0.36, 1) — matches --ease-out in globals.css */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.9,
};

/** 40ms per child, total capped at 240ms (§4). */
export const stagger = (count: number) => ({
  staggerChildren: Math.min(0.04, 0.24 / Math.max(count, 1)),
});

export const transition = {
  fast: { duration: DURATION.fast, ease: EASE_OUT },
  base: { duration: DURATION.base, ease: EASE_OUT },
  slow: { duration: DURATION.slow, ease: EASE_OUT },
  entrance: { duration: DURATION.entrance, ease: EASE_OUT },
  spring: SPRING,
} satisfies Record<string, Transition>;

/**
 * Step transitions on /request. Outgoing slides -24px and fades; incoming
 * enters from +24px. Pair with <AnimatePresence mode="wait">.
 */
export const stepVariants: Variants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0, transition: transition.base },
  exit: { opacity: 0, x: -24, transition: transition.fast },
};

/** Container that staggers its children in. */
export const listVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { ...stagger(6), delayChildren: 0.04 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: transition.base },
};

/** New job arriving on /tech — springs in from the top. */
export const arriveVariants: Variants = {
  hidden: { opacity: 0, y: -16, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING },
  exit: { opacity: 0, scale: 0.96, transition: transition.fast },
};

/** Checkmark badge on a selected ChoiceCard. */
export const checkVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4 },
  show: { opacity: 1, scale: 1, transition: SPRING },
};

/**
 * Press feedback. Applied via CSS `active:scale-[0.97]` on most controls
 * because a whole motion component for a 100ms scale is overkill (§2).
 * This is for elements already inside a motion tree.
 */
export const pressable = {
  whileTap: { scale: 0.97 },
  transition: { duration: DURATION.instant },
} as const;
