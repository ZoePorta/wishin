/**
 * Robustly detects if an error represents a network failure.
 * Handles standard TypeError ("Network request failed") and other common platform strings.
 *
 * @param error - The error to inspect.
 * @returns {boolean} True if the error is likely a network connectivity issue.
 */
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  // standard fetch API network error
  if (
    error instanceof TypeError &&
    error.message.toLowerCase().includes("network")
  ) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("network error") ||
    message.includes("connection refused")
  );
}