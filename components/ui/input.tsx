import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 56px — kiosk minimum touch target (§4)
        "border-hairline-strong bg-surface-raised text-ink placeholder:text-ink-muted/70",
        "flex h-14 w-full min-w-0 rounded-control border-2 px-4",
        "text-body-lg shadow-sm transition-[border-color,box-shadow] duration-[160ms]",
        "outline-none hover:border-hairline-strong",
        "focus-visible:border-coral-strong focus-visible:shadow-glow",
        "disabled:pointer-events-none disabled:opacity-45",
        "aria-invalid:border-danger-strong aria-invalid:focus-visible:shadow-none",
        "file:text-ink file:inline-flex file:border-0 file:bg-transparent file:text-body file:font-semibold",
        className
      )}
      {...props}
    />
  );
}

export { Input };
