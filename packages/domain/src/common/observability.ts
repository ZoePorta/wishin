/**
 * Service interface for observability (breadcrumbs, events, telemetry).
 */
export interface ObservabilityService {
  /**
   * Adds a breadcrumb for diagnostic context.
   * Breadcrumbs are typically stored until an error occurs and then sent with the error report.
   *
   * @param message - Short description of the event.
   * @param category - Functional area (e.g., 'auth', 'transaction').
   * @param data - Metadata associated with the breadcrumb.
   * @returns void
   * @throws {Error} If breadcrumb storage fails or invalid arguments are provided.
   */
  addBreadcrumb(
    message: string,
    category?: string,
    data?: Record<string, unknown>,
  ): void;

  /**
   * Tracks a significant business or system event.
   * Events are typically used for analytics and tracking user behavior.
   *
   * @param name - The name of the event.
   * @param properties - Contextual data for the event.
   * @returns void
   * @throws {Error} If event tracking fails due to validation or submission errors.
   */
  trackEvent(name: string, properties?: Record<string, unknown>): void;
}
