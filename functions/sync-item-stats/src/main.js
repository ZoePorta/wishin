import { Client, TablesDB } from "node-appwrite";

/**
 * Appwrite Function to sync item statistics when a transaction is created or deleted.
 *
 * This function handles both create and delete events for transaction documents.
 * It detects the event type and either increments or decrements the item's `purchasedQuantity`.
 *
 * @param {object} context - Appwrite Function context.
 * @param {object} context.req - HTTP request object.
 * @param {object} context.res - HTTP response object.
 * @param {Function} context.log - Logging utility.
 * @param {Function} context.error - Error logging utility.
 */
export default async ({ req, res, log, error }) => {
  // Log the event for debugging
  log(`Event received: ${req.headers["x-appwrite-event"]}`);

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const tablesDb = new TablesDB(client);

  const transaction = req.body;
  const itemId = transaction?.itemId?.$id;
  const quantity = Number(transaction.quantity);
  const event = req.headers["x-appwrite-event"] || "";

  log(`Processing transaction for Item ID: ${itemId}. Event: ${event}`);

  if (!itemId) {
    error("Error: itemId is missing in the transaction document.");
    return res.json({ success: false, message: "Missing itemId" }, 400);
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    error(`Error: Invalid quantity: ${transaction.quantity}`);
    return res.json({ success: false, message: "Invalid quantity" }, 400);
  }

  // TODO: Implement logic for updates when cancellations and reservations are implemented
  // For now, we only sync if status is PURCHASED
  if (transaction.status !== "PURCHASED") {
    log(
      `Skipping transaction ${transaction.$id}: status is ${transaction.status}, not PURCHASED`,
    );
    return res.json({
      success: true,
      message: "No sync needed for this status",
    });
  }

  try {
    if (event.includes(".create")) {
      log(`Incrementing purchasedQuantity for item ${itemId} by ${quantity}`);

      // Fetch item to get totalQuantity for capping
      const item = await tablesDb.getRow({
        databaseId: process.env.DATABASE_ID,
        tableId: process.env.ITEMS_COLLECTION_ID,
        rowId: itemId,
      });

      const max = item.isUnlimited ? null : (item.totalQuantity ?? 1);

      const result = await tablesDb.incrementRowColumn({
        databaseId: process.env.DATABASE_ID,
        tableId: process.env.ITEMS_COLLECTION_ID,
        rowId: itemId,
        column: "purchasedQuantity",
        value: quantity,
        max: max,
      });

      log(
        `Success: Atomically incremented item ${itemId}. New purchasedQuantity: ${result.purchasedQuantity}`,
      );
    } else if (event.includes(".delete")) {
      log(`Decrementing purchasedQuantity for item ${itemId} by ${quantity}`);

      const result = await tablesDb.decrementRowColumn({
        databaseId: process.env.DATABASE_ID,
        tableId: process.env.ITEMS_COLLECTION_ID,
        rowId: itemId,
        column: "purchasedQuantity",
        value: quantity,
        min: 0,
      });

      log(
        `Success: Atomically decremented item ${itemId}. New purchasedQuantity: ${result.purchasedQuantity}`,
      );
    } else {
      log(`Unhandled event type: ${event}`);
      return res.json({ success: true, message: "Event ignored" });
    }

    return res.json({ success: true });
  } catch (err) {
    error(
      `Failed to update item ${itemId}: ${err.stack || err.message || err}`,
    );
    return res.json({ success: false, error: err.message }, 500);
  }
};
