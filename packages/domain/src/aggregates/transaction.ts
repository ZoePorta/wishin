import { ValidationMode as SharedValidationMode } from "../common/validation-mode";
import {
  InvalidAttributeError,
  InvalidTransitionError,
} from "../errors/domain-errors";
import { isValidUUID } from "../common/validation-utils";

/**
 * Extended ValidationMode for Transaction.
 */
export const ValidationMode = {
  ...SharedValidationMode,
} as const;

export type ValidationMode =
  (typeof ValidationMode)[keyof typeof ValidationMode];

/**
 * Status of transaction.
 */
export enum TransactionStatus {
  RESERVED = "RESERVED",
  PURCHASED = "PURCHASED",
  CANCELLED = "CANCELLED",
}

/**
 * Public interface defining the shape of Transaction data.
 *
 * @interface TransactionProps
 * @property {string} id - Unique identifier (UUID v4).
 * @property {string} itemId - The item being transacted (UUID v4).
 * @property {string} [userId] - The registered user ID (UUID v4).
 * @property {string} [guestSessionId] - The guest session identifier.
 * @property {TransactionStatus} status - Lifecycle state.
 * @property {number} quantity - Positive integer.
 * @property {Date} createdAt - Creation timestamp.
 * @property {Date} updatedAt - Last update timestamp.
 */
export interface TransactionProps {
  id: string;
  itemId: string;
  userId?: string;
  guestSessionId?: string;
  status: TransactionStatus;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Props for creating a reservation.
 */
export interface TransactionCreateReservationProps {
  itemId: string;
  userId: string;
  quantity: number;
}

/**
 * Props for creating a purchase.
 */
export interface TransactionCreatePurchaseProps {
  itemId: string;
  userId?: string;
  guestSessionId?: string;
  quantity: number;
}

/**
 * Domain Aggregate: Transaction
 *
 * Tracks the reservation or purchase of a specific WishlistItem.
 *
 * **Business Invariants:**
 * - **id**, **itemId**: Must be valid UUID v4.
 * - **quantity**: Must be a positive integer.
 * - **Identity XOR**: Must have exactly ONE of `userId` or `guestSessionId`.
 * - **RESERVED state**: Requires `userId`.
 * - **PURCHASED state**: Allows either `userId` or `guestSessionId`.
 *
 * @throws {InvalidAttributeError} If validation fails.
 */
export class Transaction {
  /**
   * Unique identifier (UUID v4).
   * @returns {string}
   */
  public get id(): string {
    return this.props.id;
  }

  /**
   * The item being transacted (UUID v4).
   * @returns {string}
   */
  public get itemId(): string {
    return this.props.itemId;
  }

  /**
   * The registered user ID (UUID v4).
   * @returns {string | undefined}
   */
  public get userId(): string | undefined {
    return this.props.userId;
  }

  /**
   * The guest session identifier.
   * @returns {string | undefined}
   */
  public get guestSessionId(): string | undefined {
    return this.props.guestSessionId;
  }

  /**
   * Lifecycle state (RESERVED, PURCHASED, CANCELLED).
   * @returns {TransactionStatus}
   */
  public get status(): TransactionStatus {
    return this.props.status;
  }

  /**
   * Amount of items transacted.
   * @returns {number}
   */
  public get quantity(): number {
    return this.props.quantity;
  }

  /**
   * Creation timestamp.
   * @returns {Date}
   */
  public get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  /**
   * Last update timestamp.
   * @returns {Date}
   */
  public get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  private readonly props: TransactionProps;

  private constructor(props: TransactionProps, mode: ValidationMode) {
    this.props = {
      ...props,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };
    this.validate(mode);
  }

  /**
   * Reconstitutes a Transaction from persistence.
   *
   * **Validation Mode:** STRICT
   *
   * @param {TransactionProps} props
   * @returns {Transaction}
   */
  public static reconstitute(props: TransactionProps): Transaction {
    return new Transaction(props, ValidationMode.STRICT);
  }

  /**
   * Factory for RESERVED transactions.
   *
   * **Validation Mode:** STRICT
   *
   * @param {TransactionCreateReservationProps} props
   * @returns {Transaction}
   */
  public static createReservation(
    props: TransactionCreateReservationProps,
  ): Transaction {
    const now = new Date();
    return Transaction.create({
      ...props,
      status: TransactionStatus.RESERVED,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory for PURCHASED transactions.
   *
   * **Validation Mode:** STRICT
   *
   * @param {TransactionCreatePurchaseProps} props
   * @returns {Transaction}
   */
  public static createPurchase(
    props: TransactionCreatePurchaseProps,
  ): Transaction {
    const now = new Date();
    return Transaction.create({
      ...props,
      status: TransactionStatus.PURCHASED,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  private static create(props: TransactionProps): Transaction {
    return new Transaction(props, ValidationMode.STRICT);
  }

  /**
   * Marks the transaction as CANCELLED.
   *
   * @returns {Transaction} New instance with updated status.
   * @throws {InvalidTransitionError} If already cancelled or if guest transaction.
   */
  public cancel(): Transaction {
    if (this.status === TransactionStatus.CANCELLED) {
      throw new InvalidTransitionError("Transaction is already cancelled");
    }

    if (!this.userId) {
      throw new InvalidTransitionError(
        "Only registered users can cancel transactions",
      );
    }

    return new Transaction(
      {
        ...this.toProps(),
        status: TransactionStatus.CANCELLED,
        updatedAt: new Date(),
      },
      ValidationMode.STRICT,
    );
  }

  /**
   * Confirms a reservation as a purchase.
   *
   * @returns {Transaction} New instance with PURCHASED status.
   * @throws {InvalidTransitionError} If status is not RESERVED.
   */
  public confirmPurchase(): Transaction {
    if (this.status !== TransactionStatus.RESERVED) {
      throw new InvalidTransitionError(
        `Cannot confirm purchase from ${this.status} status`,
      );
    }

    return new Transaction(
      {
        ...this.toProps(),
        status: TransactionStatus.PURCHASED,
        updatedAt: new Date(),
      },
      ValidationMode.STRICT,
    );
  }

  /**
   * Identity-based equality check.
   *
   * @param {Transaction} other
   * @returns {boolean}
   */
  public equals(other: Transaction): boolean {
    if (!(other instanceof Transaction)) {
      return false;
    }
    return this.id === other.id;
  }

  /**
   * Returns a shallow copy of properties.
   * @returns {TransactionProps}
   */
  public toProps(): TransactionProps {
    return {
      ...this.props,
      createdAt: new Date(this.props.createdAt),
      updatedAt: new Date(this.props.updatedAt),
    };
  }

  private validate(mode: ValidationMode): void {
    // --- STRUCTURAL (Always) ---
    if (!isValidUUID(this.id)) {
      throw new InvalidAttributeError("Invalid id: Must be valid UUID v4");
    }
    if (!isValidUUID(this.itemId)) {
      throw new InvalidAttributeError("Invalid itemId: Must be valid UUID v4");
    }
    if (isNaN(this.quantity)) {
      throw new InvalidAttributeError("Invalid quantity: Must be a number");
    }
    if (!(this.createdAt instanceof Date) || isNaN(this.createdAt.getTime())) {
      throw new InvalidAttributeError(
        "Invalid createdAt: Must be a valid Date",
      );
    }
    if (!(this.updatedAt instanceof Date) || isNaN(this.updatedAt.getTime())) {
      throw new InvalidAttributeError(
        "Invalid updatedAt: Must be a valid Date",
      );
    }

    // --- Identity XOR (Always) ---
    const hasUser = !!this.userId;
    const hasGuest = !!this.guestSessionId;

    if (hasUser && hasGuest) {
      throw new InvalidAttributeError(
        "Identity XOR: Cannot have both userId and guestSessionId",
      );
    }
    if (!hasUser && !hasGuest) {
      throw new InvalidAttributeError(
        "Identity XOR: Must have either userId or guestSessionId",
      );
    }

    // --- BUSINESS RULES (Always enforced as they are fundamental) ---
    if (this.quantity <= 0 || !Number.isInteger(this.quantity)) {
      throw new InvalidAttributeError(
        "Invalid quantity: Must be a positive integer",
      );
    }

    if (this.userId && !isValidUUID(this.userId)) {
      throw new InvalidAttributeError("Invalid userId: Must be valid UUID v4");
    }

    if (this.guestSessionId?.trim() === "") {
      throw new InvalidAttributeError(
        "Invalid guestSessionId: Must be a non-empty string",
      );
    }

    if (mode === ValidationMode.STRICT) {
      if (this.status === TransactionStatus.RESERVED && !this.userId) {
        throw new InvalidAttributeError(
          "Invalid state: Reserved transactions require a userId",
        );
      }
    }
  }
}
