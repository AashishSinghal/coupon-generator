import * as React from "react";
import { cn } from "@/lib/utils";

/** Small uppercase mono label, the tool's signature for control captions. */
export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "block font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft",
        className,
      )}
      {...props}
    />
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <input
    ref={ref}
    aria-invalid={invalid || undefined}
    className={cn(
      "h-11 w-full rounded-md border bg-card px-3 font-mono text-sm text-ink transition-colors",
      "placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-ink/70",
      invalid ? "border-stamp focus:ring-stamp/60" : "border-line-strong hover:border-ink/40",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

/** Label + control + optional error/hint, the unit the settings panel repeats. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string | null;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="font-mono text-[11px] leading-snug text-stamp">{error}</p>
      ) : hint ? (
        <p className="font-mono text-[11px] leading-snug text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}
