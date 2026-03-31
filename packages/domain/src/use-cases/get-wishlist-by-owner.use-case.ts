import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { GetWishlistByOwnerInput, WishlistOutput } from "./dtos";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";
import { ProfileOutputMapper } from "./mappers/profile-output.mapper";

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
   * @param profileRepository - The repository for fetching owner profiles.
   */
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

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
    const wishlist = wishlists[0];
    const ownerProfile = await this.profileRepository.findById(
      wishlist.ownerId,
    );

    return WishlistOutputMapper.toDTO(
      wishlist,
      ownerProfile ? ProfileOutputMapper.toDTO(ownerProfile) : undefined,
    );
  }
}
