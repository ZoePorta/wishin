import { Client, TablesDB } from "node-appwrite";
import "dotenv/config";

const {
  EXPO_PUBLIC_APPWRITE_ENDPOINT,
  EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  APPWRITE_API_SECRET,
  EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  EXPO_PUBLIC_DB_PREFIX,
} = process.env;

async function debug() {
  if (
    !EXPO_PUBLIC_APPWRITE_ENDPOINT ||
    !EXPO_PUBLIC_APPWRITE_PROJECT_ID ||
    !APPWRITE_API_SECRET
  ) {
    throw new Error("Missing environment variables");
  }

  const client = new Client()
    .setEndpoint(EXPO_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(EXPO_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_SECRET);

  const tablesDb = new TablesDB(client);
  const databaseId = EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? "";
  const prefix = EXPO_PUBLIC_DB_PREFIX ?? "dev";
  const tableId = `${prefix}_wishlists`;

  console.log("--- Testing upsertRow WITHOUT permissions ---");
  try {
    const testId = `debug-test-${String(Date.now())}`;
    await tablesDb.upsertRow({
      databaseId,
      tableId,
      rowId: testId,
      data: {
        ownerId: "debug-owner",
        title: "Debug Wishlist",
        version: 0,
        visibility: "LINK",
        participation: "ANYONE",
      },
    });
    console.log("Success: upsertRow without permissions worked.");

    console.log("\n--- Testing upsertRow with raw 'any' role ---");
    try {
      await tablesDb.upsertRow({
        databaseId,
        tableId,
        rowId: testId,
        data: { title: "Debug Updated" },
        permissions: ["any"], // This is what I suspect might be failing
      });
      console.log("Success: upsertRow with raw 'any' worked.");
    } catch (e: unknown) {
      const error = e as Error & { response?: unknown };
      console.log(
        "Expected Failure: upsertRow with raw 'any' failed:",
        error.message,
      );
    }

    console.log("\n--- Testing upsertRow with 'read(\"any\")' format ---");
    try {
      await tablesDb.upsertRow({
        databaseId,
        tableId,
        rowId: testId,
        data: { title: "Debug Updated 2" },
        permissions: ['read("any")'],
      });
      console.log("Success: upsertRow with 'read(\"any\")' worked.");
    } catch (e: unknown) {
      const error = e as Error & { response?: unknown };
      console.log(
        "Failure: upsertRow with 'read(\"any\")' failed:",
        error.message,
      );
    }
  } catch (e: unknown) {
    const error = e as Error & { response?: unknown };
    console.error("DEBUG FAILED:", error.message);
    if (error.response)
      console.log("Response:", JSON.stringify(error.response, null, 2));
  }
}

debug().catch(console.error);
