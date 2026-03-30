/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetWishlistByUUIDUseCase } from "./get-wishlist-by-uuid.use-case";
import { WishlistRepository } from "../repositories/wishlist.repository";
import { ProfileRepository } from "../repositories/profile.repository";
import { Profile } from "../aggregates/profile";
import { Wishlist } from "../aggregates/wishlist";
import { Visibility, Participation } from "../value-objects";

describe("GetWishlistByUUIDUseCase", () => {
  let useCase: GetWishlistByUUIDUseCase;
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
    useCase = new GetWishlistByUUIDUseCase(mockRepo, mockProfileRepo);
  });

  it("should return a wishlist DTO when found", async () => {
    // Arrange
    const wishlistId = "550e8400-e29b-41d4-a716-446655440000";
    const ownerId = "660e8400-e29b-41d4-a716-446655441111";

    // Using reconstitute for mock data
    const wishlist = Wishlist.reconstitute({
      id: wishlistId,
      ownerId,
      title: "My Christmas List",
      description: "Items I want",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
      items: [],
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(mockRepo.findById).mockResolvedValue(wishlist);
    vi.mocked(mockProfileRepo.findById).mockResolvedValue(
      Profile.reconstitute({
        id: ownerId,
        username: "zoe_user",
        imageUrl: "https://example.com/avatar.png",
      }),
    );

    // Act
    const result = await useCase.execute({ id: wishlistId });

    // Assert
    expect(mockRepo.findById).toHaveBeenCalledWith(wishlistId);
    expect(mockProfileRepo.findById).toHaveBeenCalledWith(ownerId);
    expect(result).toBeDefined();
    expect(result.id).toBe(wishlistId);
    expect(result.title).toBe("My Christmas List");
    expect(result.ownerName).toBe("zoe_user");
    expect(result.ownerAvatarUrl).toBe("https://example.com/avatar.png");
    expect(result.items).toEqual([]);
  });

  it("should throw an error when wishlist is not found", async () => {
    // Arrange
    const wishlistId = "00000000-0000-0000-0000-000000000000";
    vi.mocked(mockRepo.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute({ id: wishlistId })).rejects.toThrow(
      "Wishlist not found",
    );
  });
});
