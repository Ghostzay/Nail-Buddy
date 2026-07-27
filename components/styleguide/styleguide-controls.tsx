"use client";

import { Contrast, Moon, Sun, Type, Vibrate } from "lucide-react";

import { usePreferences } from "@/components/providers/preferences-provider";
import { Button } from "@/components/ui/button";

export function StyleguideControls() {
  const {
    theme,
    setTheme,
    textScale,
    setTextScale,
    haptics,
    setHaptics,
    resolvedTheme,
  } = usePreferences();

  return (
    <div className="border-hairline bg-surface-raised sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b px-4 py-3 backdrop-blur sm:px-6">
      <span className="text-label text-ink-muted mr-auto">
        Nail Buddy · Styleguide
      </span>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={theme === "light" ? "primary" : "ghost"}
          onClick={() => setTheme("light")}
          aria-pressed={theme === "light"}
        >
          <Sun className="size-4" /> Light
        </Button>
        <Button
          size="sm"
          variant={theme === "dark" ? "primary" : "ghost"}
          onClick={() => setTheme("dark")}
          aria-pressed={theme === "dark"}
        >
          <Moon className="size-4" /> Dark
        </Button>
        <Button
          size="sm"
          variant={theme === "system" ? "primary" : "ghost"}
          onClick={() => setTheme("system")}
          aria-pressed={theme === "system"}
        >
          <Contrast className="size-4" /> System
        </Button>
      </div>

      <Button
        size="sm"
        variant={textScale === "lg" ? "primary" : "outline"}
        onClick={() => setTextScale(textScale === "lg" ? "base" : "lg")}
        aria-pressed={textScale === "lg"}
      >
        <Type className="size-4" /> Larger text {textScale === "lg" ? "112%" : "100%"}
      </Button>

      <Button
        size="sm"
        variant={haptics ? "primary" : "outline"}
        onClick={() => setHaptics(!haptics)}
        aria-pressed={haptics}
      >
        <Vibrate className="size-4" /> Haptics {haptics ? "on" : "off"}
      </Button>

      <span className="text-caption text-ink-muted">
        resolved: <strong className="text-ink">{resolvedTheme}</strong>
      </span>
    </div>
  );
}
