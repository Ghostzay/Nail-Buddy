"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Check, Languages, Play, Repeat, X } from "lucide-react";

import { StatusPill, type JobStatus } from "@/components/salon/status-pill";
import { WaitBadge, isOverdue } from "@/components/salon/wait-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { arriveVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface QueueJob {
  id: string;
  status: JobStatus;
  createdAt: string;
  /** First name + last initial only — the queue is visible across a room. */
  customerName: string;
  /** Chips, not prose. */
  chips: string[];
  waxing?: string[];
  notes?: string | null;
  notesVi?: string | null;
  photoUrls?: string[];
  /** Structured safety flags, never a substring of notes. */
  sensitivities?: string[];
  requestedTechName?: string | null;
  requestedIsMe?: boolean;
  visitCount?: number;
  lastVisitSummary?: string | null;
}

export function JobCard({
  job,
  onAccept,
  onDecline,
  onStart,
  onComplete,
  onTranslate,
  onOpenPhoto,
  busy,
  className,
}: {
  job: QueueJob;
  onAccept?: () => void;
  onDecline?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onTranslate?: () => Promise<void> | void;
  onOpenPhoto?: (url: string) => void;
  busy?: string | null;
  className?: string;
}) {
  const t = useT();
  const [showVi, setShowVi] = useState(false);
  const [translating, setTranslating] = useState(false);
  const overdue = isOverdue(job.createdAt) && job.status === "open";

  async function translate() {
    if (job.notesVi) {
      setShowVi((v) => !v);
      return;
    }
    setTranslating(true);
    try {
      await onTranslate?.();
      setShowVi(true);
    } finally {
      setTranslating(false);
    }
  }

  return (
    <motion.article
      layout
      variants={arriveVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn(
        "border-hairline bg-surface-raised relative flex flex-col gap-4 rounded-card border p-5 shadow-sm",
        job.requestedIsMe && "border-coral-strong/60",
        overdue && "border-danger-strong/70",
        className
      )}
    >
      {/* A job waiting >15 min pulses its BORDER only. Pulsing the whole card
          (animate-pulse) fades the text with it, which reads as "disabled" —
          precisely backwards for the most urgent thing on the screen. */}
      {overdue && (
        <motion.span
          aria-hidden
          className="border-danger-strong pointer-events-none absolute -inset-px rounded-card border-2"
          animate={{ opacity: [0.9, 0.15, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-h2 font-display text-ink leading-none">
            {job.customerName}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <WaitBadge since={job.createdAt} />
            {job.visitCount != null && job.visitCount > 1 && (
              <Badge variant="lavender" size="sm">
                <Repeat className="size-3" aria-hidden />
                {t("queue.returningVisit", { n: job.visitCount })}
              </Badge>
            )}
          </div>
        </div>
        <StatusPill status={job.status} />
      </header>

      {/* Safety first, above the request itself. */}
      {job.sensitivities && job.sensitivities.length > 0 && (
        <div className="border-warning-strong/40 bg-warning/14 flex items-start gap-2 rounded-control border p-3">
          <AlertTriangle className="text-warning-strong mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-body text-ink">{job.sensitivities.join(" · ")}</p>
        </div>
      )}

      {job.requestedTechName && (
        <Badge variant={job.requestedIsMe ? "solid-coral" : "outline"} size="sm">
          {job.requestedIsMe
            ? t("queue.requestedYou")
            : t("queue.requestedOther", { name: job.requestedTechName })}
        </Badge>
      )}

      <div className="flex flex-wrap gap-1.5">
        {job.chips.map((c) => (
          <Badge key={c} variant="neutral" size="sm">
            {c}
          </Badge>
        ))}
        {/* Waxing shows abbreviated on the card face — a busy salon has people
            reading over shoulders. Full detail lives in the job drawer. */}
        {job.waxing && job.waxing.length > 0 && (
          <Badge variant="neutral" size="sm">
            {t("services.waxing")} ×{job.waxing.length}
          </Badge>
        )}
      </div>

      {job.photoUrls && job.photoUrls.length > 0 && (
        <div className="flex gap-2">
          {job.photoUrls.slice(0, 3).map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => onOpenPhoto?.(url)}
              className="rounded-media active:scale-[0.97]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Reference ${i + 1}`}
                className="border-hairline size-16 rounded-media border object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {job.lastVisitSummary && (
        <p className="text-caption text-ink-muted">
          <span className="text-label">{t("queue.lastTime")}</span>{" "}
          {job.lastVisitSummary}
        </p>
      )}

      {job.notes && (
        <div className="bg-surface-sunken flex flex-col gap-2 rounded-control p-3">
          <p className="text-body text-ink line-clamp-2">
            {showVi && job.notesVi ? job.notesVi : job.notes}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-caption text-ink-muted">
              {showVi && job.notesVi ? "Tiếng Việt" : "EN"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={translate}
              loading={translating}
              className="ml-auto"
            >
              <Languages className="size-4" />
              {translating
                ? t("queue.translating")
                : showVi
                  ? t("queue.showOriginal")
                  : t("queue.translate")}
            </Button>
          </div>
        </div>
      )}

      <footer className="flex gap-2">
        {job.status === "open" && (
          <>
            <Button
              className="flex-1"
              size="md"
              onClick={onAccept}
              loading={busy === "accept"}
            >
              <Check className="size-4" />
              {t("queue.accept")}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={onDecline}
              loading={busy === "decline"}
            >
              <X className="size-4" />
              {t("queue.decline")}
            </Button>
          </>
        )}
        {job.status === "claimed" && (
          <Button className="flex-1" size="md" onClick={onStart} loading={busy === "start"}>
            <Play className="size-4" />
            {t("queue.start")}
          </Button>
        )}
        {job.status === "in_progress" && (
          <Button
            variant="success"
            className="flex-1"
            size="md"
            onClick={onComplete}
            loading={busy === "complete"}
          >
            <Check className="size-4" />
            {t("queue.complete")}
          </Button>
        )}
      </footer>
    </motion.article>
  );
}
