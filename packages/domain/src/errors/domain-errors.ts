export class InvalidAttributeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAttributeError";
    Object.setPrototypeOf(this, InvalidAttributeError.prototype);
  }
}

export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
    Object.setPrototypeOf(this, InsufficientStockError.prototype);
  }
}

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
 * @param message - The error message.
 * @returns An instance of LimitExceededError.
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
 * @param message - The error message.
 * @returns An instance of InvalidOperationError.
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
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
