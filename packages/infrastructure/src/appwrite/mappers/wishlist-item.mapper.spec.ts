import { describe, it, expect } from "vitest";
import { WishlistItemMapper } from "./wishlist-item.mapper";
import { type WishlistItem, Priority } from "@wishin/domain";
import type { Models } from "appwrite";

describe("WishlistItemMapper", () => {
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
    id?: string;
    $sequence: number;
  }

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
    });
  });

  it("should map persistence document to domain entity", () => {
    const { id, ...propsWithoutId } = itemProps;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { reservedQuantity, purchasedQuantity, ...propsForDoc } =
      propsWithoutId;

    const doc: WishlistItemDocument = {
      $id: id,
      $collectionId: "wishlist_items",
      $databaseId: "default",
      $createdAt: "2024-01-01T00:00:00.000Z",
      $updatedAt: "2024-01-01T00:00:00.000Z",
      $permissions: [] as string[],
      $sequence: 0,
      ...propsForDoc,
    };

    const domain = WishlistItemMapper.toDomain(doc);

    expect(domain.id).toBe(itemProps.id);
    expect(domain.toProps()).toEqual({
      ...itemProps,
      reservedQuantity: 0,
      purchasedQuantity: 0,
    });
  });

  it("should map persistence document with nulls to domain entity with undefineds", () => {
    const doc: WishlistItemDocument = {
      $id: itemProps.id,
      $collectionId: "wishlist_items",
      $databaseId: "default",
      $createdAt: "2024-01-01T00:00:00.000Z",
      $updatedAt: "2024-01-01T00:00:00.000Z",
      $permissions: [] as string[],
      $sequence: 0,
      wishlistId: itemProps.wishlistId,
      name: itemProps.name,
      priority: itemProps.priority,
      isUnlimited: itemProps.isUnlimited,
      totalQuantity: itemProps.totalQuantity,
      description: null,
      price: null,
      currency: null,
      url: null,
      imageUrl: null,
    };

    const domain = WishlistItemMapper.toDomain(doc);

    expect(domain.imageUrl).toBeUndefined();
  });

  it("should map persistence document with specific quantities via options object", () => {
    const doc: WishlistItemDocument = {
      $id: itemProps.id,
      $collectionId: "wishlist_items",
      $databaseId: "default",
      $createdAt: "2024-01-01T00:00:00.000Z",
      $updatedAt: "2024-01-01T00:00:00.000Z",
      $permissions: [] as string[],
      $sequence: 0,
      wishlistId: itemProps.wishlistId,
      name: itemProps.name,
      priority: itemProps.priority,
      isUnlimited: itemProps.isUnlimited,
      totalQuantity: itemProps.totalQuantity,
    };

    const domain = WishlistItemMapper.toDomain(doc, {
      reservedQuantity: 5,
      purchasedQuantity: 3,
    });

    expect(domain.reservedQuantity).toBe(5);
    expect(domain.purchasedQuantity).toBe(3);
  });

  it("should map valid priority string/number to domain Priority enum", () => {
    const doc = {
      $id: "550e8400-e29b-41d4-a716-446655440005",
      wishlistId: "660e8400-e29b-41d4-a716-446655440001",
      name: "Test Item",
      priority: "2", // String from DB
      isUnlimited: false,
      totalQuantity: 1,
    } as unknown as Models.Document;

    const domain = WishlistItemMapper.toDomain(doc);
    expect(domain.priority).toBe(Priority.MEDIUM);
  });

  it("should default to MEDIUM if priority is invalid", () => {
    const doc = {
      $id: "550e8400-e29b-41d4-a716-446655440005",
      wishlistId: "660e8400-e29b-41d4-a716-446655440001",
      name: "Test Item",
      priority: 99, // Invalid value
      isUnlimited: false,
      totalQuantity: 1,
    } as unknown as Models.Document;

    const domain = WishlistItemMapper.toDomain(doc);
    expect(domain.priority).toBe(Priority.MEDIUM);
  });
});
