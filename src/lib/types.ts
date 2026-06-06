/**
 * Shared configuration for the coupon generator.
 *
 * Layout and numbering map directly to the reference notebook
 * (docs/Logo_coupon_printable.ipynb). The number-overlay controls
 * (size/position/rotation) are a deliberate product extension: the notebook
 * hard-codes a bottom-center label, so the DEFAULTS below reproduce that look
 * while letting the user move, resize, and rotate the number. The source image
 * is kept at its uploaded resolution/quality — there are no quality knobs.
 * See docs/NOTEBOOK_ANALYSIS.md.
 */
export interface CouponConfig {
  /** Python-style format pattern, e.g. "A{number:04d}". */
  pattern: string;
  /** First number in the sequence (inclusive). */
  startNumber: number;
  /** Last number in the sequence (inclusive). */
  endNumber: number;
  /** Coupons per page, vertically. */
  rows: number;
  /** Coupons per page, horizontally. */
  cols: number;

  /** Number height as a fraction of the image's smaller side (notebook: 0.08). */
  fontScale: number;
  /** Horizontal center of the number, 0..1 across the image width. */
  posX: number;
  /** Vertical center of the number, 0..1 down the image height. */
  posY: number;
  /** Rotation of the number, in degrees. */
  rotation: number;
}

/**
 * Defaults: layout/numbering mirror the notebook's `generate_coupon_pdf`
 * signature; the overlay defaults (≈8% height, bottom-center, no rotation)
 * reproduce the notebook's hard-coded label placement.
 *
 * The one layout exception is `endNumber`: the function default is 9999, but the
 * notebook's interactive `main()`/`quick_demo_hq()` use 100, so we default to
 * 100 for a small, fast first job.
 */
export const DEFAULT_CONFIG: CouponConfig = {
  pattern: "A{number:04d}",
  startNumber: 1,
  endNumber: 100,
  rows: 3,
  cols: 2,
  fontScale: 0.5,
  posX: 0.5,
  posY: 0.5,
  rotation: 0,
};

export const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

/** Hard cap on coupons per job, per the spec's 100–5000 performance target. */
export const MAX_COUPONS = 5000;
