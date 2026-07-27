import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  COLOR_FAMILY_OPTIONS,
  DESIGN_TYPE_OPTIONS,
  LENGTH_OPTIONS,
  SHAPE_OPTIONS,
  type ColorFamily,
  type DesignType,
  type Length,
  type Shape,
} from "@/lib/types";

const SHAPES = SHAPE_OPTIONS.map((o) => o.value);
const LENGTHS = LENGTH_OPTIONS.map((o) => o.value);
const COLOR_FAMILIES = COLOR_FAMILY_OPTIONS.map((o) => o.value);
const DESIGN_TYPES = DESIGN_TYPE_OPTIONS.map((o) => o.value);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    customerName,
    customerPhone,
    shape,
    length,
    colorFamily,
    designType,
    notes,
    photoUrl,
  } = body as Record<string, unknown>;

  if (typeof customerName !== "string" || !customerName.trim()) {
    return NextResponse.json(
      { error: "customerName is required" },
      { status: 400 }
    );
  }

  if (typeof shape !== "string" || !SHAPES.includes(shape as (typeof SHAPES)[number])) {
    return NextResponse.json({ error: "Invalid shape" }, { status: 400 });
  }
  if (typeof length !== "string" || !LENGTHS.includes(length as (typeof LENGTHS)[number])) {
    return NextResponse.json({ error: "Invalid length" }, { status: 400 });
  }
  if (
    typeof colorFamily !== "string" ||
    !COLOR_FAMILIES.includes(colorFamily as (typeof COLOR_FAMILIES)[number])
  ) {
    return NextResponse.json(
      { error: "Invalid colorFamily" },
      { status: 400 }
    );
  }
  if (
    typeof designType !== "string" ||
    !DESIGN_TYPES.includes(designType as (typeof DESIGN_TYPES)[number])
  ) {
    return NextResponse.json({ error: "Invalid designType" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      name: customerName.trim(),
      phone: typeof customerPhone === "string" ? customerPhone.trim() : null,
    })
    .select()
    .single();

  if (customerError || !customer) {
    return NextResponse.json(
      { error: customerError?.message ?? "Could not create customer" },
      { status: 500 }
    );
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      customer_id: customer.id,
      shape: shape as Shape,
      length: length as Length,
      color_family: colorFamily as ColorFamily,
      design_type: designType as DesignType,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      photo_url: typeof photoUrl === "string" ? photoUrl : null,
    })
    .select()
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message ?? "Could not create job" },
      { status: 500 }
    );
  }

  return NextResponse.json({ job, customer }, { status: 201 });
}
