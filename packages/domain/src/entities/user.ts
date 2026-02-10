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
 * Properties for a User.
 * Data structure used for transfer and persistence; does not enforce rules itself.
 *
 * @interface UserProps
 * @property id - Unique identifier (UUID v4).
 * @property email - User's unique email address.
 * @property username - Display name/handle.
 * @property imageUrl - Optional URL to profile picture.
 * @property bio - Optional user biography.
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
 * Represents a registered member of the platform.
 * Serves as the root for user-specific data and encapsulates profile information.
 *
 * **Design Principles:**
 * - **Immutability:** All state changes return a new instance.
 * - **Identity:** Defined by `id` (UUID v4).
 * - **Validation:** Supports `STRICT` (creation/update) and `STRUCTURAL` (reconstitution) modes.
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
   * Reconstitutes a User from persistence.
   * Enforces **STRUCTURAL** validation only, bypassing strict business rules to allow loading legacy data.
   *
   * **Invariants Validated (Structural):**
   * - `id`: Must be a valid UUID v4.
   * - `email`, `username`: Must be non-empty strings.
   *
   * @param props - The properties to restore from persistence.
   * @returns A `User` instance restored from data.
   * @throws {InvalidAttributeError} If structural integrity is compromised (e.g., invalid UUID).
   */
  public static reconstitute(props: UserProps): User {
    return User._createWithMode(props, ValidationMode.STRUCTURAL);
  }

  /**
   * Factory method to create a new User domain entity.
   * Enforces **STRICT** validation mode to ensure all business rules are met.
   *
   * **Invariants Validated:**
   * - `id`: Must be a valid UUID v4.
   * - `email`: Must be a non-empty string in a valid email format.
   * - `username`: Must be 3-30 characters, alphanumeric + `.-_`.
   * - `bio`: Must not exceed 500 characters (if present).
   * - `imageUrl`: Must be a valid URL (if present).
   *
   * @param props - The initial properties for the user.
   * @returns A new valid `User` instance.
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
   * Returns a new `User` instance (Immutable).
   *
   * **Side Effects:**
   * - Trims `username` and `bio` strings.
   *
   * **Restrictions:**
   * - Cannot modify `id` or `email` (Identity/Login fields).
   *
   * **Invariants Validated:**
   * - All **STRICT** business rules are enforced on updated fields.
   *
   * @param props - Partial properties to update.
   * @returns A new `User` instance with updated state.
   * @throws {InvalidAttributeError} If validation fails or attempting to update restricted fields.
   */
  public update(props: Partial<UserProps>): User {
    // Immutable properties check
    if (props.id !== undefined && props.id !== this.id) {
      throw new InvalidAttributeError("Cannot update entity ID");
    }
    if (props.email !== undefined && props.email !== this.email) {
      throw new InvalidAttributeError("Cannot update email");
    }

    const currentProps = this.toProps();
    const sanitizedUpdateProps = Object.fromEntries(
      Object.entries(props).filter(([, value]) => typeof value !== "undefined"),
    ) as Partial<UserProps>;

    return User._createWithMode(
      {
        ...currentProps,
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
          new URL(this.imageUrl);
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
