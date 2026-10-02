import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getOAuthErrorMessage } from "../utils/auth-errors";

/**
 * Manages Google Sign-In state and error handling for a caller-provided sign-in callback.
 *
 * @param onGoogleSignIn - Optional async callback that performs the Google sign-in; if omitted, `signIn` is a no-op.
 * @param fallbackErrorMessage - Message assigned to `googleError` when the sign-in callback throws a non-OAuth error (default: the translated `auth.google.failed` message).
 * @returns An object with:
 *  - `signIn` — trigger function that runs the provided sign-in callback and updates state,
 *  - `googleLoading` — `true` while a sign-in attempt is in progress, `false` otherwise,
 *  - `googleError` — current error message or `null` when there is none,
 *  - `setGoogleError` — setter function to update the error state.
 */
export function useGoogleSignIn(
  onGoogleSignIn: (() => Promise<void>) | undefined,
  fallbackErrorMessage?: string,
) {
  const { t } = useTranslation();
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
      setError(
        getOAuthErrorMessage(
          err,
          t,
          fallbackErrorMessage ?? t("auth.google.failed"),
        ),
      );
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
