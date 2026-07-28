import { FLAGS } from "@/lib/flags";
import { SERVICE_BY_ID } from "@/lib/services";
import type { JobStatus as UiStatus } from "@/components/salon/status-pill";
import type { ColorFamilyKey, DesignKey } from "@/lib/nail-colors";
import type { NailLength, NailShape } from "@/lib/nail-shapes";

/**
 * Bridges the UI's vocabulary to whatever the database actually is right now.
 *
 * The migrations in supabase/migrations are written but NOT APPLIED, so the
 * live schema is still the original one: a single shape/length/color_family/
 * design_type per job, one photo_url, and statuses
 * pending|accepted|declined|completed. This module lets the full redesigned
 * kiosk ship against that schema today, and start using the richer columns
 * the moment the flags are turned on — without a second UI.
 *
 * Everything here is deliberately lossy in ONE direction only: we never write
 * a value the current CHECK constraints would reject, and we never silently
 * corrupt (e.g. squoval is hidden rather than coerced to square).
 */

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

const LEGACY_TO_UI: Record<string, UiStatus> = {
  pending: "open",
  accepted: "claimed",
  declined: "cancelled",
  completed: "complete",
};

const UI_TO_LEGACY: Record<UiStatus, string> = {
  open: "pending",
  claimed: "accepted",
  // The legacy vocabulary has no in_progress. Keeping it as `accepted` means a
  // started job still reads as claimed rather than inventing a status the
  // CHECK constraint would reject.
  in_progress: "accepted",
  complete: "completed",
  cancelled: "declined",
};

export function toUiStatus(dbStatus: string): UiStatus {
  if (FLAGS.jobLifecycle) return dbStatus as UiStatus;
  return LEGACY_TO_UI[dbStatus] ?? "open";
}

export function toDbStatus(ui: UiStatus): string {
  if (FLAGS.jobLifecycle) return ui;
  return UI_TO_LEGACY[ui] ?? "pending";
}

/** `in_progress` only exists once 0004 is applied. */
export const supportsInProgress = () => FLAGS.jobLifecycle;

/** squoval is only legal after 0004 widens the shape CHECK constraint. */
export const availableShapes = (all: readonly NailShape[]): NailShape[] =>
  FLAGS.jobLifecycle ? [...all] : all.filter((s) => s !== "squoval");

/**
 * The live DB only knows 7 colour families. Offering blues/greens/purples
 * before 0004 would produce an insert that fails the CHECK constraint at
 * submit time — the worst possible moment.
 */
const LEGACY_COLORS: ColorFamilyKey[] = [
  "nudes", "reds", "pinks", "blacks", "whites", "chrome", "glitter",
];

export const availableColors = (all: readonly ColorFamilyKey[]): ColorFamilyKey[] =>
  FLAGS.jobLifecycle ? [...all] : all.filter((c) => LEGACY_COLORS.includes(c));

/** Legacy design_type values. */
const DESIGN_TO_DB: Record<DesignKey, string> = {
  solid: "solid",
  french: "french",
  ombre: "ombre",
  art: "simple_art",
  glitter: "other",
  other: "other",
};

export const maxColors = () => (FLAGS.jobLifecycle ? 3 : 1);
export const maxPhotos = () => (FLAGS.jobLifecycle ? 3 : 1);

// ---------------------------------------------------------------------------
// Submission payload
// ---------------------------------------------------------------------------

export interface KioskSubmission {
  firstName: string;
  lastName: string;
  phone: string;
  smsConsent: boolean;
  sensitivities: string[];
  services: string[];
  techId: string | null;
  shape: NailShape;
  length: NailLength;
  colors: ColorFamilyKey[];
  toeColors: ColorFamilyKey[];
  design: DesignKey;
  notes: string;
  photoUrls: string[];
}

/**
 * Everything the current schema cannot store gets folded into the notes field
 * rather than dropped. A tech reading "Services: Gel-X, Classic pedicure" in
 * the notes is strictly better than the information vanishing because the
 * join table doesn't exist yet.
 */
export function buildNotes(sub: KioskSubmission, labels: {
  services: string;
  toes: string;
  avoid: string;
  extraColors: string;
}): string {
  const parts: string[] = [];

  if (sub.notes.trim()) parts.push(sub.notes.trim());

  if (!FLAGS.servicesAndTechs && sub.services.length) {
    const names = sub.services
      .map((id) => SERVICE_BY_ID.get(id)?.label)
      .filter(Boolean)
      .join(", ");
    if (names) parts.push(`${labels.services}: ${names}`);
  }

  if (!FLAGS.jobLifecycle) {
    // Only the first colour survives into color_family; keep the rest visible.
    if (sub.colors.length > 1) {
      parts.push(`${labels.extraColors}: ${sub.colors.slice(1).join(", ")}`);
    }
    if (sub.toeColors.length) {
      parts.push(`${labels.toes}: ${sub.toeColors.join(", ")}`);
    }
    if (sub.photoUrls.length > 1) {
      parts.push(...sub.photoUrls.slice(1));
    }
  }

  if (!FLAGS.clientIdentity && sub.sensitivities.length) {
    parts.push(`${labels.avoid}: ${sub.sensitivities.join(", ")}`);
  }

  return parts.join("\n");
}

/** Shapes the API payload for whichever schema is live. */
export function buildJobPayload(sub: KioskSubmission, notes: string) {
  const base = {
    customerName: `${sub.firstName} ${sub.lastName}`.trim(),
    customerPhone: sub.phone || undefined,
    shape: sub.shape,
    length: sub.length,
    designType: DESIGN_TO_DB[sub.design],
    notes: notes || undefined,
  };

  if (!FLAGS.jobLifecycle) {
    return {
      ...base,
      colorFamily: sub.colors[0] ?? "nudes",
      photoUrl: sub.photoUrls[0],
    };
  }

  return {
    ...base,
    colorFamily: sub.colors[0] ?? "nudes",
    colorFamilies: sub.colors,
    toeColorFamilies: sub.toeColors,
    photoUrls: sub.photoUrls,
    services: FLAGS.servicesAndTechs ? sub.services : undefined,
    requestedTechId: FLAGS.servicesAndTechs ? sub.techId : undefined,
    smsConsent: FLAGS.clientIdentity ? sub.smsConsent : undefined,
    sensitivities: FLAGS.clientIdentity ? sub.sensitivities : undefined,
  };
}
