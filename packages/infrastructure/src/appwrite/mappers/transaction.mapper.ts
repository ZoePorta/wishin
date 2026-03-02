import type { Models } from "appwrite";
import { Transaction, TransactionStatus } from "@wishin/domain";

/**
 * Interface representing the Appwrite document structure for a Transaction.
 */
export interface TransactionDocument extends Models.Document {
  itemId: string;
  userId: string;
  status: TransactionStatus;
  quantity: number;
}

/**
 * Mapper to convert between Appwrite documents and Transaction aggregate roots.
 */
export const TransactionMapper = {
  /**
   * Converts a Transaction aggregate root to a plain object for Appwrite persistence.
   * @param transaction - The Transaction aggregate root.
   * @returns A plain object compatible with Appwrite's transactions collection.
   */
  toPersistence(transaction: Transaction) {
    const props = transaction.toProps();
    return {
      itemId: props.itemId,
      userId: props.userId,
      status: props.status,
      quantity: props.quantity,
    };
  },

  /**
   * Converts an Appwrite document to a Transaction aggregate root.
   * @param doc - The Appwrite document from the transactions collection.
   * @returns A reconstituted Transaction aggregate root.
   */
  toDomain(doc: Models.Document): Transaction {
    const data = doc as TransactionDocument;

    // Validate TransactionStatus
    if (!Object.values(TransactionStatus).includes(data.status)) {
      throw new Error(`Invalid transaction status: ${data.status}`);
    }

    return Transaction.reconstitute({
      id: doc.$id,
      itemId: data.itemId,
      userId: data.userId,
      status: data.status,
      quantity: data.quantity,
      createdAt: new Date(doc.$createdAt),
      updatedAt: new Date(doc.$updatedAt),
    });
  },
};
