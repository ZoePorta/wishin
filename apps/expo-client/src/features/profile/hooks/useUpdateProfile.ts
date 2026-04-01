import { useState, useCallback, useRef } from "react";
import { useRepositories } from "../../../contexts/WishlistRepositoryContext";
import { UpdateProfileUseCase } from "@wishin/domain";
import type { UpdateProfileInput, ProfileOutput } from "@wishin/domain";

/**
 * Interface for the object returned by the useUpdateProfile hook.
 */
export interface UseUpdateProfileReturn {
  updateProfile: (input: UpdateProfileInput) => Promise<ProfileOutput>;
  updating: boolean;
  error: string | null;
}

/**
 * Custom hook to update a user profile.
 *
 * @returns An object containing the update function, updating state, and error message.
 */
export function useUpdateProfile(): UseUpdateProfileReturn {
  const { profileRepository, storageRepository } = useRepositories();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRequestIdRef = useRef(0);

  const updateProfile = useCallback(
    async (input: UpdateProfileInput): Promise<ProfileOutput> => {
      const requestId = ++lastUpdateRequestIdRef.current;
      try {
        setUpdating(true);
        setError(null);

        const useCase = new UpdateProfileUseCase(
          profileRepository,
          storageRepository,
        );
        const updatedProfile = await useCase.execute(input);

        return updatedProfile;
      } catch (err) {
        if (requestId === lastUpdateRequestIdRef.current) {
          const message =
            err instanceof Error ? err.message : "An error occurred";
          setError(message);
        }
        throw err;
      } finally {
        if (requestId === lastUpdateRequestIdRef.current) {
          setUpdating(false);
        }
      }
    },
    [profileRepository, storageRepository],
  );

  return {
    updateProfile,
    updating,
    error,
  };
}
