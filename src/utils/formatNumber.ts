/**
 * A focused re-implementation of Python's `str.format` mini-language, scoped to
 * the single `{number}` replacement field used by coupon patterns.
 *
 * The notebook builds each code with:
 *     coupon_code = coupon_code_pattern.format(number=number)
 *
 * So patterns like "A{number:04d}", "PROMO-{number:05d}", or "SAVE{number}"
 * must produce byte-identical output to CPython. This module reproduces the
 * integer-presentation subset of the format spec:
 *
 *     [[fill]align][sign][#][0][width][grouping][.precision][type]
 *
 * Supported integer types: d (decimal), b (binary), o (octal), x/X (hex),
 * n (locale-naive decimal), c (character), and "" (defaults to d for ints).
 * Literal braces are written as "{{" and "}}", exactly as in Python.
 */

const FIELD_RE = /\{\{|\}\}|\{number(?::([^{}]*))?\}/g;

const SPEC_RE =
  /^(?:(.)?([<>=^]))?([+\- ])?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdoxXn])?$/;

interface ParsedSpec {
  fill: string;
  align: "" | "<" | ">" | "=" | "^";
  sign: "+" | "-" | " ";
  alt: boolean;
  zero: boolean;
  width: number;
  grouping: "" | "," | "_";
  type: string;
}

function parseSpec(spec: string): ParsedSpec {
  const m = SPEC_RE.exec(spec);
  if (!m) {
    throw new Error(`Invalid format spec: "${spec}"`);
  }
  const [, fill, align, sign, alt, zero, width, grouping, , type] = m;
  return {
    fill: fill ?? "",
    align: (align as ParsedSpec["align"]) ?? "",
    sign: (sign as ParsedSpec["sign"]) ?? "-",
    alt: Boolean(alt),
    zero: Boolean(zero),
    width: width ? parseInt(width, 10) : 0,
    grouping: (grouping as ParsedSpec["grouping"]) ?? "",
    type: type ?? "",
  };
}

function groupDigits(digits: string, sep: string, interval: number): string {
  if (!sep) return digits;
  const out: string[] = [];
  for (let i = digits.length; i > 0; i -= interval) {
    out.unshift(digits.slice(Math.max(0, i - interval), i));
  }
  return out.join(sep);
}

function baseConvert(value: number, type: string): { digits: string; prefix: string } {
  switch (type) {
    case "b":
      return { digits: value.toString(2), prefix: "0b" };
    case "o":
      return { digits: value.toString(8), prefix: "0o" };
    case "x":
      return { digits: value.toString(16), prefix: "0x" };
    case "X":
      return { digits: value.toString(16).toUpperCase(), prefix: "0X" };
    default:
      return { digits: value.toString(10), prefix: "" };
  }
}

/** Format a single integer according to a Python integer format spec. */
export function formatInt(value: number, spec: string): string {
  if (!Number.isFinite(value)) {
    throw new Error("Coupon number must be a finite integer");
  }
  const p = parseSpec(spec);

  // `c` interprets the integer as a Unicode code point.
  if (p.type === "c") {
    return padField(String.fromCodePoint(value), "", p);
  }

  const negative = value < 0;
  const abs = Math.abs(Math.trunc(value));
  const { digits, prefix } = baseConvert(abs, p.type);

  const groupInterval = p.type === "b" || p.type === "o" || p.type === "x" || p.type === "X" ? 4 : 3;
  const grouped = groupDigits(digits, p.grouping, groupInterval);

  const signStr = negative ? "-" : p.sign === "-" ? "" : p.sign;
  const altPrefix = p.alt ? prefix : "";

  return padNumber(signStr, altPrefix, grouped, p);
}

/** Apply width padding for non-numeric output (the `c` type / fallthrough). */
function padField(body: string, _prefix: string, p: ParsedSpec): string {
  if (body.length >= p.width) return body;
  const pad = (p.fill || " ").repeat(p.width - body.length);
  const align = p.align || "<";
  if (align === ">") return pad + body;
  if (align === "^") {
    const left = Math.floor((p.width - body.length) / 2);
    const fill = p.fill || " ";
    return fill.repeat(left) + body + fill.repeat(p.width - body.length - left);
  }
  return body + pad;
}

/** Apply width/zero padding for a numeric body, honoring sign placement. */
function padNumber(sign: string, prefix: string, digits: string, p: ParsedSpec): string {
  const body = sign + prefix + digits;
  if (body.length >= p.width) return body;

  const padLen = p.width - body.length;
  const fill = p.fill || (p.zero && !p.align ? "0" : " ");
  const align = p.align || (p.zero ? "=" : ">");

  if (align === "=") {
    // Pad between the sign/prefix and the digits (zero-fill style: A0001).
    return sign + prefix + fill.repeat(padLen) + digits;
  }
  if (align === "<") return body + fill.repeat(padLen);
  if (align === "^") {
    const left = Math.floor(padLen / 2);
    return fill.repeat(left) + body + fill.repeat(padLen - left);
  }
  return fill.repeat(padLen) + body; // ">"
}

/**
 * Render a coupon pattern for a given number, exactly like
 * `pattern.format(number=n)` in Python.
 */
export function formatPattern(pattern: string, n: number): string {
  return pattern.replace(FIELD_RE, (token, spec: string | undefined) => {
    if (token === "{{") return "{";
    if (token === "}}") return "}";
    return formatInt(n, spec ?? "");
  });
}

/**
 * Validate a pattern by attempting to format it. Returns an error message, or
 * null if the pattern is usable. Catches malformed specs and unescaped braces.
 */
export function validatePattern(pattern: string): string | null {
  if (!pattern.includes("{number")) {
    return "Pattern must include {number} (e.g. A{number:04d})";
  }
  // Detect stray single braces that aren't part of {number...} or {{ }}.
  const stripped = pattern.replace(FIELD_RE, "");
  if (stripped.includes("{") || stripped.includes("}")) {
    return "Unmatched brace — use {{ and }} for literal braces";
  }
  try {
    formatPattern(pattern, 1);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Invalid pattern";
  }
}
