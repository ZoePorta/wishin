import { useState, useEffect, useCallback, useRef } from "react";
import { useRepositories } from "../../../contexts/WishlistRepositoryContext";
import { GetProfileByIdUseCase } from "@wishin/domain";
import type { ProfileOutput } from "@wishin/domain";

/**
 * Interface for the object returned by the useProfile hook.
 */
export interface UseProfileReturn {
  profile: ProfileOutput | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage a user profile by ID.
 *
 * @param userId - The ID of the user whose profile to fetch.
 * @returns An object containing the profile data, loading state, error message, and refetch function.
 */
export function useProfile(userId?: string): UseProfileReturn {
  const { profileRepository } = useRepositories();
  const [profile, setProfile] = useState<ProfileOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    try {
      setLoading(true);
      setError(null);

      const useCase = new GetProfileByIdUseCase(profileRepository);
      const data = await useCase.execute({ id: userId });

      if (fetchId === fetchIdRef.current) {
        setProfile(data);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current) {
        console.error("Error fetching profile:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setProfile(null);
      }
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [userId, profileRepository]);

  useEffect(() => {
    void loadProfile();
    return () => {
      fetchIdRef.current++;
    };
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    refetch: loadProfile,
  };
}
