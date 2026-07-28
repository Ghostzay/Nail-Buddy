import type { QueueJob } from "@/components/salon/job-card";
import { toUiStatus } from "@/lib/job-adapter";
import type { Customer, Job } from "@/lib/types";

type Row = Job & { customer: Customer | null };

const titles: Record<string, string> = {
  square: "Square", squoval: "Squoval", round: "Round",
  almond: "Almond", coffin: "Coffin", stiletto: "Stiletto",
  short: "Short", medium: "Medium", long: "Long", xl: "XL",
  solid: "Solid", french: "French", ombre: "Ombré",
  simple_art: "Simple art", other: "Other",
};

const title = (v: string) => titles[v] ?? v;

/** First name + last initial. The queue is readable across a room, so the
 *  full surname never renders on a card. */
export function maskName(full: string | null | undefined): string {
  if (!full?.trim()) return "Walk-in";
  const [first, ...rest] = full.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

/** Shapes a DB row into what JobCard renders. */
export function toQueueJob(row: Row): QueueJob {
  const colors = row.color_families?.length
    ? row.color_families
    : [row.color_family];

  const photos = row.photo_urls?.length
    ? row.photo_urls
    : row.photo_url
      ? [row.photo_url]
      : [];

  return {
    id: row.id,
    status: toUiStatus(row.status),
    createdAt: row.created_at,
    customerName: maskName(row.customer?.name),
    chips: [
      title(row.shape),
      title(row.length),
      ...colors.map(title),
      row.design_type !== "solid" ? title(row.design_type) : null,
    ].filter(Boolean) as string[],
    notes: row.notes,
    notesVi: row.notes_vi,
    photoUrls: photos,
    // Structured sensitivities only exist post-0001; before that they live in
    // the notes body and deliberately are NOT parsed back out — guessing at a
    // safety flag from free text is worse than not showing one.
    sensitivities: row.customer?.sensitivities ?? [],
  };
}

/** Columns needed for the queue, valid against the pre-migration schema. */
export const QUEUE_SELECT = "*, customer:customers(*)";
