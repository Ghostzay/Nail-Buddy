/**
 * Seeds ~20 realistic jobs across every status so no screen is ever demoed
 * empty.
 *
 * Usage:
 *   npm run seed            # insert
 *   npm run seed -- --wipe  # delete seeded rows first
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY, because RLS deliberately forbids anon
 * from writing arbitrary statuses. That key is server-only — it must never be
 * in a NEXT_PUBLIC_ var, and this script is never bundled into the app.
 *
 * Every seeded customer's name ends with the marker below so --wipe can find
 * and remove exactly what this script created, and nothing else.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const MARKER = "(demo)";

// Minimal .env.local reader — avoids a dotenv dependency just for this.
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  /* rely on the ambient environment */
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Find the service role key in Project Settings -> API. Do NOT commit it."
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const FIRST = ["Mai", "Linh", "Trang", "Jordan", "Priya", "Sofia", "Kim", "Alex", "Hana", "Noor"];
const LAST = ["Nguyen", "Tran", "Patel", "Garcia", "Le", "Park", "Osei", "Silva"];
const SHAPES = ["square", "round", "almond", "coffin", "stiletto"];
const LENGTHS = ["short", "medium", "long", "xl"];
const COLORS = ["nudes", "reds", "pinks", "blacks", "whites", "chrome", "glitter"];
const DESIGNS = ["solid", "french", "ombre", "simple_art", "other"];
const STATUSES = ["pending", "pending", "pending", "accepted", "accepted", "completed", "completed", "declined"];
const NOTES = [
  "Please be gentle on my thumb, the nail is split.",
  "Móng ngắn, vuông, màu nude bóng.",
  "I'm in a hurry — anything quick is fine.",
  "Same as last time please.",
  null,
  "Sensitive cuticles, no cutting.",
];

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

async function wipe() {
  const { data } = await db.from("customers").select("id").like("name", `%${MARKER}`);
  const ids = (data ?? []).map((r) => r.id as string);
  if (!ids.length) {
    console.log("nothing to wipe");
    return;
  }
  // jobs cascade on customer delete
  await db.from("customers").delete().in("id", ids);
  console.log(`wiped ${ids.length} demo customers (and their jobs)`);
}

async function seed() {
  const now = Date.now();
  let jobs = 0;

  for (let i = 0; i < 20; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)} ${MARKER}`;
    const phone = `770555${String(1000 + i).slice(-4)}`;

    const { data: customer, error: cErr } = await db
      .from("customers")
      .insert({ name, phone })
      .select("id")
      .single();

    if (cErr || !customer) {
      console.error("customer insert failed:", cErr?.message);
      continue;
    }

    // Spread across the last 3 hours so wait badges show all three escalation
    // colours and /manager has something to average.
    const createdAt = new Date(now - Math.random() * 3 * 60 * 60 * 1000).toISOString();

    const { error: jErr } = await db.from("jobs").insert({
      customer_id: customer.id,
      shape: pick(SHAPES),
      length: pick(LENGTHS),
      color_family: pick(COLORS),
      design_type: pick(DESIGNS),
      status: pick(STATUSES),
      notes: pick(NOTES),
      created_at: createdAt,
    });

    if (jErr) console.error("job insert failed:", jErr.message);
    else jobs++;
  }

  console.log(`seeded ${jobs} jobs across ${20} demo customers`);
}

const args = process.argv.slice(2);
if (args.includes("--wipe")) await wipe();
if (!args.includes("--wipe-only")) await seed();
