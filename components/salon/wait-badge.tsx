"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";

function minutesSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

/**
 * Live-ticking elapsed wait with colour escalation — the single most useful
 * thing on the tech screen, so it is designed to be readable at arm's length
 * while holding a brush.
 *
 * <5 min neutral · 5–15 amber · >15 danger.
 * Tabular numerals stop the digits jittering as the count changes.
 */
export function WaitBadge({ since }: { since: string }) {
  const t = useT();
  const [mins, setMins] = useState(() => minutesSince(since));

  useEffect(() => {
    setMins(minutesSince(since));
    // 30s so the reading is never more than half a minute stale, without
    // waking the tab every second for a value that changes 60x slower.
    const id = setInterval(() => setMins(minutesSince(since)), 30_000);
    return () => clearInterval(id);
  }, [since]);

  const variant = mins > 15 ? "danger" : mins >= 5 ? "warning" : "neutral";

  return (
    <Badge variant={variant} aria-live="off">
      <Clock className="size-3.5" aria-hidden />
      <span data-numeric>
        {mins < 1 ? t("common.justNow") : t("common.minAgo", { n: mins })}
      </span>
    </Badge>
  );
}

/** Whether a job has waited long enough to warrant the pulsing card border. */
export function isOverdue(since: string) {
  return minutesSince(since) > 15;
}
