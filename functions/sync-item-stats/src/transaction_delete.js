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
    // getRow signature in node-appwrite v22 (TablesDB) uses tableId and rowId
    const item = await tablesDb.getRow({
      databaseId: process.env.DATABASE_ID,
      tableId: process.env.ITEMS_COLLECTION_ID,
      rowId: itemId,
    });

    const currentPurchasedQuantity = item.purchasedQuantity || 0;
    const newPurchasedQuantity = currentPurchasedQuantity - removedQuantity;

    // updateRow signature in node-appwrite v22 (TablesDB) uses tableId and rowId
    await tablesDb.updateRow({
      databaseId: process.env.DATABASE_ID,
      tableId: process.env.ITEMS_COLLECTION_ID,
      rowId: itemId,
      data: {
        purchasedQuantity: newPurchasedQuantity,
      },
    });

    log(
      `Success: Updated item ${itemId} after transaction deletion. Old total: ${currentPurchasedQuantity}, New total: ${newPurchasedQuantity}`,
    );
    return res.json({ success: true });
  } catch (err) {
    error(
      `Failed to update item ${itemId} on transaction deletion: ${err.message}`,
    );
    return res.json({ success: false, error: err.message }, 500);
  }
};
