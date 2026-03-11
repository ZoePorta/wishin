import type { RegisterUserInput } from "./dtos/auth.dto";
import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { Logger } from "../common/logger";
import { Profile } from "../aggregates/profile";
import { IncompleteRegistrationError } from "../errors/domain-errors";

/**
 * Use Case: RegisterUser
 * Handles user registration and profile creation.
 */
export class RegisterUserUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * Registers a new user and creates their associated profile.
   *
   * @param input - The registration data (email, password, username).
   * @returns A Promise that resolves when registration and profile creation are complete.
   * @throws {Error} If authentication or profile creation fails.
   */
  async execute(input: RegisterUserInput): Promise<void> {
    // 1. Validation: Fail fast before creating auth identity
    const normalizedUsername = Profile.validateUsername(input.username);

    // 2. Register with Auth Service
    const authResult = await this.authRepo.register(
      input.email,
      input.password,
    );

    try {
      // 3. Create and Save Profile
      // Using the same ID from Auth as the Profile ID (ADR 014/018)
      const profile = Profile.create({
        id: authResult.userId,
        username: normalizedUsername,
      });

      await this.profileRepo.save(profile);
    } catch (error) {
      // 4. Compensation: Log and surface partial registration (ADR 018)
      try {
        this.logger.error("Profile creation failed after auth success", {
          userId: authResult.userId,
          isNewUser: authResult.isNewUser,
          originalError: error instanceof Error ? error.message : String(error),
        });
      } catch (_logError) {
        // Logging is best-effort; avoid throwing here to ensure domain error is propagated
      }

      throw new IncompleteRegistrationError(
        authResult.userId,
        authResult.isNewUser,
        "User registered but profile creation failed. Registration is incomplete.",
        { cause: error },
      );
    }
  }
}
