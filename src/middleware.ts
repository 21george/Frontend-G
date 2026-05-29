import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/auth", "/", "/_next", "/favicon.ico", "/theme-init.js"];

/**
 * Lightweight JWT validation for Edge Middleware.
 *
 * We cannot verify the HMAC signature here (no secret in the Edge runtime),
 * but we CAN reject tokens that:
 *   - are not three dot-separated base64url segments (not a JWT at all), or
 *   - have an `exp` claim that is already in the past (expired).
 *
 * The backend still performs full signature verification on every API call,
 * so this is a first-layer guard against obviously invalid/expired cookies.
 * We treat any decode/parse failure as invalid (fail-closed).
 */
function isJwtStructurallyValid(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    // base64url → base64 → JSON
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    // Reject if token has already expired
    if (typeof payload.exp === "number") {
      return payload.exp > Math.floor(Date.now() / 1000);
    }
    // No exp claim — structure is valid; backend will enforce auth
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // Validate auth cookies — reject missing, malformed, or expired tokens.
  // refresh_token is long-lived (30 days); access_token is short-lived (15 min).
  // Passing either check is sufficient to proceed; the API layer verifies both.
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const accessToken = request.cookies.get("access_token")?.value;

  const hasValidToken =
    isJwtStructurallyValid(refreshToken) || isJwtStructurallyValid(accessToken);

  if (!hasValidToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|theme-init.js).*)"],
};
