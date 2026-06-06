"use client";

import { useEffect, useRef } from "react";
import type { CouponConfig } from "@/lib/types";
import { type BaseImage, renderCoupon } from "@/lib/coupon-renderer";
import { computeLayout, cellPosition, indexToCell, type PageLayout } from "@/lib/layout";
import { formatPattern } from "@/utils/formatNumber";

/** Cap live-rendered cells so an extreme grid can't lock the preview. */
const MAX_RENDERED_CELLS = 120;

/**
 * Page-1 preview rendered at A4 proportions. Coupons are placed with the exact
 * notebook geometry (margins, gutters, row-major order, bottom-left origin),
 * so the on-screen page matches the PDF's first page.
 */
export function PagePreview({
  base,
  config,
}: {
  base: BaseImage;
  config: CouponConfig;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = canvasRef.current;
    if (!host) return;

    const layout = computeLayout(config, base.naturalWidth, base.naturalHeight);
    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    const cssWidth = 560;
    const scale = (cssWidth / layout.pageWidth) * dpr;

    host.width = Math.round(layout.pageWidth * scale);
    host.height = Math.round(layout.pageHeight * scale);
    host.style.width = "100%";
    host.style.height = "auto";

    const ctx = host.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, host.width, host.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const onPage = Math.min(layout.couponsPerPage, layout.totalCoupons);
    const renderCount = Math.min(onPage, MAX_RENDERED_CELLS);

    const cellPx = {
      w: Math.max(1, Math.round(layout.couponWidth * scale)),
      h: Math.max(1, Math.round(layout.couponHeight * scale)),
    };

    for (let i = 0; i < onPage; i++) {
      const { row, col } = indexToCell(i, config.cols);
      const { x, y } = cellPosition(layout, row, col);
      // Convert bottom-left points to top-left canvas pixels.
      const px = x * scale;
      const py = (layout.pageHeight - y - layout.couponHeight) * scale;

      if (i < renderCount) {
        const code = formatPattern(config.pattern, config.startNumber + i);
        const coupon = renderCoupon(base, code, config);
        ctx.drawImage(coupon, px, py, cellPx.w, cellPx.h);
      } else {
        // Beyond the render cap: outline only, so counts still read correctly.
        ctx.strokeStyle = "#cfc5b0";
        ctx.strokeRect(px, py, cellPx.w, cellPx.h);
      }
    }
    drawCropMarks(ctx, layout, scale);
  }, [base, config]);

  return (
    <canvas
      ref={canvasRef}
      className="block w-full rounded-md border border-line shadow-sm"
      aria-label="Preview of the first PDF page"
    />
  );
}

/** Faint corner ticks to read the page edge against a white canvas. */
function drawCropMarks(ctx: CanvasRenderingContext2D, layout: PageLayout, scale: number) {
  const w = layout.pageWidth * scale;
  const h = layout.pageHeight * scale;
  const t = 10 * (scale / (scale || 1)) + 6;
  ctx.strokeStyle = "#e2dac9";
  ctx.lineWidth = 1;
  const corners: [number, number][] = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.moveTo(Math.min(cx, w - 1), Math.min(cy, h - 1));
    ctx.lineTo(cx === 0 ? t : w - t, Math.min(cy, h - 1));
    ctx.moveTo(Math.min(cx, w - 1), Math.min(cy, h - 1));
    ctx.lineTo(Math.min(cx, w - 1), cy === 0 ? t : h - t);
    ctx.stroke();
  }
}
