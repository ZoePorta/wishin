/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetWishlistByOwnerUseCase } from "./get-wishlist-by-owner.use-case";
import { WishlistRepository } from "../repositories/wishlist.repository";
import { ProfileRepository } from "../repositories/profile.repository";
import { Wishlist } from "../aggregates/wishlist";
import { Profile } from "../aggregates/profile";
import { Visibility, Participation } from "../value-objects";

describe("GetWishlistByOwnerUseCase", () => {
  let useCase: GetWishlistByOwnerUseCase;
  let mockRepo: WishlistRepository;
  let mockProfileRepo: ProfileRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByOwnerId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    mockProfileRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    useCase = new GetWishlistByOwnerUseCase(mockRepo, mockProfileRepo);
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
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepo.findByOwnerId).mockResolvedValue([wishlist]);
    vi.mocked(mockProfileRepo.findById).mockResolvedValue(
      Profile.reconstitute({
        id: ownerId,
        username: "zoe_user",
        imageUrl: "https://example.com/avatar.png",
      }),
    );

    // Act
    const result = await useCase.execute({ ownerId });

    // Assert
    expect(mockRepo.findByOwnerId).toHaveBeenCalledWith(ownerId);
    expect(mockProfileRepo.findById).toHaveBeenCalledWith(ownerId);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(wishlistId);
    expect(result?.title).toBe("My Wishlist");
    expect(result?.ownerId).toBe(ownerId);
    expect(result?.ownerName).toBe("zoe_user");
    expect(result?.ownerAvatarUrl).toBe("https://example.com/avatar.png");
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
