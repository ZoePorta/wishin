import type { LoginUserInput } from "./dtos/auth.dto";
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
   * @returns A Promise that resolves when login is successful.
   * @throws {Error} If login fails.
   */
  async execute(input: LoginUserInput): Promise<void> {
    await this.authRepo.login(input.email, input.password);
  }
}
