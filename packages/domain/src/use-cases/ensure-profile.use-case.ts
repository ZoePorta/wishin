import type { ProfileRepository } from "../repositories/profile.repository";
import { Profile } from "../aggregates/profile";
import type { Logger } from "../common/logger";
import { IncompleteRegistrationError } from "../errors/domain-errors";

/**
 * Use Case: EnsureProfile
 * Ensures that a profile exists for a given user. If it doesn't exist, it creates it using the provided name.
 * Handles the recovery of profiles missed during normal or OAuth registration.
 */
/**
 * Orchestrates profile resolution for a given user.
 *
 * Looks up an existing {@link Profile} by `userId`. If none is found, derives
 * a valid username from `fallbackName` (trimming whitespace, capping at 30
 * characters, stripping trailing separators) and creates a new profile.
 * Falls back to a `"user_" + userId.slice(0, 5)` username when the sanitised
 * name cannot pass {@link Profile.validateUsername}.
 */
export class EnsureProfileUseCase {
  /**
   * Creates a new instance of `EnsureProfileUseCase`.
   *
   * @param profileRepo - Repository used to look up and persist {@link Profile} aggregates.
   * @param logger - Logger used to record profile-creation failures.
   */
  constructor(
    private readonly profileRepo: ProfileRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * Ensures the user has a profile, creating one if it does not exist.
   *
   * @param userId - The unique identifier of the user (from the auth provider).
   * @param fallbackName - The preferred username, sourced from the auth table or
   *   registration input. When absent, a username is derived from `userId`.
   * @param isNewUser - Whether the user was freshly created (`true`), pre-existing
   *   (`false`), or unknown (`undefined`). Passed through to
   *   {@link IncompleteRegistrationError} for recovery context.
   * @returns A `Promise` that resolves to the resolved or newly created {@link Profile}.
   * @throws {IncompleteRegistrationError} When profile creation fails (e.g. a
   *   persistence error). The original error is set as the `.cause` of the thrown
   *   exception.
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

      // Strip any trailing separator characters that may remain after truncation
      // (e.g. "abc-def-" → "abc-def") to prevent validateUsername from throwing.
      safeName = safeName.replace(/[._'-]+$/, "");

      // Ensure name is valid after slicing/trimming/stripping:
      // use a safe check instead of validateUsername (which throws) to avoid
      // the outer catch re-wrapping a fixable naming issue.
      const usernameOk =
        safeName.length >= 3 &&
        /^[\p{L}\p{N}]+(?:[ ._'-][\p{L}\p{N}]+)*$/u.test(safeName);
      if (!usernameOk) {
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
