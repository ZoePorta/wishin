import type { TFunction } from "i18next";
import {
  OAuthCallbackError,
  type OAuthCallbackFailureReason,
} from "@wishin/domain";

const OAUTH_REASON_KEYS = {
  account_conflict: "auth.google.accountConflict",
  invalid_callback: "auth.google.incomplete",
  provider_error: "auth.google.failed",
} as const satisfies Record<OAuthCallbackFailureReason, string>;

/**
 * Picks the message to show for a failed Google sign-in.
 * OAuth callback errors are translated by failure reason; anything else is hidden behind the
 * fallback so raw SDK errors never reach the user.
 *
 * @param err - The error thrown by the sign-in flow.
 * @param t - Translation function for the current language.
 * @param fallbackErrorMessage - Message used for any error that isn't an OAuth callback error.
 * @returns The message to display.
 */
export function getOAuthErrorMessage(
  err: unknown,
  t: TFunction,
  fallbackErrorMessage: string,
): string {
  return err instanceof OAuthCallbackError
    ? t(OAUTH_REASON_KEYS[err.reason])
    : fallbackErrorMessage;
}

/**
 * Reads the machine-readable `type` an Appwrite error carries, without depending on the SDK.
 *
 * @param err - Any thrown value.
 * @returns The error type, or undefined if there is none.
 */
const getErrorType = (err: unknown): string | undefined => {
  if (typeof err !== "object" || err === null || !("type" in err)) {
    return undefined;
  }
  return typeof err.type === "string" ? err.type : undefined;
};

/**
 * Translates an email/password login or registration failure into a user-facing message.
 * Known failures get a specific explanation; anything else gets a generic message per mode,
 * so raw (English, technical) backend messages never reach the user.
 * Email and password failures share one message so it never reveals which of them was wrong.
 *
 * @param err - The error thrown by the login/registration flow.
 * @param t - Translation function for the current language.
 * @param mode - Which flow failed.
 * @returns The message to display.
 */
export function getAuthErrorMessage(
  err: unknown,
  t: TFunction,
  mode: "login" | "register",
): string {
  const type = getErrorType(err);
  const message = (
    err instanceof Error ? err.message : String(err)
  ).toLowerCase();

  if (type === "user_already_exists" || type === "user_email_already_exists") {
    return t("auth.errors.accountExists");
  }
  if (
    type === "user_invalid_credentials" ||
    type === "general_argument_invalid"
  ) {
    return t("auth.errors.invalidCredentials");
  }
  if (
    message.includes("network request failed") ||
    message.includes("failed to fetch")
  ) {
    return t("errors.network");
  }
  return mode === "login" ? t("auth.login.failed") : t("auth.register.failed");
}
