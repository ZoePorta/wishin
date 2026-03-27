import { describe, it, expect } from "vitest";
import { addAlpha } from "./colors";

describe("addAlpha", () => {
  it("should add alpha to 6-digit hex", () => {
    expect(addAlpha("#ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("should add alpha to 3-digit hex", () => {
    expect(addAlpha("#fff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("should handle hex without #", () => {
    expect(addAlpha("ffffff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
    expect(addAlpha("fff", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("should handle rgb strings", () => {
    expect(addAlpha("rgb(255, 255, 255)", 0.5)).toBe(
      "rgba(255, 255, 255, 0.5)",
    );
  });

  it("should handle rgba strings by override", () => {
    expect(addAlpha("rgba(255, 255, 255, 1)", 0.5)).toBe(
      "rgba(255, 255, 255, 0.5)",
    );
  });

  it("should handle whitespace", () => {
    expect(addAlpha("  #ffffff  ", 0.5)).toBe("rgba(255, 255, 255, 0.5)");
  });

  it("should return original on invalid format", () => {
    expect(addAlpha("invalid", 0.5)).toBe("invalid");
  });

  it("should handle empty string with black fallback", () => {
    expect(addAlpha("", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
  });

  it("should handle whitespace-only string with black fallback", () => {
    expect(addAlpha("   ", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
  });

  it("should clamp alpha between 0 and 1", () => {
    expect(addAlpha("#ffffff", -0.5)).toBe("rgba(255, 255, 255, 0)");
    expect(addAlpha("#ffffff", 1.5)).toBe("rgba(255, 255, 255, 1)");
  });
});
