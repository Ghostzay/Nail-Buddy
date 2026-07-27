"use client";

import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { usePreferences } from "@/components/providers/preferences-provider";

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = usePreferences();

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--surface-raised)",
          "--normal-text": "var(--ink)",
          "--normal-border": "var(--hairline)",
          "--border-radius": "var(--radius-control)",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
