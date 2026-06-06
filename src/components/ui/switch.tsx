import * as React from "react";
import { cn } from "@/lib/utils";

/** Accessible toggle built on a native checkbox for keyboard/label support. */
export function Switch({
  checked,
  onCheckedChange,
  id,
  label,
  description,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
  label: string;
  description?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4"
    >
      <span className="space-y-0.5">
        <span className="block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft">
          {label}
        </span>
        {description ? (
          <span className="block font-mono text-[11px] leading-snug text-ink-faint">
            {description}
          </span>
        ) : null}
      </span>
      <span className="relative shrink-0 pt-0.5">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "block h-6 w-11 rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper",
            checked ? "border-ink bg-ink" : "border-line-strong bg-paper-deep",
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute top-1 left-1 h-4 w-4 rounded-full bg-card shadow-sm transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
    </label>
  );
}
