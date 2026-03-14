/**
 * Centralized configuration for the application.
 * Manages environment variables and database resource namespacing.
 */

const endpoint = (process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? "") as string;
const projectId = (process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? "") as string;
const databaseId = (process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID ??
  "") as string;
const prefix = (process.env.EXPO_PUBLIC_DB_PREFIX ?? "") as string;
/**
 * Resolves and validates the base URL for the application.
 *
 * @returns {string} The validated base URL without trailing slashes.
 * @throws {Error} If EXPO_PUBLIC_BASE_URL is invalid or insecure in non-development environments.
 */
function getValidatedBaseUrl(): string {
  const rawEnvUrl = process.env.EXPO_PUBLIC_BASE_URL as string | undefined;
  const trimmedEnvUrl = rawEnvUrl?.trim();
  const isDev = process.env.NODE_ENV === "development";

  if (!trimmedEnvUrl) {
    if (isDev) {
      return "http://localhost:8081";
    }
    throw new Error(
      "Missing EXPO_PUBLIC_BASE_URL. " +
        "This environment variable is required in non-development environments to generate valid share URLs. " +
        "Check your .env file.",
    );
  }

  try {
    const url = new URL(trimmedEnvUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(
        `Invalid protocol for EXPO_PUBLIC_BASE_URL: "${url.protocol}". Only http: and https: are allowed.`,
      );
    }

    if (!isDev && url.protocol !== "https:") {
      throw new Error(
        "Insecure EXPO_PUBLIC_BASE_URL detected. " +
          "HTTPS is required in non-development environments for security.",
      );
    }

    const normalizedPathname = url.pathname.replace(/\/+$/, "");
    return `${url.origin}${normalizedPathname}`;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TypeError") {
      throw new Error(
        `Invalid EXPO_PUBLIC_BASE_URL: "${trimmedEnvUrl}". It must be a valid absolute URL.`,
      );
    }
    throw error;
  }
}

let cachedBaseUrl: string | undefined;

// Defer initialization to avoid top-level side effects

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

  cachedBaseUrl ??= getValidatedBaseUrl();
}

export const Config = {
  appwrite: {
    endpoint,
    projectId,
    databaseId,
  },
  get baseUrl(): string {
    cachedBaseUrl ??= getValidatedBaseUrl();
    return cachedBaseUrl;
  },
  collections: {
    wishlists: prefix ? `${prefix}_wishlists` : "wishlists",
    wishlistItems: prefix ? `${prefix}_wishlist_items` : "wishlist_items",
    transactions: prefix ? `${prefix}_transactions` : "transactions",
    profiles: prefix ? `${prefix}_profiles` : "profiles",
  },
} as const;
