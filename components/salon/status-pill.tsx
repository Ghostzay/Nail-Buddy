"use client";

import {
  CheckCircle2,
  CircleDot,
  Hand,
  Scissors,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n";

export type JobStatus =
  | "open"
  | "claimed"
  | "in_progress"
  | "complete"
  | "cancelled";

const MAP = {
  open: { variant: "warning", Icon: CircleDot },
  claimed: { variant: "coral", Icon: Hand },
  in_progress: { variant: "lavender", Icon: Scissors },
  complete: { variant: "success", Icon: CheckCircle2 },
  cancelled: { variant: "neutral", Icon: XCircle },
} as const;

/** Colour AND icon AND text. Never one of the three on its own (§11). */
export function StatusPill({ status }: { status: JobStatus }) {
  const t = useT();
  const { variant, Icon } = MAP[status];
  return (
    <Badge variant={variant}>
      <Icon className="size-3.5" aria-hidden />
      {t(`status.${status}` as const)}
    </Badge>
  );
}
