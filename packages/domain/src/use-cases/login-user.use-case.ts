import type { LoginUserInput, AuthResult } from "./dtos/auth.dto";
import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import { IncompleteRegistrationError } from "../errors/domain-errors";

/**
 * Use Case: LoginUser
 * Handles user login.
 */
export class LoginUserUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly profileRepo: ProfileRepository,
  ) {}

  /**
   * Logs in a user with their credentials.
   *
   * @param input - The login credentials (email, password).
   * @returns A Promise that resolves to the AuthResult when login is successful.
   * @throws {Error} If login fails.
   */
  async execute(input: LoginUserInput): Promise<AuthResult> {
    const authResult = await this.authRepo.login(input.email, input.password);

    const profile = await this.profileRepo.findById(authResult.userId);
    if (!profile) {
      throw new IncompleteRegistrationError(
        authResult.userId,
        false, // Not a new user in the context of being just created (it's a login)
        "Login successful but profile is missing. Registration is incomplete.",
      );
    }

    return authResult;
  }
}
