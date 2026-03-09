/**
 * Input for the RegisterUser use case.
 */
export interface RegisterUserInput {
  email: string;
  password: string;
  username: string;
}

/**
 * Input for the LoginUser use case.
 */
export interface LoginUserInput {
  email: string;
  password: string;
}

/**
 * Represents the result of an authentication operation.
 */
export interface AuthResult {
  userId: string;
  email: string;
}
