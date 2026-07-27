import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-hairline-strong bg-surface-raised text-ink placeholder:text-ink-muted/70",
        "flex field-sizing-content min-h-32 w-full rounded-control border-2 px-4 py-3",
        "text-body-lg leading-[1.75rem] shadow-sm transition-[border-color,box-shadow] duration-[160ms]",
        "outline-none resize-none",
        "focus-visible:border-coral-strong focus-visible:shadow-glow",
        "disabled:pointer-events-none disabled:opacity-45",
        "aria-invalid:border-danger-strong aria-invalid:focus-visible:shadow-none",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
