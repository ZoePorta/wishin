import { InvalidAttributeError } from "../errors/domain-errors";
import { ValidationMode as SharedValidationMode } from "../common/validation-mode";
import { isValidUUID } from "../common/validation-utils";

/**
 * Extended ValidationMode for User.
 */
export const ValidationMode = {
  ...SharedValidationMode,
} as const;

export type ValidationMode =
  (typeof ValidationMode)[keyof typeof ValidationMode];

/**
 * Public interface defining the shape of User data.
 * Used for data transfer, persistence, and as an input for Factory/Reconstitution methods.
 *
 * @interface UserProps
 * @property {string} id - The Unique Identifier for the user. Must be a valid UUID v4.
 * @property {string} email - The user's email address. Must be a valid email format.
 * @property {string} username - The user's display handle. Must be 3-30 characters, alphanumeric with optional `.-_`.
 * @property {string} [imageUrl] - Optional URL to the user's profile picture. Must be a valid URL string if present.
 * @property {string} [bio] - Optional biography text. Must be at most 500 characters if present.
 */
export interface UserProps {
  id: string;
  email: string;
  username: string;
  imageUrl?: string;
  bio?: string;
}

/**
 * Domain Entity: User
 *
 * Represents a registered member of the platform and root specific data context.
 *
 * **Business Invariants:**
 * - **id**: Must be a valid UUID v4.
 * - **email**: Must be a non-empty string in a valid email format.
 * - **username**: Must be a non-empty string, length 3-30 characters, strictly alphanumeric or `.-_`.
 * - **bio**: Optional. If present, must not exceed 500 characters.
 * - **imageUrl**: Optional. If present, must be a valid URL string.
 *
 * **Design Principles:**
 * - **Immutability**: All state changes return a new instance.
 * - **Identity**: Defined by `id`.
 * - **Validation**: Enforces strict business rules on creation/update, structural integrity on reconstitution.
 *
 * @param {UserProps} props - The properties to initialize the user with (internal constructor).
 * @param {ValidationMode} mode - The validation mode to use (STRICT or STRUCTURAL).
 * @throws {InvalidAttributeError} If validation fails based on the provided mode.
 */
export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly username: string;
  public readonly imageUrl?: string;
  public readonly bio?: string;

  private constructor(props: UserProps, mode: ValidationMode) {
    this.id = props.id;
    this.email = props.email;
    this.username = props.username;
    this.imageUrl = props.imageUrl;
    this.bio = props.bio;

    this.validate(mode);
  }

  /**
   * Reconstitutes a User entity from persistence or external data source.
   *
   * **Validation Mode:** STRUCTURAL
   * - Enforces structural integrity only (types, existence).
   * - Bypasses strict business rules (e.g., legacy username formats) to ensure data loadability.
   *
   * **Invariants (Structural):**
   * - `id`: Must be a valid UUID v4.
   * - `email`, `username`: Must be non-empty strings.
   *
   * @param {UserProps} props - The properties to restore the user from.
   * @returns {User} A `User` instance restored from the provided data.
   * @throws {InvalidAttributeError} If structural integrity constraints are violated (e.g. invalid UUID).
   */
  public static reconstitute(props: UserProps): User {
    return User._createWithMode(props, ValidationMode.STRUCTURAL);
  }

  /**
   * Factory method to create a new User domain entity.
   *
   * **Validation Mode:** STRICT
   * - Enforces all business invariants and rules.
   *
   * **Invariants:**
   * - `id`: Must be a valid UUID v4.
   * - `email`: Must be a non-empty string in a valid email format.
   * - `username`: Must be 3-30 characters, alphanumeric + `.-_`.
   * - `bio`: Must not exceed 500 characters (if present).
   * - `imageUrl`: Must be a valid URL (if present).
   *
   * @param {UserProps} props - The initial properties for the user.
   * @returns {User} A new valid `User` instance.
   * @throws {InvalidAttributeError} If any structural or business validation rule is violated.
   */
  public static create(props: UserProps): User {
    return User._createWithMode(props, ValidationMode.STRICT);
  }

  private static _createWithMode(props: UserProps, mode: ValidationMode): User {
    const sanitizedProps = {
      ...props,
      email: typeof props.email === "string" ? props.email.trim() : props.email,
      username:
        typeof props.username === "string"
          ? props.username.trim()
          : props.username,
      bio: typeof props.bio === "string" ? props.bio.trim() : props.bio,
    };
    return new User(sanitizedProps, mode);
  }

  /**
   * Modifies editable properties of the User.
   *
   * **Validation Mode:** STRICT
   * - Enforces all business invariants on the updated fields.
   *
   * **Constraints:**
   * - **Immutability**: Returns a new `User` instance; original is unchanged.
   * - **Identity**: Cannot modify `id` or `email` (Identity/Login fields).
   * - **Sanitization**: Trims `username` and `bio` strings.
   *
   * @param {Partial<UserProps>} props - Partial properties to update.
   * @returns {User} A new `User` instance with updated state.
   * @throws {InvalidAttributeError} If validation fails or attempting to update restricted fields (id, email).
   */
  public update(props: Partial<UserProps>): User {
    // Immutable properties check
    if (props.id !== undefined && props.id !== this.id) {
      throw new InvalidAttributeError("Cannot update entity ID");
    }
    if (props.email !== undefined && props.email !== this.email) {
      throw new InvalidAttributeError("Cannot update email");
    }

    const sanitizedUpdateProps = Object.fromEntries(
      Object.entries(props).filter(([, value]) => typeof value !== "undefined"),
    ) as Partial<UserProps>;

    return User._createWithMode(
      {
        ...this.toProps(),
        ...sanitizedUpdateProps,
      },
      ValidationMode.STRICT, // Updates always enforce strict rules
    );
  }

  /**
   * Compares this entity with another `User` based on domain identity.
   *
   * @param other - The other `User` entity to compare.
   * @returns `true` if `id`s match, `false` otherwise.
   */
  public equals(other: User): boolean {
    return this.id === other.id;
  }

  private validate(mode: ValidationMode): void {
    // --- STRUCTURAL INTEGRITY (Always Enforced) ---
    if (!isValidUUID(this.id)) {
      throw new InvalidAttributeError("Invalid id: Must be a valid UUID v4");
    }
    if (typeof this.email !== "string" || !this.email) {
      throw new InvalidAttributeError(
        "Invalid email: Must be a non-empty string",
      );
    }
    if (typeof this.username !== "string" || !this.username) {
      throw new InvalidAttributeError(
        "Invalid username: Must be a non-empty string",
      );
    }
    // Structural type checks for optional fields
    if (this.bio !== undefined && typeof this.bio !== "string") {
      throw new InvalidAttributeError("Invalid bio: Must be a string");
    }
    if (this.imageUrl !== undefined && typeof this.imageUrl !== "string") {
      throw new InvalidAttributeError("Invalid imageUrl: Must be a string");
    }

    // --- BUSINESS RULES (STRICT) ---
    if (mode === ValidationMode.STRICT) {
      // Email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        throw new InvalidAttributeError("Invalid email format");
      }

      // Username rules: 3-30 chars, alphanumeric + .-_
      if (this.username.length < 3 || this.username.length > 30) {
        throw new InvalidAttributeError(
          "Invalid username length: Must be 3-30 characters",
        );
      }
      const usernameRegex = /^[a-zA-Z0-9._-]+$/;
      if (!usernameRegex.test(this.username)) {
        throw new InvalidAttributeError(
          "Invalid username format: Alphanumeric and .-_ only",
        );
      }

      // Bio max length
      if (this.bio && this.bio.length > 500) {
        throw new InvalidAttributeError(
          "Invalid bio: Must be at most 500 characters",
        );
      }

      // Image URL validity
      if (this.imageUrl) {
        try {
          const url = new URL(this.imageUrl);
          if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new InvalidAttributeError(
              "Invalid imageUrl: Must use http or https protocol",
            );
          }
        } catch {
          throw new InvalidAttributeError(
            "Invalid imageUrl: Must be a valid URL",
          );
        }
      }
    }
  }

  private toProps(): UserProps {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      imageUrl: this.imageUrl,
      bio: this.bio,
    };
  }
}
