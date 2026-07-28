import { NextResponse } from "next/server";

import { FLAGS } from "@/lib/flags";
import { toDbStatus } from "@/lib/job-adapter";
import { createClient } from "@/lib/supabase/server";
import type { JobStatus as UiStatus } from "@/components/salon/status-pill";
import type { JobStatus } from "@/lib/types";

const ACTIONS = ["accept", "decline", "start", "complete", "reopen"] as const;
type Action = (typeof ACTIONS)[number];

const TARGET: Record<Action, UiStatus> = {
  accept: "claimed",
  decline: "cancelled",
  start: "in_progress",
  complete: "complete",
  reopen: "open",
};

/** Statuses a job must currently be in for the action to be legal. */
const REQUIRED_FROM: Record<Action, UiStatus[]> = {
  accept: ["open"],
  decline: ["open", "claimed"],
  start: ["claimed"],
  complete: ["claimed", "in_progress"],
  reopen: ["claimed", "in_progress", "cancelled"],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action as Action | undefined;

  if (!action || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const patch: Record<string, unknown> = { status: toDbStatus(TARGET[action]) };

  if (FLAGS.jobLifecycle) {
    if (action === "start") patch.started_at = new Date().toISOString();
    if (action === "complete") patch.completed_at = new Date().toISOString();
    if (action === "decline" && typeof body?.reason === "string") {
      patch.decline_reason = body.reason;
    }
  }

  // ---- the guard that makes this atomic --------------------------------
  // Previously this was `update ... where id = $1` with no status condition,
  // so two techs tapping Accept on the same job both succeeded and the last
  // write silently won (bug C1 in AUDIT.md). Constraining the update on the
  // CURRENT status means exactly one request can transition a given job:
  // Postgres serialises the row update, and the loser matches zero rows.
  const allowedFrom = REQUIRED_FROM[action].map(toDbStatus) as JobStatus[];

  const { data, error } = await supabase
    .from("jobs")
    .update(patch as never)
    .eq("id", id)
    .in("status", allowedFrom)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    // Zero rows means somebody else moved it first. This is an expected race,
    // not a server fault — 409 so the client can say "someone else got this
    // one" and animate the card away instead of showing an error.
    return NextResponse.json(
      { error: "already_taken" },
      { status: 409 }
    );
  }

  return NextResponse.json({ job: data });
}
