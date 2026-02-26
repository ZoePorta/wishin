/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetWishlistByOwnerUseCase } from "./get-wishlist-by-owner.use-case";
import { WishlistRepository } from "../repositories/wishlist.repository";
import { Wishlist } from "../aggregates/wishlist";
import { Visibility, Participation } from "../value-objects";

describe("GetWishlistByOwnerUseCase", () => {
  let useCase: GetWishlistByOwnerUseCase;
  let mockRepo: WishlistRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      getCurrentUserId: vi.fn(),
    };
    useCase = new GetWishlistByOwnerUseCase(mockRepo);
  });

  const ownerId = "550e8400-e29b-41d4-a716-446655440000";
  const wishlistId = "660e8400-e29b-41d4-a716-446655441111";

  it("should return null when no wishlist is found for the owner", async () => {
    // Arrange
    vi.mocked(mockRepo.findByOwnerId).mockResolvedValue([]);

    // Act
    const result = await useCase.execute({ ownerId });

    // Assert
    expect(mockRepo.findByOwnerId).toHaveBeenCalledWith(ownerId);
    expect(result).toBeNull();
  });

  it("should return a WishlistOutput when a wishlist is found", async () => {
    // Arrange
    const wishlist = Wishlist.reconstitute({
      id: wishlistId,
      ownerId,
      title: "My Wishlist",
      description: "A description",
      visibility: Visibility.PRIVATE,
      participation: Participation.ANYONE,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepo.findByOwnerId).mockResolvedValue([wishlist]);

    // Act
    const result = await useCase.execute({ ownerId });

    // Assert
    expect(mockRepo.findByOwnerId).toHaveBeenCalledWith(ownerId);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(wishlistId);
    expect(result?.title).toBe("My Wishlist");
    expect(result?.ownerId).toBe(ownerId);
  });

  it("should verify findByOwnerId is called with the provided ownerId", async () => {
    // Arrange
    vi.mocked(mockRepo.findByOwnerId).mockResolvedValue([]);

    // Act
    await useCase.execute({ ownerId: "custom-owner" });

    // Assert
    expect(mockRepo.findByOwnerId).toHaveBeenCalledWith("custom-owner");
  });
});
