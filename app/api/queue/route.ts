import { NextResponse } from "next/server";

import { FLAGS } from "@/lib/flags";
import { QUEUE_SELECT, toQueueJob } from "@/lib/queue";
import { createClient } from "@/lib/supabase/server";
import type { Customer, Job, JobStatus } from "@/lib/types";

/** Backs both the realtime refetch and the polling fallback on /tech. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const active: JobStatus[] = FLAGS.jobLifecycle
    ? ["open", "claimed", "in_progress", "complete"]
    : ["pending", "accepted", "completed"];

  // Completed jobs are scoped to today so the "Done today" tab doesn't grow
  // without bound and drag the whole payload with it.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("jobs")
    .select(QUEUE_SELECT)
    .in("status", active)
    .gte("created_at", startOfDay.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as (Job & { customer: Customer | null })[];
  return NextResponse.json({ jobs: rows.map(toQueueJob) });
}
