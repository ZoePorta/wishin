import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("should normalize base URL with trailing slash", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "https://example.com/");
    vi.stubEnv("NODE_ENV", "production");
    const { Config } = await import("./Config");
    expect(Config.baseUrl).toBe("https://example.com");
  });

  it("should normalize base URL with nested path and trailing slash", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "https://example.com/api/");
    vi.stubEnv("NODE_ENV", "production");
    const { Config } = await import("./Config");
    expect(Config.baseUrl).toBe("https://example.com/api");
  });

  it("should normalize base URL with multiple trailing slashes", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "https://example.com/api//");
    vi.stubEnv("NODE_ENV", "production");
    const { Config } = await import("./Config");
    expect(Config.baseUrl).toBe("https://example.com/api");
  });

  it("should return default dev URL if EXPO_PUBLIC_BASE_URL is missing in dev", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    const { Config } = await import("./Config");
    expect(Config.baseUrl).toBe("http://localhost:8081");
  });

  it("should throw error if EXPO_PUBLIC_BASE_URL is missing in production", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    const { Config } = await import("./Config");
    expect(() => Config.baseUrl).toThrow("Missing EXPO_PUBLIC_BASE_URL");
  });

  it("should treat whitespace-only EXPO_PUBLIC_BASE_URL as missing in production", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "   ");
    vi.stubEnv("NODE_ENV", "production");

    const { Config } = await import("./Config");
    expect(() => Config.baseUrl).toThrow("Missing EXPO_PUBLIC_BASE_URL");
  });

  it("should throw error for invalid URL", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "not-a-url");
    vi.stubEnv("NODE_ENV", "production");

    const { Config } = await import("./Config");
    expect(() => Config.baseUrl).toThrow("Invalid EXPO_PUBLIC_BASE_URL");
  });

  it("should throw error for insecure URL in production", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "http://example.com");
    vi.stubEnv("NODE_ENV", "production");

    const { Config } = await import("./Config");
    expect(() => Config.baseUrl).toThrow(
      "Insecure EXPO_PUBLIC_BASE_URL detected",
    );
  });
});
