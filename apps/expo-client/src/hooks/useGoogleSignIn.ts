import { useState } from "react";

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
