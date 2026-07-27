import { SERVICE_BY_ID, hasGroup, type ServiceDef } from "@/lib/services";

/**
 * Money and time estimates. PLACEHOLDER NUMBERS — edit freely.
 *
 * Everything here is an ESTIMATE and must be labelled as such in the UI; the
 * tech sets the final price. See `common.estimate`.
 */

/** Hands + feet in one visit is the most common upsell in a nail salon, so the
 *  saving is surfaced as a badge rather than buried in the total. */
export const COMBO_DISCOUNT_CENTS = 1200;

export interface Estimate {
  subtotalCents: number;
  comboDiscountCents: number;
  totalCents: number;
  /** Wall-clock minutes, accounting for services that run concurrently. */
  durationMin: number;
  hasCombo: boolean;
}

export function formatMoney(cents: number, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Duration is NOT the sum. Services flagged `parallelizable` (a pedicure while
 * the hands soak, paraffin, extended massage) overlap with the sequential
 * work, so wall-clock time is:
 *
 *   max(sum of sequential work, longest parallel track)
 *
 * plus a small changeover allowance per extra service. A naive sum would quote
 * ~3 hours for mani + pedi + brow and send the customer somewhere else.
 */
export function estimateDuration(services: ServiceDef[]): number {
  if (services.length === 0) return 0;

  const sequential = services.filter((s) => !s.parallelizable);
  const parallel = services.filter((s) => s.parallelizable);

  const sequentialMin = sequential.reduce((n, s) => n + s.durationMin, 0);
  const parallelMin = parallel.reduce((n, s) => Math.max(n, s.durationMin), 0);

  const changeover = Math.max(0, services.length - 1) * 5;

  return Math.max(sequentialMin, parallelMin) + changeover;
}

export function estimate(selectedIds: string[]): Estimate {
  const services = selectedIds
    .map((id) => SERVICE_BY_ID.get(id))
    .filter((s): s is ServiceDef => Boolean(s));

  const subtotalCents = services.reduce((n, s) => n + s.priceCents, 0);
  const hasCombo = hasGroup(selectedIds, "hands") && hasGroup(selectedIds, "feet");
  const comboDiscountCents = hasCombo ? COMBO_DISCOUNT_CENTS : 0;

  return {
    subtotalCents,
    comboDiscountCents,
    totalCents: Math.max(0, subtotalCents - comboDiscountCents),
    durationMin: estimateDuration(services),
    hasCombo,
  };
}

/** Rough queue wait — swapped for real data once technicians land (0003). */
export function estimateWait(queueAheadCount: number, avgServiceMin = 45) {
  return Math.max(0, Math.round(queueAheadCount * avgServiceMin * 0.4));
}
