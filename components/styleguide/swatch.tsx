"use client";

import { useEffect, useRef, useState } from "react";

import { usePreferences } from "@/components/providers/preferences-provider";
import { cn } from "@/lib/utils";

/**
 * Resolves any CSS color (including oklch) to sRGB by painting it to a 1x1
 * canvas and reading the pixel back. More reliable than parsing
 * getComputedStyle, which returns oklch() verbatim in current browsers.
 */
function resolveToRgb(cssColor: string): [number, number, number] | null {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

const linearize = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

function luminance(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number | null {
  const ra = resolveToRgb(a);
  const rb = resolveToRgb(b);
  if (!ra || !rb) return null;
  const [l1, l2] = [luminance(ra), luminance(rb)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function readVar(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

function toHex(rgb: [number, number, number]) {
  return (
    "#" +
    rgb
      .map((c) => Math.round(c * 255).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

interface SwatchProps {
  /** CSS custom property name, e.g. "--accent-coral" */
  token: string;
  label: string;
  /** Token to measure contrast against. Defaults to --surface-base. */
  against?: string;
  /** What the ratio needs to clear: 4.5 for text, 3 for UI/large. */
  target?: 4.5 | 3;
  /** Foreground token to render the label in, when this swatch is a fill. */
  fg?: string;
  note?: string;
}

export function Swatch({
  token,
  label,
  against = "--surface-base",
  target = 4.5,
  fg,
  note,
}: SwatchProps) {
  const { resolvedTheme, textScale } = usePreferences();
  const [ratio, setRatio] = useState<number | null>(null);
  const [hex, setHex] = useState<string>("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Measure AFTER the next paint. PreferencesProvider toggles the `.dark`
    // class in its own effect, and React runs child effects before parent
    // ones — so reading synchronously here would sample the outgoing theme's
    // variables. Two rAFs guarantee the class is applied and styles recalced.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const fgToken = fg ?? against;
        const raw = readVar(token);
        setRatio(contrast(raw, readVar(fgToken)));
        const rgb = resolveToRgb(raw);
        setHex(rgb ? toHex(rgb) : "");
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [token, against, fg, resolvedTheme, textScale]);

  const pass = ratio !== null && ratio >= target;

  return (
    <div
      ref={ref}
      className="border-hairline flex flex-col overflow-hidden rounded-media border"
    >
      <div
        className="flex h-20 items-center justify-center px-3"
        style={{
          background: `var(${token})`,
          color: fg ? `var(${fg})` : undefined,
        }}
      >
        {fg && <span className="text-label">Aa · Ăằ</span>}
      </div>
      <div className="bg-surface-raised flex flex-col gap-0.5 px-3 py-2">
        <code className="text-caption text-ink font-mono">{token}</code>
        <span className="text-caption text-ink-muted">{label}</span>
        <div className="flex items-center gap-2 pt-1">
          <span className="text-caption text-ink-muted font-mono" data-numeric>
            {hex}
          </span>
          {ratio !== null && (
            <span
              className={cn(
                "text-caption rounded-pill px-1.5 font-mono font-semibold",
                pass
                  ? "bg-success/16 text-success-strong"
                  : "bg-danger/14 text-danger-strong"
              )}
              data-numeric
            >
              {ratio.toFixed(2)}:1 {pass ? "PASS" : "FAIL"}
            </span>
          )}
        </div>
        {note && <span className="text-caption text-ink-muted pt-1">{note}</span>}
      </div>
    </div>
  );
}
