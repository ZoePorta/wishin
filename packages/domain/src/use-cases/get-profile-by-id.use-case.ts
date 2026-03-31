import type { ProfileRepository } from "../repositories/profile.repository";
import type { GetProfileInput, ProfileOutput } from "./dtos/profile.dto";
import { ProfileOutputMapper } from "./mappers/profile-output.mapper";
import { NotFoundError } from "../errors/domain-errors";

/**
 * Use case to fetch a user profile by its unique identifier.
 */
export class GetProfileByIdUseCase {
  /**
   * Initializes the use case with dependencies.
   *
   * @param profileRepository - The repository for fetching profiles.
   */
  constructor(private readonly profileRepository: ProfileRepository) {}

  /**
   * Executes the use case.
   *
   * @param input - The input DTO containing the profile ID.
   * @returns A Promise that resolves to the ProfileOutput DTO.
   * @throws {NotFoundError} If the profile is not found.
   */
  async execute(input: GetProfileInput): Promise<ProfileOutput> {
    const profile = await this.profileRepository.findById(input.id);

    if (!profile) {
      throw new NotFoundError(`Profile not found for user ID: ${input.id}`);
    }

    return ProfileOutputMapper.toDTO(profile);
  }
}
