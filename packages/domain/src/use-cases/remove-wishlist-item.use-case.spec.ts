/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RemoveWishlistItemUseCase } from "./remove-wishlist-item.use-case";
import type { WishlistRepository } from "../repositories/wishlist.repository";
import { Wishlist } from "../aggregates/wishlist";
import { WishlistItem } from "../entities/wishlist-item";
import { Priority, Visibility, Participation } from "../value-objects";
import { WishlistNotFoundError } from "../errors/domain-errors";
import type { RemoveWishlistItemInput } from "./dtos/wishlist-item-actions.dto";
import type { StorageRepository } from "../repositories/storage.repository";

describe("RemoveWishlistItemUseCase", () => {
  let useCase: RemoveWishlistItemUseCase;
  let mockRepo: WishlistRepository;
  let mockStorageRepo: StorageRepository;
  const WISHLIST_ID = "550e8400-e29b-41d4-a716-446655440000";
  const ITEM_ID = "660e8400-e29b-41d4-a716-446655441111";

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    mockStorageRepo = {
      upload: vi.fn(),
      delete: vi.fn(),
      getPreview: vi.fn(),
      extractFileId: vi.fn(),
    };
    useCase = new RemoveWishlistItemUseCase(mockRepo, mockStorageRepo);
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
      version: 0,
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
      version: 0,
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
    expect(mockRepo.save).not.toHaveBeenCalled();
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

  describe("Image Deletion", () => {
    const IMAGE_URL = "https://appwrite.io/files/file-id/view";

    it("should delete the image of the removed item", async () => {
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
        imageUrl: IMAGE_URL,
      });

      const existingWishlist = Wishlist.reconstitute({
        id: WISHLIST_ID,
        ownerId: "user-123",
        title: "My Wishlist",
        visibility: Visibility.LINK,
        participation: Participation.ANYONE,
        items: [item.toProps()],
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRepo.findById).mockResolvedValue(existingWishlist);
      vi.mocked(mockRepo.save).mockResolvedValue(undefined);
      vi.mocked(mockStorageRepo.extractFileId).mockReturnValue("file-id");
      vi.mocked(mockStorageRepo.delete).mockResolvedValue(undefined);

      const input: RemoveWishlistItemInput = {
        wishlistId: WISHLIST_ID,
        itemId: ITEM_ID,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockStorageRepo.extractFileId).toHaveBeenCalledWith(IMAGE_URL);
      expect(mockStorageRepo.delete).toHaveBeenCalledWith("file-id");
    });

    it("should NOT delete anything if the removed item has no image", async () => {
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
        imageUrl: null,
      });

      const existingWishlist = Wishlist.reconstitute({
        id: WISHLIST_ID,
        ownerId: "user-123",
        title: "My Wishlist",
        visibility: Visibility.LINK,
        participation: Participation.ANYONE,
        items: [item.toProps()],
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(mockRepo.findById).mockResolvedValue(existingWishlist);
      vi.mocked(mockRepo.save).mockResolvedValue(undefined);

      const input: RemoveWishlistItemInput = {
        wishlistId: WISHLIST_ID,
        itemId: ITEM_ID,
      };

      // Act
      await useCase.execute(input);

      // Assert
      expect(mockStorageRepo.delete).not.toHaveBeenCalled();
    });
  });
});
