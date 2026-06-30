/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnsureProfileUseCase } from "./ensure-profile.use-case";
import { Profile } from "../aggregates/profile";
import { IncompleteRegistrationError } from "../errors/domain-errors";

import type { ProfileRepository } from "../repositories/profile.repository";
import type { Logger } from "../common/logger";

describe("EnsureProfileUseCase", () => {
  let useCase: EnsureProfileUseCase;
  let profileRepo: ProfileRepository;
  let logger: Logger;

  const userId = "abc1234"; // slice(0,5) → "abc12", so fallback = "user_abc12"

  beforeEach(() => {
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

    useCase = new EnsureProfileUseCase(profileRepo, logger);
  });

  // ─── Case 1: existing profile ──────────────────────────────────────────────

  it("should return the existing profile without calling save", async () => {
    const existingProfile = Profile.reconstitute({
      id: userId,
      username: "existing_user",
    });
    vi.mocked(profileRepo.findById).mockResolvedValue(existingProfile);

    const result = await useCase.execute(userId, "any name");

    expect(profileRepo.findById).toHaveBeenCalledWith(userId);
    expect(profileRepo.save).not.toHaveBeenCalled();
    expect(result).toBe(existingProfile);
  });

  // ─── Case 2: happy-path creation ──────────────────────────────────────────

  it("should create and save a profile when fallbackName is valid", async () => {
    vi.mocked(profileRepo.findById).mockResolvedValue(null);
    vi.mocked(profileRepo.save).mockResolvedValue(undefined);

    const result = await useCase.execute(userId, "john doe", true);

    expect(profileRepo.save).toHaveBeenCalledOnce();

    const savedProfile = vi.mocked(profileRepo.save).mock.calls[0]?.[0];
    expect(savedProfile).toBeDefined();
    expect(savedProfile).toBeInstanceOf(Profile);
    expect(savedProfile.username).toBe(Profile.validateUsername("john doe"));
    expect(result).toBeInstanceOf(Profile);
    expect(result.id).toBe(userId);
  });

  // ─── Case 3: userId-based fallback when fallbackName is absent/empty ───────

  it.each([
    ["undefined", undefined],
    ["empty string", ""],
    ["only whitespace", "   "],
  ])(
    "should fall back to userId-derived username when fallbackName is %s",
    async (_label, fallbackName) => {
      vi.mocked(profileRepo.findById).mockResolvedValue(null);
      vi.mocked(profileRepo.save).mockResolvedValue(undefined);

      const result = await useCase.execute(userId, fallbackName);

      expect(profileRepo.save).toHaveBeenCalledOnce();
      expect(result.username).toBe("user_" + userId.slice(0, 5));
    },
  );

  // ─── Case 4: truncation leaves a trailing separator ───────────────────────

  it("should strip trailing separators after truncation and fall back when result is < 3 chars", async () => {
    // Exactly 30 chars with a trailing dash that makes the stripped version invalid
    // e.g. "ab-" after strip → "ab" (length 2 < 3) → userId fallback
    const trailingDashName = "ab" + "-".repeat(28); // "ab" + 28 dashes = 30 chars

    vi.mocked(profileRepo.findById).mockResolvedValue(null);
    vi.mocked(profileRepo.save).mockResolvedValue(undefined);

    const result = await useCase.execute(userId, trailingDashName);

    // After strip, "ab" is only 2 chars → userId fallback applies
    expect(result.username).toBe("user_" + userId.slice(0, 5));
  });

  it("should strip a trailing separator but keep a still-valid name", async () => {
    // 29 chars of valid name + 1 trailing dot = 30 chars total
    const nameWith29Chars = "a".repeat(10) + "_" + "b".repeat(18); // 29 chars, valid
    const nameWithTrailingDot = nameWith29Chars + "."; // 30 chars, last char is separator

    vi.mocked(profileRepo.findById).mockResolvedValue(null);
    vi.mocked(profileRepo.save).mockResolvedValue(undefined);

    const result = await useCase.execute(userId, nameWithTrailingDot);

    // After strip the dot, we get 29 valid chars
    expect(result.username).toBe(nameWith29Chars);
  });

  // ─── Case 5: save failure → IncompleteRegistrationError ──────────────────

  it("should throw IncompleteRegistrationError with original cause when save fails", async () => {
    const saveError = new Error("Persistence failure");
    vi.mocked(profileRepo.findById).mockResolvedValue(null);
    vi.mocked(profileRepo.save).mockRejectedValue(saveError);

    const failing = useCase.execute(userId, "valid name", true);

    await expect(failing).rejects.toThrow(IncompleteRegistrationError);
    await expect(failing).rejects.toMatchObject({
      cause: saveError,
      userId,
      isNewUser: true,
    });

    expect(logger.error).toHaveBeenCalled();
  });
});
