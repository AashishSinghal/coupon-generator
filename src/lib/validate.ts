import { MAX_COUPONS, type CouponConfig } from "./types";
import { validatePattern } from "@/utils/formatNumber";

export type FieldErrors = Partial<Record<keyof CouponConfig | "total", string>>;

const isInt = (n: number) => Number.isFinite(n) && Number.isInteger(n);

/**
 * Validate a config independently of any image. Returns a map of field → error
 * message; an empty map means the config is valid. Mirrors the notebook's
 * interactive guards (1–20 rows/cols, end ≥ start) plus the spec's 5000 cap.
 */
export function validateConfig(config: CouponConfig): FieldErrors {
  const errors: FieldErrors = {};

  const patternError = validatePattern(config.pattern);
  if (patternError) errors.pattern = patternError;

  if (!isInt(config.startNumber)) errors.startNumber = "Must be a whole number";
  if (!isInt(config.endNumber)) errors.endNumber = "Must be a whole number";
  if (isInt(config.startNumber) && isInt(config.endNumber) && config.endNumber < config.startNumber) {
    errors.endNumber = "End must be ≥ start";
  }

  if (!isInt(config.rows) || config.rows < 1 || config.rows > 20)
    errors.rows = "Rows must be 1–20";
  if (!isInt(config.cols) || config.cols < 1 || config.cols > 20)
    errors.cols = "Columns must be 1–20";

  // Overlay controls are slider-bound, so we only guard against non-finite values.
  if (!Number.isFinite(config.fontScale) || config.fontScale <= 0)
    errors.fontScale = "Size must be greater than zero";
  if (!Number.isFinite(config.posX)) errors.posX = "Invalid position";
  if (!Number.isFinite(config.posY)) errors.posY = "Invalid position";
  if (!Number.isFinite(config.rotation)) errors.rotation = "Invalid rotation";

  const total = config.endNumber - config.startNumber + 1;
  if (!errors.startNumber && !errors.endNumber && total > MAX_COUPONS) {
    errors.total = `${total.toLocaleString()} coupons exceeds the ${MAX_COUPONS.toLocaleString()} limit`;
  }

  return errors;
}

export function isValid(errors: FieldErrors): boolean {
  return Object.keys(errors).length === 0;
}
