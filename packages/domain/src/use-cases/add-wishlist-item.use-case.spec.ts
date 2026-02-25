/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddWishlistItemUseCase } from "./add-wishlist-item.use-case";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import { Wishlist } from "../aggregates/wishlist";
import { Priority, Visibility, Participation } from "../value-objects";
import { WishlistNotFoundError } from "../errors/domain-errors";
import type { AddWishlistItemInput } from "./dtos/wishlist-item-actions.dto";

describe("AddWishlistItemUseCase", () => {
  let useCase: AddWishlistItemUseCase;
  let mockRepo: WishlistRepository;
  const WISHLIST_ID = "550e8400-e29b-41d4-a716-446655440000";
  const ITEM_ID = "660e8400-e29b-41d4-a716-446655441111";

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new AddWishlistItemUseCase(mockRepo, () => ITEM_ID);
  });

  it("should successfully retrieve wishlist, add item, and save (RED: retrieval -> add -> save cycle)", async () => {
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
    mockRepo.save = vi.fn().mockResolvedValue(undefined);

    const input: AddWishlistItemInput = {
      wishlistId: WISHLIST_ID,
      name: "New Awesome Item",
      description: "A description",
      priority: Priority.HIGH,
      isUnlimited: false,
      totalQuantity: 1,
      price: 100,
      currency: "EUR",
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockRepo.findById).toHaveBeenCalledWith(WISHLIST_ID);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);

    // Verify that the saved wishlist has the new item
    const savedWishlist = vi.mocked(mockRepo.save).mock.calls[0][0];
    expect(savedWishlist.id).toBe(WISHLIST_ID);
    expect(savedWishlist.items).toHaveLength(1);
    expect(savedWishlist.items[0].name).toBe(input.name);
    expect(savedWishlist.items[0].id).toBe(ITEM_ID);

    expect(result).toBeDefined();
    expect(result.id).toBe(WISHLIST_ID);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe(input.name);
  });

  it("should throw an error if the wishlist does not exist", async () => {
    // Arrange
    mockRepo.findById = vi.fn().mockResolvedValue(null);

    const input: AddWishlistItemInput = {
      wishlistId: "550e8400-e29b-41d4-a716-446655449999",
      name: "Item",
      priority: Priority.MEDIUM,
      isUnlimited: false,
      totalQuantity: 1,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(WishlistNotFoundError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
