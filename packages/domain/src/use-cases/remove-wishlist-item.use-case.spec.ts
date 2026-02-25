/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RemoveWishlistItemUseCase } from "./remove-wishlist-item.use-case";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import { Wishlist } from "../aggregates/wishlist";
import { WishlistItem } from "../entities/wishlist-item";
import { Priority, Visibility, Participation } from "../value-objects";
import { WishlistNotFoundError } from "../errors/domain-errors";
import type { RemoveWishlistItemInput } from "./dtos/wishlist-item-actions.dto";

describe("RemoveWishlistItemUseCase", () => {
  let useCase: RemoveWishlistItemUseCase;
  let mockRepo: WishlistRepository;
  const WISHLIST_ID = "550e8400-e29b-41d4-a716-446655440000";
  const ITEM_ID = "660e8400-e29b-41d4-a716-446655441111";

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new RemoveWishlistItemUseCase(mockRepo);
  });

  it("should successfully remove an item and save", async () => {
    // Arrange
    const item = WishlistItem.reconstitute({
      id: ITEM_ID,
      wishlistId: WISHLIST_ID,
      name: "Item",
      priority: Priority.MEDIUM,
      isUnlimited: false,
      totalQuantity: 1,
      reservedQuantity: 0,
      purchasedQuantity: 0,
    });

    const existingWishlist = Wishlist.reconstitute({
      id: WISHLIST_ID,
      ownerId: "user-123",
      title: "My Wishlist",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [item.toProps()],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRepo.findById = vi.fn().mockResolvedValue(existingWishlist);
    mockRepo.save = vi.fn().mockResolvedValue(undefined);

    const input: RemoveWishlistItemInput = {
      wishlistId: WISHLIST_ID,
      itemId: ITEM_ID,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockRepo.findById).toHaveBeenCalledWith(WISHLIST_ID);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);

    const savedWishlist = vi.mocked(mockRepo.save).mock.calls[0][0];
    expect(savedWishlist.items).toHaveLength(0);
    expect(result.items).toHaveLength(0);
  });

  it("should be idempotent and not throw error if item does not exist in wishlist", async () => {
    // Arrange
    const existingWishlist = Wishlist.reconstitute({
      id: WISHLIST_ID,
      ownerId: "user-123",
      title: "My Wishlist",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRepo.findById = vi.fn().mockResolvedValue(existingWishlist);

    const input: RemoveWishlistItemInput = {
      wishlistId: WISHLIST_ID,
      itemId: ITEM_ID,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockRepo.findById).toHaveBeenCalledWith(WISHLIST_ID);
    // Ideally no save call if nothing changed, but repo.save is also fine as long as no error occurs.
    // However, clean architecture suggests avoid saving if no state change.
    // We'll leave it open for implementation, but the main point is NO error and returning the wishlist.
    expect(result.id).toBe(WISHLIST_ID);
  });

  it("should throw WishlistNotFoundError if the wishlist does not exist", async () => {
    // Arrange
    mockRepo.findById = vi.fn().mockResolvedValue(null);

    const input: RemoveWishlistItemInput = {
      wishlistId: "non-existent-id",
      itemId: ITEM_ID,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(WishlistNotFoundError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
