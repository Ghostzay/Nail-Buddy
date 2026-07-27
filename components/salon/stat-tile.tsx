"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Dashboard metric with an optional sparkline slot and a delta against the
 * same weekday last week — "12 waiting" means nothing without "and that's
 * double last Tuesday".
 */
export function StatTile({
  label,
  value,
  unit,
  deltaPct,
  /** true when a rise is bad (wait times), false when a rise is good. */
  invertDelta = false,
  sparkline,
  className,
}: {
  label: string;
  value: number | string;
  unit?: string;
  deltaPct?: number | null;
  invertDelta?: boolean;
  sparkline?: React.ReactNode;
  className?: string;
}) {
  const t = useT();
  const up = (deltaPct ?? 0) > 0;
  const good = invertDelta ? !up : up;

  return (
    <div
      className={cn(
        "border-hairline bg-surface-raised flex flex-col gap-2 rounded-card border p-5 shadow-sm",
        className
      )}
    >
      <span className="text-label text-ink-muted">{label}</span>

      <div className="flex items-baseline gap-1.5">
        <span className="text-h1 font-display text-ink" data-numeric>
          {value}
        </span>
        {unit && <span className="text-body text-ink-muted">{unit}</span>}
      </div>

      {deltaPct != null && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-caption",
            good ? "text-success-strong" : "text-danger-strong"
          )}
        >
          {up ? (
            <TrendingUp className="size-3.5" aria-hidden />
          ) : (
            <TrendingDown className="size-3.5" aria-hidden />
          )}
          <span data-numeric>
            {up ? "+" : ""}
            {deltaPct}%
          </span>
          <span className="text-ink-muted">{t("manager.vsLastWeek")}</span>
        </span>
      )}

      {sparkline && <div className="pt-1">{sparkline}</div>}
    </div>
  );
}

/** Minimal inline sparkline — no chart library for eight data points. */
export function Sparkline({
  points,
  className,
}: {
  points: number[];
  className?: string;
}) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 24 - ((p - min) / span) * 22;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 26"
      preserveAspectRatio="none"
      className={cn("h-6 w-full", className)}
      aria-hidden
    >
      <path d={d} fill="none" className="stroke-lavender-strong" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
