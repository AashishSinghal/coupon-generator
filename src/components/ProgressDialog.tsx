"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Blocking progress overlay shown during PDF generation. Reports the running
 * percentage and coupon count, and offers cancellation for large jobs.
 */
export function ProgressDialog({
  open,
  progress,
  done,
  total,
  onCancel,
}: {
  open: boolean;
  progress: number;
  done: number;
  total: number;
  onCancel: () => void;
}) {
  if (!open) return null;
  const pct = Math.round(progress * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Generating PDF"
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm rounded-xl border border-line bg-card p-6 shadow-xl">
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-stamp" />
          <h2 className="font-display text-base font-bold text-ink">Generating PDF…</h2>
        </div>

        <p className="mt-1 font-mono text-[11px] text-ink-soft">
          {done.toLocaleString()} / {total.toLocaleString()} coupons · rendered in your browser
        </p>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-paper-deep">
          <div
            className="h-full rounded-full bg-stamp transition-[width] duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-2xl font-bold tabular-nums text-ink">{pct}%</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
