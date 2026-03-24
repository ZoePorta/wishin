import { WishlistItemNotFoundError } from "@wishin/domain";

/**
 * Normalizes an error object or string for consistent comparison.
 */
export const normalizeError = (err: unknown): string => {
  return (err instanceof Error ? err.message : String(err)).toLowerCase();
};

/**
 * Checks if an error message contains a specific term (case-insensitive).
 */
export const matchesError = (
  error: string | null | undefined,
  term: string,
): boolean => {
  if (!error) return false;
  return error.toLowerCase().includes(term.toLowerCase());
};

/**
 * Primary error message mapper for friendly, approachable language.
 * Maps domain/technical errors to user-centric feedback.
 */
export const mapErrorToMessage = (err: unknown): string => {
  const message = err instanceof Error ? err.message : String(err);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("too short")) {
    return "Oops! The name is a bit too short. It needs at least 3 characters to look great on your list! ✨";
  }
  if (lowerMessage.includes("too long")) {
    return "Whoa! That's a long name. Try keeping it under 100 characters so it fits perfectly! 📏";
  }

  if (lowerMessage.includes("wishlist not found")) {
    return "We couldn't find your wishlist. Please try refreshing the page! 🔄";
  }
  if (
    err instanceof WishlistItemNotFoundError ||
    lowerMessage.includes("wishlist item with id")
  ) {
    return "Couldn’t find that wishlist item. It might have been removed! 🕵️‍♂️";
  }
  if (
    lowerMessage.includes("network request failed") ||
    lowerMessage.includes("failed to fetch")
  ) {
    return "It seems like there's a connection issue. Please check your internet and try again! 📡";
  }
  if (
    lowerMessage.includes("upload failed") ||
    lowerMessage.includes("uploading the image")
  ) {
    return "We had some trouble with the image. Want to try again or save without it? 🖼️";
  }

  return "Something went wrong on our end. Could you please try again? 🛠️";
};
