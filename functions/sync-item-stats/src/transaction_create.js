import { Client, TablesDB } from "node-appwrite";

/**
 * Appwrite Function to sync item statistics when a transaction is created.
 *
 * This function is triggered when a new transaction document is created.
 * It retrieves the associated item, increments its `purchasedQuantity`,
 * and updates the item document in the database using the TablesDB API.
 *
 * Business Invariant:
 * - Updates `item.purchasedQuantity` atomically (conceptually) by adding the transaction quantity.
 *
 * @param {object} context - Appwrite Function context.
 * @param {object} context.req - HTTP request object.
 * @param {object} context.req.body - The transaction document that triggered the function.
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
  const addedQuantity = transaction.quantity;

  log(`Processing transaction for Item ID: ${itemId}`);

  if (!itemId) {
    error("Error: itemId is missing in the transaction document.");
    return res.json({ success: false, message: "Missing itemId" }, 400);
  }

  try {
    // Retry logic for optimistic concurrency/atomic increment simulation
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
        const newPurchasedQuantity = currentPurchasedQuantity + addedQuantity;

        // 2. Perform Update
        // Note: Appwrite's updateRow doesn't natively support conditional writes (optimistic locking)
        // in the standard SDK, but by re-reading inside the retry loop and doing it quickly,
        // we minimize the race window.
        await tablesDb.updateRow({
          databaseId: process.env.DATABASE_ID,
          tableId: process.env.ITEMS_COLLECTION_ID,
          rowId: itemId,
          data: {
            purchasedQuantity: newPurchasedQuantity,
          },
        });

        log(
          `Success: Updated item ${itemId}. Old total: ${currentPurchasedQuantity}, New total: ${newPurchasedQuantity} (Attempt ${attempts + 1})`,
        );
        return res.json({ success: true });
      } catch (err) {
        lastError = err;
        attempts++;
        if (attempts < MAX_ATTEMPTS) {
          error(
            `Retry attempt ${attempts} failed for item ${itemId}: ${err.message}`,
          );
          // Exponential backoff with jitter
          const delay = Math.pow(2, attempts) * 100 + Math.random() * 100;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error("Failed to update item after maximum retries");
  } catch (err) {
    error(`Failed to update item ${itemId}: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
