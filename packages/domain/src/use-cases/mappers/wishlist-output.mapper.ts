import type { Wishlist } from "../../aggregates/wishlist";
import type { Profile } from "../../aggregates/profile";
import { WishlistOutput } from "../dtos/get-wishlist.dto";

/**
 * Mapper to convert Wishlist aggregate to WishlistOutput DTO.
 */
export const WishlistOutputMapper = {
  /**
   * Converts a Wishlist aggregate to a WishlistOutput DTO.
   * @param wishlist - The Wishlist aggregate root.
   * @param ownerProfile - Optional owner profile to include in the DTO.
   * @returns The mapped WishlistOutput DTO.
   */
  toDTO(wishlist: Wishlist, ownerProfile?: Profile): WishlistOutput {
    const props = wishlist.toProps();
    return {
      id: props.id,
      title: props.title,
      description: props.description,
      ownerId: props.ownerId,
      ownerName: ownerProfile?.username,
      ownerAvatarUrl: ownerProfile?.imageUrl,
      visibility: props.visibility,
      participation: props.participation,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
      items: props.items.map((item) => {
        const itemProps = item.toProps();
        return {
          id: itemProps.id,
          name: itemProps.name,
          description: itemProps.description,
          url: itemProps.url,
          price: itemProps.price,
          currency: itemProps.currency,
          priority: itemProps.priority,
          imageUrl: itemProps.imageUrl ?? null,
          totalQuantity: itemProps.totalQuantity,
          reservedQuantity: itemProps.reservedQuantity,
          purchasedQuantity: itemProps.purchasedQuantity,
          availableQuantity: item.availableQuantity,
          isUnlimited: itemProps.isUnlimited,
        };
      }),
    };
  },
};
