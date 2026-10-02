import { useEffect } from "react";
import { Platform } from "react-native";
import { useLocales } from "expo-localization";
import { useTranslation } from "react-i18next";
import { resolveLanguage } from "./resolve-language";

/**
 * Keeps the UI language in sync with the device/browser preferences while the app is running
 * (e.g. the user changes the system language without restarting the app).
 * On web it also mirrors the language into `<html lang>` for assistive technologies and SEO.
 *
 * @returns {void}
 */
export function useDeviceLanguageSync(): void {
  const locales = useLocales();
  const { i18n } = useTranslation();
  const language = resolveLanguage(locales);

  useEffect(() => {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [i18n, language]);
}
