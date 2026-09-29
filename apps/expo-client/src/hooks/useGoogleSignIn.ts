import { useState } from "react";
import { OAuthCallbackError } from "@wishin/domain";

/**
 * Picks the message to show for a failed Google sign-in.
 * OAuth callback errors carry user-facing messages; anything else is hidden behind the fallback
 * so raw SDK errors never reach the user.
 *
 * @param err - The error thrown by the sign-in flow.
 * @param fallbackErrorMessage - Message used for any error that isn't user-facing.
 * @returns The message to display.
 */
export function getGoogleSignInErrorMessage(
  err: unknown,
  fallbackErrorMessage: string,
): string {
  return err instanceof OAuthCallbackError ? err.message : fallbackErrorMessage;
}

/**
 * Manages Google Sign-In state and error handling for a caller-provided sign-in callback.
 *
 * @param onGoogleSignIn - Optional async callback that performs the Google sign-in; if omitted, `signIn` is a no-op.
 * @param fallbackErrorMessage - Message assigned to `googleError` when the sign-in callback throws a non-user-facing error (default: `"Google sign-in failed. Please try again!"`).
 * @returns An object with:
 *  - `signIn` — trigger function that runs the provided sign-in callback and updates state,
 *  - `googleLoading` — `true` while a sign-in attempt is in progress, `false` otherwise,
 *  - `googleError` — current error message or `null` when there is none,
 *  - `setGoogleError` — setter function to update the error state.
 */
export function useGoogleSignIn(
  onGoogleSignIn: (() => Promise<void>) | undefined,
  fallbackErrorMessage = "Google sign-in failed. Please try again!",
) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    if (!onGoogleSignIn) return;
    setGoogleLoading(true);
    setError(null);
    try {
      await onGoogleSignIn();
    } catch (err: unknown) {
      console.error("Google sign-in attempt failed:", err);
      setError(getGoogleSignInErrorMessage(err, fallbackErrorMessage));
    } finally {
      setGoogleLoading(false);
    }
  };

  return {
    signIn,
    googleLoading,
    googleError: error,
    setGoogleError: setError,
  };
}
