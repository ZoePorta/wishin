import { describe, it, expect } from "vitest";
import { WishlistItemMapper } from "./wishlist-item.mapper";
import { WishlistItem, Priority } from "@wishin/domain";
import type { Models } from "appwrite";

describe("WishlistItemMapper", () => {
  const itemProps = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    wishlistId: "660e8400-e29b-41d4-a716-446655440001",
    name: "Test Item",
    description: "Test Description",
    priority: Priority.URGENT,
    price: 99.99,
    currency: "USD",
    url: "https://example.com",
    imageUrl: "https://example.com/image.jpg",
    isUnlimited: false,
    totalQuantity: 2,
    reservedQuantity: 0,
    purchasedQuantity: 0,
  };

  it("should map domain entity to persistence object", () => {
    const item = WishlistItem.reconstitute(itemProps);
    const persistence = WishlistItemMapper.toPersistence(item);

    expect(persistence).toEqual({
      wishlistId: itemProps.wishlistId,
      name: itemProps.name,
      description: itemProps.description,
      priority: itemProps.priority,
      price: itemProps.price,
      currency: itemProps.currency,
      url: itemProps.url,
      imageUrl: itemProps.imageUrl,
      isUnlimited: itemProps.isUnlimited,
      totalQuantity: itemProps.totalQuantity,
      reservedQuantity: itemProps.reservedQuantity,
      purchasedQuantity: itemProps.purchasedQuantity,
    });
  });

  it("should map persistence document to domain entity", () => {
    interface WishlistItemDocument extends Models.Document {
      wishlistId: string;
      name: string;
      description: string;
      priority: Priority;
      price: number;
      currency: string;
      url: string;
      imageUrl: string;
      isUnlimited: boolean;
      totalQuantity: number;
      reservedQuantity: number;
      purchasedQuantity: number;
      id?: string;
      $sequence: number;
    }

    const doc: WishlistItemDocument = {
      $id: itemProps.id,
      $collectionId: "wishlist_items",
      $databaseId: "default",
      $createdAt: "2024-01-01T00:00:00.000Z",
      $updatedAt: "2024-01-01T00:00:00.000Z",
      $permissions: [] as string[],
      $sequence: 0,
      ...itemProps,
    };
    // remove id from props as it is mapped from $id
    delete doc.id;

    const domain = WishlistItemMapper.toDomain(doc);

    expect(domain.id).toBe(itemProps.id);
    expect(domain.toProps()).toEqual(itemProps);
  });
});
