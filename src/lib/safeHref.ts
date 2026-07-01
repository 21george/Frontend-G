/**
 * URL safety helpers.
 *
 * Anywhere a user-influenced string flows into an `href` or `src` prop,
 * the value MUST pass through `safeHref()` first. This blocks XSS vectors
 * like `javascript:alert(1)`, `data:text/html,<script>...`, and
 * `vbscript:...` that the browser would otherwise execute when the user
 * clicks the link or the image loads.
 *
 * The accepted set is intentionally narrow:
 *   - relative paths starting with `/` (single slash only — protocol-
 *     relative `//evil.com` is rejected, that's an open redirect)
 *   - absolute `http://` and `https://` URLs
 *   - `mailto:` and `tel:` schemes (user-explicit intent)
 *   - in-page anchors `#section`
 *
 * Anything else returns null. Callers MUST handle null (e.g. hide the
 * link rather than render `href={null}` which React renders as the
 * literal string "null").
 */

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/**
 * Returns the URL if it's safe to use in href/src, otherwise null.
 *
 * - Rejects: javascript:, data:, vbscript:, file:, blob:, ftp:, //evil.com
 * - Accepts: /relative, /relative/path, #anchor, http(s)://, mailto:, tel:
 */
export function safeHref(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;

  // In-page anchor is always safe.
  if (trimmed.startsWith("#")) {
    return trimmed.length > 1 ? trimmed : null;
  }

  // Reject protocol-relative URLs (`//host`) and any backslash variants
  // (browsers normalise `\/` to `/` and would then treat it as a
  // protocol-relative URL).
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return null;
  if (trimmed.startsWith("\\") || /^[\\/]+/.test(trimmed)) {
    // Pure-backslash or mixed — also a protocol-relative trick.
    if (/^[\s\\\/]*\/\//.test(trimmed.replace(/ /g, ""))) return null;
  }

  // Same-origin relative path.
  if (trimmed.startsWith("/")) {
    // Re-confirm it does not contain a colon at position 1 (would be
    // a protocol-relative URL disguised with a leading slash).
    if (trimmed.length > 1 && trimmed[1] === ":") return null;
    return trimmed;
  }

  // Absolute URL: must parse and use an allowed protocol.
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (!SAFE_PROTOCOLS.has(parsed.protocol.toLowerCase())) return null;

  return parsed.toString();
}

/**
 * True iff the URL is safe for href/src. Convenience wrapper.
 */
export function isSafeHref(url: unknown): url is string {
  return safeHref(url) !== null;
}
