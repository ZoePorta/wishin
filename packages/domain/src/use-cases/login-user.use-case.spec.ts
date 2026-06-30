/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUserUseCase } from "./login-user.use-case";
import { Profile } from "../aggregates/profile";

import type { AuthRepository } from "../repositories/auth.repository";
import type { ProfileRepository } from "../repositories/profile.repository";
import type { Logger } from "../common/logger";
import type { AuthenticatedAuthResult } from "./dtos/auth.dto";

describe("LoginUserUseCase", () => {
  let useCase: LoginUserUseCase;
  let authRepo: AuthRepository;
  let profileRepo: ProfileRepository;

  let logger: Logger;

  beforeEach(() => {
    authRepo = {
      login: vi.fn(),
    } as unknown as AuthRepository;
    profileRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    } as unknown as ProfileRepository;
    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    useCase = new LoginUserUseCase(authRepo, profileRepo, logger);
  });

  const validLoginInput = {
    email: "test@example.com",
    password: "Password123!",
  };

  it("should return the AuthResult when login and profile check are successful", async () => {
    const authResult: AuthenticatedAuthResult = {
      type: "authenticated",
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

  it("should create profile if profile is missing after login", async () => {
    const authResult: AuthenticatedAuthResult = {
      type: "authenticated",
      userId: "user-123",
      email: validLoginInput.email,
      name: "john doe",
      isNewUser: false,
    };

    vi.mocked(authRepo.login).mockResolvedValue(authResult);
    vi.mocked(profileRepo.findById).mockResolvedValue(null);
    vi.mocked(profileRepo.save).mockResolvedValue(undefined);

    await useCase.execute(validLoginInput);

    expect(profileRepo.save).toHaveBeenCalled();
  });

  it("should propagate errors from authRepo.login", async () => {
    const error = new Error("Auth failed");
    vi.mocked(authRepo.login).mockRejectedValue(error);

    await expect(useCase.execute(validLoginInput)).rejects.toThrow(error);
    expect(profileRepo.findById).not.toHaveBeenCalled();
  });
});
