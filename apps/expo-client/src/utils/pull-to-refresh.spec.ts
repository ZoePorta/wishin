import { describe, it, expect } from "vitest";
import {
  PULL_MAX_DISTANCE,
  PULL_THRESHOLD,
  getPullDistance,
  getPullProgress,
  shouldTriggerRefresh,
} from "./pull-to-refresh";

describe("getPullDistance", () => {
  it("returns 0 when the finger moves up or not at all", () => {
    expect(getPullDistance(0)).toBe(0);
    expect(getPullDistance(-50)).toBe(0);
  });

  it("applies resistance so the indicator moves slower than the finger", () => {
    const distance = getPullDistance(100);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(100);
  });

  it("never exceeds the maximum distance", () => {
    expect(getPullDistance(10_000)).toBe(PULL_MAX_DISTANCE);
  });
});

describe("getPullProgress", () => {
  it("is 0 at rest and 1 at (or past) the threshold", () => {
    expect(getPullProgress(0)).toBe(0);
    expect(getPullProgress(PULL_THRESHOLD / 2)).toBeCloseTo(0.5);
    expect(getPullProgress(PULL_THRESHOLD)).toBe(1);
    expect(getPullProgress(PULL_MAX_DISTANCE)).toBe(1);
  });
});

describe("shouldTriggerRefresh", () => {
  it("only triggers once the threshold is reached", () => {
    expect(shouldTriggerRefresh(PULL_THRESHOLD - 1)).toBe(false);
    expect(shouldTriggerRefresh(PULL_THRESHOLD)).toBe(true);
  });
});
