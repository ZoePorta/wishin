import type { RegisterUserInput } from "./dtos/auth.dto";
import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { Logger } from "../common/logger";
import { Profile } from "../aggregates/profile";
import { EnsureProfileUseCase } from "./ensure-profile.use-case";

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
      normalizedUsername,
    );

    const ensureProfileUseCase = new EnsureProfileUseCase(
      this.profileRepo,
      this.logger,
    );
    await ensureProfileUseCase.execute(
      authResult.userId,
      normalizedUsername,
      authResult.isNewUser,
    );
  }
}
