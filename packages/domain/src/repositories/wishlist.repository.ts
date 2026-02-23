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

  /**
   * Persists a wishlist aggregate.
   * @param wishlist The wishlist to save.
   * @returns A Promise that resolves when the wishlist is saved.
   */
  save(wishlist: Wishlist): Promise<void>;

  /**
   * Deletes a wishlist by its unique identifier.
   * @param id The UUID of the wishlist to delete.
   * @returns A Promise that resolves when the wishlist is deleted.
   */
  delete(id: string): Promise<void>;
}
