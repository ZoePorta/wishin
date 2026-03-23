import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateUUID } from "./uuid";

describe("generateUUID", () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    // Reset crypto before each test
    vi.stubGlobal("crypto", originalCrypto);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return a valid UUID format when crypto.randomUUID is available", () => {
    const uuid = generateUUID();
    // Basic regex check for UUID v4
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("should use the fallback when crypto.randomUUID is not available", () => {
    // Mock crypto without randomUUID
    vi.stubGlobal("crypto", { getRandomValues: vi.fn() });

    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("should use the fallback when crypto is not defined", () => {
    vi.stubGlobal("crypto", undefined);

    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
