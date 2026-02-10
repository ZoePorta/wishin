import { describe, it, expect } from "vitest";
import { isValidUUID } from "./validation-utils";

describe("isValidUUID", () => {
  it("should return true for a valid UUID v4", () => {
    const validUUID = "123e4567-e89b-42d3-a456-426614174000";
    expect(isValidUUID(validUUID)).toBe(true);
  });

  it("should return true for another valid UUID v4 (uppercase)", () => {
    const validUUIDUpper = "123E4567-E89B-42D3-A456-426614174000";
    expect(isValidUUID(validUUIDUpper)).toBe(true);
  });

  it("should return false for an invalid UUID v4 (wrong version)", () => {
    // v1 UUID (time-based)
    const v1UUID = "123e4567-e89b-12d3-a456-426614174000";
    expect(isValidUUID(v1UUID)).toBe(false);
  });

  it("should return false for a malformed UUID (wrong length)", () => {
    expect(isValidUUID("123e4567-e89b-42d3-a456-42661417400")).toBe(false);
    expect(isValidUUID("123e4567-e89b-42d3-a456-4266141740000")).toBe(false);
  });

  it("should return false for a malformed UUID (invalid characters)", () => {
    expect(isValidUUID("123e4567-e89b-42d3-a456-42661417400g")).toBe(false); // 'g' is invalid hex
  });

  it("should return false for a malformed UUID (missing hyphens)", () => {
    expect(isValidUUID("123e4567e89b42d3a456426614174000")).toBe(false);
  });

  it("should return false for an empty string", () => {
    expect(isValidUUID("")).toBe(false);
  });

  it("should return false for a non-UUID string", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
    expect(isValidUUID("   ")).toBe(false);
  });
});
