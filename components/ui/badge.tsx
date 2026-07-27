import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Tinted background + `-strong` text. The vivid accents fail as text on light
 * surfaces (lavender is 2.21:1 on cream), so the text always comes from the
 * `-strong` triad member and the vivid one is only ever a low-alpha wash.
 *
 * Badges carry meaning, so callers must supply an icon or text alongside —
 * never color alone (§11).
 */
const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center justify-center gap-1.5",
    "rounded-pill px-3 py-1",
    "text-label uppercase",
    "[&>svg]:size-3.5 [&>svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        neutral: "bg-surface-sunken text-ink-muted",
        coral: "bg-coral/14 text-coral-strong",
        plum: "bg-plum/12 text-plum-strong",
        lavender: "bg-lavender/20 text-lavender-strong",
        rosegold: "bg-rosegold/22 text-rosegold-strong",
        success: "bg-success/16 text-success-strong",
        warning: "bg-warning/18 text-warning-strong",
        danger: "bg-danger/14 text-danger-strong",
        /* Solid fills for high-emphasis status */
        "solid-coral": "bg-coral text-on-coral",
        "solid-plum": "bg-plum text-on-plum",
        outline: "border border-hairline-strong text-ink",
      },
      size: {
        sm: "px-2 py-0.5 text-caption normal-case tracking-normal",
        md: "",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  }
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
