import type { Models } from "react-native-appwrite";
import { WishlistItem, Priority } from "@wishin/domain";

/**
 * Interface representing the Appwrite document structure for a WishlistItem.
 */
interface WishlistItemDocument extends Models.Document {
  wishlistId: string;
  name: string;
  description?: string | null;
  priority: Priority;
  price?: number | null;
  currency?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  isUnlimited: boolean;
  totalQuantity: number;
  reservedQuantity: number;
  purchasedQuantity: number;
}

/**
 * Interface representing the plain object for Appwrite persistence (excluding document metadata).
 */
export interface WishlistItemPersistence {
  wishlistId: string;
  name: string;
  description?: string;
  priority: Priority;
  price?: number;
  currency?: string;
  url?: string;
  imageUrl?: string | null;
  isUnlimited: boolean;
  totalQuantity: number;
  reservedQuantity: number;
  purchasedQuantity: number;
}

/**
 * Mapper to convert between Appwrite documents and WishlistItem domain entities.
 */
export const WishlistItemMapper = {
  /**
   * Converts a WishlistItem domain entity to a plain object for Appwrite persistence.
   * @param item - The WishlistItem domain entity.
   * @returns A plain object compatible with Appwrite's wishlist_items collection.
   */
  toPersistence(item: WishlistItem): WishlistItemPersistence {
    const props = item.toProps();
    return {
      wishlistId: props.wishlistId,
      name: props.name,
      description: props.description,
      priority: props.priority,
      price: props.price,
      currency: props.currency,
      url: props.url,
      imageUrl: props.imageUrl,
      isUnlimited: props.isUnlimited,
      totalQuantity: props.totalQuantity,
      reservedQuantity: props.reservedQuantity,
      purchasedQuantity: props.purchasedQuantity,
    };
  },

  toDomain(doc: Models.Document): WishlistItem {
    const data = doc as WishlistItemDocument;
    const priorityValue = Number(data.priority as unknown);
    const priority = (
      Object.prototype.hasOwnProperty.call(Priority, priorityValue)
        ? priorityValue
        : Priority.MEDIUM
    ) as Priority;

    return WishlistItem.reconstitute({
      id: doc.$id,
      wishlistId: data.wishlistId,
      name: data.name,
      description: data.description ?? undefined,
      priority,
      price: data.price ?? undefined,
      currency: data.currency ?? undefined,
      url: data.url ?? undefined,
      imageUrl: data.imageUrl ?? undefined,
      isUnlimited: data.isUnlimited,
      totalQuantity: data.totalQuantity,
      reservedQuantity: data.reservedQuantity,
      purchasedQuantity: data.purchasedQuantity,
    });
  },
};
