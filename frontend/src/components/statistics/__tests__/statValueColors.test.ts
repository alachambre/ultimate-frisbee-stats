import { createTheme } from "@mui/material/styles";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_STAT_VALUE_STOPS,
  TURNOVER_RATE_VALUE_STOPS,
  getValueGradientColor,
  getValueGradientTrackColor,
} from "../statValueColors";

const theme = createTheme({
  palette: {
    text: { primary: "#222222" },
  },
  colors: {
    offense: { main: "#1e3a8a", light: "#3b82f6", dark: "#1e40af" },
    defense: { main: "#1e3a8a", light: "#3b82f6", dark: "#1e40af" },
    men: { main: "#1e3a8a" },
    women: { main: "#38bdf8" },
    pull: { main: "#2d7a3e" },
    performance: {
      veryLow: "#ff0000",
      low: "#ff8000",
      medium: "#ffff00",
      high: "#80ff00",
      veryHigh: "#00ff00",
    },
  },
});

describe("statValueColors", () => {
  it("maps the default 5-stop gradient across the shared scale", () => {
    expect(getValueGradientColor(theme, 0, true, DEFAULT_STAT_VALUE_STOPS)).toBe("#ff0000");
    expect(getValueGradientColor(theme, 0.25, true, DEFAULT_STAT_VALUE_STOPS)).toBe(
      "rgb(255, 128, 0)"
    );
    expect(getValueGradientColor(theme, 0.5, true, DEFAULT_STAT_VALUE_STOPS)).toBe(
      "rgb(255, 255, 0)"
    );
    expect(getValueGradientColor(theme, 0.75, true, DEFAULT_STAT_VALUE_STOPS)).toBe(
      "rgb(128, 255, 0)"
    );
    expect(getValueGradientColor(theme, 1, true, DEFAULT_STAT_VALUE_STOPS)).toBe("rgb(0, 255, 0)");
  });

  it("supports duplicated stops for aggressive early green ramps", () => {
    expect(getValueGradientColor(theme, 0, true, TURNOVER_RATE_VALUE_STOPS)).toBe("#ff0000");
    expect(getValueGradientColor(theme, 0.05, true, TURNOVER_RATE_VALUE_STOPS)).toBe(
      "rgb(255, 170, 0)"
    );
    expect(getValueGradientColor(theme, 0.64, true, TURNOVER_RATE_VALUE_STOPS)).toBe(
      "rgb(77, 255, 0)"
    );
  });

  it("returns muted colors when there is no tracked data", () => {
    expect(getValueGradientColor(theme, 0.8, false)).toBe("rgba(34, 34, 34, 0.28)");
    expect(getValueGradientTrackColor(theme, 0.8, false)).toBe("rgba(34, 34, 34, 0.08)");
  });
});
