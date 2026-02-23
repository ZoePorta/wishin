/**
 * Centralized error reporting utility.
 * Decouples the UI layer from specific error tracking implementations (e.g., Sentry, PostHog).
 */
export const ErrorReporting = {
  /**
   * Reports an error to the tracking service and logs it to the console.
   *
   * @param {Error} error - The caught error object.
   * @param {Record<string, unknown>} [extra] - Additional context data for the error.
   */
  report(error: Error, extra?: Record<string, unknown>): void {
    // In a real application, integration with Sentry or PostHog would happen here.
    // Example: Sentry.captureException(error, { extra });

    console.error("[ErrorReporting]", error, extra);
  },
};
