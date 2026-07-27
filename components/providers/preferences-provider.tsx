"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";
export type TextScale = "base" | "lg";

export interface Preferences {
  theme: Theme;
  textScale: TextScale;
  /** navigator.vibrate on selection taps. Default on per §4. */
  haptics: boolean;
}

const DEFAULTS: Preferences = {
  theme: "light",
  textScale: "base",
  haptics: true,
};

const STORAGE_KEY = "nb-prefs";

interface PreferencesContextValue extends Preferences {
  setTheme: (t: Theme) => void;
  setTextScale: (s: TextScale) => void;
  setHaptics: (h: boolean) => void;
  /** Resolved light/dark after applying `system`. */
  resolvedTheme: "light" | "dark";
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/** Runs before paint to stop a light-mode flash on a dark-preferring device. */
export const themeInitScript = `
(function(){try{
  var p=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}");
  var t=p.theme||"light";
  var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark",d);
  document.documentElement.dataset.textScale=p.textScale||"base";
}catch(e){}})();
`.trim();

function read(): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [systemDark, setSystemDark] = useState(false);

  // Hydrate from storage after mount so SSR markup stays stable; the inline
  // script above has already applied the visual state, so there's no flash.
  useEffect(() => setPrefs(read()), []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const resolvedTheme: "light" | "dark" =
    prefs.theme === "system" ? (systemDark ? "dark" : "light") : prefs.theme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.dataset.textScale = prefs.textScale;
  }, [prefs.textScale]);

  const persist = useCallback((next: Preferences) => {
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode / storage disabled — preferences just won't survive reload.
    }
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...prefs,
      resolvedTheme,
      setTheme: (theme) => persist({ ...prefs, theme }),
      setTextScale: (textScale) => persist({ ...prefs, textScale }),
      setHaptics: (haptics) => persist({ ...prefs, haptics }),
    }),
    [prefs, resolvedTheme, persist]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within <PreferencesProvider>");
  }
  return ctx;
}

/**
 * Selection-tap haptic. No-ops everywhere except Android tablets, which is
 * exactly the target device. Gated on the user preference.
 */
export function useHaptic() {
  const { haptics } = usePreferences();
  return useCallback(() => {
    if (!haptics) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
  }, [haptics]);
}
