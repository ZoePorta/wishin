/**
 * Validates a redirect path to ensure it is an internal relative path.
 *
 * @param path - The redirection path to validate.
 * @returns {string} The validated path or a default safe fallback.
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

  // Allow sub-paths of safe routes if needed (e.g., /owner/dashboard/profile)
  // For now, strict matching as requested
  return FALLBACK;
}
