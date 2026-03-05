/**
 * Minimal logger interface for the domain layer.
 */
export interface Logger {
  /**
   * Logs a debug message for technical troubleshooting.
   *
   * @param message - The informational message to log.
   * @param context - Optional structured metadata for enrichment.
   * @returns {void}
   * @throws {Error} If the logging implementation fails.
   */
  debug(message: string, context?: Record<string, unknown>): void;

  /**
   * Logs an informational message about normal system operation.
   *
   * @param message - The informational message to log.
   * @param context - Optional structured metadata for enrichment.
   * @returns {void}
   * @throws {Error} If the logging implementation fails.
   */
  info(message: string, context?: Record<string, unknown>): void;

  /**
   * Logs a warning about a potentially problematic situation.
   *
   * @param message - The informational message to log.
   * @param context - Optional structured metadata for enrichment.
   * @returns {void}
   * @throws {Error} If the logging implementation fails.
   */
  warn(message: string, context?: Record<string, unknown>): void;

  /**
   * Logs an error message indicating a failure.
   *
   * @param message - The informational message to log.
   * @param context - Optional structured metadata for enrichment.
   * @returns {void}
   * @throws {Error} If the logging implementation fails.
   */
  error(message: string, context?: Record<string, unknown>): void;
}
