/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateProfileUseCase } from "./update-profile.use-case";
import { ProfileRepository } from "../repositories/profile.repository";
import { StorageRepository } from "../repositories/storage.repository";
import { Profile } from "../aggregates/profile";
import { NotFoundError, InvalidAttributeError } from "../errors/domain-errors";

describe("UpdateProfileUseCase", () => {
  let useCase: UpdateProfileUseCase;
  let mockProfileRepo: ProfileRepository;
  let mockStorageRepo: StorageRepository;

  beforeEach(() => {
    mockProfileRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    mockStorageRepo = {
      upload: vi.fn(),
      delete: vi.fn(),
      getPreview: vi.fn(),
      extractFileId: vi.fn(),
    };
    useCase = new UpdateProfileUseCase(mockProfileRepo, mockStorageRepo);
  });

  it("should update a profile successfully", async () => {
    // Arrange
    const userId = "user-123";
    const existingProfile = Profile.reconstitute({
      id: userId,
      username: "original",
      bio: "original bio",
    });

    vi.mocked(mockProfileRepo.findById).mockResolvedValue(existingProfile);

    const input = {
      id: userId,
      username: "newname",
      bio: "new bio",
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(mockProfileRepo.save).toHaveBeenCalled();
    expect(result).toEqual({
      id: userId,
      username: "newname",
      bio: "new bio",
      imageUrl: undefined,
    });
  });

  it("should delete old image if replaced", async () => {
    // Arrange
    const userId = "user-123";
    const oldUrl = "https://storage.com/old.jpg";
    const newUrl = "https://storage.com/new.jpg";
    const existingProfile = Profile.reconstitute({
      id: userId,
      username: "original",
      imageUrl: oldUrl,
    });

    vi.mocked(mockProfileRepo.findById).mockResolvedValue(existingProfile);
    vi.mocked(mockStorageRepo.extractFileId).mockImplementation((url) => {
      if (url === oldUrl) return "old-file-id";
      return null;
    });
    vi.mocked(mockStorageRepo.delete).mockResolvedValue(undefined);

    const input = {
      id: userId,
      imageUrl: newUrl,
    };

    // Act
    await useCase.execute(input);

    // Assert
    expect(mockStorageRepo.extractFileId).toHaveBeenCalledWith(oldUrl);
    expect(mockStorageRepo.delete).toHaveBeenCalledWith("old-file-id");
  });

  it("should NOT delete image if it hasn't changed", async () => {
    // Arrange
    const userId = "user-123";
    const oldUrl = "https://storage.com/old.jpg";
    const existingProfile = Profile.reconstitute({
      id: userId,
      username: "original",
      imageUrl: oldUrl,
    });

    vi.mocked(mockProfileRepo.findById).mockResolvedValue(existingProfile);

    const input = {
      id: userId,
      imageUrl: oldUrl,
    };

    // Act
    await useCase.execute(input);

    // Assert
    expect(mockStorageRepo.delete).not.toHaveBeenCalled();
  });

  it("should throw NotFoundError if profile does not exist", async () => {
    // Arrange
    vi.mocked(mockProfileRepo.findById).mockResolvedValue(null);

    // Act & Assert
    await expect(
      useCase.execute({ id: "none", username: "test" }),
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw InvalidAttributeError for invalid username", async () => {
    // Arrange
    const userId = "user-123";
    const existingProfile = Profile.reconstitute({
      id: userId,
      username: "original",
    });

    vi.mocked(mockProfileRepo.findById).mockResolvedValue(existingProfile);

    // Act & Assert
    await expect(
      useCase.execute({ id: userId, username: "ab" }), // too short
    ).rejects.toThrow(InvalidAttributeError);
  });
});
