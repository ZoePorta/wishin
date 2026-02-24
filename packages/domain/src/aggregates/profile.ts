import { InvalidAttributeError } from "../errors/domain-errors";
import { ValidationMode } from "../common/validation-mode";
import { isValidIdentity } from "../common/validation-utils";

/**
 * Public interface defining the shape of Profile data.
 * Used for data transfer, persistence, and as an input for Factory/Reconstitution methods.
 *
 * Note: Identity (userId) and private data (email) are managed by Appwrite Auth.
 * This entity only tracks public metadata.
 *
 * @interface ProfileProps
 * @property {string} id - The Unique Identifier for the user (Source: Appwrite Auth).
 * @property {string} username - The user's display handle.
 * @property {string} [imageUrl] - Optional URL to the user's profile picture.
 * @property {string} [bio] - Optional biography text.
 */
export interface ProfileProps {
  id: string;
  username: string;
  imageUrl?: string;
  bio?: string;
}

/**
 * Domain Entity: Profile
 *
 * Represents the public-facing metadata and settings of a User.
 *
 * **Business Invariants:**
 * - **id**: Provided by Appwrite Auth.
 * - **username**: Must be a non-empty string, length 3-30 characters, alphanumeric with `.-_` separators.
 * - **bio**: Optional. If present, must not exceed 500 characters.
 * - **imageUrl**: Optional. If present, must be a valid URL string.
 *
 * @param {ProfileProps} props - The properties to initialize the profile with.
 * @param {ValidationMode} mode - The validation mode to use (STRICT or STRUCTURAL).
 */
export class Profile {
  /**
   * Unique identity (UUID or Appwrite ID) for the user (from Auth).
   * @returns {string}
   */
  public get id(): string {
    return this.props.id;
  }

  /**
   * The user's display handle.
   * @returns {string}
   */
  public get username(): string {
    return this.props.username;
  }

  /**
   * Optional URL to the profile picture.
   * @returns {string | undefined}
   */
  public get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  /**
   * Optional biography text.
   * @returns {string | undefined}
   */
  public get bio(): string | undefined {
    return this.props.bio;
  }

  private readonly props: ProfileProps;

  private constructor(props: ProfileProps, mode: ValidationMode) {
    this.props = props;
    this.validate(mode);
  }

  /**
   * Reconstitutes a Profile entity from persistence or external data source.
   *
   * @param {ProfileProps} props - The properties to restore.
   * @returns {Profile}
   * @throws {InvalidAttributeError} If validation of ProfileProps fails.
   */
  public static reconstitute(props: ProfileProps): Profile {
    return Profile._createWithMode(props, ValidationMode.STRUCTURAL);
  }

  /**
   * Factory method to create a new Profile domain entity.
   *
   * @param {ProfileProps} props - The initial properties.
   * @returns {Profile}
   * @throws {InvalidAttributeError} If validation of ProfileProps fails.
   */
  public static create(props: ProfileProps): Profile {
    return Profile._createWithMode(props, ValidationMode.STRICT);
  }

  private static _createWithMode(
    props: ProfileProps,
    mode: ValidationMode,
  ): Profile {
    const sanitizedProps = {
      ...props,
      username:
        typeof props.username === "string"
          ? props.username.trim()
          : props.username,
      bio: typeof props.bio === "string" ? props.bio.trim() : props.bio,
    };
    return new Profile(sanitizedProps, mode);
  }

  /**
   * Modifies editable properties of the Profile.
   *
   * @param {Partial<ProfileProps>} props - Partial properties to update.
   * @returns {Profile}
   * @throws {InvalidAttributeError} If props.id differs or validation fails.
   */
  public update(props: Partial<ProfileProps>): Profile {
    if (props.id !== undefined && props.id !== this.id) {
      throw new InvalidAttributeError("Cannot update entity ID");
    }

    const sanitizedUpdateProps = (
      Object.keys(props) as (keyof ProfileProps)[]
    ).reduce<Partial<ProfileProps>>((acc, key) => {
      if (key !== "id") {
        acc[key] = props[key];
      }
      return acc;
    }, {});

    return Profile._createWithMode(
      {
        ...this.toProps(),
        ...sanitizedUpdateProps,
      },
      ValidationMode.STRICT,
    );
  }

  /**
   * Compares this entity with another `Profile` based on domain identity.
   *
   * @param {unknown} other - The object to compare with this profile.
   * @returns {boolean} True if the other object is a Profile with the same ID, false otherwise.
   */
  public equals(other: unknown): boolean {
    if (!other || !(other instanceof Profile)) {
      return false;
    }
    return this.id === other.id;
  }

  private validate(mode: ValidationMode): void {
    // Structural integrity
    if (typeof this.id !== "string" || !this.id) {
      throw new InvalidAttributeError("Invalid id: Must be a non-empty string");
    }

    // Supports standard UUIDs or Appwrite-assigned IDs
    if (mode === ValidationMode.STRICT && !isValidIdentity(this.id)) {
      throw new InvalidAttributeError(
        "Invalid id: Must be a valid identity (UUID or Appwrite ID)",
      );
    }

    if (typeof this.username !== "string" || !this.username) {
      throw new InvalidAttributeError(
        "Invalid username: Must be a non-empty string",
      );
    }

    if (this.bio !== undefined && typeof this.bio !== "string") {
      throw new InvalidAttributeError("Invalid bio: Must be a string");
    }
    if (this.imageUrl !== undefined && typeof this.imageUrl !== "string") {
      throw new InvalidAttributeError("Invalid imageUrl: Must be a string");
    }

    if (this.imageUrl !== undefined) {
      let url: URL;
      try {
        url = new URL(this.imageUrl);
      } catch {
        throw new InvalidAttributeError(
          "Invalid imageUrl: Must be a valid URL",
        );
      }

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new InvalidAttributeError(
          "Invalid imageUrl: Must use http or https protocol",
        );
      }
    }

    // Business Rules (STRICT)
    if (mode === ValidationMode.STRICT) {
      if (this.username.length < 3 || this.username.length > 30) {
        throw new InvalidAttributeError(
          "Invalid username length: Must be 3-30 characters",
        );
      }
      const usernameRegex = /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/;
      if (!usernameRegex.test(this.username)) {
        throw new InvalidAttributeError("Invalid username format");
      }

      if (this.bio && this.bio.length > 500) {
        throw new InvalidAttributeError(
          "Invalid bio: Must be at most 500 characters",
        );
      }
    }
  }

  /**
   * Returns a snapshot of the internal properties.
   *
   * @returns {ProfileProps} a shallow copy of the Profile's properties.
   */
  public toProps(): ProfileProps {
    return {
      ...this.props,
    };
  }
}
