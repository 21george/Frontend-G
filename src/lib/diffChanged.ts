/**
 * diffChanged — pure, dependency-free helper.
 *
 * Given the form's current values, the original (DB) record, and the
 * list of editable field names, return ONLY the fields whose value
 * actually changed. Used to:
 *
 *   1. Skip the API call entirely on the client side when nothing
 *      changed (avoids a round-trip and avoids even hitting the
 *      server with a no-op PATCH).
 *   2. Show honest "X fields updated" feedback to the user.
 *
 * Mirrors the backend's App\Helpers\Diff helper in PHP so the two
 * agree on edge cases (null vs "", nested sub-documents, numeric
 * strings, etc).
 *
 * Pure function: same input -> same output. No I/O, no side effects.
 */

export type EditableRecord = Record<string, unknown>;

export interface DiffChangedOptions {
  /** Fields to consider. If omitted, every key in `current` is considered. */
  fields?: string[];
  /**
   * Treat null, undefined, and empty string as equivalent. Default: true.
   * This matches the backend's "is this field actually set?" semantic.
   * When true, a submit that clears a field looks like a no-op here
   * (skipped at the frontend); the backend will still report a real
   * change for notification purposes.
   */
  normalizeEmpty?: boolean;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * JSON-canonicalize a value for order-independent comparison.
 * Objects: keys sorted. Arrays: order preserved. Used so that
 * {a:1,b:2} and {b:2,a:1} compare equal — form payloads are
 * always plain objects so this is what we want.
 */
function canonicalJson(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) {
    return "[" + v.map(canonicalJson).join(",") + "]";
  }
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return (
      "{" +
      keys
        .map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(v);
}

/**
 * Strict value equality for the comparison core. Mirrors the PHP
 * Diff helper so the two stay in agreement on edge cases.
 */
function valuesEqual(
  a: unknown,
  b: unknown,
  normalizeEmpty: boolean,
): boolean {
  // Fast path: identical reference or primitive.
  if (a === b) return true;

  // Lenient mode: null, undefined, and the empty string are all
  // treated as the "field is not set" form. This is the frontend's
  // skip-the-network-call mode; the backend still treats them as
  // distinct for notification purposes.
  if (normalizeEmpty) {
    const aEmpty = a === null || a === undefined || a === "";
    const bEmpty = b === null || b === undefined || b === "";
    if (aEmpty && bEmpty) return true;
  }

  // Array / object: compare via canonical JSON.
  const aObj = isPlainObject(a) || Array.isArray(a);
  const bObj = isPlainObject(b) || Array.isArray(b);
  if (aObj || bObj) {
    if (typeof a !== typeof b) {
      // object/array vs primitive: with normalizeEmpty, empty forms
      // are equivalent. Without, they always differ.
      if (normalizeEmpty) {
        return canonicalJson(a ?? "") === canonicalJson(b ?? "");
      }
      return false;
    }
    return canonicalJson(a) === canonicalJson(b);
  }

  // Null handling. Any mismatch involving null is a real change
  // (null vs "" is a real "field explicitly cleared" change).
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }

  // Booleans do not coerce to strings or numbers.
  if (typeof a === "boolean" || typeof b === "boolean") {
    return false;
  }

  // Numeric comparison: int/float/numeric-string compare equal
  // if they represent the same value. We use Number() rather than
  // String() cast so '1e2' === 100 holds but '100foo' !== 100.
  const aIsNum =
    typeof a === "number" ||
    (typeof a === "string" && a !== "" && !Number.isNaN(Number(a)));
  const bIsNum =
    typeof b === "number" ||
    (typeof b === "string" && b !== "" && !Number.isNaN(Number(b)));
  if (aIsNum && bIsNum) {
    return Number(a) === Number(b);
  }

  // Two non-numeric, non-bool scalars: strict equality.
  return a === b;
}

export function diffChanged(
  current: EditableRecord,
  original: EditableRecord | null | undefined,
  options: DiffChangedOptions = {},
): string[] {
  if (!original) return [];

  const { fields, normalizeEmpty = true } = options;
  const candidates = fields ?? Object.keys(current);

  const changed: string[] = [];
  for (const f of candidates) {
    if (!Object.prototype.hasOwnProperty.call(current, f)) continue;
    if (!valuesEqual(current[f], original[f], normalizeEmpty)) {
      changed.push(f);
    }
  }
  return changed;
}

/**
 * Strip `undefined` values from an object — useful when building the
 * PUT payload from a form so we don't send `field: undefined` to the
 * server (which JSON.stringify drops, but explicit is better than
 * implicit).
 */
export function stripUndefined<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const out: Partial<T> = {};
  for (const k of Object.keys(obj) as (keyof T)[]) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}
