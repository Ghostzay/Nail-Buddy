"use client";

import { cn } from "@/lib/utils";

interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  swatchClassName?: string;
}

interface BigChoiceGridProps<T extends string> {
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: 2 | 3;
}

export function BigChoiceGrid<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
}: BigChoiceGridProps<T>) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        columns === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-center text-lg font-semibold shadow-sm transition-all active:scale-[0.97] sm:min-h-32 sm:text-xl",
              selected
                ? "border-primary bg-primary/10 text-primary shadow-md"
                : "border-border bg-card text-foreground hover:border-primary/50"
            )}
          >
            {option.swatchClassName && (
              <span
                className={cn(
                  "size-7 rounded-full border sm:size-9",
                  option.swatchClassName
                )}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
