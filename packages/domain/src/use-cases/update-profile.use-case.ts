import type { ProfileRepository } from "../repositories/profile.repository";
import type { UpdateProfileInput, ProfileOutput } from "./dtos/profile.dto";
import { ProfileOutputMapper } from "./mappers/profile-output.mapper";
import { NotFoundError } from "../errors/domain-errors";
import type { StorageRepository } from "../repositories/storage.repository";

/**
 * Use case to update a user's profile public metadata.
 */
export class UpdateProfileUseCase {
  /**
   * Initializes the use case with dependencies.
   *
   * @param profileRepository - The repository for managing profiles.
   */
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly storageRepository: StorageRepository,
  ) {}

  /**
   * Executes the use case.
   *
   * @param input - The update data for the profile.
   * @returns A Promise that resolves to the updated ProfileOutput DTO.
   * @throws {NotFoundError} If the profile is not found.
   * @throws {InvalidAttributeError} If the update violates domain rules.
   */
  async execute(input: UpdateProfileInput): Promise<ProfileOutput> {
    const profile = await this.profileRepository.findById(input.id);

    if (!profile) {
      throw new NotFoundError(`Profile not found for user ID: ${input.id}`);
    }

    const originalImageUrl = profile.imageUrl;

    const updatedProfile = profile.update({
      username: input.username,
      bio: input.bio,
      imageUrl: input.imageUrl,
    });

    await this.profileRepository.save(updatedProfile);

    // If imageUrl was updated and there's an original image from our storage, delete the old one.
    if (
      Object.prototype.hasOwnProperty.call(input, "imageUrl") &&
      originalImageUrl &&
      originalImageUrl !== input.imageUrl
    ) {
      const oldFileId = this.storageRepository.extractFileId(originalImageUrl);
      if (oldFileId) {
        // Fire and forget: don't block the response on cleanup.
        this.storageRepository.delete(oldFileId).catch((err: unknown) => {
          console.error(
            `Failed to delete old profile image ${oldFileId}:`,
            err,
          );
        });
      }
    }

    return ProfileOutputMapper.toDTO(updatedProfile);
  }
}
