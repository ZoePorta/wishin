import { describe, it, expect } from "vitest";
import { OAuthCallbackError } from "@wishin/domain";
import { createI18n } from "../i18n/create-i18n";
import { getAuthErrorMessage, getOAuthErrorMessage } from "./auth-errors";

/** Mimics the shape of an AppwriteException without depending on the SDK. */
const appwriteError = (type: string, message = "raw sdk message") =>
  Object.assign(new Error(message), { type });

describe("getOAuthErrorMessage", () => {
  const { t } = createI18n("es");
  const fallback = "fallback";

  it("should translate OAuth callback errors by reason", () => {
    expect(
      getOAuthErrorMessage(
        new OAuthCallbackError("account_conflict", "raw"),
        t,
        fallback,
      ),
    ).toBe(t("auth.google.accountConflict"));
    expect(
      getOAuthErrorMessage(
        new OAuthCallbackError("invalid_callback", "raw"),
        t,
        fallback,
      ),
    ).toBe(t("auth.google.incomplete"));
    expect(
      getOAuthErrorMessage(
        new OAuthCallbackError("provider_error", "raw"),
        t,
        fallback,
      ),
    ).toBe(t("auth.google.failed"));
  });

  it("should hide raw errors behind the fallback message", () => {
    expect(
      getOAuthErrorMessage(new Error("AppwriteException: 500"), t, fallback),
    ).toBe(fallback);
    expect(getOAuthErrorMessage("boom", t, fallback)).toBe(fallback);
  });
});

describe("getAuthErrorMessage", () => {
  const { t } = createI18n("en");

  it("should explain that the account already exists", () => {
    expect(
      getAuthErrorMessage(appwriteError("user_already_exists"), t, "register"),
    ).toBe(t("auth.errors.accountExists"));
    expect(
      getAuthErrorMessage(
        appwriteError("user_email_already_exists"),
        t,
        "register",
      ),
    ).toBe(t("auth.errors.accountExists"));
  });

  it.each(["login", "register"] as const)(
    "should not reveal whether the email or the password failed (%s)",
    (mode) => {
      const failures = [
        appwriteError(
          "general_argument_invalid",
          "Invalid `password` param: Password must be between 8 and 256 characters long.",
        ),
        appwriteError(
          "general_argument_invalid",
          "Invalid `email` param: Value must be a valid email address",
        ),
        appwriteError("user_invalid_credentials"),
      ];
      for (const failure of failures) {
        expect(getAuthErrorMessage(failure, t, mode)).toBe(
          t("auth.errors.invalidCredentials"),
        );
      }
    },
  );

  it("should explain connection problems", () => {
    expect(
      getAuthErrorMessage(new Error("Network request failed"), t, "login"),
    ).toBe(t("errors.network"));
  });

  it("should fall back to a generic message per mode", () => {
    expect(getAuthErrorMessage("boom", t, "login")).toBe(
      t("auth.login.failed"),
    );
    expect(getAuthErrorMessage("boom", t, "register")).toBe(
      t("auth.register.failed"),
    );
  });
});
