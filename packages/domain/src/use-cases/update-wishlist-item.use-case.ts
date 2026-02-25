import type { UpdateWishlistItemInput } from "./dtos/wishlist-item-actions.dto";
import type { WishlistOutput } from "./dtos/get-wishlist.dto";
import type { WishlistRepository } from "../repositories/wishlist.repository";

/**
 * Use case for updating an existing wishlist item.
 *
 * @throws {WishlistNotFoundError} If the wishlist is not found.
 * @throws {WishlistItemNotFoundError} If the item is not found.
 */
export class UpdateWishlistItemUseCase {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  /**
   * Executes the use case to update an existing item.
   *
   * @param input - The data for updating the item.
   * @returns A Promise that resolves to the updated WishlistOutput DTO.
   */
  async execute(_input: UpdateWishlistItemInput): Promise<WishlistOutput> {
    throw new Error("Method not implemented.");
  }
}
