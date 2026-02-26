import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { UpdateWishlistInput, WishlistOutput } from "./dtos";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";
import { WishlistNotFoundError } from "../errors/domain-errors";

/**
 * Use case for updating an existing wishlist.
 */
export class UpdateWishlistUseCase {
  /**
   * Initializes the use case with dependencies.
   *
   * @param wishlistRepository - The repository for persisting wishlists.
   */
  constructor(private readonly wishlistRepository: WishlistRepository) {}

  /**
   * Executes the use case to update and save an existing wishlist.
   *
   * @param input - The data for updating the wishlist.
   * @returns A Promise that resolves to the updated WishlistOutput DTO.
   * @throws {WishlistNotFoundError} If the wishlist to update is not found.
   */
  async execute(input: UpdateWishlistInput): Promise<WishlistOutput> {
    const wishlist = await this.wishlistRepository.findById(input.id);

    if (!wishlist) {
      throw new WishlistNotFoundError(input.id);
    }

    const updatedWishlist = wishlist.update({
      title: input.title,
      description: input.description,
      visibility: input.visibility,
      participation: input.participation,
    });

    await this.wishlistRepository.save(updatedWishlist);

    return WishlistOutputMapper.toDTO(updatedWishlist);
  }
}
