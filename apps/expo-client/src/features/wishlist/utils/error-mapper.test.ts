import { describe, it, expect } from "vitest";
import {
  InsufficientStockError,
  WishlistItemNotFoundError,
  WishlistNotFoundError,
} from "@wishin/domain";
import { createI18n } from "../../../i18n/create-i18n";
import { classifyError, isNameError, mapErrorToMessage } from "./error-mapper";

describe("error-mapper", () => {
  describe("classifyError", () => {
    it("should classify name length errors", () => {
      expect(classifyError("Invalid name: too short")).toBe("nameTooShort");
      expect(classifyError("Invalid name: too long")).toBe("nameTooLong");
    });

    it("should classify wishlist not found errors", () => {
      expect(classifyError("Wishlist not found")).toBe("wishlistNotFound");
      expect(classifyError(new WishlistNotFoundError("123"))).toBe(
        "wishlistNotFound",
      );
      expect(classifyError("Wishlist with ID 123 not found")).toBe(
        "wishlistNotFound",
      );
    });

    it("should classify wishlist item not found errors", () => {
      expect(classifyError(new WishlistItemNotFoundError("123"))).toBe(
        "itemNotFound",
      );
      expect(classifyError("Wishlist item with ID 123")).toBe("itemNotFound");
    });

    it("should classify stock errors", () => {
      expect(classifyError(new InsufficientStockError("No stock"))).toBe(
        "itemUnavailable",
      );
    });

    it("should classify network errors", () => {
      expect(classifyError("Network request failed")).toBe("network");
      expect(classifyError("Failed to fetch")).toBe("network");
    });

    it("should classify wrapped errors whose cause is a network failure", () => {
      expect(
        classifyError(
          new Error("Failed to save", {
            cause: new TypeError("Network request failed"),
          }),
        ),
      ).toBe("network");
      expect(
        classifyError(
          new Error("Failed to save", { cause: "Failed to fetch" }),
        ),
      ).toBe("network");
    });

    it("should not use the cause for non-network classifications", () => {
      expect(
        classifyError(new Error("Failed to save", { cause: "Upload failed" })),
      ).toBe("unknown");
    });

    it("should classify upload errors", () => {
      expect(classifyError("Upload Failed")).toBe("imageUpload");
      expect(classifyError("Error uploading the image")).toBe("imageUpload");
    });

    it("should classify anything else as unknown", () => {
      expect(classifyError("Some unknown error")).toBe("unknown");
      expect(classifyError(undefined)).toBe("unknown");
    });
  });

  describe("isNameError", () => {
    it("should flag only name validation errors", () => {
      expect(isNameError("nameTooShort")).toBe(true);
      expect(isNameError("nameTooLong")).toBe(true);
      expect(isNameError("network")).toBe(false);
      expect(isNameError(null)).toBe(false);
    });
  });

  describe("mapErrorToMessage", () => {
    it("should return the translated message for the error", () => {
      const en = createI18n("en").t;
      const es = createI18n("es").t;

      expect(mapErrorToMessage("Invalid name: too long", en)).toContain(
        "100 characters",
      );
      expect(mapErrorToMessage("Invalid name: too long", es)).toContain(
        "100 caracteres",
      );
    });

    it("should fall back to a friendly generic message", () => {
      expect(
        mapErrorToMessage("Some unknown error", createI18n("en").t),
      ).toContain("Something went wrong");
    });
  });
});
