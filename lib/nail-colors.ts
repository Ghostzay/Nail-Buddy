import type { MessageKey } from "@/lib/i18n";

/**
 * Colour families. `lacquer` is what the LiveNailPreview actually paints;
 * `swatchFrom`/`swatchTo` render the drop on the SwatchCard.
 *
 * These are literal pigment values, not design tokens — a nude has to look
 * like that nude. They are the one legitimate place raw colour lives outside
 * globals.css, and they never style UI chrome.
 */

export const COLOR_FAMILY_KEYS = [
  "nudes",
  "reds",
  "pinks",
  "purples",
  "blues",
  "greens",
  "blacks",
  "whites",
  "chrome",
  "glitter",
] as const;

export type ColorFamilyKey = (typeof COLOR_FAMILY_KEYS)[number];

export interface ColorFamily {
  key: ColorFamilyKey;
  labelKey: MessageKey;
  /** Painted on the nail. */
  lacquer: string;
  /** Drop gradient on the swatch card. */
  swatchFrom: string;
  swatchTo: string;
  /** Metallic/particle families get extra treatment in the preview. */
  effect?: "chrome" | "glitter";
}

export const COLOR_FAMILIES: ColorFamily[] = [
  { key: "nudes", labelKey: "color.nudes", lacquer: "#E3C1A5", swatchFrom: "#F0DACA", swatchTo: "#D8AE8E" },
  { key: "reds", labelKey: "color.reds", lacquer: "#B3122A", swatchFrom: "#D8324A", swatchTo: "#8E0A1F" },
  { key: "pinks", labelKey: "color.pinks", lacquer: "#F4A6C6", swatchFrom: "#FBC6DA", swatchTo: "#E87FA9" },
  { key: "purples", labelKey: "color.purples", lacquer: "#7B4FA8", swatchFrom: "#9C6FC9", swatchTo: "#5C3583" },
  { key: "blues", labelKey: "color.blues", lacquer: "#2F5FA8", swatchFrom: "#5081C9", swatchTo: "#1E4380" },
  { key: "greens", labelKey: "color.greens", lacquer: "#2F7D5C", swatchFrom: "#4CA37C", swatchTo: "#1D5B41" },
  { key: "blacks", labelKey: "color.blacks", lacquer: "#1A1A1A", swatchFrom: "#3A3A3A", swatchTo: "#000000" },
  { key: "whites", labelKey: "color.whites", lacquer: "#FAFAFA", swatchFrom: "#FFFFFF", swatchTo: "#E4E4E4" },
  { key: "chrome", labelKey: "color.chrome", lacquer: "#B8C2CC", swatchFrom: "#E6ECF2", swatchTo: "#7E8A96", effect: "chrome" },
  { key: "glitter", labelKey: "color.glitter", lacquer: "#C77DBB", swatchFrom: "#F0A6D8", swatchTo: "#7FC4E8", effect: "glitter" },
];

export const COLOR_BY_KEY = new Map(COLOR_FAMILIES.map((c) => [c.key, c]));

export const DESIGN_KEYS = ["solid", "french", "ombre", "glitter", "art", "other"] as const;
export type DesignKey = (typeof DESIGN_KEYS)[number];

export const DESIGNS: { key: DesignKey; labelKey: MessageKey }[] = [
  { key: "solid", labelKey: "design.solid" },
  { key: "french", labelKey: "design.french" },
  { key: "ombre", labelKey: "design.ombre" },
  { key: "glitter", labelKey: "design.glitter" },
  { key: "art", labelKey: "design.art" },
  { key: "other", labelKey: "design.other" },
];
