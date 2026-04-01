/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetProfileByIdUseCase } from "./get-profile-by-id.use-case";
import { ProfileRepository } from "../repositories/profile.repository";
import { Profile } from "../aggregates/profile";

describe("GetProfileByIdUseCase", () => {
  let useCase: GetProfileByIdUseCase;
  let mockProfileRepo: ProfileRepository;

  beforeEach(() => {
    mockProfileRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    useCase = new GetProfileByIdUseCase(mockProfileRepo);
  });

  it("should return a profile DTO when found", async () => {
    // Arrange
    const userId = "user-123";
    const profile = Profile.reconstitute({
      id: userId,
      username: "testuser",
      bio: "My bio",
      imageUrl: "https://example.com/image.png",
    });

    vi.mocked(mockProfileRepo.findById).mockResolvedValue(profile);

    // Act
    const result = await useCase.execute({ id: userId });

    // Assert
    expect(mockProfileRepo.findById).toHaveBeenCalledWith(userId);
    expect(result).toEqual({
      id: userId,
      username: "testuser",
      bio: "My bio",
      imageUrl: "https://example.com/image.png",
    });
  });

  it("should throw NotFoundError when profile is not found", async () => {
    // Arrange
    const userId = "non-existent";
    vi.mocked(mockProfileRepo.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute({ id: userId })).rejects.toThrow(
      "Profile not found for user ID: non-existent",
    );
  });
});
