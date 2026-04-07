import { createTheme } from "@mui/material/styles";
import { describe, expect, it } from "vitest";
import {
  getValueGradientColor,
  getValueGradientTrackColor,
  HOLD_RATE_VALUE_MIDPOINT,
} from "../statValueColors";

const theme = createTheme({
  palette: {
    error: { main: "#ff0000" },
    warning: { main: "#ffff00" },
    success: { main: "#00ff00" },
    text: { primary: "#222222" },
  },
});

describe("statValueColors", () => {
  it("maps low, medium, and high values across the shared gradient", () => {
    expect(getValueGradientColor(theme, 0)).toBe("rgb(255, 0, 0)");
    expect(getValueGradientColor(theme, 0.5)).toBe("rgb(255, 255, 0)");
    expect(getValueGradientColor(theme, 1)).toBe("rgb(0, 255, 0)");
  });

  it("returns muted colors when there is no tracked data", () => {
    expect(getValueGradientColor(theme, 0.8, false)).toBe("rgba(34, 34, 34, 0.28)");
    expect(getValueGradientTrackColor(theme, 0.8, false)).toBe("rgba(34, 34, 34, 0.08)");
  });

  it("supports custom midpoints per metric", () => {
    expect(getValueGradientColor(theme, HOLD_RATE_VALUE_MIDPOINT, true, HOLD_RATE_VALUE_MIDPOINT)).toBe(
      "rgb(255, 255, 0)"
    );
    expect(getValueGradientColor(theme, 0.35, true, HOLD_RATE_VALUE_MIDPOINT)).toBe(
      "rgb(255, 128, 0)"
    );
  });
});
