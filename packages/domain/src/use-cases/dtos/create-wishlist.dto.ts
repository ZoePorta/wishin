import type { Visibility, Participation } from "../../value-objects";

/**
 * Input DTO for creating a new wishlist.
 */
export interface CreateWishlistInput {
  /**
   * Title of the wishlist (3-100 characters).
   */
  title: string;
  /**
   * Optional description (up to 500 characters).
   */
  description?: string;
  /**
   * UUID of the owner.
   */
  ownerId: string;
  /**
   * Visibility settings.
   */
  visibility: Visibility;
  /**
   * Participation settings.
   */
  participation: Participation;
}
