import { en } from "./locales/en";
import { es } from "./locales/es";

/**
 * Languages the UI is translated into.
 */
export const SUPPORTED_LANGUAGES = ["en", "es"] as const;

/** A language the UI is translated into. */
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Language used when the device prefers none of the supported ones. */
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

/**
 * i18next resources, bundled statically so translations are available synchronously at startup.
 */
export const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

/**
 * Type guard for supported language codes.
 *
 * @param code - A bare ISO 639-1 language code (e.g. `es`).
 * @returns Whether the UI is translated into that language.
 */
export const isSupportedLanguage = (code: string): code is SupportedLanguage =>
  (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
