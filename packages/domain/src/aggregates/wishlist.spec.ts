import { describe, it, expect } from "vitest";
import {
  Wishlist,
  WishlistVisibility,
  WishlistParticipation,
} from "./wishlist";
import type { WishlistItem } from "../entities/wishlist-item";
import {
  InvalidAttributeError,
  LimitExceededError,
  InvalidOperationError,
} from "../errors/domain-errors";

describe("Wishlist Aggregate", () => {
  // Valid UUID v4s
  const validProps = {
    id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", // v4
    ownerId: "123e4567-e89b-42d3-a456-426614174001", // v4
    title: "My Birthday List",
    description: "Things I want for my birthday",
    visibility: WishlistVisibility.LINK,
    participation: WishlistParticipation.ANYONE,
  };

  describe("Creation (Strict Validation)", () => {
    it("should create a valid wishlist with default values", () => {
      // Omit optional fields to test defaults
      const wishlist = Wishlist.create({
        id: validProps.id,
        ownerId: validProps.ownerId,
        title: validProps.title,
      });

      expect(wishlist).toBeInstanceOf(Wishlist);
      expect(wishlist.id).toBe(validProps.id);
      expect(wishlist.items).toHaveLength(0);
      expect(wishlist.visibility).toBe(WishlistVisibility.LINK); // Default
      expect(wishlist.participation).toBe(WishlistParticipation.ANYONE); // Default
      expect(wishlist.createdAt).toBeInstanceOf(Date);
      expect(wishlist.updatedAt).toBeInstanceOf(Date);
    });

    it("should create a wishlist with explicit visibility and participation", () => {
      const wishlist = Wishlist.create({
        ...validProps,
        visibility: WishlistVisibility.PRIVATE,
        participation: WishlistParticipation.CONTACTS,
      });

      expect(wishlist.visibility).toBe(WishlistVisibility.PRIVATE);
      expect(wishlist.participation).toBe(WishlistParticipation.CONTACTS);
    });

    it("should throw InvalidAttributeError if title is too short", () => {
      expect(() => {
        Wishlist.create({ ...validProps, title: "Lo" });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if title is too long", () => {
      expect(() => {
        Wishlist.create({ ...validProps, title: "a".repeat(101) });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if id is not a valid UUID v4", () => {
      expect(() => {
        Wishlist.create({ ...validProps, id: "invalid-uuid" });
      }).toThrow(InvalidAttributeError);

      expect(() => {
        // v1 UUID (not v4)
        Wishlist.create({
          ...validProps,
          id: "123e4567-e89b-12d3-a456-426614174000",
        });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if ownerId is not a valid UUID v4", () => {
      expect(() => {
        Wishlist.create({ ...validProps, ownerId: "not-a-uuid" });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if description is too long", () => {
      expect(() => {
        Wishlist.create({ ...validProps, description: "a".repeat(501) });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if visibility is invalid", () => {
      expect(() => {
        Wishlist.create({
          ...validProps,
          visibility: "INVALID_VISIBILITY" as WishlistVisibility,
        });
      }).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if participation is invalid", () => {
      expect(() => {
        Wishlist.create({
          ...validProps,
          participation: "INVALID_PARTICIPATION" as WishlistParticipation,
        });
      }).toThrow(InvalidAttributeError);
    });
  });

  describe("Update", () => {
    it("should update editable properties", () => {
      const wishlist = Wishlist.create(validProps);
      const newTitle = "Updated List Title";

      const updatedWishlist = wishlist.update({ title: newTitle });

      expect(updatedWishlist).not.toBe(wishlist); // Immutability
      expect(updatedWishlist.title).toBe(newTitle);
      expect(updatedWishlist.updatedAt.getTime()).toBeGreaterThanOrEqual(
        wishlist.updatedAt.getTime(),
      );

      // Identity persistence
      expect(updatedWishlist.id).toBe(wishlist.id);
      expect(updatedWishlist.ownerId).toBe(wishlist.ownerId);
      expect(updatedWishlist.items).toEqual(wishlist.items);
      expect(updatedWishlist.equals(wishlist)).toBe(true);
    });

    it("should not allow updating immutable properties via update method", () => {
      // This is enforced by type system, but we can verify runtime behavior if we cast or bypass.
      // For strictly typed TDD, we verify the method signature and functionality of allowed props.
      const wishlist = Wishlist.create(validProps);
      // @ts-expect-error - Testing immutability of properties not allowed in update
      const updated = wishlist.update({ id: "new-id" });
      expect(updated.id).toBe(wishlist.id);
    });

    it("should validate properties during update", () => {
      const wishlist = Wishlist.create(validProps);
      expect(() => {
        wishlist.update({ title: "Lo" });
      }).toThrow(InvalidAttributeError);
    });
  });

  describe("Item Management", () => {
    it("should add an item to the wishlist", () => {
      const wishlist = Wishlist.create(validProps);
      // Mock item or create a real one if easy.
      // Since WishlistItem exists, let's try to simulate one if possible, or cast/mock for now.
      const mockItem = {
        id: "item-1",
        wishlistId: validProps.id,
      } as unknown as WishlistItem;

      const withItem = wishlist.addItem(mockItem);

      expect(withItem.items).toHaveLength(1);
      expect(withItem.items[0]).toBe(mockItem);
    });

    it("should remove an item from the wishlist", () => {
      const wishlist = Wishlist.create(validProps);
      const mockItem = {
        id: "item-1",
        wishlistId: validProps.id,
      } as unknown as WishlistItem;
      const withItem = wishlist.addItem(mockItem);

      const emptyAgain = withItem.removeItem("item-1");
      expect(emptyAgain.items).toHaveLength(0);
    });

    it("should enforce 100 items limit", () => {
      // Reconstitute with 100 items to simulate a full list
      // We bypass adding 100 items one by one for performance in test setup
      const items = Array.from(
        { length: 100 },
        (_, i) =>
          ({
            id: `item-${i.toString()}`,
            wishlistId: validProps.id,
          }) as unknown as WishlistItem,
      );

      const fullWishlist = Wishlist.reconstitute({
        ...validProps,
        items: items,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const overflowItem = {
        id: "item-101",
        wishlistId: validProps.id,
      } as unknown as WishlistItem;

      expect(() => {
        fullWishlist.addItem(overflowItem);
      }).toThrow(LimitExceededError);
    });

    it("should throw InvalidOperationError if adding item with different wishlistId", () => {
      const wishlist = Wishlist.create(validProps);
      const otherItem = {
        id: "item-1",
        wishlistId: "other-wishlist-id",
      } as unknown as WishlistItem;

      expect(() => {
        wishlist.addItem(otherItem);
      }).toThrow(InvalidOperationError);
    });
  });

  describe("Reconstitution", () => {
    it("should reconstitute without business validation (bypass item limit)", () => {
      const items = Array.from(
        { length: 101 },
        (_, i) =>
          ({
            id: `item-${i.toString()}`,
            wishlistId: validProps.id,
          }) as unknown as WishlistItem,
      );

      const hugeWishlist = Wishlist.reconstitute({
        ...validProps,
        items: items,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(hugeWishlist.items).toHaveLength(101);
    });
  });
});
