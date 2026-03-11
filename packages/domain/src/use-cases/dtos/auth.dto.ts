/**
 * Input for the RegisterUser use case.
 * @property {string} email - The user's email address.
 * @property {string} password - The user's plain-text password.
 * @property {string} username - The user's chosen display name.
 * @returns N/A
 * @throws None
 */
export interface RegisterUserInput {
  email: string;
  password: string;
  username: string;
}

/**
 * Input for the LoginUser use case.
 * @property {string} email - The user's email address.
 * @property {string} password - The user's plain-text password.
 * @returns N/A
 * @throws None
 */
export interface LoginUserInput {
  email: string;
  password: string;
}

/**
 * Result of an authentication operation.
 * @property {string} userId - The unique identifier of the user.
 * @property {string} email - The user's email address.
 * @property {boolean | undefined} isNewUser - Whether a new user account was created (true) or an existing one was promoted/used (false). Can be undefined if the status is unknown (e.g., OAuth).
 * @returns {AuthResult} The result of the authentication operation.
 * @throws None
 */
export interface AuthResult {
  /** The unique identifier of the user. */
  userId: string;
  /** The user's email address. */
  email: string;
  /** Whether a new user account was created (true) or an existing one was promoted/used (false). Can be undefined if the status is unknown (e.g., OAuth). */
  isNewUser?: boolean;
}
