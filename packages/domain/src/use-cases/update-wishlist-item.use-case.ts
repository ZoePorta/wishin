import { WishlistOutputMapper } from "./mappers/wishlist-output.mapper";
import {
  WishlistNotFoundError,
  WishlistItemNotFoundError,
} from "../errors/domain-errors";
import type { UpdateWishlistItemInput } from "./dtos/wishlist-item-actions.dto";
import type { WishlistOutput } from "./dtos/get-wishlist.dto";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import type { TransactionRepository } from "../repositories/transaction.repository";
import type { WishlistItem } from "../entities/wishlist-item";

/**
 * Use case for updating an existing wishlist item.
 *
 * @throws {WishlistNotFoundError} If the wishlist is not found.
 * @throws {WishlistItemNotFoundError} If the item is not found.
 */
export class UpdateWishlistItemUseCase {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  /**
   * Executes the use case to update an existing item.
   *
   * @param input - The data for updating the item.
   * @returns A Promise that resolves to the updated WishlistOutput DTO.
   */
  async execute(input: UpdateWishlistItemInput): Promise<WishlistOutput> {
    const wishlist = await this.wishlistRepository.findById(input.wishlistId);

    if (!wishlist) {
      throw new WishlistNotFoundError(input.wishlistId);
    }

    const originalItem = wishlist.items.find(
      (item) => item.id === input.itemId,
    );
    if (!originalItem) {
      throw new WishlistItemNotFoundError(input.itemId);
    }

    const updatedWishlist = wishlist.updateItem(input.itemId, {
      name: input.name,
      description: input.description,
      priority: input.priority,
      price: input.price,
      currency: input.currency,
      url: input.url,
      imageUrl: input.imageUrl,
      isUnlimited: input.isUnlimited,
      totalQuantity: input.totalQuantity,
    });

    const updatedItem = updatedWishlist.items.find(
      (item: WishlistItem) => item.id === input.itemId,
    );

    // ADR 019: If reservations were pruned (reservedQuantity set to 0),
    // transition all related RESERVED transactions to CANCELLED_BY_OWNER.
    if (
      originalItem.reservedQuantity > 0 &&
      updatedItem?.reservedQuantity === 0
    ) {
      await this.transactionRepository.cancelByItemId(input.itemId);
    }

    await this.wishlistRepository.save(updatedWishlist);

    return WishlistOutputMapper.toDTO(updatedWishlist);
  }
}
