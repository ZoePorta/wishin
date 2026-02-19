import { Wishlist } from "../../aggregates/wishlist";
import { WishlistOutput } from "../dtos/get-wishlist.dto";

/**
 * Mapper to convert Wishlist aggregates to WishlistOutput DTOs.
 */
export const GetWishlistMapper = {
  /**
   * Maps a Wishlist aggregate to a WishlistOutput DTO.
   *
   * @param wishlist - The Wishlist aggregate to map.
   * @returns The mapped WishlistOutput DTO.
   */
  toOutput(wishlist: Wishlist): WishlistOutput {
    return {
      id: wishlist.id,
      title: wishlist.title,
      description: wishlist.description,
      ownerId: wishlist.ownerId,
      visibility: wishlist.visibility,
      participation: wishlist.participation,
      createdAt: wishlist.createdAt.toISOString(),
      updatedAt: wishlist.updatedAt.toISOString(),
      items: wishlist.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        url: item.url,
        price: item.price,
        currency: item.currency,
        priority: item.priority.toString(),
        imageUrl: item.imageUrl,
        totalQuantity: item.totalQuantity,
        reservedQuantity: item.reservedQuantity,
        purchasedQuantity: item.purchasedQuantity,
        availableQuantity: item.availableQuantity,
        isUnlimited: item.isUnlimited,
      })),
    };
  },
};
