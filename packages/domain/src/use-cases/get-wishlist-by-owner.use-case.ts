import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { GetWishlistByOwnerInput, WishlistOutput } from "./dtos";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";

/**
 * Use case for retrieving a wishlist by its owner's ID.
 *
 * This coordinates retrieval from the repository and mapping to a DTO.
 */
export class GetWishlistByOwnerUseCase {
  /**
   * Initializes the use case with dependencies.
   *
   * @param wishlistRepository - The repository for fetching wishlists.
   */
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  /**
   * Executes the use case to find a wishlist by owner ID.
   *
   * @param input - The data containing the ownerId.
   * @returns A Promise that resolves to the WishlistOutput DTO or null if not found.
   */
  async execute(
    input: GetWishlistByOwnerInput,
  ): Promise<WishlistOutput | null> {
    // For MVP, we still assume a single wishlist per user or just return the first one found
    const wishlists = await this.wishlistRepository.findByOwnerId(
      input.ownerId,
    );

    if (wishlists.length === 0) {
      return null;
    }

    // Returning the first one as per current MVP rules
    return WishlistOutputMapper.toDTO(wishlists[0]);
  }
}
