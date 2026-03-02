import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateWishlistUseCase } from "./update-wishlist.use-case";
import { Wishlist } from "../aggregates/wishlist";
import { Visibility, Participation } from "../value-objects";
import { WishlistNotFoundError } from "../errors/domain-errors";
import type { WishlistRepository } from "../repositories/wishlist.repository";

describe("UpdateWishlistUseCase", () => {
  let mockRepo: {
    findById: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findByOwnerId: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getCurrentUserId: ReturnType<typeof vi.fn>;
  };
  let useCase: UpdateWishlistUseCase;

  const existingWishlist = Wishlist.create({
    id: "eb877478-f093-4e44-8d96-9323719b0d2a",
    ownerId: "user-123",
    title: "Original Title",
    description: "Original Description",
    visibility: Visibility.LINK,
    participation: Participation.ANYONE,
  });

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      findByOwnerId: vi.fn(),
      delete: vi.fn(),
      getCurrentUserId: vi.fn(),
    };
    useCase = new UpdateWishlistUseCase(
      mockRepo as unknown as WishlistRepository,
    );
  });

  it("should update and save the wishlist when found", async () => {
    mockRepo.findById.mockResolvedValue(existingWishlist);

    const input = {
      id: existingWishlist.id,
      title: "Updated Title",
      description: "Updated Description",
    };

    const result = await useCase.execute(input);

    expect(mockRepo.findById).toHaveBeenCalledWith(existingWishlist.id);
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.title).toBe("Updated Title");
    expect(result.description).toBe("Updated Description");
    // Other fields should remain unchanged
    expect(result.visibility).toBe(Visibility.LINK);
  });

  it("should throw WishlistNotFoundError when wishlist does not exist", async () => {
    mockRepo.findById.mockResolvedValue(null);

    const input = {
      id: "non-existent-id",
      title: "New Title",
    };

    await expect(useCase.execute(input)).rejects.toThrow(WishlistNotFoundError);
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it("should update partial fields correctly", async () => {
    mockRepo.findById.mockResolvedValue(existingWishlist);

    const input = {
      id: existingWishlist.id,
      visibility: Visibility.PRIVATE,
    };

    const result = await useCase.execute(input);

    expect(result.title).toBe("Original Title");
    expect(result.visibility).toBe(Visibility.PRIVATE);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
