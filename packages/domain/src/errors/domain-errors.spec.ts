import { describe, it, expect } from "vitest";
import { PersistenceError, OAuthCallbackError } from "./domain-errors";

describe("PersistenceError", () => {
  it("should be instantiable with a message", () => {
    const message = "Test persistence error";
    const error = new PersistenceError(message);

    expect(error).toBeInstanceOf(PersistenceError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(message);
  });

  it("should have the correct name property", () => {
    const error = new PersistenceError("test");
    expect(error.name).toBe("PersistenceError");
  });

  it("should preserve the prototype chain", () => {
    const error = new PersistenceError("test");
    expect(Object.getPrototypeOf(error)).toBe(PersistenceError.prototype);
  });
});

describe("OAuthCallbackError", () => {
  it("should expose the failure reason and message", () => {
    const error = new OAuthCallbackError("account_conflict", "conflict");

    expect(error).toBeInstanceOf(OAuthCallbackError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("OAuthCallbackError");
    expect(error.reason).toBe("account_conflict");
    expect(error.message).toBe("conflict");
  });

  it("should preserve the cause when provided", () => {
    const cause = { type: "user_already_exists" };
    const error = new OAuthCallbackError("provider_error", "failed", {
      cause,
    });

    expect(error.cause).toBe(cause);
  });
});
