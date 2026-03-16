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
  const addedQuantity = Number(transaction.quantity);

  log(`Processing transaction for Item ID: ${itemId}`);

  if (!itemId) {
    error("Error: itemId is missing in the transaction document.");
    return res.json({ success: false, message: "Missing itemId" }, 400);
  }

  if (!Number.isInteger(addedQuantity) || addedQuantity <= 0) {
    error(`Error: Invalid quantity: ${transaction.quantity}`);
    return res.json({ success: false, message: "Invalid quantity" }, 400);
  }

  try {
    // 1. Fetch item to get totalQuantity for capping
    const item = await tablesDb.getRow({
      databaseId: process.env.DATABASE_ID,
      tableId: process.env.ITEMS_COLLECTION_ID,
      rowId: itemId,
    });

    // If isUnlimited is true, it's considered infinite.
    // Otherwise, totalQuantity defaults to 1 for non-unlimited items.
    const max = item.isUnlimited ? null : (item.totalQuantity ?? 1);

    // 2. Perform Atomic Increment
    // Business Invariant: Purchased quantity cannot exceed totalQuantity (if finite)
    const result = await tablesDb.incrementRowColumn({
      databaseId: process.env.DATABASE_ID,
      tableId: process.env.ITEMS_COLLECTION_ID,
      rowId: itemId,
      column: "purchasedQuantity",
      value: addedQuantity,
      max: max,
    });

    log(
      `Success: Atomically incremented item ${itemId}. New purchasedQuantity: ${result.purchasedQuantity}`,
    );
    return res.json({ success: true });
  } catch (err) {
    error(`Failed to update item ${itemId} during increment: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
