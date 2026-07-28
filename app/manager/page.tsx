import { Suspense } from "react";
import type { Metadata } from "next";

import { StaffHeader } from "@/components/layout/staff-header";
import { ManagerDashboard } from "@/components/manager/dashboard";
import { StatTileSkeleton } from "@/components/salon/states";
import { rangeStart, type JobRow, type RangeKey } from "@/lib/analytics";
import { QUEUE_SELECT } from "@/lib/queue";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/lib/types";

export const metadata: Metadata = { title: "Manager | Nail Buddy" };
export const dynamic = "force-dynamic";

export default async function ManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range: RangeKey =
    rangeParam === "7d" || rangeParam === "30d" ? rangeParam : "today";

  let jobs: JobRow[] = [];
  let customers: Customer[] = [];

  if (hasSupabaseConfig()) {
    const supabase = await createClient();
    const since = rangeStart(range).toISOString();

    const [jobsRes, customersRes] = await Promise.all([
      supabase
        .from("jobs")
        .select(QUEUE_SELECT)
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("customers")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
    ]);

    jobs = (jobsRes.data ?? []) as unknown as JobRow[];
    customers = (customersRes.data ?? []) as Customer[];
  }

  return (
    <div className="bg-surface-base min-h-screen">
      <StaffHeader active="manager" />
      <Suspense
        fallback={
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatTileSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ManagerDashboard jobs={jobs} customers={customers} range={range} />
      </Suspense>
    </div>
  );
}
