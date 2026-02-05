import {
  InsufficientStockError,
  InvalidAttributeError,
  InvalidTransitionError,
} from "../errors/domain-errors";

export enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
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

  private constructor(
    props: WishlistItemProps,
    options?: { skipInventoryCheck?: boolean },
  ) {
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

    this.validate(options?.skipInventoryCheck);
  }

  /**
   * Reconstitutes a WishlistItem from persistence (database), bypassing validation checks
   * that might fail due to legacy data or allowed transient states (e.g. over-commitment).
   * @param props - The properties to restore.
   * @returns A WishlistItem instance.
   */
  public static reconstitute(props: WishlistItemProps): WishlistItem {
    return new WishlistItem(props, { skipInventoryCheck: true });
  }

  /**
   * Factory method to create a new WishlistItem instance.
   * Enforces trimming of the name property.
   * @param props - The properties for the new item.
   * @param options - Configuration options.
   * @returns A new valid WishlistItem instance.
   * @throws {InvalidAttributeError} If validation fails.
   */
  public static create(
    props: WishlistItemProps,
    options?: { skipInventoryCheck?: boolean },
  ): WishlistItem {
    const sanitizedProps = {
      ...props,
      name: props.name.trim(),
    };
    return new WishlistItem(sanitizedProps, options);
  }

  /**
   * Updates the mutable properties of the WishlistItem.
   * @param props - The properties to update.
   * @returns A new WishlistItem instance with updated properties.
   * @throws {InvalidAttributeError} If validation fails.
   */
  public update(props: Partial<WishlistItemProps>): WishlistItem {
    if (props.id && props.id !== this.id) {
      throw new InvalidAttributeError("Cannot update entity ID");
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

    // Reservation Pruning Logic:
    // Only applied if totalQuantity is strictly being REDUCED.
    let newReservedQuantity = currentProps.reservedQuantity;

    if (
      props.totalQuantity !== undefined &&
      props.totalQuantity < currentProps.totalQuantity
    ) {
      const currentPurchased = currentProps.purchasedQuantity;
      const maxAllowedReserved = Math.max(
        0,
        props.totalQuantity - currentPurchased,
      );
      newReservedQuantity = Math.min(newReservedQuantity, maxAllowedReserved);
    }

    return WishlistItem.create(
      {
        ...currentProps,
        ...props, // This applies other updates (name, price, etc.)
        id: this.id, // Ensure ID preserves identity
        reservedQuantity: newReservedQuantity, // Apply potentially pruned value
        // purchasedQuantity remains untouched as we threw if it was in props
      } as WishlistItemProps,
      { skipInventoryCheck: true },
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

    return new WishlistItem({
      ...this.toProps(),
      reservedQuantity: this.reservedQuantity + amount,
    });
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
    return new WishlistItem(
      {
        ...this.toProps(),
        reservedQuantity: this.reservedQuantity - amount,
      },
      { skipInventoryCheck: true },
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

    return new WishlistItem({
      ...this.toProps(),
      purchasedQuantity: this.purchasedQuantity + totalAmount,
      reservedQuantity: this.reservedQuantity - consumeFromReserved,
    });
  }

  /**
   * Cancels a purchase, optionally returning some items to the reserved state.
   * ensures valid state transitions for purchased and reserved quantities.
   * @param amountToCancel - Units to return (must be a positive integer).
   * @param amountToRestockAsReserved - Units to move to reserved (must be a non-negative integer).
   * @returns A new WishlistItem instance with updated quantities.
   * @throws {InvalidTransitionError} If cancelling more than purchased or restocking invalid amounts.
   */
  public cancelPurchase(
    amountToCancel: number,
    amountToRestockAsReserved: number,
  ): WishlistItem {
    if (!Number.isInteger(amountToCancel)) {
      throw new InvalidAttributeError("Amount to cancel must be an integer");
    }
    if (!Number.isInteger(amountToRestockAsReserved)) {
      throw new InvalidAttributeError(
        "Amount to restock as reserved must be an integer",
      );
    }
    if (amountToCancel <= 0) {
      throw new InvalidAttributeError("Amount to cancel must be positive");
    }
    if (amountToRestockAsReserved < 0) {
      throw new InvalidAttributeError(
        "Amount to restock as reserved must be non-negative",
      );
    }

    if (amountToCancel > this.purchasedQuantity) {
      throw new InvalidTransitionError(
        `Cannot cancel ${amountToCancel.toString()}. Only ${this.purchasedQuantity.toString()} purchased.`,
      );
    }

    if (amountToRestockAsReserved > amountToCancel) {
      throw new InvalidTransitionError(
        `Cannot restock ${amountToRestockAsReserved.toString()} as reserved. Only cancelling ${amountToCancel.toString()}.`,
      );
    }

    // Step 1: Reduce purchased quantity.
    // This always reduces commitment, so it's safe to skip inventory check (allow existing over-commit to persist/improve).
    const intermediateItem = new WishlistItem(
      {
        ...this.toProps(),
        purchasedQuantity: this.purchasedQuantity - amountToCancel,
      },
      { skipInventoryCheck: true },
    );

    // Step 2: Restock as reserved if needed.
    // This uses the strict reserve method, which checks eligibility against current availability.
    if (amountToRestockAsReserved > 0) {
      return intermediateItem.reserve(amountToRestockAsReserved);
    }

    return intermediateItem;
  }

  /**
   * Checks equality based on domain identity (ID).
   * @param other - The other WishlistItem to compare.
   * @returns True if IDs match, false otherwise.
   */
  public equals(other: WishlistItem): boolean {
    return this.id === other.id;
  }

  private validate(skipInventoryCheck = false): void {
    // ID Validation (UUID v4)
    if (!this.isValidUUID(this.id)) {
      throw new InvalidAttributeError("Invalid id: Must be a valid UUID v4");
    }

    if (!this.isValidUUID(this.wishlistId)) {
      throw new InvalidAttributeError(
        "Invalid wishlistId: Must be a valid UUID v4",
      );
    }

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
      throw new InvalidAttributeError("Invalid imageUrl: Must be a valid URL");
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

    // Inventory Validation
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

    // Domain Invariant: Inventory Integrity
    if (!this.isUnlimited && !skipInventoryCheck) {
      if (this.totalQuantity < this.reservedQuantity + this.purchasedQuantity) {
        throw new InsufficientStockError(
          "Invariant violation: Total quantity must be greater than or equal to reserved + purchased",
        );
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
