/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUserUseCase } from "./login-user.use-case";
import { Profile } from "../aggregates/profile";
import { IncompleteRegistrationError } from "../errors/domain-errors";
import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";

describe("LoginUserUseCase", () => {
  let useCase: LoginUserUseCase;
  let authRepo: AuthRepository;
  let profileRepo: ProfileRepository;

  beforeEach(() => {
    authRepo = {
      login: vi.fn(),
    } as unknown as AuthRepository;
    profileRepo = {
      findById: vi.fn(),
    } as unknown as ProfileRepository;
    useCase = new LoginUserUseCase(authRepo, profileRepo);
  });

  const validLoginInput = {
    email: "test@example.com",
    password: "Password123!",
  };

  it("should return the AuthResult when login and profile check are successful", async () => {
    const authResult = {
      userId: "user-123",
      email: validLoginInput.email,
      isNewUser: false,
    };
    const mockProfile = Profile.reconstitute({
      id: "user-123",
      username: "testuser",
    });

    vi.mocked(authRepo.login).mockResolvedValue(authResult);
    vi.mocked(profileRepo.findById).mockResolvedValue(mockProfile);

    const result = await useCase.execute(validLoginInput);

    expect(authRepo.login).toHaveBeenCalledWith(
      validLoginInput.email,
      validLoginInput.password,
    );
    expect(profileRepo.findById).toHaveBeenCalledWith("user-123");
    expect(result).toEqual(authResult);
  });

  it("should throw IncompleteRegistrationError if profile is missing after login", async () => {
    const authResult = {
      userId: "user-123",
      email: validLoginInput.email,
      isNewUser: false,
    };

    vi.mocked(authRepo.login).mockResolvedValue(authResult);
    vi.mocked(profileRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute(validLoginInput)).rejects.toThrow(
      IncompleteRegistrationError,
    );
    await expect(useCase.execute(validLoginInput)).rejects.toThrow(
      /Login successful but profile is missing/,
    );
  });

  it("should propagate errors from authRepo.login", async () => {
    const error = new Error("Auth failed");
    vi.mocked(authRepo.login).mockRejectedValue(error);

    await expect(useCase.execute(validLoginInput)).rejects.toThrow(error);
    expect(profileRepo.findById).not.toHaveBeenCalled();
  });
});
