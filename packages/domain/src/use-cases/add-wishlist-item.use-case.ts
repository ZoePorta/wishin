import { WishlistItem } from "../entities/wishlist-item";
import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";
import type { AddWishlistItemInput } from "./dtos/wishlist-item-actions.dto";
import type { WishlistOutput } from "./dtos/get-wishlist.dto";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import { WishlistNotFoundError } from "../errors/domain-errors";

/**
 * Use case for adding a new item to a wishlist.
 *
 * This class coordinates the retrieval of a wishlist aggregate,
 * adding a new item to it, and persisting the changes via the repository.
 *
 * @throws {WishlistNotFoundError} If the wishlist is not found.
 */
export class AddWishlistItemUseCase {
  /**
   * Initializes the use case with dependencies.
   *
   * @param wishlistRepository - The repository for persisting wishlists.
   * @param uuidFn - Optional factory function for generating item IDs.
   */
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly uuidFn: () => string = () =>
      globalThis.crypto.randomUUID(),
  ) {}

  /**
   * Executes the use case to add a new item to a wishlist.
   *
   * @param input - The data for adding the item.
   * @returns A Promise that resolves to the updated WishlistOutput DTO.
   * @throws {Error} If the wishlist is not found.
   */
  async execute(input: AddWishlistItemInput): Promise<WishlistOutput> {
    const wishlist = await this.wishlistRepository.findById(input.wishlistId);

    if (!wishlist) {
      throw new WishlistNotFoundError(input.wishlistId);
    }

    const item = WishlistItem.create({
      id: this.uuidFn(),
      wishlistId: wishlist.id,
      name: input.name,
      description: input.description,
      priority: input.priority,
      price: input.price,
      currency: input.currency,
      url: input.url,
      imageUrl: input.imageUrl,
      isUnlimited: input.isUnlimited,
      totalQuantity: input.totalQuantity,
      reservedQuantity: 0,
      purchasedQuantity: 0,
    });

    const updatedWishlist = wishlist.addItem(item);

    await this.wishlistRepository.save(updatedWishlist);

    return WishlistOutputMapper.toDTO(updatedWishlist);
  }
}
