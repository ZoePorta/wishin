import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterUserUseCase } from "./register-user.use-case";
import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import { Profile } from "../aggregates/profile";

describe("RegisterUserUseCase", () => {
  let useCase: RegisterUserUseCase;
  let authRepo: AuthRepository;
  let profileRepo: ProfileRepository;

  beforeEach(() => {
    authRepo = {
      register: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    };
    profileRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    useCase = new RegisterUserUseCase(authRepo, profileRepo);
  });

  const validRegistrationInput = {
    email: "test@example.com",
    password: "Password123!",
    username: "testuser",
  };

  it("should register a user and create a profile", async () => {
    const userId = "user-123";
    vi.mocked(authRepo.register).mockResolvedValue({
      userId,
      email: validRegistrationInput.email,
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

  it("should throw an error if profile creation fails", async () => {
    vi.mocked(authRepo.register).mockResolvedValue({
      userId: "user-123",
      email: validRegistrationInput.email,
    });
    vi.mocked(profileRepo.save).mockRejectedValue(new Error("DB failed"));

    await expect(useCase.execute(validRegistrationInput)).rejects.toThrow(
      "DB failed",
    );
  });
});
