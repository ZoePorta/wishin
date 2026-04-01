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

/**
 * Input DTO for updating a profile.
 */
export interface UpdateProfileInput {
  /**
   * Unique identifier (UUID or Appwrite ID) of the user.
   */
  id: string;

  /**
   * Optional new username.
   */
  username?: string;

  /**
   * Optional new biography.
   */
  bio?: string;

  /**
   * Optional new profile image URL.
   */
  imageUrl?: string;
}
