import { alpha, type Theme } from "@mui/material/styles";

export const DEFAULT_STAT_VALUE_MIDPOINT = 0.5;
export const HOLD_RATE_VALUE_MIDPOINT = 0.7;
export const TURNOVER_RATE_VALUE_MIDPOINT = 0.35;
export const BREAK_RATE_VALUE_MIDPOINT = 0.2;
export const CLEAN_BREAK_RATE_VALUE_MIDPOINT = 0.1;

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
        parseInt(expandedHex.slice(0, 2), 16),
        parseInt(expandedHex.slice(2, 4), 16),
        parseInt(expandedHex.slice(4, 6), 16),
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

export function getValueGradientColor(
  theme: Theme,
  percentage: number,
  hasData = true,
  midpoint = DEFAULT_STAT_VALUE_MIDPOINT
): string {
  if (!hasData) {
    return alpha(theme.palette.text.primary, 0.28);
  }

  const clampedPercentage = clamp01(percentage);
  const clampedMidpoint = clamp01(midpoint);
  if (clampedPercentage <= clampedMidpoint) {
    return mixColors(
      theme.palette.error.main,
      theme.palette.warning.main,
      clampedMidpoint === 0 ? 1 : clampedPercentage / clampedMidpoint
    );
  }

  return mixColors(
    theme.palette.warning.main,
    theme.palette.success.main,
    clampedMidpoint === 1 ? 1 : (clampedPercentage - clampedMidpoint) / (1 - clampedMidpoint)
  );
}

export function getValueGradientTrackColor(
  theme: Theme,
  percentage: number,
  hasData = true,
  midpoint = DEFAULT_STAT_VALUE_MIDPOINT
): string {
  if (!hasData) {
    return alpha(theme.palette.text.primary, 0.08);
  }

  return alpha(getValueGradientColor(theme, percentage, hasData, midpoint), 0.14);
}
