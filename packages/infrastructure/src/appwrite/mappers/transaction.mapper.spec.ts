import { describe, it, expect } from "vitest";
import { Transaction, TransactionStatus } from "@wishin/domain";
import { TransactionMapper } from "./transaction.mapper";
import type { Models } from "appwrite";

describe("TransactionMapper", () => {
  const transactionId = "550e8400-e29b-41d4-a716-446655440000";
  const itemId = "660e8400-e29b-41d4-a716-446655441111";
  const userId = "user-123";
  const now = new Date();

  const validProps = {
    id: transactionId,
    itemId,
    userId,
    status: TransactionStatus.RESERVED,
    quantity: 1,
    createdAt: now,
    updatedAt: now,
  };

  describe("toPersistence", () => {
    it("should map Transaction aggregate to Appwrite document data", () => {
      const transaction = Transaction.reconstitute(validProps);
      const result = TransactionMapper.toPersistence(transaction);

      expect(result).toEqual({
        itemId: validProps.itemId,
        userId: validProps.userId,
        status: validProps.status,
        quantity: validProps.quantity,
      });
      // Verify timestamps are NOT in the persistence object (as they are system fields)
      expect(result).not.toHaveProperty("createdAt");
      expect(result).not.toHaveProperty("updatedAt");
    });
  });

  describe("toDomain", () => {
    it("should map Appwrite document to Transaction aggregate", () => {
      const doc: Models.Document = {
        $id: transactionId,
        $collectionId: "transactions",
        $databaseId: "default",
        $createdAt: now.toISOString(),
        $updatedAt: now.toISOString(),
        $permissions: [],
        itemId,
        userId,
        status: TransactionStatus.RESERVED,
        quantity: 1,
      };

      const result = TransactionMapper.toDomain(doc);

      expect(result).toBeInstanceOf(Transaction);
      expect(result.id).toBe(transactionId);
      expect(result.itemId).toBe(itemId);
      expect(result.userId).toBe(userId);
      expect(result.status).toBe(TransactionStatus.RESERVED);
      expect(result.quantity).toBe(1);
      // Verify timestamps are correctly mapped from $ fields
      expect(result.createdAt.toISOString()).toBe(now.toISOString());
      expect(result.updatedAt.toISOString()).toBe(now.toISOString());
    });
  });
});
