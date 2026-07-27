"use client";

import { useEffect, useMemo, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Job, JobWithCustomer } from "@/lib/types";
import { JobCard } from "@/components/tech/job-card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface TechQueueProps {
  initialJobs: JobWithCustomer[];
}

export function TechQueue({ initialJobs }: TechQueueProps) {
  const [jobs, setJobs] = useState<JobWithCustomer[]>(initialJobs);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("tech-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newJob = payload.new as Job;
            const { data: customer } = await supabase
              .from("customers")
              .select("*")
              .eq("id", newJob.customer_id)
              .single();
            setJobs((prev) => [{ ...newJob, customer: customer ?? null }, ...prev]);
            toast("New request received", {
              description: customer?.name ?? "Walk-in customer",
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Job;
            setJobs((prev) =>
              prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as Job;
            setJobs((prev) => prev.filter((j) => j.id !== deleted.id));
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function updateStatus(
    id: string,
    status: "accepted" | "declined" | "completed"
  ) {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Couldn't update the job. Try again.");
      return;
    }
    setJobs((prev) =>
      status === "completed" || status === "declined"
        ? prev.filter((j) => j.id !== id)
        : prev.map((j) => (j.id === id ? { ...j, status } : j))
    );
  }

  function handleTranslated(id: string, notesVi: string) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, notes_vi: notesVi } : j)));
  }

  const pending = useMemo(
    () => jobs.filter((j) => j.status === "pending").sort(byCreatedAtAsc),
    [jobs]
  );
  const inProgress = useMemo(
    () => jobs.filter((j) => j.status === "accepted").sort(byCreatedAtAsc),
    [jobs]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Job Queue</h1>
        <span
          className={`flex items-center gap-1.5 text-xs font-medium ${
            connected ? "text-success" : "text-muted-foreground"
          }`}
        >
          {connected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {connected ? "Live" : "Connecting…"}
        </span>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({inProgress.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <JobGrid jobs={pending} onUpdateStatus={updateStatus} onTranslated={handleTranslated} empty="No pending requests." />
        </TabsContent>
        <TabsContent value="in-progress" className="mt-4">
          <JobGrid jobs={inProgress} onUpdateStatus={updateStatus} onTranslated={handleTranslated} empty="Nothing in progress." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function byCreatedAtAsc(a: JobWithCustomer, b: JobWithCustomer) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function JobGrid({
  jobs,
  onUpdateStatus,
  onTranslated,
  empty,
}: {
  jobs: JobWithCustomer[];
  onUpdateStatus: (id: string, status: "accepted" | "declined" | "completed") => Promise<void>;
  onTranslated: (id: string, notesVi: string) => void;
  empty: string;
}) {
  if (jobs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        {empty}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onUpdateStatus={onUpdateStatus}
          onTranslated={onTranslated}
        />
      ))}
    </div>
  );
}
