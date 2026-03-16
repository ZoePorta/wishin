import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const databases = new Databases(client);

  // req.body is the transaction document that was just created
  const transaction = req.body;
  const itemId = transaction.itemId.$id;
  const addedQuantity = transaction.quantity;

  log("transaction", transaction);
  log("itemId", itemId);

  if (!itemId) {
    error("Error: itemId is missing in the transaction document.");
    return res.json({ success: false, message: "Missing itemId" }, 400);
  }

  try {
    // Correct v14 syntax: parameters as a single object
    const item = await databases.getDocument({
      databaseId: process.env.DATABASE_ID,
      collectionId: process.env.ITEMS_COLLECTION_ID,
      documentId: itemId,
    });

    const newPurchasedQuantity = (item.purchasedQuantity || 0) + addedQuantity;

    await databases.updateDocument({
      databaseId: process.env.DATABASE_ID,
      collectionId: process.env.ITEMS_COLLECTION_ID,
      documentId: itemId,
      data: {
        purchasedQuantity: newPurchasedQuantity,
      },
    });

    log(`Success: Updated item ${itemId} new total: ${newPurchasedQuantity}`);
    return res.json({ success: true });
  } catch (err) {
    error(`Failed to update item: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
