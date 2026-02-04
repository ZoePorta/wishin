export class InvalidAttributeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAttributeError";
  }
}

export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export class InvalidTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidTransitionError";
  }
}
