import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { JobStatus } from "@/lib/types";

const VALID_STATUSES: JobStatus[] = [
  "pending",
  "accepted",
  "declined",
  "completed",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status as string | undefined;

  if (!status || !VALID_STATUSES.includes(status as JobStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .update({ status: status as JobStatus })
    .eq("id", id)
    .select()
    .single();

  if (error || !job) {
    return NextResponse.json(
      { error: error?.message ?? "Could not update job" },
      { status: 500 }
    );
  }

  return NextResponse.json({ job });
}
