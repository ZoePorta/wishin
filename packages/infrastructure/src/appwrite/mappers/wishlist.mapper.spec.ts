import { describe, it, expect } from "vitest";
import { WishlistMapper } from "./wishlist.mapper";
import {
  Wishlist,
  Visibility,
  Participation,
  WishlistItem,
  Priority,
  INVALID_VISIBILITY_ERROR,
} from "@wishin/domain";
import type { Models } from "appwrite";

describe("WishlistMapper", () => {
  const wishlistId = "550e8400-e29b-41d4-a716-446655440000";
  const ownerId = "660e8400-e29b-41d4-a716-446655440001";
  const createdAt = new Date("2024-01-01T00:00:00.000Z");
  const updatedAt = new Date("2024-01-01T00:00:00.000Z");

  const wishlistProps = {
    id: wishlistId,
    ownerId,
    title: "My Wishlist",
    description: "A description",
    visibility: Visibility.LINK,
    participation: Participation.ANYONE,
    items: [],
    createdAt,
    updatedAt,
  };

  it("should map domain aggregate to persistence object (excluding items)", () => {
    const wishlist = Wishlist.reconstitute(wishlistProps);
    const persistence = WishlistMapper.toPersistence(wishlist);

    expect(persistence).toEqual({
      ownerId: wishlistProps.ownerId,
      title: wishlistProps.title,
      description: wishlistProps.description,
      visibility: wishlistProps.visibility,
      participation: wishlistProps.participation,
      createdAt: wishlistProps.createdAt.toISOString(),
      updatedAt: wishlistProps.updatedAt.toISOString(),
    });
  });

  it("should map persistence document and items to domain aggregate", () => {
    interface WishlistDocument extends Models.Document {
      ownerId: string;
      title: string;
      description: string;
      visibility: Visibility;
      participation: Participation;
      createdAt: string;
      updatedAt: string;
      $sequence: number;
    }

    const doc: WishlistDocument = {
      $id: wishlistId,
      $collectionId: "wishlists",
      $databaseId: "default",
      $createdAt: createdAt.toISOString(),
      $updatedAt: updatedAt.toISOString(),
      $permissions: [] as string[],
      $sequence: 0,
      ownerId,
      title: "My Wishlist",
      description: "A description",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    };

    const itemProps = {
      id: "770e8400-e29b-41d4-a716-446655440002",
      wishlistId: wishlistId,
      name: "Test Item",
      priority: Priority.MEDIUM,
      isUnlimited: false,
      totalQuantity: 1,
      reservedQuantity: 0,
      purchasedQuantity: 0,
    };
    const item = WishlistItem.reconstitute(itemProps);

    const domain = WishlistMapper.toDomain(doc, [item]);

    expect(domain.id).toBe(wishlistId);
    expect(domain.items.length).toBe(1);
    expect(domain.items[0].id).toBe(itemProps.id);
    expect(domain.title).toBe(wishlistProps.title);
    expect(domain.ownerId).toBe(wishlistProps.ownerId);
    expect(domain.description).toBe(wishlistProps.description);
    expect(domain.visibility).toBe(wishlistProps.visibility);
    expect(domain.participation).toBe(wishlistProps.participation);
    expect(domain.createdAt.getTime()).toBe(wishlistProps.createdAt.getTime());
    expect(domain.updatedAt.getTime()).toBe(wishlistProps.updatedAt.getTime());
  });

  it("should map persistence document with null description to domain aggregate with undefined description", () => {
    const doc = {
      $id: wishlistId,
      ownerId,
      title: "My Wishlist",
      description: null, // Test case for null description
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    } as unknown as Models.Document;

    const domain = WishlistMapper.toDomain(doc, []);

    expect(domain.description).toBeUndefined();
    expect(domain.title).toBe("My Wishlist");
  });

  it("should fail if visibility is invalid (simulating domain error)", () => {
    const doc = {
      $id: wishlistId,
      ownerId,
      title: "My Wishlist",
      description: "Desc",
      visibility: "INVALID", // Should fail validation
      participation: Participation.ANYONE,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    } as unknown as Models.Document;

    expect(() => WishlistMapper.toDomain(doc, [])).toThrow(
      INVALID_VISIBILITY_ERROR,
    );
  });

  it("should handle missing or null visibility/participation by using defaults", () => {
    const doc = {
      $id: wishlistId,
      ownerId,
      title: "My Wishlist",
      description: "Desc",
      visibility: null,
      participation: null,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    } as unknown as Models.Document;

    const domain = WishlistMapper.toDomain(doc, []);

    expect(domain.visibility).toBe(Visibility.LINK);
    expect(domain.participation).toBe(Participation.ANYONE);
  });

  it("should map lowercase visibility and participation to uppercase enums", () => {
    const doc = {
      $id: wishlistId,
      ownerId,
      title: "My Wishlist",
      visibility: "link", // Lowercase
      participation: "anyone", // Lowercase
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    } as unknown as Models.Document;

    const domain = WishlistMapper.toDomain(doc, []);

    expect(domain.visibility).toBe(Visibility.LINK);
    expect(domain.participation).toBe(Participation.ANYONE);
  });
});
