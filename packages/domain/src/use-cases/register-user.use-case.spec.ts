/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterUserUseCase } from "./register-user.use-case";
import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { Logger } from "../common/logger";
import { Profile } from "../aggregates/profile";
import { IncompleteRegistrationError } from "../errors/domain-errors";

describe("RegisterUserUseCase", () => {
  let useCase: RegisterUserUseCase;
  let authRepo: AuthRepository;
  let profileRepo: ProfileRepository;
  let logger: Logger;

  beforeEach(() => {
    authRepo = {
      register: vi.fn(),
      login: vi.fn(),
      getGoogleOAuthUrl: vi.fn(),
      completeGoogleOAuth: vi.fn(),
      logout: vi.fn(),
      cleanupAuthAfterFailedRegistration: vi.fn(),
      loginAnonymously: vi.fn(),
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
      type: "authenticated",
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

  it("should log an error and throws IncompleteRegistrationError but does NOT call cleanupAuthAfterFailedRegistration when profile creation fails for a new user", async () => {
    const userId = "user-123";
    vi.mocked(authRepo.register).mockResolvedValue({
      type: "authenticated",
      userId,
      email: validRegistrationInput.email,
      isNewUser: true,
    });
    vi.mocked(profileRepo.save).mockRejectedValue(new Error("DB failed"));

    const errorPromise = useCase.execute(validRegistrationInput);
    await expect(errorPromise).rejects.toThrow(IncompleteRegistrationError);

    const error = (await errorPromise.catch(
      (e: unknown) => e,
    )) as IncompleteRegistrationError;
    expect(error.userId).toBe(userId);
    expect(error.isNewUser).toBe(true);
    expect((error.cause as Error).message).toBe("DB failed");

    expect(authRepo.cleanupAuthAfterFailedRegistration).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "Profile creation failed after auth success",
      expect.objectContaining({
        userId,
        isNewUser: true,
        originalError: "DB failed",
      }),
    );
  });

  it("should throw IncompleteRegistrationError but does NOT call cleanupAuthAfterFailedRegistration when profile creation fails after anonymous promotion", async () => {
    const userId = "user-123";
    vi.mocked(authRepo.register).mockResolvedValue({
      type: "authenticated",
      userId,
      email: validRegistrationInput.email,
      isNewUser: false,
    });
    vi.mocked(profileRepo.save).mockRejectedValue(new Error("DB failed"));

    const errorPromise = useCase.execute(validRegistrationInput);
    await expect(errorPromise).rejects.toThrow(IncompleteRegistrationError);

    const error = (await errorPromise.catch(
      (e: unknown) => e,
    )) as IncompleteRegistrationError;
    expect(error.userId).toBe(userId);
    expect(error.isNewUser).toBe(false);
    expect((error.cause as Error).message).toBe("DB failed");

    expect(authRepo.cleanupAuthAfterFailedRegistration).not.toHaveBeenCalled();
  });

  it("should reject invalid usernames before calling auth or profile repositories", async () => {
    const invalidInput = {
      ...validRegistrationInput,
      username: "a", // Too short
    };

    await expect(useCase.execute(invalidInput)).rejects.toThrow(
      /Invalid username/,
    );

    expect(authRepo.register).not.toHaveBeenCalled();
    expect(profileRepo.save).not.toHaveBeenCalled();
  });
});
