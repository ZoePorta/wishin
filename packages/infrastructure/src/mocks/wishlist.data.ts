import { Visibility } from "@wishin/domain/value-objects/visibility";
import { Participation } from "@wishin/domain/value-objects/participation";
import { Priority } from "@wishin/domain/value-objects/priority";
import { Wishlist } from "@wishin/domain/aggregates/wishlist";
import type { WishlistOutput } from "@wishin/domain/use-cases/dtos/get-wishlist.dto";

/**
 * Mock data following the WishlistOutput DTO structure.
 */
export const MOCK_WISHLIST_DATA: WishlistOutput = {
  id: "29b8d178-0412-4236-b27e-bdc9a02c8faf",
  title: "My Birthday Wishlist",
  description: "Things I would love to receive for my birthday! 🎉",
  ownerId: "277e1360-9395-4b7d-a048-79eb5281b549",
  visibility: Visibility.LINK,
  participation: Participation.ANYONE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [
    {
      id: "ec6e0f25-4cea-4e60-b371-6658d308ec77",
      name: "Noise Cancelling Headphones",
      description: "Sony WH-1000XM5, preferably in black.",
      price: 348.0,
      currency: "USD",
      url: "https://example.com/headphones",
      imageUrl:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aGVhZHBob25lc3xlbnwwfHwwfHx8MA%3D%3D",
      priority: Priority.HIGH.toString(),
      totalQuantity: 1,
      reservedQuantity: 0,
      purchasedQuantity: 0,
      availableQuantity: 1,
      isUnlimited: false,
    },
    {
      id: "3ab80721-3a29-4338-8e6e-c7af81416279",
      name: "Mechanical Keyboard",
      description: "Keychron K2 Pro with brown switches.",
      price: 99.0,
      currency: "USD",
      url: "https://example.com/keyboard",
      priority: Priority.MEDIUM.toString(),
      totalQuantity: 1,
      reservedQuantity: 1,
      purchasedQuantity: 0,
      availableQuantity: 0,
      isUnlimited: false,
    },
    {
      id: "770ebb51-26b0-48c4-8f66-78ef3d312310",
      name: "The Pragmatic Programmer",
      description: "20th Anniversary Edition book.",
      price: 45.0,
      currency: "USD",
      url: "https://example.com/book",
      imageUrl:
        "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGJvb2t8ZW58MHx8MHx8fDA%3D",
      priority: Priority.LOW.toString(),
      totalQuantity: 1,
      reservedQuantity: 0,
      purchasedQuantity: 1,
      availableQuantity: 0,
      isUnlimited: false,
    },
  ],
};

/**
 * Reconstitutes the mock data into a Wishlist aggregate.
 * @returns {Wishlist}
 */
export function reconstituteMockWishlist(): Wishlist {
  return Wishlist.reconstitute({
    id: MOCK_WISHLIST_DATA.id,
    ownerId: MOCK_WISHLIST_DATA.ownerId,
    title: MOCK_WISHLIST_DATA.title,
    description: MOCK_WISHLIST_DATA.description,
    visibility: MOCK_WISHLIST_DATA.visibility as Visibility,
    participation: MOCK_WISHLIST_DATA.participation as Participation,
    createdAt: new Date(MOCK_WISHLIST_DATA.createdAt),
    updatedAt: new Date(MOCK_WISHLIST_DATA.updatedAt),
    items: MOCK_WISHLIST_DATA.items.map((item) => {
      return {
        id: item.id,
        wishlistId: MOCK_WISHLIST_DATA.id,
        name: item.name,
        description: item.description,
        priority: Number(item.priority) as Priority,
        price: item.price,
        currency: item.currency,
        url: item.url,
        imageUrl: item.imageUrl,
        isUnlimited: item.isUnlimited,
        totalQuantity: item.totalQuantity,
        reservedQuantity: item.reservedQuantity,
        purchasedQuantity: item.purchasedQuantity,
      };
    }),
  });
}
