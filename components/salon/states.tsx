"use client";

import { AlertTriangle, Inbox, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Built before they were needed, so no screen ships with a bare spinner or a
 * "No data." Empty states invite; error states say what happened and what to
 * do next.
 */
export function EmptyState({
  title,
  body,
  icon,
  action,
  className,
}: {
  title: string;
  body?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-hairline flex flex-col items-center gap-3 rounded-card border border-dashed p-10 text-center",
        className
      )}
    >
      <span className="bg-surface-sunken text-ink-muted grid size-14 place-items-center rounded-pill">
        {icon ?? <Inbox className="size-7" aria-hidden />}
      </span>
      <h3 className="text-h2 font-display text-ink">{title}</h3>
      {body && <p className="text-body text-ink-muted max-w-sm">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  onRetry,
  offline = false,
  className,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  offline?: boolean;
  className?: string;
}) {
  const t = useT();

  return (
    <div
      role="alert"
      className={cn(
        "border-danger-strong/40 bg-danger/8 flex flex-col items-center gap-3 rounded-card border p-8 text-center",
        className
      )}
    >
      <span className="bg-danger/14 text-danger-strong grid size-14 place-items-center rounded-pill">
        {offline ? (
          <WifiOff className="size-7" aria-hidden />
        ) : (
          <AlertTriangle className="size-7" aria-hidden />
        )}
      </span>
      <h3 className="text-h2 font-display text-ink">{title ?? t("error.title")}</h3>
      <p className="text-body text-ink-muted max-w-md">
        {body ?? (offline ? t("error.offline") : t("error.generic"))}
      </p>
      {onRetry && (
        <Button variant="outline" size="lg" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

/** Matches the JobCard footprint so the queue doesn't jump when data lands. */
export function JobCardSkeleton() {
  return (
    <div className="border-hairline bg-surface-raised flex flex-col gap-4 rounded-card border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Shimmer className="h-6 w-32" />
          <Shimmer className="h-4 w-24" />
        </div>
        <Shimmer className="h-6 w-20 rounded-pill" />
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-6 w-16 rounded-pill" />
        <Shimmer className="h-6 w-20 rounded-pill" />
        <Shimmer className="h-6 w-14 rounded-pill" />
      </div>
      <Shimmer className="h-12 w-full" />
    </div>
  );
}

export function StatTileSkeleton() {
  return (
    <div className="border-hairline bg-surface-raised flex flex-col gap-3 rounded-card border p-5 shadow-sm">
      <Shimmer className="h-4 w-20" />
      <Shimmer className="h-8 w-16" />
      <Shimmer className="h-3 w-28" />
    </div>
  );
}

export function Shimmer({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-surface-sunken block animate-pulse rounded-md motion-reduce:animate-none",
        className
      )}
    />
  );
}
