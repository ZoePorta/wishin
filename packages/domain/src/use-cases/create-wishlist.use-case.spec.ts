/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateWishlistUseCase } from "./create-wishlist.use-case";
import { WishlistRepository } from "../repositories/wishlist.repository";
import { Visibility, Participation } from "../value-objects";
import { CreateWishlistInput } from "./dtos";

describe("CreateWishlistUseCase", () => {
  let useCase: CreateWishlistUseCase;
  let mockRepo: WishlistRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new CreateWishlistUseCase(mockRepo);
  });

  it("should successfully create and save a wishlist with valid inputs", async () => {
    // Arrange
    const input: CreateWishlistInput = {
      title: "My Birthday List",
      description: "Things I want for my 30th",
      ownerId: "550e8400-e29b-41d4-a716-446655440000",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.title).toBe(input.title);
    expect(result.ownerId).toBe(input.ownerId);
    expect(result.visibility).toBe(input.visibility);
    expect(result.participation).toBe(input.participation);
    expect(result.items).toEqual([]);

    // Check that we got a valid UUID
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("should throw an error if domain validation fails (ADR 011: explicit requirements)", async () => {
    // Arrange
    const input: CreateWishlistInput = {
      title: "No", // Too short (min 3)
      ownerId: "550e8400-e29b-41d4-a716-446655440000",
      visibility: Visibility.LINK,
      participation: Participation.ANYONE,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow();
  });

  it("should propagate errors from the repository", async () => {
    // Arrange
    const input: CreateWishlistInput = {
      title: "My Valid List",
      ownerId: "550e8400-e29b-41d4-a716-446655440000",
      visibility: Visibility.PRIVATE,
      participation: Participation.REGISTERED,
    };
    vi.mocked(mockRepo.save).mockRejectedValue(new Error("Database error"));

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow("Database error");
  });
});
