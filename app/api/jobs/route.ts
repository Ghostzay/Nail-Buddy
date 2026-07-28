import { NextResponse } from "next/server";

import { FLAGS } from "@/lib/flags";
import { createClient } from "@/lib/supabase/server";

const SHAPES = ["square", "squoval", "round", "almond", "coffin", "stiletto"];
const LEGACY_SHAPES = ["square", "round", "almond", "coffin", "stiletto"];
const LENGTHS = ["short", "medium", "long", "xl"];
const COLORS = [
  "nudes", "reds", "pinks", "blacks", "whites", "chrome", "glitter",
  "blues", "greens", "purples",
];
const LEGACY_COLORS = COLORS.slice(0, 7);
const DESIGNS = ["solid", "french", "ombre", "simple_art", "other"];

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return bad("Invalid JSON body");

  const {
    customerName,
    customerPhone,
    shape,
    length,
    colorFamily,
    designType,
    notes,
    photoUrl,
    photoUrls,
    colorFamilies,
    services,
    requestedTechId,
    smsConsent,
    sensitivities,
  } = body;

  if (typeof customerName !== "string" || !customerName.trim()) {
    return bad("customerName is required");
  }

  // Validate against whatever the CHECK constraints actually allow right now,
  // so an invalid value is a clean 400 here rather than a Postgres error at
  // insert time after the customer already tapped Send.
  const allowedShapes = FLAGS.jobLifecycle ? SHAPES : LEGACY_SHAPES;
  const allowedColors = FLAGS.jobLifecycle ? COLORS : LEGACY_COLORS;

  if (typeof shape !== "string" || !allowedShapes.includes(shape)) return bad("Invalid shape");
  if (typeof length !== "string" || !LENGTHS.includes(length)) return bad("Invalid length");
  if (typeof colorFamily !== "string" || !allowedColors.includes(colorFamily)) {
    return bad("Invalid colorFamily");
  }
  if (typeof designType !== "string" || !DESIGNS.includes(designType)) {
    return bad("Invalid designType");
  }

  const supabase = await createClient();
  const phone = typeof customerPhone === "string" ? customerPhone.trim() : null;
  const digits = phone ? phone.replace(/\D/g, "") : null;

  // ---- customer ----------------------------------------------------------
  // Before migration 0001, anon has no SELECT on customers, so we cannot look
  // for an existing row and every request necessarily creates one (bug C2 in
  // AUDIT.md). Once the flag is on, the unique index plus this upsert collapse
  // repeat visitors onto a single record.
  let customerId: string | null = null;

  if (FLAGS.clientIdentity && digits) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("phone_normalized", digits)
      .maybeSingle();
    customerId = (existing?.id as string) ?? null;
  }

  if (!customerId) {
    const insert: Record<string, unknown> = {
      name: customerName.trim(),
      phone,
    };
    if (FLAGS.clientIdentity) {
      if (typeof smsConsent === "boolean") insert.sms_consent = smsConsent;
      if (Array.isArray(sensitivities)) insert.sensitivities = sensitivities;
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .insert(insert as never)
      .select("id")
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { error: error?.message ?? "Could not create customer" },
        { status: 500 }
      );
    }
    customerId = customer.id as string;
  }

  // ---- job ---------------------------------------------------------------
  const jobInsert: Record<string, unknown> = {
    customer_id: customerId,
    shape,
    length,
    color_family: colorFamily,
    design_type: designType,
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    photo_url: typeof photoUrl === "string" ? photoUrl : (Array.isArray(photoUrls) ? photoUrls[0] : null) ?? null,
  };

  if (FLAGS.jobLifecycle) {
    if (Array.isArray(photoUrls)) jobInsert.photo_urls = photoUrls;
    if (Array.isArray(colorFamilies)) jobInsert.color_families = colorFamilies;
    if (typeof requestedTechId === "string") jobInsert.requested_tech_id = requestedTechId;
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert(jobInsert as never)
    .select("id, created_at")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message ?? "Could not create job" },
      { status: 500 }
    );
  }

  // ---- services join (0003) ---------------------------------------------
  if (FLAGS.servicesAndTechs && Array.isArray(services) && services.length) {
    await supabase.from("job_services").insert(
      services.map((id) => ({ job_id: job.id, service_id: id })) as never
    );
  }

  // Queue position is best-effort; anon may not be able to count.
  let queuePosition: number | null = null;
  try {
    const { count } = await supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .in("status", FLAGS.jobLifecycle ? ["open", "claimed"] : ["pending", "accepted"]);
    queuePosition = count ?? null;
  } catch {
    queuePosition = null;
  }

  return NextResponse.json({ job, queuePosition }, { status: 201 });
}
