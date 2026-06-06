import { DEFAULT_CONFIG, type CouponConfig } from "./types";

/**
 * localStorage-backed persistence for the user's last config and saved presets.
 * All access is guarded so SSR and privacy-mode (storage-disabled) browsers
 * degrade silently to in-memory-only behaviour.
 */

const CONFIG_KEY = "coupon-press:config:v1";
const PRESETS_KEY = "coupon-press:presets:v1";

export interface Preset {
  id: string;
  name: string;
  config: CouponConfig;
}

function readKey(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeKey(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Coerce arbitrary parsed JSON into a valid config by merging over defaults. */
export function sanitizeConfig(input: unknown): CouponConfig {
  const out: CouponConfig = { ...DEFAULT_CONFIG };
  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    (Object.keys(DEFAULT_CONFIG) as (keyof CouponConfig)[]).forEach((k) => {
      const value = record[k];
      if (typeof value === typeof DEFAULT_CONFIG[k]) {
        // @ts-expect-error key/value types align by the typeof check above.
        out[k] = value;
      }
    });
  }
  return out;
}

export function loadConfig(): CouponConfig | null {
  const raw = readKey(CONFIG_KEY);
  if (!raw) return null;
  try {
    return sanitizeConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveConfig(config: CouponConfig): void {
  writeKey(CONFIG_KEY, JSON.stringify(config));
}

export function loadPresets(): Preset[] {
  const raw = readKey(PRESETS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p.id === "string" && typeof p.name === "string")
      .map((p) => ({ id: p.id, name: p.name, config: sanitizeConfig(p.config) }));
  } catch {
    return [];
  }
}

export function savePresets(presets: Preset[]): void {
  writeKey(PRESETS_KEY, JSON.stringify(presets));
}
