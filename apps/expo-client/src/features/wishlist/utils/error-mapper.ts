import type { TFunction } from "i18next";
import {
  InsufficientStockError,
  WishlistItemNotFoundError,
  WishlistNotFoundError,
} from "@wishin/domain";

/**
 * Categories of errors the UI knows how to explain to the user.
 * Kept language-agnostic so UI state never depends on the text of a translated message.
 */
export type ErrorKind =
  | "nameTooShort"
  | "nameTooLong"
  | "wishlistNotFound"
  | "itemNotFound"
  | "itemUnavailable"
  | "network"
  | "imageUpload"
  | "unknown";

/**
 * Translation key for each error category.
 */
export const ERROR_MESSAGE_KEYS = {
  nameTooShort: "errors.nameTooShort",
  nameTooLong: "errors.nameTooLong",
  wishlistNotFound: "errors.wishlistNotFound",
  itemNotFound: "errors.itemNotFound",
  itemUnavailable: "errors.itemUnavailable",
  network: "errors.network",
  imageUpload: "errors.imageUpload",
  unknown: "errors.unknown",
} as const satisfies Record<ErrorKind, string>;

/**
 * Maps a domain/technical error (or its message) to a user-facing error category.
 *
 * @param err - The error object or message.
 * @returns The matching category, or `unknown` if none applies.
 */
export const classifyError = (err: unknown): ErrorKind => {
  if (err instanceof WishlistItemNotFoundError) return "itemNotFound";
  if (err instanceof WishlistNotFoundError) return "wishlistNotFound";
  if (err instanceof InsufficientStockError) return "itemUnavailable";

  const message = (
    err instanceof Error ? err.message : String(err)
  ).toLowerCase();

  if (message.includes("too short")) return "nameTooShort";
  if (message.includes("too long")) return "nameTooLong";
  if (
    message.includes("wishlist not found") ||
    (message.includes("wishlist with id") && message.includes("not found"))
  ) {
    return "wishlistNotFound";
  }
  if (message.includes("wishlist item with id")) return "itemNotFound";
  if (
    message.includes("network request failed") ||
    message.includes("failed to fetch")
  ) {
    return "network";
  }
  if (
    message.includes("upload failed") ||
    message.includes("uploading the image")
  ) {
    return "imageUpload";
  }
  return "unknown";
};

/**
 * Whether the error category refers to the name/title field of a form.
 *
 * @param kind - The error category, or null when there is no error.
 * @returns True for name length errors.
 */
export const isNameError = (kind: ErrorKind | null): boolean =>
  kind === "nameTooShort" || kind === "nameTooLong";

/**
 * Maps domain/technical errors to friendly, translated user feedback.
 *
 * @param err - The error object or message.
 * @param t - Translation function for the current language.
 * @returns The translated message.
 */
export const mapErrorToMessage = (err: unknown, t: TFunction): string =>
  t(ERROR_MESSAGE_KEYS[classifyError(err)]);
