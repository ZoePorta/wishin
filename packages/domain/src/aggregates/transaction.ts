import { ValidationMode } from "../common/validation-mode";
import {
  InvalidAttributeError,
  InvalidTransitionError,
} from "../errors/domain-errors";
import { isValidUUID, isValidIdentity } from "../common/validation-utils";

import { TransactionStatus } from "../value-objects/transaction-status";

/**
 * Public interface defining the shape of Transaction data.
 *
 * @interface TransactionProps
 * @property {string} id - Unique identifier (UUID v4).
 * @property {string | null} itemId - The item being transacted (UUID v4) or null if deleted (ADR 017).
 * @property {string | null} [userId] - Unique identity (UUID or Appwrite ID) or null if deleted (ADR 017).
 * @property {string | null} itemName - The item title at the time of transaction.
 * @property {number | null} itemPrice - The item's price at the time of transaction.
 * @property {string | null} itemCurrency - The currency code (e.g., "USD", "EUR").
 * @property {string | null} itemDescription - The item details/metadata.
 * @property {string | null} ownerUsername - The username of the wishlist owner.
 * @property {TransactionStatus} status - Lifecycle state (RESERVED, PURCHASED, CANCELLED).
 * @property {number} quantity - Positive integer.
 * @property {Date} createdAt - Creation timestamp.
 * @property {Date} updatedAt - Last update timestamp.
 */
export interface TransactionProps {
  id: string;
  itemId: string | null;
  userId?: string | null;
  itemName: string | null;
  itemPrice: number | null;
  itemCurrency: string | null;
  itemDescription: string | null;
  ownerUsername: string | null;
  status: TransactionStatus;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Props for creating a reservation.
 */
export interface TransactionCreateReservationProps {
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
}

/**
 * Props for creating a purchase.
 */
export interface TransactionCreatePurchaseProps {
  id: string;
  itemId: string;
  userId: string;
  quantity: number;
}

/**
 * Domain Aggregate: Transaction
 *
 * Tracks the reservation or purchase of a specific WishlistItem.
 *
 * - **userId**: Mandatory for all strictly validated transactions. Allows null values during reconstitution to handle deleted entities (ADR 017).
 * - **RESERVED state**: Requires `userId`.
 * - **PURCHASED state**: Requires `userId`.
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
   *
   * @remarks Supports null to allow the Domain to represent orphan transactions resulting from deleted items (ADR 017).
   * Note that for the MVP, the Infrastructure layer enforces non-null constraints via Cascade deletion.
   *
   * @returns {string | null}
   */
  public get itemId(): string | null {
    return this.props.itemId;
  }

  /**
   * The user identity (Registered or Anonymous).
   * @returns {string | null | undefined}
   */
  public get userId(): string | null | undefined {
    return this.props.userId;
  }

  /**
   * The name of the item at the time of transaction.
   * @returns {string | null}
   */
  public get itemName(): string | null {
    return this.props.itemName;
  }

  /**
   * The price of the item at the time of transaction.
   * @returns {number | null}
   */
  public get itemPrice(): number | null {
    return this.props.itemPrice;
  }

  /**
   * The currency of the item price.
   * @returns {string | null}
   */
  public get itemCurrency(): string | null {
    return this.props.itemCurrency;
  }

  /**
   * The description of the item.
   * @returns {string | null}
   */
  public get itemDescription(): string | null {
    return this.props.itemDescription;
  }

  /**
   * The username of the wishlist owner.
   * @returns {string | null}
   */
  public get ownerUsername(): string | null {
    return this.props.ownerUsername;
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
      itemName: props.itemName ?? null,
      itemPrice: props.itemPrice ?? null,
      itemCurrency: props.itemCurrency ?? null,
      itemDescription: props.itemDescription ?? null,
      ownerUsername: props.ownerUsername ?? null,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    };
    this.validate(mode);
  }

  /**
   * Reconstitutes a Transaction from persistence.
   *
   * **Validation Mode:** STRUCTURAL
   *
   * @param {TransactionProps} props
   * @returns {Transaction}
   */
  public static reconstitute(props: TransactionProps): Transaction {
    return new Transaction(props, ValidationMode.STRUCTURAL);
  }

  /**
   * Factory for RESERVED transactions.
   *
   * Sets status to RESERVED and initializes timestamps.
   *
   * **Validation Mode:** STRICT
   *
   * @param {TransactionCreateReservationProps & { itemName: string; itemPrice: number | null; itemCurrency: string | null; itemDescription: string | null; ownerUsername: string; }} props
   * @param {string} props.itemName - The item title.
   * @param {number|null} props.itemPrice - The item price.
   * @param {string|null} props.itemCurrency - The currency code.
   * @param {string|null} props.itemDescription - The item details.
   * @param {string} props.ownerUsername - The owner's username.
   * @returns {Transaction}
   * @throws {InvalidAttributeError} If validation fails.
   */
  public static createReservation(
    props: TransactionCreateReservationProps & {
      itemName: string;
      itemPrice: number | null;
      itemCurrency: string | null;
      itemDescription: string | null;
      ownerUsername: string;
    },
  ): Transaction {
    const now = new Date();
    return Transaction.create({
      ...props,
      status: TransactionStatus.RESERVED,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Factory for PURCHASED transactions.
   *
   * Sets status to PURCHASED and initializes timestamps.
   *
   * **Validation Mode:** STRICT
   *
   * @param {TransactionCreatePurchaseProps & { itemName: string; itemPrice: number | null; itemCurrency: string | null; itemDescription: string | null; ownerUsername: string; }} props
   * @param {string} props.itemName - The item title.
   * @param {number|null} props.itemPrice - The item price.
   * @param {string|null} props.itemCurrency - The currency code.
   * @param {string|null} props.itemDescription - The item details.
   * @param {string} props.ownerUsername - The owner's username.
   * @returns {Transaction}
   * @throws {InvalidAttributeError} If validation fails.
   */
  public static createPurchase(
    props: TransactionCreatePurchaseProps & {
      itemName: string;
      itemPrice: number | null;
      itemCurrency: string | null;
      itemDescription: string | null;
      ownerUsername: string;
    },
  ): Transaction {
    const now = new Date();
    return Transaction.create({
      ...props,
      status: TransactionStatus.PURCHASED,
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
    if (
      this.status === TransactionStatus.CANCELLED ||
      this.status === TransactionStatus.CANCELLED_BY_OWNER
    ) {
      return this;
    }

    // Permission Rule (ADR 018): Universal creator check is enforced at the Application/Infrastructure layer.
    // The domain only ensures the state transition is valid.

    return new Transaction(
      {
        ...this.toProps(),
        status: TransactionStatus.CANCELLED,
        updatedAt: new Date(),
      },
      ValidationMode.STRUCTURAL,
    );
  }

  /**
   * Marks the transaction as CANCELLED_BY_OWNER (e.g., due to item pruning).
   *
   * @returns {Transaction} New instance with updated status.
   * @throws {InvalidTransitionError} If status is PURCHASED.
   */
  public cancelByOwner(): Transaction {
    if (
      this.status === TransactionStatus.CANCELLED ||
      this.status === TransactionStatus.CANCELLED_BY_OWNER
    ) {
      return this;
    }

    if (this.status === TransactionStatus.PURCHASED) {
      throw new InvalidTransitionError(
        "Owner cannot cancel a transaction that has already been purchased",
      );
    }

    return new Transaction(
      {
        ...this.toProps(),
        status: TransactionStatus.CANCELLED_BY_OWNER,
        updatedAt: new Date(),
      },
      ValidationMode.STRUCTURAL,
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
   * Updates the transaction quantity.
   *
   * @param {number} newQuantity - The new quantity.
   * @returns {Transaction} New instance with updated quantity.
   * @throws {InvalidAttributeError} If quantity is invalid.
   * @throws {InvalidTransitionError} If status is not RESERVED.
   */
  public updateQuantity(newQuantity: number): Transaction {
    if (this.status !== TransactionStatus.RESERVED) {
      throw new InvalidTransitionError(
        `Cannot update quantity for ${this.status} transaction`,
      );
    }

    return new Transaction(
      {
        ...this.toProps(),
        quantity: newQuantity,
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
    if (this.itemId && !isValidUUID(this.itemId)) {
      throw new InvalidAttributeError("Invalid itemId: Must be valid UUID v4");
    }
    if (isNaN(this.quantity)) {
      throw new InvalidAttributeError("Invalid quantity: Must be a number");
    }
    if (this.quantity <= 0 || !Number.isInteger(this.quantity)) {
      throw new InvalidAttributeError(
        "Invalid quantity: Must be a positive integer",
      );
    }
    if (this.userId && !isValidIdentity(this.userId)) {
      throw new InvalidAttributeError(
        "Invalid userId: Must be a valid identity (UUID or Appwrite ID)",
      );
    }
    if (this.itemName !== null && typeof this.itemName !== "string") {
      throw new InvalidAttributeError("Invalid itemName: Must be a string");
    }
    if (this.itemPrice !== null && typeof this.itemPrice !== "number") {
      throw new InvalidAttributeError("Invalid itemPrice: Must be a number");
    }
    if (this.itemCurrency !== null && typeof this.itemCurrency !== "string") {
      throw new InvalidAttributeError("Invalid itemCurrency: Must be a string");
    }
    if (
      this.itemDescription !== null &&
      typeof this.itemDescription !== "string"
    ) {
      throw new InvalidAttributeError(
        "Invalid itemDescription: Must be a string",
      );
    }
    if (this.ownerUsername !== null && typeof this.ownerUsername !== "string") {
      throw new InvalidAttributeError(
        "Invalid ownerUsername: Must be a string",
      );
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

    // --- STRICT VALIDATIONS ---
    if (mode === ValidationMode.STRICT) {
      // Identity Mandate
      if (!this.userId) {
        throw new InvalidAttributeError(
          "Identity Mandate: userId must be defined for new transactions",
        );
      }

      // Metadata presence
      if (!this.itemId) {
        throw new InvalidAttributeError(
          "Invalid itemId: Must be defined for new transactions",
        );
      }

      if (this.status === TransactionStatus.RESERVED && !this.userId) {
        throw new InvalidAttributeError(
          "Invalid state: Reserved transactions require a userId",
        );
      }

      // Business Validations
      if (this.itemName === null || this.itemName.trim().length === 0) {
        throw new InvalidAttributeError(
          "Invalid itemName: Cannot be null, empty or whitespace",
        );
      }
      if (
        this.ownerUsername === null ||
        this.ownerUsername.trim().length === 0
      ) {
        throw new InvalidAttributeError(
          "Invalid ownerUsername: Cannot be null, empty or whitespace",
        );
      }
      if (this.itemPrice !== null && this.itemPrice < 0) {
        throw new InvalidAttributeError(
          "Invalid itemPrice: Cannot be negative",
        );
      }
    }
  }
}
