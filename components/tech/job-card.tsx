"use client";

import { useState } from "react";
import { Check, Languages, Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  COLOR_FAMILY_OPTIONS,
  DESIGN_TYPE_OPTIONS,
  LENGTH_OPTIONS,
  SHAPE_OPTIONS,
} from "@/lib/types";
import type { JobWithCustomer } from "@/lib/types";
import { cn } from "@/lib/utils";

function optionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T
) {
  return options.find((o) => o.value === value)?.label ?? value;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60000));
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return `${hours} hr ago`;
}

interface JobCardProps {
  job: JobWithCustomer;
  onUpdateStatus: (id: string, status: "accepted" | "declined" | "completed") => Promise<void>;
  onTranslated: (id: string, notesVi: string) => void;
}

export function JobCard({ job, onUpdateStatus, onTranslated }: JobCardProps) {
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  async function handleStatus(status: "accepted" | "declined" | "completed") {
    setPendingAction(status);
    try {
      await onUpdateStatus(job.id, status);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleTranslate() {
    setTranslating(true);
    setTranslateError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Translation failed");
      onTranslated(job.id, body.translation);
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslating(false);
    }
  }

  return (
    <Card className={cn(job.status === "pending" && "border-primary/40")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">
              {job.customer?.name ?? "Walk-in"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {timeAgo(job.created_at)}
              {job.customer?.phone ? ` · ${job.customer.phone}` : ""}
            </p>
          </div>
          <Badge
            variant={
              job.status === "pending"
                ? "warning"
                : job.status === "accepted"
                  ? "default"
                  : job.status === "completed"
                    ? "success"
                    : "destructive"
            }
          >
            {job.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{optionLabel(SHAPE_OPTIONS, job.shape)}</Badge>
          <Badge variant="secondary">{optionLabel(LENGTH_OPTIONS, job.length)}</Badge>
          <Badge variant="secondary">
            {optionLabel(COLOR_FAMILY_OPTIONS, job.color_family)}
          </Badge>
          <Badge variant="secondary">
            {optionLabel(DESIGN_TYPE_OPTIONS, job.design_type)}
          </Badge>
        </div>

        {job.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.photo_url}
            alt="Reference"
            className="size-24 rounded-lg border object-cover"
          />
        )}

        {job.notes && (
          <div className="rounded-lg bg-muted/60 p-3 text-sm">
            <p>{job.notes}</p>
          </div>
        )}

        {job.notes_vi && (
          <div className="rounded-lg bg-accent p-3 text-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tiếng Việt
            </p>
            <p>{job.notes_vi}</p>
          </div>
        )}

        {job.notes && !job.notes_vi && (
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={translating}
            onClick={handleTranslate}
          >
            {translating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Languages className="size-4" />
            )}
            Translate to Vietnamese
          </Button>
        )}
        {translateError && (
          <p className="text-xs text-destructive">{translateError}</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {job.status === "pending" && (
          <>
            <Button
              className="flex-1"
              size="lg"
              disabled={pendingAction !== null}
              onClick={() => handleStatus("accepted")}
            >
              {pendingAction === "accepted" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Accept
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              disabled={pendingAction !== null}
              onClick={() => handleStatus("declined")}
            >
              {pendingAction === "declined" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <X className="size-4" />
              )}
              Decline
            </Button>
          </>
        )}
        {job.status === "accepted" && (
          <Button
            variant="success"
            className="flex-1"
            size="lg"
            disabled={pendingAction !== null}
            onClick={() => handleStatus("completed")}
          >
            {pendingAction === "completed" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Mark Complete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
