"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

import { StatTile } from "@/components/salon/stat-tile";
import { StatusPill } from "@/components/salon/status-pill";
import { WaitBadge } from "@/components/salon/wait-badge";
import { EmptyState } from "@/components/salon/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useT } from "@/lib/i18n";
import { toUiStatus } from "@/lib/job-adapter";
import { COLOR_BY_KEY } from "@/lib/nail-colors";
import { maskName } from "@/lib/queue";
import {
  colorsOf, computeMetrics, toCsv, trend,
  type JobRow, type RangeKey,
} from "@/lib/analytics";
import type { Customer } from "@/lib/types";

const RANGES: RangeKey[] = ["today", "7d", "30d"];

export function ManagerDashboard({
  jobs,
  customers,
  range,
}: {
  jobs: JobRow[];
  customers: Customer[];
  range: RangeKey;
}) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();

  const metrics = useMemo(() => computeMetrics(jobs, customers), [jobs, customers]);
  const colorTrend = useMemo(() => trend(jobs, colorsOf), [jobs]);
  const shapeTrend = useMemo(() => trend(jobs, (j) => j.shape), [jobs]);

  // Filters live in the URL so a view is shareable and survives a refresh.
  function setRange(next: RangeKey) {
    const q = new URLSearchParams(params.toString());
    q.set("range", next);
    router.push(`/manager?${q.toString()}`);
  }

  function download() {
    const blob = new Blob([toCsv(jobs)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nail-buddy-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const waiting = jobs.filter((j) => toUiStatus(j.status) === "open");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1 font-display text-ink">{t("manager.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "primary" : "outline"}
              onClick={() => setRange(r)}
            >
              {r === "today" ? t("manager.title") : r}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={download}>
            <Download className="size-4" />
            CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label={t("manager.waitingNow")} value={metrics.waitingNow} invertDelta />
        <StatTile label={t("manager.inProgress")} value={metrics.inProgress} />
        <StatTile label={t("manager.completedToday")} value={metrics.completedToday} />
        <StatTile
          label={t("manager.avgWait")}
          value={metrics.avgWaitMin ?? "—"}
          unit={metrics.avgWaitMin != null ? "min" : undefined}
          invertDelta
        />
        <StatTile
          label={t("manager.avgService")}
          value={metrics.avgServiceMin ?? "—"}
          unit={metrics.avgServiceMin != null ? "min" : undefined}
        />
      </div>

      {/* Queue health — spot a backup forming without opening /tech. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-h2 font-display">
            {t("manager.waitingNow")} ({waiting.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waiting.length === 0 ? (
            <p className="text-body text-ink-muted">{t("queue.empty")}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {waiting.map((j) => (
                <li
                  key={j.id}
                  className="border-hairline bg-surface-sunken flex items-center gap-2 rounded-pill border px-3 py-1.5"
                >
                  <span className="text-body text-ink">{maskName(j.customer?.name)}</span>
                  <WaitBadge since={j.created_at} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Trends — the number managers actually order supplies from. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TrendCard title={t("color.question")} rows={colorTrend} swatch />
        <TrendCard title={t("shape.question")} rows={shapeTrend} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-h2 font-display">
            {t("queue.title")} ({jobs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <EmptyState title={t("manager.empty")} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell data-numeric>
                      {new Date(j.created_at).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {maskName(j.customer?.name)}
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {[j.shape, j.length, ...colorsOf(j)].map((c, i) => (
                          <Badge key={`${c}-${i}`} variant="neutral" size="sm">
                            {c}
                          </Badge>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={toUiStatus(j.status)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrendCard({
  title,
  rows,
  swatch = false,
}: {
  title: string;
  rows: { key: string; count: number; pct: number }[];
  swatch?: boolean;
}) {
  const t = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h2 font-display">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-body text-ink-muted">{t("manager.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.slice(0, 8).map((r) => (
              <li key={r.key} className="flex items-center gap-3">
                {swatch && (
                  <span
                    aria-hidden
                    className="border-hairline size-4 shrink-0 rounded-pill border"
                    style={{
                      background: COLOR_BY_KEY.get(r.key as never)?.lacquer ?? "var(--surface-sunken)",
                    }}
                  />
                )}
                <span className="text-body text-ink w-24 shrink-0 capitalize">{r.key}</span>
                <span className="bg-surface-sunken h-2.5 flex-1 overflow-hidden rounded-pill">
                  <span
                    className="bg-lavender-strong block h-full rounded-pill"
                    style={{ width: `${Math.max(4, r.pct)}%` }}
                  />
                </span>
                <span className="text-caption text-ink-muted w-12 text-right" data-numeric>
                  {r.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
