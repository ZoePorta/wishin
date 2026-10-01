import { describe, it, expect } from "vitest";
import { detectApplePlatform, isStandaloneDisplay } from "./platform";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD_LEGACY_UA =
  "Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
const WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

describe("detectApplePlatform", () => {
  it("detects iPhone as ios", () => {
    expect(
      detectApplePlatform({ userAgent: IPHONE_UA, maxTouchPoints: 5 }),
    ).toBe("ios");
  });

  it("detects legacy iPad user agent as ios", () => {
    expect(
      detectApplePlatform({ userAgent: IPAD_LEGACY_UA, maxTouchPoints: 5 }),
    ).toBe("ios");
  });

  it("detects iPadOS (desktop-class UA with touch) as ios", () => {
    expect(detectApplePlatform({ userAgent: MAC_UA, maxTouchPoints: 5 })).toBe(
      "ios",
    );
  });

  it("detects a Mac without touch as macos", () => {
    expect(detectApplePlatform({ userAgent: MAC_UA, maxTouchPoints: 0 })).toBe(
      "macos",
    );
  });

  it("returns null for Android", () => {
    expect(
      detectApplePlatform({ userAgent: ANDROID_UA, maxTouchPoints: 5 }),
    ).toBeNull();
  });

  it("returns null for Windows", () => {
    expect(
      detectApplePlatform({ userAgent: WINDOWS_UA, maxTouchPoints: 0 }),
    ).toBeNull();
  });
});

describe("isStandaloneDisplay", () => {
  it("is true when iOS navigator.standalone is set", () => {
    expect(isStandaloneDisplay({ standalone: true }, () => false)).toBe(true);
  });

  it("is true when display-mode standalone matches", () => {
    expect(isStandaloneDisplay({}, () => true)).toBe(true);
  });

  it("is false in a regular browser tab", () => {
    expect(isStandaloneDisplay({ standalone: false }, () => false)).toBe(false);
  });
});
