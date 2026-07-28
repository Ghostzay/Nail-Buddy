import type { Metadata, Viewport } from "next";

import { Kiosk } from "@/components/request/kiosk";
import type { Technician } from "@/components/salon/tech-card";
import { FLAGS } from "@/lib/flags";
import { estimateWait } from "@/lib/pricing";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Check in | Nail Buddy",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF7F4",
};

export const dynamic = "force-dynamic";

/**
 * Server shell. Fetches the queue depth and (once 0003 lands) the clocked-in
 * roster, then hands off to the client kiosk. Everything interactive lives
 * below this boundary rather than the whole page being a client component.
 */
export default async function RequestPage() {
  let queueAhead = 0;
  let technicians: Technician[] = [];

  // A misconfigured or unreachable Supabase must never stop the kiosk from
  // rendering. Every read below is best-effort; the only place a real failure
  // surfaces is Send, where the message can actually help someone.
  if (!hasSupabaseConfig()) {
    return (
      <div className="bg-surface-base min-h-screen">
        <Kiosk technicians={[]} baseWaitMin={10} queueAhead={0} />
      </div>
    );
  }

  const supabase = await createClient();

  try {
    // anon cannot SELECT jobs under current RLS, so this is best-effort: a
    // failure just means the wait estimate falls back to a default.
    const { count } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .in("status", FLAGS.jobLifecycle ? ["open", "claimed"] : ["pending", "accepted"]);
    queueAhead = count ?? 0;
  } catch {
    queueAhead = 0;
  }

  if (FLAGS.servicesAndTechs) {
    try {
      const { data } = await supabase
        .from("technicians")
        .select("id, display_name, photo_url, specialties")
        .eq("active", true)
        .eq("is_clocked_in", true);
      technicians = (data ?? []).map((r) => ({
        id: r.id as string,
        displayName: r.display_name as string,
        photoUrl: r.photo_url as string | null,
        specialties: (r.specialties as string[]) ?? [],
        busyForMin: null,
      }));
    } catch {
      technicians = [];
    }
  }

  return (
    <div className="bg-surface-base min-h-screen">
      <Kiosk
        technicians={technicians}
        baseWaitMin={Math.max(5, estimateWait(queueAhead))}
        queueAhead={queueAhead}
      />
    </div>
  );
}
