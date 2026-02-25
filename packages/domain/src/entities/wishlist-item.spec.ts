import { describe, it, expect } from "vitest";
import { WishlistItem } from "./wishlist-item";
import { Priority } from "../value-objects/priority";
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
      expect(item.toProps()).toEqual({
        ...validProps,
        priority: Priority.MEDIUM,
      });
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

    it("should throw InvalidAttributeError if description exceeds 200 characters", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, description: "a".repeat(201) }),
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

    it("should cap at 0 if cancelling more than reserved (No Friction)", () => {
      const item = WishlistItem.create({ ...validProps, reservedQuantity: 1 });
      const newItem = item.cancelReservation(2);
      expect(newItem.reservedQuantity).toBe(0);
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

    it("should allow purchase without stock limits when isUnlimited is true", () => {
      const item = WishlistItem.create({
        ...validProps,
        isUnlimited: true,
        totalQuantity: 1,
      });
      // Purchase 100 items (far exceeding total 1)
      const newItem = item.purchase(100, 0);
      expect(newItem.purchasedQuantity).toBe(100);
      expect(newItem.reservedQuantity).toBe(0);
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

    it("should throw InvalidTransitionError if consumeFromReserved exceeds totalAmount", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 10,
        reservedQuantity: 5,
      });
      // Trying to consume 3 from reserved when only purchasing 2 total
      expect(() => item.purchase(2, 3)).toThrow(InvalidTransitionError);
    });
  });

  describe("Behaviors: Cancel Purchase", () => {
    it("should cancel purchase and return to available stock", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 2,
      });

      const newItem = item.cancelPurchase(1);

      expect(newItem.purchasedQuantity).toBe(1);
      expect(newItem.reservedQuantity).toBe(0);
      expect(newItem.availableQuantity).toBe(4);
    });

    it("should throw InvalidTransitionError if amountToCancel > purchasedQuantity", () => {
      const item = WishlistItem.create({
        ...validProps,
        purchasedQuantity: 1,
      });

      expect(() => item.cancelPurchase(2)).toThrow(InvalidTransitionError);
    });

    it("should throw InvalidAttributeError if amountToCancel is negative or zero", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 5,
      });
      expect(() => item.cancelPurchase(0)).toThrow(InvalidAttributeError);
      expect(() => item.cancelPurchase(-1)).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if amountToCancel is not integer", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 5,
      });
      expect(() => item.cancelPurchase(1.5)).toThrow(InvalidAttributeError);
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
  describe("Priority", () => {
    it("should default to MEDIUM priority if not specified", () => {
      const item = WishlistItem.create(validProps);
      expect(item.priority).toBe(Priority.MEDIUM);
    });

    it("should allow setting a specific priority", () => {
      const item = WishlistItem.create({
        ...validProps,
        priority: Priority.URGENT,
      });
      expect(item.priority).toBe(Priority.URGENT);
    });

    it("should allow setting specific priority (LOW boundary)", () => {
      const item = WishlistItem.create({
        ...validProps,
        priority: Priority.LOW,
      });
      expect(item.priority).toBe(Priority.LOW);
    });

    it("should throw InvalidAttributeError if priority is invalid (0 - below range)", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, priority: 0 as Priority }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if priority is invalid (5 - above range)", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, priority: 5 as Priority }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if priority is invalid (999)", () => {
      expect(() =>
        WishlistItem.create({ ...validProps, priority: 999 as Priority }),
      ).toThrow(InvalidAttributeError);
    });
  });

  describe("Update", () => {
    it("should update mutable properties and return a new instance", () => {
      const item = WishlistItem.create(validProps);
      const updatedItem = item.update({
        name: "Updated Name",
        priority: Priority.HIGH,
      });

      expect(updatedItem).not.toBe(item);
      expect(updatedItem).toBeInstanceOf(WishlistItem);
      expect(updatedItem.toProps()).toEqual({
        ...validProps,
        priority: Priority.HIGH,
        name: "Updated Name",
      });
    });

    it("should throw InvalidAttributeError if updated name is invalid", () => {
      const item = WishlistItem.create(validProps);
      expect(() => item.update({ name: "ab" })).toThrow(InvalidAttributeError);
    });

    it("should enforce immutability on update", () => {
      const item = WishlistItem.create(validProps);
      item.update({ name: "New Name" });
      expect(item.name).toBe(validProps.name);
    });

    it("should ignore undefined values in update props", () => {
      const item = WishlistItem.create(validProps);

      const updatedItem = item.update({ name: undefined });
      expect(updatedItem.name).toBe(validProps.name);
    });

    it("should throw InvalidAttributeError if trying to update id", () => {
      const item = WishlistItem.create(validProps);
      expect(() => item.update({ id: "new-id" })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if trying to update wishlistId", () => {
      const item = WishlistItem.create(validProps);
      expect(() =>
        item.update({ wishlistId: "111e4567-e89b-42d3-a456-426614174111" }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw InvalidAttributeError if trying to update reservedQuantity directly", () => {
      const item = WishlistItem.create(validProps);
      expect(() => item.update({ reservedQuantity: 5 })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if trying to update purchasedQuantity directly", () => {
      const item = WishlistItem.create(validProps);
      expect(() => item.update({ purchasedQuantity: 5 })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if updating with invalid priority", () => {
      const item = WishlistItem.create(validProps);
      expect(() => item.update({ priority: 999 as Priority })).toThrow(
        InvalidAttributeError,
      );
    });

    it("should return true for equals() between original and updated item (Identity preserved)", () => {
      const item = WishlistItem.create(validProps);
      const updatedItem = item.update({ name: "New Name" });
      expect(item.equals(updatedItem)).toBe(true);
    });
  });

  describe("Inventory Privacy (Relaxed Invariants)", () => {
    it("should prune reservations when total quantity is reduced (Total < Reserved + Purchased)", () => {
      // Scenario: User had 5 wanted, 3 purchased, 2 reserved.
      // User updates total to 3.
      // Expect: Purchased stays 3. Reserved pruned to fit.
      // MaxReserved = 3 - 3 = 0.

      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 3,
        reservedQuantity: 2,
      });

      const updatedItem = item.update({ totalQuantity: 3 });

      expect(updatedItem.totalQuantity).toBe(3);
      expect(updatedItem.purchasedQuantity).toBe(3);
      expect(updatedItem.reservedQuantity).toBe(0); // Pruned from 2 to 0
    });

    it("should calculate available quantity as 0 when over-committed", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 3,
        reservedQuantity: 2,
      });

      const updatedItem = item.update({ totalQuantity: 3 });
      // Available = max(0, 3 - (0+3)) = 0. (Reserved is now 0)
      expect(updatedItem.availableQuantity).toBe(0);
    });

    it("should prune reservations when totalQuantity is reduced below current commitment", () => {
      // Start: Total=5, Purchased=1, Reserved=3. (Total > P+R).
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 1,
        reservedQuantity: 3,
      });

      // Update Total to 2.
      // Unconditional Reset: New Reserved should be 0.
      const updatedItem = item.update({ totalQuantity: 2 });

      expect(updatedItem.totalQuantity).toBe(2);
      expect(updatedItem.purchasedQuantity).toBe(1); // Unchanged
      expect(updatedItem.reservedQuantity).toBe(0); // Pruned to 0
      expect(updatedItem.availableQuantity).toBe(1); // T(2) - (0+1) = 1
    });

    it("should allow over-commitment if total drops below purchased even after pruning reserved", () => {
      // Start: Total=5, Purchased=3, Reserved=2.
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 3,
        reservedQuantity: 2,
      });

      // ADR 019: Reducing totalQuantity causes reservedQuantity to be unconditionally reset to 0.
      const updatedItem = item.update({ totalQuantity: 2 });

      expect(updatedItem.totalQuantity).toBe(2);
      expect(updatedItem.purchasedQuantity).toBe(3); // Unchanged
      expect(updatedItem.reservedQuantity).toBe(0); // Pruned to 0
      expect(updatedItem.availableQuantity).toBe(0);
    });

    it("should NOT prune reservations when totalQuantity is increased", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        reservedQuantity: 3,
      });

      const updatedItem = item.update({ totalQuantity: 10 });

      expect(updatedItem.totalQuantity).toBe(10);
      expect(updatedItem.reservedQuantity).toBe(3); // Unchanged
      // Available = 10 - (3 + 0) = 7
      expect(updatedItem.availableQuantity).toBe(7);
    });

    it("should still throw InsufficientStockError when creating a new item with invalid inventory (strict mode)", () => {
      expect(() =>
        WishlistItem.create({
          ...validProps,
          totalQuantity: 2,
          reservedQuantity: 3,
          purchasedQuantity: 0,
        }),
      ).toThrow(InsufficientStockError);
    });

    it("should throw InsufficientStockError if trying to reserve on an over-committed item (Strict validation)", () => {
      // 1. Create over-committed item via update
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 3,
        reservedQuantity: 2,
      }).update({ totalQuantity: 2 }); // T=2, P=3, R=0. (Pruned). Over-committed.

      // 2. Try to reserve more.
      expect(() => item.reserve(1)).toThrow(InsufficientStockError);
    });

    it("should throw InsufficientStockError if trying to purchase on an over-committed item (Strict validation)", () => {
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 3,
        reservedQuantity: 2,
      }).update({ totalQuantity: 2 }); // T=2, P=3, R=0.

      // Try to purchase 1 (consuming 0 from reserved). Needed=1.
      expect(() => item.purchase(1, 0)).toThrow(InsufficientStockError);
    });

    it("should allow cancelling reservation on pruned item (Success/No Friction)", () => {
      // Create valid item: T=5, R=3.
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        reservedQuantity: 3,
      });
      // Update Total to 2. Pruning happens: R = 0.
      const updatedItem = item.update({ totalQuantity: 2 });

      // Should stay at 0.
      const newItem = updatedItem.cancelReservation(1);
      expect(newItem.reservedQuantity).toBe(0);
    });

    it("should allow cancelling reservation on severely pruned item (Success/No Friction)", () => {
      // Total=1, Reserved=3.
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        reservedQuantity: 3,
      });
      // Update to 1. Pruning: R = 0.
      const updatedItem = item.update({ totalQuantity: 1 });
      expect(updatedItem.reservedQuantity).toBe(0);

      // Cancel 1 -> Should stay at 0.
      const newItem = updatedItem.cancelReservation(1);
      expect(newItem.reservedQuantity).toBe(0);
      expect(newItem).toBe(updatedItem);
    });

    describe("Reconstitute (bypass validation)", () => {
      it("should recreate an over-committed item without error", () => {
        // Total=3, Purchased=2, Reserved=2. P+R = 4 > T=3.
        // Direct create() would fail.
        // reconstitute() should pass.
        const item = WishlistItem.reconstitute({
          ...validProps,
          totalQuantity: 3,
          purchasedQuantity: 2,
          reservedQuantity: 2,
          priority: Priority.MEDIUM,
        });

        expect(item).toBeInstanceOf(WishlistItem);
        expect(item.totalQuantity).toBe(3);
        expect(item.availableQuantity).toBe(0);
      });

      it("should allow cancelling reservation on reconstituted over-committed item", () => {
        // Reconstitute: Total=3, Purchased=2, Reserved=2.
        const item = WishlistItem.reconstitute({
          ...validProps,
          totalQuantity: 3,
          purchasedQuantity: 2,
          reservedQuantity: 2,
          priority: Priority.MEDIUM,
        });

        // Cancel 1 reservation
        const updatedItem = item.cancelReservation(1);

        expect(updatedItem.reservedQuantity).toBe(1);
        expect(updatedItem.totalQuantity).toBe(3);
        // Available = 3 - (1 + 2) = 0
        expect(updatedItem.availableQuantity).toBe(0);
      });
    });

    it("should ALLOW cancelPurchase even if over-committed", () => {
      // Total=1, Reserved=0, Purchased=3.
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 3,
      }).update({ totalQuantity: 1 });

      // Cancel 1 purchase.
      // Step 1: P=2. T=1. Allowed.

      const newItem = item.cancelPurchase(1);
      expect(newItem.purchasedQuantity).toBe(2);
    });
  });

  describe("updateWishlistId", () => {
    it("should return new instance with updated wishlistId", () => {
      const item = WishlistItem.create(validProps);
      const newWishlistId = "111e4567-e89b-42d3-a456-426614174111"; // Valid UUID v4
      const movedItem = item.updateWishlistId(newWishlistId);

      expect(movedItem.wishlistId).toBe(newWishlistId);
      expect(movedItem.id).toBe(item.id); // Identity preserved
      expect(movedItem.name).toBe(item.name);
    });

    it("should throw InvalidAttributeError if new wishlistId is invalid", () => {
      const item = WishlistItem.create(validProps);

      expect(() => item.updateWishlistId("invalid-uuid")).toThrow(
        InvalidAttributeError,
      );
    });

    it("should return same instance if wishlistId is unchanged", () => {
      const item = WishlistItem.create(validProps);
      const sameItem = item.updateWishlistId(validProps.wishlistId);
      expect(sameItem).toBe(item);
    });

    it("should allow moving an over-committed item (inventory check skipped)", () => {
      // Create over-committed item: T=2, P=3, R=0.
      const item = WishlistItem.create({
        ...validProps,
        totalQuantity: 5,
        purchasedQuantity: 3,
        reservedQuantity: 0,
      }).update({ totalQuantity: 2 });

      expect(item.availableQuantity).toBe(0);

      // Move it
      const newWishlistId = "111e4567-e89b-42d3-a456-426614174111";
      const movedItem = item.updateWishlistId(newWishlistId);

      expect(movedItem.wishlistId).toBe(newWishlistId);
      expect(movedItem.totalQuantity).toBe(2);
      expect(movedItem.purchasedQuantity).toBe(3);
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
  describe("Contextual Validation (Role-Based)", () => {
    const legacyProps = {
      ...validProps,
      name: "PS", // Short name (invalid by strict rules)
      priority: Priority.MEDIUM,
    };

    it("should allow reconstituting an item with legacy short name (STRUCTURAL mode)", () => {
      const item = WishlistItem.reconstitute(legacyProps);
      expect(item.name).toBe("PS");
      expect(item).toBeInstanceOf(WishlistItem);
    });

    it("should allow reserving on a legacy item (Mother Factor - TRANSACTION mode)", () => {
      const item = WishlistItem.reconstitute(legacyProps);
      // Reserve should succeed despite invalid name
      const reservedItem = item.reserve(1);
      expect(reservedItem.reservedQuantity).toBe(1);
      expect(reservedItem.name).toBe("PS");
    });

    it("should allow purchasing a legacy item (TRANSACTION mode)", () => {
      const item = WishlistItem.reconstitute(legacyProps);
      const purchasedItem = item.purchase(1, 0);
      expect(purchasedItem.purchasedQuantity).toBe(1);
      expect(purchasedItem.name).toBe("PS");
    });

    it("should allow cancelling reservation on a legacy item (STRUCTURAL mode)", () => {
      const item = WishlistItem.reconstitute({
        ...legacyProps,
        reservedQuantity: 1,
      });

      const updatedItem = item.cancelReservation(1);

      expect(updatedItem.reservedQuantity).toBe(0);
      expect(updatedItem.name).toBe("PS"); // Legacy name preserved
    });

    it("should allow cancelling purchase on a legacy item (STRUCTURAL mode)", () => {
      const item = WishlistItem.reconstitute({
        ...legacyProps,
        purchasedQuantity: 1,
      });

      const updatedItem = item.cancelPurchase(1);

      expect(updatedItem.purchasedQuantity).toBe(0);
      expect(updatedItem.name).toBe("PS"); // Legacy name preserved
    });

    it("should FAIL to update a legacy item without fixing the name (Owner Discipline - EVOLUTIVE mode)", () => {
      const item = WishlistItem.reconstitute(legacyProps);
      // Trying to update price, but keeping invalid name
      expect(() => item.update({ price: 200 })).toThrow(InvalidAttributeError);
    });

    it("should ALLOW updating a legacy item IF the name is fixed", () => {
      const item = WishlistItem.reconstitute(legacyProps);
      const updatedItem = item.update({ name: "PlayStation 5" });
      expect(updatedItem.name).toBe("PlayStation 5");
    });

    it("should FAIL structural validation even in STRUCTURAL mode", () => {
      const invalidUuidProps = {
        ...legacyProps,
        id: "invalid-uuid",
      };

      expect(() => WishlistItem.reconstitute(invalidUuidProps)).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw InvalidAttributeError if name is not a string (defensive check)", () => {
      const invalidNameProps = {
        ...legacyProps,
        name: 123,
      };

      expect(() =>
        // @ts-expect-error - Testing runtime safety for invalid type
        WishlistItem.reconstitute(invalidNameProps),
      ).toThrow(InvalidAttributeError);
    });
  });
});
