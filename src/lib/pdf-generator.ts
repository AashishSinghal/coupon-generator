import { PDFDocument } from "pdf-lib";
import type { CouponConfig } from "./types";
import { computeLayout, cellPosition, indexToCell } from "./layout";
import { prepareBaseImage, drawCouponInto, type BaseImage } from "./coupon-renderer";
import { formatPattern } from "@/utils/formatNumber";

export interface GenerateOptions {
  /** 0..1 progress callback, fired periodically. */
  onProgress?: (fraction: number, done: number, total: number) => void;
  /** Optional pre-built base image (lets the UI share work with previews). */
  baseImage?: BaseImage;
  /** Abort signal to cancel a long-running job. */
  signal?: AbortSignal;
  /** MIME type of the uploaded image, used to pick a lossless vs JPEG encoder. */
  sourceMime?: string;
}

/** PNG sources (graphics/transparency) embed losslessly; everything else JPEG. */
const JPEG_QUALITY = 0.95;

/**
 * Generate the full coupon book as a PDF Blob, entirely in the browser.
 *
 * Reproduces the notebook's generation loop — row-major placement, one coupon
 * per number from start..end, a new page every rows*cols coupons — while
 * keeping each coupon at the uploaded image's native resolution (no quality
 * reduction). PNG/WEBP uploads embed as lossless PNG; JPEG uploads embed as
 * high-quality JPEG.
 */
export async function generatePdf(
  img: HTMLImageElement,
  config: CouponConfig,
  options: GenerateOptions = {},
): Promise<Blob> {
  const base = options.baseImage ?? prepareBaseImage(img);
  const layout = computeLayout(config, base.naturalWidth, base.naturalHeight);

  if (layout.totalCoupons <= 0) {
    throw new Error("Nothing to generate — the number range is empty.");
  }

  const pdf = await PDFDocument.create();
  const useJpeg = options.sourceMime === "image/jpeg" || options.sourceMime === "image/jpg";

  // One reusable scratch canvas for the whole batch.
  const out = document.createElement("canvas");

  let page = pdf.addPage([layout.pageWidth, layout.pageHeight]);
  let index = 0;

  for (let n = config.startNumber; n <= config.endNumber; n++) {
    if (options.signal?.aborted) {
      throw new DOMException("PDF generation cancelled", "AbortError");
    }

    const indexInPage = index % layout.couponsPerPage;
    if (index > 0 && indexInPage === 0) {
      page = pdf.addPage([layout.pageWidth, layout.pageHeight]);
    }

    const { row, col } = indexToCell(indexInPage, config.cols);
    const code = formatPattern(config.pattern, n);

    drawCouponInto(out, base, code, config);
    const embedded = useJpeg
      ? await pdf.embedJpg(out.toDataURL("image/jpeg", JPEG_QUALITY))
      : await pdf.embedPng(out.toDataURL("image/png"));

    const { x, y } = cellPosition(layout, row, col);
    page.drawImage(embedded, {
      x,
      y,
      width: layout.couponWidth,
      height: layout.couponHeight,
    });

    index++;

    // Report progress and yield to the event loop so the UI stays responsive.
    if (index % 10 === 0 || index === layout.totalCoupons) {
      options.onProgress?.(index / layout.totalCoupons, index, layout.totalCoupons);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  }

  const bytes = await pdf.save();
  // Copy into a standalone ArrayBuffer for a clean Blob across TS lib targets.
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return new Blob([buffer], { type: "application/pdf" });
}
