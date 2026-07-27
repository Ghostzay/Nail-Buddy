"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { en, es, vi, type Messages } from "./messages";

export type Locale = "en" | "vi" | "es";

export const LOCALES: { value: Locale; label: string; a11yLabel: string }[] = [
  // Text, never flags — a flag is a country, not a language (§7).
  { value: "en", label: "EN", a11yLabel: "English" },
  { value: "vi", label: "VI", a11yLabel: "Tiếng Việt" },
  { value: "es", label: "ES", a11yLabel: "Español" },
];

const CATALOGUES = { en, vi, es } as const;

/**
 * Dot-paths into the message tree, e.g. "shape.question". Derived from `en`,
 * so a typo is a type error and renaming a key surfaces every call site.
 */
type Leaves<T> = T extends string
  ? ""
  : {
      [K in Extract<keyof T, string>]: Leaves<T[K]> extends infer R
        ? R extends ""
          ? K
          : `${K}.${R & string}`
        : never;
    }[Extract<keyof T, string>];

export type MessageKey = Leaves<Messages>;

type Vars = Record<string, string | number>;

function lookup(obj: unknown, path: string): string | undefined {
  const out = path
    .split(".")
    .reduce<unknown>(
      (acc, k) =>
        acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined,
      obj
    );
  return typeof out === "string" ? out : undefined;
}

/** Replaces {name} placeholders. Unmatched placeholders are left visible on
 *  purpose — a stray "{n}" in the UI is a bug you want to see, not swallow. */
function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, key) =>
    key in vars ? String(vars[key]) : whole
  );
}

export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  const hit = lookup(CATALOGUES[locale], key) ?? lookup(en, key);
  // Falling back to the key itself makes a missing string obvious in-place
  // rather than rendering an empty element.
  return interpolate(hit ?? key, vars);
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "nb-locale";

export function I18nProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && saved in CATALOGUES) setLocaleState(saved);
    } catch {
      /* storage disabled — English it is */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* non-fatal */
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}

/** Convenience for components that only need the translator. */
export function useT() {
  return useI18n().t;
}
