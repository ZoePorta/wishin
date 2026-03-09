import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginUserUseCase } from "./login-user.use-case";
import type { AuthRepository } from "../repositories/auth.repository";

describe("LoginUserUseCase", () => {
  let useCase: LoginUserUseCase;
  let authRepo: AuthRepository;

  beforeEach(() => {
    authRepo = {
      register: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    };
    useCase = new LoginUserUseCase(authRepo);
  });

  const validLoginInput = {
    email: "test@example.com",
    password: "Password123!",
  };

  it("should login a user successfully", async () => {
    vi.mocked(authRepo.login).mockResolvedValue({
      userId: "user-123",
      email: validLoginInput.email,
    });

    await useCase.execute(validLoginInput);

    expect(authRepo.login).toHaveBeenCalledWith(
      validLoginInput.email,
      validLoginInput.password,
    );
  });

  it("should throw an error if login fails", async () => {
    vi.mocked(authRepo.login).mockRejectedValue(new Error("Login failed"));

    await expect(useCase.execute(validLoginInput)).rejects.toThrow(
      "Login failed",
    );
  });
});
