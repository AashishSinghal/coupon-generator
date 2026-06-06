import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(27,25,22,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

/** A section heading with a small index marker, used to title panels. */
export function SectionHeading({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-display text-sm font-bold tracking-tight text-ink">
        <span className="grid h-5 w-5 place-items-center rounded-[5px] bg-ink font-mono text-[10px] font-bold text-paper">
          {index}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}
