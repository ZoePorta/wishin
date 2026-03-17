/**
 * Validates a redirect path to ensure it is an internal relative path.
 *
 * @param path - The redirection path to validate.
 * @returns {string} The validated path or a default safe fallback ("/owner/dashboard").
 * @throws Never throws; it always returns a safe default if validation fails or input is missing.
 */
export function validateRedirect(path: string | undefined): string {
  const FALLBACK = "/owner/dashboard";

  if (!path) {
    return FALLBACK;
  }

  // 1. Must be a string (TypeScript handles this, but runtime check safely)
  // 2. Must start with '/' but not '//' (prevents protocol-relative redirects)
  if (!path.startsWith("/") || path.startsWith("//")) {
    return FALLBACK;
  }

  // 3. Must not contain a scheme (://)
  if (path.includes("://")) {
    return FALLBACK;
  }

  // 4. Match against an explicit allowlist of safe routes
  const safeRoutes = ["/owner/dashboard", "/owner/settings", "/"];

  // Check if it's one of the safe routes exactly
  if (safeRoutes.includes(path)) {
    return path;
  }

  // 5. Allow wishlist routes (e.g., /wishlist or /wishlist/123)
  if (path === "/wishlist" || path.startsWith("/wishlist/")) {
    return path;
  }

  return FALLBACK;
}
