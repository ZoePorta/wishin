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

    expect(wishlist.items[0].priority).toBe(Priority.HIGH);
    expect(wishlist.items[1].priority).toBe(Priority.MEDIUM);
    expect(wishlist.items[2].priority).toBe(Priority.LOW);
  });
});
