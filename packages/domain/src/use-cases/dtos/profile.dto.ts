/**
 * Input DTO for fetching a profile.
 */
export interface GetProfileInput {
  /**
   * Unique identifier (UUID or Appwrite ID) of the user.
   */
  id: string;
}

/**
 * Output DTO for a profile.
 */
export interface ProfileOutput {
  id: string;
  username: string;
  bio?: string;
  imageUrl?: string;
}
