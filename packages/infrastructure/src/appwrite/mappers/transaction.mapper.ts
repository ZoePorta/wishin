import type { Models } from "react-native-appwrite";
import { Transaction, TransactionStatus } from "@wishin/domain";

/**
 * Interface representing the Appwrite document structure for a Transaction.
 */
export interface TransactionDocument extends Models.Document {
  itemId: string | null;
  userId: string | null;
  itemName: string | null;
  itemPrice: number | null;
  itemCurrency: string | null;
  itemDescription: string | null;
  itemImageUrl: string | null;
  ownerUsername: string | null;
  status: TransactionStatus;
  quantity: number;
}

/**
 * Type representing the data object sent to Appwrite for persistence.
 * This omits internal Appwrite document fields.
 */
export type TransactionPersistence = Omit<
  TransactionDocument,
  keyof Models.Document
>;

/**
 * Mapper to convert between Appwrite documents and Transaction aggregate roots.
 */
export const TransactionMapper = {
  /**
   * Converts a Transaction aggregate root to a plain object for Appwrite persistence.
   * @param transaction - The Transaction aggregate root.
   * @returns A plain object compatible with Appwrite's transactions collection.
   */
  toPersistence(transaction: Transaction): TransactionPersistence {
    const props = transaction.toProps();
    return {
      itemId: props.itemId,
      userId: props.userId ?? null,
      itemName: props.itemName,
      itemPrice: props.itemPrice,
      itemCurrency: props.itemCurrency,
      itemDescription: props.itemDescription,
      itemImageUrl: props.itemImageUrl,
      ownerUsername: props.ownerUsername,
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
      itemName: data.itemName,
      itemPrice: data.itemPrice,
      itemCurrency: data.itemCurrency,
      itemDescription: data.itemDescription,
      itemImageUrl: data.itemImageUrl,
      ownerUsername: data.ownerUsername,
      status: data.status,
      quantity: data.quantity,
      createdAt: new Date(doc.$createdAt),
      updatedAt: new Date(doc.$updatedAt),
    });
  },
};
