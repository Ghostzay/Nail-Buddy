"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

import { COLOR_BY_KEY, type ColorFamilyKey, type DesignKey } from "@/lib/nail-colors";
import { SPRING } from "@/lib/motion";
import {
  LENGTH_SCALE,
  NAIL_PATH_NUMBERS,
  NAIL_VIEWBOX,
  lerpShapes,
  numbersToPath,
  type NailLength,
  type NailShape,
} from "@/lib/nail-shapes";
import { cn } from "@/lib/utils";

export interface NailPreviewState {
  shape: NailShape;
  length: NailLength;
  colors: ColorFamilyKey[];
  design: DesignKey;
}

const BARE_NAIL = "#F0DFD6";

/**
 * The signature element (§5). One SVG nail that morphs as choices are made.
 *
 * The shape morph is numeric, not a path-morph library: every silhouette in
 * NAIL_SHAPES shares an identical command skeleton and anchor order, so the
 * coordinate lists interpolate directly. See lib/nail-shapes.ts.
 *
 * REDUCED MOTION: this component is the one place that calls useReducedMotion()
 * directly, and deliberately. The root MotionConfig only suppresses transform
 * and layout animations — a `d` attribute tween and an SVG gradient sweep are
 * neither, so they would keep running. Everything here collapses to an instant
 * cut when the user asks for reduced motion.
 */
export function LiveNailPreview({
  state,
  className,
  size = 132,
}: {
  state: NailPreviewState;
  className?: string;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const reduced = useReducedMotion();

  const { shape, length, colors, design } = state;
  const primary = colors[0] ? COLOR_BY_KEY.get(colors[0]) : undefined;
  const lacquer = primary?.lacquer ?? BARE_NAIL;
  const effect = primary?.effect;

  // ---- shape morph --------------------------------------------------------
  const progress = useMotionValue(1);
  const liveNumbers = useRef<number[]>(NAIL_PATH_NUMBERS[shape]);
  const [from, setFrom] = useState<number[]>(NAIL_PATH_NUMBERS[shape]);
  const [to, setTo] = useState<number[]>(NAIL_PATH_NUMBERS[shape]);

  useEffect(() => {
    const next = NAIL_PATH_NUMBERS[shape];
    // Start from wherever the silhouette actually is, so rapid taps don't snap.
    setFrom(liveNumbers.current);
    setTo(next);
    progress.set(0);
    const controls = animate(progress, 1, reduced ? { duration: 0 } : SPRING);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, reduced]);

  const d = useTransform(progress, (v) => {
    const nums = lerpShapes(from, to, v);
    liveNumbers.current = nums;
    return numbersToPath(nums);
  });

  // ---- length: the bed extends from the cuticle ---------------------------
  const scaleY = useMotionValue(LENGTH_SCALE[length]);
  useEffect(() => {
    const controls = animate(scaleY, LENGTH_SCALE[length], reduced ? { duration: 0 } : SPRING);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, reduced]);

  // ---- colour: lacquer wipes cuticle -> tip -------------------------------
  const wipe = useMotionValue(colors.length ? 1 : 0);
  useEffect(() => {
    if (!colors.length) {
      wipe.set(0);
      return;
    }
    wipe.set(0);
    const controls = animate(wipe, 1, reduced ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors.join(","), reduced]);

  // Clip rect travels up from the cuticle (y=160) to the tip (y=0).
  const clipY = useTransform(wipe, (v) => 160 - v * 160);
  const clipH = useTransform(wipe, (v) => v * 160);

  const gradId = `lacquer-${uid}`;
  const clipId = `clip-${uid}`;
  const wipeId = `wipe-${uid}`;
  const glossId = `gloss-${uid}`;
  const chromeId = `chrome-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${NAIL_VIEWBOX.width} ${NAIL_VIEWBOX.height}`}
      style={{ height: size }}
      className={cn("w-auto overflow-visible", className)}
      role="img"
      aria-label={`${shape} nail, ${length} length${primary ? `, ${primary.key}` : ""}`}
    >
      <defs>
        {/* Multi-select paints hard-stop bands across the nail rather than a
            muddy blend — you asked for two colours, you see two colours. */}
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          {colors.length <= 1 ? (
            <>
              <stop offset="0%" stopColor={lacquer} />
              <stop offset="100%" stopColor={lacquer} />
            </>
          ) : (
            colors.flatMap((c, i) => {
              const hex = COLOR_BY_KEY.get(c)?.lacquer ?? BARE_NAIL;
              const a = (i / colors.length) * 100;
              const b = ((i + 1) / colors.length) * 100;
              return [
                <stop key={`${c}-a`} offset={`${a}%`} stopColor={hex} />,
                <stop key={`${c}-b`} offset={`${b}%`} stopColor={hex} />,
              ];
            })
          )}
        </linearGradient>

        {/* Ombré darkens toward the cuticle. */}
        <linearGradient id={`${gradId}-ombre`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={lacquer} stopOpacity={1} />
          <stop offset="100%" stopColor={lacquer} stopOpacity={0.15} />
        </linearGradient>

        <linearGradient id={chromeId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity={0.75} />
          <stop offset="60%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>

        <radialGradient id={glossId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </radialGradient>

        <clipPath id={clipId}>
          <motion.path d={d} />
        </clipPath>

        <clipPath id={wipeId}>
          <motion.rect x={0} width={100} y={clipY} height={clipH} />
        </clipPath>
      </defs>

      <motion.g style={{ scaleY, originX: 0.5, originY: 0.94 }}>
        {/* bare nail */}
        <motion.path
          d={d}
          fill={BARE_NAIL}
          stroke="rgba(74,30,61,0.28)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        <g clipPath={`url(#${clipId})`}>
          {/* lacquer, revealed by the wipe */}
          <g clipPath={`url(#${wipeId})`}>
            <rect
              x={0}
              y={0}
              width={100}
              height={160}
              fill={design === "ombre" ? `url(#${gradId}-ombre)` : `url(#${gradId})`}
            />

            {/* French: a bright arc across the free edge */}
            {design === "french" && (
              <path
                d="M14,34 C34,10 66,10 86,34 L86,0 L14,0 Z"
                fill="#FFFFFF"
                opacity={0.94}
              />
            )}

            {/* Simple art: a couple of restrained strokes, not a mural */}
            {design === "art" && (
              <>
                <path d="M20,60 C40,42 60,78 82,54" stroke="#FFFFFF" strokeWidth={3} fill="none" opacity={0.85} />
                <circle cx={64} cy={40} r={4} fill="#FFFFFF" opacity={0.9} />
              </>
            )}

            {/* Chrome: a specular band that sweeps. Static under reduced motion. */}
            {effect === "chrome" && (
              <motion.rect
                x={-100}
                y={0}
                width={200}
                height={160}
                fill={`url(#${chromeId})`}
                animate={reduced ? { x: -20 } : { x: [-100, 60] }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { duration: 2.4, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }
                }
              />
            )}

            {/* Glitter: 5 particles max (§5). Frozen under reduced motion. */}
            {(effect === "glitter" || design === "glitter") &&
              [
                { x: 32, y: 44, r: 2.6, d: 0 },
                { x: 62, y: 62, r: 2.1, d: 0.5 },
                { x: 44, y: 92, r: 2.4, d: 1 },
                { x: 70, y: 108, r: 1.9, d: 1.5 },
                { x: 28, y: 120, r: 2.2, d: 2 },
              ].map((p, i) => (
                <motion.circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill="#FFFFFF"
                  animate={reduced ? { opacity: 0.6 } : { opacity: [0.15, 0.95, 0.15] }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: 2.2, repeat: Infinity, delay: p.d, ease: "easeInOut" }
                  }
                />
              ))}
          </g>

          {/* Top-coat specular. Always present — this is the detail that makes
              the whole thing read as lacquer instead of a coloured shape. */}
          <ellipse
            cx={38}
            cy={54}
            rx={13}
            ry={26}
            fill={`url(#${glossId})`}
            style={{ mixBlendMode: "screen" }}
          />
        </g>
      </motion.g>
    </svg>
  );
}

