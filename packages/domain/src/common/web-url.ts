/**
 * Matches a leading URI scheme (e.g. `https:`, `mailto:`, `javascript:`).
 * A colon followed by a digit is treated as a port (`example.com:8080`), not a scheme.
 */
const SCHEME_REGEX = /^[a-z][a-z0-9+.-]*:(?!\d)/i;

const WEB_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Checks whether a string is a public web link that is safe to open for guests.
 *
 * Business invariants:
 * - Only `http:` and `https:` schemes are allowed (rejects `javascript:`, `data:`, `mailto:`, ...).
 * - The host must contain a dot, so bare words like `https://hello` are rejected.
 *
 * @param url - The URL to validate.
 * @returns True if the URL is a valid http(s) link, false otherwise.
 * @throws {never} This function does not throw.
 */
export function isValidWebUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return WEB_PROTOCOLS.has(parsed.protocol) && parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

/**
 * Normalizes user-typed link input: trims it and prepends `https://` when no scheme is present
 * (e.g. `amazon.es/item` → `https://amazon.es/item`). Existing schemes are left untouched so that
 * {@link isValidWebUrl} can still reject non-web ones.
 *
 * @param input - Raw text entered by the user.
 * @returns The normalized URL, or an empty string for blank input.
 * @throws {never} This function does not throw.
 */
export function normalizeWebUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return SCHEME_REGEX.test(trimmed) ? trimmed : `https://${trimmed}`;
}
