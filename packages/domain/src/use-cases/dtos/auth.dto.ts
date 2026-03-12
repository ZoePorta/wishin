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
 * Base properties for any authentication result.
 */
interface BaseAuthResult {
  /** The unique identifier of the user. */
  userId: string;
  /** Whether a new user account was created (true) or an existing one was promoted/used (false). Can be undefined if the status is unknown (e.g., OAuth). */
  isNewUser?: boolean;
}

/**
 * Result of an authentication operation for a registered/authenticated user.
 */
export interface AuthenticatedAuthResult extends BaseAuthResult {
  type: "authenticated";
  /** The user's email address. */
  email: string;
}

/**
 * Result of an authentication operation for an anonymous user.
 */
export interface AnonymousAuthResult extends BaseAuthResult {
  type: "anonymous";
  /** Anonymous sessions do not have an email. */
  email?: undefined;
}

/**
 * Result of an authentication operation.
 * Discriminated union between authenticated and anonymous results.
 */
export type AuthResult = AuthenticatedAuthResult | AnonymousAuthResult;
