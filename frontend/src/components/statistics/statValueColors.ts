import { alpha, type Theme } from "@mui/material/styles";

export type ValueGradientStops = readonly [number, number, number, number, number];

export const DEFAULT_STAT_VALUE_STOPS: ValueGradientStops = [0, 0.25, 0.5, 0.75, 1];
export const HOLD_RATE_VALUE_STOPS: ValueGradientStops = [0, 0.5, 0.7, 0.85, 1];
export const TURNOVER_RATE_VALUE_STOPS: ValueGradientStops = [0, 0, 0.15, 0.4, 1];
export const BREAK_RATE_VALUE_STOPS: ValueGradientStops = [0, 0, 0.1, 0.2, 1];
export const CLEAN_BREAK_RATE_VALUE_STOPS: ValueGradientStops = [0, 0, 0.1, 0.2, 1];

const PERFORMANCE_COLOR_KEYS = [
  "veryLow",
  "low",
  "medium",
  "high",
  "veryHigh",
] as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function parseColor(color: string): [number, number, number] {
  const normalized = color.trim();

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const expandedHex =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => `${char}${char}`)
            .join("")
        : hex;

    if (expandedHex.length === 6) {
      return [
        Number.parseInt(expandedHex.slice(0, 2), 16),
        Number.parseInt(expandedHex.slice(2, 4), 16),
        Number.parseInt(expandedHex.slice(4, 6), 16),
      ];
    }
  }

  const rgbMatch = normalized.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+\s*)?\)$/i
  );
  if (rgbMatch) {
    return [
      Number.parseInt(rgbMatch[1], 10),
      Number.parseInt(rgbMatch[2], 10),
      Number.parseInt(rgbMatch[3], 10),
    ];
  }

  throw new Error(`Unsupported color format: ${color}`);
}

function mixChannel(start: number, end: number, ratio: number): number {
  return Math.round(start + (end - start) * ratio);
}

function mixColors(startColor: string, endColor: string, ratio: number): string {
  const [startRed, startGreen, startBlue] = parseColor(startColor);
  const [endRed, endGreen, endBlue] = parseColor(endColor);

  return `rgb(${mixChannel(startRed, endRed, ratio)}, ${mixChannel(startGreen, endGreen, ratio)}, ${mixChannel(startBlue, endBlue, ratio)})`;
}

function getPerformanceColors(theme: Theme): readonly [string, string, string, string, string] {
  return PERFORMANCE_COLOR_KEYS.map(
    (key) => theme.colors.performance[key]
  ) as unknown as readonly [string, string, string, string, string];
}

export function getValueGradientColor(
  theme: Theme,
  percentage: number,
  hasData = true,
  stops: ValueGradientStops = DEFAULT_STAT_VALUE_STOPS
): string {
  if (!hasData) {
    return alpha(theme.palette.text.primary, 0.28);
  }

  const clampedPercentage = clamp01(percentage);
  const clampedStops = stops.map(clamp01) as unknown as ValueGradientStops;
  const colors = getPerformanceColors(theme);

  if (clampedPercentage <= clampedStops[0]) {
    return colors[0];
  }

  for (let index = 0; index < clampedStops.length - 1; index += 1) {
    const startStop = clampedStops[index];
    const endStop = clampedStops[index + 1];

    if (clampedPercentage <= endStop) {
      if (endStop === startStop) {
        return colors[index + 1];
      }

      return mixColors(
        colors[index],
        colors[index + 1],
        (clampedPercentage - startStop) / (endStop - startStop)
      );
    }
  }

  return colors[colors.length - 1];
}

export function getValueGradientTrackColor(
  theme: Theme,
  percentage: number,
  hasData = true,
  stops: ValueGradientStops = DEFAULT_STAT_VALUE_STOPS
): string {
  if (!hasData) {
    return alpha(theme.palette.text.primary, 0.08);
  }

  return alpha(getValueGradientColor(theme, percentage, hasData, stops), 0.14);
}
