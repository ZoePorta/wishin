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
 * @public
 * @property {string} type - Discrimination field, always "authenticated".
 * @property {string} email - The user's registered email address.
 * @property {string} userId - The unique identifier of the user.
 * @property {boolean} [isNewUser] - Whether a new user account was created.
 * @returns {AuthenticatedAuthResult} A result object representing a successful authenticated session.
 * @throws None
 * @remarks This type is returned when a user logs in or registers with an email/password or OAuth.
 */
export interface AuthenticatedAuthResult extends BaseAuthResult {
  type: "authenticated";
  /** The user's email address. */
  email: string;
}

/**
 * Result of an authentication operation for an anonymous user.
 * @public
 * @property {string} type - Discrimination field, always "anonymous".
 * @property {undefined} email - Anonymous sessions do not have an email.
 * @property {string} userId - The unique identifier of the user.
 * @property {boolean} [isNewUser] - Whether a new user account was created.
 * @returns {AnonymousAuthResult} A result object representing a guest session.
 * @throws None
 * @remarks Anonymous sessions have restricted capabilities compared to authenticated ones.
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
