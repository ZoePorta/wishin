/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateWishlistItemUseCase } from "./update-wishlist-item.use-case";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import { Wishlist } from "../aggregates/wishlist";
import { WishlistItem } from "../entities/wishlist-item";
import { Priority, Visibility, Participation } from "../value-objects";
import {
  WishlistNotFoundError,
  WishlistItemNotFoundError,
  InvalidAttributeError,
} from "../errors/domain-errors";
import type { UpdateWishlistItemInput } from "./dtos/wishlist-item-actions.dto";

describe("UpdateWishlistItemUseCase", () => {
  let useCase: UpdateWishlistItemUseCase;
  let mockRepo: WishlistRepository;
  const WISHLIST_ID = "550e8400-e29b-41d4-a716-446655440000";
  const ITEM_ID = "660e8400-e29b-41d4-a716-446655441111";

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new UpdateWishlistItemUseCase(mockRepo);
  });

  const createExistingWishlistWithItem = () => {
    const item = WishlistItem.reconstitute({
      id: ITEM_ID,
      wishlistId: WISHLIST_ID,
      name: "Original Name",
      description: "Original Description",
      priority: Priority.MEDIUM,
      price: 50,
      currency: "EUR",
      isUnlimited: false,
      totalQuantity: 10,
      reservedQuantity: 2,
      purchasedQuantity: 3,
    });

    return Wishlist.reconstitute({
      id: WISHLIST_ID,
      ownerId: "user-123",
      title: "My Wishlist",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [item.toProps()],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  it("should successfully update item metadata and save", async () => {
    // Arrange
    const existingWishlist = createExistingWishlistWithItem();
    mockRepo.findById = vi.fn().mockResolvedValue(existingWishlist);
    mockRepo.save = vi.fn().mockResolvedValue(undefined);

    const input: UpdateWishlistItemInput = {
      wishlistId: WISHLIST_ID,
      itemId: ITEM_ID,
      name: "Updated Name",
      description: "Updated Description",
      price: 75,
      priority: Priority.HIGH,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockRepo.findById).toHaveBeenCalledWith(WISHLIST_ID);
    expect(mockRepo.save).toHaveBeenCalledTimes(1);

    const savedWishlist = vi.mocked(mockRepo.save).mock.calls[0][0];
    const updatedItem = savedWishlist.items.find((i) => i.id === ITEM_ID);
    expect(updatedItem?.name).toBe("Updated Name");
    expect(updatedItem?.description).toBe("Updated Description");
    expect(updatedItem?.price).toBe(75);
    expect(updatedItem?.priority).toBe(Priority.HIGH);

    expect(result.items.find((i) => i.id === ITEM_ID)?.name).toBe(
      "Updated Name",
    );
  });

  it("should cancel ALL reservations when totalQuantity reduction causes over-commitment (ADR 019)", async () => {
    // Arrange
    const existingWishlist = createExistingWishlistWithItem(); // total: 10, reserved: 2, purchased: 3
    mockRepo.findById = vi.fn().mockResolvedValue(existingWishlist);
    mockRepo.save = vi.fn().mockResolvedValue(undefined);

    const input: UpdateWishlistItemInput = {
      wishlistId: WISHLIST_ID,
      itemId: ITEM_ID,
      totalQuantity: 4, // 4 < 2 (reserved) + 3 (purchased) -> ALL reservations should be cancelled (reserved = 0)
    };

    // Act
    await useCase.execute(input);

    // Assert
    const savedWishlist = vi.mocked(mockRepo.save).mock.calls[0][0];
    const updatedItem = savedWishlist.items.find((i) => i.id === ITEM_ID);
    expect(updatedItem?.totalQuantity).toBe(4);
    expect(updatedItem?.reservedQuantity).toBe(0); // Mass cancellation
    expect(updatedItem?.purchasedQuantity).toBe(3);
  });

  it("should throw WishlistNotFoundError if the wishlist does not exist", async () => {
    // Arrange
    mockRepo.findById = vi.fn().mockResolvedValue(null);

    const input: UpdateWishlistItemInput = {
      wishlistId: "non-existent-id",
      itemId: ITEM_ID,
      name: "New Name",
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(WishlistNotFoundError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw WishlistItemNotFoundError if the item does not exist in the wishlist", async () => {
    // Arrange
    const existingWishlist = Wishlist.reconstitute({
      id: WISHLIST_ID,
      ownerId: "user-123",
      title: "Title",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockRepo.findById = vi.fn().mockResolvedValue(existingWishlist);

    const input: UpdateWishlistItemInput = {
      wishlistId: WISHLIST_ID,
      itemId: "non-existent-item-id",
      name: "New Name",
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(
      WishlistItemNotFoundError,
    );
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should throw InvalidAttributeError if validation fails (e.g., name too short)", async () => {
    // Arrange
    const existingWishlist = createExistingWishlistWithItem();
    mockRepo.findById = vi.fn().mockResolvedValue(existingWishlist);

    const input: UpdateWishlistItemInput = {
      wishlistId: WISHLIST_ID,
      itemId: ITEM_ID,
      name: "ab", // Too short (min 3)
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(InvalidAttributeError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
