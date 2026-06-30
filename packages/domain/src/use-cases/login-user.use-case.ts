import type { LoginUserInput, AuthenticatedAuthResult } from "./dtos/auth.dto";
import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";

import { EnsureProfileUseCase } from "./ensure-profile.use-case";
import type { Logger } from "../common/logger";

/**
 * Use Case: LoginUser
 * Handles user login.
 */
export class LoginUserUseCase {
  /**
   * Initializes the login use case.
   *
   * @param authRepo - The repository for authentication operations.
   * @param profileRepo - The repository for managing user profiles.
   * @param logger - The logger used for recording errors during profile recovery.
   */
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * Logs in a user with their credentials.
   *
   * @param input - The login credentials (email, password).
   * @returns A Promise that resolves to the AuthenticatedAuthResult when login is successful.
   * @throws {Error} If login fails.
   */
  async execute(input: LoginUserInput): Promise<AuthenticatedAuthResult> {
    const authResult = await this.authRepo.login(input.email, input.password);

    const ensureProfileUseCase = new EnsureProfileUseCase(
      this.profileRepo,
      this.logger,
    );
    await ensureProfileUseCase.execute(
      authResult.userId,
      authResult.name,
      authResult.isNewUser,
    );

    return authResult;
  }
}
