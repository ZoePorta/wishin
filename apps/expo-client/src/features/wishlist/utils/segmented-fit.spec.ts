import { describe, it, expect } from "vitest";
import { SEGMENT_OVERHEAD, segmentedButtonsFit } from "./segmented-fit";

describe("segmentedButtonsFit", () => {
  it("fits when every segment can hold the widest label", () => {
    const widest = 60;
    const needed = 3 * (widest + SEGMENT_OVERHEAD);
    expect(segmentedButtonsFit(needed, [40, widest, 50])).toBe(true);
  });

  it("does not fit when the widest label would be truncated", () => {
    const widest = 60;
    const needed = 3 * (widest + SEGMENT_OVERHEAD);
    expect(segmentedButtonsFit(needed - 1, [40, widest, 50])).toBe(false);
  });

  it("uses the widest label because segments share the width equally", () => {
    // Total label width is small, but one label is long.
    expect(segmentedButtonsFit(300, [10, 10, 150])).toBe(false);
  });

  it("assumes it fits while there is nothing to measure", () => {
    expect(segmentedButtonsFit(0, [10, 10])).toBe(true);
    expect(segmentedButtonsFit(300, [])).toBe(true);
  });
});
