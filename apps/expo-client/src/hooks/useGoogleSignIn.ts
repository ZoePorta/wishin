import { useState } from "react";

/**
 * Custom hook to handle Google Sign-In state and errors.
 *
 * @param onGoogleSignIn - A callback function that performs the actual Google Sign-In operation.
 * @param fallbackErrorMessage - A custom error message to display if the sign-in process fails.
 * @returns An object containing the sign-in trigger function, loading state, error state, and a setter for the error.
 * @throws-like Does not directly throw, but catches internal errors, logs them, and sets the returned error state.
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
      // We use the provided fallback error message to avoid surfacing raw SDK errors to the user
      setError(fallbackErrorMessage);
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
