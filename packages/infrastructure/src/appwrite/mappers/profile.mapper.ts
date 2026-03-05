import type { Models } from "appwrite";
import { Profile } from "@wishin/domain";

/**
 * Interface representing the Appwrite document structure for a Profile.
 */
export interface ProfileDocument extends Models.Document {
  username: string;
  imageUrl?: string;
  bio?: string;
}

/**
 * Type representing the data object sent to Appwrite for persistence.
 */
export type ProfilePersistence = Omit<ProfileDocument, keyof Models.Document>;

/**
 * Mapper to convert between Appwrite documents and Profile domain entities.
 */
export const ProfileMapper = {
  /**
   * Converts a Profile entity to a plain object for Appwrite persistence.
   * @param profile - The Profile entity.
   * @returns A plain object compatible with Appwrite's profiles collection.
   */
  toPersistence(profile: Profile): ProfilePersistence {
    const props = profile.toProps();
    return {
      username: props.username,
      imageUrl: props.imageUrl,
      bio: props.bio,
    };
  },

  /**
   * Converts an Appwrite document to a Profile domain entity.
   * @param doc - The Appwrite document from the profiles collection.
   * @returns A reconstituted Profile entity.
   */
  toDomain(doc: Models.Document): Profile {
    const data = doc as ProfileDocument;

    return Profile.reconstitute({
      id: doc.$id,
      username: data.username,
      imageUrl: data.imageUrl,
      bio: data.bio,
    });
  },
};
