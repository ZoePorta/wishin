import type { RegisterUserInput } from "./dtos/auth.dto";
import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { Logger } from "../common/logger";
import { Profile } from "../aggregates/profile";

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
    // 1. Register with Auth Service
    const authResult = await this.authRepo.register(
      input.email,
      input.password,
    );

    try {
      // 2. Create and Save Profile
      // Using the same ID from Auth as the Profile ID (ADR 014/018)
      const profile = Profile.create({
        id: authResult.userId,
        username: input.username,
      });

      await this.profileRepo.save(profile);
    } catch (error) {
      // 3. Compensation: Delete the user ONLY if it was a newly created account
      // If it was an anonymous promotion, we never delete to avoid data loss (ADR 018)
      if (authResult.isNewUser) {
        // NOTE: We no longer delete the user here to support "Incomplete Accounts".
        // This allows the user to retry profile creation later without losing their identity.
        // It also avoids using privileged deleteUser calls in the client SDK.
        this.logger.error("Profile creation failed for new user", {
          userId: authResult.userId,
          originalError: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }
  }
}
