/**
 * Resolve the API base URL from environment variables.
 * Falls back to localhost in development.
 */
export function resolveBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000/v1";
  const normalized = raw.replace(/\/+$/, "");
  return normalized.endsWith("/v1") ? normalized : `${normalized}/v1`;
}
