import { Wishlist } from "../aggregates/wishlist";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { CreateWishlistInput, WishlistOutput } from "./dtos";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";

/**
 * Use case for creating a new wishlist.
 *
 * This class coordinates the domain logic to create a wishlist aggregate,
 * persists it via the repository, and returns a sanitized DTO.
 */
export class CreateWishlistUseCase {
  /**
   * Initializes the use case with dependencies.
   *
   * @param wishlistRepository - The repository for persisting wishlists.
   * @param uuidFn - Optional factory function for generating IDs (defaults to crypto.randomUUID).
   */
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly uuidFn: () => string = () =>
      globalThis.crypto.randomUUID(),
  ) {}

  /**
   * Executes the use case to create and save a new wishlist.
   *
   * @param input - The data for creating the wishlist.
   * @returns A Promise that resolves to the created WishlistOutput DTO.
   */
  async execute(input: CreateWishlistInput): Promise<WishlistOutput> {
    const wishlist = Wishlist.create({
      id: this.uuidFn(),
      ownerId: input.ownerId,
      title: input.title,
      description: input.description,
      visibility: input.visibility,
      participation: input.participation,
    });

    await this.wishlistRepository.save(wishlist);

    return WishlistOutputMapper.toDTO(wishlist);
  }
}
