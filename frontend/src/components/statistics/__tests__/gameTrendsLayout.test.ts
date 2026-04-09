import { describe, expect, it } from "vitest";
import {
  getGameTrendsTickStep,
  getBreakMarkerFlags,
  prependChartOrigin,
} from "../gameTrendsLayout";

describe("gameTrendsLayout", () => {
  it("keeps short timelines on single-step ticks", () => {
    expect(getGameTrendsTickStep(12)).toBe(1);
  });

  it("increases tick thinning once timelines get denser", () => {
    expect(getGameTrendsTickStep(18)).toBe(2);
  });

  it("increases tick thinning as point counts grow", () => {
    expect(getGameTrendsTickStep(25)).toBe(3);
    expect(getGameTrendsTickStep(40)).toBe(4);
    expect(getGameTrendsTickStep(60)).toBe(5);
  });

  it("can prepend a zero origin to cumulative series", () => {
    expect(prependChartOrigin([1, 3, 4])).toEqual([0, 1, 3, 4]);
    expect(prependChartOrigin([2, 5], 7)).toEqual([7, 2, 5]);
  });

  it("flags breaks on the series that earned them", () => {
    expect(
      getBreakMarkerFlags([
        { starting_on_offense: true, won: true },
        { starting_on_offense: false, won: true },
        { starting_on_offense: true, won: false },
        { starting_on_offense: false, won: false },
      ])
    ).toEqual({
      ourBreaks: [false, false, true, false, false],
      opponentBreaks: [false, false, false, true, false],
    });
  });
});
