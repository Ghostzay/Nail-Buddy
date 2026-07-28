import type { Metadata } from "next";

import { StaffHeader } from "@/components/layout/staff-header";
import { TechQueue } from "@/components/tech/tech-queue";
import type { QueueJob } from "@/components/salon/job-card";
import { FLAGS } from "@/lib/flags";
import { QUEUE_SELECT, toQueueJob } from "@/lib/queue";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Customer, Job, JobStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Queue | Nail Buddy" };
export const dynamic = "force-dynamic";

export default async function TechPage() {
  let jobs: QueueJob[] = [];

  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("jobs")
      .select(QUEUE_SELECT)
      .in(
        "status",
        (FLAGS.jobLifecycle
          ? ["open", "claimed", "in_progress", "complete"]
          : ["pending", "accepted", "completed"]) as JobStatus[]
      )
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: true });

    const rows = (data ?? []) as unknown as (Job & { customer: Customer | null })[];
    jobs = rows.map(toQueueJob);
  }

  return (
    <div className="bg-surface-base min-h-screen">
      <StaffHeader active="tech" />
      <TechQueue initialJobs={jobs} />
    </div>
  );
}
