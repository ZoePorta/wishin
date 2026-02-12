import { describe, it, expect } from "vitest";
import { Transaction, TransactionStatus } from "./transaction";
import {
  InvalidAttributeError,
  InvalidTransitionError,
} from "../errors/domain-errors";

describe("Transaction Aggregate", () => {
  // Valid UUID v4
  const VALID_ITEM_ID = "9f8c05c0-e89b-42d3-a456-426614174000";
  const VALID_USER_ID = "9f8c05c0-e89b-42d3-a456-426614174001";
  const VALID_GUEST_ID = "guest-session-123";
  const VALID_TRANSACTION_ID = "9f8c05c0-e89b-42d3-a456-426614174002";

  // Invalid UUID v1 (for testing rejection)
  const INVALID_UUID_V1 = "123e4567-e89b-12d3-a456-426614174000";

  describe("Factory: createReservation", () => {
    const validProps = {
      itemId: VALID_ITEM_ID,
      userId: VALID_USER_ID,
      quantity: 1,
    };

    it("should create a valid reservation", () => {
      const transaction = Transaction.createReservation(validProps);
      expect(transaction.id).toBeDefined();
      expect(transaction.itemId).toBe(VALID_ITEM_ID);
      expect(transaction.userId).toBe(VALID_USER_ID);
      expect(transaction.guestSessionId).toBeUndefined();
      expect(transaction.status).toBe(TransactionStatus.RESERVED);
      expect(transaction.quantity).toBe(1);
    });

    it("should throw if userId is missing", () => {
      // @ts-expect-error - testing invalid input
      expect(() =>
        Transaction.createReservation({ ...validProps, userId: undefined }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw if itemId is invalid UUID", () => {
      expect(() =>
        Transaction.createReservation({ ...validProps, itemId: "invalid" }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw if itemId is UUID v1", () => {
      expect(() =>
        Transaction.createReservation({
          ...validProps,
          itemId: INVALID_UUID_V1,
        }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw if quantity is not a positive integer", () => {
      expect(() =>
        Transaction.createReservation({ ...validProps, quantity: 0 }),
      ).toThrow(InvalidAttributeError);
      expect(() =>
        Transaction.createReservation({ ...validProps, quantity: -1 }),
      ).toThrow(InvalidAttributeError);
      expect(() =>
        Transaction.createReservation({ ...validProps, quantity: 1.5 }),
      ).toThrow(InvalidAttributeError);
    });
  });

  describe("Factory: createPurchase", () => {
    it("should create a valid purchase for a registered user", () => {
      const transaction = Transaction.createPurchase({
        itemId: VALID_ITEM_ID,
        userId: VALID_USER_ID,
        quantity: 1,
      });
      expect(transaction.status).toBe(TransactionStatus.PURCHASED);
      expect(transaction.userId).toBe(VALID_USER_ID);
      expect(transaction.guestSessionId).toBeUndefined();
    });

    it("should create a valid purchase for a guest", () => {
      const transaction = Transaction.createPurchase({
        itemId: VALID_ITEM_ID,
        guestSessionId: VALID_GUEST_ID,
        quantity: 2,
      });
      expect(transaction.status).toBe(TransactionStatus.PURCHASED);
      expect(transaction.guestSessionId).toBe(VALID_GUEST_ID);
      expect(transaction.userId).toBeUndefined();
    });

    it("should throw if neither userId nor guestSessionId is provided (Identity XOR)", () => {
      expect(() =>
        Transaction.createPurchase({
          itemId: VALID_ITEM_ID,
          quantity: 1,
        }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw if both userId and guestSessionId are provided (Identity XOR)", () => {
      expect(() =>
        Transaction.createPurchase({
          itemId: VALID_ITEM_ID,
          userId: VALID_USER_ID,
          guestSessionId: VALID_GUEST_ID,
          quantity: 1,
        }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw if guestSessionId is empty", () => {
      expect(() =>
        Transaction.createPurchase({
          itemId: VALID_ITEM_ID,
          guestSessionId: "",
          quantity: 1,
        }),
      ).toThrow(InvalidAttributeError);
    });
  });

  describe("Lifecycle Transitions", () => {
    it("should allow confirming a reservation as a purchase", () => {
      const reservation = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: VALID_USER_ID,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const purchase = reservation.confirmPurchase();
      expect(purchase.status).toBe(TransactionStatus.PURCHASED);
      expect(purchase.id).toBe(reservation.id);
      expect(purchase.updatedAt.getTime()).toBeGreaterThanOrEqual(
        reservation.updatedAt.getTime(),
      );
    });

    it("should throw if confirming a purchase when status is not RESERVED", () => {
      const purchase = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: VALID_USER_ID,
        status: TransactionStatus.PURCHASED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(() => purchase.confirmPurchase()).toThrow(InvalidTransitionError);
    });

    it("should allow cancelling a reservation", () => {
      const reservation = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: VALID_USER_ID,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const cancelled = reservation.cancel();
      expect(cancelled.status).toBe(TransactionStatus.CANCELLED);
    });

    it("should allow cancelling a purchase", () => {
      const purchase = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: VALID_USER_ID,
        status: TransactionStatus.PURCHASED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const cancelled = purchase.cancel();
      expect(cancelled.status).toBe(TransactionStatus.CANCELLED);
    });

    it("should throw if cancelling an already cancelled transaction", () => {
      const cancelled = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: VALID_USER_ID,
        status: TransactionStatus.CANCELLED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(() => cancelled.cancel()).toThrow(InvalidTransitionError);
    });
  });

  describe("Identity and State", () => {
    it("should have equality based on ID", () => {
      const props = {
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: VALID_USER_ID,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const t1 = Transaction.reconstitute(props);
      const t2 = Transaction.reconstitute(props);
      const t3 = Transaction.reconstitute({ ...props, id: VALID_ITEM_ID }); // Different ID

      expect(t1.equals(t2)).toBe(true);
      expect(t1.equals(t3)).toBe(false);
    });

    it("should return a copy of props via toProps()", () => {
      const props = {
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: VALID_USER_ID,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const transaction = Transaction.reconstitute(props);
      const returnedProps = transaction.toProps();

      expect(returnedProps).toEqual(props);
      expect(returnedProps).not.toBe(props); // Should be a copy
    });
  });
});
