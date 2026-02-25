import { useUser } from "../contexts/UserContext";

/**
 * Hook to retrieve the current user's identifier.
 * Primarily used to identify the owner of the session.
 *
 * @returns An object containing the userId, loading state, and error.
 */
export function useCurrentUserId() {
  const { userId, loading, error, refetch } = useUser();

  return {
    userId,
    loading,
    error,
    refetch,
  };
}
