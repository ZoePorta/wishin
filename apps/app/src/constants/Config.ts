/**
 * Centralized configuration for the application.
 * Manages environment variables and database resource namespacing.
 */

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? "";
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "";
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ?? "";
const prefix = process.env.EXPO_PUBLIC_DB_PREFIX ?? "";

/**
 * Validates that all required Appwrite environment variables are set.
 * Tests should set these environment variables or call a helper to stub them.
 *
 * @throws {Error} If EXPO_PUBLIC_APPWRITE_ENDPOINT, EXPO_PUBLIC_APPWRITE_PROJECT_ID,
 * or EXPO_PUBLIC_APPWRITE_DATABASE_ID are missing.
 */
export function ensureAppwriteConfig() {
  if (!endpoint || !projectId || !databaseId) {
    throw new Error(
      "Missing required Appwrite environment variables. " +
        "Ensure EXPO_PUBLIC_APPWRITE_ENDPOINT, EXPO_PUBLIC_APPWRITE_PROJECT_ID, " +
        "and EXPO_PUBLIC_APPWRITE_DATABASE_ID are set in your .env file.",
    );
  }
}

export const Config = {
  appwrite: {
    endpoint,
    projectId,
    databaseId,
  },
  collections: {
    wishlists: prefix ? `${prefix}_wishlists` : "wishlists",
    wishlistItems: prefix ? `${prefix}_wishlist_items` : "wishlist_items",
    transactions: prefix ? `${prefix}_transactions` : "transactions",
    users: prefix ? `${prefix}_users` : "users",
  },
} as const;
