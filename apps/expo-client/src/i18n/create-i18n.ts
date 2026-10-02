import i18next, { type i18n as I18n, type Module } from "i18next";
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  resources,
  type SupportedLanguage,
} from "./resources";

/**
 * Creates and synchronously initializes an i18next instance with the bundled resources.
 * Kept free of native dependencies so it can be used from unit tests.
 *
 * @param language - The initial UI language.
 * @param modules - Optional i18next plugins (e.g. `initReactI18next`).
 * @returns The initialized i18next instance.
 */
export function createI18n(
  language: SupportedLanguage,
  modules: Module[] = [],
): I18n {
  const instance = i18next.createInstance();
  modules.forEach((module) => instance.use(module));

  void instance.init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    // Resources are bundled, so init can complete synchronously before the first render
    initAsync: false,
    interpolation: {
      // React already escapes rendered strings
      escapeValue: false,
    },
  });

  return instance;
}
