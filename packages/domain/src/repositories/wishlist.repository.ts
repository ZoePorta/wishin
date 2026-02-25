import type { Wishlist } from "../aggregates/wishlist";

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
   * Finds a wishlist by its owner's identifier.
   * @param ownerId The identifier of the owner (UUID or Appwrite ID).
   * @returns A list of wishlists owned by the user.
   */
  findByOwnerId(ownerId: string): Promise<Wishlist[]>;

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
  /**
   * Retrieves the current user's unique identifier.
   * @returns A Promise that resolves to the current user ID.
   */
  getCurrentUserId(): Promise<string>;
}
