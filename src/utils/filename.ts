import type { CouponConfig } from "@/lib/types";
import { firstCode, lastCode, totalCoupons } from "@/lib/number-generator";

/** Keep only filename-safe characters; trim and bound the length. */
function safe(part: string): string {
  return part
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Build a descriptive, filesystem-safe download name encoding the generation:
 *
 *   coupons_<firstCode>-<lastCode>_<count>_<rows>x<cols>_<YYYY-MM-DD>.pdf
 *   e.g. coupons_A0001-A0100_100_3x2_2026-06-07.pdf
 *
 * A single-coupon job collapses the range to one code. Falls back gracefully if
 * the range is empty.
 */
export function buildPdfFilename(config: CouponConfig): string {
  const count = totalCoupons(config);
  const first = firstCode(config);
  const last = lastCode(config);

  const range =
    first && last ? (first === last ? safe(first) : `${safe(first)}-${safe(last)}`) : "book";

  const date = new Date().toISOString().slice(0, 10);

  return `coupons_${range}_${count}_${config.rows}x${config.cols}_${date}.pdf`;
}
