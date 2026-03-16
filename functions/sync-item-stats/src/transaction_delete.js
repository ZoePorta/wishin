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
  const removedQuantity = transaction.quantity;

  log(`Processing deletion of transaction for Item ID: ${itemId}`);

  if (!itemId) {
    error("Error: itemId is missing in the deleted transaction document.");
    return res.json({ success: false, message: "Missing itemId" }, 400);
  }

  try {
    // Retry logic for optimistic concurrency/atomic decrement simulation
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    let lastError = null;

    while (attempts < MAX_ATTEMPTS) {
      try {
        // 1. Read current state
        const item = await tablesDb.getRow({
          databaseId: process.env.DATABASE_ID,
          tableId: process.env.ITEMS_COLLECTION_ID,
          rowId: itemId,
        });

        const currentPurchasedQuantity = item.purchasedQuantity || 0;
        // Business Invariant: Purchased quantity cannot be negative
        const newPurchasedQuantity = Math.max(
          0,
          currentPurchasedQuantity - removedQuantity,
        );

        // 2. Perform Update
        await tablesDb.updateRow({
          databaseId: process.env.DATABASE_ID,
          tableId: process.env.ITEMS_COLLECTION_ID,
          rowId: itemId,
          data: {
            purchasedQuantity: newPurchasedQuantity,
          },
        });

        log(
          `Success: Updated item ${itemId} after transaction deletion. Old total: ${currentPurchasedQuantity}, New total: ${newPurchasedQuantity} (Attempt ${attempts + 1})`,
        );
        return res.json({ success: true });
      } catch (err) {
        lastError = err;
        attempts++;
        if (attempts < MAX_ATTEMPTS) {
          error(
            `Retry attempt ${attempts} failed for item ${itemId} during deletion: ${err.message}`,
          );
          // Exponential backoff with jitter
          const delay = Math.pow(2, attempts) * 100 + Math.random() * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Failed to update item after maximum retries");
  } catch (err) {
    error(
      `Failed to update item ${itemId} on transaction deletion: ${err.message}`,
    );
    return res.json({ success: false, error: err.message }, 500);
  }
};
