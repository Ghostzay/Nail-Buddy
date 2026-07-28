"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { JobCard, type QueueJob } from "@/components/salon/job-card";
import { EmptyState } from "@/components/salon/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Action = "accept" | "decline" | "start" | "complete";

const POLL_MS = 10_000;

export function TechQueue({ initialJobs }: { initialJobs: QueueJob[] }) {
  const t = useT();
  const [jobs, setJobs] = useState<QueueJob[]>(initialJobs);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState<Record<string, Action | null>>({});
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  // ---- refetch (also the polling fallback) --------------------------------
  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/queue", { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      if (mounted.current) setJobs(body.jobs as QueueJob[]);
    } catch {
      /* transient — the next tick tries again */
    }
  }, []);

  // ---- realtime -----------------------------------------------------------
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("tech-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          // Refetch rather than patching from the payload: the card needs
          // joined customer data that the change event doesn't carry, and a
          // single small query is cheaper than getting the merge subtly wrong.
          refetch();
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // A silently stale queue is the worst failure mode on this screen, so when
  // realtime is down we poll and say so rather than showing confident old data.
  useEffect(() => {
    if (connected) return;
    const id = setInterval(refetch, POLL_MS);
    return () => clearInterval(id);
  }, [connected, refetch]);

  // ---- actions ------------------------------------------------------------
  const act = useCallback(
    async (job: QueueJob, action: Action) => {
      setBusy((b) => ({ ...b, [job.id]: action }));
      const previous = jobs;

      try {
        const res = await fetch(`/api/jobs/${job.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
        });

        if (res.status === 409) {
          // Expected race, not an error. Drop the card and say who won.
          toast(t("queue.claimedByOther"));
          setJobs((js) => js.filter((j) => j.id !== job.id));
          return;
        }

        if (!res.ok) throw new Error(await res.text());

        const { job: updated } = await res.json();
        setJobs((js) =>
          js.map((j) =>
            j.id === job.id ? { ...j, status: updated.status ?? j.status } : j
          )
        );

        // Undo instead of a confirm dialog — dialogs are slow with wet hands,
        // and every one of these actions is cheaply reversible.
        if (action === "decline" || action === "complete") {
          toast(action === "decline" ? t("queue.decline") : t("queue.complete"), {
            action: {
              label: t("queue.undo"),
              onClick: async () => {
                await fetch(`/api/jobs/${job.id}`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ action: "reopen" }),
                });
                refetch();
              },
            },
          });
        }
        refetch();
      } catch {
        toast.error(t("error.generic"));
        setJobs(previous);
      } finally {
        if (mounted.current) setBusy((b) => ({ ...b, [job.id]: null }));
      }
    },
    [jobs, refetch, t]
  );

  const translate = useCallback(async (job: QueueJob) => {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: job.id }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    setJobs((js) =>
      js.map((j) => (j.id === job.id ? { ...j, notesVi: body.translation } : j))
    );
  }, []);

  const waiting = useMemo(() => jobs.filter((j) => j.status === "open"), [jobs]);
  const mine = useMemo(
    () => jobs.filter((j) => j.status === "claimed" || j.status === "in_progress"),
    [jobs]
  );
  const done = useMemo(() => jobs.filter((j) => j.status === "complete"), [jobs]);

  const render = (list: QueueJob[], emptyKey: "queue.empty" | "queue.emptyMine") => {
    if (!list.length) return <EmptyState title={t(emptyKey)} />;
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              busy={busy[job.id] ?? null}
              onAccept={() => act(job, "accept")}
              onDecline={() => act(job, "decline")}
              onStart={() => act(job, "start")}
              onComplete={() => act(job, "complete")}
              onTranslate={() => translate(job)}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <a
        href="#queue"
        className="sr-only focus:not-sr-only focus:mb-2 focus:inline-block"
      >
        Skip to queue
      </a>

      {!connected && (
        <div
          role="status"
          className="border-warning-strong/40 bg-warning/14 text-warning-strong mb-4 flex items-center gap-2 rounded-control border px-3 py-2 text-body"
        >
          <WifiOff className="size-4" aria-hidden />
          {t("queue.reconnecting")}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-h1 font-display text-ink">{t("queue.title")}</h1>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-caption",
            connected ? "text-success-strong" : "text-ink-muted"
          )}
        >
          {connected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {connected ? t("queue.live") : t("queue.reconnecting")}
        </span>
      </div>

      <Tabs defaultValue="waiting" id="queue">
        <TabsList>
          <TabsTrigger value="waiting">
            {t("queue.waiting")} ({waiting.length})
          </TabsTrigger>
          <TabsTrigger value="mine">
            {t("queue.mine")} ({mine.length})
          </TabsTrigger>
          <TabsTrigger value="done">
            {t("queue.doneToday")} ({done.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waiting" className="mt-4">
          {render(waiting, "queue.empty")}
        </TabsContent>
        <TabsContent value="mine" className="mt-4">
          {render(mine, "queue.emptyMine")}
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          {render(done, "queue.empty")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
