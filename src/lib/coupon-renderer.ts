import type { CouponConfig } from "./types";

/**
 * Canvas renderer for a single coupon: the uploaded image at its native
 * resolution with the coupon number drawn on top.
 *
 * Derived from the notebook's `add_coupon_code_to_image`, but the number's
 * size, position, and rotation are user-controlled rather than hard-coded.
 * With the defaults (fontScale 0.08, posX 0.5, posY 0.9, rotation 0) the result
 * matches the notebook's bold, black, bottom-center label. The source image is
 * kept at full resolution — there is no upscaling or quality reduction.
 */

/** The source image drawn once at native size and reused for every coupon. */
export interface BaseImage {
  /** Offscreen canvas holding the source image at native resolution. */
  canvas: HTMLCanvasElement;
  /** Native image dimensions in pixels (also used for page layout). */
  naturalWidth: number;
  naturalHeight: number;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(width));
  c.height = Math.max(1, Math.round(height));
  return c;
}

/** Draw and cache the source image at native resolution. */
export function prepareBaseImage(img: HTMLImageElement): BaseImage {
  const naturalWidth = img.naturalWidth || img.width || 1;
  const naturalHeight = img.naturalHeight || img.height || 1;

  const canvas = createCanvas(naturalWidth, naturalHeight);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

  return { canvas, naturalWidth, naturalHeight };
}

/**
 * Draw the coupon number onto a context sized to the image. The number is
 * centered at (posX, posY) — fractions of the image — sized as a fraction of
 * the smaller side, and rotated about its center.
 */
function drawCode(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  code: string,
  config: CouponConfig,
): void {
  const font = (px: number) => `bold ${px}px Arial, "Helvetica Neue", Helvetica, sans-serif`;

  // Size from the smaller side, then shrink to fit the width so a large,
  // centered number can never overflow off the coupon and become "invisible".
  let fontSize = Math.max(8, Math.round(Math.min(width, height) * config.fontScale));
  ctx.save();
  ctx.font = font(fontSize);
  const maxWidth = width * 0.94;
  const measured = ctx.measureText(code).width;
  if (measured > maxWidth && measured > 0) {
    fontSize = Math.max(8, Math.floor((fontSize * maxWidth) / measured));
  }

  ctx.font = font(fontSize);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgb(0, 0, 0)";

  const cx = config.posX * width;
  const cy = config.posY * height;

  ctx.translate(cx, cy);
  ctx.rotate((config.rotation * Math.PI) / 180);
  ctx.fillText(code, 0, 0);
  ctx.restore();
}

/**
 * Render a single coupon (image + number) to a fresh canvas at the image's
 * native resolution, composited on white. This is the exact raster used both
 * for the live preview and (encoded) for the PDF.
 */
export function renderCoupon(
  base: BaseImage,
  code: string,
  config: CouponConfig,
): HTMLCanvasElement {
  const out = createCanvas(base.naturalWidth, base.naturalHeight);
  drawCouponInto(out, base, code, config);
  return out;
}

/** Render into a caller-provided canvas, so a batch can reuse one canvas. */
export function drawCouponInto(
  out: HTMLCanvasElement,
  base: BaseImage,
  code: string,
  config: CouponConfig,
): void {
  out.width = base.naturalWidth;
  out.height = base.naturalHeight;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(base.canvas, 0, 0);
  drawCode(ctx, out.width, out.height, code, config);
}
