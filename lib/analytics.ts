import { toUiStatus } from "@/lib/job-adapter";
import type { Customer, Job } from "@/lib/types";

export type JobRow = Job & { customer: Customer | null };

export interface Metrics {
  waitingNow: number;
  inProgress: number;
  completedToday: number;
  /** Minutes from request to claim. Null when nothing has been claimed. */
  avgWaitMin: number | null;
  /** Minutes from start to complete. Requires 0004's timestamps. */
  avgServiceMin: number | null;
  newCustomers: number;
}

const minutesBetween = (a: string, b: string) =>
  Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 60000);

export function computeMetrics(jobs: JobRow[], customers: Customer[]): Metrics {
  const ui = jobs.map((j) => ({ job: j, status: toUiStatus(j.status) }));

  const waitingNow = ui.filter((x) => x.status === "open").length;
  const inProgress = ui.filter(
    (x) => x.status === "claimed" || x.status === "in_progress"
  ).length;
  const complete = ui.filter((x) => x.status === "complete");

  // Without 0004 there is no started_at/completed_at, so genuine service
  // duration is not derivable. Returning null (and rendering an em dash) is
  // the honest answer — inferring it from updated_at would be a number that
  // looks authoritative and is wrong.
  const withDuration = complete.filter(
    (x) => x.job.started_at && x.job.completed_at
  );
  const avgServiceMin = withDuration.length
    ? Math.round(
        withDuration.reduce(
          (n, x) => n + minutesBetween(x.job.started_at!, x.job.completed_at!),
          0
        ) / withDuration.length
      )
    : null;

  const claimed = ui.filter(
    (x) => x.status !== "open" && x.job.started_at
  );
  const avgWaitMin = claimed.length
    ? Math.round(
        claimed.reduce(
          (n, x) => n + minutesBetween(x.job.created_at, x.job.started_at!),
          0
        ) / claimed.length
      )
    : null;

  return {
    waitingNow,
    inProgress,
    completedToday: complete.length,
    avgWaitMin,
    avgServiceMin,
    newCustomers: customers.length,
  };
}

export interface TrendRow {
  key: string;
  count: number;
  pct: number;
}

/**
 * Most-requested colours / shapes / designs. This is the genuinely valuable
 * number on the dashboard — managers order supplies off it — so it counts
 * every colour on a multi-colour job, not just the primary.
 */
export function trend(
  jobs: JobRow[],
  pick: (j: JobRow) => string[] | string | null
): TrendRow[] {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    const raw = pick(j);
    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

export const colorsOf = (j: JobRow) =>
  j.color_families?.length ? j.color_families : [j.color_family];

/** RFC 4180-ish escaping — a note containing a comma must not shift columns. */
function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(jobs: JobRow[]): string {
  const header = [
    "created_at", "status", "customer", "phone",
    "shape", "length", "color", "design", "notes",
  ];
  const rows = jobs.map((j) => [
    j.created_at,
    toUiStatus(j.status),
    j.customer?.name ?? "",
    j.customer?.phone ?? "",
    j.shape,
    j.length,
    colorsOf(j).join(" "),
    j.design_type,
    j.notes ?? "",
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export type RangeKey = "today" | "7d" | "30d";

export function rangeStart(range: RangeKey): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "7d") d.setDate(d.getDate() - 6);
  if (range === "30d") d.setDate(d.getDate() - 29);
  return d;
}
