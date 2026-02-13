import { Wishlist } from "../aggregates/wishlist";

/**
 * Repository interface for Wishlist aggregate.
 */
export interface WishlistRepository {
  /**
   * Finds a wishlist by its unique identifier.
   * @param id The UUID of the wishlist.
   * @returns A Promise that resolves to the Wishlist aggregate or null if not found.
   */
  findById(id: string): Promise<Wishlist | null>;
}
