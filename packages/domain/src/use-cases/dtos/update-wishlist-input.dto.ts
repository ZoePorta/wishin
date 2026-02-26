import type { Visibility, Participation } from "../../value-objects";

/**
 * Input DTO for updating an existing wishlist.
 */
export interface UpdateWishlistInput {
  /**
   * UUID of the wishlist to update.
   */
  id: string;
  /**
   * New title of the wishlist (3-100 characters).
   */
  title?: string;
  /**
   * New optional description (up to 500 characters).
   */
  description?: string;
  /**
   * New visibility settings.
   */
  visibility?: Visibility;
  /**
   * New participation settings.
   */
  participation?: Participation;
}
