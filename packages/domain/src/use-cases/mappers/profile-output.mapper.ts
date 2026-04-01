import type { Profile } from "../../aggregates/profile";
import type { ProfileOutput } from "../dtos/profile.dto";

/**
 * Mapper to convert Profile aggregate to ProfileOutput DTO.
 */
export const ProfileOutputMapper = {
  /**
   * Converts a Profile aggregate to a ProfileOutput DTO.
   * @param profile - The Profile aggregate root.
   * @returns The mapped ProfileOutput DTO.
   */
  toDTO(profile: Profile): ProfileOutput {
    const props = profile.toProps();
    return {
      id: props.id,
      username: props.username,
      bio: props.bio,
      imageUrl: props.imageUrl,
    };
  },
};
