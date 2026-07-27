import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { StaffHeader } from "@/components/layout/staff-header";
import { TechQueue } from "@/components/tech/tech-queue";
import type { JobWithCustomer } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tech Queue | Nail Buddy",
};

export const dynamic = "force-dynamic";

export default async function TechPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, customer:customers(*)")
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: true });

  return (
    <div className="min-h-screen bg-muted/20">
      <StaffHeader active="tech" />
      <TechQueue initialJobs={(jobs as JobWithCustomer[]) ?? []} />
    </div>
  );
}
