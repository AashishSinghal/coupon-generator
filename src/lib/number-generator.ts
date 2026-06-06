import { formatPattern } from "@/utils/formatNumber";
import type { CouponConfig } from "./types";

/**
 * Sequential coupon numbering, matching the notebook:
 *     all_numbers = list(range(start_number, end_number + 1))
 *
 * Numbers are generated in order (not random) from start to end inclusive.
 */
export function* couponCodes(config: CouponConfig): Generator<{ index: number; number: number; code: string }> {
  let index = 0;
  for (let n = config.startNumber; n <= config.endNumber; n++) {
    yield { index, number: n, code: formatPattern(config.pattern, n) };
    index++;
  }
}

/** Total number of coupons for a config (end − start + 1, clamped at 0). */
export function totalCoupons(config: CouponConfig): number {
  return Math.max(0, config.endNumber - config.startNumber + 1);
}

/** The first coupon code, used for previews. Returns null if range is empty. */
export function firstCode(config: CouponConfig): string | null {
  if (totalCoupons(config) <= 0) return null;
  return formatPattern(config.pattern, config.startNumber);
}

/** The last coupon code, used for previews/summaries. */
export function lastCode(config: CouponConfig): string | null {
  if (totalCoupons(config) <= 0) return null;
  return formatPattern(config.pattern, config.endNumber);
}
