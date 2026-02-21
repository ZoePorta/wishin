import type { Priority } from "../../value-objects/priority";

/**
 * Input DTO for fetching a wishlist.
 */
export interface GetWishlistInput {
  /**
   * Unique identifier (UUID v4) of the wishlist.
   */
  id: string;
}

/**
 * Output DTO for individual wishlist items.
 */
export interface WishlistItemOutput {
  id: string;
  name: string;
  description?: string;
  url?: string;
  price?: number;
  currency?: string;
  priority: Priority;
  imageUrl?: string;
  totalQuantity: number;
  reservedQuantity: number;
  purchasedQuantity: number;
  availableQuantity: number;
  isUnlimited: boolean;
}

/**
 * Output DTO for a wishlist.
 */
export interface WishlistOutput {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  visibility: string;
  participation: string;
  items: WishlistItemOutput[];
  createdAt: string;
  updatedAt: string;
}
