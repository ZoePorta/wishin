/**
 * Supported currencies for wishlist items, with the translation key of their display name.
 */
export const SUPPORTED_CURRENCIES = [
  { code: "€", nameKey: "currencies.euro" },
  { code: "$", nameKey: "currencies.usDollar" },
  { code: "£", nameKey: "currencies.britishPound" },
  { code: "¥", nameKey: "currencies.japaneseYen" },
] as const;

/**
 * Default currency to use when none is specified.
 */
export const DEFAULT_CURRENCY = "€";
