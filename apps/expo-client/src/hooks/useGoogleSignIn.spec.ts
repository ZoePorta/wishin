import { describe, it, expect } from "vitest";
import { OAuthCallbackError } from "@wishin/domain";
import { getGoogleSignInErrorMessage } from "./useGoogleSignIn";

describe("getGoogleSignInErrorMessage", () => {
  const fallback = "Google sign-in failed. Please try again!";

  it("should show the user-facing message of an OAuth callback error", () => {
    const error = new OAuthCallbackError(
      "account_conflict",
      "Sign out of Wishin in your browser and try again.",
    );

    expect(getGoogleSignInErrorMessage(error, fallback)).toBe(
      "Sign out of Wishin in your browser and try again.",
    );
  });

  it("should hide raw errors behind the fallback message", () => {
    expect(
      getGoogleSignInErrorMessage(
        new Error("AppwriteException: 500"),
        fallback,
      ),
    ).toBe(fallback);
    expect(getGoogleSignInErrorMessage("boom", fallback)).toBe(fallback);
  });
});
