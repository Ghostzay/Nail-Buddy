import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { translateToVietnamese } from "@/lib/translate";

// Translates a job's notes to Vietnamese. Only ever called when staff
// explicitly click "Translate to Vietnamese" on /tech — never automatic.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const jobId = body?.jobId as string | undefined;

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: job, error: fetchError } = await supabase
    .from("jobs")
    .select("id, notes, notes_vi")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.notes_vi) {
    return NextResponse.json({ translation: job.notes_vi });
  }

  if (!job.notes || !job.notes.trim()) {
    return NextResponse.json(
      { error: "This job has no notes to translate" },
      { status: 400 }
    );
  }

  let translation: string;
  try {
    translation = await translateToVietnamese(job.notes);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Translation failed" },
      { status: 502 }
    );
  }

  const { error: updateError } = await supabase
    .from("jobs")
    .update({ notes_vi: translation })
    .eq("id", jobId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ translation });
}
