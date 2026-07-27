import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-sans font-semibold",
    "rounded-control",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-[160ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
    // Press feedback on every tappable thing (§4). CSS, not a motion component.
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /* Coral fill with a PLUM label. White-on-coral is 3.21:1 and fails;
           ink-on-coral is 5.08:1. See globals.css. */
        primary: "bg-coral text-on-coral shadow-sm hover:brightness-[0.96]",
        /* Deep plum band — white label, 13.60:1. */
        plum: "bg-plum text-on-plum shadow-sm hover:brightness-110",
        secondary:
          "bg-surface-sunken text-ink hover:bg-surface-sunken/70 shadow-sm",
        outline:
          "border-2 border-hairline-strong bg-surface-raised text-ink hover:border-coral-strong hover:bg-surface-sunken/40",
        ghost: "text-ink hover:bg-surface-sunken/60",
        /* Fill with -strong so the label clears 4.5:1 (4.81:1 / 4.79:1).
           The label token flips with the theme — on dark the -strong values
           lift to pale tints and a white label would collapse to ~2:1. */
        danger:
          "bg-danger-strong text-on-danger-strong shadow-sm hover:brightness-110",
        success:
          "bg-success-strong text-on-success-strong shadow-sm hover:brightness-110",
        link: "text-coral-strong underline-offset-4 hover:underline",
      },
      size: {
        /* /tech + /manager — 48px minimum touch target */
        sm: "h-12 px-4 text-body gap-1.5",
        md: "h-12 px-5 text-body",
        /* /request — 56px minimum */
        lg: "h-14 px-6 text-body-lg",
        /* Primary kiosk actions — thumb zone */
        xl: "h-16 px-8 text-body-lg rounded-card",
        icon: "size-12",
        "icon-lg": "size-14",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner and blocks interaction. Keeps width stable. */
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  // asChild forwards to a single child element, so the spinner wrapper would
  // break Slot's single-child contract. Loading is a plain-button feature.
  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, block, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <button
      data-slot="button"
      data-loading={loading || undefined}
      className={cn(buttonVariants({ variant, size, block, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* Spinner sits alongside the label, not over it — the caller swaps the
          label to a present-tense outcome ("Sending…"), and hiding that would
          leave a bare spinner with no statement of what is happening. */}
      {loading && (
        <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
      )}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
