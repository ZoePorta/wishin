import { describe, it, expect } from "vitest";
import { MOCK_WISHLIST_DATA, reconstituteMockWishlist } from "./wishlist.data";
import { Priority } from "@wishin/domain/value-objects/priority";

describe("wishlist.data", () => {
  it("MOCK_WISHLIST_DATA should have priority as enum name strings", () => {
    MOCK_WISHLIST_DATA.items.forEach((item) => {
      expect(typeof item.priority).toBe("string");
      expect(Priority).toHaveProperty(item.priority);
    });
  });

  it("reconstituteMockWishlist should correctly parse name strings back into Priority enum", () => {
    const wishlist = reconstituteMockWishlist();

    const highItem = wishlist.items.find(
      (i) => i.id === "ec6e0f25-4cea-4e60-b371-6658d308ec77",
    );
    const mediumItem = wishlist.items.find(
      (i) => i.id === "3ab80721-3a29-4338-8e6e-c7af81416279",
    );
    const lowItem = wishlist.items.find(
      (i) => i.id === "770ebb51-26b0-48c4-8f66-78ef3d312310",
    );

    expect(highItem?.priority).toBe(Priority.HIGH);
    expect(mediumItem?.priority).toBe(Priority.MEDIUM);
    expect(lowItem?.priority).toBe(Priority.LOW);
  });
});
