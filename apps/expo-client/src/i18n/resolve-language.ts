import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type SupportedLanguage,
} from "./resources";

/**
 * Minimal locale shape needed for detection; compatible with `expo-localization`'s `Locale`.
 */
export interface PreferredLocale {
  /** ISO 639-1 language code, possibly null when the platform can't tell. */
  languageCode: string | null;
}

/**
 * Picks the UI language from the user's preferred locales.
 *
 * @param locales - Device/browser locales, ordered by user preference.
 * @returns The first supported language, or the default language if none is supported.
 */
export function resolveLanguage(
  locales: readonly PreferredLocale[],
): SupportedLanguage {
  for (const { languageCode } of locales) {
    const code = languageCode?.split("-")[0].toLowerCase();
    if (code && isSupportedLanguage(code)) return code;
  }
  return DEFAULT_LANGUAGE;
}
