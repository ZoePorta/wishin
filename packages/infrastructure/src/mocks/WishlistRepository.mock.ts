import type { Wishlist } from "@wishin/domain/aggregates/wishlist";
import type { WishlistRepository } from "@wishin/domain/repositories/wishlist.repository";
import type { UserRepository } from "@wishin/domain/repositories/user.repository";
import { MOCK_WISHLIST_DATA, reconstituteMockWishlist } from "./wishlist.data";

/**
 * Repository to provide mock wishlist data for development and testing.
 * Implements WishlistRepository and UserRepository to allow easy swapping with a real repository.
 */
export class MockWishlistRepository
  implements WishlistRepository, UserRepository
{
  private readonly delayMs: number;

  /**
   * Creates an instance of MockWishlistRepository.
   *
   * @param delayMs - Simulated network/processing delay in milliseconds (default: 500).
   * @returns void
   */
  constructor(delayMs = 500) {
    this.delayMs = delayMs;
  }

  /**
   * Retrieves a wishlist by its ID.
   *
   * @param id - The unique identifier of the wishlist to retrieve.
   * @returns A promise that resolves to the Wishlist aggregate if found, or null if not found.
   */
  async findById(id: string): Promise<Wishlist | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    if (id === MOCK_WISHLIST_DATA.id) {
      return reconstituteMockWishlist();
    }
    return null;
  }

  /**
   * Retrieves a wishlist by its owner's identifier.
   *
   * @param ownerId - The identifier of the owner.
   * @returns A promise that resolves to an array of Wishlists.
   */
  async findByOwnerId(ownerId: string): Promise<Wishlist[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    // For mock purposes, we return our one mock wishlist only if ownerId matches
    if (ownerId === MOCK_WISHLIST_DATA.ownerId) {
      return [reconstituteMockWishlist()];
    }
    return [];
  }

  /**
   * Retrieves the current user's unique identifier.
   *
   * @returns A promise that resolves to the current user ID.
   */
  async getCurrentUserId(): Promise<string> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return "user-123";
  }

  /**
   * Persists a wishlist aggregate.
   *
   * @param wishlist - The wishlist to save.
   * @returns A promise that resolves when the wishlist is saved.
   */
  async save(wishlist: Wishlist): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    console.warn(`[MockWishlistRepository] Saved wishlist: ${wishlist.id}`);
  }

  /**
   * Deletes a wishlist by its ID.
   *
   * @param id - The unique identifier of the wishlist to delete.
   * @returns A promise that resolves when the wishlist is deleted.
   */
  async delete(id: string): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    console.warn(`[MockWishlistRepository] Deleted wishlist: ${id}`);
  }
}
