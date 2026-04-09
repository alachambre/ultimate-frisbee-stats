import { describe, expect, it } from "vitest";
import {
  getGameTrendsChartWidth,
  getGameTrendsTickStep,
  shouldShowGameTrendMark,
  usesScrollableGameTrendsLayout,
} from "../gameTrendsLayout";

describe("gameTrendsLayout", () => {
  it("keeps short timelines in the normal layout", () => {
    expect(usesScrollableGameTrendsLayout(12)).toBe(false);
    expect(getGameTrendsChartWidth(12)).toBeNull();
    expect(getGameTrendsTickStep(12)).toBe(1);
  });

  it("switches dense timelines to a scrollable wider chart", () => {
    expect(usesScrollableGameTrendsLayout(18)).toBe(true);
    expect(getGameTrendsChartWidth(18)).toBe(648);
    expect(getGameTrendsTickStep(18)).toBe(2);
  });

  it("reduces visible marks for dense timelines while keeping endpoints", () => {
    expect(shouldShowGameTrendMark(0, 25)).toBe(true);
    expect(shouldShowGameTrendMark(24, 25)).toBe(true);
    expect(shouldShowGameTrendMark(3, 25)).toBe(true);
    expect(shouldShowGameTrendMark(1, 25)).toBe(false);
  });

  it("keeps marks visible for shorter timelines", () => {
    expect(shouldShowGameTrendMark(1, 8)).toBe(true);
    expect(shouldShowGameTrendMark(6, 8)).toBe(true);
  });
});
