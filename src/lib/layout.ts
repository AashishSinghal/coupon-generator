import type { CouponConfig } from "./types";

/**
 * Page geometry, reproduced exactly from the notebook.
 *
 * The notebook uses reportlab's `A4` page size and a points-based coordinate
 * system whose origin is the bottom-left corner. pdf-lib uses the same
 * bottom-left origin, so the placement math transfers directly with no Y flip.
 *
 *     page_width, page_height = A4
 *     margin = 2
 *     gutter = 1
 */

/** reportlab's A4 in points (1 inch = 72 pt). */
export const A4 = {
  width: 595.2755905511812,
  height: 841.8897637795276,
} as const;

export const MARGIN = 2;
export const GUTTER = 1;

export interface PageLayout {
  pageWidth: number;
  pageHeight: number;
  /** Final per-coupon box in points, after aspect/size fitting. */
  couponWidth: number;
  couponHeight: number;
  couponsPerPage: number;
  totalCoupons: number;
  totalPages: number;
}

/**
 * Compute the per-coupon box and page counts for a config + source image.
 *
 * Mirrors the notebook's sizing block, including the subtle detail that after
 * aspect-ratio fitting the *placement* gutter math reuses the shrunken coupon
 * dimensions, so coupons pack from the top-left margin rather than filling the
 * page symmetrically.
 */
export function computeLayout(
  config: CouponConfig,
  imageWidth: number,
  imageHeight: number,
): PageLayout {
  const { width: pageWidth, height: pageHeight } = A4;
  const { rows, cols } = config;

  const availableWidth = pageWidth - 2 * MARGIN;
  const availableHeight = pageHeight - 2 * MARGIN;

  const totalGutterWidth = cols > 1 ? GUTTER * (cols - 1) : 0;
  const totalGutterHeight = rows > 1 ? GUTTER * (rows - 1) : 0;

  let couponWidth = (availableWidth - totalGutterWidth) / cols;
  let couponHeight = (availableHeight - totalGutterHeight) / rows;

  // Maintain the source aspect ratio inside the cell.
  const aspectRatio = imageWidth / imageHeight;
  if (couponWidth / couponHeight > aspectRatio) {
    couponWidth = couponHeight * aspectRatio;
  } else {
    couponHeight = couponWidth / aspectRatio;
  }

  const couponsPerPage = rows * cols;
  const totalCoupons = Math.max(0, config.endNumber - config.startNumber + 1);
  const totalPages = couponsPerPage > 0 ? Math.ceil(totalCoupons / couponsPerPage) : 0;

  return {
    pageWidth,
    pageHeight,
    couponWidth,
    couponHeight,
    couponsPerPage,
    totalCoupons,
    totalPages,
  };
}

/**
 * Bottom-left position (in points) of a coupon at a given row/col on a page.
 *
 *     x = margin + col * (coupon_width + gutter)
 *     y = page_height - margin - (row + 1) * coupon_height - row * gutter
 */
export function cellPosition(
  layout: PageLayout,
  row: number,
  col: number,
): { x: number; y: number } {
  const x = MARGIN + col * (layout.couponWidth + GUTTER);
  const y =
    layout.pageHeight - MARGIN - (row + 1) * layout.couponHeight - row * GUTTER;
  return { x, y };
}

/** Convert a flat coupon index into its row/col within a page. */
export function indexToCell(indexInPage: number, cols: number): { row: number; col: number } {
  return { row: Math.floor(indexInPage / cols), col: indexInPage % cols };
}
