import { describe, it, expect } from "vitest";
import { PersistenceError } from "./domain-errors";

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
