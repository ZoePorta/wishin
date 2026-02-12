import { describe, it, expect } from "vitest";
import { Transaction, TransactionType, TransactionStatus } from "./transaction";
import {
  InvalidAttributeError,
  InvalidTransitionError,
} from "../errors/domain-errors";

describe("Transaction Aggregate", () => {
  const validProps = {
    // Valid UUID v4
    itemId: "9f8c05c0-e89b-42d3-a456-426614174000",
    userId: "9f8c05c0-e89b-42d3-a456-426614174001", // Registered user
    type: TransactionType.PURCHASE,
    quantity: 1,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z"),
  };

  const validGuestProps = {
    itemId: "9f8c05c0-e89b-42d3-a456-426614174000",
    guestSessionId: "guest-session-123", // Guest user
    type: TransactionType.RESERVATION,
    quantity: 2,
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z"),
  };

  describe("Factory: create", () => {
    it("should create a valid transaction for a registered user", () => {
      const transaction = Transaction.create(validProps);
      expect(transaction.id).toBeDefined();
      expect(transaction.itemId).toBe(validProps.itemId);
      expect(transaction.userId).toBe(validProps.userId);
      expect(transaction.guestSessionId).toBeUndefined();
      expect(transaction.type).toBe(TransactionType.PURCHASE);
      expect(transaction.status).toBe(TransactionStatus.ACTIVE);
      expect(transaction.quantity).toBe(1);
    });

    it("should create a valid transaction for a guest user", () => {
      const transaction = Transaction.create(validGuestProps);
      expect(transaction.id).toBeDefined();
      expect(transaction.guestSessionId).toBe(validGuestProps.guestSessionId);
      expect(transaction.userId).toBeUndefined();
      expect(transaction.type).toBe(TransactionType.RESERVATION);
    });

    it("should throw if neither userId nor guestSessionId is provided", () => {
      const invalidProps = {
        ...validProps,
        userId: undefined,
        guestSessionId: undefined,
      };
      expect(() => Transaction.create(invalidProps)).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw if both userId and guestSessionId are provided", () => {
      const invalidProps = { ...validProps, guestSessionId: "guest-123" };
      expect(() => Transaction.create(invalidProps)).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw if itemId is invalid UUID", () => {
      const invalidProps = { ...validProps, itemId: "invalid-uuid" };
      expect(() => Transaction.create(invalidProps)).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw if itemId is a UUID v1 (not v4)", () => {
      // UUID v1 example
      const invalidProps = {
        ...validProps,
        itemId: "123e4567-e89b-12d3-a456-426614174000",
      };
      expect(() => Transaction.create(invalidProps)).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw if userId is a UUID v1 (not v4)", () => {
      const invalidProps = {
        ...validProps,
        userId: "123e4567-e89b-12d3-a456-426614174000",
      };
      expect(() => Transaction.create(invalidProps)).toThrow(
        InvalidAttributeError,
      );
    });

    it("should throw if quantity is not a positive integer", () => {
      expect(() => Transaction.create({ ...validProps, quantity: 0 })).toThrow(
        InvalidAttributeError,
      );
      expect(() => Transaction.create({ ...validProps, quantity: -1 })).toThrow(
        InvalidAttributeError,
      );
      expect(() =>
        Transaction.create({ ...validProps, quantity: 1.5 }),
      ).toThrow(InvalidAttributeError);
    });

    it("should default status to ACTIVE", () => {
      const transaction = Transaction.create(validProps);
      expect(transaction.status).toBe(TransactionStatus.ACTIVE);
    });
  });

  describe("Identity", () => {
    it("should have equality based on ID", () => {
      const t1 = Transaction.create(validProps);
      const t2 = Transaction.reconstitute({ ...t1.toProps() });
      const t3 = Transaction.create(validProps); // New ID

      expect(t1.equals(t2)).toBe(true);
      expect(t1.equals(t3)).toBe(false);
    });
  });

  describe("Business Logic: Cancel", () => {
    it("should allow cancelling an active transaction", () => {
      const transaction = Transaction.create(validProps);
      const cancelledTransaction = transaction.cancel();

      expect(cancelledTransaction.status).toBe(TransactionStatus.CANCELLED);
      expect(cancelledTransaction.id).toBe(transaction.id); // Identity preserved
    });

    it("should throw if trying to cancel an already cancelled transaction", () => {
      const transaction = Transaction.create(validProps);
      const cancelledTransaction = transaction.cancel(); // First cancel

      // We need to simulate that we are calling cancel on the ALREADY cancelled instance
      // OR call it again on the returned instance.
      // Since immutability means `transaction` is still ACTIVE, we must use `cancelledTransaction`.
      expect(() => cancelledTransaction.cancel()).toThrow(
        InvalidTransitionError,
      );
    });
  });

  describe("Factory: reconstitute", () => {
    it("should restore a transaction including ID and status", () => {
      const props = {
        id: "9f8c05c0-e89b-42d3-a456-426614179999",
        ...validProps,
        status: TransactionStatus.CANCELLED,
      };
      const transaction = Transaction.reconstitute(props);

      expect(transaction.id).toBe(props.id);
      expect(transaction.status).toBe(TransactionStatus.CANCELLED);
      expect(transaction.createdAt).toEqual(props.createdAt);
    });

    it("should reconstitute a valid transaction", () => {
      const props = {
        id: "9f8c05c0-e89b-42d3-a456-426614179999",
        ...validProps,
        status: TransactionStatus.ACTIVE,
      };
      const transaction = Transaction.reconstitute(props);
      expect(transaction).toBeDefined();
    });
  });
});
