import { Wishlist } from "@wishin/domain/aggregates/wishlist";
import { WishlistRepository } from "@wishin/domain/repositories/wishlist.repository";
import { MOCK_WISHLIST_DATA, reconstituteMockWishlist } from "./wishlist.data";

/**
 * Service to provide mock wishlist data for development and testing.
 * Implements WishlistRepository to allow easy swapping with a real repository.
 */
export class MockWishlistRepository implements WishlistRepository {
  /**
   * Retrieves a wishlist by its ID.
   *
   * @param id - The unique identifier of the wishlist to retrieve.
   * @returns A promise that resolves to the Wishlist aggregate if found, or null if not found.
   */
  async findById(id: string): Promise<Wishlist | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (id === MOCK_WISHLIST_DATA.id) {
      return reconstituteMockWishlist();
    }
    return null;
  }
}
