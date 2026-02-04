import {
  InsufficientStockError,
  InvalidAttributeError,
} from "../errors/domain-errors";

export interface WishlistItemProps {
  id: string;
  wishlistId: string;
  name: string;
  description?: string;
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
  public readonly price?: number;
  public readonly currency?: string;
  public readonly url?: string;
  public readonly imageUrl?: string;
  public readonly isUnlimited: boolean;
  public readonly totalQuantity: number;
  public readonly reservedQuantity: number;
  public readonly purchasedQuantity: number;

  private constructor(props: WishlistItemProps) {
    this.id = props.id;
    this.wishlistId = props.wishlistId;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.currency = props.currency;
    this.url = props.url;
    this.imageUrl = props.imageUrl;
    this.isUnlimited = props.isUnlimited ?? false;
    this.totalQuantity = props.totalQuantity;
    this.reservedQuantity = props.reservedQuantity;
    this.purchasedQuantity = props.purchasedQuantity;

    this.validate();
  }

  public static create(props: WishlistItemProps): WishlistItem {
    const sanitizedProps = {
      ...props,
      name: props.name.trim(),
    };
    return new WishlistItem(sanitizedProps);
  }

  public get availableQuantity(): number {
    return (
      this.totalQuantity - (this.reservedQuantity + this.purchasedQuantity)
    );
  }

  public reserve(amount: number): WishlistItem {
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

  public cancelReservation(_amount: number): WishlistItem {
    throw new Error("Not Implemented");
  }

  public purchase(
    _totalAmount: number,
    _consumeFromReserved: number,
  ): WishlistItem {
    throw new Error("Not Implemented");
  }

  private validate(): void {
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

    // Price & Currency Validation
    if (this.price !== undefined) {
      if (this.price < 0) {
        throw new InvalidAttributeError(
          "Invalid price: Must be greater than or equal to 0",
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
      if (this.totalQuantity < 1) {
        throw new InvalidAttributeError(
          "Invalid totalQuantity: Must be at least 1",
        );
      }
    }

    if (this.reservedQuantity < 0 || this.purchasedQuantity < 0) {
      throw new InvalidAttributeError("Quantities cannot be negative");
    }

    // Domain Invariant: Inventory Integrity
    if (!this.isUnlimited) {
      if (this.totalQuantity < this.reservedQuantity + this.purchasedQuantity) {
        throw new InsufficientStockError(
          "Invariant violation: Total quantity must be greater than or equal to reserved + purchased",
        );
      }
    }
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private toProps(): WishlistItemProps {
    return {
      id: this.id,
      wishlistId: this.wishlistId,
      name: this.name,
      description: this.description,
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
