import type { Profile } from "../aggregates/profile";

/**
 * Repository interface for Profile entities.
 * Manages public-facing user metadata.
 */
export interface ProfileRepository {
  /**
   * Finds a profile by its unique user identifier.
   * @param id The identifier of the user (UUID or Appwrite ID).
   * @returns A Promise that resolves to the Profile entity or null if not found.
   */
  findById(id: string): Promise<Profile | null>;

  /**
   * Persists a profile entity.
   * @param profile The profile to save.
   * @returns A Promise that resolves when the profile is saved.
   */
  save(profile: Profile): Promise<void>;
}
