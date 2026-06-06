"use client";

import { useEffect, useRef } from "react";
import type { CouponConfig } from "@/lib/types";
import { renderCoupon, type BaseImage } from "@/lib/coupon-renderer";

const MAX_PREVIEW_DIM = 900;

/**
 * Single-coupon preview. Renders the first code through the exact same canvas
 * pipeline used for the PDF, so what you see is what prints. Drag anywhere on
 * the coupon to reposition the number.
 */
export function CouponPreview({
  base,
  code,
  config,
  onPositionChange,
}: {
  base: BaseImage;
  code: string;
  config: CouponConfig;
  onPositionChange?: (posX: number, posY: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    const host = canvasRef.current;
    if (!host) return;

    const rendered = renderCoupon(base, code, config);

    // Downscale to a sensible preview size (the PDF still uses native pixels).
    const aspect = rendered.width / rendered.height;
    let w = rendered.width;
    let h = rendered.height;
    if (Math.max(w, h) > MAX_PREVIEW_DIM) {
      if (aspect >= 1) {
        w = MAX_PREVIEW_DIM;
        h = Math.round(MAX_PREVIEW_DIM / aspect);
      } else {
        h = MAX_PREVIEW_DIM;
        w = Math.round(MAX_PREVIEW_DIM * aspect);
      }
    }

    host.width = w;
    host.height = h;
    const ctx = host.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(rendered, 0, 0, w, h);
  }, [base, code, config]);

  const updateFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!onPositionChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    onPositionChange(Number(x.toFixed(4)), Number(y.toFixed(4)));
  };

  return (
    <canvas
      ref={canvasRef}
      className={`h-auto w-full rounded-md border border-line bg-white shadow-sm ${
        onPositionChange ? "cursor-crosshair touch-none" : ""
      }`}
      aria-label={`Preview of coupon ${code}. Drag to reposition the number.`}
      onPointerDown={(e) => {
        if (!onPositionChange) return;
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromPointer(e);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) updateFromPointer(e);
      }}
      onPointerUp={(e) => {
        draggingRef.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
    />
  );
}
