import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface MockWindow {
  location: {
    origin: string;
  };
}

describe("Config", () => {
  const originalEnv = process.env;
  const originalWindow = (global as unknown as { window: unknown }).window;

  function setMockWindow(mock?: MockWindow) {
    if (mock) {
      (global as unknown as { window: MockWindow }).window = mock;
    } else {
      delete (global as unknown as { window?: MockWindow }).window;
    }
  }

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    (global as unknown as { window: unknown }).window = originalWindow;
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

  it("should return default dev URL if EXPO_PUBLIC_BASE_URL is missing in dev (no window)", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    setMockWindow(undefined);
    const { Config } = await import("./Config");
    expect(Config.baseUrl).toBe("http://localhost:8081");
  });

  it("should return current origin on web in production even if EXPO_PUBLIC_BASE_URL is missing", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    // Mock window
    setMockWindow({ location: { origin: "https://web-app.host/" } });

    const { Config } = await import("./Config");
    expect(Config.baseUrl).toBe("https://web-app.host");
  });

  it("should prioritize window origin over EXPO_PUBLIC_BASE_URL on web in production", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "https://env-config.com");
    vi.stubEnv("NODE_ENV", "production");

    // Mock window
    setMockWindow({
      location: { origin: "https://actual-site.com" },
    });

    const { Config } = await import("./Config");
    expect(Config.baseUrl).toBe("https://actual-site.com");
  });

  it("should return window origin in dev on web if EXPO_PUBLIC_BASE_URL is missing", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "development");

    // Mock window
    setMockWindow({ location: { origin: "http://localhost:19006" } });

    const { Config } = await import("./Config");
    expect(Config.baseUrl).toBe("http://localhost:19006");
  });

  it("should throw error if EXPO_PUBLIC_BASE_URL is missing in production and NOT on web", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");

    // Ensure window is undefined (simulating mobile)
    setMockWindow(undefined);

    const { Config } = await import("./Config");
    expect(() => Config.baseUrl).toThrow("Missing EXPO_PUBLIC_BASE_URL");
  });

  it("should throw error for invalid URL", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "not-a-url");
    vi.stubEnv("NODE_ENV", "production");
    setMockWindow(undefined);

    const { Config } = await import("./Config");
    expect(() => Config.baseUrl).toThrow("Invalid EXPO_PUBLIC_BASE_URL");
  });

  it("should throw error for insecure URL in production", async () => {
    vi.stubEnv("EXPO_PUBLIC_BASE_URL", "http://example.com");
    vi.stubEnv("NODE_ENV", "production");
    setMockWindow(undefined);

    const { Config } = await import("./Config");
    expect(() => Config.baseUrl).toThrow(
      "Insecure EXPO_PUBLIC_BASE_URL detected",
    );
  });
});
