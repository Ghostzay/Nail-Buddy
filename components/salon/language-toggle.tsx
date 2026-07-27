"use client";

import { LOCALES, useI18n, useT } from "@/lib/i18n";
import { useHaptic } from "@/components/providers/preferences-provider";
import { cn } from "@/lib/utils";

/**
 * Text only — no flags. A flag is a country, not a language, and picking one
 * for Spanish or English means telling a chunk of your customers their flag
 * wasn't the one you chose.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const t = useT();
  const haptic = useHaptic();

  return (
    <div
      role="radiogroup"
      aria-label={t("a11y.languageSwitch")}
      className={cn(
        "border-hairline-strong bg-surface-raised inline-flex gap-0.5 rounded-pill border p-1",
        className
      )}
    >
      {LOCALES.map((l) => {
        const active = locale === l.value;
        return (
          <button
            key={l.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={l.a11yLabel}
            onClick={() => {
              haptic();
              setLocale(l.value);
            }}
            className={cn(
              "min-w-12 rounded-pill px-3 py-1.5 text-label transition-colors duration-[160ms]",
              "active:scale-[0.97]",
              active
                ? "bg-coral text-on-coral"
                : "text-ink-muted hover:bg-surface-sunken"
            )}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
