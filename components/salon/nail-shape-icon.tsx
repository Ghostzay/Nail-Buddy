import {
  NAIL_SHAPES,
  NAIL_VIEWBOX,
  type NailShape,
} from "@/lib/nail-shapes";
import { cn } from "@/lib/utils";

/**
 * Static silhouette for a single shape — used on ChoiceCards.
 * Hand-authored geometry from lib/nail-shapes.ts, not an icon-font glyph.
 */
export function NailShapeIcon({
  shape,
  className,
  filled = false,
}: {
  shape: NailShape;
  className?: string;
  /** Selected cards fill the silhouette; idle cards show it as an outline. */
  filled?: boolean;
}) {
  return (
    <svg
      viewBox={`0 0 ${NAIL_VIEWBOX.width} ${NAIL_VIEWBOX.height}`}
      className={cn("h-16 w-auto", className)}
      aria-hidden
      focusable="false"
    >
      <path
        d={NAIL_SHAPES[shape]}
        className={cn(
          "transition-[fill,stroke] duration-[160ms]",
          filled ? "fill-coral stroke-coral" : "fill-surface-sunken stroke-ink-muted"
        )}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {/* The gloss dot is what makes it read as lacquer rather than a blob. */}
      <ellipse
        cx={38}
        cy={52}
        rx={7}
        ry={13}
        className={cn(filled ? "fill-white/45" : "fill-white/70")}
      />
    </svg>
  );
}
