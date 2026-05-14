import type { ExpoConfig, ConfigContext } from "expo/config";

/**
 * Provides the dynamic configuration for the Expo application.
 *
 * @param config - The initial configuration context provided by Expo.
 * @returns {ExpoConfig} The complete, merged configuration object.
 *
 * @remarks
 * Reads the `EXPO_PUBLIC_APPWRITE_PROJECT_ID` environment variable
 * to construct the enforced URL scheme format (`appwrite-callback-<PROJECT_ID>`)
 * required for Appwrite OAuth redirects.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const rawProjectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID as
    | string
    | undefined;
  const projectId =
    rawProjectId?.trim() !== "" ? rawProjectId?.trim() : undefined;

  if (!projectId) {
    const errorMsg =
      "EXPO_PUBLIC_APPWRITE_PROJECT_ID is missing. Expected scheme format: appwrite-callback-<PROJECT_ID>";
    if (process.env.NODE_ENV !== "development") {
      throw new Error(errorMsg);
    } else {
      console.warn(`[Config Warning] ${errorMsg}`);
    }
  }

  return {
    ...config,
    name: config.name ?? "Wishin",
    slug: config.slug ?? "app",
    scheme: projectId ? `appwrite-callback-${projectId}` : "wishin",
  };
};
