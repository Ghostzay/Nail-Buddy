import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { StaffHeader } from "@/components/layout/staff-header";
import { ManagerDashboard } from "@/components/manager/dashboard";
import type { Customer, JobWithCustomer } from "@/lib/types";

export const metadata: Metadata = {
  title: "Manager Dashboard | Nail Buddy",
};

export const dynamic = "force-dynamic";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export default async function ManagerPage() {
  const supabase = await createClient();
  const since = startOfToday();

  const [{ data: jobs }, { data: customers }] = await Promise.all([
    supabase
      .from("jobs")
      .select("*, customer:customers(*)")
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase
      .from("customers")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="min-h-screen bg-muted/20">
      <StaffHeader active="manager" />
      <ManagerDashboard
        jobs={(jobs as JobWithCustomer[]) ?? []}
        customers={(customers as Customer[]) ?? []}
      />
    </div>
  );
}
