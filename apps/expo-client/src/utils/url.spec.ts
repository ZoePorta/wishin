import { describe, it, expect } from "vitest";
import { validateRedirect } from "./url";

describe("validateRedirect", () => {
  const FALLBACK = "/owner/dashboard";

  it("should return fallback for undefined path", () => {
    expect(validateRedirect(undefined)).toBe(FALLBACK);
  });

  it("should return fallback for empty string", () => {
    expect(validateRedirect("")).toBe(FALLBACK);
  });

  it("should return fallback for external URLs", () => {
    expect(validateRedirect("https://example.com")).toBe(FALLBACK);
    expect(validateRedirect("http://example.com")).toBe(FALLBACK);
    expect(validateRedirect("javascript:alert(1)")).toBe(FALLBACK);
  });

  it("should return fallback for protocol-relative URLs", () => {
    expect(validateRedirect("//example.com")).toBe(FALLBACK);
  });

  it("should return fallback for URLs with scheme", () => {
    expect(validateRedirect("app://callback")).toBe(FALLBACK);
  });

  it("should allow exact matches for safe routes", () => {
    expect(validateRedirect("/owner/dashboard")).toBe("/owner/dashboard");
    expect(validateRedirect("/owner/settings")).toBe("/owner/settings");
    expect(validateRedirect("/")).toBe("/");
  });

  it("should allow wishlist routes", () => {
    expect(validateRedirect("/wishlist")).toBe("/wishlist");
    expect(validateRedirect("/wishlist/")).toBe("/wishlist/");
    expect(validateRedirect("/wishlist/123")).toBe("/wishlist/123");
    expect(validateRedirect("/wishlist/abc-def-ghi")).toBe(
      "/wishlist/abc-def-ghi",
    );
  });

  it("should return fallback for other internal paths", () => {
    expect(validateRedirect("/profile")).toBe(FALLBACK);
    expect(validateRedirect("/login")).toBe(FALLBACK);
  });

  it("should return fallback for paths that partially match wishlist but are invalid", () => {
    expect(validateRedirect("/wishlist-fake")).toBe(FALLBACK);
    expect(validateRedirect("/not-a-wishlist")).toBe(FALLBACK);
  });
});
