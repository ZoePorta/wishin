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

  constructor(props: WishlistItemProps) {
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
  }

  public static create(props: WishlistItemProps): WishlistItem {
    // Logic not implemented purposefully to fail tests
    return new WishlistItem(props);
  }

  public get availableQuantity(): number {
    return -1; // Wrong implementation to fail tests
  }

  public reserve(_amount: number): WishlistItem {
    throw new Error("Not Implemented");
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
}
