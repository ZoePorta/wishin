import type { RegisterUserInput } from "./dtos/auth.dto";
import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import { Profile } from "../aggregates/profile";

/**
 * Use Case: RegisterUser
 * Handles user registration and profile creation.
 */
export class RegisterUserUseCase {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly profileRepo: ProfileRepository,
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

    // 2. Create and Save Profile
    // Using the same ID from Auth as the Profile ID (ADR 014/018)
    const profile = Profile.create({
      id: authResult.userId,
      username: input.username,
    });

    await this.profileRepo.save(profile);
  }
}
