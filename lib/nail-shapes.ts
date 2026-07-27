/**
 * Hand-authored nail silhouettes.
 *
 * CRITICAL INVARIANT: every path is `M` + exactly six `C` segments + `Z`, with
 * the anchors always in the same order —
 *
 *   P0 cuticle-left → P1 left side → P2 tip-left → P3 tip-right
 *   → P4 right side → P5 cuticle-right → back to P0
 *
 * Same command sequence, same number count, same traversal direction. That is
 * what lets the six shapes interpolate numerically without a morph library:
 * the tip anchors (P2/P3) simply slide together for pointed shapes and apart
 * for flat ones, while the side control points tighten or flare.
 *
 * Break the invariant and the morph tears. `assertSameStructure()` below is
 * exercised by the styleguide so a bad edit is caught immediately.
 *
 * viewBox is 0 0 100 160 — a nail is taller than it is wide.
 */

export const NAIL_SHAPE_KEYS = [
  "square",
  "squoval",
  "round",
  "almond",
  "coffin",
  "stiletto",
] as const;

export type NailShape = (typeof NAIL_SHAPE_KEYS)[number];

export const NAIL_VIEWBOX = { width: 100, height: 160 } as const;

export const NAIL_SHAPES: Record<NailShape, string> = {
  // Straight sides, dead-flat tip, corners held crisp.
  square:
    "M26,150 C23,110 22,70 22,34 C22,26 22,20 22,16 C40,15 60,15 78,16 C78,20 78,26 78,34 C78,70 77,110 74,150 C60,157 40,157 26,150 Z",

  // Square with the corners eased off — the everyday shape.
  squoval:
    "M26,150 C23,110 22,70 22,34 C22,26 23,19 29,16 C43,14 57,14 71,16 C77,19 78,26 78,34 C78,70 77,110 74,150 C60,157 40,157 26,150 Z",

  // Full dome across the free edge.
  round:
    "M26,150 C23,110 22,72 22,40 C22,28 26,18 35,13 C44,9 56,9 65,13 C74,18 78,28 78,40 C78,72 77,110 74,150 C60,157 40,157 26,150 Z",

  // Sides draw in from mid-plate; tip closes to a soft point.
  almond:
    "M26,150 C23,110 22,74 23,46 C25,32 32,20 42,12 C45,9 55,9 58,12 C68,20 75,32 77,46 C78,74 77,110 74,150 C60,157 40,157 26,150 Z",

  // Tapered sides into a narrow FLAT tip — the ballerina.
  coffin:
    "M26,150 C23,110 22,74 24,44 C27,32 30,22 33,14 C44,13 56,13 67,14 C70,22 73,32 76,44 C78,74 77,110 74,150 C60,157 40,157 26,150 Z",

  // Long taper to a sharp apex. The tip segment is deliberately almost
  // degenerate (48,5)->(52,5) so the two side curves meet in a cusp rather
  // than rolling over into a dome — that cusp is what makes it a stiletto.
  stiletto:
    "M26,150 C23,110 23,76 25,50 C30,34 38,18 48,5 C49,3 51,3 52,5 C62,18 70,34 75,50 C77,76 77,110 74,150 C60,157 40,157 26,150 Z",
};

/** Pull every number out of a path, preserving order. */
export function pathToNumbers(d: string): number[] {
  return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

/** Rebuild a path from the canonical command skeleton + a number list. */
export function numbersToPath(n: number[]): string {
  const p = (i: number) => n[i].toFixed(2);
  return [
    `M${p(0)},${p(1)}`,
    `C${p(2)},${p(3)} ${p(4)},${p(5)} ${p(6)},${p(7)}`,
    `C${p(8)},${p(9)} ${p(10)},${p(11)} ${p(12)},${p(13)}`,
    `C${p(14)},${p(15)} ${p(16)},${p(17)} ${p(18)},${p(19)}`,
    `C${p(20)},${p(21)} ${p(22)},${p(23)} ${p(24)},${p(25)}`,
    `C${p(26)},${p(27)} ${p(28)},${p(29)} ${p(30)},${p(31)}`,
    `C${p(32)},${p(33)} ${p(34)},${p(35)} ${p(36)},${p(37)}`,
    "Z",
  ].join(" ");
}

export const NAIL_PATH_NUMBERS: Record<NailShape, number[]> = Object.fromEntries(
  NAIL_SHAPE_KEYS.map((k) => [k, pathToNumbers(NAIL_SHAPES[k])])
) as Record<NailShape, number[]>;

/** Linear interpolation between two shapes' number lists. */
export function lerpShapes(from: number[], to: number[], t: number): number[] {
  return from.map((v, i) => v + (to[i] - v) * t);
}

/**
 * Verifies the invariant. Returns a list of problems — empty means healthy.
 * Rendered in the styleguide so a bad path edit fails loudly rather than
 * producing a subtly tearing morph nobody traces back to this file.
 */
export function assertSameStructure(): string[] {
  const problems: string[] = [];
  const expected = 38; // 19 points x 2 coords
  const skeleton = (d: string) => (d.match(/[MCZ]/g) ?? []).join("");

  for (const key of NAIL_SHAPE_KEYS) {
    const nums = NAIL_PATH_NUMBERS[key];
    if (nums.length !== expected) {
      problems.push(`${key}: ${nums.length} numbers, expected ${expected}`);
    }
    const s = skeleton(NAIL_SHAPES[key]);
    if (s !== "MCCCCCCZ") {
      problems.push(`${key}: command skeleton "${s}", expected "MCCCCCCZ"`);
    }
    // Every shape must start and end at the same cuticle anchor, or the
    // silhouette will drift sideways mid-morph.
    if (nums[0] !== 26 || nums[1] !== 150) {
      problems.push(`${key}: starts at ${nums[0]},${nums[1]} not 26,150`);
    }
  }
  return problems;
}

/** Nail bed extension per length, as a scale factor on the tip half. */
export const LENGTH_SCALE = {
  short: 0.82,
  medium: 1,
  long: 1.18,
  xl: 1.36,
} as const;

export type NailLength = keyof typeof LENGTH_SCALE;
