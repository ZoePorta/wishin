/**
 * Error thrown when a provided attribute or value is invalid.
 *
 * @param {string} message - The error message.
 * @returns {InvalidAttributeError} An instance of InvalidAttributeError.
 */
export class InvalidAttributeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAttributeError";
    Object.setPrototypeOf(this, InvalidAttributeError.prototype);
  }
}

/**
 * Error thrown when there is not enough stock to complete an operation.
 *
 * @param {string} message - The error message.
 * @returns {InsufficientStockError} An instance of InsufficientStockError.
 */
export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
    Object.setPrototypeOf(this, InsufficientStockError.prototype);
  }
}

/**
 * Error thrown when an invalid state transition is attempted.
 *
 * @param {string} message - The error message.
 * @returns {InvalidTransitionError} An instance of InvalidTransitionError.
 */
export class InvalidTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransitionError";
    Object.setPrototypeOf(this, InvalidTransitionError.prototype);
  }
}

/**
 * Error thrown when a defined limit is exceeded (e.g., maximum number of items).
 *
 * @param {string} message - The error message.
 * @returns {LimitExceededError} An instance of LimitExceededError.
 */
export class LimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LimitExceededError";
    Object.setPrototypeOf(this, LimitExceededError.prototype);
  }
}

/**
 * Error thrown when an operation is invalid in the current state or context.
 *
 * @param {string} message - The error message.
 * @returns {InvalidOperationError} An instance of InvalidOperationError.
 */
export class InvalidOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidOperationError";
    Object.setPrototypeOf(this, InvalidOperationError.prototype);
  }
}
/**
 * Error thrown when a requested resource is not found.
 *
 * @param {string} message - The error message describing the missing resource.
 * @returns {NotFoundError} An instance of NotFoundError.
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
/**
 * Error message used when a visibility value is invalid.
 * Invariant: Visibility must be one of the following:
 * - Visibility.LINK: Anyone with the link can view.
 * - Visibility.PRIVATE: Only the owner can view.
 */
export const INVALID_VISIBILITY_ERROR = "Invalid visibility" as const;

/**
 * Error message used when a participation value is invalid.
 * Invariant: Participation must be one of the following:
 * - Participation.ANYONE: Anyone can participate.
 * - Participation.REGISTERED: Only registered users can participate.
 * - Participation.CONTACTS: Only owner's contacts can participate.
 */
export const INVALID_PARTICIPATION_ERROR = "Invalid participation" as const;
