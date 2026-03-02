import type { Models } from "appwrite";
import { Wishlist, Visibility, Participation } from "@wishin/domain";
import type { WishlistItem } from "@wishin/domain";

/**
 * Interface representing the Appwrite document structure for a Wishlist.
 */
interface WishlistDocument extends Models.Document {
  ownerId: string;
  title: string;
  description: string | null;
  visibility: Visibility | string | null;
  participation: Participation | string | null;
}

/**
 * Mapper to convert between Appwrite documents and Wishlist aggregate roots.
 */
export const WishlistMapper = {
  /**
   * Converts a Wishlist aggregate root to a plain object for Appwrite persistence.
   * Note: This does not include items as they are stored in a separate collection.
   * @param wishlist - The Wishlist aggregate root.
   * @returns A plain object compatible with Appwrite's wishlists collection.
   */
  toPersistence(wishlist: Wishlist) {
    const props = wishlist.toProps();
    return {
      ownerId: props.ownerId,
      title: props.title,
      description: props.description,
      visibility: props.visibility,
      participation: props.participation,
    };
  },

  /**
   * Converts an Appwrite document and a list of items to a Wishlist aggregate root.
   * @param doc - The Appwrite document from the wishlists collection.
   * @param items - The list of WishlistItem entities belonging to this wishlist.
   * @returns A reconstituted Wishlist aggregate root.
   */
  toDomain(doc: Models.Document, items: WishlistItem[]): Wishlist {
    const data = doc as WishlistDocument;
    return Wishlist.reconstitute({
      id: doc.$id,
      ownerId: data.ownerId,
      title: data.title,
      description: data.description ?? undefined,
      visibility:
        (data.visibility?.toUpperCase() as Visibility | undefined) ??
        Visibility.LINK,
      participation:
        (data.participation?.toUpperCase() as Participation | undefined) ??
        Participation.ANYONE,
      items: items.map((item) => item.toProps()),
      createdAt: new Date(doc.$createdAt),
      updatedAt: new Date(doc.$updatedAt),
    });
  },
};
