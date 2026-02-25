import type { RemoveWishlistItemInput } from "./dtos/wishlist-item-actions.dto";
import type { WishlistOutput } from "./dtos/get-wishlist.dto";
import type { WishlistRepository } from "../repositories/wishlist.repository";

/**
 * Use case for removing an item from a wishlist.
 *
 * @throws {WishlistNotFoundError} If the wishlist is not found.
 */
export class RemoveWishlistItemUseCase {
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  /**
   * Executes the use case to remove an item.
   *
   * @param input - The data for removing the item.
   * @returns A Promise that resolves to the updated WishlistOutput DTO.
   */
  async execute(_input: RemoveWishlistItemInput): Promise<WishlistOutput> {
    throw new Error("Method not implemented.");
  }
}
