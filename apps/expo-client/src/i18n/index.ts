import { getLocales } from "expo-localization";
import { initReactI18next } from "react-i18next";
import { createI18n } from "./create-i18n";
import { resolveLanguage } from "./resolve-language";

/**
 * App-wide i18next instance, initialized with the language detected from the device/browser.
 * Use `useTranslation()` in components; import this instance only outside the React tree.
 */
export const i18n = createI18n(resolveLanguage(getLocales()), [
  initReactI18next,
]);

export { resolveLanguage } from "./resolve-language";
export {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from "./resources";
export { useDeviceLanguageSync } from "./useDeviceLanguageSync";
