// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withAndroidManifest } = require("@expo/config-plugins");

/** @typedef {import('@expo/config-plugins').AndroidConfig.Manifest.AndroidManifest} AndroidManifest */

/**
 * Expo config plugin to add <queries> for http/https to AndroidManifest.xml
 * This is required for Linking.canOpenURL to work on Android 11+ (API 30)
 *
 * @param {import('@expo/config-types').ExpoConfig} config
 * @returns {import('@expo/config-types').ExpoConfig}
 */
const withAndroidQueries = (config) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = addQueries(config.modResults);
    return config;
  });
};

/**
 * Adds the necessary <queries> to the manifest object.
 *
 * @param {AndroidManifest} androidManifest
 * @returns {AndroidManifest}
 */
function addQueries(androidManifest) {
  const manifest = androidManifest.manifest;

  // @ts-expect-error - 'queries' might not be in the typings but is supported by Android
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  manifest.queries ??= [];

  const schemes = ["http", "https"];

  schemes.forEach((scheme) => {
    // Check if the scheme already exists in queries
    // @ts-expect-error - manifest.queries typing might be incomplete
    /** @type {any[]} */
    const queries = manifest.queries;
    const hasScheme = queries.some((query) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      query.intent?.some((intent) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
        intent.data?.some((data) => data.$?.["android:scheme"] === scheme),
      ),
    );

    if (!hasScheme) {
      // @ts-expect-error - manifest.queries typing might be incomplete
      manifest.queries.push({
        intent: [
          {
            action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
            data: [{ $: { "android:scheme": scheme } }],
          },
        ],
      });
    }
  });

  return androidManifest;
}

module.exports = withAndroidQueries;
module.exports.addQueries = addQueries;
