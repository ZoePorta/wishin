/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterUserUseCase } from "./register-user.use-case";
import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { Logger } from "../common/logger";
import { Profile } from "../aggregates/profile";

describe("RegisterUserUseCase", () => {
  let useCase: RegisterUserUseCase;
  let authRepo: AuthRepository;
  let profileRepo: ProfileRepository;
  let logger: Logger;

  beforeEach(() => {
    authRepo = {
      register: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      deleteUser: vi.fn(),
    };
    profileRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    useCase = new RegisterUserUseCase(authRepo, profileRepo, logger);
  });

  const validRegistrationInput = {
    email: "test@example.com",
    password: "Password123!",
    username: "testuser",
  };

  it("should register a user and create a profile", async () => {
    const userId = "user-123";
    vi.mocked(authRepo.register).mockResolvedValue({
      userId: "user-123",
      email: validRegistrationInput.email,
      isNewUser: true,
    });
    vi.mocked(profileRepo.save).mockResolvedValue(undefined);

    await useCase.execute(validRegistrationInput);

    expect(authRepo.register).toHaveBeenCalledWith(
      validRegistrationInput.email,
      validRegistrationInput.password,
    );
    expect(profileRepo.save).toHaveBeenCalledWith(expect.any(Profile));

    const savedProfile = vi.mocked(profileRepo.save).mock.calls[0][0];
    expect(savedProfile.id).toBe(userId);
    expect(savedProfile.username).toBe(validRegistrationInput.username);
  });

  it("should throw an error if registration fails", async () => {
    vi.mocked(authRepo.register).mockRejectedValue(new Error("Auth failed"));

    await expect(useCase.execute(validRegistrationInput)).rejects.toThrow(
      "Auth failed",
    );
    expect(profileRepo.save).not.toHaveBeenCalled();
  });

  it("should throw an error if profile creation fails and call compensation (deleteUser) if it was a new user", async () => {
    const userId = "user-123";
    vi.mocked(authRepo.register).mockResolvedValue({
      userId,
      email: validRegistrationInput.email,
      isNewUser: true,
    });
    vi.mocked(profileRepo.save).mockRejectedValue(new Error("DB failed"));

    await expect(useCase.execute(validRegistrationInput)).rejects.toThrow(
      "DB failed",
    );
    expect(authRepo.deleteUser).toHaveBeenCalledWith(userId);
  });

  it("should throw an error if profile creation fails but NOT call compensation (deleteUser) if it was an anonymous promotion", async () => {
    const userId = "user-123";
    vi.mocked(authRepo.register).mockResolvedValue({
      userId,
      email: validRegistrationInput.email,
      isNewUser: false,
    });
    vi.mocked(profileRepo.save).mockRejectedValue(new Error("DB failed"));

    await expect(useCase.execute(validRegistrationInput)).rejects.toThrow(
      "DB failed",
    );
    expect(authRepo.deleteUser).not.toHaveBeenCalled();
  });

  it("should log an error and rethrow the original error if compensation (deleteUser) fails", async () => {
    const userId = "user-123";
    vi.mocked(authRepo.register).mockResolvedValue({
      userId,
      email: validRegistrationInput.email,
      isNewUser: true,
    });
    vi.mocked(profileRepo.save).mockRejectedValue(
      new Error("Original DB failure"),
    );
    vi.mocked(authRepo.deleteUser).mockRejectedValue(
      new Error("Compensation failure"),
    );

    await expect(useCase.execute(validRegistrationInput)).rejects.toThrow(
      "Original DB failure",
    );

    expect(authRepo.deleteUser).toHaveBeenCalledWith(userId);
    expect(logger.error).toHaveBeenCalledWith(
      "Compensating user deletion failed",
      expect.objectContaining({
        userId,
        originalError: "Original DB failure",
        compensationError: "Compensation failure",
      }),
    );
  });
});
