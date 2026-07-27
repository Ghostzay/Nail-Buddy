import type { MessageKey } from "@/lib/i18n";

/**
 * Service catalogue and selection rules.
 *
 * PLACEHOLDER PRICES AND DURATIONS. I do not know this salon's real menu —
 * every number below is invented and meant to be edited. Once migration 0003
 * is applied and NEXT_PUBLIC_FF_SERVICES_TECHS is on, this file becomes the
 * seed/fallback and the live catalogue comes from the `services` table.
 *
 * Rules live here, not in components, so /request, /tech and /manager all
 * agree about what combinations are legal.
 */

export type ServiceGroup = "hands" | "feet" | "waxing" | "addons";

export interface ServiceDef {
  id: string;
  group: ServiceGroup;
  /** i18n key for the display name. No English in components. */
  labelKey: MessageKey | string;
  /** Fallback English used until a translation key exists for it. */
  label: string;
  priceCents: number;
  durationMin: number;
  /** Base services are mutually exclusive within hands and feet. */
  isBase?: boolean;
  /** Add-on may only be picked when one of these groups has a base service. */
  requiresParentGroup?: ServiceGroup[];
  /**
   * Can run concurrently with another service — a pedicure runs while the
   * hands soak. Drives duration, which must NOT be a naive sum or the kiosk
   * quotes three hours and the customer walks.
   */
  parallelizable?: boolean;
}

export const SERVICES: ServiceDef[] = [
  // ---- Hands (one base) ---------------------------------------------------
  { id: "full-set-acrylic", group: "hands", label: "Full set (acrylic)", labelKey: "services.hands", priceCents: 5500, durationMin: 75, isBase: true },
  { id: "fill", group: "hands", label: "Fill", labelKey: "services.hands", priceCents: 3500, durationMin: 55, isBase: true },
  { id: "gel-x", group: "hands", label: "Gel-X", labelKey: "services.hands", priceCents: 6000, durationMin: 70, isBase: true },
  { id: "dip-powder", group: "hands", label: "Dip powder", labelKey: "services.hands", priceCents: 5000, durationMin: 60, isBase: true },
  { id: "gel-mani", group: "hands", label: "Gel manicure", labelKey: "services.hands", priceCents: 3800, durationMin: 45, isBase: true },
  { id: "classic-mani", group: "hands", label: "Classic manicure", labelKey: "services.hands", priceCents: 2500, durationMin: 30, isBase: true },
  { id: "polish-change-hands", group: "hands", label: "Polish change", labelKey: "services.hands", priceCents: 1500, durationMin: 20, isBase: true },
  { id: "removal-hands", group: "hands", label: "Removal", labelKey: "services.hands", priceCents: 1000, durationMin: 20 },
  { id: "repair", group: "hands", label: "Repair", labelKey: "services.hands", priceCents: 500, durationMin: 10 },

  // ---- Feet (one base) ----------------------------------------------------
  { id: "classic-pedi", group: "feet", label: "Classic pedicure", labelKey: "services.feet", priceCents: 3500, durationMin: 45, isBase: true, parallelizable: true },
  { id: "deluxe-pedi", group: "feet", label: "Deluxe pedicure", labelKey: "services.feet", priceCents: 5000, durationMin: 60, isBase: true, parallelizable: true },
  { id: "gel-pedi", group: "feet", label: "Gel pedicure", labelKey: "services.feet", priceCents: 4500, durationMin: 55, isBase: true, parallelizable: true },
  { id: "polish-change-feet", group: "feet", label: "Polish change", labelKey: "services.feet", priceCents: 1500, durationMin: 20, isBase: true, parallelizable: true },
  { id: "callus", group: "feet", label: "Callus treatment", labelKey: "services.feet", priceCents: 1200, durationMin: 15, parallelizable: true },

  // ---- Waxing (freely multi-select) ---------------------------------------
  { id: "wax-brow", group: "waxing", label: "Eyebrow", labelKey: "services.waxing", priceCents: 1200, durationMin: 10 },
  { id: "wax-lip", group: "waxing", label: "Lip", labelKey: "services.waxing", priceCents: 800, durationMin: 5 },
  { id: "wax-chin", group: "waxing", label: "Chin", labelKey: "services.waxing", priceCents: 900, durationMin: 5 },
  { id: "wax-face", group: "waxing", label: "Full face", labelKey: "services.waxing", priceCents: 3500, durationMin: 30 },
  { id: "wax-underarm", group: "waxing", label: "Underarm", labelKey: "services.waxing", priceCents: 2000, durationMin: 15 },
  { id: "wax-arms", group: "waxing", label: "Arms", labelKey: "services.waxing", priceCents: 3500, durationMin: 25 },
  { id: "wax-legs", group: "waxing", label: "Legs", labelKey: "services.waxing", priceCents: 5500, durationMin: 40 },
  { id: "wax-bikini", group: "waxing", label: "Bikini", labelKey: "services.waxing", priceCents: 4000, durationMin: 30 },
  { id: "wax-back", group: "waxing", label: "Back", labelKey: "services.waxing", priceCents: 4500, durationMin: 30 },

  // ---- Add-ons (need a parent) -------------------------------------------
  { id: "nail-art", group: "addons", label: "Nail art", labelKey: "services.addons", priceCents: 1500, durationMin: 20, requiresParentGroup: ["hands", "feet"] },
  { id: "french", group: "addons", label: "French", labelKey: "services.addons", priceCents: 1000, durationMin: 15, requiresParentGroup: ["hands", "feet"] },
  { id: "chrome", group: "addons", label: "Chrome / cat-eye", labelKey: "services.addons", priceCents: 1200, durationMin: 15, requiresParentGroup: ["hands", "feet"] },
  { id: "rhinestones", group: "addons", label: "Rhinestones", labelKey: "services.addons", priceCents: 800, durationMin: 10, requiresParentGroup: ["hands", "feet"] },
  { id: "paraffin", group: "addons", label: "Paraffin", labelKey: "services.addons", priceCents: 1000, durationMin: 15, requiresParentGroup: ["hands", "feet"], parallelizable: true },
  { id: "extended-massage", group: "addons", label: "Extended massage", labelKey: "services.addons", priceCents: 1500, durationMin: 15, requiresParentGroup: ["feet"], parallelizable: true },
  { id: "gel-removal", group: "addons", label: "Gel removal", labelKey: "services.addons", priceCents: 1000, durationMin: 15, requiresParentGroup: ["hands", "feet"] },
];

export const SERVICE_BY_ID = new Map(SERVICES.map((s) => [s.id, s]));

export const SERVICE_GROUPS: ServiceGroup[] = ["hands", "feet", "waxing", "addons"];

export function servicesInGroup(group: ServiceGroup) {
  return SERVICES.filter((s) => s.group === group);
}

/** Nail-enhancement work — gates the shape/length/colour/design steps. */
const NAIL_GROUPS: ServiceGroup[] = ["hands", "feet"];

export function requiresNailChoices(selected: string[]): boolean {
  return selected.some((id) => {
    const s = SERVICE_BY_ID.get(id);
    return !!s && NAIL_GROUPS.includes(s.group) && s.id !== "removal-hands";
  });
}

export function hasGroup(selected: string[], group: ServiceGroup) {
  return selected.some((id) => SERVICE_BY_ID.get(id)?.group === group);
}

/** Both hands and feet polish selected → the colour step must ask about toes. */
export function needsToeColourQuestion(selected: string[]) {
  return hasGroup(selected, "hands") && hasGroup(selected, "feet");
}

export interface ToggleResult {
  selected: string[];
  /** Set when a base service displaced another — the UI cross-fades rather
   *  than erroring, so this is informational, not a failure. */
  swappedOutId?: string;
  /** Set when the toggle was refused, with the reason to show on tap. */
  blocked?: { reason: "needs-parent"; group: ServiceGroup[] };
}

/**
 * The single place selection rules are enforced. Components call this rather
 * than mutating arrays themselves.
 */
export function toggleService(selected: string[], id: string): ToggleResult {
  const svc = SERVICE_BY_ID.get(id);
  if (!svc) return { selected };

  // Deselect is always allowed. Removing a parent also drops orphaned add-ons.
  if (selected.includes(id)) {
    let next = selected.filter((s) => s !== id);
    next = next.filter((otherId) => {
      const other = SERVICE_BY_ID.get(otherId);
      if (!other?.requiresParentGroup) return true;
      return other.requiresParentGroup.some((g) =>
        next.some((n) => {
          const cand = SERVICE_BY_ID.get(n);
          return cand?.group === g && cand.isBase;
        })
      );
    });
    return { selected: next };
  }

  // Add-ons need a compatible parent base service.
  if (svc.requiresParentGroup) {
    const ok = svc.requiresParentGroup.some((g) =>
      selected.some((n) => {
        const cand = SERVICE_BY_ID.get(n);
        return cand?.group === g && cand.isBase;
      })
    );
    if (!ok) {
      return { selected, blocked: { reason: "needs-parent", group: svc.requiresParentGroup } };
    }
  }

  // One base per hands/feet — picking Fill when Full set is on swaps them.
  if (svc.isBase && NAIL_GROUPS.includes(svc.group)) {
    const displaced = selected.find((n) => {
      const cand = SERVICE_BY_ID.get(n);
      return cand?.group === svc.group && cand.isBase;
    });
    if (displaced) {
      return {
        selected: [...selected.filter((s) => s !== displaced), id],
        swappedOutId: displaced,
      };
    }
  }

  return { selected: [...selected, id] };
}

/** Why an add-on is currently untappable, for the disabled-with-reason state. */
export function disabledReason(
  selected: string[],
  id: string
): { group: ServiceGroup[] } | null {
  const svc = SERVICE_BY_ID.get(id);
  if (!svc?.requiresParentGroup || selected.includes(id)) return null;
  const ok = svc.requiresParentGroup.some((g) =>
    selected.some((n) => {
      const cand = SERVICE_BY_ID.get(n);
      return cand?.group === g && cand.isBase;
    })
  );
  return ok ? null : { group: svc.requiresParentGroup };
}
