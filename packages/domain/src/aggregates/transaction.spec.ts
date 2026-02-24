import { describe, it, expect } from "vitest";
import {
  Transaction,
  type TransactionCreateReservationProps,
} from "./transaction";
import { TransactionStatus } from "../value-objects/transaction-status";
import {
  InvalidAttributeError,
  InvalidTransitionError,
} from "../errors/domain-errors";

describe("Transaction Aggregate", () => {
  // Valid UUID v4
  const VALID_ITEM_ID = "9f8c05c0-e89b-42d3-a456-426614174000";
  const VALID_USER_ID = "9f8c05c0-e89b-42d3-a456-426614174001";
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
      const transaction = Transaction.createReservation({
        ...validProps,
        id: VALID_TRANSACTION_ID,
      });
      expect(transaction.id).toBe(VALID_TRANSACTION_ID);
      expect(transaction.itemId).toBe(VALID_ITEM_ID);
      expect(transaction.userId).toBe(VALID_USER_ID);
      expect(transaction.status).toBe(TransactionStatus.RESERVED);
      expect(transaction.quantity).toBe(1);
    });

    it("should throw if userId is missing", () => {
      expect(() =>
        Transaction.createReservation({
          ...validProps,
          userId: undefined,
          id: VALID_TRANSACTION_ID,
        } as unknown as TransactionCreateReservationProps),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw if itemId is invalid UUID", () => {
      expect(() =>
        Transaction.createReservation({
          ...validProps,
          itemId: "invalid",
          id: VALID_TRANSACTION_ID,
        }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw if itemId is UUID v1", () => {
      expect(() =>
        Transaction.createReservation({
          ...validProps,
          itemId: INVALID_UUID_V1,
          id: VALID_TRANSACTION_ID,
        }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw if quantity is not a positive integer", () => {
      expect(() =>
        Transaction.createReservation({
          ...validProps,
          quantity: 0,
          id: VALID_TRANSACTION_ID,
        }),
      ).toThrow(InvalidAttributeError);
      expect(() =>
        Transaction.createReservation({
          ...validProps,
          quantity: -1,
          id: VALID_TRANSACTION_ID,
        }),
      ).toThrow(InvalidAttributeError);
      expect(() =>
        Transaction.createReservation({
          ...validProps,
          quantity: 1.5,
          id: VALID_TRANSACTION_ID,
        }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw if id is invalid", () => {
      expect(() =>
        Transaction.createReservation({
          ...validProps,
          id: "invalid",
        }),
      ).toThrow(InvalidAttributeError);
      expect(() =>
        Transaction.createReservation({
          ...validProps,
          id: INVALID_UUID_V1,
        }),
      ).toThrow(InvalidAttributeError);
      expect(() =>
        Transaction.createReservation({
          ...validProps,
          id: "",
        }),
      ).toThrow(InvalidAttributeError);
    });
  });

  describe("Factory: createPurchase", () => {
    it("should create a valid purchase", () => {
      const transaction = Transaction.createPurchase({
        itemId: VALID_ITEM_ID,
        userId: VALID_USER_ID,
        quantity: 1,
        id: VALID_TRANSACTION_ID,
      });
      expect(transaction.status).toBe(TransactionStatus.PURCHASED);
      expect(transaction.id).toBe(VALID_TRANSACTION_ID);
      expect(transaction.userId).toBe(VALID_USER_ID);
    });

    it("should throw if userId is missing (Identity Mandate)", () => {
      expect(() =>
        Transaction.createPurchase({
          itemId: VALID_ITEM_ID,
          userId: undefined as unknown as string,
          quantity: 1,
          id: VALID_TRANSACTION_ID,
        }),
      ).toThrow(InvalidAttributeError);
    });

    it("should throw if id is invalid", () => {
      expect(() =>
        Transaction.createPurchase({
          itemId: VALID_ITEM_ID,
          userId: VALID_USER_ID,
          quantity: 1,
          id: "invalid",
        }),
      ).toThrow(InvalidAttributeError);
      expect(() =>
        Transaction.createPurchase({
          itemId: VALID_ITEM_ID,
          userId: VALID_USER_ID,
          quantity: 1,
          id: INVALID_UUID_V1,
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

    it("should allow cancelling a purchase for a registered user", () => {
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

    it("should allow cancelling even for anonymous sessions (ADR 018)", () => {
      const purchase = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: "anonymous-user-123",
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

  describe("Orphan Transactions (null FKs)", () => {
    it("should allow cancelling a reservation even if itemId is null (deleted item)", () => {
      const reservation = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: null,
        userId: VALID_USER_ID,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const cancelled = reservation.cancel();
      expect(cancelled.status).toBe(TransactionStatus.CANCELLED);
      expect(cancelled.itemId).toBeNull();
    });

    it("should allow cancelling a reservation even if userId is null (deleted user)", () => {
      const reservation = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: null,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const cancelled = reservation.cancel();
      expect(cancelled.status).toBe(TransactionStatus.CANCELLED);
      expect(cancelled.userId).toBeNull();
    });

    it("should throw if confirming purchase when itemId is null (STRICT validation)", () => {
      const reservation = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: null,
        userId: VALID_USER_ID,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(() => reservation.confirmPurchase()).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw if confirming purchase when userId is null (STRICT validation)", () => {
      const reservation = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: null,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(() => reservation.confirmPurchase()).toThrow(
        InvalidAttributeError,
      );
    });
  });

  describe("Reconstitution (Handling null FKs)", () => {
    it("should allow reconstituting with null itemId (deleted item)", () => {
      const transaction = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: null,
        userId: VALID_USER_ID,
        status: TransactionStatus.PURCHASED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(transaction.itemId).toBeNull();
    });

    it("should allow reconstituting with null userId (deleted user)", () => {
      const transaction = Transaction.reconstitute({
        id: VALID_TRANSACTION_ID,
        itemId: VALID_ITEM_ID,
        userId: null,
        status: TransactionStatus.RESERVED,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(transaction.userId).toBeNull();
    });

    it("should still enforce valid UUID for non-null itemId/userId", () => {
      expect(() =>
        Transaction.reconstitute({
          id: VALID_TRANSACTION_ID,
          itemId: "invalid-uuid",
          userId: VALID_USER_ID,
          status: TransactionStatus.RESERVED,
          quantity: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ).toThrow(InvalidAttributeError);
    });

    it("should allow reconstituting with any userId format (Loosened validation for anonymous)", () => {
      expect(() =>
        Transaction.reconstitute({
          id: VALID_TRANSACTION_ID,
          itemId: VALID_ITEM_ID,
          userId: "some-non-uuid-string",
          status: TransactionStatus.PURCHASED,
          quantity: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ).not.toThrow();
    });

    it("should not throw when userId is null (soft-deleted identity)", () => {
      expect(() =>
        Transaction.reconstitute({
          id: VALID_TRANSACTION_ID,
          itemId: VALID_ITEM_ID,
          userId: null,
          status: TransactionStatus.PURCHASED,
          quantity: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ).not.toThrow();
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
