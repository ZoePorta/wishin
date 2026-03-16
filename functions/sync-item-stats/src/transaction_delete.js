import { Client, TablesDB } from "node-appwrite";

/**
 * Appwrite Function to sync item statistics when a transaction is deleted.
 *
 * This function is triggered when a transaction document is deleted.
 * It retrieves the associated item, decrements its `purchasedQuantity`,
 * and updates the item document in the database using the TablesDB API.
 *
 * Business Invariant:
 * - Updates `item.purchasedQuantity` atomically (conceptually) by subtracting the transaction quantity.
 *
 * @param {object} context - Appwrite Function context.
 * @param {object} context.req - HTTP request object.
 * @param {object} context.req.body - The transaction document that was deleted.
 * @param {object} context.res - HTTP response object.
 * @param {Function} context.log - Logging utility.
 * @param {Function} context.error - Error logging utility.
 * @returns {Promise<object>} HTTP response confirming the update.
 * @throws {Error} If database operations fail.
 */
export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const tablesDb = new TablesDB(client);

  const transaction = req.body;
  const itemId = transaction.itemId?.$id;
  const removedQuantity = Number(transaction.quantity);

  log(
    `Processing deletion of transaction for Item ID: ${itemId}. Quantity: ${removedQuantity}`,
  );

  if (!itemId) {
    error("Error: itemId is missing in the deleted transaction document.");
    return res.json({ success: false, message: "Missing itemId" }, 400);
  }

  if (!Number.isInteger(removedQuantity) || removedQuantity <= 0) {
    error(`Error: Invalid quantity: ${transaction.quantity}`);
    return res.json({ success: false, message: "Invalid quantity" }, 400);
  }

  try {
    // 1. Perform Atomic Decrement
    // Business Invariant: Purchased quantity cannot be negative
    const result = await tablesDb.decrementRowColumn({
      databaseId: process.env.DATABASE_ID,
      tableId: process.env.ITEMS_COLLECTION_ID,
      rowId: itemId,
      column: "purchasedQuantity",
      value: removedQuantity,
      min: 0,
    });

    log(
      `Success: Atomically decremented item ${itemId}. New purchasedQuantity: ${result.purchasedQuantity}`,
    );
    return res.json({ success: true });
  } catch (err) {
    // Improve observability with full error details and context
    error(
      `Failed to update item ${itemId} during decrement. Removed: ${removedQuantity}. Error: ${err.stack || err.message || err}`,
    );
    return res.json({ success: false, error: err.message }, 500);
  }
};
