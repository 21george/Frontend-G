/** Validate that a URL is same-origin or an allowed external domain.
 *  Prevents open redirect vulnerabilities.
 */
export function isSafeRedirectUrl(url: string): boolean {
  if (!url) return false;

  // Normalize backslashes so "/\evil.com" doesn't slip through as a relative path.
  const normalized = url.replace(/\\/g, "/");

  // Allow relative paths, but reject protocol-relative URLs ("//host" or "/\host").
  if (normalized.startsWith("/") && !normalized.startsWith("//")) return true;

  try {
    const parsed = new URL(url);
    // Allow same-origin or known safe hosts
    const allowedHosts = [
      window.location.hostname,
      "localhost",
      "stripe.com",
      "hooks.stripe.com",
      "checkout.stripe.com",
      "billing.stripe.com",
    ];
    return allowedHosts.includes(parsed.hostname);
  } catch {
    return false;
  }
}

/** Perform a safe redirect. Falls back to root if URL is unsafe. */
export function safeRedirect(href: string, fallback = "/") {
  if (isSafeRedirectUrl(href)) {
    window.location.href = href;
  } else {
    window.location.href = fallback;
  }
}
