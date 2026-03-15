import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  const databases = new Databases(client);

  // Appwrite triggers send the document in req.body
  const transaction = req.body;

  if (!transaction.itemId || !transaction.quantity) {
    error("Invalid transaction data.");
    return res.json({ success: false }, 400);
  }

  try {
    const item = await databases.getDocument(
      process.env.DATABASE_ID,
      process.env.ITEMS_COLLECTION_ID,
      transaction.itemId,
    );

    const newQuantity = (item.purchasedQuantity || 0) + transaction.quantity;

    await databases.updateDocument(
      process.env.DATABASE_ID,
      process.env.ITEMS_COLLECTION_ID,
      transaction.itemId,
      { purchasedQuantity: newQuantity },
    );

    log(`Updated item ${transaction.itemId} to ${newQuantity}`);
    return res.json({ success: true });
  } catch (err) {
    error(`Failed to update item: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
