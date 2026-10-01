/**
 * Apple platforms relevant to web install flows.
 * - `ios`: iPhone, iPod and iPad (including iPadOS, which reports a Mac UA).
 * - `macos`: desktop Mac.
 */
export type ApplePlatform = "ios" | "macos";

/**
 * Minimal subset of `Navigator` needed for platform detection.
 */
export interface PlatformNavigator {
  /** The browser user agent string. */
  userAgent: string;
  /** Number of simultaneous touch points supported by the device. */
  maxTouchPoints: number;
}

/**
 * Detects whether the browser runs on an Apple device.
 *
 * iPadOS 13+ Safari reports a desktop "Macintosh" user agent, so a Mac UA
 * with multi-touch support is treated as iOS.
 *
 * @param nav - Navigator-like object (defaults are not assumed; pass `window.navigator`).
 * @returns {ApplePlatform | null} The Apple platform, or `null` for non-Apple devices.
 */
export function detectApplePlatform(
  nav: PlatformNavigator,
): ApplePlatform | null {
  if (/iPad|iPhone|iPod/.test(nav.userAgent)) return "ios";
  if (nav.userAgent.includes("Macintosh")) {
    return nav.maxTouchPoints > 1 ? "ios" : "macos";
  }
  return null;
}

/**
 * Checks whether the web app is already running as an installed app
 * (home screen shortcut / PWA) rather than in a browser tab.
 *
 * @param nav - Navigator-like object; iOS Safari exposes the non-standard `standalone` flag.
 * @param matchesMedia - Media query matcher, e.g. `(q) => window.matchMedia(q).matches`.
 * @returns {boolean} `true` when running in standalone display mode.
 */
export function isStandaloneDisplay(
  nav: { standalone?: boolean },
  matchesMedia: (query: string) => boolean,
): boolean {
  return nav.standalone === true || matchesMedia("(display-mode: standalone)");
}
