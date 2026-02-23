import type { Priority } from "../../value-objects";

/**
 * Input DTO for adding a new item to a wishlist.
 */
export interface AddWishlistItemInput {
  /**
   * UUID of the wishlist to which the item will be added.
   * Used as the aggregate root identifier.
   */
  wishlistId: string;
  /**
   * Name of the item.
   */
  name: string;
  /**
   * Optional description of the item.
   */
  description?: string;
  /**
   * Priority level.
   */
  priority: Priority;
  /**
   * Optional price.
   */
  price?: number;
  /**
   * Optional currency code (e.g., 'EUR').
   */
  currency?: string;
  /**
   * Optional URL to the product.
   */
  url?: string;
  /**
   * Optional image URL.
   */
  imageUrl?: string;
  /**
   * Whether the item has unlimited availability.
   */
  isUnlimited: boolean;
  /**
   * Total quantity available (if isUnlimited is false).
   */
  totalQuantity: number;
}

/**
 * Input DTO for updating an existing wishlist item.
 */
export interface UpdateWishlistItemInput {
  /**
   * UUID of the wishlist containing the item.
   * Used as the aggregate root identifier.
   */
  wishlistId: string;
  /**
   * UUID of the item to update.
   */
  itemId: string;
  /**
   * Optional name update.
   */
  name?: string;
  /**
   * Optional description update.
   */
  description?: string;
  /**
   * Optional priority update.
   */
  priority?: Priority;
  /**
   * Optional price update.
   */
  price?: number;
  /**
   * Optional currency update.
   */
  currency?: string;
  /**
   * Optional URL update.
   */
  url?: string;
  /**
   * Optional image URL update.
   */
  imageUrl?: string;
  /**
   * Optional availability type update.
   */
  isUnlimited?: boolean;
  /**
   * Optional total quantity update.
   */
  totalQuantity?: number;
}

/**
 * Input DTO for removing an item from a wishlist.
 */
export interface RemoveWishlistItemInput {
  /**
   * UUID of the wishlist containing the item.
   * Used as the aggregate root identifier.
   */
  wishlistId: string;
  /**
   * UUID of the item to remove.
   */
  itemId: string;
}
