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
