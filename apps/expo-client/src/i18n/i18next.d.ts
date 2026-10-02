import "i18next";
import type { en } from "./locales/en";

declare module "i18next" {
  /**
   * Types translation keys against the English resource so `t()` rejects unknown keys.
   */
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof en;
    };
  }
}
