import { FLAGS } from "@/lib/flags";
import type { ColorFamilyKey, DesignKey } from "@/lib/nail-colors";
import type { NailLength, NailShape } from "@/lib/nail-shapes";
import { needsToeColourQuestion, requiresNailChoices } from "@/lib/services";
import type { PickedPhoto } from "@/components/salon/photo-picker";

/** Screens before the progress rail starts. */
export type Gate =
  | "welcome"
  | "signin"
  | "phone"
  | "confirm"
  | "register"
  | "repeat";

/** Steps that appear on the progress rail. */
export type FlowStep =
  | "services"
  | "tech"
  | "shape"
  | "length"
  | "color"
  | "design"
  | "details"
  | "review";

export interface KioskDraft {
  clientId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  sensitivities: string[];
  smsConsent: boolean;
  services: string[];
  techId: string | null;
  shape: NailShape;
  length: NailLength;
  colors: ColorFamilyKey[];
  sameOnToes: boolean;
  toeColors: ColorFamilyKey[];
  design: DesignKey;
  notes: string;
  photos: PickedPhoto[];
}

export const EMPTY_DRAFT: KioskDraft = {
  clientId: null,
  firstName: "",
  lastName: "",
  phone: "",
  sensitivities: [],
  smsConsent: false,
  services: [],
  techId: null,
  shape: "squoval",
  length: "medium",
  colors: [],
  sameOnToes: true,
  toeColors: [],
  design: "solid",
  notes: "",
  photos: [],
};

/**
 * The rail is computed from the current selection, not fixed.
 *
 * A wax-only client genuinely has four steps, and showing them "step 6 of 8"
 * before jumping to 8 is the thing the brief calls out. Because this returns
 * the live list, ProgressRail visibly shrinks the moment services change.
 */
export function computeSteps(draft: KioskDraft): FlowStep[] {
  const steps: FlowStep[] = ["services"];

  // The tech step needs a real roster, which needs migration 0003. Until then
  // there is only ever "first available", and a one-option step is a tax.
  if (FLAGS.servicesAndTechs) steps.push("tech");

  if (requiresNailChoices(draft.services)) {
    steps.push("shape", "length", "color", "design");
  }

  steps.push("details", "review");
  return steps;
}

export function shouldAskAboutToes(draft: KioskDraft) {
  return FLAGS.jobLifecycle && needsToeColourQuestion(draft.services);
}

/** Everything needed to leave a given step. */
export function canAdvance(step: FlowStep, draft: KioskDraft): boolean {
  switch (step) {
    case "services":
      return draft.services.length > 0;
    case "tech":
      return true; // "first available" is pre-selected
    case "shape":
      return Boolean(draft.shape);
    case "length":
      return Boolean(draft.length);
    case "color":
      return draft.colors.length > 0;
    case "design":
      return Boolean(draft.design);
    case "details":
      return true; // notes and photos are both optional
    case "review":
      return true;
    default:
      return true;
  }
}

/** One-line summary for the review screen and the tech card. */
export function summarise(
  draft: KioskDraft,
  label: (k: string) => string
): string {
  return [
    label(`shape.${draft.shape}`),
    label(`length.${draft.length}`),
    ...draft.colors.map((c) => label(`color.${c}`)),
    draft.design !== "solid" ? label(`design.${draft.design}`) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
