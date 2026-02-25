import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";
import { WishlistNotFoundError } from "../errors/domain-errors";
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
  async execute(input: RemoveWishlistItemInput): Promise<WishlistOutput> {
    const wishlist = await this.wishlistRepository.findById(input.wishlistId);

    if (!wishlist) {
      throw new WishlistNotFoundError(input.wishlistId);
    }

    const { wishlist: updatedWishlist, removedItem } = wishlist.removeItem(
      input.itemId,
    );

    if (removedItem) {
      await this.wishlistRepository.save(updatedWishlist);
    }

    return WishlistOutputMapper.toDTO(updatedWishlist);
  }
}
