import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { FLAGS } from "@/lib/flags";
import { createClient } from "@/lib/supabase/server";

const DEVICE_COOKIE = "nb-device";

/**
 * Returning-client lookup.
 *
 * The kiosk never queries `customers` directly — anon has no read on it, by
 * design. This route calls the SECURITY DEFINER `client_lookup` RPC, which
 * enforces the 10-digit requirement, the per-device rate limit, and returns
 * ONLY pre-masked fields. Nothing unmasked ever reaches the tablet.
 *
 * The device id is a server-set httpOnly cookie so the page script cannot
 * rotate it to slip the rate limit.
 */
export async function POST(request: Request) {
  if (!FLAGS.clientIdentity) {
    // Migration 0002 not applied — the RPC does not exist. Report "no match"
    // so the kiosk falls through to registration rather than erroring.
    return NextResponse.json({ client: null });
  }

  const body = await request.json().catch(() => null);
  const phone = body?.phone as string | undefined;

  if (!phone || phone.replace(/\D/g, "").length !== 10) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const jar = await cookies();
  let deviceId = jar.get(DEVICE_COOKIE)?.value;
  const isNewDevice = !deviceId;
  if (!deviceId) deviceId = crypto.randomUUID();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("client_lookup", {
    p_phone: phone,
    p_device_id: deviceId,
  });

  if (error) {
    const rateLimited = /rate_limited/.test(error.message);
    return NextResponse.json(
      { error: rateLimited ? "rate_limited" : "lookup_failed" },
      { status: rateLimited ? 429 : 500 }
    );
  }

  const row = Array.isArray(data) ? data[0] : null;

  const res = NextResponse.json({
    client: row
      ? {
          clientId: row.client_id,
          displayName: row.display_name,
          maskedPhone: row.masked_phone,
          lastVisitAt: row.last_visit_at,
          lastVisitSummary: row.last_visit_summary,
          sensitivities: row.sensitivities ?? [],
        }
      : null,
  });

  if (isNewDevice) {
    res.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return res;
}
