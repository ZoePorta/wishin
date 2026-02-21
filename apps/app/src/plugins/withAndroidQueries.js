const { withAndroidManifest } = require("@expo/config-plugins");

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
 * @param {Object} androidManifest
 * @returns {Object}
 */
function addQueries(androidManifest) {
  if (!androidManifest.queries) {
    androidManifest.queries = [];
  }

  const schemes = ["http", "https"];

  schemes.forEach((scheme) => {
    // Check if the scheme already exists in queries
    const hasScheme = androidManifest.queries.some((query) =>
      query.intent?.some((intent) =>
        intent.data?.some((data) => data.$["android:scheme"] === scheme),
      ),
    );

    if (!hasScheme) {
      androidManifest.queries.push({
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
