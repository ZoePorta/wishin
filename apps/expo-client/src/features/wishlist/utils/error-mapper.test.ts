import { describe, it, expect } from "vitest";
import { WishlistItemNotFoundError } from "@wishin/domain";
import {
  mapErrorToMessage,
  matchesError,
  normalizeError,
} from "./error-mapper";

describe("error-mapper", () => {
  describe("normalizeError", () => {
    it("should lowercase and stringify error messages", () => {
      expect(normalizeError(new Error("Test Error"))).toBe("test error");
      expect(normalizeError("String Error")).toBe("string error");
    });
  });

  describe("matchesError", () => {
    it("should return true if term is present (case-insensitive)", () => {
      expect(matchesError("Name is too short", "name")).toBe(true);
      expect(matchesError("NAME IS TOO SHORT", "name")).toBe(true);
      expect(matchesError("some error", "SOME")).toBe(true);
    });

    it("should return false if term is not present", () => {
      expect(matchesError("Some error", "name")).toBe(false);
      expect(matchesError(null, "name")).toBe(false);
      expect(matchesError(undefined, "name")).toBe(false);
    });
  });

  describe("mapErrorToMessage", () => {
    it("should map name-related errors correctly", () => {
      expect(mapErrorToMessage("Invalid name: too short")).toContain(
        "too short",
      );
      expect(mapErrorToMessage("Invalid name: too long")).toContain(
        "100 characters",
      );
    });

    it("should map wishlist not found errors", () => {
      expect(mapErrorToMessage("Wishlist not found")).toContain(
        "couldn't find your wishlist",
      );
    });

    it("should map WishlistItemNotFoundError correctly", () => {
      expect(mapErrorToMessage(new WishlistItemNotFoundError("123"))).toContain(
        "item. It might have been removed",
      );
      expect(mapErrorToMessage("Wishlist item with ID 123")).toContain(
        "item. It might have been removed",
      );
    });

    it("should map network errors", () => {
      expect(mapErrorToMessage("Network request failed")).toContain(
        "connection issue",
      );
      expect(mapErrorToMessage("Failed to fetch")).toContain(
        "connection issue",
      );
    });

    it("should map upload errors", () => {
      expect(mapErrorToMessage("Upload Failed")).toContain(
        "trouble with the image",
      );
      expect(mapErrorToMessage("Error uploading the image")).toContain(
        "trouble with the image",
      );
    });

    it("should return a default message for unknown errors", () => {
      expect(mapErrorToMessage("Some unknown error")).toContain(
        "Something went wrong",
      );
    });
  });
});
