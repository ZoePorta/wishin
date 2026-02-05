import { describe, it, expect } from "vitest";
import { WishlistItem } from "./wishlist-item";
import {
  InsufficientStockError,
  InvalidAttributeError,
  InvalidTransitionError,
} from "../errors/domain-errors";

describe("WishlistItem Entity", () => {
  const validProps = {
    id: "123e4567-e89b-42d3-a456-426614174000", // Valid UUID v4
    wishlistId: "987e6543-e21b-42d3-8456-426614174000", // Valid UUID v4
    name: "PlayStation 5",
    description: "Next-gen console",
    price: 499.99,
    currency: "USD",
    url: "https://example.com/ps5",
    imageUrl: "https://example.com/ps5.jpg",
    isUnlimited: false,
    totalQuantity: 1,
    reservedQuantity: 0,
    purchasedQuantity: 0,
  };

  describe("Creation & Validation", () => {
    it("should be created with valid properties", () => {
      const item = WishlistItem.create(validProps);
      expect(item).toBeInstanceOf(WishlistItem);
      expect(item.id).toBe(validProps.id);
      expect(item.wishlistId).toBe(validProps.wishlistId);
      expect(item.name).toBe(validProps.name);
    });

    it("should throw InvalidAttributeError if wishlistId is missing or invalid", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, wishlistId: "" }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if name is too short", () => {
      expect(() => WishlistItem.create({ ...validProps, name: "PS" })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if name is too long", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, name: "a".repeat(101) }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if price is negative", () => {
      expect(() => WishlistItem.create({ ...validProps, price: -10 })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if price is set but currency is missing", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, price: 100, currency: "" }),
      ).toThrow(InvalidAttributeError);
    });
    it("should allow price with decimals", () => {
      const item = WishlistItem.create({ ...validProps, price: 49.99 });
      expect(item.price).toBe(49.99);
    });

    it("should throw InvalidAttributeError if price is not finite (Infinity)", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, price: Infinity }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if description exceeds 500 characters", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, description: "a".repeat(501) }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if url is invalid", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, url: "invalid-url" }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if imageUrl is invalid", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, imageUrl: "invalid-url" }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if reservedQuantity is not an integer", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, reservedQuantity: 1.5 }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if purchasedQuantity is not an integer", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, purchasedQuantity: 1.5 }),
      ).toThrow(InvalidAttributeError);
    });
  });

  describe("Calculated Fields", () => {
    it("should calculate available quantity correctly when no reservations/purchases", () => {
      const item = WishlistItem.create({ ...validProps, totalQuantity: 5 });
      expect(item.availableQuantity).toBe(5);
    });

    it("should calculate available quantity correctly with reservations", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        reservedQuantity: 2,
      });
      expect(item.availableQuantity).toBe(3);
    });

    it("should calculate available quantity correctly with purchases", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 2,
      });
      expect(item.availableQuantity).toBe(3);
    });

    it("should calculate available quantity correctly with both", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 10,
        reservedQuantity: 2,
        purchasedQuantity: 3,
      });
      expect(item.availableQuantity).toBe(5);
    });
  });

  describe("Immutability", () => {
    it("should enforce immutability on reserve", () => {
      const item = WishlistItem.create({ ...validProps, totalQuantity: 5 });
      const newItem = item.reserve(1);

      expect(newItem).not.toBe(item);
      expect(newItem).toBeInstanceOf(WishlistItem);
      expect(item.reservedQuantity).toBe(0); // Original unchanged
      expect(newItem.reservedQuantity).toBe(1); // New updated
    });
  });

  describe("Behaviors: Reserve", () => {
    it("should increase reserved quantity", () => {
      const item = WishlistItem.create({ ...validProps, totalQuantity: 5 });
      const newItem = item.reserve(2);
      expect(newItem.reservedQuantity).toBe(2);
      expect(newItem.availableQuantity).toBe(3);
    });

    it("should allow reservation if isUnlimited is true", () => {
      const item = WishlistItem.create({
        ...validProps,
        isUnlimited: true,
        totalQuantity: 1,
      });
      const newItem = item.reserve(100);
      expect(newItem.reservedQuantity).toBe(100);
    });

    it("should throw InsufficientStockError if requesting more than available", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        reservedQuantity: 4,
      });
      expect(() => item.reserve(2)).toThrow(InsufficientStockError);
    });

    it("should throw InvalidAttributeError if amount is negative or zero", () => {
      const item = WishlistItem.create({ ...validProps });
      expect(() => item.reserve(0)).toThrow(InvalidAttributeError);
      expect(() => item.reserve(-1)).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if amount is not an integer", () => {
      const item = WishlistItem.create({ ...validProps, totalQuantity: 10 });
      expect(() => item.reserve(1.5)).toThrow(InvalidAttributeError);
    });
  });

  describe("Behaviors: Cancel Reservation", () => {
    it("should decrease reserved quantity", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        reservedQuantity: 2,
      });
      const newItem = item.cancelReservation(1);
      expect(newItem.reservedQuantity).toBe(1);
    });

    it("should throw InvalidTransitionError if cancelling more than reserved", () => {
      const item = WishlistItem.create({ ...validProps, reservedQuantity: 1 });
      expect(() => item.cancelReservation(2)).toThrow(InvalidTransitionError); // Or generic Error depending on implementation, spec implies logic violation
    });

    it("should throw InvalidAttributeError if amount is negative or zero", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        reservedQuantity: 5,
      });
      expect(() => item.cancelReservation(0)).toThrow(InvalidAttributeError);
      expect(() => item.cancelReservation(-1)).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if amount is not an integer", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        reservedQuantity: 5,
      });
      expect(() => item.cancelReservation(1.5)).toThrow(InvalidAttributeError);
    });
  });

  describe("Behaviors: Purchase", () => {
    it("should purchase available items directly", () => {
      const item = WishlistItem.create({ ...validProps, totalQuantity: 5 });
      // Total 2, consume 0 from reserved
      const newItem = item.purchase(2, 0);
      expect(newItem.purchasedQuantity).toBe(2);
      expect(newItem.availableQuantity).toBe(3);
    });

    it("should purchase from reserved stock", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        reservedQuantity: 2,
      });
      // Total 2, consume 2 from reserved
      const newItem = item.purchase(2, 2);
      expect(newItem.reservedQuantity).toBe(0);
      expect(newItem.purchasedQuantity).toBe(2);
    });

    it("should purchase mixed (partial reserved, partial available)", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 10,
        reservedQuantity: 2,
      });
      // Total 5, consume 2 from reserved (so 3 from available)
      const newItem = item.purchase(5, 2);
      expect(newItem.reservedQuantity).toBe(0);
      expect(newItem.purchasedQuantity).toBe(5);
      expect(newItem.availableQuantity).toBe(5);
    });

    it("should throw InsufficientStockError if mixed purchase exceeds total available stock", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        reservedQuantity: 2,
      });
      // Total 6, consume 2 from reserved (needs 4 from available, but only 3 available)
      expect(() => item.purchase(6, 2)).toThrow(InsufficientStockError);
    });

    it("should throw InvalidAttributeError if totalQuantity is not an integer", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, totalQuantity: 1.5 }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if id is not a valid UUID v4 (e.g. v1)", () => {
      const v1Uuid = "123e4567-e89b-12d3-a456-426614174000";
      expect(() => WishlistItem.create({ ...validProps, id: v1Uuid })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InsufficientStockError if not enough total stock", () => {
      const item = WishlistItem.create({ ...validProps, totalQuantity: 5 });
      expect(() => item.purchase(6, 0)).toThrow(InsufficientStockError);
    });

    it("should throw InvalidTransitionError if consuming more reserved than actually reserved", () => {
      const item = WishlistItem.create({ ...validProps, reservedQuantity: 1 });
      expect(() => item.purchase(2, 2)).toThrow(InvalidTransitionError);
    });

    it("should throw InvalidAttributeError if totalAmount is negative or zero", () => {
      const item = WishlistItem.create({ ...validProps });
      expect(() => item.purchase(0, 0)).toThrow(InvalidAttributeError);
      expect(() => item.purchase(-1, 0)).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if consumeFromReserved is negative", () => {
      const item = WishlistItem.create({ ...validProps });
      expect(() => item.purchase(5, -1)).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if totalAmount is not integer", () => {
      const item = WishlistItem.create({ ...validProps });
      expect(() => item.purchase(1.5, 0)).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if consumeFromReserved is not integer", () => {
      const item = WishlistItem.create({ ...validProps });
      expect(() => item.purchase(2, 0.5)).toThrow(InvalidAttributeError);
    });
  });

  describe("Behaviors: Cancel Purchase", () => {
    it("should cancel purchase and return to available stock (amountToReserved = 0)", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 2,
      });

      const newItem = item.cancelPurchase(1, 0);

      expect(newItem.purchasedQuantity).toBe(1);
      expect(newItem.reservedQuantity).toBe(0);
      expect(newItem.availableQuantity).toBe(4);
    });

    it("should cancel purchase and return to reserved stock", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 2,
        reservedQuantity: 0,
      });

      const newItem = item.cancelPurchase(1, 1);

      expect(newItem.purchasedQuantity).toBe(1);
      expect(newItem.reservedQuantity).toBe(1);
      expect(newItem.availableQuantity).toBe(3);
    });

    it("should cancel purchase with partial reservation", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 2,
        reservedQuantity: 0,
      });

      const newItem = item.cancelPurchase(2, 1);

      expect(newItem.purchasedQuantity).toBe(0);
      expect(newItem.reservedQuantity).toBe(1);
      expect(newItem.availableQuantity).toBe(4);
    });

    it("should throw InvalidTransitionError if amountToCancel > purchasedQuantity", () => {
      const item = WishlistItem.create({
        ...validProps,
        purchasedQuantity: 1,
      });

      expect(() => item.cancelPurchase(2, 0)).toThrow(InvalidTransitionError);
    });

    it("should throw InvalidTransitionError if amountToReserved > amountToCancel", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 2,
        purchasedQuantity: 2,
      });

      expect(() => item.cancelPurchase(1, 2)).toThrow(InvalidTransitionError);
    });

    it("should throw InvalidAttributeError if amountToCancel is negative or zero", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 5,
      });
      expect(() => item.cancelPurchase(0, 0)).toThrow(InvalidAttributeError);
      expect(() => item.cancelPurchase(-1, 0)).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if amountToRestockAsReserved is negative", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 5,
      });
      expect(() => item.cancelPurchase(1, -1)).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if amountToCancel is not integer", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 5,
      });
      expect(() => item.cancelPurchase(1.5, 0)).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if amountToRestockAsReserved is not integer", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 5,
      });
      expect(() => item.cancelPurchase(1, 0.5)).toThrow(InvalidAttributeError);
    });
  });

  describe("Domain Invariants", () => {
    it("should not allow creation with reserved + purchased > total (unless unlimited)", () => {
      expect(() =>
        WishlistItem.create({
          ...validProps,
          totalQuantity: 5,
          reservedQuantity: 3,
          purchasedQuantity: 3,
        }),
      ).toThrow(InsufficientStockError);
    });
  });
  describe("Equality", () => {
    it("should return true if ids are the same", () => {
      const item1 = WishlistItem.create(validProps);
      const item2 = WishlistItem.create({
        ...validProps,
        name: "Different Name",
      }); // Same ID
      expect(item1.equals(item2)).toBe(true);
    });

    it("should return false if ids are different", () => {
      const item1 = WishlistItem.create(validProps);
      const item2 = WishlistItem.create({
        ...validProps,
        id: "123e4567-e89b-42d3-a456-426614174999",
      });
      expect(item1.equals(item2)).toBe(false);
    });
  });
});
