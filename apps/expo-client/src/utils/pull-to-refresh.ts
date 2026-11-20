/**
 * Pure gesture math for the web pull-to-refresh (see `PullToRefresh`).
 * Kept framework-free so it can be unit tested.
 */

/** Indicator travel (px) needed to trigger a refresh on release. */
export const PULL_THRESHOLD = 72;

/** Maximum indicator travel (px), however far the finger moves. */
export const PULL_MAX_DISTANCE = 120;

/** Fraction of the finger movement the indicator follows (rubber-band feel). */
const PULL_RESISTANCE = 0.5;

/**
 * Converts the raw vertical finger movement into indicator travel.
 *
 * @param deltaY - Finger movement in px since the gesture started (positive = down).
 * @returns The indicator travel in px, between 0 and {@link PULL_MAX_DISTANCE}.
 */
export function getPullDistance(deltaY: number): number {
  if (deltaY <= 0) return 0;
  return Math.min(deltaY * PULL_RESISTANCE, PULL_MAX_DISTANCE);
}

/**
 * How close the current pull is to triggering a refresh.
 *
 * @param distance - Indicator travel in px.
 * @returns A value in [0, 1]; 1 means releasing now will refresh.
 */
export function getPullProgress(distance: number): number {
  return Math.min(Math.max(distance / PULL_THRESHOLD, 0), 1);
}

/**
 * Whether releasing the gesture at the given travel should start a refresh.
 *
 * @param distance - Indicator travel in px.
 * @returns `true` when the threshold has been reached.
 */
export function shouldTriggerRefresh(distance: number): boolean {
  return distance >= PULL_THRESHOLD;
}
