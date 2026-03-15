import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";

import {
  useUserRepository,
  useAuthRepository,
} from "./WishlistRepositoryContext";

interface UserContextValue {
  /** The unique identifier of the current user, or null if not loaded yet. */
  userId: string | null;
  /**
   * The type of the current session.
   * - 'anonymous': Guest user with no registered account.
   * - 'incomplete': Registered account but missing profile record.
   * - 'registered': Fully registered user with a profile.
   * - null: Not loaded yet.
   */
  sessionType: "anonymous" | "incomplete" | "registered" | null;
  /** Whether the user ID is currently being fetched. */
  loading: boolean;
  /** Error message if the user ID could not be fetched. */
  error: string | null;
  /** Refetch the current user ID. */
  refetch: () => Promise<string | null>;
  /** Explicitly login as a guest. */
  loginAsGuest: () => Promise<string | null>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

/**
 * Provider component that fetches and manages the current user's identity.
 * This should be wrapped around the app after the repository context is available.
 */
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const repository = useUserRepository();
  const authRepository = useAuthRepository();
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionType, setSessionType] =
    useState<UserContextValue["sessionType"]>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [id, type] = await Promise.all([
        repository.getCurrentUserId(),
        repository.getSessionType(),
      ]);
      setUserId(id);
      setSessionType(type);
      return id;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch user session";
      setError(message);
      setUserId(null);
      setSessionType(null);
      console.error("UserProvider error:", message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [repository]);

  const loginAsGuest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await authRepository.loginAnonymously();
      const id = await fetchUser();

      if (!id) {
        const message = "No user identity resolved after guest login";
        setError(message);
        console.error("loginAsGuest error:", message);
        throw new Error(message);
      }
      return id;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to login as guest";
      setError(message);
      console.error("loginAsGuest error:", message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authRepository, fetchUser]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const value = useMemo(
    () => ({
      userId,
      sessionType,
      loading,
      error,
      refetch: fetchUser,
      loginAsGuest,
    }),
    [userId, sessionType, loading, error, fetchUser, loginAsGuest],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

/**
 * Hook to consume the UserContext.
 *
 * @returns {UserContextValue} The current user context value.
 * @throws {Error} if used outside of a UserProvider.
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
