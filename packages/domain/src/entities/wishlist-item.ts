import {
  InsufficientStockError,
  InvalidAttributeError,
  InvalidTransitionError,
} from "../errors/domain-errors";

/**
 * Priority levels for wishlist items.
 * @enum {number}
 */
export enum Priority {
  /** Low priority item (1) */
  LOW = 1,
  /** Medium priority item (2) - Default */
  MEDIUM = 2,
  /** High priority item (3) */
  HIGH = 3,
  /** Urgent item (4) */
  URGENT = 4,
}

enum ValidationMode {
  STRICT = "STRICT",
  EVOLUTIVE = "EVOLUTIVE",
  TRANSACTION = "TRANSACTION",
  STRUCTURAL = "STRUCTURAL",
}

export interface WishlistItemProps {
  id: string;
  wishlistId: string;
  name: string;
  description?: string;
  priority?: Priority;
  price?: number;
  currency?: string;
  url?: string;
  imageUrl?: string;
  isUnlimited?: boolean;
  totalQuantity: number;
  reservedQuantity: number;
  purchasedQuantity: number;
}

/**
 * Core domain entity representing a gift item within a wishlist.
 *
 * Manages inventory lifecycle through an atomic, immutable state machine.
 * All state-changing operations return new instances; identity is preserved via `id`.
 *
 * Key invariants:
 * - Inventory: Q_total >= Q_reserved + Q_purchased (enforced in STRICT/TRANSACTION modes).
 * - Priority: Must be a valid Priority enum value (LOW=1..URGENT=4).
 * - Structural: `id` and `wishlistId` must be valid UUID v4.
 */
export class WishlistItem {
  public readonly id: string;
  public readonly wishlistId: string;
  public readonly name: string;
  public readonly description?: string;
  public readonly priority: Priority;
  public readonly price?: number;
  public readonly currency?: string;
  public readonly url?: string;
  public readonly imageUrl?: string;
  public readonly isUnlimited: boolean;
  public readonly totalQuantity: number;
  public readonly reservedQuantity: number;
  public readonly purchasedQuantity: number;

  /**
   * Private constructor to enforce factory usage.
   * Validates state invariants upon instantiation.
   * @param props - Raw properties for the entity.
   * @param mode - The validation mode to use.
   */
  private constructor(props: WishlistItemProps, mode: ValidationMode) {
    this.id = props.id;
    this.wishlistId = props.wishlistId;
    this.name = props.name;
    this.description = props.description;
    this.priority = props.priority ?? Priority.MEDIUM;
    this.price = props.price;
    this.currency = props.currency;
    this.url = props.url;
    this.imageUrl = props.imageUrl;
    this.isUnlimited = props.isUnlimited ?? false;
    this.totalQuantity = props.totalQuantity;
    this.reservedQuantity = props.reservedQuantity;
    this.purchasedQuantity = props.purchasedQuantity;

    this.validate(mode);
  }

  /**
   * Reconstitutes a WishlistItem from persistence (database), bypassing validation checks
   * that might fail due to legacy data or allowed transient states (e.g. over-commitment).
   * @param props - The properties to restore.
   * @returns A WishlistItem instance.
   * @throws {InvalidAttributeError} If structural integrity validation fails (e.g. invalid UUIDs, integer types, priority range), as ValidationMode.STRUCTURAL only enforces these and does not perform content validations like name length or price checks in reconstitute().
   */
  public static reconstitute(props: WishlistItemProps): WishlistItem {
    return WishlistItem._createWithMode(props, ValidationMode.STRUCTURAL);
  }

  /**
   * Factory method to create a new WishlistItem instance.
   * Enforces trimming of the name property.
   * @param props - The properties for the new item.
   * @returns A new valid WishlistItem instance.
   * @throws {InvalidAttributeError} If attribute validation fails.
   * @throws {InsufficientStockError} If inventory invariants are violated (unless skipped).
   */
  public static create(props: WishlistItemProps): WishlistItem {
    return WishlistItem._createWithMode(props, ValidationMode.STRICT);
  }

  private static _createWithMode(
    props: WishlistItemProps,
    mode: ValidationMode,
  ): WishlistItem {
    const sanitizedProps = {
      ...props,
      // Defensively trim name only if it's a string, ensuring validate() catches non-strings later
      name: typeof props.name === "string" ? props.name.trim() : props.name,
    };
    return new WishlistItem(sanitizedProps, mode);
  }

  /**
   * Updates the mutable properties of the WishlistItem.
   *
   * **Side Effects**:
   * - **Reservation Pruning**: If `totalQuantity` is reduced, `reservedQuantity` is automatically pruned
   *   to fit within the new limit (minimizing over-commitment), prioritizing `purchasedQuantity`.
   * - **Privacy Preservation**: Explicitly allows "over-commitment" (where `total < reserved + purchased`)
   *   when the owner reduces the total quantity, to avoid leaking information about hidden purchases.
   *
   * @param props - The properties to update.
   * @returns A new WishlistItem instance with updated properties.
   * @throws {InvalidAttributeError} If validation fails or if attempting to update restricted fields (id, reserved, purchased).
   */
  public update(props: Partial<WishlistItemProps>): WishlistItem {
    if (props.id !== undefined && props.id !== this.id) {
      throw new InvalidAttributeError("Cannot update entity ID");
    }

    if (
      props.wishlistId !== undefined &&
      props.wishlistId !== this.wishlistId
    ) {
      throw new InvalidAttributeError(
        "Cannot update wishlistId directly. Use moveToWishlist().",
      );
    }

    // Direct modification of reserved/purchased quantities is forbidden via update()
    if (
      props.reservedQuantity !== undefined ||
      props.purchasedQuantity !== undefined
    ) {
      throw new InvalidAttributeError(
        "Cannot manually update reserved or purchased quantities. Use reserve(), purchase(), or cancel methods.",
      );
    }

    const currentProps = this.toProps();

    // Sanitize props to remove undefined values so they don't overwrite currentProps
    const sanitizedUpdateProps: Partial<WishlistItemProps> = {};
    for (const key in props) {
      const k = key as keyof WishlistItemProps;
      if (props[k] !== undefined) {
        // @ts-expect-error - TS doesn't like assigning unknown types but it's safe here
        sanitizedUpdateProps[k] = props[k];
      }
    }

    // Reservation Pruning Logic:
    // Only applied if totalQuantity is strictly being REDUCED.
    let newReservedQuantity = currentProps.reservedQuantity;

    if (
      sanitizedUpdateProps.totalQuantity !== undefined &&
      sanitizedUpdateProps.totalQuantity < currentProps.totalQuantity
    ) {
      const currentPurchased = currentProps.purchasedQuantity;
      const maxAllowedReserved = Math.max(
        0,
        sanitizedUpdateProps.totalQuantity - currentPurchased,
      );
      newReservedQuantity = Math.min(newReservedQuantity, maxAllowedReserved);
    }

    return WishlistItem._createWithMode(
      {
        ...currentProps,
        ...sanitizedUpdateProps, // This applies other updates (name, price, etc.)
        id: this.id, // Ensure ID preserves identity
        reservedQuantity: newReservedQuantity, // Apply potentially pruned value
        // purchasedQuantity remains untouched as we threw if it was in props
      } as WishlistItemProps,
      ValidationMode.EVOLUTIVE,
    );
  }

  /**
   * Calculates the remaining quantity available for reservation or purchase.
   * Formula: max(0, totalQuantity - (reservedQuantity + purchasedQuantity))
   * @returns The number of items still available.
   */
  public get availableQuantity(): number {
    return Math.max(
      0,
      this.totalQuantity - (this.reservedQuantity + this.purchasedQuantity),
    );
  }

  /**
   * Reserves a specific quantity of the item.
   * @param amount - The number of units to reserve (must be a positive integer).
   * @returns A new WishlistItem instance with updated reserved quantity.
   * @throws {InvalidAttributeError} If amount is invalid.
   * @throws {InsufficientStockError} If not enough stock is available.
   */
  public reserve(amount: number): WishlistItem {
    if (!Number.isInteger(amount)) {
      throw new InvalidAttributeError("Amount must be an integer");
    }
    if (amount <= 0) {
      throw new InvalidAttributeError("Amount must be positive");
    }

    if (!this.isUnlimited && amount > this.availableQuantity) {
      throw new InsufficientStockError(
        `Insufficient stock: Requested ${amount.toString()}, Available ${this.availableQuantity.toString()}`,
      );
    }

    return WishlistItem._createWithMode(
      {
        ...this.toProps(),
        reservedQuantity: this.reservedQuantity + amount,
      },
      ValidationMode.TRANSACTION,
    );
  }

  /**
   * Moves the item to a different wishlist.
   * @param newWishlistId - The UUID of the new wishlist.
   * @returns A new WishlistItem instance with the updated wishlistId.
   * @throws {InvalidAttributeError} If newWishlistId is invalid or same as current.
   */
  public moveToWishlist(newWishlistId: string): WishlistItem {
    if (!this.isValidUUID(newWishlistId)) {
      throw new InvalidAttributeError(
        "Invalid newWishlistId: Must be a valid UUID v4",
      );
    }

    if (newWishlistId === this.wishlistId) {
      throw new InvalidAttributeError(
        "Cannot move to the same wishlist. Item is already in this wishlist.",
      );
    }

    // Bypass inventory check to allow moving over-committed items
    return WishlistItem._createWithMode(
      {
        ...this.toProps(),
        wishlistId: newWishlistId,
      },
      ValidationMode.STRUCTURAL, // Use STRUCTURAL to avoid re-validating legacy items on move
    );
  }

  /**
   * Cancels a previously made reservation, releasing the stock back to available.
   * @param amount - The number of units to release (must be a positive integer).
   * @returns A new WishlistItem instance with updated reserved quantity.
   * @throws {InvalidTransitionError} If trying to cancel more than what is currently reserved.
   */
  public cancelReservation(amount: number): WishlistItem {
    if (!Number.isInteger(amount)) {
      throw new InvalidAttributeError("Amount must be an integer");
    }
    if (amount <= 0) {
      throw new InvalidAttributeError("Amount must be positive");
    }

    if (amount > this.reservedQuantity) {
      throw new InvalidTransitionError(
        `Cannot cancel more reservations than reserved. Requested: ${amount.toString()}, Reserved: ${this.reservedQuantity.toString()}`,
      );
    }

    // Reducing reserved quantity reduces (or keeps same) the constraint sum.
    // Even if we are still over-committed after cancellation, this is an improvement (or stable) move.
    // So we allow it regardless of strict validation.
    return WishlistItem._createWithMode(
      {
        ...this.toProps(),
        reservedQuantity: this.reservedQuantity - amount,
      },
      ValidationMode.STRUCTURAL,
    );
  }

  /**
   * Purchases items, optionally consuming from the reserved stock.
   * Validates that the total stock (including reservations) is respected.
   * @param totalAmount - Total units to purchase (must be a positive integer).
   * @param consumeFromReserved - Units to take from the reserved pool (must be a non-negative integer).
   * @returns A new WishlistItem instance with updated quantities.
   * @throws {InvalidTransitionError} If consuming more from reserved than available/requested.
   * @throws {InsufficientStockError} If total stock is insufficient.
   */
  public purchase(
    totalAmount: number,
    consumeFromReserved: number,
  ): WishlistItem {
    if (!Number.isInteger(totalAmount)) {
      throw new InvalidAttributeError("Total amount must be an integer");
    }
    if (!Number.isInteger(consumeFromReserved)) {
      throw new InvalidAttributeError(
        "Consume from reserved must be an integer",
      );
    }
    if (totalAmount <= 0) {
      throw new InvalidAttributeError("Total amount must be positive");
    }
    if (consumeFromReserved < 0) {
      throw new InvalidAttributeError(
        "Consume from reserved must be non-negative",
      );
    }

    if (consumeFromReserved > this.reservedQuantity) {
      throw new InvalidTransitionError(
        `Cannot consume ${consumeFromReserved.toString()} from reserved. Only ${this.reservedQuantity.toString()} reserved.`,
      );
    }

    if (consumeFromReserved > totalAmount) {
      throw new InvalidTransitionError(
        "Cannot consume more from reserved than total purchase amount.",
      );
    }

    const neededFromAvailable = totalAmount - consumeFromReserved;
    // blocked if over-committed because available=0
    if (neededFromAvailable > this.availableQuantity && !this.isUnlimited) {
      throw new InsufficientStockError(
        `Insufficient stock. Needed ${neededFromAvailable.toString()} from available, but only had ${this.availableQuantity.toString()}`,
      );
    }

    return WishlistItem._createWithMode(
      {
        ...this.toProps(),
        purchasedQuantity: this.purchasedQuantity + totalAmount,
        reservedQuantity: this.reservedQuantity - consumeFromReserved,
      },
      ValidationMode.TRANSACTION,
    );
  }

  /**
   * Cancels a purchase, releasing the stock back to available.
   * Note: This does NOT automatically return items to the reserved state. If the user wants to re-reserve,
   * they must call `reserve()` explicitly after cancellation.
   * @param amountToCancel - Units to return (must be a positive integer).
   * @returns A new WishlistItem instance with updated quantities.
   * @throws {InvalidTransitionError} If cancelling more than purchased.
   */
  public cancelPurchase(amountToCancel: number): WishlistItem {
    if (!Number.isInteger(amountToCancel)) {
      throw new InvalidAttributeError("Amount to cancel must be an integer");
    }
    if (amountToCancel <= 0) {
      throw new InvalidAttributeError("Amount to cancel must be positive");
    }

    if (amountToCancel > this.purchasedQuantity) {
      throw new InvalidTransitionError(
        `Cannot cancel ${amountToCancel.toString()}. Only ${this.purchasedQuantity.toString()} purchased.`,
      );
    }

    // Reduces purchased quantity.
    // This always reduces commitment, so it's safe to skip inventory check (allow existing over-commit to persist/improve).
    return WishlistItem._createWithMode(
      {
        ...this.toProps(),
        purchasedQuantity: this.purchasedQuantity - amountToCancel,
      },
      ValidationMode.STRUCTURAL,
    );
  }

  /**
   * Checks equality based on domain identity (ID).
   * @param other - The other WishlistItem to compare.
   * @returns True if IDs match, false otherwise.
   */
  public equals(other: WishlistItem): boolean {
    return this.id === other.id;
  }

  private validate(mode: ValidationMode): void {
    // --- STRUCTURAL INTEGRITY (Always Enforced: ALL Modes) ---

    // ID Validation (UUID v4)
    if (!this.isValidUUID(this.id)) {
      throw new InvalidAttributeError("Invalid id: Must be a valid UUID v4");
    }

    if (!this.isValidUUID(this.wishlistId)) {
      throw new InvalidAttributeError(
        "Invalid wishlistId: Must be a valid UUID v4",
      );
    }

    // Name Structural Validation
    if (typeof this.name !== "string") {
      throw new InvalidAttributeError("Invalid name: Must be a string");
    }

    // Inventory Structural Validation
    if (!Number.isInteger(this.totalQuantity) || this.totalQuantity < 1) {
      throw new InvalidAttributeError(
        "Invalid totalQuantity: Must be an integer of at least 1",
      );
    }

    if (
      !Number.isInteger(this.reservedQuantity) ||
      !Number.isInteger(this.purchasedQuantity)
    ) {
      throw new InvalidAttributeError(
        "Invalid quantities: reserved and purchased must be integers",
      );
    }

    if (this.reservedQuantity < 0 || this.purchasedQuantity < 0) {
      throw new InvalidAttributeError("Quantities cannot be negative");
    }

    // Priority Structural Validation
    if (
      !Number.isInteger(this.priority) ||
      this.priority < Priority.LOW ||
      this.priority > Priority.URGENT
    ) {
      throw new InvalidAttributeError(
        "Invalid priority: Must be a valid Priority value",
      );
    }

    // --- BUSINESS RULES (Enforced: STRICT, EVOLUTIVE) ---
    if (mode === ValidationMode.STRICT || mode === ValidationMode.EVOLUTIVE) {
      // Name Validation
      if (this.name.length < 3 || this.name.length > 100) {
        throw new InvalidAttributeError(
          "Invalid name: Must be between 3 and 100 characters",
        );
      }

      // Description Validation
      if (this.description && this.description.length > 500) {
        throw new InvalidAttributeError(
          "Invalid description: Must be 500 characters or less",
        );
      }

      // URL Validation
      if (this.url && !this.isValidUrl(this.url)) {
        throw new InvalidAttributeError("Invalid url: Must be a valid URL");
      }
      if (this.imageUrl && !this.isValidUrl(this.imageUrl)) {
        throw new InvalidAttributeError(
          "Invalid imageUrl: Must be a valid URL",
        );
      }

      // Price & Currency Validation
      if (this.price !== undefined) {
        if (!Number.isFinite(this.price) || this.price < 0) {
          throw new InvalidAttributeError(
            "Invalid price: Must be a finite number greater than or equal to 0",
          );
        }
        if (!this.currency) {
          throw new InvalidAttributeError(
            "Invalid currency: Required when price is set",
          );
        }
      }
    }

    // --- INVENTORY INVARIANTS (Enforced: STRICT, TRANSACTION) ---
    if (mode === ValidationMode.STRICT || mode === ValidationMode.TRANSACTION) {
      if (!this.isUnlimited) {
        if (
          this.totalQuantity <
          this.reservedQuantity + this.purchasedQuantity
        ) {
          throw new InsufficientStockError(
            "Invariant violation: Total quantity must be greater than or equal to reserved + purchased",
          );
        }
      }
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private toProps(): WishlistItemProps {
    return {
      id: this.id,
      wishlistId: this.wishlistId,
      name: this.name,
      description: this.description,
      priority: this.priority,
      price: this.price,
      currency: this.currency,
      url: this.url,
      imageUrl: this.imageUrl,
      isUnlimited: this.isUnlimited,
      totalQuantity: this.totalQuantity,
      reservedQuantity: this.reservedQuantity,
      purchasedQuantity: this.purchasedQuantity,
    };
  }
}
