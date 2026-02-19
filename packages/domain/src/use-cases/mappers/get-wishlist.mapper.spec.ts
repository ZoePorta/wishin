import { describe, it, expect } from "vitest";
import { Wishlist } from "../../aggregates/wishlist";
import { GetWishlistMapper } from "./get-wishlist.mapper";
import { Visibility, Participation, Priority } from "../../value-objects";
import { WishlistItem } from "../../entities/wishlist-item";

describe("GetWishlistMapper", () => {
  const WISHLIST_ID = "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d";

  it("should map a Wishlist aggregate to a WishlistOutput DTO", () => {
    const itemId = "123e4567-e89b-42d3-a456-426614174000";

    const item = WishlistItem.reconstitute({
      id: itemId,
      wishlistId: WISHLIST_ID,
      name: "Test Item",
      description: "Test Description",
      priority: Priority.HIGH,
      totalQuantity: 2,
      reservedQuantity: 1,
      purchasedQuantity: 0,
      isUnlimited: false,
    });

    const wishlist = Wishlist.reconstitute({
      id: WISHLIST_ID,
      ownerId: "123e4567-e89b-42d3-a456-426614174001",
      title: "Test Wishlist",
      description: "Test Wishlist Description",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [item.toProps()],
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2023-01-02T00:00:00Z"),
    });

    const output = GetWishlistMapper.toOutput(wishlist);

    expect(output).toEqual({
      id: WISHLIST_ID,
      title: "Test Wishlist",
      description: "Test Wishlist Description",
      ownerId: "123e4567-e89b-42d3-a456-426614174001",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      createdAt: "2023-01-01T00:00:00.000Z",
      updatedAt: "2023-01-02T00:00:00.000Z",
      items: [
        {
          id: itemId,
          name: "Test Item",
          description: "Test Description",
          priority: "HIGH",
          totalQuantity: 2,
          reservedQuantity: 1,
          purchasedQuantity: 0,
          availableQuantity: 1,
          isUnlimited: false,
          price: undefined,
          currency: undefined,
          url: undefined,
          imageUrl: undefined,
        },
      ],
    });
  });

  it("should handle multiple items and different priorities", () => {
    const item1 = WishlistItem.reconstitute({
      id: "123e4567-e89b-42d3-a456-426614174011",
      wishlistId: WISHLIST_ID,
      name: "Low Priority",
      priority: Priority.LOW,
      totalQuantity: 1,
      reservedQuantity: 0,
      purchasedQuantity: 0,
      isUnlimited: false,
    });

    const item2 = WishlistItem.reconstitute({
      id: "123e4567-e89b-42d3-a456-426614174012",
      wishlistId: WISHLIST_ID,
      name: "Urgent Priority",
      priority: Priority.URGENT,
      totalQuantity: 1,
      reservedQuantity: 1,
      purchasedQuantity: 0,
      isUnlimited: false,
    });

    const wishlist = Wishlist.reconstitute({
      id: WISHLIST_ID,
      ownerId: "123e4567-e89b-42d3-a456-426614174001",
      title: "Test Wishlist",
      visibility: Visibility.PRIVATE,
      participation: Participation.CONTACTS,
      items: [item1.toProps(), item2.toProps()],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const output = GetWishlistMapper.toOutput(wishlist);

    expect(output.items).toHaveLength(2);
    expect(output.items[0].priority).toBe("LOW");
    expect(output.items[1].priority).toBe("URGENT");
  });

  it("should map a wishlist with no items correctly", () => {
    const wishlist = Wishlist.reconstitute({
      id: WISHLIST_ID,
      ownerId: "123e4567-e89b-42d3-a456-426614174001",
      title: "Empty Wishlist",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const output = GetWishlistMapper.toOutput(wishlist);

    expect(output.items).toEqual([]);
  });

  it("should map an item with isUnlimited: true correctly", () => {
    const itemId = "123e4567-e89b-42d3-a456-426614174010";

    const item = WishlistItem.reconstitute({
      id: itemId,
      wishlistId: WISHLIST_ID,
      name: "Unlimited Item",
      priority: Priority.MEDIUM,
      totalQuantity: 1,
      reservedQuantity: 10, // Allowed when unlimited
      purchasedQuantity: 5,
      isUnlimited: true,
    });

    const wishlist = Wishlist.reconstitute({
      id: WISHLIST_ID,
      ownerId: "123e4567-e89b-42d3-a456-426614174001",
      title: "Unlimited Wishlist",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [item.toProps()],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const output = GetWishlistMapper.toOutput(wishlist);

    expect(output.items[0]).toMatchObject({
      id: itemId,
      isUnlimited: true,
      priority: "MEDIUM",
      reservedQuantity: 10,
      purchasedQuantity: 5,
      availableQuantity: item.availableQuantity,
    });
  });
});
