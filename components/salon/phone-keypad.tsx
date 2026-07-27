"use client";

import { useCallback, useEffect } from "react";
import { Delete, Loader2 } from "lucide-react";

import { useHaptic } from "@/components/providers/preferences-provider";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

/** (770) 555-0142 as you type. */
export function formatPhone(digits: string) {
  const d = digits.slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * On-screen numeric pad. Deliberately NOT an <input type="tel"> — the OS
 * keyboard eats half a tablet screen and shoves the layout around every time
 * it opens, which is the single most common way a kiosk feels broken.
 *
 * Real <button>s with labels, and a hardware-keyboard path too, so this is
 * operable without touch.
 */
export function PhoneKeypad({
  value,
  onChange,
  onComplete,
  loading = false,
  error,
  className,
}: {
  /** Digits only, no formatting. */
  value: string;
  onChange: (digits: string) => void;
  /** Fires automatically on the 10th digit — no submit button needed. */
  onComplete?: (digits: string) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
}) {
  const t = useT();
  const haptic = useHaptic();

  const push = useCallback(
    (k: string) => {
      if (loading) return;
      haptic();
      if (k === "back") {
        onChange(value.slice(0, -1));
        return;
      }
      if (value.length >= 10) return;
      const next = value + k;
      onChange(next);
      if (next.length === 10) onComplete?.(next);
    },
    [value, loading, onChange, onComplete, haptic]
  );

  // A physical keyboard should work too — kiosks get plugged into odd things,
  // and it makes the component testable without synthesising taps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) push(e.key);
      else if (e.key === "Backspace") push("back");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [push]);

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div className="flex flex-col items-center gap-2">
        <output
          className={cn(
            "text-h1 font-display tabular-nums",
            error ? "text-danger-strong" : "text-ink"
          )}
          data-numeric
          aria-live="polite"
        >
          {formatPhone(value) || "(•••) •••-••••"}
        </output>

        {loading && (
          <span className="text-body text-ink-muted inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            {t("phone.lookingUp")}
          </span>
        )}
        {error && !loading && (
          <span role="alert" className="text-body text-danger-strong">
            {error}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={`spacer-${i}`} aria-hidden />
          ) : (
            <button
              key={k}
              type="button"
              onClick={() => push(k)}
              disabled={loading}
              aria-label={k === "back" ? t("phone.backspace") : t("phone.digit", { n: k })}
              className={cn(
                // 72px keys per §7
                "size-[72px] rounded-control text-h2 font-semibold",
                "border-hairline-strong bg-surface-raised text-ink border-2 shadow-sm",
                "transition-[background-color,border-color] duration-[100ms]",
                "hover:border-coral-strong/60 active:scale-[0.97]",
                "disabled:pointer-events-none disabled:opacity-45",
                k === "back" && "text-ink-muted"
              )}
            >
              {k === "back" ? (
                <Delete className="mx-auto size-6" aria-hidden />
              ) : (
                k
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}
