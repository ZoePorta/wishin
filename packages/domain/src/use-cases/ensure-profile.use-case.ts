import type { ProfileRepository } from "../repositories/profile.repository";
import { Profile } from "../aggregates/profile";
import type { Logger } from "../common/logger";
import { IncompleteRegistrationError } from "../errors/domain-errors";

/**
 * Use Case: EnsureProfile
 * Ensures that a profile exists for a given user. If it doesn't exist, it creates it using the provided name.
 * Handles the recovery of profiles missed during normal or OAuth registration.
 */
export class EnsureProfileUseCase {
  constructor(
    private readonly profileRepo: ProfileRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * Ensures the user has a profile.
   *
   * @param userId - The user's ID
   * @param fallbackName - The chosen username (from auth table or registration input)
   * @param isNewUser - Optional. From auth result.
   */
  async execute(
    userId: string,
    fallbackName?: string,
    isNewUser?: boolean,
  ): Promise<Profile> {
    const existingProfile = await this.profileRepo.findById(userId);

    if (existingProfile) {
      return existingProfile;
    }

    try {
      let safeName = fallbackName ?? "user_" + userId.slice(0, 5);
      safeName = safeName.replace(/\s+/g, " ").trim();
      if (safeName.length > 30) {
        safeName = safeName.slice(0, 30).trim();
      }

      // Ensure name doesn't become empty or too short after slicing/trimming
      if (safeName.length < 3) {
        safeName = "user_" + userId.slice(0, 5);
      }

      const normalizedUsername = Profile.validateUsername(safeName);
      const newProfile = Profile.create({
        id: userId,
        username: normalizedUsername,
      });

      await this.profileRepo.save(newProfile);
      return newProfile;
    } catch (error) {
      try {
        this.logger.error("Profile creation failed while ensuring profile", {
          userId,
          isNewUser,
          originalError: error instanceof Error ? error.message : String(error),
        });
      } catch (_logError) {
        // Logging is best-effort
      }
      throw new IncompleteRegistrationError(
        userId,
        isNewUser,
        "User registered but profile creation failed. Registration is incomplete.",
        { cause: error },
      );
    }
  }
}
