import type { LoginUserInput, AuthResult } from "./dtos/auth.dto";
import type { AuthRepository } from "../repositories/auth.repository";

/**
 * Use Case: LoginUser
 * Handles user login.
 */
export class LoginUserUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  /**
   * Logs in a user with their credentials.
   *
   * @param input - The login credentials (email, password).
   * @returns A Promise that resolves to the AuthResult when login is successful.
   * @throws {Error} If login fails.
   */
  async execute(input: LoginUserInput): Promise<AuthResult> {
    return await this.authRepo.login(input.email, input.password);
  }
}
